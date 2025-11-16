import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileText,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-provider";
import { useCareerSurvey } from "@/hooks/useCareerSurvey";
import { useCareerDocuments } from "@/hooks/useCareerDocuments";
import { useCareerResults } from "@/hooks/useCareerResults";
import { cn } from "@/lib/utils";

const formatScore = (value: number | null | undefined): string => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return `${value}%`;
};

const formatDate = (timestamp?: unknown): string | null => {
  const date = typeof timestamp === "object" && timestamp && "toDate" in timestamp ? timestamp.toDate() : undefined;
  if (!date) return null;
  try {
    return format(date, "PPP • p");
  } catch (error) {
    console.warn("formatDate failed", error);
    return null;
  }
};

type AlignmentSource = "user" | "ai" | "aligned";
type AlignmentStatus = "aligned" | "divergent" | "no-ai";

type RankingItem = {
  label: string;
  source: AlignmentSource;
};

type RankingResult = {
  items: RankingItem[];
  status: AlignmentStatus;
  matchedLabel?: string;
  aiLabel?: string | null;
};

const normalizeLabel = (value: string): string => value.trim().toLowerCase();

const uniquePreserveOrder = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((raw) => {
    const trimmed = raw?.trim();
    if (!trimmed) return;
    const key = normalizeLabel(trimmed);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
};

const buildRanking = (userSelections: string[], aiSuggestion: string | null): RankingResult => {
  const userList = uniquePreserveOrder(userSelections).slice(0, 3);
  const aiValue = aiSuggestion?.trim();

  if (!aiValue) {
    return {
      items: userList.map((label) => ({ label, source: "user" as AlignmentSource })),
      status: "no-ai",
      aiLabel: null,
    } satisfies RankingResult;
  }

  const aiNormalized = normalizeLabel(aiValue);
  const items: RankingItem[] = [];
  const seen = new Set<string>();

  const addItem = (label: string, source: AlignmentSource) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = normalizeLabel(trimmed);
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ label: trimmed, source });
  };

  const match = userList.find((label) => normalizeLabel(label) === aiNormalized);

  if (match) {
    addItem(match, "aligned");
    userList.forEach((label) => {
      if (normalizeLabel(label) === aiNormalized) return;
      addItem(label, "user");
    });

    return {
      items: items.slice(0, 4),
      status: "aligned",
      matchedLabel: match.trim(),
      aiLabel: aiValue,
    } satisfies RankingResult;
  }

  addItem(aiValue, "ai");
  userList.forEach((label) => addItem(label, "user"));

  return {
    items: items.slice(0, 4),
    status: "divergent",
    aiLabel: aiValue,
  } satisfies RankingResult;
};

type AlignmentMeta = {
  tone: "positive" | "warning" | "neutral";
  headline: string;
  message: string;
};

const deriveAlignmentMeta = (
  ranking: RankingResult,
  options: { category: "career" | "study"; reason?: string | null },
): AlignmentMeta => {
  const categoryLabel = options.category === "career" ? "career goal" : "study track";
  const rawReason = options.reason?.trim() ?? null;
  const reason = rawReason && rawReason.length > 220 ? `${rawReason.slice(0, 220).trim()}…` : rawReason;

  if (ranking.status === "aligned") {
    const matched = ranking.matchedLabel ?? ranking.items[0]?.label ?? "";
    const headline = options.category === "career" ? "AI confirmed your top role" : "AI confirmed your top subject";
    const message = matched
      ? `${matched} stays at number one — your survey pick aligns with the AI review.`
      : `Your ${categoryLabel} list aligns perfectly with the AI review.`;
    return {
      tone: "positive",
      headline,
      message,
    } satisfies AlignmentMeta;
  }

  if (ranking.status === "divergent") {
    const aiLabel = ranking.aiLabel ?? "another option";
    const suggestionLead = options.category === "career" ? `AI suggests prioritising ${aiLabel}.` : `AI recommends focusing on ${aiLabel}.`;
    const headline = options.category === "career" ? "AI spotted a stronger fit" : "AI spotted a stronger study focus";
    const message = reason
      ? `${suggestionLead} ${reason}`
      : `${suggestionLead} Review your documents and recent quiz answers before deciding.`;
    return {
      tone: "warning",
      headline,
      message,
    } satisfies AlignmentMeta;
  }

  const headline = "Awaiting AI analysis";
  const message = `Complete the assessment to let the AI review your ${categoryLabel} preferences.`;
  return {
    tone: "neutral",
    headline,
    message,
  } satisfies AlignmentMeta;
};

export default function CareerResultsPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const { survey, isLoading: surveyLoading } = useCareerSurvey(uid);
  const { documents, isLoading: documentsLoading } = useCareerDocuments(uid);
  const {
    assessments,
    attempts,
    recommendations,
    latestAssessment,
    latestAttempt,
    latestRecommendation,
    isLoading,
  } = useCareerResults(uid);

  const careerGoals = useMemo(() => {
    if (Array.isArray(survey?.careerGoals) && survey.careerGoals.length) {
      return survey.careerGoals.map((goal) => goal.trim()).filter(Boolean);
    }
    if (Array.isArray(survey?.choices) && survey.choices.length) {
      return survey.choices.map((goal) => goal.trim()).filter(Boolean);
    }
    return [] as string[];
  }, [survey]);

  const studyTracks = useMemo(() => {
    if (!Array.isArray(survey?.studyTracks)) return [] as string[];
    return survey.studyTracks.map((track) => track.trim()).filter(Boolean);
  }, [survey]);

  const docCount = documents.length;
  const lastSurveyUpdated = survey?.updatedAt?.toDate?.();

  const topRecommendation = latestRecommendation?.recommendations?.[0] ?? null;
  const aiCareerName = topRecommendation?.careerName ?? null;
  const recommendedSubjects = topRecommendation?.recommendedSubjectsToStudy ?? [];
  const aiStudyFocus = recommendedSubjects[0] ?? null;
  const careerReason = topRecommendation?.why ?? null;
  const studyReason = recommendedSubjects.length
    ? `Latest assessment emphasised ${recommendedSubjects.slice(0, 3).join(", ")}.`
    : null;

  const overallAverageScore = useMemo(() => {
    if (!attempts.length) return null;
    const total = attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0);
    return Math.round(total / attempts.length);
  }, [attempts]);

  const bestAttempt = useMemo(() => {
    if (!attempts.length) return null;
    return [...attempts].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  }, [attempts]);

  const mostRecentAssessmentDate = latestAssessment?.createdAt?.toDate?.();
  const mostRecentAttemptDate = latestAttempt?.submittedAt?.toDate?.();

  const loading = isLoading || surveyLoading || documentsLoading;

  const careerRanking = useMemo(() => buildRanking(careerGoals, aiCareerName), [careerGoals, aiCareerName]);
  const studyRanking = useMemo(() => buildRanking(studyTracks, aiStudyFocus), [studyTracks, aiStudyFocus]);

  const careerAlignmentMeta = deriveAlignmentMeta(careerRanking, { category: "career", reason: careerReason });
  const studyAlignmentMeta = deriveAlignmentMeta(studyRanking, { category: "study", reason: studyReason });

  const toneStyles: Record<AlignmentMeta["tone"], { icon: typeof CheckCircle2; badgeClass: string; headlineClass: string }> = {
    positive: {
      icon: CheckCircle2,
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      headlineClass: "text-emerald-600 dark:text-emerald-300",
    },
    warning: {
      icon: AlertTriangle,
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
      headlineClass: "text-amber-600 dark:text-amber-300",
    },
    neutral: {
      icon: Sparkles,
      badgeClass: "bg-primary/10 text-primary",
      headlineClass: "text-primary",
    },
  };

  const sourceStyles: Record<AlignmentSource, { label: string; className: string }> = {
    aligned: {
      label: "AI + you",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    },
    ai: {
      label: "AI pick",
      className: "bg-primary/10 text-primary",
    },
    user: {
      label: "Your pick",
      className: "bg-muted text-muted-foreground",
    },
  };

  const showAlignmentCard = careerRanking.items.length > 0 || studyRanking.items.length > 0 || aiCareerName || aiStudyFocus;

  const renderAlignmentSection = (
    title: string,
    ranking: RankingResult,
    meta: AlignmentMeta,
    emptyMessage: string,
  ) => {
    const tone = toneStyles[meta.tone];
    const Icon = tone.icon;

    return (
      <div className="space-y-3 rounded-2xl border border-border/60 bg-white/70 p-4 dark:bg-slate-950/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
            <p className={cn("mt-1 text-sm font-semibold", tone.headlineClass)}>{meta.headline}</p>
            <p className="mt-1 text-sm text-muted-foreground">{meta.message}</p>
          </div>
          <div className={cn("rounded-full p-2", tone.badgeClass)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {ranking.items.length ? (
          <ol className="space-y-2 text-sm">
            {ranking.items.map((item, index) => {
              const source = sourceStyles[item.source];
              return (
                <li
                  key={`${title}-${item.label}`}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-white/80 px-3 py-2 shadow-sm dark:bg-slate-950/70"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="flex-1 text-foreground">{item.label}</span>
                  <Badge className={cn("rounded-full border border-transparent px-3", source.className)}>{source.label}</Badge>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground">{emptyMessage}</p>
        )}
      </div>
    );
  };

  const summaryItems = [
    {
      label: "Latest score",
      value: formatScore(latestAttempt?.score ?? null),
      icon: Trophy,
      hint: mostRecentAttemptDate ? `Submitted ${formatDistanceToNow(mostRecentAttemptDate, { addSuffix: true })}` : "No attempts yet",
    },
    {
      label: "Assessments taken",
      value: attempts.length.toString().padStart(2, "0"),
      icon: ClipboardList,
      hint: attempts.length ? `${assessments.length} generated quizzes` : "Run your first personalised quiz",
    },
    {
      label: "Recommendations saved",
      value: recommendations.length.toString().padStart(2, "0"),
      icon: Compass,
      hint: recommendations.length ? `${recommendations.length} AI suggestions on file` : "Complete a quiz to unlock",
    },
    {
      label: "Documents analysed",
      value: docCount.toString().padStart(2, "0"),
      icon: FileText,
      hint: docCount ? "Keeping your evidence up to date" : "Upload certificates for deeper insights",
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        <div className="grid gap-4 rounded-3xl border border-border/50 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:bg-slate-950/75 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold tracking-tight">Results & Next Steps</h1>
              <p className="text-muted-foreground">
                Review your personalised assessment history, AI recommendations, and supporting documents. Iterate on your journey or
                run a fresh quiz when you are ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> AI powered insights
              </Badge>
              <Badge variant="outline" className="rounded-full">
                Step 4 of 4
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {attempts.length ? `${attempts.length} quiz attempts` : "No attempts yet"}
              </Badge>
              {lastSurveyUpdated ? (
                <Badge variant="outline" className="rounded-full">
                  Interests updated {formatDistanceToNow(lastSurveyUpdated, { addSuffix: true })}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="gap-2 rounded-full">
                <Link to="/career-guidance/assessment">
                  <RefreshCw className="h-4 w-4" /> Run new assessment
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 rounded-full">
                <Link to="/career-guidance/documents">
                  <FileText className="h-4 w-4" /> Manage documents
                </Link>
              </Button>
            </div>
          </div>
          <Card className="border-border/60 bg-white/75 backdrop-blur-md dark:bg-slate-950/65">
            <CardHeader className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/15 p-2 text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">Your journey snapshot</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {loading ? "Syncing data..." : attempts.length ? "Progress updates as soon as you submit a quiz." : "Take an assessment to begin generating tailored recommendations."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-white/70 px-4 py-3 dark:bg-slate-950/70">
                <span className="flex items-center gap-2 text-foreground">
                  <Timer className="h-4 w-4 text-primary" /> Latest quiz
                </span>
                <span>{mostRecentAttemptDate ? formatDistanceToNow(mostRecentAttemptDate, { addSuffix: true }) : "No submissions"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-white/70 px-4 py-3 dark:bg-slate-950/70">
                <span className="flex items-center gap-2 text-foreground">
                  <ListChecks className="h-4 w-4 text-primary" /> Questions answered
                </span>
                <span>
                  {latestAttempt?.correctCount ?? 0}/{latestAttempt?.questions?.length ?? latestAssessment?.questions?.length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-white/70 px-4 py-3 dark:bg-slate-950/70">
                <span className="flex items-center gap-2 text-foreground">
                  <Compass className="h-4 w-4 text-primary" /> Recommendations
                </span>
                <span>{recommendations.length || "Awaiting insights"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay: 0.05 }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <Card key={item.label} className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.08 }}>
        <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Latest guidance
              </Badge>
              {latestRecommendation?.generatedAt?.toDate?.() ? (
                <Badge variant="outline" className="rounded-full">
                  Generated {formatDistanceToNow(latestRecommendation.generatedAt.toDate(), { addSuffix: true })}
                </Badge>
              ) : null}
            </div>
            <div>
              <CardTitle className="text-xl">Top recommendation</CardTitle>
              <CardDescription className="text-sm">
                {latestRecommendation ? "Presented below is the most recent AI suggestion. Re-run assessments to refresh." : "Complete an assessment to unlock tailored career paths."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : latestRecommendation && latestRecommendation.recommendations.length ? (
              <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
                <div className="space-y-4">
                  {latestRecommendation.recommendations.map((item, index) => (
                    <div
                      key={`${latestRecommendation.id}-${item.careerName}`}
                      className={cn(
                        "rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm transition dark:bg-slate-950/70",
                        index === 0 && "border-primary/60 bg-primary/5",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">
                            {index + 1}. {item.careerName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.why || "No reasoning provided."}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">
                          Confidence {item.confidenceScore ?? 0}%
                        </Badge>
                      </div>
                      {item.recommendedSubjectsToStudy?.length ? (
                        <div className="mt-3 rounded-xl border border-dashed border-border/60 bg-muted/15 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Suggested focus</p>
                          <p className="mt-1 text-sm text-foreground">
                            {item.recommendedSubjectsToStudy.join(", ")}
                          </p>
                        </div>
                      ) : null}
                      {item.actionPlan?.length ? (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Action plan</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {item.actionPlan.map((step, actionIndex) => (
                              <li key={`${item.careerName}-step-${actionIndex}`} className="flex items-start gap-2">
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
                <div className="space-y-4">
                  {showAlignmentCard ? (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-white/80 p-4 dark:bg-slate-950/70">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Interest alignment check</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          How the AI compared your survey selections with its latest recommendation.
                        </p>
                      </div>
                      <div className="space-y-4">
                        {renderAlignmentSection(
                          "Career focus",
                          careerRanking,
                          careerAlignmentMeta,
                          "Complete the survey to rank your career goals.",
                        )}
                        {renderAlignmentSection(
                          "Study focus",
                          studyRanking,
                          studyAlignmentMeta,
                          "Add study tracks so the AI can compare your academic plans.",
                        )}
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-border/60 bg-white/80 p-4 dark:bg-slate-950/70">
                    <p className="text-sm font-semibold text-foreground">Context captured</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Based on your interest selections, supporting documents, and quiz performance snapshot below.
                    </p>
                    <Separator className="my-3" />
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Compass className="h-4 w-4 text-primary" /> Career goals: {careerGoals.length ? careerGoals.join(", ") : "No career goals saved"}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-4 w-4 text-primary" /> Study tracks: {studyTracks.length ? studyTracks.join(", ") : "No study tracks saved"}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4 text-primary" /> Docs on file: {docCount || "None"}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <BarChart3 className="h-4 w-4 text-primary" /> Latest score: {formatScore(latestAttempt?.score ?? null)}
                      </p>
                    </div>
                  </div>
                  {latestRecommendation.flags?.length ? (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                      <p className="text-sm font-semibold text-foreground">AI flags</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {latestRecommendation.flags.map((flag) => (
                          <li key={flag}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground dark:bg-slate-950/40">
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
                No recommendations yet — complete an assessment to unlock personalised guidance.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">
          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" /> Attempt history
              </CardTitle>
              <CardDescription>Track performance across each personalised quiz attempt.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-2xl" />
                  <Skeleton className="h-10 w-full rounded-2xl" />
                  <Skeleton className="h-10 w-full rounded-2xl" />
                </div>
              ) : attempts.length ? (
                <ScrollArea className="h-[320px] pr-2">
                  <div className="space-y-3">
                    {attempts.map((attempt) => {
                      const submittedAt = attempt.submittedAt?.toDate?.();
                      const assessmentLink = assessments.find((assessment) => assessment.id === attempt.assessmentId);
                      return (
                        <div
                          key={attempt.id}
                          className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-white/80 p-4 text-sm shadow-sm transition hover:border-primary/40 dark:bg-slate-950/70"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-foreground">
                              <Trophy className="h-4 w-4 text-primary" /> {formatScore(attempt.score)}
                            </div>
                            <Badge variant="outline" className="rounded-full">
                              {submittedAt ? formatDistanceToNow(submittedAt, { addSuffix: true }) : "Pending"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              Correct: {attempt.correctCount}/{attempt.questions?.length ?? assessmentLink?.questions?.length ?? 0}
                            </span>
                            <span>Time: {attempt.timeTakenSeconds ? `${Math.round(attempt.timeTakenSeconds / 60)} min` : "--"}</span>
                            <span>Window: {attempt.totalSeconds ? `${Math.round(attempt.totalSeconds / 60)} min` : "--"}</span>
                            {assessmentLink?.documentSummary ? <span>Context: {assessmentLink.documentSummary.slice(0, 48)}...</span> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground dark:bg-slate-950/40">
                  <ClipboardList className="mx-auto mb-2 h-5 w-5 text-primary" />
                  No attempts recorded yet. Head to the assessment tab to begin.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Compass className="h-5 w-5 text-primary" /> Recommendation archive
              </CardTitle>
              <CardDescription>Recent AI guidance entries are stored here for reference.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-2xl" />
                  <Skeleton className="h-10 w-full rounded-2xl" />
                  <Skeleton className="h-10 w-full rounded-2xl" />
                </div>
              ) : recommendations.length ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  {recommendations.map((item) => {
                    const generatedAt = item.generatedAt?.toDate?.();
                    const topCareer = item.recommendations?.[0]?.careerName ?? "Untitled career";
                    return (
                      <div key={item.id} className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-950/70">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-foreground">
                          <span className="font-semibold">{topCareer}</span>
                          <Badge variant="outline" className="rounded-full">
                            {generatedAt ? formatDistanceToNow(generatedAt, { addSuffix: true }) : "Unknown"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed">
                          {item.recommendations?.[0]?.why || "AI reasoning unavailable. Regenerate for more detail."}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Confidence: {item.recommendations?.[0]?.confidenceScore ?? 0}%
                          </span>
                          {item.recommendations?.[0]?.recommendedSubjectsToStudy?.length ? (
                            <span>
                              Focus: {item.recommendations[0].recommendedSubjectsToStudy.slice(0, 3).join(", ")}
                              {item.recommendations[0].recommendedSubjectsToStudy.length > 3 ? "…" : ""}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground dark:bg-slate-950/40">
                  <Compass className="mx-auto mb-2 h-5 w-5 text-primary" />
                  Recommendations will appear here after your first submission.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.12 }}>
        <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" /> Saved interests & documents
            </CardTitle>
            <CardDescription>Check whether your profile inputs are still aligned with your goals.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-white/80 p-4 dark:bg-slate-950/70">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Career goals</p>
                    {careerGoals.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {careerGoals.map((goal) => (
                          <Badge key={goal} variant="secondary" className="rounded-full">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        You have not saved any career goals yet. Update your survey to focus the AI on relevant paths.
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Study tracks</p>
                    {studyTracks.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {studyTracks.map((track) => (
                          <Badge key={track} variant="secondary" className="rounded-full">
                            {track}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No study tracks saved yet. Add up to three academic focus areas in the survey.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-white/80 p-4 dark:bg-slate-950/70">
                <p className="text-sm font-semibold text-foreground">Latest documents</p>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {documents.slice(0, 3).map((doc) => {
                    const uploadedAt = doc.uploadedAt?.toDate?.();
                    return (
                      <div key={doc.id} className="flex flex-col rounded-xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/70">
                        <span className="text-foreground">{doc.filename}</span>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span>{doc.metadataClassification || "Unclassified"}</span>
                          <span>Confidence: {doc.docConfidence ?? "--"}%</span>
                          {uploadedAt ? <span>{formatDistanceToNow(uploadedAt, { addSuffix: true })}</span> : null}
                        </div>
                        {doc.extractedTextSnippet ? (
                          <p className="mt-2 text-xs leading-relaxed">
                            {doc.extractedTextSnippet.length > 140
                              ? `${doc.extractedTextSnippet.slice(0, 140).trim()}…`
                              : doc.extractedTextSnippet}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                  {documents.length > 3 ? (
                    <p className="text-xs text-muted-foreground">+ {documents.length - 3} more document(s) stored securely.</p>
                  ) : null}
                  {!documents.length ? <p>No academic evidence uploaded yet.</p> : null}
                </div>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground dark:bg-slate-950/60">
              <div className="flex items-center gap-2 text-foreground">
                <Brain className="h-4 w-4 text-primary" /> Tips
              </div>
              <ul className="space-y-3">
                <li>Refresh your survey choices whenever your interests shift to keep recommendations relevant.</li>
                <li>Upload high quality transcripts or certificates to improve document confidence scores.</li>
                <li>Re-run assessments after major updates to compare how your score trends over time.</li>
                <li>Share saved recommendations with mentors directly from this hub for feedback.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {bestAttempt ? (
        <motion.section initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.14 }}>
          <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-white/75 backdrop-blur-md dark:from-primary/20 dark:via-primary/10 dark:to-slate-950/70">
            <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-primary" /> Personal best snapshot
                </CardTitle>
                <CardDescription>
                  Achieved {formatScore(bestAttempt.score)} with {bestAttempt.correctCount} correct answers.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="gap-2 rounded-full">
                <Link to="/career-guidance/assessment">
                  <ArrowRight className="h-4 w-4" /> Try to beat this score
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-white/80 p-4 dark:bg-slate-950/70">
                <p className="text-sm font-semibold text-foreground">Attempt details</p>
                <div className="mt-2 space-y-1">
                  <p>Submitted: {formatDate(bestAttempt.submittedAt) ?? "Unknown"}</p>
                  <p>Time taken: {bestAttempt.timeTakenSeconds ? `${Math.round(bestAttempt.timeTakenSeconds / 60)} min` : "--"}</p>
                  <p>Assessment window: {bestAttempt.totalSeconds ? `${Math.round(bestAttempt.totalSeconds / 60)} min` : "--"}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-white/80 p-4 dark:bg-slate-950/70">
                <p className="text-sm font-semibold text-foreground">What helped</p>
                <p className="mt-2 leading-relaxed">
                  Review the action plan from your latest recommendations and keep your documents updated. You can upload new
                  achievements and re-run the AI quiz to track your growth.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Syncing the latest entries…
        </div>
      ) : null}
    </div>
  );
}
