import { useEffect, useMemo, useRef, useState } from "react";
import { collectionGroup, onSnapshot, query, type DocumentData } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
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

type MetricItem = {
  key: string;
  label: string;
  value: string;
  subLabel?: string;
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
          if (data.source === "careerGuidance") {
            return;
          }
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
  const secondaryTop = topThree.filter((entry) => entry.rank !== 1);
  const topRanked = rankedEntries[0] ?? null;
  const currentUserStanding = rankedEntries.find((entry) => entry.isCurrentUser) ?? null;

  const buildMetricItems = (entry: LeaderboardEntry): MetricItem[] => {
    const items: MetricItem[] = [
      {
        key: "performance",
        label: "Performance",
        value: `${formatPerformance(entry.performanceScore)} pts`,
        subLabel: "Overall efficiency",
      },
      {
        key: "accuracy",
        label: "Accuracy",
        value: formatPercentage(entry.accuracy),
        subLabel: entry.totalQuestions > 0 ? `${entry.totalCorrect}/${entry.totalQuestions} correct` : undefined,
      },
      {
        key: "iq",
        label: "IQ gained",
        value: entry.totalIQ.toLocaleString(),
        subLabel: "Lifetime growth",
      },
      {
        key: "quizzes",
        label: "Quizzes",
        value: `${entry.totalQuizzes} attempts`,
        subLabel: "Latest streak insights",
      },
    ];

    if (entry.avgTimePerQuestionSeconds !== null) {
      items.push({
        key: "avgTime",
        label: "Avg time / Q",
        value: formatSecondsPerQuestion(entry.avgTimePerQuestionSeconds),
        subLabel: entry.speedCorrectPerMinute ? `${formatNumber(entry.speedCorrectPerMinute)} correct/min` : undefined,
      });
    }

    return items;
  };

  return (
    <div className="space-y-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start"
      >
        <div className="space-y-4">
          <Card className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-0 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_70%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.1),transparent_60%)]" aria-hidden="true" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
            <CardHeader className="relative z-10 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex w-fit items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                    <Trophy className="h-3.5 w-3.5" /> Live Leaderboard
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
                      EduCareer Leaderboard
                    </CardTitle>
                    <CardDescription className="text-white/90">
                      Ranked performance across the cohort. Scores refresh live as students complete quizzes.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-2">
                  <SortDropdown value={sortOption} onChange={setSortOption} />
                  <Badge variant="secondary" className="gap-1 border-white/30 bg-white/20 text-white hover:bg-white/30">
                    <Zap className="h-3.5 w-3.5" /> Live updating
                  </Badge>
                </div>
              </div>

              {currentUserStanding && (
                <div className="relative z-10 flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm backdrop-blur-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="rounded-lg bg-white/20 text-white hover:bg-white/30">
                      Your rank #{currentUserStanding.rank}
                    </Badge>
                    <span className="text-sm font-semibold text-white/90">
                      Performance {formatPerformance(currentUserStanding.performanceScore)} • Accuracy {formatPercentage(currentUserStanding.accuracy)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="gap-1 border-white/30 bg-white/10 text-white/90 hover:bg-white/20">
                      <Timer className="h-3.5 w-3.5" /> {formatSecondsPerQuestion(currentUserStanding.avgTimePerQuestionSeconds)} / question
                    </Badge>
                    <Badge variant="outline" className="gap-1 border-white/30 bg-white/10 text-white/90 hover:bg-white/20">
                      <Award className="h-3.5 w-3.5" /> IQ {currentUserStanding.totalIQ}
                    </Badge>
                    <Badge variant="outline" className="gap-1 border-white/30 bg-white/10 text-white/90 hover:bg-white/20">
                      <Target className="h-3.5 w-3.5" /> {currentUserStanding.totalQuizzes} attempts
                    </Badge>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>

          {!!secondaryTop.length && (
            <div className="grid gap-4 sm:grid-cols-2">
              {secondaryTop.map((entry, index) => {
                const metricItems = buildMetricItems(entry);

                return (
                  <motion.div
                    key={entry.uid}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className="h-full"
                  >
                    <Card
                      className={cn(
                        "flex h-full flex-col justify-between border-border/50 shadow-sm transition hover:-translate-y-1 hover:shadow-md",
                        entry.rank === 2 && "border-primary/40 bg-primary/10",
                      )}
                    >
                      <CardContent className="flex h-full flex-col gap-5 px-5 py-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 text-xl">
                              {medalEmojis[entry.rank - 1] ?? <Medal className="h-6 w-6 text-muted-foreground" />}
                            </div>
                            <div className="flex flex-col">
                              <p className="text-base font-semibold text-foreground md:text-lg">{entry.displayName}</p>
                              <span className="text-[11px] text-muted-foreground">
                                {entry.subtitle ?? "Student"}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="rounded-lg bg-muted/70 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            Rank #{entry.rank}
                          </Badge>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {metricItems.map((metric) => (
                            <div
                              key={metric.key}
                              className="flex flex-col gap-1 rounded-xl border border-border/40 bg-white/70 px-3 py-2 text-left text-xs dark:bg-slate-950/40"
                            >
                              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                                {metric.label}
                              </span>
                              <span className="text-sm font-semibold text-foreground md:text-base">{metric.value}</span>
                              {metric.subLabel ? (
                                <span className="text-[11px] text-muted-foreground/80">{metric.subLabel}</span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {topRanked && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full lg:max-w-[320px] lg:justify-self-end"
          >
            <Card className="flex h-full min-h-[240px] flex-col justify-between rounded-2xl border-primary/40 bg-gradient-to-br from-primary/10 via-white to-white shadow-xl shadow-primary/25 backdrop-blur dark:from-primary/10 dark:via-slate-950/70 dark:to-slate-950/80">
              <CardHeader className="relative gap-3 pb-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary/70 dark:text-primary/60">
                    Leaderboard #1
                  </span>
                  <CardTitle className="text-xl font-semibold text-primary dark:text-primary-foreground">
                    {topRanked.displayName}
                  </CardTitle>
                  <CardDescription className="text-xs text-primary/80 dark:text-primary/70">
                    {formatPerformance(topRanked.performanceScore)} pts
                  </CardDescription>
                </div>
                <DotLottieReact
                  src="https://lottie.host/50280824-ee1d-4327-a41e-ccc084d69f88/wtWzMWmALu.lottie"
                  loop
                  autoplay
                  className="pointer-events-none absolute right-0 top-0 h-24 w-24 sm:h-28 sm:w-28"
                  style={{ transform: "translate(20%, -35%)" }}
                />
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-4 border-t border-primary/15 px-6 pb-6 pt-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Avatar className="h-11 w-11 border border-primary/30">
                    <AvatarImage src={topRanked.avatarUrl} alt={topRanked.displayName} />
                    <AvatarFallback>{topRanked.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-primary dark:text-primary/80">Leading the board</span>
                    <span>IQ {topRanked.totalIQ} • {topRanked.totalQuizzes} quizzes • Accuracy {formatPercentage(topRanked.accuracy)}</span>
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                  {buildMetricItems(topRanked).map((metric) => (
                    <div
                      key={metric.key}
                      className="flex flex-col gap-1 rounded-xl border border-primary/20 bg-white/70 px-3 py-2 dark:border-primary/30 dark:bg-slate-950/40"
                    >
                      <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-primary/80 dark:text-primary/70">
                        {metric.label}
                      </span>
                      <span className="text-sm font-semibold text-foreground md:text-base">{metric.value}</span>
                      {metric.subLabel ? (
                        <span className="text-[11px] text-muted-foreground/80">{metric.subLabel}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

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
            <div className="space-y-2">
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
                      "flex flex-col gap-2.5 rounded-2xl border border-border/60 bg-white/80 p-3 shadow-sm transition hover:-translate-y-[1.5px] hover:shadow-md dark:bg-slate-950/40 md:flex-row md:items-center md:gap-4",
                      entry.isCurrentUser && "ring-2 ring-primary/60",
                    )}
                  >
                    <div className="flex items-center gap-2 md:w-1/3">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-base font-semibold", entry.rank <= 3 ? "bg-primary/90 text-primary-foreground" : "bg-muted/60 text-foreground")}>{
                        entry.rank <= 3 ? medalEmojis[entry.rank - 1] ?? entry.rank : `#${entry.rank}`
                      }</div>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
                        <AvatarFallback>{entry.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-semibold text-foreground md:text-lg">{entry.displayName}</span>
                          {entry.rank === 1 && (
                            <DotLottieReact
                              src="https://lottie.host/4b2096f2-0382-4a16-9b2c-4851e6c4599b/YAAXIMieZp.lottie"
                              loop
                              autoplay
                              style={{ width: 44, height: 44 }}
                            />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{entry.subtitle ?? "Student"}</span>
                      </div>
                    </div>

                    <div className="grid flex-1 gap-2.5 text-sm sm:grid-cols-2 lg:grid-cols-5">
                      <div className="flex flex-col gap-1 rounded-xl border border-indigo-200/70 bg-indigo-50/80 px-3 py-2 dark:border-indigo-500/40 dark:bg-indigo-500/15">
                        <span className="whitespace-normal break-words text-center text-[8.5px] font-semibold uppercase tracking-[0.035em] leading-[11px] text-indigo-700 dark:text-indigo-200">Performance</span>
                        <span className="text-lg font-semibold text-indigo-800 dark:text-indigo-100">{formatPerformance(entry.performanceScore)}</span>
                        <span className="text-xs text-indigo-700/80 dark:text-indigo-200/80">Overall efficiency</span>
                      </div>
                      <div className="flex flex-col gap-1 rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 dark:border-emerald-500/40 dark:bg-emerald-500/15">
                        <span className="whitespace-normal break-words text-center text-[8.5px] font-semibold uppercase tracking-[0.035em] leading-[11px] text-emerald-700 dark:text-emerald-200">Accuracy</span>
                        <span className="text-lg font-semibold text-emerald-800 dark:text-emerald-100">{formatPercentage(entry.accuracy)}</span>
                        <span className="text-xs text-emerald-700/80 dark:text-emerald-200/80">{entry.totalCorrect} / {entry.totalQuestions} correct</span>
                      </div>
                      <div className="flex flex-col gap-1 rounded-xl border border-amber-200/70 bg-amber-50/80 px-3 py-2 dark:border-amber-500/40 dark:bg-amber-500/15">
                        <span className="whitespace-normal break-words text-center text-[8.5px] font-semibold uppercase tracking-[0.035em] leading-[11px] text-amber-700 dark:text-amber-200">Avg time / Q</span>
                        <span className="text-lg font-semibold text-amber-800 dark:text-amber-100">{formatSecondsPerQuestion(entry.avgTimePerQuestionSeconds)}</span>
                        <span className="text-xs text-amber-700/80 dark:text-amber-200/80">{entry.speedCorrectPerMinute ? `${formatNumber(entry.speedCorrectPerMinute)} correct/min` : "—"}</span>
                      </div>
                      <div className="flex flex-col gap-1 rounded-xl border border-purple-200/70 bg-purple-50/80 px-3 py-2 dark:border-purple-500/40 dark:bg-purple-500/15">
                        <span className="whitespace-normal break-words text-center text-[8.5px] font-semibold uppercase tracking-[0.035em] leading-[11px] text-purple-700 dark:text-purple-200">IQ gained</span>
                        <span className="text-lg font-semibold text-purple-800 dark:text-purple-100">{entry.totalIQ}</span>
                        <span className="text-xs text-purple-700/80 dark:text-purple-200/80">Lifetime growth</span>
                      </div>
                      <div className="flex flex-col gap-1 rounded-xl border border-sky-200/70 bg-sky-50/80 px-3 py-2 dark:border-sky-500/40 dark:bg-sky-500/15">
                        <span className="whitespace-normal break-words text-center text-[8.5px] font-semibold uppercase tracking-[0.035em] leading-[11px] text-sky-700 dark:text-sky-200">Quizzes attempted</span>
                        <span className="text-lg font-semibold text-sky-800 dark:text-sky-100">{entry.totalQuizzes}</span>
                        <span className="text-xs text-sky-700/80 dark:text-sky-200/80">Latest streak insights</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:w-[160px] md:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => navigate(`/students/${entry.uid}`, { state: { studentUid: entry.uid } })}
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
