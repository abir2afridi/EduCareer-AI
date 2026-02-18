import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Brain, History, Timer, Award, RefreshCw, Zap } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
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
import QuizTimerDisplay from "@/components/quiz/QuizTimerDisplay";
import { useQuizTimer } from "@/hooks/useQuizTimer";
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
  totalTimeSeconds?: number | null;
  timeTakenSeconds?: number | null;
  timeSavedSeconds?: number | null;
  completionSpeed?: number | null;
  totalTimeMinutes?: number | null;
  timeTakenMinutes?: number | null;
  timeSavedMinutes?: number | null;
};

const QUESTION_COUNTS = [20, 30, 40];

const extractJson = (response: string): string | null => {
  const cleanResponse = response.trim();

  // 1. Try parsing directly
  try {
    JSON.parse(cleanResponse);
    return cleanResponse;
  } catch (e) {
    // Continue
  }

  // 2. Try to extract JSON from code blocks
  const codeBlockMatch = cleanResponse.match(/```json([\s\S]*?)```/i) || cleanResponse.match(/```([\s\S]*?)```/i);
  if (codeBlockMatch?.[1]) {
    const content = codeBlockMatch[1].trim();
    try {
      JSON.parse(content);
      return content;
    } catch (e) {
      // Continue to try repairing this content
    }
  }

  // 3. Try to find the start of an array or object
  const arrayStart = cleanResponse.indexOf("[");
  const objectStart = cleanResponse.indexOf("{");

  let jsonStart = -1;
  if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
    jsonStart = arrayStart;
  } else if (objectStart !== -1) {
    jsonStart = objectStart;
  }

  if (jsonStart !== -1) {
    let jsonContent = cleanResponse.slice(jsonStart);

    // Try to find the last closing bracket
    const arrayEnd = jsonContent.lastIndexOf("]");
    const objectEnd = jsonContent.lastIndexOf("}");
    const jsonEnd = Math.max(arrayEnd, objectEnd);

    if (jsonEnd !== -1) {
      const truncated = jsonContent.slice(0, jsonEnd + 1);
      try {
        JSON.parse(truncated);
        return truncated;
      } catch (e) {
        // If it's an array that's truncated, try to salvage the last valid object
        if (jsonStart === arrayStart) {
          let salvaged = truncated;
          if (!salvaged.endsWith("]")) salvaged += "]";

          // Iteratively remove from the end to find a valid JSON
          try {
            JSON.parse(salvaged);
            return salvaged;
          } catch (e2) {
            // Attempt to find the last complete object in the array
            const lastClosingBrace = salvaged.lastIndexOf("}");
            if (lastClosingBrace !== -1) {
              const cleaned = salvaged.slice(0, lastClosingBrace + 1) + "]";
              try {
                JSON.parse(cleaned);
                return cleaned;
              } catch (e3) {
                // One more try: remove any trailing commas before the closing bracket
                const finalTry = cleaned.replace(/,\s*\]$/, "]");
                try {
                  JSON.parse(finalTry);
                  return finalTry;
                } catch (e4) {
                  // Fall through
                }
              }
            }
          }
        }
      }
    } else {
      // No closing bracket found at all, but we have a start. 
      // This is very truncated. Try to add one and see if it helps.
      if (jsonStart === arrayStart) {
        const lastBrace = jsonContent.lastIndexOf("}");
        if (lastBrace !== -1) {
          const salvaged = jsonContent.slice(0, lastBrace + 1) + "]";
          try {
            JSON.parse(salvaged);
            return salvaged;
          } catch (e) { /* ignore */ }
        }
      }
    }
  }

  return null;
};

const parseQuestions = (raw: string): QuizQuestion[] => {
  console.log("Raw AI response:", raw);

  const jsonString = extractJson(raw) ?? "[]";
  console.log("Extracted JSON string:", jsonString);

  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      console.error("Parsed response is not an array:", parsed);
      return [];
    }

    const validQuestions = parsed
      .map((item, index) => {
        if (!item || typeof item !== "object") {
          console.warn(`Invalid question at index ${index}:`, item);
          return null;
        }

        const options: string[] = Array.isArray(item.options) ? item.options.slice(0, 4).map(String) : [];
        if (options.length < 4) {
          console.warn(`Question at index ${index} has insufficient options:`, options);
          return null;
        }

        const questionText = typeof item.question === "string" ? item.question.trim() : "";
        const correctAnswer = typeof item.correctAnswer === "string" ? item.correctAnswer.trim() : "";

        if (!questionText || !correctAnswer) {
          console.warn(`Question at index ${index} missing text or answer:`, { questionText, correctAnswer });
          return null;
        }

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

    console.log(`Successfully parsed ${validQuestions.length} questions out of ${parsed.length} total`);
    return validQuestions;
  } catch (error) {
    console.error("Failed to parse AI quiz payload", error);
    console.error("Problematic JSON string:", jsonString);
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

const formatDuration = (seconds: number | null | undefined) => {
  if (!seconds || seconds <= 0) return "0min 00sec";
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}hr ${remainingMinutes}min ${secs.toString().padStart(2, "0")}sec`;
  }
  return `${minutes}min ${secs.toString().padStart(2, "0")}sec`;
};

const formatMinutesLabel = (minutes: number | null | undefined) => {
  if (minutes === null || minutes === undefined) return "0 mins";
  const rounded = Math.round(minutes * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded} mins` : `${rounded.toFixed(2)} mins`;
};

const formatSpeed = (speed: number | null | undefined) => {
  if (!speed || !Number.isFinite(speed)) return "0";
  const rounded = Math.round(speed * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "0%";
  const rounded = Math.round(value);
  return `${rounded}%`;
};

const formatScoreOutOfHundred = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "0 / 100";
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return `${clamped} / 100`;
};

const computeBaselineSpeed = (totalQuestions: number, totalTimeMinutes: number | null | undefined) => {
  if (!totalTimeMinutes || totalTimeMinutes <= 0) return null;
  if (totalQuestions <= 0) return null;
  return totalQuestions / totalTimeMinutes;
};

const formatMultiplier = (value: number | null | undefined) => {
  if (!value || !Number.isFinite(value)) return "×1.00";
  const rounded = Math.round(value * 100) / 100;
  return `×${rounded.toFixed(2)}`;
};

type QuizTimingSummary = {
  totalTimeSeconds: number;
  timeTakenSeconds: number;
  timeSavedSeconds: number;
  totalTimeMinutes: number;
  timeTakenMinutes: number;
  timeSavedMinutes: number;
  completionSpeed: number;
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
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [autoSubmitRequested, setAutoSubmitRequested] = useState(false);
  const [timingSummary, setTimingSummary] = useState<QuizTimingSummary | null>(null);

  const generateButtonRef = useRef<HTMLButtonElement | null>(null);

  const storageKey = useMemo(() => (user?.uid ? `quiz-timer-${user.uid}` : "quiz-timer-guest"), [user?.uid]);

  const { start: startTimer, reset: resetTimer, stop: stopTimer, remainingSeconds, totalSeconds: timerTotalSeconds, isExpired: isTimerExpired } =
    useQuizTimer({
      storageKey,
      onExpire: () => setAutoSubmitRequested(true),
    });

  const timerTotal = useMemo(() => {
    if (timerTotalSeconds > 0) return timerTotalSeconds;
    return questions.length > 0 ? questions.length * 60 : 0;
  }, [timerTotalSeconds, questions.length]);

  const timerProgressColor = useMemo(() => {
    if (!timerTotal || timerTotal <= 0) return "#2563eb";
    if (isTimerExpired) return "#ef4444";
    const ratio = remainingSeconds / timerTotal;
    if (ratio <= 0.1) return "#ef4444";
    if (ratio <= 0.25) return "#f97316";
    if (ratio <= 0.5) return "#facc15";
    return "#2563eb";
  }, [timerTotal, isTimerExpired, remainingSeconds]);

  const timerStyle = useMemo(() => ({ "--progress-color": timerProgressColor } as CSSProperties), [timerProgressColor]);

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
            totalTimeSeconds: typeof data.totalTimeSeconds === "number" ? data.totalTimeSeconds : null,
            timeTakenSeconds: typeof data.timeTakenSeconds === "number" ? data.timeTakenSeconds : null,
            timeSavedSeconds: typeof data.timeSavedSeconds === "number" ? data.timeSavedSeconds : null,
            completionSpeed: typeof data.completionSpeed === "number" ? data.completionSpeed : null,
            totalTimeMinutes: typeof data.totalTimeMinutes === "number" ? data.totalTimeMinutes : null,
            timeTakenMinutes: typeof data.timeTakenMinutes === "number" ? data.timeTakenMinutes : null,
            timeSavedMinutes: typeof data.timeSavedMinutes === "number" ? data.timeSavedMinutes : null,
          } satisfies QuizAttempt;
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
    if (questions.length > 0 && !showResults) {
      toast({
        title: "Quiz in progress",
        description: "Submit or reset the current quiz before generating a new one.",
        variant: "destructive",
      });
      return;
    }

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
    setAutoSubmitted(false);
    setAutoSubmitRequested(false);
    setTimingSummary(null);
    resetTimer();

    try {
      const prompt = `Generate ${questionCount} multiple-choice questions about "${topic}" for undergraduate students. 

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations, no code blocks, no additional text.

Format exactly like this:
[
  {
    "question": "Your question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  }
]

Requirements:
- All property names must be in double quotes
- All string values must be in double quotes
- No trailing commas
- No single quotes
- No comments or explanations
- Exactly ${questionCount} questions
- Each question must have exactly 4 distinct options
- correctAnswer must exactly match one of the options`;

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
      startTimer(questionCount * 60);
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
    if (autoSubmitted) return;
    if (isTimerExpired) return;
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

  const persistResults = useCallback(
    async (totalCorrect: number, iq: number, timing: QuizTimingSummary | null) => {
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
        const payload = {
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
          totalTimeSeconds: timing?.totalTimeSeconds ?? null,
          timeTakenSeconds: timing?.timeTakenSeconds ?? null,
          timeSavedSeconds: timing?.timeSavedSeconds ?? null,
          completionSpeed: timing?.completionSpeed ?? null,
          totalTimeMinutes: timing?.totalTimeMinutes ?? null,
          timeTakenMinutes: timing?.timeTakenMinutes ?? null,
          timeSavedMinutes: timing?.timeSavedMinutes ?? null,
        };

        const userUid = user?.uid;
        const payloadStudentUid = payload.studentUid;
        if (!userUid) {
          console.error("❌ User not authenticated! UID missing.");
        } else if (!payloadStudentUid) {
          console.error("❌ Quiz payload missing studentUid field!");
        } else if (userUid !== payloadStudentUid) {
          console.error(`❌ UID mismatch! auth.uid=${userUid}, payload.studentUid=${payloadStudentUid}`);
        } else {
          console.log("✅ UID match confirmed. Ready to submit quiz.");
        }

        console.log(
          "[Quiz] Persisting attempt",
          JSON.stringify({
            studentUid,
            path: `quizAttempts/${studentUid}/attempts`,
            questionTotal: questions.length,
          }),
        );

        const attemptDoc = await addDoc(attemptsColRef, payload);

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
            totalTimeSeconds: timing?.totalTimeSeconds ?? null,
            timeTakenSeconds: timing?.timeTakenSeconds ?? null,
            timeSavedSeconds: timing?.timeSavedSeconds ?? null,
            completionSpeed: timing?.completionSpeed ?? null,
            totalTimeMinutes: timing?.totalTimeMinutes ?? null,
            timeTakenMinutes: timing?.timeTakenMinutes ?? null,
            timeSavedMinutes: timing?.timeSavedMinutes ?? null,
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
    },
    [answers, questions, topic, toast, user],
  );

  const finalizeQuiz = useCallback(
    async (autoTriggered: boolean) => {
      if (!questions.length || showResults) return;

      const totalCorrect = questions.reduce((acc, question, index) => {
        const selectedAnswer = answers[index] ?? "";
        return selectedAnswer.toLowerCase() === question.correctAnswer.toLowerCase() ? acc + 1 : acc;
      }, 0);

      const iq = Math.round((totalCorrect / questions.length) * 100);
      const remainingBeforeSubmit = Math.max(0, remainingSeconds);

      stopTimer();

      const totalTimeSeconds = questions.length * 60;
      const timeTakenSeconds = Math.max(0, Math.min(totalTimeSeconds, totalTimeSeconds - remainingBeforeSubmit));
      const timeSavedSeconds = Math.max(0, Math.min(totalTimeSeconds, remainingBeforeSubmit));
      const completionSpeed = timeTakenSeconds > 0 ? totalCorrect / (timeTakenSeconds / 60) : totalCorrect;

      const summary: QuizTimingSummary = {
        totalTimeSeconds,
        timeTakenSeconds,
        timeSavedSeconds,
        totalTimeMinutes: totalTimeSeconds / 60,
        timeTakenMinutes: timeTakenSeconds / 60,
        timeSavedMinutes: timeSavedSeconds / 60,
        completionSpeed,
      };

      setScore(totalCorrect);
      setIqEarned(iq);
      setShowResults(true);
      setTimingSummary(summary);
      setAutoSubmitted(autoTriggered);
      setAutoSubmitRequested(false);

      await persistResults(totalCorrect, iq, summary);
    },
    [answers, persistResults, questions, remainingSeconds, showResults, stopTimer],
  );

  const handleSubmitQuiz = async () => {
    if (!questions.length) return;
    if (showResults) return;

    const totalAnswered = Object.keys(answers).length;
    if (totalAnswered < questions.length && !autoSubmitRequested) {
      toast({
        title: "Incomplete quiz",
        description: "Answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    await finalizeQuiz(false);
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
    resetTimer();
    setAutoSubmitted(false);
    setAutoSubmitRequested(false);
    setTimingSummary(null);
  };

  const selectedCount = Object.values(answers).filter(Boolean).length;
  const hasActiveQuiz = questions.length > 0 && !showResults;

  useEffect(() => {
    if (!autoSubmitRequested) return;
    if (!questions.length) return;
    if (showResults) return;

    (async () => {
      await finalizeQuiz(true);
      toast({
        title: "Time's up",
        description: "Your exam time is over! Answers have been auto-submitted.",
      });
    })();
  }, [autoSubmitRequested, finalizeQuiz, questions.length, showResults, toast]);

  return (
    <Tabs defaultValue="quiz" className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col-reverse items-center gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="space-y-2">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl font-semibold md:justify-start">
              <Brain className="h-6 w-6 text-primary" />
              AI Quiz Generator
            </CardTitle>
            <CardDescription>
              Create tailored multiple-choice quizzes powered by our AI assistant. Choose a topic, question count, and test your knowledge.
            </CardDescription>
          </div>
          <div className="w-36 shrink-0 md:w-48">
            <DotLottieReact
              src="https://lottie.host/276ac160-744b-4c2f-8c76-c0aa7e96717c/SSAStkGbEz.lottie"
              loop
              autoplay
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
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
        </CardContent>
      </Card>

      <TabsContent value="quiz" className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[2fr,1fr,auto] md:items-center">
            <Input
              placeholder="Enter a topic (e.g., React hooks, Quantum mechanics, Financial literacy)"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              disabled={isGenerating || hasActiveQuiz}
              className="w-full"
            />
            <Select
              value={String(questionCount)}
              onValueChange={(value) => setQuestionCount(Number(value))}
              disabled={isGenerating || hasActiveQuiz}
            >
              <SelectTrigger className="w-full bg-input">
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
              disabled={isGenerating || hasActiveQuiz}
              className="w-full bg-gradient-primary hover:brightness-110 md:w-auto"
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
          </div>
        </div>

        <AnimatePresence>
          {questions.length > 0 ? (
            <motion.div
              key="quiz-content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]"
            >
              <div className="space-y-6">
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
                          className={`border-2 transition-colors ${isCorrect
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
                                  disabled={showResults || autoSubmitted}
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
                    disabled={showResults || selectedCount !== questions.length || isSaving || isTimerExpired}
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
                  <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start over
                  </Button>
                </div>

                {showResults && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
                      <p className="font-semibold">Quiz submitted</p>
                      <p>You answered {score} out of {questions.length} correctly. IQ points earned: {iqEarned}.</p>
                      {autoSubmitted && (
                        <p className="mt-1 font-medium text-rose-500 dark:text-rose-300">Your exam time is over! Answers have been auto-submitted.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <aside className="space-y-4">
                <Card className="sticky top-24 w-full overflow-hidden rounded-2xl border-border/70 bg-muted/45 shadow-md text-sm">
                  <CardHeader className="space-y-3 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Quiz Summary</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        <Timer className="mr-1 h-3.5 w-3.5" /> {questionCount} questions
                      </Badge>
                    </div>
                    <QuizTimerDisplay
                      totalSeconds={timerTotal}
                      remainingSeconds={remainingSeconds}
                      isExpired={isTimerExpired}
                      style={timerStyle}
                    />
                    <div className="rounded-xl border border-dashed border-border/60 bg-background/75 p-3 shadow-inner">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {selectedCount} / {questions.length}
                      </p>
                      <p className="text-xs text-muted-foreground">questions answered</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {showResults ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Award className="h-4 w-4 text-emerald-500" /> IQ +{iqEarned}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] text-muted-foreground">
                          Answer all questions to earn IQ points
                        </Badge>
                      )}
                      {autoSubmitted && (
                        <Badge variant="destructive" className="gap-1 text-[11px]">
                          <Timer className="h-3.5 w-3.5" /> Auto-submitted
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {showResults && timingSummary && (
                    <CardContent className="space-y-3 border-t border-border/40 bg-background/70 p-3 text-[13px]">
                      <div className="space-y-1 text-muted-foreground">
                        <p className="font-semibold text-foreground">Quiz submitted</p>
                        <p>You answered {score} out of {questions.length} correctly. IQ points earned: {iqEarned}.</p>
                        {autoSubmitted && <p className="text-rose-500 dark:text-rose-300">Auto-submitted when time expired.</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 p-2.5 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-200">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600/80 dark:text-emerald-200/90">Total</p>
                          <p className="text-sm font-semibold">{formatDuration(timingSummary.totalTimeSeconds)}</p>
                        </div>
                        <div className="rounded-lg border border-sky-400/50 bg-sky-500/10 p-2.5 text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-200">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-600/80 dark:text-sky-200/90">Taken</p>
                          <p className="text-sm font-semibold">{formatDuration(timingSummary.timeTakenSeconds)}</p>
                        </div>
                        <div className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-2.5 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-200">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-600/80 dark:text-amber-200/90">Saved</p>
                          <p className="text-sm font-semibold">{formatDuration(timingSummary.timeSavedSeconds)}</p>
                        </div>
                        <div className="rounded-lg border border-purple-400/50 bg-purple-500/10 p-2.5 text-purple-700 dark:border-purple-500/60 dark:bg-purple-500/15 dark:text-purple-200">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-purple-600/80 dark:text-purple-200/90">Speed</p>
                          <p className="text-sm font-semibold">{formatSpeed(timingSummary.completionSpeed)}</p>
                          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/80">finished in {formatDuration(timingSummary.timeTakenSeconds)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-muted-foreground">
                        <span className="rounded-lg border border-border/50 bg-background/80 px-2 py-1 text-center">
                          Pace {formatSpeed(computeBaselineSpeed(questions.length, timingSummary.totalTimeMinutes))}
                        </span>
                        <span className="rounded-lg border border-border/50 bg-background/80 px-2 py-1 text-center">
                          Perf {formatMultiplier(
                            timingSummary.completionSpeed && computeBaselineSpeed(questions.length, timingSummary.totalTimeMinutes)
                              ? timingSummary.completionSpeed /
                              (computeBaselineSpeed(questions.length, timingSummary.totalTimeMinutes) ?? Number.POSITIVE_INFINITY)
                              : null,
                          )}
                        </span>
                        <span className="rounded-lg border border-border/50 bg-background/80 px-2 py-1 text-center">
                          Eff {formatPercent(
                            timingSummary.totalTimeSeconds
                              ? (timingSummary.timeSavedSeconds / timingSummary.totalTimeSeconds) * 100
                              : null,
                          )}
                        </span>
                        <span className="rounded-lg border border-border/50 bg-background/80 px-2 py-1 text-center">
                          Score {formatScoreOutOfHundred(
                            timingSummary.totalTimeSeconds
                              ? (timingSummary.timeSavedSeconds / timingSummary.totalTimeSeconds) * 100
                              : null,
                          )}
                        </span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </aside>
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
          <ScrollArea className="h-[460px] rounded-2xl border border-border/60 bg-muted/30">
            <div className="space-y-4 p-4 pr-6">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="gap-1 text-xs md:text-sm">
                          <Zap className="h-4 w-4 text-primary" /> Speed · {formatSpeed(attempt.completionSpeed)} correct/min
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs md:text-sm">
                          {formatMultiplier(
                            attempt.completionSpeed && computeBaselineSpeed(attempt.total, attempt.totalTimeMinutes)
                              ? attempt.completionSpeed /
                              (computeBaselineSpeed(attempt.total, attempt.totalTimeMinutes) ?? 1)
                              : null,
                          )} pace
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs md:text-sm">
                          {formatPercent(
                            attempt.totalTimeSeconds
                              ? ((attempt.timeSavedSeconds ?? 0) / attempt.totalTimeSeconds) * 100
                              : null,
                          )} speed
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs md:text-sm">
                          {formatScoreOutOfHundred(
                            attempt.totalTimeSeconds
                              ? ((attempt.timeSavedSeconds ?? 0) / attempt.totalTimeSeconds) * 100
                              : null,
                          )}
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs md:text-sm">
                          Finished in {formatDuration(attempt.timeTakenSeconds ?? null)}
                        </Badge>
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
                            className={`rounded-xl border px-4 py-3 text-sm transition-colors ${isCorrect
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
