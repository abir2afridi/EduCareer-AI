import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Brain,
  Loader2,
  Sparkles,
  FileText,
  Timer as TimerIcon,
  AlertTriangle,
  Sparkle,
  Target,
  ListChecks,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import QuizTimerDisplay from "@/components/quiz/QuizTimerDisplay";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth-provider";
import { useCareerSurvey } from "@/hooks/useCareerSurvey";
import { useCareerDocuments } from "@/hooks/useCareerDocuments";
import { useQuizTimer } from "@/hooks/useQuizTimer";
import {
  createCareerAssessment,
  saveCareerQuizAttempt,
  saveCareerRecommendation,
  type CareerAssessmentQuestion,
  type CareerRecommendation,
} from "@/lib/firebaseHelpers";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const QUIZ_LENGTH = 40;
const SECONDS_PER_QUESTION = 60;

type ParsedRecommendationPayload = {
  recommendations: CareerRecommendation[];
  flags?: string[];
};

type AssessmentGenerationPayload = {
  questions: CareerAssessmentQuestion[];
};

const extractJson = (raw: string): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch (error) {
    const codeFence = trimmed.match(/```json([\s\S]*?)```/i) || trimmed.match(/```([\s\S]*?)```/i);
    if (codeFence?.[1]) {
      const candidate = codeFence[1].trim();
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        return null;
      }
    }
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        return null;
      }
    }
    return null;
  }
};

const sanitizeQuestion = (question: unknown, index: number): CareerAssessmentQuestion | null => {
  if (!question || typeof question !== "object") return null;
  const record = question as Record<string, unknown>;
  const text = typeof record.question === "string" ? record.question.trim() : "";
  const options = Array.isArray(record.options) ? record.options.map((option) => String(option).trim()).filter(Boolean) : [];
  const correct = typeof record.correctAnswer === "string" ? record.correctAnswer.trim() : "";
  if (!text || options.length < 4) return null;
  const normalizedCorrect = options.find((option) => option.toLowerCase() === correct.toLowerCase()) ?? options[0];
  const topic = typeof record.topic === "string" ? record.topic.trim() : null;
  const difficulty = typeof record.difficulty === "string" ? record.difficulty.trim() : null;
  const id = record.id && typeof record.id === "string" ? record.id : `q-${index + 1}-${Date.now()}`;
  return {
    id,
    question: text,
    options: options.slice(0, 4),
    correctAnswer: normalizedCorrect,
    topic,
    difficulty,
  } satisfies CareerAssessmentQuestion;
};

const parseAssessmentPayload = (raw: string): AssessmentGenerationPayload | null => {
  const json = extractJson(raw);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : Array.isArray(parsed) ? (parsed as unknown[]) : [];
    const questions: CareerAssessmentQuestion[] = rawQuestions
      .map((item, index) => sanitizeQuestion(item, index))
      .filter((item): item is CareerAssessmentQuestion => Boolean(item));
    return { questions };
  } catch (error) {
    console.error("Failed to parse assessment payload", error);
    return null;
  }
};

const parseRecommendations = (raw: string): ParsedRecommendationPayload | null => {
  const json = extractJson(raw);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const items = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    const recommendations: CareerRecommendation[] = items
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const careerName = typeof record.careerName === "string" ? record.careerName.trim() : "";
        const confidenceScoreRaw = Number(record.confidenceScore);
        const why = typeof record.why === "string" ? record.why.trim() : "";
        const recommendedSubjectsToStudy = Array.isArray(record.recommendedSubjectsToStudy)
          ? record.recommendedSubjectsToStudy.map((subject) => String(subject).trim()).filter(Boolean)
          : [];
        const actionPlan = Array.isArray(record.actionPlan)
          ? record.actionPlan.map((step) => String(step).trim()).filter(Boolean)
          : [];
        if (!careerName) return null;
        const confidenceScore = Number.isFinite(confidenceScoreRaw)
          ? Math.max(0, Math.min(100, Math.round(confidenceScoreRaw)))
          : 0;
        return {
          careerName,
          confidenceScore,
          why,
          recommendedSubjectsToStudy,
          actionPlan,
        } satisfies CareerRecommendation;
      })
      .filter((item): item is CareerRecommendation => Boolean(item));
    const flags = Array.isArray(parsed.flags)
      ? parsed.flags.map((flag) => String(flag).trim()).filter(Boolean)
      : [];
    return { recommendations, flags };
  } catch (error) {
    console.error("Failed to parse recommendations payload", error);
    return null;
  }
};

export default function CareerAssessmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const uid = user?.uid ?? null;

  const { survey, isLoading: surveyLoading } = useCareerSurvey(uid);
  const {
    documents,
    isLoading: documentsLoading,
  } = useCareerDocuments(uid);

  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<CareerAssessmentQuestion[]>([]);
  const [documentSummary, setDocumentSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [autoSubmitRequested, setAutoSubmitRequested] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [recommendations, setRecommendations] = useState<CareerRecommendation[] | null>(null);
  const [recommendationFlags, setRecommendationFlags] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState<number | null>(null);
  const [timeTakenSecondsSnapshot, setTimeTakenSecondsSnapshot] = useState<number | null>(null);

  const storageKey = useMemo(() => (uid ? `career-guidance-quiz-${uid}` : "career-guidance-quiz-guest"), [uid]);
  const {
    start: startTimer,
    reset: resetTimer,
    stop: stopTimer,
    remainingSeconds,
    totalSeconds,
    timeTakenSeconds,
    isExpired: isTimerExpired,
  } = useQuizTimer({
    storageKey,
    onExpire: () => setAutoSubmitRequested(true),
  });

  const surveyChoices = survey?.choices ?? [];
  const lastUpdated = survey?.updatedAt?.toDate?.();

  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const questionCount = questions.length;
  const quizActive = questionCount > 0 && !hasSubmitted;

  const buildDocumentSummary = useCallback(() => {
    if (!documents.length) {
      return "No academic documents provided. Generate general-purpose assessment.";
    }
    const summaryBlocks = documents.slice(0, 3).map((doc) => {
      const parts: string[] = [`Filename: ${doc.filename}`];
      if (doc.metadataClassification) parts.push(`Classification: ${doc.metadataClassification}`);
      if (typeof doc.docConfidence === "number") parts.push(`Confidence: ${Math.round(doc.docConfidence)}%`);
      if (doc.extractedTextSnippet) parts.push(`Snippet: ${doc.extractedTextSnippet}`);
      if (doc.warnings && doc.warnings.length > 0) parts.push(`Warnings: ${doc.warnings.join(" | ")}`);
      return parts.join("\n");
    });
    return summaryBlocks.join("\n---\n");
  }, [documents]);

  const resetSession = useCallback(() => {
    setAssessmentId(null);
    setQuestions([]);
    setAnswers({});
    setAutoSubmitRequested(false);
    setHasSubmitted(false);
    setRecommendations(null);
    setRecommendationFlags([]);
    setScore(null);
    setCorrectCount(null);
    setTimeTakenSecondsSnapshot(null);
    resetTimer();
  }, [resetTimer]);

  const handleGenerateAssessment = useCallback(async () => {
    if (!uid) {
      toast({ title: "Sign in required", description: "Please sign in to generate the assessment.", variant: "destructive" });
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    resetSession();

    const docSummary = buildDocumentSummary();
    setDocumentSummary(docSummary);

    const choicesForPrompt = surveyChoices.length ? surveyChoices.join(", ") : "No specific preferences provided";
    const prompt = [
      "You are an academic assessment generator for a career guidance platform.",
      "Create EXACTLY 40 multiple-choice questions tailored to the student.",
      "Use the following context to personalise the assessment:",
      `Student preferences: ${choicesForPrompt}`,
      `Document analysis summary:\n${docSummary}`,
      "Include a balanced mix of foundational knowledge, applied reasoning, and subject-specific items aligned with the preferences and documents.",
      "Respond with STRICT JSON using this schema:",
      '{"questions": [ { "question": "string", "options": ["string","string","string","string"], "correctAnswer": "string", "topic": "string", "difficulty": "easy|medium|hard" } ] }',
      "Do not include explanations or additional commentary.",
    ].join("\n\n");

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: prompt,
          conversationHistory: [],
        },
      });

      if (error) throw error;

      const parsed = parseAssessmentPayload((data?.reply as string) ?? JSON.stringify(data ?? {}));
      if (!parsed || !parsed.questions.length) {
        throw new Error("The AI response could not be parsed into questions.");
      }

      const questionsToUse = parsed.questions.slice(0, QUIZ_LENGTH);
      if (questionsToUse.length < QUIZ_LENGTH) {
        toast({
          title: "Partial assessment",
          description: `Only ${questionsToUse.length} valid questions were generated. Please regenerate for a full set.`,
          variant: "destructive",
        });
      }

      const newAssessmentId = await createCareerAssessment(uid, {
        generatedByAI: true,
        sourceSurveyChoices: surveyChoices,
        documentSummary: docSummary,
        questions: questionsToUse,
      });

      setAssessmentId(newAssessmentId);
      setQuestions(questionsToUse);
      setAnswers({});
      startTimer(questionsToUse.length * SECONDS_PER_QUESTION, newAssessmentId);
      toast({
        title: "Assessment ready",
        description: `We generated ${questionsToUse.length} personalised questions. Good luck!`,
      });
    } catch (generationError) {
      console.error("Assessment generation failed", generationError);
      toast({
        title: "Generation failed",
        description:
          generationError instanceof Error
            ? generationError.message
            : "We couldn't generate the assessment. Please try again.",
        variant: "destructive",
      });
      resetSession();
    } finally {
      setIsGenerating(false);
    }
  }, [
    uid,
    isGenerating,
    resetSession,
    buildDocumentSummary,
    surveyChoices,
    toast,
    startTimer,
  ]);

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (autoSubmitted = false) => {
      if (!uid || !assessmentId) return;
      if (isSubmitting || hasSubmitted || !questions.length) return;

      setIsSubmitting(true);
      try {
        stopTimer();

        const total = questions.length;
        const correct = questions.reduce((count, question) => {
          const selected = answers[question.id];
          return count + (selected && selected === question.correctAnswer ? 1 : 0);
        }, 0);
        const scorePercentage = total > 0 ? Math.round((correct / total) * 100) : 0;

        await saveCareerQuizAttempt(uid, {
          assessmentId,
          score: scorePercentage,
          correctCount: correct,
          questions,
          answers,
          totalSeconds,
          timeTakenSeconds,
          iqPoints: Math.round(scorePercentage / 10),
          source: "careerGuidance",
        });

        const incorrectTopics = questions
          .filter((question) => answers[question.id] !== question.correctAnswer)
          .map((question) => question.topic || question.difficulty || question.question.slice(0, 48));

        const recommendationPrompt = [
          "You are an AI career counsellor.",
          "Using the student's interests, document evidence, and quiz performance, recommend the top 3 realistic career paths.",
          "Each recommendation must include: careerName, confidenceScore (0-100), why (2-3 sentences), recommendedSubjectsToStudy (array), actionPlan (3 concrete next steps).",
          "If data is insufficient, include a recommendation to seek human counselling with low confidence.",
          "Avoid impossible jumps (e.g., Medical Doctor without science background).",
          "Respond with STRICT JSON: { \"recommendations\": [...], \"flags\": [..] }.",
          "Do not include extra commentary.",
          "Context follows:",
          `Student preferences: ${surveyChoices.length ? surveyChoices.join(", ") : "No specific preferences"}`,
          `Document summary:\n${documentSummary || "No documents"}`,
          `Quiz outcome: ${scorePercentage}% (${correct}/${total} correct) in ${Math.round(timeTakenSeconds / 60)} minutes.`,
          `Topics missed or flagged: ${incorrectTopics.length ? incorrectTopics.join(", ") : "None"}.`,
        ].join("\n\n");

        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: {
            message: recommendationPrompt,
            conversationHistory: [],
          },
        });

        if (error) throw error;

        const parsed = parseRecommendations((data?.reply as string) ?? JSON.stringify(data ?? {}));
        if (!parsed || !parsed.recommendations.length) {
          throw new Error("The AI did not return valid recommendations.");
        }

        await saveCareerRecommendation(uid, {
          assessmentId,
          aiPayload: {
            surveyChoices,
            documentSummary,
            score: scorePercentage,
            correctCount: correct,
            totalQuestions: total,
            incorrectTopics,
            autoSubmitted,
          },
          recommendations: parsed.recommendations,
          flags: parsed.flags,
        });

        setRecommendations(parsed.recommendations);
        setRecommendationFlags(parsed.flags ?? []);
        setScore(scorePercentage);
        setCorrectCount(correct);
        setHasSubmitted(true);
        setTimeTakenSecondsSnapshot(timeTakenSeconds);
        toast({
          title: "Assessment submitted",
          description: "Your personalised recommendations are ready.",
        });
      } catch (submitError) {
        console.error("Assessment submission failed", submitError);
        toast({
          title: "Submission failed",
          description:
            submitError instanceof Error ? submitError.message : "We couldn't save your attempt. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      uid,
      assessmentId,
      isSubmitting,
      hasSubmitted,
      questions,
      answers,
      totalSeconds,
      timeTakenSeconds,
      surveyChoices,
      documentSummary,
      toast,
      stopTimer,
    ],
  );

  useEffect(() => {
    if (!questions.length) return;
    if (autoSubmitRequested && !hasSubmitted) {
      void handleSubmit(true);
    }
  }, [autoSubmitRequested, hasSubmitted, handleSubmit, questions.length]);

  useEffect(() => {
    if (isTimerExpired && !hasSubmitted && questions.length) {
      void handleSubmit(true);
    }
  }, [isTimerExpired, hasSubmitted, handleSubmit, questions.length]);

  const timeLabel = useMemo(() => {
    if (!timeTakenSecondsSnapshot || timeTakenSecondsSnapshot <= 0) return null;
    const minutes = Math.floor(timeTakenSecondsSnapshot / 60);
    const seconds = timeTakenSecondsSnapshot % 60;
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }, [timeTakenSecondsSnapshot]);

  const recommendationsAvailable = recommendations && recommendations.length > 0;

  return (
    <div className="space-y-8 pb-16">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        <div className="grid gap-4 rounded-3xl border border-border/50 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:bg-slate-950/75 lg:grid-cols-[1.2fr,1fr]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold tracking-tight">AI-tailored Assessment</h1>
              <p className="text-muted-foreground">
                Generate a 40-question quiz aligned with your interests and academic evidence. Finishing on time will unlock
                personalised career recommendations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> AI personalised content
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                Step 3 of 4
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {surveyChoices.length ? `${surveyChoices.length} interests selected` : "No interests selected"}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {documents.length} documents analysed
              </Badge>
              {lastUpdated ? (
                <Badge variant="outline" className="rounded-full">
                  Survey updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGenerateAssessment}
                disabled={isGenerating || surveyLoading || documentsLoading}
                className="gap-2 rounded-full"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkle className="h-4 w-4" />}
                {questions.length ? "Regenerate questions" : "Generate assessment"}
              </Button>
              {documents.length === 0 ? (
                <Alert className="ml-0 flex-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Add academic documents for better personalisation. We'll fallback to general questions meanwhile.
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          </div>
          <Card className="border-border/60 bg-white/70 backdrop-blur-md dark:bg-slate-950/60">
            <CardHeader className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/15 p-2 text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">How timing works</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  You have 60 seconds per question (40 minutes total). The attempt auto-submits when time runs out, capturing
                  your progress for recommendations.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </motion.section>

      {quizActive ? (
        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.05 }}>
          <div className="grid gap-6 xl:grid-cols-[1.15fr,1fr]">
            <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
              <CardHeader className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="rounded-full">
                    <TimerIcon className="mr-1 h-4 w-4" /> {Math.round(totalSeconds / 60)} min total
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    <ListChecks className="mr-1 h-4 w-4" /> {answeredCount}/{questionCount} answered
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    <Target className="mr-1 h-4 w-4" /> Auto-submit on timeout
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <QuizTimerDisplay totalSeconds={totalSeconds} remainingSeconds={remainingSeconds} isExpired={isTimerExpired} />
                  <div className="flex min-w-[200px] flex-1 flex-col gap-2">
                    <Progress value={questionCount > 0 ? (answeredCount / questionCount) * 100 : 0} className="h-2 rounded-full" />
                    <span className="text-xs text-muted-foreground">
                      Answer as many as you can — we capture progress even if you submit early.
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[560px] pr-4">
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm transition hover:border-primary/40 dark:bg-slate-950/70"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Question {index + 1}</p>
                            <p className="mt-1 text-base text-foreground">{question.question}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {question.topic ? (
                              <Badge variant="secondary" className="rounded-full">
                                <BookOpen className="mr-1 h-3.5 w-3.5" /> {question.topic}
                              </Badge>
                            ) : null}
                            {question.difficulty ? (
                              <Badge variant="outline" className="rounded-full">
                                {question.difficulty}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <RadioGroup
                          value={answers[question.id] ?? ""}
                          onValueChange={(value) => handleAnswer(question.id, value)}
                          className="mt-4 space-y-3"
                        >
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={option}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-white/70 px-4 py-3 text-sm text-foreground transition hover:border-primary/50 dark:bg-slate-950/70",
                                answers[question.id] === option && "border-primary bg-primary/5",
                              )}
                            >
                              <RadioGroupItem value={option} className="mt-1" />
                              <span>
                                <span className="font-semibold text-muted-foreground">{String.fromCharCode(65 + optionIndex)}.</span>{" "}
                                {option}
                              </span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Unanswered questions count toward timing but not your score. Submit whenever you are ready.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        resetSession();
                        toast({ title: "Assessment reset", description: "Generate again whenever you're ready." });
                      }}
                      disabled={isSubmitting}
                    >
                      Reset
                    </Button>
                    <Button
                      className="gap-2 rounded-full"
                      onClick={() => handleSubmit(false)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Submit assessment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="text-lg">Assessment context</CardTitle>
                <CardDescription>We keep track of the inputs used for this personalised quiz.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/70">
                  <p className="font-semibold text-foreground">Interests</p>
                  <p>{surveyChoices.length ? surveyChoices.join(", ") : "No interests selected yet."}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/70">
                  <p className="font-semibold text-foreground">Document summary</p>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {documentSummary || "No documents were referenced for this assessment."}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/70">
                  <p className="font-semibold text-foreground">Need to improve?</p>
                  <p>
                    Upload clearer documents or refine your interests before regenerating to improve the question mix and final
                    recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      ) : null}

      {hasSubmitted && recommendationsAvailable ? (
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
          <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
            <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
              <CardHeader className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                    <Sparkles className="mr-1 h-3.5 w-3.5" /> AI Recommendation Preview
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    Score {score ?? 0}% ({correctCount ?? 0}/{questionCount} correct)
                  </Badge>
                  {timeLabel ? (
                    <Badge variant="outline" className="rounded-full">
                      Completed in {timeLabel}
                    </Badge>
                  ) : null}
                </div>
                <div>
                  <CardTitle className="text-lg">Top recommendation</CardTitle>
                  <CardDescription>
                    Save or revisit this later in the results hub. You can regenerate the assessment anytime to see alternative
                    paths.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {recommendations.map((recommendation, index) => (
                    <div
                      key={recommendation.careerName}
                      className={cn(
                        "rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm transition dark:bg-slate-950/70",
                        index === 0 && "border-primary/60 bg-primary/5",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">
                            {index + 1}. {recommendation.careerName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{recommendation.why}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">
                          Confidence {recommendation.confidenceScore}%
                        </Badge>
                      </div>
                      {recommendation.recommendedSubjectsToStudy.length ? (
                        <div className="mt-3 rounded-xl border border-dashed border-border/60 bg-muted/15 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Suggested focus</p>
                          <p className="mt-1 text-sm text-foreground">
                            {recommendation.recommendedSubjectsToStudy.join(", ")}
                          </p>
                        </div>
                      ) : null}
                      {recommendation.actionPlan.length ? (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">3-step action plan</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {recommendation.actionPlan.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="text-lg">Next steps</CardTitle>
                <CardDescription>What to do with these recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/70">
                  <p className="font-semibold text-foreground">Save or iterate</p>
                  <p>Head to the upcoming results dashboard to save, request counselling, or run a fresh assessment.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/70">
                  <p className="font-semibold text-foreground">Share with mentors</p>
                  <p>Export the summary for advisors. Admins will be able to review documents + quiz before approving.</p>
                </div>
                {recommendationFlags.length ? (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <p className="font-semibold text-foreground">AI flags</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {recommendationFlags.map((flag) => (
                        <li key={flag}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/70">
                  <p className="font-semibold text-foreground">Run again later</p>
                  <p>Update your documents or survey choices anytime. Regenerating will create a new assessment record.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      ) : null}
    </div>
  );
}
