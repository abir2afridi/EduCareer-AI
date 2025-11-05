import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { collectionGroup, onSnapshot, query, type DocumentData } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
} from "recharts";

import { db } from "@/lib/firebaseClient";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Award, BookOpen, Brain, Calendar, GraduationCap, Mail, MapPin, Phone, Shield, Target, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const formatNumber = (value: number) => (value >= 1000 ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value.toFixed(1));
const formatPerformance = (value: number) => Math.round(value).toLocaleString();
const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;

const formatSecondsPerQuestion = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} sec`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining.toFixed(0)}s`;
};

const formatDateLabel = (date: Date | null, fallback: string) => {
  if (!date) return fallback;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatFullDate = (date: Date | null) => {
  if (!date) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const formatRelativeDate = (date: Date | null) => {
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  const dayInMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.round(diffMs / dayInMs);

  if (Math.abs(diffDays) >= 7) return formatFullDate(date);
  if (diffDays === 0) return "Today";
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  const upcoming = Math.abs(diffDays);
  return `In ${upcoming} day${upcoming > 1 ? "s" : ""}`;
};

const toDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp?.toDate === "function") {
      try {
        return maybeTimestamp.toDate();
      } catch (_error) {
        return null;
      }
    }
  }
  return null;
};

type AttemptSummary = {
  id: string;
  correct: number;
  total: number;
  IQ: number;
  durationSeconds: number | null;
  createdAt: Date | null;
  accuracy: number;
  performanceScore: number;
  topic: string | null;
};

type AggregateStats = {
  totalCorrect: number;
  totalQuestions: number;
  totalIQ: number;
  totalQuizzes: number;
  totalTimeTakenSeconds: number;
  accuracy: number;
  avgTimePerQuestionSeconds: number | null;
  speedCorrectPerMinute: number | null;
  performanceScore: number;
};

const computeAggregateStats = (attempts: AttemptSummary[]): AggregateStats | null => {
  if (!attempts.length) return null;

  const totals = attempts.reduce(
    (acc, attempt) => {
      acc.totalCorrect += attempt.correct;
      acc.totalQuestions += attempt.total;
      acc.totalIQ += attempt.IQ;
      if (attempt.durationSeconds && Number.isFinite(attempt.durationSeconds)) {
        acc.totalTimeTakenSeconds += Math.max(attempt.durationSeconds, 0);
      }
      return acc;
    },
    {
      totalCorrect: 0,
      totalQuestions: 0,
      totalIQ: 0,
      totalTimeTakenSeconds: 0,
    },
  );

  const accuracy = totals.totalQuestions > 0 ? totals.totalCorrect / totals.totalQuestions : 0;
  const avgTimePerQuestionSeconds =
    totals.totalQuestions > 0 && totals.totalTimeTakenSeconds > 0
      ? totals.totalTimeTakenSeconds / totals.totalQuestions
      : null;
  const speedCorrectPerMinute =
    totals.totalTimeTakenSeconds > 0 ? totals.totalCorrect / (totals.totalTimeTakenSeconds / 60) : null;

  const normalizedSpeedFactor = avgTimePerQuestionSeconds && avgTimePerQuestionSeconds > 0 ? 60 / avgTimePerQuestionSeconds : 1;
  const performanceScore = Number.isFinite(totals.totalIQ * accuracy * normalizedSpeedFactor)
    ? totals.totalIQ * accuracy * normalizedSpeedFactor
    : 0;

  return {
    ...totals,
    totalQuizzes: attempts.length,
    accuracy,
    avgTimePerQuestionSeconds,
    speedCorrectPerMinute,
    performanceScore,
  };
};

type StatConfig = {
  label: string;
  description: string;
  accent: string;
  value: (stats: AggregateStats) => string;
  footnote?: (stats: AggregateStats) => string;
};

const STAT_CONFIG: StatConfig[] = [
  {
    label: "Performance",
    description: "Overall efficiency",
    accent: "bg-indigo-50/70 border-indigo-200/70 dark:bg-indigo-500/10 dark:border-indigo-500/30",
    value: (stats: AggregateStats) => formatPerformance(stats.performanceScore),
  },
  {
    label: "Accuracy",
    description: "Correct answers",
    accent: "bg-emerald-50/70 border-emerald-200/70 dark:bg-emerald-500/10 dark:border-emerald-500/25",
    value: (stats: AggregateStats) => formatPercentage(stats.accuracy),
    footnote: (stats: AggregateStats) => `${stats.totalCorrect} / ${stats.totalQuestions} correct`,
  },
  {
    label: "Avg time / Q",
    description: "Response speed",
    accent: "bg-amber-50/70 border-amber-200/70 dark:bg-amber-500/10 dark:border-amber-500/25",
    value: (stats: AggregateStats) => formatSecondsPerQuestion(stats.avgTimePerQuestionSeconds),
    footnote: (stats: AggregateStats) =>
      stats.speedCorrectPerMinute ? `${formatNumber(stats.speedCorrectPerMinute)} correct/min` : "—",
  },
  {
    label: "IQ gained",
    description: "Lifetime growth",
    accent: "bg-purple-50/70 border-purple-200/70 dark:bg-purple-500/10 dark:border-purple-500/25",
    value: (stats: AggregateStats) => formatNumber(stats.totalIQ),
  },
  {
    label: "Quizzes attempted",
    description: "Latest streak insights",
    accent: "bg-sky-50/70 border-sky-200/70 dark:bg-sky-500/10 dark:border-sky-500/25",
    value: (stats: AggregateStats) => stats.totalQuizzes.toString(),
  },
] as const;

export default function StudentProfilePage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const locationUid = (location.state as { studentUid?: string; uid?: string } | undefined)?.studentUid ??
    (location.state as { studentUid?: string; uid?: string } | undefined)?.uid;
  const studentUid = params.uid ?? locationUid ?? null;

  const { profile, isLoading: profileLoading } = useStudentProfile(studentUid);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState<boolean>(Boolean(studentUid));

  useEffect(() => {
    if (!studentUid) return;

    setAttemptsLoading(true);
    const attemptsQuery = query(collectionGroup(db, "attempts"));

    const unsubscribe = onSnapshot(
      attemptsQuery,
      (snapshot) => {
        const collected: AttemptSummary[] = [];

        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData;
          const uid = typeof data.studentUid === "string" ? data.studentUid : null;
          if (uid !== studentUid) {
            return;
          }
          const correct = typeof data.score === "number" ? data.score : 0;
          const total = typeof data.total === "number" ? data.total : 0;
          const IQ = typeof data.IQPoints === "number" ? data.IQPoints : 0;
          const timeTakenSeconds = typeof data.timeTakenSeconds === "number" ? data.timeTakenSeconds : null;
          const totalTimeSeconds = typeof data.totalTimeSeconds === "number" ? data.totalTimeSeconds : null;
          const topic = typeof data.topic === "string" && data.topic.trim().length ? data.topic.trim() : null;
          const durationSeconds = Number.isFinite(timeTakenSeconds) && timeTakenSeconds !== null
            ? timeTakenSeconds
            : Number.isFinite(totalTimeSeconds) && totalTimeSeconds !== null
              ? totalTimeSeconds
              : null;
          const createdAt = toDateValue(data.submittedAt ?? data.createdAt ?? data.completedAt ?? data.timestamp ?? null);

          const accuracy = total > 0 ? correct / total : 0;
          const avgTimePerQuestion = durationSeconds && total > 0 ? durationSeconds / total : null;
          const normalizedSpeedFactor = avgTimePerQuestion && avgTimePerQuestion > 0 ? 60 / avgTimePerQuestion : 1;
          const performanceScore = Number.isFinite(IQ * accuracy * normalizedSpeedFactor)
            ? IQ * accuracy * normalizedSpeedFactor
            : 0;

          collected.push({
            id: docSnapshot.id,
            correct,
            total,
            IQ,
            durationSeconds,
            createdAt,
            accuracy,
            performanceScore,
            topic,
          });
        });

        collected.sort((a, b) => {
          const aTime = a.createdAt?.getTime() ?? 0;
          const bTime = b.createdAt?.getTime() ?? 0;
          return bTime - aTime;
        });

        setAttempts(collected);
        setAttemptsLoading(false);
      },
      (error) => {
        console.error("[StudentProfile] Failed to load attempts", error);
        setAttempts([]);
        setAttemptsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [studentUid]);

  const aggregateStats = useMemo(() => computeAggregateStats(attempts), [attempts]);

  const chartData = useMemo(() => {
    return attempts
      .slice()
      .reverse()
      .slice(-12)
      .map((attempt, index, array) => ({
        label: formatDateLabel(attempt.createdAt, `Attempt ${array.length - index}`),
        accuracy: Number((attempt.accuracy * 100).toFixed(1)),
        iq: attempt.IQ,
        performance: Number(attempt.performanceScore.toFixed(1)),
      }));
  }, [attempts]);

  const latestAttempts = useMemo(() => attempts.slice(0, 8), [attempts]);

  const latestTopicInsight = useMemo(() => {
    const firstWithTopic = attempts.find((attempt) => attempt.topic && attempt.total > 0);
    if (!firstWithTopic) return null;

    return {
      topic: firstWithTopic.topic as string,
      accuracyPercent: Number((firstWithTopic.accuracy * 100).toFixed(1)),
      correct: firstWithTopic.correct,
      total: firstWithTopic.total,
      iq: firstWithTopic.IQ,
    };
  }, [attempts]);

  const topicAccuracyData = useMemo(
    () =>
      latestTopicInsight
        ? [
            {
              name: "Accuracy",
              value: Math.max(Math.min(latestTopicInsight.accuracyPercent, 100), 0),
            },
          ]
        : [],
    [latestTopicInsight],
  );

  useEffect(() => {
    if (!studentUid && !profileLoading) {
      navigate("/leaderboard");
    }
  }, [studentUid, profileLoading, navigate]);

  const pageTitle = profile?.name || profile?.email || "Student details";
  const subtitle = profile?.department || profile?.university || profile?.email || "EduCareer student";

  const academicHighlights = [
    {
      label: "Program",
      value: profile?.department ?? "—",
      icon: GraduationCap,
    },
    {
      label: "University",
      value: profile?.university ?? "—",
      icon: Award,
    },
    {
      label: "Roll number",
      value: profile?.rollNumber ?? "—",
      icon: BookOpen,
    },
    {
      label: "GPA",
      value: typeof profile?.gpa === "number" ? profile.gpa.toFixed(2) : "—",
      icon: Brain,
    },
  ];

  const contactDetails: { label: string; value: string | null | undefined; icon: LucideIcon }[] = [
    { label: "Email", value: profile?.email, icon: Mail },
    { label: "Phone", value: profile?.contactNumber, icon: Phone },
    { label: "Address", value: profile?.address, icon: MapPin },
  ];

  const timelineDetails = [
    {
      label: "Profile created",
      value: formatFullDate(toDateValue(profile?.createdAt)),
    },
    {
      label: "Last updated",
      value: formatRelativeDate(
        toDateValue(
          profile?.lastProfileUpdateAt ??
            profile?.profileChangeLastSubmissionAt ??
            profile?.profileChangeLastApprovedAt ??
            profile?.profileChangeLastRejectedAt ??
            profile?.createdAt,
        ),
      ) ?? "—",
    },
    {
      label: "Emergency contact",
      value: profile?.emergencyContact ?? "—",
    },
  ];

  const peerInsights = aggregateStats
    ? [
        {
          title: "Speed vs Accuracy",
          detail:
            aggregateStats.avgTimePerQuestionSeconds && aggregateStats.avgTimePerQuestionSeconds < 2
              ? "Consistently fast responses with high accuracy—suggest pairing for rapid study sessions."
              : "Steady pacing observed. Encouraging time-boxed drills could boost speed without sacrificing accuracy.",
        },
        {
          title: "IQ Growth",
          detail:
            aggregateStats.totalIQ > 300
              ? "High cumulative IQ gain indicates strong retention. Consider inviting them to mentor peers."
              : "There's room to grow IQ gains. Repeated revision quizzes could unlock higher deltas.",
        },
      ]
    : [];

  const isPageLoading = profileLoading || attemptsLoading;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Badge variant="outline" className="uppercase tracking-[0.35em]">Student Profile</Badge>
      </div>

      <Card className="border-border/60 bg-white/85 shadow-sm backdrop-blur dark:bg-slate-950/70">
        <CardContent className="flex flex-col gap-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.profilePictureUrl ?? undefined} alt={pageTitle} />
                <AvatarFallback>{pageTitle.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{pageTitle}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
                {profile?.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-xl bg-primary/10 px-3 py-1 text-primary">
                Cohort peer score
              </Badge>
              {aggregateStats && (
                <Badge variant="outline" className="rounded-xl px-3 py-1 text-xs uppercase tracking-[0.3em]">
                  {formatPercentage(aggregateStats.accuracy)} accuracy
                </Badge>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate("/leaderboard")}>Leaderboard</Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border border-primary/30 bg-primary/5 shadow-sm">
                <CardHeader className="pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/70">Performance</span>
                  <CardTitle className="text-2xl text-primary">
                    {aggregateStats ? formatPerformance(aggregateStats.performanceScore) : "—"}
                  </CardTitle>
                  <CardDescription>Overall efficiency</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border border-emerald-300/40 bg-emerald-100/30 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/15">
                <CardHeader className="pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-200">Accuracy</span>
                  <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-100">
                    {aggregateStats ? formatPercentage(aggregateStats.accuracy) : "—"}
                  </CardTitle>
                  <CardDescription>
                    {aggregateStats ? `${aggregateStats.totalCorrect} / ${aggregateStats.totalQuestions} correct` : "Awaiting attempts"}
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border border-sky-300/40 bg-sky-100/40 shadow-sm dark:border-sky-500/30 dark:bg-sky-500/15">
                <CardHeader className="pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-200">Quizzes</span>
                  <CardTitle className="text-2xl text-sky-700 dark:text-sky-100">
                    {aggregateStats ? aggregateStats.totalQuizzes : "—"}
                  </CardTitle>
                  <CardDescription>Latest attempts</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card className="border border-border/60 bg-muted/25 shadow-inner">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contact & timeline</CardTitle>
                <CardDescription>Details visible to authenticated peers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactDetails.map((detail) => (
                  <div key={detail.label} className="flex items-center gap-3 text-sm">
                    <detail.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{detail.label}</p>
                      <p className="font-medium text-foreground">{detail.value || "Not provided"}</p>
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                {timelineDetails.map((item) => (
                  <div key={item.label} className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.label}:</span> {item.value}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STAT_CONFIG.map((stat) => (
          <Card key={stat.label} className={cn("border border-border/50 shadow-sm", stat.accent)}>
            <CardHeader className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{stat.label}</span>
              <CardTitle className="text-2xl font-semibold">
                {isPageLoading || !aggregateStats ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  stat.value(aggregateStats)
                )}
              </CardTitle>
              <CardDescription>{stat.description}</CardDescription>
            </CardHeader>
            {stat.footnote && (
              <CardContent className="pt-0 text-xs text-muted-foreground">
                {isPageLoading || !aggregateStats ? <Skeleton className="h-4 w-20" /> : stat.footnote(aggregateStats)}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
        <div className="space-y-4">
          <Card className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-lg shadow-indigo-100/30 dark:border-sky-500/40 dark:from-slate-950/70 dark:via-slate-950/65 dark:to-slate-950/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-sky-900 dark:text-sky-100">Quiz performance trend</CardTitle>
              <CardDescription className="text-sm text-sky-700/85 dark:text-sky-200/85">
                Accuracy, IQ gain, and performance momentum across recent attempts.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative h-[240px] overflow-hidden rounded-[22px] p-0 sm:h-[290px] lg:h-[330px]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(147,197,253,0.16),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(196,181,253,0.12),transparent_60%),radial-gradient(circle_at_50%_100%,rgba(253,230,138,0.1),transparent_65%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_75%_10%,rgba(147,197,253,0.14),transparent_65%),radial-gradient(circle_at_40%_95%,rgba(244,114,182,0.15),transparent_65%)]" />
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 36, right: 28, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="iqGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.18} />
                      </linearGradient>
                      <linearGradient id="accuracyArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="iqArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="performanceArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 6" className="stroke-sky-200/70 dark:stroke-slate-700/60" />
                    <XAxis dataKey="label" stroke="currentColor" className="text-xs text-muted-foreground" tickLine={false} tickMargin={10} />
                    <YAxis yAxisId="left" stroke="currentColor" className="text-xs text-muted-foreground" tickLine={false} unit="%" tickMargin={8} />
                    <YAxis yAxisId="right" orientation="right" stroke="currentColor" className="text-xs text-muted-foreground" tickLine={false} tickMargin={8} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        borderRadius: 16,
                        border: "1px solid hsl(var(--border))",
                        boxShadow: "0 16px 40px -20px rgba(15, 23, 42, 0.4)",
                      }}
                      labelStyle={{ fontWeight: 600, color: "hsl(var(--primary))" }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: 18, fontSize: "12px", letterSpacing: "0.02em" }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="accuracy" stroke="none" fill="url(#accuracyArea)" />
                    <Area yAxisId="right" type="monotone" dataKey="iq" stroke="none" fill="url(#iqArea)" />
                    <Area yAxisId="right" type="monotone" dataKey="performance" stroke="none" fill="url(#performanceArea)" />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#2563eb"
                      strokeWidth={3.2}
                      dot={{ r: 3.8, strokeWidth: 1.8, fill: "white" }}
                      activeDot={{ r: 6.2 }}
                      name="Accuracy"
                      strokeDasharray="0"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="iq"
                      stroke="url(#iqGradient)"
                      strokeWidth={2.9}
                      dot={{ r: 3.8, strokeWidth: 1.8, fill: "white" }}
                      activeDot={{ r: 6.2 }}
                      name="IQ gained"
                    />
                    <Line
                      yAxisId="right"
                      type="natural"
                      dataKey="performance"
                      stroke="url(#performanceGradient)"
                      strokeWidth={3.4}
                      dot={{ r: 4, strokeWidth: 1.8, fill: "white" }}
                      activeDot={{ r: 6.6 }}
                      name="Performance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Timer className="h-6 w-6" />
                  <p>No quiz attempts yet to chart.</p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white/80 via-white/25 to-transparent dark:from-slate-950/80 dark:via-slate-950/25" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/60 min-h-[220px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Topic focus</CardTitle>
              <CardDescription>
                {latestTopicInsight ? `Most recent quiz: ${latestTopicInsight.topic}` : "Take a quiz to unlock topic insights."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-full items-center gap-5 p-4">
              {latestTopicInsight ? (
                <>
                  <div className="h-36 w-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        startAngle={90}
                        endAngle={450}
                        innerRadius="70%"
                        outerRadius="100%"
                        data={topicAccuracyData}
                      >
                        <defs>
                          <linearGradient id="topicAccuracyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar
                          background
                          dataKey="value"
                          cornerRadius={14}
                          fill="url(#topicAccuracyGradient)"
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {latestTopicInsight.accuracyPercent}% accuracy
                    </p>
                    <p className="text-muted-foreground">
                      {latestTopicInsight.correct} / {latestTopicInsight.total} correct answers
                    </p>
                    <p className="text-muted-foreground">IQ gain: {formatNumber(latestTopicInsight.iq)}</p>
                    <Badge variant="secondary" className="rounded-lg bg-cyan-100/60 px-2 py-0.5 text-xs text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-200">
                      Latest topic snapshot
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-4 text-sm text-muted-foreground">
                  <Shield className="h-5 w-5" />
                  <p>Complete a quiz with a topic label to generate this insight.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-slate-950/60">
            <CardHeader>
              <CardTitle>Academic snapshot</CardTitle>
              <CardDescription>Key profile details shared with peers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profileLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {academicHighlights.map((item) => (
                    <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                      <item.icon className="mt-1 h-4 w-4 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-semibold text-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {peerInsights.length > 0 && (
            <Card className="rounded-2xl border border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/60 min-h-[220px]">
              <CardHeader>
                <CardTitle>Insights for peers</CardTitle>
                <CardDescription>What fellow students should know before teaming up.</CardDescription>
              </CardHeader>
              <CardContent className="flex h-full flex-col justify-between space-y-3 p-4 text-sm">
                {peerInsights.map((insight) => (
                  <div key={insight.title} className="rounded-xl border border-border/50 bg-white/60 p-3 dark:bg-slate-950/40">
                    <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">{insight.title}</p>
                    <p className="text-muted-foreground">{insight.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-slate-950/60">
        <CardHeader>
          <CardTitle>Attempt breakdown</CardTitle>
          <CardDescription>Recent quizzes with accuracy, IQ, and completion time.</CardDescription>
        </CardHeader>
        <CardContent>
          {attemptsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : latestAttempts.length ? (
            <div className="space-y-2 text-sm">
              {latestAttempts.map((attempt, index) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: index * 0.04 }}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                      {formatDateLabel(attempt.createdAt, `Attempt ${latestAttempts.length - index}`)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">{formatPercentage(attempt.accuracy)}</p>
                      <p>
                        {attempt.correct} / {attempt.total} correct
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground">{formatNumber(attempt.IQ)}</p>
                      <p>IQ gained</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{formatSecondsPerQuestion(
                        attempt.durationSeconds && attempt.total > 0 ? attempt.durationSeconds / attempt.total : null,
                      )}</p>
                      <p>Avg time / Q</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Timer className="h-6 w-6" />
              <p>No attempts recorded for this student yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
        <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-slate-950/60">
          <CardHeader>
            <CardTitle>Performance distribution</CardTitle>
            <CardDescription>Comparative view of accuracy vs IQ per quiz.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="label" stroke="currentColor" className="text-xs text-muted-foreground" tickLine={false} />
                  <YAxis stroke="currentColor" className="text-xs text-muted-foreground" tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Accuracy (%)" />
                  <Bar dataKey="iq" fill="#22d3ee" radius={[6, 6, 0, 0]} name="IQ gained" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Timer className="h-6 w-6" />
                <p>No data yet to visualise.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-slate-950/60">
          <CardHeader>
            <CardTitle>Study pairing recommendation</CardTitle>
            <CardDescription>Suggesting matches based on strengths.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {aggregateStats ? (
              <>
                <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                  <Target className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Recommended peers</p>
                    <p className="text-muted-foreground">
                      Pair with classmates focusing on speed drills to balance high accuracy with quicker completion times.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/40 bg-white/60 p-3 text-xs text-muted-foreground dark:bg-slate-950/40">
                  {aggregateStats.speedCorrectPerMinute
                    ? `Current speed: ${formatNumber(aggregateStats.speedCorrectPerMinute)} correct/min.`
                    : "Speed data not yet available—encourage timed quizzes."}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">Quiz attempts needed to unlock pairing recommendations.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Peers can review <span className="font-medium text-foreground">{pageTitle}</span>’s progress to collaborate and share study
          strategies.
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate("/leaderboard")}>Return to leaderboard</Button>
      </div>
    </div>
  );
}
