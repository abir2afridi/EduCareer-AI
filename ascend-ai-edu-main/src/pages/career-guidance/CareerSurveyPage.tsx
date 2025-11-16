import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  GripVertical,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  X,
  Loader2,
  Sparkles,
  Info,
  BookOpen,
  Target,
  CheckCircle2,
  Compass,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { useCareerSurvey } from "@/hooks/useCareerSurvey";

const CAREER_GOAL_OPTIONS: string[] = [
  "Doctor / MBBS",
  "Surgeon",
  "Nurse",
  "Pharmacist",
  "Dentist",
  "Biomedical Researcher",
  "Software Engineer",
  "Data Scientist",
  "AI / Machine Learning Engineer",
  "Product Manager",
  "Cybersecurity Specialist",
  "UI/UX Designer",
  "Game Developer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Civil Engineer",
  "Architect",
  "Aviation Pilot",
  "Air Force Officer",
  "Navy Officer",
  "Army Officer",
  "Chartered Accountant",
  "Investment Banker",
  "Marketing Strategist",
  "Entrepreneur",
  "Supply Chain Manager",
  "Teacher / Lecturer",
  "Educational Counselor",
  "Lawyer",
  "Judge / Judiciary",
  "Journalist",
  "Media Producer",
  "Film Director",
  "Graphic Designer",
  "Animation & VFX Artist",
  "Social Worker",
  "Psychologist",
  "International Relations Specialist",
  "Public Policy Analyst",
  "Tourism & Hospitality Leader",
  "Agronomist",
  "Environmental Scientist",
  "Biotechnologist",
  "Sports Management Professional",
];

const STUDY_TRACK_OPTIONS: string[] = [
  "Computer Science & Engineering (CSE)",
  "Software Engineering",
  "Electrical & Electronic Engineering (EEE)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Industrial & Production Engineering",
  "Architecture",
  "Biomedical Engineering",
  "Business Administration (BBA)",
  "Accounting & Finance",
  "Marketing",
  "Economics",
  "International Business",
  "Tourism & Hospitality Management",
  "Aviation & Aeronautics",
  "MBBS / Medical Science",
  "Nursing & Midwifery",
  "Pharmacy",
  "Dental Surgery",
  "Biotechnology",
  "Food & Nutrition",
  "Biochemistry",
  "Psychology",
  "English Literature",
  "Mass Communication & Journalism",
  "Film & Television Studies",
  "Fine Arts & Graphic Design",
  "Animation & Multimedia",
  "Education & Teaching",
  "Law",
  "Social Work",
  "International Relations",
  "Public Administration",
  "Agricultural Science",
  "Environmental Science",
  "Marine Science",
  "Defense Studies",
  "Criminology & Police Science",
  "Supply Chain & Logistics",
  "Entrepreneurship",
];

const MAX_CAREER_GOALS = 3;
const MAX_STUDY_TRACKS = 3;

export default function CareerSurveyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const uid = user?.uid ?? null;

  const { survey, isLoading, isSaving, error, save } = useCareerSurvey(uid);

  const [careerGoals, setCareerGoals] = useState<string[]>([]);
  const [studyTracks, setStudyTracks] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [careerSearch, setCareerSearch] = useState("");
  const [studySearch, setStudySearch] = useState("");

  useEffect(() => {
    if (survey) {
      const initialGoals = Array.isArray(survey.careerGoals)
        ? survey.careerGoals
        : Array.isArray(survey.choices)
          ? survey.choices
          : [];
      const initialTracks = Array.isArray(survey.studyTracks) ? survey.studyTracks : [];
      setCareerGoals(initialGoals.slice(0, MAX_CAREER_GOALS));
      setStudyTracks(initialTracks.slice(0, MAX_STUDY_TRACKS));
      setCareerSearch("");
      setStudySearch("");
    } else {
      setCareerGoals([]);
      setStudyTracks([]);
      setCareerSearch("");
      setStudySearch("");
    }
  }, [survey]);

  useEffect(() => {
    setSaveError(null);
  }, [careerGoals, studyTracks]);

  const availableCareerGoalOptionsAll = useMemo(
    () => CAREER_GOAL_OPTIONS.filter((option) => !careerGoals.includes(option)),
    [careerGoals],
  );

  const availableStudyTrackOptionsAll = useMemo(
    () => STUDY_TRACK_OPTIONS.filter((option) => !studyTracks.includes(option)),
    [studyTracks],
  );

  const availableCareerGoalOptions = useMemo(() => {
    if (!careerSearch.trim()) return availableCareerGoalOptionsAll;
    const term = careerSearch.trim().toLowerCase();
    return availableCareerGoalOptionsAll.filter((option) => option.toLowerCase().includes(term));
  }, [availableCareerGoalOptionsAll, careerSearch]);

  const availableStudyTrackOptions = useMemo(() => {
    if (!studySearch.trim()) return availableStudyTrackOptionsAll;
    const term = studySearch.trim().toLowerCase();
    return availableStudyTrackOptionsAll.filter((option) => option.toLowerCase().includes(term));
  }, [availableStudyTrackOptionsAll, studySearch]);

  const hasChanges = useMemo(() => {
    const baselineGoals = JSON.stringify(
      survey
        ? Array.isArray(survey.careerGoals)
          ? survey.careerGoals
          : Array.isArray(survey.choices)
            ? survey.choices
            : []
        : [],
    );
    const baselineTracks = JSON.stringify(Array.isArray(survey?.studyTracks) ? survey.studyTracks : []);
    return baselineGoals !== JSON.stringify(careerGoals) || baselineTracks !== JSON.stringify(studyTracks);
  }, [survey, careerGoals, studyTracks]);

  const careerGoalStatus = useMemo(() => {
    if (careerGoals.length === 0) return "Select up to three dream careers";
    if (careerGoals.length < MAX_CAREER_GOALS) return `You can add ${MAX_CAREER_GOALS - careerGoals.length} more`;
    return "You've selected the maximum number of career goals";
  }, [careerGoals.length]);

  const studyTrackStatus = useMemo(() => {
    if (studyTracks.length === 0) return "Choose subjects or study tracks that support your plan";
    if (studyTracks.length < MAX_STUDY_TRACKS) return `You can add ${MAX_STUDY_TRACKS - studyTracks.length} more`;
    return "You've selected the maximum number of study tracks";
  }, [studyTracks.length]);

  const goalProgress = useMemo(() => Math.round((careerGoals.length / MAX_CAREER_GOALS) * 100), [careerGoals.length]);
  const studyProgress = useMemo(() => Math.round((studyTracks.length / MAX_STUDY_TRACKS) * 100), [studyTracks.length]);
  const blendedProgress = useMemo(() => Math.round((goalProgress + studyProgress) / 2), [goalProgress, studyProgress]);
  const surveySavedComplete = useMemo(() => careerGoals.length === MAX_CAREER_GOALS && !hasChanges, [careerGoals.length, hasChanges]);
  const hasFullSelections = careerGoals.length === MAX_CAREER_GOALS && studyTracks.length === MAX_STUDY_TRACKS;
  const readyForNextStep = hasFullSelections && !hasChanges;
  const hasAnySelection = careerGoals.length > 0 || studyTracks.length > 0;
  const showUnsavedNotice = hasAnySelection && hasChanges;
  const insightHeadline = useMemo(() => {
    if (readyForNextStep) return "Survey looks great!";
    if (hasAnySelection) return "Finish aligning your roadmap";
    return "Start mapping your journey";
  }, [readyForNextStep, hasAnySelection]);
  const insightSubtext = useMemo(() => {
    if (readyForNextStep) return "Hit save to lock everything in, then head to document uploads.";
    if (hasAnySelection) return "Fill the remaining slots and save so the AI can calibrate the rest of the flow.";
    return "Choose the paths you’re curious about — we’ll personalise everything around them.";
  }, [readyForNextStep, hasAnySelection]);
  const insightBullets = useMemo(() => {
    if (readyForNextStep) {
      return [
        "Save now to unlock the document upload step.",
        "Gather supporting documents while you’re here to stay in the flow.",
      ];
    }
    const bullets: string[] = [];
    if (careerGoals.length < MAX_CAREER_GOALS) {
      bullets.push(`Add ${MAX_CAREER_GOALS - careerGoals.length} more career goal${MAX_CAREER_GOALS - careerGoals.length === 1 ? "" : "s"} to give the AI a wider horizon.`);
    }
    if (studyTracks.length < MAX_STUDY_TRACKS) {
      bullets.push(`Pick ${MAX_STUDY_TRACKS - studyTracks.length} more study track${MAX_STUDY_TRACKS - studyTracks.length === 1 ? "" : "s"} so the AI can balance academics with ambition.`);
    }
    if (showUnsavedNotice) {
      bullets.push("Remember to save once you’re happy with the rankings.");
    }
    if (!bullets.length) {
      bullets.push("Lock in every slot so we can tailor the next steps perfectly for you.");
    }
    return bullets;
  }, [readyForNextStep, careerGoals.length, studyTracks.length, showUnsavedNotice]);
  const stepOneBadgeText = surveySavedComplete
    ? "Complete"
    : showUnsavedNotice
      ? "Unsaved changes"
      : hasAnySelection
        ? "In progress"
        : "Start here";
  const stepOneBadgeTone = surveySavedComplete
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
    : showUnsavedNotice
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
      : hasAnySelection
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";
  const stepTwoBadgeText = surveySavedComplete ? "Unlocked next" : "Locked";
  const stepTwoBadgeTone = surveySavedComplete
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
    : "bg-muted text-muted-foreground";
  const stepTwoDescription = surveySavedComplete
    ? "Upload supporting documents so the AI can analyse them."
    : "Save this survey to unlock the document upload step.";

  const guidanceBullets = [
    "Pick realistic roles that genuinely motivate you",
    "Align subjects with the careers you’ve chosen",
    "Save once you’re happy — you can refine later",
  ];

  const quickTips = [
    "Mix aspiration with practicality: include at least one path you could pursue in the next 2-3 years.",
    "If you’re unsure about study tracks, start with the subjects you already score well in.",
    "Use the document upload step to prove readiness for your top choices.",
  ];

  const documentChecklist = [
    {
      title: "Report cards or transcripts",
      detail: "Upload your latest academic results so the AI understands your strengths.",
    },
    {
      title: "Certificates & achievements",
      detail: "Share awards, certifications, or club highlights that support your selected tracks.",
    },
    {
      title: "Personal notes",
      detail: "Add context about interests or constraints to fine-tune recommendations.",
    },
  ];

  const studySlotLabels = ["Primary focus", "Supporting area", "Stretch or exploratory"];

  const handleToggleGoal = (option: string) => {
    setCareerGoals((prev) => {
      if (prev.includes(option)) {
        return prev.filter((item) => item !== option);
      }
      if (prev.length >= MAX_CAREER_GOALS) {
        toast({
          title: "Limit reached",
          description: `You can only select up to ${MAX_CAREER_GOALS} career goals. Remove one to add another option.`,
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, option];
    });
  };

  const handleReorderGoal = (option: string, delta: number) => {
    setCareerGoals((prev) => {
      const index = prev.indexOf(option);
      if (index === -1) return prev;
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      next.splice(nextIndex, 0, removed);
      return next;
    });
  };

  const handleRemoveGoal = (option: string) => {
    setCareerGoals((prev) => prev.filter((item) => item !== option));
  };

  const handleToggleTrack = (option: string) => {
    setStudyTracks((prev) => {
      if (prev.includes(option)) {
        return prev.filter((item) => item !== option);
      }
      if (prev.length >= MAX_STUDY_TRACKS) {
        toast({
          title: "Limit reached",
          description: `You can only select up to ${MAX_STUDY_TRACKS} study tracks. Remove one to add another option.`,
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, option];
    });
  };

  const handleRemoveTrack = (option: string) => {
    setStudyTracks((prev) => prev.filter((item) => item !== option));
  };

  const handleSave = async () => {
    if (!uid) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your preferences.",
        variant: "destructive",
      });
      return;
    }

    if (careerGoals.length === 0) {
      toast({
        title: "Add at least one career goal",
        description: "Pick at least one future career before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      await save({ careerGoals, studyTracks });
      toast({
        title: "Preferences saved",
        description: "We'll tailor the upcoming assessment and recommendations based on your goals and study focus.",
      });
      setSaveError(null);
    } catch (saveErr) {
      const message = saveErr instanceof Error ? saveErr.message : "Unable to save your survey right now.";
      setSaveError(saveErr instanceof Error ? saveErr : new Error(message));
      toast({ title: "Save failed", description: message, variant: "destructive" });
    }
  };

  const lastUpdatedText = useMemo(() => {
    const timestamp = survey?.updatedAt?.toDate?.();
    if (!timestamp) return null;
    return formatDistanceToNow(timestamp, { addSuffix: true });
  }, [survey?.updatedAt]);

  return (
    <div className="space-y-8 pb-16">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground" asChild>
          <Link to="/career" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to overview
          </Link>
        </Button>
      </motion.div>

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
        <div className="space-y-10">
          <section className="overflow-hidden rounded-3xl border border-border/50 bg-white/95 shadow-sm backdrop-blur-md dark:bg-slate-950/80">
            <div className="bg-gradient-to-r from-primary/90 via-primary to-primary/80 px-6 py-8 text-white">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Step 1 of 4</span>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Career Guidance Survey</h1>
                    <p className="text-white/80">
                      Set the guardrails for your personalised roadmap. We tailor the document analysis, 40-question assessment, and
                      AI recommendations around the roles and study tracks you lock in here.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="rounded-full border border-white/30 bg-white/15 text-white backdrop-blur">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI assisted guidance
                    </Badge>
                    {lastUpdatedText ? (
                      <Badge variant="outline" className="rounded-full border-white/40 bg-white/10 text-white">
                        Last updated {lastUpdatedText}
                      </Badge>
                    ) : null}
                    {showUnsavedNotice ? (
                      <Badge variant="secondary" className="rounded-full border border-amber-200/40 bg-amber-100/20 text-amber-50">
                        Unsaved changes
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/25 bg-white/15 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Career picks</p>
                    <p className="text-lg font-semibold">{careerGoals.length} / {MAX_CAREER_GOALS}</p>
                    <p className="text-xs text-white/70">Roles locked in</p>
                  </div>
                  <div className="rounded-2xl border border-white/25 bg-white/15 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Study focus</p>
                    <p className="text-lg font-semibold">{studyTracks.length} / {MAX_STUDY_TRACKS}</p>
                    <p className="text-xs text-white/70">Subjects selected</p>
                  </div>
                  <div className="rounded-2xl border border-white/25 bg-white/15 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Survey alignment</p>
                    <p className="text-lg font-semibold">{blendedProgress}%</p>
                    <p className="text-xs text-white/70">{readyForNextStep ? "Ready to continue" : "Save to unlock next"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 bg-white/90 px-6 py-6 text-sm text-muted-foreground dark:bg-slate-950/85">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">Overall progress</p>
                  <p>
                    {readyForNextStep
                      ? "Great! You’re ready to move to documents after saving."
                      : hasFullSelections
                        ? "Save your preferences to unlock the document upload step."
                        : hasAnySelection
                          ? "Keep going—fill every slot so the AI understands your direction."
                          : "Complete both sections so the AI understands your direction."}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> Guided by AI
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Career goals</span>
                    <span>{goalProgress}%</span>
                  </div>
                  <Progress value={goalProgress} className="mt-2 h-2 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Study tracks</span>
                    <span>{studyProgress}%</span>
                  </div>
                  <Progress value={studyProgress} className="mt-2 h-2 rounded-full" />
                </div>
              </div>
            </div>
          </section>

          {showUnsavedNotice ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-400/60 bg-amber-50/90 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
              <Info className="h-5 w-5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Unsaved changes detected</p>
                <p className="text-xs sm:text-sm">Save your preferences so the AI uses your latest selections.</p>
              </div>
            </div>
          ) : null}

          <section className="grid gap-5 lg:grid-cols-2">
            <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
              <CardHeader className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/15 p-2 text-primary">
                  <Compass className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">Journey map</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Track each milestone as you progress toward tailored guidance.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ol className="space-y-3">
                  <li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/80 p-3 dark:bg-slate-950/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">Survey preferences</p>
                        <Badge variant="secondary" className={`rounded-full px-3 py-1 text-[0.68rem] ${stepOneBadgeTone}`}>
                          {stepOneBadgeText}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Rank your goals and study focus.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/80 p-3 dark:bg-slate-950/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-200">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">Upload documents</p>
                        <Badge variant="secondary" className={`rounded-full px-3 py-1 text-[0.68rem] ${stepTwoBadgeTone}`}>
                          {stepTwoBadgeText}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{stepTwoDescription}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/80 p-3 dark:bg-slate-950/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-200">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">40-question assessment</p>
                      <p className="text-xs text-muted-foreground">Adaptive MCQ tuned to your selections.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/80 p-3 dark:bg-slate-950/60">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">AI recommendations</p>
                      <p className="text-xs text-muted-foreground">Receive a personalised roadmap and next steps.</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
              <CardHeader className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/15 p-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">AI insight</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Guidance tuned to your current selections.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="text-base font-semibold text-foreground">{insightHeadline}</p>
                <p>{insightSubtext}</p>
                <ul className="space-y-2">
                  {insightBullets.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="text-lg">Future career goals</CardTitle>
                <CardDescription>Rank the top three roles you want to pursue. The AI only recommends within these guardrails.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {isLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((index) => (
                      <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {careerGoals.length ? (
                      <div className="space-y-3">
                        {careerGoals.map((option, index) => (
                          <div
                            key={option}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm transition hover:border-primary/50 dark:bg-slate-950/70"
                          >
                            <div className="flex flex-1 items-center gap-4">
                              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                                #{index + 1}
                              </span>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">{option}</p>
                                <p className="text-xs text-muted-foreground">
                                  Priority {index + 1} • {index === 0 ? "Top pick" : index === 1 ? "Second choice" : "Third choice"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleReorderGoal(option, -1)}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleReorderGoal(option, 1)}
                                disabled={index === careerGoals.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleRemoveGoal(option)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-muted-foreground">
                        <p className="font-semibold text-foreground">No career goals selected yet</p>
                        <p className="mt-1 text-sm">Choose up to three options below to begin ranking.</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4" />
                        {careerGoalStatus}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                          {careerGoals.length} of {MAX_CAREER_GOALS}
                        </Badge>
                        <Button onClick={handleSave} disabled={!hasChanges || isSaving || careerGoals.length === 0} className="gap-2 rounded-full">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Save preferences
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Available career goals</p>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={careerSearch}
                            onChange={(event) => setCareerSearch(event.target.value)}
                            placeholder="Search by role, industry, or ambition"
                            className="h-10 rounded-full bg-white/80 pl-10 text-sm focus-visible:ring-primary/60 dark:bg-slate-950/60"
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-[260px] pr-2">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {availableCareerGoalOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleToggleGoal(option)}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-white/70 px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-primary/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-slate-950/70"
                            >
                              <span>{option}</span>
                              <Badge variant="outline">Add</Badge>
                            </button>
                          ))}
                          {availableCareerGoalOptions.length === 0 ? (
                            <div className="col-span-full space-y-2 rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                              {careerSearch.trim() ? (
                                <>
                                  <p>No matches found for “{careerSearch.trim()}”.</p>
                                  <p>Try searching with a broader keyword or clear the filter.</p>
                                </>
                              ) : (
                                <p>You have selected the maximum number of goals. Remove one to add another.</p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {saveError ? (
                  <Alert className="border-red-400 bg-red-50 text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-100">
                    <AlertDescription>{saveError.message}</AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="text-lg">Preferred study tracks</CardTitle>
                <CardDescription>Select up to three subjects or academic streams that fit your plan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <Skeleton key={index} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {studyTracks.length ? (
                        <div className="space-y-3">
                          {studyTracks.map((track, index) => (
                            <div
                              key={track}
                              className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-white/80 p-4 text-sm shadow-sm transition hover:border-primary/50 dark:bg-slate-950/70"
                            >
                              <div className="flex flex-1 items-center gap-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                                  S{index + 1}
                                </span>
                                <div className="space-y-1 text-left">
                                  <p className="text-sm font-semibold text-foreground">{track}</p>
                                  <p className="text-xs text-muted-foreground">{studySlotLabels[index] ?? "Additional focus area"}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleRemoveTrack(track)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-muted-foreground">
                          <p className="font-semibold text-foreground">No study tracks selected yet</p>
                          <p className="mt-1 text-sm">Pick up to three subjects or streams. The AI uses these to tailor study advice.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {studyTrackStatus}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                          {studyTracks.length} of {MAX_STUDY_TRACKS}
                        </Badge>
                        <Button onClick={handleSave} disabled={!hasChanges || isSaving || studyTracks.length === 0} className="gap-2 rounded-full">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Save preferences
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Available study tracks</p>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={studySearch}
                            onChange={(event) => setStudySearch(event.target.value)}
                            placeholder="Search by subject or department"
                            className="h-10 rounded-full bg-white/80 pl-10 text-sm focus-visible:ring-primary/60 dark:bg-slate-950/60"
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-[280px] pr-2">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {availableStudyTrackOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleToggleTrack(option)}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-white/70 px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-primary/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-slate-950/70"
                            >
                              <span>{option}</span>
                              <Badge variant="outline">Add</Badge>
                            </button>
                          ))}
                          {availableStudyTrackOptions.length === 0 ? (
                            <div className="col-span-full space-y-2 rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                              {studySearch.trim() ? (
                                <>
                                  <p>No matches found for “{studySearch.trim()}”.</p>
                                  <p>Try a different keyword or clear the filter.</p>
                                </>
                              ) : (
                                <p>All available study tracks are already selected.</p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
              <CardHeader className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/15 p-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">Quick guidance</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Keep these prompts in mind while you pick options.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {guidanceBullets.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-base">Progress snapshot</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">Know what’s left before the next step unlocks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  {readyForNextStep
                    ? "All set — hit save and move to document uploads."
                    : hasFullSelections
                      ? "Selections look great. Save now to unlock uploads."
                      : hasAnySelection
                        ? "Add more options so the AI can balance ambition and academics."
                        : "Start adding goals and tracks so the AI can guide you."}
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>Career goals</span>
                      <span>{goalProgress}%</span>
                    </div>
                    <Progress value={goalProgress} className="mt-2 h-2 rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>Study tracks</span>
                      <span>{studyProgress}%</span>
                    </div>
                    <Progress value={studyProgress} className="mt-2 h-2 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
              <CardHeader className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/15 p-2 text-primary">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">How this works</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Your ranked choices shape the assessment and tailor every AI insight afterwards.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Save once you’re happy with the ranking. That unlocks document uploads, then the adaptive quiz, and finally your personalised AI recommendations.
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
              <CardHeader className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">Document prep list</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Gather these now so uploads feel effortless later.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {documentChecklist.map((item) => (
                    <li key={item.title} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </motion.section>

      {surveySavedComplete ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <div className="space-y-1 text-foreground">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Next step unlocked</p>
            <p className="text-base text-muted-foreground">Your survey responses are saved. Upload supporting documents to continue the journey.</p>
          </div>
          <Button asChild size="lg" className="gap-2 rounded-full px-6">
            <Link to="/career-guidance/documents">
              Next step <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}

      {error ? (
        <Alert className="border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertDescription>
            We had trouble loading your saved preferences earlier. You can still make selections—just remember to save once
            you're done.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
