import { useEffect, useMemo, useRef, useState } from "react";
import { collectionGroup, onSnapshot, query, type DocumentData } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award, Timer, Target, Zap, Medal, Crown, ArrowUpRight, ChevronDown, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { useStudentsCollection } from "@/hooks/useStudentsCollection";
import { db } from "@/lib/firebaseClient";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const medalEmojis = ["🥇", "🥈", "🥉"];

type SortOption = "performance" | "iq" | "accuracy" | "speed";

type StudentAggregate = {
  uid: string;
  displayName: string;
  email: string | null;
  totalCorrect: number;
  totalQuestions: number;
  totalIQ: number;
  totalQuizzes: number;
  totalTimeTakenSeconds: number;
  performanceScore: number;
  accuracy: number;
  avgTimePerQuestionSeconds: number | null;
  speedCorrectPerMinute: number | null;
};

type LeaderboardEntry = StudentAggregate & {
  avatarUrl?: string;
  rank: number;
  subtitle: string | null;
  isCurrentUser: boolean;
};

const SORT_OPTIONS: { value: SortOption; label: string; description: string; icon: LucideIcon }[] = [
  {
    value: "performance",
    label: "Overall performance",
    description: "IQ × accuracy × speed",
    icon: Trophy,
  },
  {
    value: "iq",
    label: "Highest IQ gained",
    description: "Total IQ points earned",
    icon: Award,
  },
  {
    value: "accuracy",
    label: "Most correct answers",
    description: "Top correctness percentage",
    icon: Target,
  },
  {
    value: "speed",
    label: "Fastest average time",
    description: "Quickest per-question time",
    icon: Timer,
  },
];

const dropdownWrapperVariants = {
  open: {
    scaleY: 1,
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
      duration: 0.18,
      ease: "easeOut",
    },
  },
  closed: {
    scaleY: 0.8,
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.06,
      staggerDirection: -1,
      duration: 0.12,
      ease: "easeIn",
    },
  },
};

const dropdownItemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.16,
      ease: "easeOut",
    },
  },
  closed: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.12,
      ease: "easeIn",
    },
  },
};

const dropdownIconVariants = {
  open: { scale: 1, y: 0 },
  closed: { scale: 0.75, y: -6 },
};

const chevronVariants = {
  open: { rotate: 180 },
  closed: { rotate: 0 },
};

type SortDropdownProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickAway);
    }
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [open]);

  const selected = SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0];

  return (
    <div ref={containerRef} className="relative inline-flex items-stretch">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:bg-slate-950/60",
          open && "ring-2 ring-primary/50",
        )}
      >
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sort</span>
        <span className="text-sm font-semibold leading-tight">{selected.label}</span>
        <motion.span animate={open ? "open" : "closed"} variants={chevronVariants} className="text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial="closed"
            animate="open"
            exit="closed"
            variants={dropdownWrapperVariants}
            style={{ originY: "top" }}
            className="absolute top-[110%] right-0 z-20 flex min-w-[260px] flex-col gap-1 rounded-2xl border border-border/60 bg-white/95 p-2 shadow-xl backdrop-blur dark:bg-slate-950/95"
          >
            {SORT_OPTIONS.map((option) => {
              const isActive = option.value === value;
              const OptionIcon = option.icon;
              return (
                <motion.li
                  key={option.value}
                  variants={dropdownItemVariants}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary shadow-inner"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <motion.span
                    variants={dropdownIconVariants}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-muted/60",
                      isActive && "border-primary/50 bg-primary/15 text-primary",
                    )}
                  >
                    <OptionIcon className="h-4 w-4" />
                  </motion.span>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold leading-tight">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

const formatSecondsPerQuestion = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)} ms`;
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)} sec`;
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining.toFixed(0)}s`;
};

const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;
const formatNumber = (value: number) => (value >= 1000 ? value.toFixed(0) : value.toFixed(1));
const formatPerformance = (value: number) => Math.round(value).toLocaleString();

export default function LeaderboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { students } = useStudentsCollection();

  const [rawAggregates, setRawAggregates] = useState<StudentAggregate[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("performance");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const attemptsQuery = query(collectionGroup(db, "attempts"));

    const unsubscribe = onSnapshot(
      attemptsQuery,
      (snapshot) => {
        const aggregates = new Map<string, StudentAggregate>();

        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData;
          const uid = typeof data.studentUid === "string" ? data.studentUid : null;
          if (!uid) return;

          const totalCorrect = typeof data.score === "number" ? data.score : 0;
          const totalQuestions = typeof data.total === "number" ? data.total : 0;
          const iqPoints = typeof data.IQPoints === "number" ? data.IQPoints : 0;
          const timeTakenSeconds = typeof data.timeTakenSeconds === "number" ? data.timeTakenSeconds : null;
          const totalTimeSeconds = typeof data.totalTimeSeconds === "number" ? data.totalTimeSeconds : null;
          const displayName = typeof data.displayName === "string" ? data.displayName : "Anonymous";
          const email = typeof data.email === "string" ? data.email : null;

          const existing = aggregates.get(uid);
          const base: StudentAggregate =
            existing ?? {
              uid,
              displayName,
              email,
              totalCorrect: 0,
              totalQuestions: 0,
              totalIQ: 0,
              totalQuizzes: 0,
              totalTimeTakenSeconds: 0,
              performanceScore: 0,
              accuracy: 0,
              avgTimePerQuestionSeconds: null,
              speedCorrectPerMinute: null,
            };

          base.displayName = base.displayName || displayName;
          base.email = base.email || email;
          base.totalCorrect += totalCorrect;
          base.totalQuestions += totalQuestions;
          base.totalIQ += iqPoints;
          base.totalQuizzes += 1;

          if (timeTakenSeconds !== null && Number.isFinite(timeTakenSeconds)) {
            base.totalTimeTakenSeconds += Math.max(timeTakenSeconds, 0);
          } else if (totalTimeSeconds !== null && Number.isFinite(totalTimeSeconds)) {
            base.totalTimeTakenSeconds += Math.max(totalTimeSeconds, 0);
          }

          const accuracy = base.totalQuestions > 0 ? base.totalCorrect / base.totalQuestions : 0;
          const avgTime =
            base.totalQuestions > 0 && base.totalTimeTakenSeconds > 0
              ? base.totalTimeTakenSeconds / base.totalQuestions
              : null;
          const speed =
            base.totalTimeTakenSeconds > 0
              ? base.totalCorrect / (base.totalTimeTakenSeconds / 60)
              : null;

          const normalizedSpeedFactor = avgTime && avgTime > 0 ? 60 / avgTime : 1;
          const performance = base.totalIQ * accuracy * normalizedSpeedFactor;

          base.accuracy = accuracy;
          base.avgTimePerQuestionSeconds = avgTime;
          base.speedCorrectPerMinute = speed;
          base.performanceScore = Number.isFinite(performance) ? performance : 0;

          aggregates.set(uid, base);
        });

        setRawAggregates(Array.from(aggregates.values()));
        setIsLoading(false);
      },
      (error) => {
        console.error("[Leaderboard] Firestore listener error", error);
        toast({
          title: "Leaderboard unavailable",
          description: "We couldn't load leaderboard data right now.",
          variant: "destructive",
        });
        setRawAggregates([]);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [toast]);

  const studentDirectory = useMemo(() => {
    const map = new Map<string, { name: string; avatarUrl?: string; subtitle?: string }>();
    students.forEach((student) => {
      map.set(student.id, {
        name: student.name || student.email || "Anonymous",
        avatarUrl: student.profilePictureUrl || student.profilePicture || undefined,
        subtitle: student.department || student.university || null,
      });
    });
    return map;
  }, [students]);

  const rankedEntries = useMemo<LeaderboardEntry[]>(() => {
    const enriched = rawAggregates.map((entry) => {
      const directoryEntry = studentDirectory.get(entry.uid);
      const name = directoryEntry?.name || entry.displayName || "Anonymous";
      const subtitle = directoryEntry?.subtitle ?? entry.email ?? null;

      return {
        ...entry,
        displayName: name,
        subtitle,
        avatarUrl: directoryEntry?.avatarUrl,
        isCurrentUser: Boolean(user?.uid && user.uid === entry.uid),
      };
    });

    const sorter: Record<SortOption, (a: StudentAggregate, b: StudentAggregate) => number> = {
      performance: (a, b) => b.performanceScore - a.performanceScore,
      iq: (a, b) => b.totalIQ - a.totalIQ,
      accuracy: (a, b) => b.accuracy - a.accuracy,
      speed: (a, b) => {
        const aTime = a.avgTimePerQuestionSeconds ?? Number.POSITIVE_INFINITY;
        const bTime = b.avgTimePerQuestionSeconds ?? Number.POSITIVE_INFINITY;
        return aTime - bTime;
      },
    };

    const sorted = enriched
      .slice()
      .sort((a, b) => {
        const compare = sorter[sortOption](a, b);
        if (compare !== 0) return compare;
        return b.totalCorrect - a.totalCorrect;
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return sorted;
  }, [rawAggregates, sortOption, studentDirectory, user?.uid]);

  const topThree = rankedEntries.slice(0, 3);
  const currentUserStanding = rankedEntries.find((entry) => entry.isCurrentUser) ?? null;

  return (
    <div className="space-y-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                <Trophy className="h-6 w-6 text-primary" />
                EduCareer Leaderboard
              </CardTitle>
              <CardDescription>
                Ranked performance across the cohort. Scores refresh live as students complete quizzes.
              </CardDescription>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <SortDropdown value={sortOption} onChange={setSortOption} />
              <Badge variant="outline" className="gap-1 text-xs">
                <Zap className="h-3.5 w-3.5" /> Live updating
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {currentUserStanding && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="border-primary/30 bg-primary/5 text-primary-foreground">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  Your rank #{currentUserStanding.rank}
                </Badge>
                <p className="text-muted-foreground">
                  Performance score {formatPerformance(currentUserStanding.performanceScore)} • Accuracy {formatPercentage(currentUserStanding.accuracy)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 text-xs">
                  <Timer className="h-3.5 w-3.5" /> {formatSecondsPerQuestion(currentUserStanding.avgTimePerQuestionSeconds)} / question
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs">
                  <Award className="h-3.5 w-3.5" /> IQ {currentUserStanding.totalIQ}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!!topThree.length && (
        <div className="grid gap-4 md:grid-cols-3">
          {topThree.map((entry, index) => (
            <motion.div key={entry.uid} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.05 }}>
              <Card
                className={cn(
                  "border-border/50 shadow-sm transition hover:-translate-y-1 hover:shadow-md",
                  index === 0 && "border-primary/40 bg-primary/10",
                )}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-2xl">
                    {medalEmojis[index] ?? <Medal className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-foreground">
                      {entry.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Performance {formatPerformance(entry.performanceScore)}
                    </p>
                  </div>
                  <div className="ml-auto text-right text-xs text-muted-foreground">
                    <p>Accuracy {formatPercentage(entry.accuracy)}</p>
                    <p>IQ {entry.totalIQ}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Card className="border-border/60 bg-background/60">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Leaderboard standings</CardTitle>
          <CardDescription>Track the cohort across performance, speed, accuracy, and IQ growth.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Crown className="h-8 w-8 animate-pulse text-primary" />
              <p>Crunching the latest quiz data…</p>
            </div>
          ) : rankedEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
              <Trophy className="h-8 w-8" />
              <p>No quiz attempts yet. Encourage students to complete quizzes to populate the leaderboard.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {rankedEntries.map((entry) => (
                  <motion.div
                    key={entry.uid}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex flex-col gap-4 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm transition hover:-translate-y-[2px] hover:shadow-md dark:bg-slate-950/40 md:flex-row md:items-center md:gap-6",
                      entry.isCurrentUser && "ring-2 ring-primary/60",
                    )}
                  >
                    <div className="flex items-center gap-3 md:w-1/3">
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold", entry.rank <= 3 ? "bg-primary/90 text-primary-foreground" : "bg-muted/60 text-foreground")}>{
                        entry.rank <= 3 ? medalEmojis[entry.rank - 1] ?? entry.rank : `#${entry.rank}`
                      }</div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
                        <AvatarFallback>{entry.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{entry.displayName}</span>
                        <span className="text-xs text-muted-foreground">{entry.subtitle ?? "Student"}</span>
                      </div>
                    </div>

                    <div className="grid flex-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex flex-col rounded-xl border border-border/40 bg-background/60 p-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Performance</span>
                        <span className="text-lg font-semibold text-foreground">{formatPerformance(entry.performanceScore)}</span>
                        <span className="text-xs text-muted-foreground">Overall efficiency</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-border/40 bg-background/60 p-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Accuracy</span>
                        <span className="text-lg font-semibold text-foreground">{formatPercentage(entry.accuracy)}</span>
                        <span className="text-xs text-muted-foreground">{entry.totalCorrect} / {entry.totalQuestions} correct</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-border/40 bg-background/60 p-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Avg time / Q</span>
                        <span className="text-lg font-semibold text-foreground">{formatSecondsPerQuestion(entry.avgTimePerQuestionSeconds)}</span>
                        <span className="text-xs text-muted-foreground">{entry.speedCorrectPerMinute ? `${formatNumber(entry.speedCorrectPerMinute)} correct/min` : "—"}</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-border/40 bg-background/60 p-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">IQ gained</span>
                        <span className="text-lg font-semibold text-foreground">{entry.totalIQ}</span>
                        <span className="text-xs text-muted-foreground">{entry.totalQuizzes} quizzes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:w-[160px] md:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => navigate("/students", { state: { focusUid: entry.uid } })}
                      >
                        View profile <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
