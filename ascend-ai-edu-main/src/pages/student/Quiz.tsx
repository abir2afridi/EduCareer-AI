import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Brain, History, Timer, Award, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { db } from "@/lib/firebaseClient";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

type QuizAttempt = {
  id: string;
  topic: string;
  score: number;
  total: number;
  IQPoints: number;
  submittedAt: Date | null;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    selectedAnswer: string | null;
  }[];
  email?: string | null;
  displayName?: string | null;
};

const QUESTION_COUNTS = [20, 30, 40];

const extractJson = (response: string): string | null => {
  try {
    JSON.parse(response);
    return response;
  } catch (error) {
    const match = response.match(/```json([\s\S]*?)```/i) || response.match(/```([\s\S]*?)```/i);
    if (match?.[1]) {
      return match[1].trim();
    }
    const bracketStart = response.indexOf("[");
    const bracketEnd = response.lastIndexOf("]");
    if (bracketStart >= 0 && bracketEnd > bracketStart) {
      return response.slice(bracketStart, bracketEnd + 1);
    }
  }
  return null;
};

const parseQuestions = (raw: string): QuizQuestion[] => {
  const jsonString = extractJson(raw) ?? "[]";
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const options: string[] = Array.isArray(item.options) ? item.options.slice(0, 4).map(String) : [];
        if (options.length < 4) return null;

        const questionText = typeof item.question === "string" ? item.question.trim() : "";
        const correctAnswer = typeof item.correctAnswer === "string" ? item.correctAnswer.trim() : "";

        if (!questionText || !correctAnswer) return null;
        const normalizedOptions = options.map((option) => option.trim());
        const hasCorrect = normalizedOptions.some((option) => option.toLowerCase() === correctAnswer.toLowerCase());
        const finalCorrect = hasCorrect
          ? normalizedOptions.find((option) => option.toLowerCase() === correctAnswer.toLowerCase()) ?? normalizedOptions[0]
          : normalizedOptions[0];

        return {
          question: questionText,
          options: normalizedOptions,
          correctAnswer: finalCorrect,
        } satisfies QuizQuestion;
      })
      .filter((item): item is QuizQuestion => Boolean(item));
  } catch (error) {
    console.error("Failed to parse AI quiz payload", error);
    return [];
  }
};

const formatDateTime = (value: Date | null) => {
  if (!value) return "Unknown";
  try {
    return value.toLocaleString();
  } catch (error) {
    return value.toString();
  }
};

export default function QuizPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(QUESTION_COUNTS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [iqEarned, setIqEarned] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<QuizAttempt[]>([]);

  const generateButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const attemptsRef = collection(db, "quizAttempts", user.uid, "attempts");
    const attemptsQuery = query(attemptsRef, orderBy("submittedAt", "desc"));

    const unsubscribe = onSnapshot(
      attemptsQuery,
      (snapshot) => {
        const nextHistory: QuizAttempt[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData;
          return {
            id: docSnapshot.id,
            topic: typeof data.topic === "string" ? data.topic : "Unknown",
            score: typeof data.score === "number" ? data.score : 0,
            total: typeof data.total === "number" ? data.total : 0,
            IQPoints: typeof data.IQPoints === "number" ? data.IQPoints : 0,
            submittedAt: data.submittedAt?.toDate?.() ?? null,
            questions: Array.isArray(data.questions)
              ? data.questions.map((question) => ({
                  question: String(question?.question ?? ""),
                  options: Array.isArray(question?.options)
                    ? question.options.map((option: unknown) => String(option))
                    : [],
                  correctAnswer: String(question?.correctAnswer ?? ""),
                  selectedAnswer:
                    question?.selectedAnswer === null || question?.selectedAnswer === undefined
                      ? null
                      : String(question.selectedAnswer),
                }))
              : [],
            email: typeof data.email === "string" ? data.email : null,
            displayName: typeof data.displayName === "string" ? data.displayName : null,
          };
        });
        setHistory(nextHistory);
      },
      (error) => {
        console.error("Failed to load quiz history", error);
        toast({
          title: "History unavailable",
          description: "We couldn't load your previous quizzes right now.",
          variant: "destructive",
        });
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleGenerateQuiz = async () => {
    if (!user?.uid) {
      toast({ title: "Sign in required", description: "Please sign in to generate a quiz.", variant: "destructive" });
      return;
    }

    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Enter a topic to generate questions.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setShowResults(false);
    setAnswers({});
    setQuestions([]);

    try {
      const prompt = `Generate ${questionCount} multiple-choice questions about "${topic}" for undergraduate students. ` +
        `Return ONLY valid JSON array with objects each having: "question" (string), "options" (array of 4 distinct strings), ` +
        `and "correctAnswer" (exact string that matches one of the options). Do not include explanations or additional text.`;

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: prompt,
          conversationHistory: [],
        },
      });

      if (error) throw error;

      const parsed = parseQuestions(data.reply ?? "");
      if (!parsed.length) {
        throw new Error("The AI response could not be parsed into questions.");
      }

      setQuestions(parsed.slice(0, questionCount));
      toast({
        title: "Quiz ready",
        description: `Generated ${parsed.length} question${parsed.length === 1 ? "" : "s"}. Good luck!`,
      });
    } catch (error) {
      console.error("Quiz generation failed", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unable to generate questions. Please try again.",
        variant: "destructive",
      });
      setQuestions([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (index: number, option: string) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const currentResults = useMemo(() => {
    if (!showResults || !questions.length) {
      return { score: 0, iq: 0, detailed: [] as { isCorrect: boolean; correctAnswer: string; selectedAnswer: string | null }[] };
    }

    const detailed = questions.map((question, index) => {
      const selectedAnswer = answers[index] ?? null;
      const isCorrect = selectedAnswer?.toLowerCase() === question.correctAnswer.toLowerCase();
      return { isCorrect, correctAnswer: question.correctAnswer, selectedAnswer };
    });

    const totalCorrect = detailed.filter((item) => item.isCorrect).length;
    const iq = Math.round((totalCorrect / questions.length) * 100);

    return { score: totalCorrect, iq, detailed };
  }, [answers, questions, showResults]);

  const persistResults = async (totalCorrect: number, iq: number) => {
    if (!user?.uid) return;
    setIsSaving(true);

    try {
      const studentUid = user.uid;
      const historyDocRef = doc(db, "quizAttempts", studentUid);
      await setDoc(
        historyDocRef,
        {
          uid: studentUid,
          lastUpdatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const attemptsColRef = collection(historyDocRef, "attempts");
      console.log(
        "[Quiz] Persisting attempt",
        JSON.stringify({
          studentUid,
          path: `quizAttempts/${studentUid}/attempts`,
          questionTotal: questions.length,
        }),
      );
      const attemptDoc = await addDoc(attemptsColRef, {
        topic: topic.trim(),
        score: totalCorrect,
        total: questions.length,
        IQPoints: iq,
        submittedAt: serverTimestamp(),
        questions: questions.map((question, index) => ({
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          selectedAnswer: answers[index] ?? null,
        })),
        studentUid,
        email: user.email || null,
        displayName: user.displayName || null,
      });

      setHistory((prev) => [
        {
          id: attemptDoc.id,
          topic: topic.trim(),
          score: totalCorrect,
          total: questions.length,
          IQPoints: iq,
          submittedAt: new Date(),
          questions: questions.map((question, index) => ({
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            selectedAnswer: answers[index] ?? null,
          })),
          email: user.email || null,
          displayName: user.displayName || null,
        },
        ...prev,
      ]);

      toast({
        title: "Quiz submitted successfully",
        description: "Your attempt has been recorded and IQ points added.",
      });

      const studentRef = doc(db, "students", studentUid);
      await updateDoc(studentRef, {
        iqPoints: increment(iq),
        iqPointsUpdatedAt: serverTimestamp(),
      });
    } catch (error) {
      const authUid = user?.uid ?? null;
      if (error instanceof FirebaseError) {
        console.error("[Quiz] Firestore write failed", {
          authUid,
          studentUid: user?.uid ?? null,
          code: error.code,
          message: error.message,
        });
      } else {
        console.error("[Quiz] Unexpected error while saving quiz results", {
          authUid,
          studentUid: user?.uid ?? null,
          error,
        });
      }
      toast({
        title: "Save failed",
        description: "Could not record your quiz results. They will not appear in history.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!questions.length) return;

    const totalAnswered = Object.keys(answers).length;
    if (totalAnswered < questions.length) {
      toast({
        title: "Incomplete quiz",
        description: "Answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    const totalCorrect = questions.reduce((acc, question, index) => {
      const selectedAnswer = answers[index] ?? "";
      return selectedAnswer.toLowerCase() === question.correctAnswer.toLowerCase() ? acc + 1 : acc;
    }, 0);

    const iq = Math.round((totalCorrect / questions.length) * 100);
    setScore(totalCorrect);
    setIqEarned(iq);
    setShowResults(true);

    await persistResults(totalCorrect, iq);
  };

  const handleReset = () => {
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setIqEarned(0);
    if (generateButtonRef.current) {
      generateButtonRef.current.focus();
    }
  };

  const selectedCount = Object.values(answers).filter(Boolean).length;

  return (
    <Tabs defaultValue="quiz" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 bg-muted/50">
        <TabsTrigger value="quiz" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Take Quiz
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Previous Quizzes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="quiz" className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
              <Brain className="h-6 w-6 text-primary" />
              AI Quiz Generator
            </CardTitle>
            <CardDescription>
              Create tailored multiple-choice quizzes powered by our AI assistant. Choose a topic, question count, and test your knowledge.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[2fr,1fr,auto]">
            <Input
              placeholder="Enter a topic (e.g., React hooks, Quantum mechanics, Financial literacy)"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              disabled={isGenerating}
            />
            <Select
              value={String(questionCount)}
              onValueChange={(value) => setQuestionCount(Number(value))}
              disabled={isGenerating}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_COUNTS.map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count} questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              ref={generateButtonRef}
              onClick={handleGenerateQuiz}
              disabled={isGenerating}
              className="bg-gradient-primary hover:brightness-110"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <AnimatePresence>
          {questions.length > 0 ? (
            <motion.div
              key="quiz-content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <Card className="border-border/60">
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl font-semibold">Quiz Progress</CardTitle>
                    <CardDescription>
                      {selectedCount} / {questions.length} questions answered
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1 text-sm">
                      <Timer className="h-4 w-4" /> {questionCount} questions
                    </Badge>
                    {showResults && (
                      <Badge variant="secondary" className="gap-1 text-sm">
                        <Award className="h-4 w-4 text-emerald-500" /> IQ +{iqEarned}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <div className="space-y-5">
                {questions.map((question, index) => {
                  const selectedAnswer = answers[index] ?? null;
                  const isCorrect = showResults && selectedAnswer?.toLowerCase() === question.correctAnswer.toLowerCase();
                  const isWrong = showResults && !isCorrect;

                  return (
                    <motion.div
                      key={question.question}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: index * 0.02 }}
                    >
                      <Card
                        className={`border-2 transition-colors ${
                          isCorrect
                            ? "border-emerald-400/70 bg-emerald-50/40 dark:bg-emerald-950/30"
                            : isWrong
                            ? "border-rose-400/70 bg-rose-50/40 dark:bg-rose-950/30"
                            : "border-border/60"
                        }`}
                      >
                        <CardHeader>
                          <CardTitle className="text-base font-semibold">
                            Question {index + 1}
                          </CardTitle>
                          <CardDescription className="text-sm leading-relaxed text-foreground/90">
                            {question.question}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {question.options.map((option, optionIndex) => {
                            const isSelected = selectedAnswer === option;
                            const isCorrectOption = showResults && option.toLowerCase() === question.correctAnswer.toLowerCase();

                            const baseStyles = "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all";
                            const stateStyles = showResults
                              ? isCorrectOption
                                ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : isSelected
                                ? "border-rose-500/70 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                : "border-border/60"
                              : isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/40 hover:border-primary/40";

                            return (
                              <button
                                key={option}
                                type="button"
                                className={`${baseStyles} ${stateStyles}`}
                                onClick={() => handleSelectAnswer(index, option)}
                                disabled={showResults}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 font-semibold">
                                    {String.fromCharCode(65 + optionIndex)}
                                  </span>
                                  <span className="text-sm font-medium leading-snug">{option}</span>
                                </span>
                                {showResults && isCorrectOption && <Badge variant="secondary">Correct</Badge>}
                                {showResults && isWrong && isSelected && <Badge variant="destructive">Your answer</Badge>}
                              </button>
                            );
                          })}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={showResults || selectedCount !== questions.length || isSaving}
                  className="bg-gradient-primary hover:brightness-110"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving results…
                    </>
                  ) : (
                    "Submit quiz"
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start over
                </Button>
              </div>

              {showResults && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <Card className="border-emerald-500/50 bg-emerald-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl font-semibold text-emerald-600 dark:text-emerald-300">
                        <Award className="h-5 w-5" /> Quiz Results
                      </CardTitle>
                      <CardDescription className="text-foreground">
                        You answered {score} out of {questions.length} correctly. IQ points earned: {iqEarned}.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/40 p-12 text-center"
            >
              <Sparkles className="mb-4 h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">Generate your first AI quiz</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Describe a topic and choose the number of questions. Our AI will craft unique multiple-choice questions to help you revise faster.
              </p>
              <Button onClick={() => generateButtonRef.current?.focus()} className="mt-6">
                Start now
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        {history.length === 0 ? (
          <Card className="border-border/60 bg-muted/40">
            <CardHeader>
              <CardTitle>No quiz attempts yet</CardTitle>
              <CardDescription>
                Once you complete quizzes, they will appear here with scores, IQ points earned, and a detailed answer review.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ScrollArea className="max-h-[460px] rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="space-y-4">
              {history.map((attempt) => (
                <motion.div key={attempt.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-border/60">
                    <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-semibold">{attempt.topic}</CardTitle>
                        <CardDescription>
                          {formatDateTime(attempt.submittedAt)} • {attempt.questions.length} questions
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1 text-sm">
                          <Award className="h-4 w-4 text-emerald-500" /> IQ {attempt.IQPoints}
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                          Score {attempt.score}/{attempt.total}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {attempt.questions.map((question, index) => {
                        const isCorrect = question.selectedAnswer?.toLowerCase() === question.correctAnswer.toLowerCase();
                        return (
                          <div
                            key={`${attempt.id}-${index}`}
                            className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                              isCorrect
                                ? "border-emerald-500/60 bg-emerald-500/5"
                                : "border-rose-500/60 bg-rose-500/5"
                            }`}
                          >
                            <div className="font-semibold">Q{index + 1}. {question.question}</div>
                            <div className="mt-1 text-muted-foreground">
                              Your answer: {question.selectedAnswer ?? "—"}
                            </div>
                            {!isCorrect && (
                              <div className="text-emerald-600 dark:text-emerald-300">Correct answer: {question.correctAnswer}</div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </TabsContent>
    </Tabs>
  );
}
