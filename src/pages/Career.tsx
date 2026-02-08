import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  Sparkles,
  FileText,
  ClipboardList,
  Brain,
  CheckCircle2,
  Circle,
  CircleDashed,
  Upload,
  History,
  ListChecks,
  BookOpen,
  ShieldCheck,
  Target,
  AlertTriangle,
  GraduationCap,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useCareerSurvey } from "@/hooks/useCareerSurvey";
import { useCareerDocuments } from "@/hooks/useCareerDocuments";
import { useCareerResults } from "@/hooks/useCareerResults";
import { cn } from "@/lib/utils";

type StepState = "complete" | "current" | "upcoming";

type StepDefinition = {
  key: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  meta: string | null;
  state: StepState;
  order: number;
  locked: boolean;
};

type QuickAction = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  locked: boolean;
  disabledMessage: string;
};

const formatRelativeTime = (value: unknown): string | null => {
  if (!value || typeof value !== "object" || !("toDate" in value) || typeof value.toDate !== "function") {
    return null;
  }
  try {
    return formatDistanceToNow(value.toDate(), { addSuffix: true });
  } catch (error) {
    console.warn("formatRelativeTime failed", error);
    return null;
  }
};

export default function Career() {
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
    isLoading: resultsLoading,
  } = useCareerResults(uid);

  const surveyCompleted = Boolean(survey?.choices?.length === 3);
  const documentsUploaded = documents.length > 0;
  const assessmentAttempted = Boolean(latestAttempt);
  const recommendationReady = Boolean(latestRecommendation);

  const steps = useMemo<StepDefinition[]>(() => {
    const base = [
      {
        key: "survey",
        title: "Interest survey",
        description: "Select and rank the top three careers you want to explore.",
        href: "/career-guidance/survey",
        completed: surveyCompleted,
        meta: formatRelativeTime(survey?.updatedAt ?? survey?.createdAt),
      },
      {
        key: "documents",
        title: "Upload documents",
        description: "Add transcripts or certificates for better AI context.",
        href: "/career-guidance/documents",
        completed: documentsUploaded,
        meta: documents.length ? `${documents.length} uploaded` : null,
      },
      {
        key: "assessment",
        title: "40-question assessment",
        description: "Run the tailored MCQ quiz and record your score.",
        href: "/career-guidance/assessment",
        completed: assessmentAttempted,
        meta: latestAttempt?.submittedAt ? formatRelativeTime(latestAttempt.submittedAt) : null,
      },
      {
        key: "results",
        title: "AI recommendations",
        description: "Review personalised career matches and study plan.",
        href: "/career-guidance/results",
        completed: recommendationReady,
        meta: recommendations.length ? `${recommendations.length} saved` : null,
      },
    ];

    const firstPendingIndex = base.findIndex((step) => !step.completed);
    return base.map((step, index) => {
      let state: StepState = "upcoming";
      if (step.completed) {
        state = "complete";
      } else if (index === firstPendingIndex || firstPendingIndex === -1) {
        state = "current";
      }
      const locked = state === "upcoming" && firstPendingIndex !== -1;
      return { ...step, state, order: index + 1, locked };
    });
  }, [surveyCompleted, documentsUploaded, assessmentAttempted, recommendationReady, survey, documents, latestAttempt, recommendations]);

  const surveyChoices = survey?.choices ?? [];
  const hasSurveyChoices = surveyChoices.length > 0;
  const primaryRecommendation = latestRecommendation?.recommendations?.[0] ?? null;
  const additionalRecommendations = useMemo(
    () => (latestRecommendation?.recommendations ?? []).slice(1, 4),
    [latestRecommendation],
  );
  const recommendationFlags = useMemo(() => {
    const flagsCandidate = latestRecommendation?.flags;
    if (!Array.isArray(flagsCandidate)) return [];
    return flagsCandidate
      .map((flag) => (typeof flag === "string" ? flag.trim() : ""))
      .filter((flag): flag is string => flag.length > 0);
  }, [latestRecommendation]);
  const mostRecentDocument = documents[0] ?? null;

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        key: "survey",
        label: "Update interest survey",
        href: "/career-guidance/survey",
        icon: ClipboardList,
        locked: false,
        disabledMessage: "Always available so you can adjust your top three goals.",
      },
      {
        key: "documents",
        label: "Review uploaded documents",
        href: "/career-guidance/documents",
        icon: FileText,
        locked: !surveyCompleted,
        disabledMessage: "Complete the survey first so the AI knows what to look for in your documents.",
      },
      {
        key: "assessment",
        label: "Retake AI assessment",
        href: "/career-guidance/assessment",
        icon: History,
        locked: !surveyCompleted || !documentsUploaded,
        disabledMessage: "Finish the survey and upload documents before attempting the AI quiz.",
      },
      {
        key: "results",
        label: "Browse recommendation archive",
        href: "/career-guidance/results",
        icon: Brain,
        locked: !assessmentAttempted,
        disabledMessage: "Complete at least one AI assessment attempt to unlock recommendations.",
      },
    ], [surveyCompleted, documentsUploaded, assessmentAttempted],
  );

  const completedSteps = steps.filter((step) => step.state === "complete").length;
  const completionPercent = Math.round((completedSteps / steps.length) * 100);
  const nextStep = steps.find((step) => step.state === "current") ?? steps[steps.length - 1];

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-0 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_70%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.1),transparent_60%)]" aria-hidden="true" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
        <CardHeader className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 text-white">
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Career Guidance Assistant
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight text-white lg:text-4xl">Map your best-fit career in four guided steps</CardTitle>
              <CardDescription className="max-w-3xl text-white/90">
                Complete the survey, upload supporting documents, finish the AI-generated assessment, and unlock tailored
                recommendations with study plans.
              </CardDescription>
            </div>
          </div>
          <div className="w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-white/90">
              <span>Completion</span>
              <span className="font-semibold text-white">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="mt-2 h-2 bg-white/20 [&>div]:bg-white" />
            <p className="mt-3 text-sm text-white/90">
              {surveyLoading || documentsLoading || resultsLoading
                ? "Checking your latest progress…"
                : (
                    <>
                      Next up: <span className="font-semibold text-white">{nextStep.title}</span>
                    </>
                  )}
            </p>
            <Button 
              asChild 
              size="sm" 
              className="mt-3 w-full bg-white text-primary hover:bg-white/90" 
              disabled={surveyLoading || documentsLoading || resultsLoading}
            >
              <Link to={nextStep.href} className="flex items-center justify-center gap-2 font-medium">
                Continue <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.state === "complete" ? CheckCircle2 : step.state === "current" ? CircleDashed : Circle;
            const badgeText = step.state === "complete" ? "Completed" : step.state === "current" ? "In progress" : "Pending";
            const orderClasses = cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
              step.state === "complete"
                ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                : step.state === "current"
                  ? "border-primary/70 bg-primary/10 text-primary"
                  : "border-muted-foreground/30 text-muted-foreground",
            );
            return (
              <Card key={step.key} className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <div className={orderClasses}>{step.order}</div>
                    <div className="flex flex-1 items-start gap-3">
                      <Icon
                        className={cn(
                          "mt-0.5 h-5 w-5",
                          step.state === "complete" ? "text-emerald-500" : step.state === "current" ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                          <Badge
                            variant={step.state === "complete" ? "secondary" : "outline"}
                            className={cn("text-xs", step.state === "complete" ? "bg-emerald-500/15 text-emerald-600" : undefined)}
                          >
                            {badgeText}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.meta ? <p className="text-xs text-muted-foreground">{step.meta}</p> : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1" />
                  {step.locked ? (
                    <Button variant="outline" size="sm" className="justify-between" disabled title="Complete the previous step to unlock this stage">
                      <span>Locked until earlier steps finish</span>
                      <Lock className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant={step.state === "complete" ? "outline" : "default"}
                      size="sm"
                      className="justify-between"
                    >
                      <Link to={step.href} className="flex w-full items-center justify-between gap-2">
                        <span>{step.state === "complete" ? "Review" : "Go to step"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.02 }}>
        <div className="grid gap-4 lg:grid-cols-[1.1fr,1fr]">
          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader>
              <CardTitle className="text-lg">How the AI builds your roadmap</CardTitle>
              <CardDescription>Each stage narrows the focus so recommendations stay realistic and aligned with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Lock in your top three career goals</p>
                  <p>Start with the survey so the AI knows your 1st, 2nd, and 3rd preference. It will not recommend paths outside those guardrails.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Showcase academic proof</p>
                  <p>Upload official mark sheets, transcripts, and certificates. The AI analyses subjects, grades, and remarks to verify your strengths.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ListChecks className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Tackle the 40-question assessment</p>
                  <p>The mixed-topic MCQ quiz checks aptitude beyond documents so the system can confirm your readiness.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Cross-check before recommending</p>
                  <p>Only when all three signals agree will the AI propose fields and study tracks—preventing mismatches like forcing a BBA student into medicine.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader>
              <CardTitle className="text-lg">Document quality & subject signals</CardTitle>
              <CardDescription>Give the AI the clearest view of your academics to unlock precise study advice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Upload clear, official records</p>
                  <p>Use PDFs or scans of transcripts, report cards, certificates, or competition results. Avoid selfies or unrelated images—the AI will request replacements.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-semibold text-foreground">Flagged files lower confidence</p>
                  <p>Unreadable or off-topic documents reduce accuracy. Re-upload clean copies so your recommendations aren’t held back.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Subjects drive study prompts</p>
                  <p>The AI maps your strong subjects (e.g., biology, mathematics, business) to degree tracks like MBBS, EEE, or BBA and suggests supporting coursework.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-xs text-muted-foreground dark:bg-slate-950/70">
                {mostRecentDocument ? (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{mostRecentDocument.filename}</span>
                      {mostRecentDocument.metadataClassification ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {mostRecentDocument.metadataClassification}
                        </Badge>
                      ) : null}
                    </div>
                    <p>
                      Uploaded {formatRelativeTime(mostRecentDocument.uploadedAt) ?? "recently"}
                      {typeof mostRecentDocument.docConfidence === "number"
                        ? ` • Confidence ${mostRecentDocument.docConfidence}%`
                        : ""}
                    </p>
                  </div>
                ) : (
                  <p>No documents uploaded yet. Start with your latest marksheet so the AI can understand your baseline.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.04 }}>
        <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent documents</CardTitle>
                <CardDescription>Upload clear transcripts or certificates to improve AI accuracy.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {documentsLoading ? "Loading" : `${documents.length} item${documents.length === 1 ? "" : "s"}`}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {documentsLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Fetching your documents…</div>
              ) : documents.length ? (
                <ScrollArea className="h-[220px]">
                  <div className="space-y-3 p-4 pr-6">
                    {documents.slice(0, 6).map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm shadow-sm dark:bg-slate-950/70"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-foreground">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">{doc.filename}</span>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {doc.contentType?.split("/")[1] ?? "file"}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Uploaded {formatRelativeTime(doc.uploadedAt) ?? "recently"}
                          {typeof doc.docConfidence === "number" ? ` • Confidence ${doc.docConfidence}%` : null}
                        </div>
                        {doc.extractedTextSnippet ? (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{doc.extractedTextSnippet}</p>
                        ) : null}
                        {doc.warnings?.length ? (
                          <p className="mt-2 text-xs text-amber-600">{doc.warnings[0]}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">
                  No documents uploaded yet. Add at least one transcript or certificate to unlock richer AI insights.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t border-border/60 bg-background/60 px-5 py-3 text-sm text-muted-foreground">
              <span>{documentsUploaded ? "Update or replace documents anytime." : "Add documents to boost recommendation accuracy."}</span>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to="/career-guidance/documents">
                  <Upload className="h-4 w-4" /> Manage uploads
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader>
              <CardTitle className="text-lg">Assessment history</CardTitle>
              <CardDescription>Track quiz attempts and performance over time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resultsLoading ? (
                <p className="text-sm text-muted-foreground">Loading assessment data…</p>
              ) : assessmentAttempted ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-primary">Latest attempt</div>
                      <div className="mt-1 text-sm text-foreground">Score {latestAttempt?.score ?? 0}%</div>
                      <div className="text-xs">Submitted {formatRelativeTime(latestAttempt?.submittedAt) ?? "recently"}</div>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600">
                      {latestAttempt?.correctCount ?? 0}/{latestAttempt?.questions.length ?? 0} correct
                    </Badge>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                      <History className="h-4 w-4" /> Attempts recorded
                    </div>
                    <p className="mt-2 text-xs">
                      {attempts.length} assessment attempt{attempts.length === 1 ? "" : "s"} saved. You can retake the quiz to update your
                      recommendation.
                    </p>
                  </div>
                  {additionalRecommendations.length ? (
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm shadow-sm dark:bg-slate-950/70">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                        <Target className="h-4 w-4" /> Other strong matches
                      </div>
                      <ul className="mt-3 space-y-2 text-xs">
                        {additionalRecommendations.map((item, index) => (
                          <li
                            key={`${item.careerName ?? "career"}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-2 text-foreground"
                          >
                            <span>{item.careerName}</span>
                            {typeof item.confidenceScore === "number" ? (
                              <Badge variant="outline" className="border-primary/40 text-xs text-primary">
                                {item.confidenceScore}% confidence
                              </Badge>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {recommendationFlags.length ? (
                    <div className="rounded-2xl border border-amber-400/60 bg-amber-100/40 p-4 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                      <div className="flex items-center gap-2 font-semibold uppercase tracking-wide">
                        <AlertTriangle className="h-4 w-4" /> Review notes from the AI
                      </div>
                      <ul className="mt-2 space-y-1 list-disc pl-5">
                        {recommendationFlags.map((flag, index) => (
                          <li key={`${flag}-${index}`}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You have not taken the AI-generated assessment yet. Complete the survey and upload your documents to unlock the quiz.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t border-border/60 bg-background/60 px-5 py-3 text-sm text-muted-foreground">
              <span>{assessments.length ? `${assessments.length} assessment version${assessments.length === 1 ? "" : "s"} found.` : "Create your first assessment to begin."}</span>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to="/career-guidance/assessment">
                  <ClipboardList className="h-4 w-4" /> Start quiz
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.08 }}>
        <div className="grid gap-4 xl:grid-cols-[1.35fr,1fr]">
          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Latest AI recommendation</CardTitle>
                <CardDescription>Review the personalised path suggested by the guidance engine.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {recommendationReady ? "Available" : "Pending"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendationReady && primaryRecommendation ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm shadow-sm dark:bg-slate-950/70">
                    <div className="flex flex-wrap items-center gap-2 text-foreground">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-base font-semibold">{primaryRecommendation.careerName ?? "Career match"}</span>
                      {typeof primaryRecommendation.confidenceScore === "number" ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {primaryRecommendation.confidenceScore}% confidence
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {primaryRecommendation.why ?? "Your assessment results unlocked a tailored recommendation."}
                    </p>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm shadow-sm dark:bg-slate-950/70">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                        <ListChecks className="h-4 w-4" /> Study focus
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                        {primaryRecommendation.recommendedSubjectsToStudy?.length ? (
                          primaryRecommendation.recommendedSubjectsToStudy.slice(0, 4).map((subject) => (
                            <li key={subject}>{subject}</li>
                          ))
                        ) : (
                          <li>Review foundational subjects and schedule a counselling session.</li>
                        )}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm shadow-sm dark:bg-slate-950/70">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                        <BookOpen className="h-4 w-4" /> Action plan
                      </div>
                      <ul className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                        {primaryRecommendation.actionPlan?.length ? (
                          primaryRecommendation.actionPlan.slice(0, 3).map((step, index) => (
                            <li key={`${step}-${index}`}>{step}</li>
                          ))
                        ) : (
                          <li>Meet your mentor to plan the next set of learning sprints.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete the survey, document upload, and assessment steps to generate your personalised recommendation.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t border-border/60 bg-background/60 px-5 py-3 text-sm text-muted-foreground">
              <span>
                {recommendationReady
                  ? `Generated ${formatRelativeTime(latestRecommendation?.generatedAt) ?? "recently"}.`
                  : "Finish prior steps to unlock your recommendation."}
              </span>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to="/career-guidance/results">
                  <Brain className="h-4 w-4" /> View full results
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle className="text-lg">Quick actions</CardTitle>
              <CardDescription>Jump directly to a task or revisit saved recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4 dark:bg-slate-950/70">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                  <ClipboardList className="h-4 w-4" /> Current priorities
                </div>
                {hasSurveyChoices ? (
                  <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {surveyChoices.map((choice, index) => (
                      <li key={`${choice}-${index}`} className="flex items-center gap-2 text-foreground">
                        <Badge variant="outline" className="h-5 min-w-[1.75rem] justify-center rounded-full border-primary/40 text-[11px] font-semibold text-primary">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{choice}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs">
                    Select three career goals in the survey so the AI keeps recommendations within your preferred fields.
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  if (action.locked) {
                    return (
                      <Button
                        key={action.key}
                        variant="outline"
                        className="h-auto justify-between gap-3 rounded-2xl border-border/60 bg-background/60 py-4 text-left"
                        disabled
                        title={action.disabledMessage}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{action.label}</span>
                        </span>
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={action.key}
                      asChild
                      variant="outline"
                      className="h-auto justify-start gap-3 rounded-2xl border-border/60 bg-background/60 py-4"
                    >
                      <Link to={action.href}>
                        <Icon className="h-4 w-4 text-primary" /> {action.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </div>
  );
}
