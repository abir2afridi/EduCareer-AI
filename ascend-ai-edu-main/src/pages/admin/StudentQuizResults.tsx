import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { db } from "@/lib/firebaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Award, Filter, ListFilter, Search, UserCircle } from "lucide-react";

interface AttemptQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
}

interface AdminQuizAttempt {
  id: string;
  studentUid: string;
  email: string | null;
  displayName: string | null;
  topic: string;
  score: number;
  total: number;
  IQPoints: number;
  submittedAt: Date | null;
  questions: AttemptQuestion[];
}

const formatDateTime = (value: Date | null) => {
  if (!value) return "Unknown";
  try {
    return value.toLocaleString();
  } catch (error) {
    return value.toString();
  }
};

const buildAttempt = (docSnapshot: QuerySnapshot<DocumentData>["docs"][number]): AdminQuizAttempt => {
  const data = docSnapshot.data() as DocumentData;
  return {
    id: docSnapshot.id,
    studentUid: typeof data.studentUid === "string" ? data.studentUid : "",
    email: typeof data.email === "string" ? data.email : null,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    topic: typeof data.topic === "string" ? data.topic : "Unknown",
    score: typeof data.score === "number" ? data.score : 0,
    total: typeof data.total === "number" ? data.total : 0,
    IQPoints: typeof data.IQPoints === "number" ? data.IQPoints : 0,
    submittedAt: data.submittedAt?.toDate?.() ?? null,
    questions: Array.isArray(data.questions)
      ? data.questions.map((raw, index) => ({
          question: String(raw?.question ?? `Question ${index + 1}`),
          options: Array.isArray(raw?.options) ? raw.options.map((option: unknown) => String(option)) : [],
          correctAnswer: String(raw?.correctAnswer ?? ""),
          selectedAnswer:
            raw?.selectedAnswer === null || raw?.selectedAnswer === undefined ? null : String(raw.selectedAnswer),
        }))
      : [],
  };
};

export default function StudentQuizResultsPage() {
  const [attempts, setAttempts] = useState<AdminQuizAttempt[]>([]);
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedAttempt, setSelectedAttempt] = useState<AdminQuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const attemptsQuery = query(collectionGroup(db, "attempts"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(
      attemptsQuery,
      (snapshot) => {
        const nextAttempts = snapshot.docs.map(buildAttempt);
        setAttempts(nextAttempts);
        setError(null);
        setIsLoading(false);
      },
      (snapshotError) => {
        let message = "Unable to load quiz attempts.";
        if (snapshotError instanceof FirebaseError) {
          console.error("[Admin Quiz Results] Firestore listener error", {
            code: snapshotError.code,
            message: snapshotError.message,
          });
          if (snapshotError.code === "permission-denied") {
            message = "Permission denied. Ensure this account has the admin claim.";
          }
        } else {
          console.error("[Admin Quiz Results] Unexpected listener error", snapshotError);
        }
        setError(message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const studentOptions = useMemo(() => {
    const labelMap = new Map<string, string>();
    attempts.forEach((attempt) => {
      const label = attempt.displayName || attempt.email || attempt.studentUid;
      labelMap.set(attempt.studentUid, label ?? attempt.studentUid);
    });
    return Array.from(labelMap.entries()).map(([value, label]) => ({ value, label }));
  }, [attempts]);

  const topicOptions = useMemo(() => {
    const topics = new Set<string>();
    attempts.forEach((attempt) => {
      if (attempt.topic) topics.add(attempt.topic);
    });
    return Array.from(topics).sort();
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((attempt) => {
      if (studentFilter !== "all" && attempt.studentUid !== studentFilter) return false;
      if (topicFilter !== "all" && attempt.topic !== topicFilter) return false;
      if (search.trim()) {
        const haystack = `${attempt.topic} ${attempt.displayName ?? ""} ${attempt.email ?? ""}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [attempts, studentFilter, topicFilter, search]);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Award className="h-6 w-6 text-primary" /> Student Quiz Results
            </CardTitle>
            <CardDescription>
              Monitor quiz performance across all students. New attempts appear in real time.
            </CardDescription>
          </div>
          {attempts.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by student or topic"
                  className="w-64 pl-9"
                />
              </div>
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" /> All students
                    </div>
                  </SelectItem>
                  {studentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <ListFilter className="h-4 w-4" /> All topics
                    </div>
                  </SelectItem>
                  {topicOptions.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card className="border-border/60">
          <CardContent className="flex min-h-[200px] items-center justify-center text-muted-foreground">
            Loading quiz attempts…
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/60 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-6 text-destructive">
            <span className="font-semibold">{error}</span>
            <span className="text-sm text-destructive/80">
              Check the browser console for detailed error logs and ensure Firestore rules grant this user admin access.
            </span>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[620px] rounded-3xl border border-border/60 bg-muted/30 p-4">
          <AnimatePresence>
            {filteredAttempts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex h-40 flex-col items-center justify-center text-muted-foreground"
              >
                <UserCircle className="mb-2 h-10 w-10" />
                <p>No quiz attempts found for the selected filters.</p>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {filteredAttempts.map((attempt) => (
                  <motion.div key={attempt.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-border/60">
                      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg font-semibold">{attempt.topic}</CardTitle>
                          <CardDescription className="flex flex-col text-sm text-muted-foreground">
                            <span>{formatDateTime(attempt.submittedAt)}</span>
                            <span>
                              {attempt.displayName ?? "Unknown"}
                              {attempt.email ? ` • ${attempt.email}` : ""}
                              {attempt.studentUid ? ` • UID: ${attempt.studentUid}` : ""}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <Badge variant="secondary" className="gap-1 text-sm">
                            <Award className="h-4 w-4 text-emerald-500" /> IQ Points: {attempt.IQPoints}
                          </Badge>
                          <Badge variant="outline" className="text-sm">
                            Score: {attempt.score}/{attempt.total}
                          </Badge>
                          <Dialog open={selectedAttempt?.id === attempt.id} onOpenChange={(open) => setSelectedAttempt(open ? attempt : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                View details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-3xl">
                              <DialogHeader>
                                <DialogTitle className="flex flex-wrap items-center justify-between gap-2">
                                  <span>{attempt.topic}</span>
                                  <Badge variant="secondary" className="gap-1">
                                    <Award className="h-4 w-4 text-emerald-500" /> IQ {attempt.IQPoints}
                                  </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                  {attempt.displayName ?? "Unknown"}
                                  {attempt.email ? ` • ${attempt.email}` : ""} — {formatDateTime(attempt.submittedAt)}
                                  {attempt.studentUid ? ` • UID: ${attempt.studentUid}` : ""}
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh] pr-4">
                                <div className="space-y-3">
                                  {attempt.questions.length === 0 ? (
                                    <Card className="border-dashed border-border/60">
                                      <CardContent className="p-4 text-sm text-muted-foreground">
                                        No question data was recorded for this attempt.
                                      </CardContent>
                                    </Card>
                                  ) : (
                                    attempt.questions.map((question, index) => {
                                      const isCorrect = question.selectedAnswer?.toLowerCase() === question.correctAnswer.toLowerCase();
                                      return (
                                        <Card
                                          key={`${attempt.id}-dialog-${index}`}
                                          className={`border ${
                                            isCorrect
                                              ? "border-emerald-500/60 bg-emerald-500/5"
                                              : "border-rose-500/60 bg-rose-500/5"
                                          }`}
                                        >
                                          <CardHeader>
                                            <CardTitle className="text-base font-semibold">Question {index + 1}</CardTitle>
                                            <CardDescription className="text-sm text-foreground/90">
                                              {question.question}
                                            </CardDescription>
                                          </CardHeader>
                                          <CardContent className="space-y-2">
                                            {question.options.map((option, optionIndex) => {
                                              const isSelected = question.selectedAnswer === option;
                                              const isCorrectOption = option.toLowerCase() === question.correctAnswer.toLowerCase();
                                              return (
                                                <div
                                                  key={`${attempt.id}-dialog-${index}-${optionIndex}`}
                                                  className={`flex items-center justify-between rounded-xl border px-4 py-2 text-sm ${
                                                    isCorrectOption
                                                      ? "border-emerald-500/70 bg-emerald-500/10"
                                                      : isSelected
                                                      ? "border-rose-500/70 bg-rose-500/10"
                                                      : "border-border/50"
                                                  }`}
                                                >
                                                  <span>
                                                    <span className="mr-3 font-semibold">
                                                      {String.fromCharCode(65 + optionIndex)}.
                                                    </span>
                                                    {option}
                                                  </span>
                                                  {isCorrectOption && <Badge variant="secondary">Correct</Badge>}
                                                  {!isCorrectOption && isSelected && <Badge variant="destructive">Chosen</Badge>}
                                                </div>
                                              );
                                            })}
                                            {!question.selectedAnswer && (
                                              <div className="text-xs text-muted-foreground">No answer submitted.</div>
                                            )}
                                          </CardContent>
                                        </Card>
                                      );
                                    })
                                  )}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      )}
    </div>
  );
}
