import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  CalendarRange,
  Sparkles,
  BarChart3,
  Target,
  TrendingUp,
  Filter,
  Layers,
  ArrowUpRight,
  LineChart as LineChartIcon,
  Brain,
  Star,
  MessageCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type AssessmentStatus = "Graded" | "Submitted" | "Pending";

type Assessment = {
  id: string;
  title: string;
  type: "Quiz" | "Assignment" | "Midterm" | "Project" | "Portfolio";
  course: string;
  score?: number;
  total: number;
  status: AssessmentStatus;
  date: string;
  aiFeedback: string;
  teacherFeedback: string;
  peerFeedback?: string;
  aiRecommendations: string[];
  breakdown: { area: string; value: number }[];
};

const assessments: Assessment[] = [
  {
    id: "asm-1",
    title: "Machine Learning Midterm",
    type: "Midterm",
    course: "AI Engineering",
    score: 94,
    total: 100,
    status: "Graded",
    date: "Oct 05, 2025",
    aiFeedback: "Excellent conceptual grounding with clear model explanations. Revise optimization proofs for sharper accuracy.",
    teacherFeedback: "Thorough analysis with well-documented experiments. Consider expanding on ethical constraints.",
    peerFeedback: "Loved the clarity of your confusion matrix interpretations!",
    aiRecommendations: [
      "Schedule a review of gradient descent proofs before next assessment.",
      "Add qualitative notes to compare model variants in the appendix.",
    ],
    breakdown: [
      { area: "Knowledge", value: 27 },
      { area: "Application", value: 38 },
      { area: "Creativity", value: 22 },
      { area: "Structure", value: 13 },
    ],
  },
  {
    id: "asm-2",
    title: "Narrative Dashboard Project",
    type: "Assignment",
    course: "Data Storytelling",
    score: 88,
    total: 100,
    status: "Graded",
    date: "Oct 09, 2025",
    aiFeedback: "Visual hierarchy is strong. Improve data annotations to reduce reader friction.",
    teacherFeedback: "Compelling storyline. Please tighten the executive summary to two paragraphs.",
    peerFeedback: "Transitions between story beats were smooth and engaging.",
    aiRecommendations: [
      "Incorporate callouts for outliers in the revenue trends chart.",
      "Draft a voiceover script to present the dashboard asynchronously.",
    ],
    breakdown: [
      { area: "Knowledge", value: 26 },
      { area: "Application", value: 32 },
      { area: "Creativity", value: 28 },
      { area: "Structure", value: 14 },
    ],
  },
  {
    id: "asm-3",
    title: "Cyber Security Simulation",
    type: "Project",
    course: "Cyber Defense Lab",
    score: 74,
    total: 100,
    status: "Graded",
    date: "Oct 12, 2025",
    aiFeedback: "Response plan was solid, yet mitigation timeline needs fine-tuning.",
    teacherFeedback: "Prioritize documentation of incident escalation paths.",
    peerFeedback: "Great teamwork callouts, but logs could be clearer.",
    aiRecommendations: [
      "Rehearse incident chronologies to speed up future crisis reports.",
      "Build a reusable checklist for vulnerability triage.",
    ],
    breakdown: [
      { area: "Knowledge", value: 23 },
      { area: "Application", value: 34 },
      { area: "Creativity", value: 18 },
      { area: "Structure", value: 19 },
    ],
  },
  {
    id: "asm-4",
    title: "Ethical AI Reflection",
    type: "Quiz",
    course: "Responsible AI",
    status: "Submitted",
    total: 100,
    date: "Oct 14, 2025",
    aiFeedback: "Awaiting model rubric. Draft highlights thoughtful nuance in fairness trade-offs.",
    teacherFeedback: "Pending review",
    aiRecommendations: [
      "Add citations for case studies to expedite grading.",
    ],
    breakdown: [
      { area: "Knowledge", value: 24 },
      { area: "Application", value: 31 },
      { area: "Creativity", value: 27 },
      { area: "Structure", value: 18 },
    ],
  },
  {
    id: "asm-5",
    title: "Capstone Pitch Deck",
    type: "Portfolio",
    course: "Innovation Studio",
    status: "Pending",
    total: 100,
    date: "Oct 20, 2025",
    aiFeedback: "AI will prioritize storytelling metrics once submission is in.",
    teacherFeedback: "Upload draft slides for initial review.",
    aiRecommendations: [
      "Collect peer testimonials to strengthen the opening narrative.",
    ],
    breakdown: [
      { area: "Knowledge", value: 25 },
      { area: "Application", value: 35 },
      { area: "Creativity", value: 25 },
      { area: "Structure", value: 15 },
    ],
  },
];

const performanceTrendData = [
  { date: "Sep 10", score: 82, expected: 84 },
  { date: "Sep 18", score: 88, expected: 89 },
  { date: "Sep 26", score: 86, expected: 90 },
  { date: "Oct 05", score: 94, expected: 95 },
  { date: "Oct 09", score: 88, expected: 92 },
  { date: "Oct 12", score: 74, expected: 86 },
  { date: "Oct 20", score: 0, expected: 88 },
];

const typeFilters: Array<Assessment["type"] | "All"> = ["All", "Quiz", "Assignment", "Midterm", "Project", "Portfolio"];

const statusBadgeStyles: Record<AssessmentStatus, string> = {
  Graded: "bg-emerald-500/15 text-emerald-500",
  Submitted: "bg-sky-500/15 text-sky-500",
  Pending: "bg-amber-500/15 text-amber-500",
};

const pieColors = ["#0ea5e9", "#22c55e", "#a855f7", "#facc15"];

const parseDate = (value: string) => new Date(value);

export default function Assessments() {
  const [dateScope, setDateScope] = useState<"month" | "semester" | "year">("month");
  const [typeFilter, setTypeFilter] = useState<Assessment["type"] | "All">("All");

  const gradedAssessments = useMemo(() => assessments.filter((item) => item.status === "Graded" && typeof item.score === "number"), []);

  const summary = useMemo(() => {
    const total = assessments.length;
    const avg = gradedAssessments.length
      ? Math.round((gradedAssessments.reduce((sum, item) => sum + (item.score ?? 0), 0) / (gradedAssessments.length * 100)) * 100)
      : 0;
    const best = gradedAssessments.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.course ?? "—";

    const areaAggregate = gradedAssessments.reduce<Record<string, { total: number; count: number }>>((acc, assessment) => {
      assessment.breakdown.forEach((segment) => {
        if (!acc[segment.area]) {
          acc[segment.area] = { total: 0, count: 0 };
        }
        acc[segment.area].total += segment.value;
        acc[segment.area].count += 1;
      });
      return acc;
    }, {});

    const weakestArea = Object.entries(areaAggregate)
      .map(([area, info]) => ({ area, score: info.total / info.count }))
      .sort((a, b) => a.score - b.score)[0]?.area;

    return {
      total,
      averageScore: avg,
      bestSubject: best,
      weakestArea: weakestArea ?? "AI evaluating",
    };
  }, [gradedAssessments]);

  const breakdownAverage = useMemo(() => {
    const totals = gradedAssessments.reduce<Record<string, number>>((acc, assessment) => {
      assessment.breakdown.forEach((segment) => {
        acc[segment.area] = (acc[segment.area] ?? 0) + segment.value;
      });
      return acc;
    }, {});

    return Object.entries(totals).map(([area, value]) => ({
      area,
      value: gradedAssessments.length ? Math.round(value / gradedAssessments.length) : 0,
    }));
  }, [gradedAssessments]);

  const filteredAssessments = useMemo(() => {
    const pool = typeFilter === "All" ? assessments : assessments.filter((item) => item.type === typeFilter);
    return [...pool].sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
  }, [typeFilter]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 rounded-3xl border border-border/50 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:bg-slate-950/75 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Badge variant="outline" className="w-fit uppercase tracking-widest">Assessment Builder</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Assessments &amp; Feedback</h1>
            <p className="text-muted-foreground">
              Centralize grading analytics, AI insights, and mentor feedback to steer your next learning sprint. Build evaluations,
              publish rubrics, and track mastery trajectories with real-time nudges.
            </p>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Signal</p>
              <p className="text-base font-semibold text-primary">Grade review queue ready</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Building Momentum</p>
              <p className="text-base font-semibold text-foreground">5 assessments drafted this week</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={dateScope === "month" ? "default" : "outline"} className="gap-2" onClick={() => setDateScope("month")}>
              <CalendarRange className="h-4 w-4" /> This Month
            </Button>
            <Button variant={dateScope === "semester" ? "default" : "outline"} className="gap-2" onClick={() => setDateScope("semester")}>
              <Layers className="h-4 w-4" /> Semester
            </Button>
            <Button variant={dateScope === "year" ? "default" : "outline"} className="gap-2" onClick={() => setDateScope("year")}>
              <Filter className="h-4 w-4" /> Year
            </Button>
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-3xl" />
          <DotLottieReact
            src="https://lottie.host/5702f9f1-1397-433c-9503-b905958adb4c/huSMdVgECE.lottie"
            autoplay
            loop
            className="relative h-48 w-48 md:h-56 md:w-56"
          />
        </div>
      </div>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/75">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Total Assessments</span>
              <p className="text-3xl font-semibold text-foreground">{summary.total}</p>
              <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
                Momentum rising
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/75">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Average Score</span>
              <p className="text-3xl font-semibold text-primary">{summary.averageScore}%</p>
              <Badge variant="secondary" className="w-fit bg-emerald-500/15 text-emerald-500">
                +4% vs last scope
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/75">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Best Performing Subject</span>
              <p className="text-lg font-semibold text-foreground">{summary.bestSubject}</p>
              <Badge variant="secondary" className="w-fit bg-sky-500/15 text-sky-500">
                Spotlight module
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/75">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Weakest Area (AI)</span>
              <p className="text-lg font-semibold text-rose-500">{summary.weakestArea}</p>
              <Badge variant="secondary" className="w-fit bg-rose-500/15 text-rose-500">
                Coaching queued
              </Badge>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay: 0.04 }}>
        <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/80">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChartIcon className="h-5 w-5 text-primary" /> Performance Momentum
              </CardTitle>
              <CardDescription>Actual scores mapped against AI-forecasted expectations.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrendData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="date" stroke="currentColor" className="text-xs text-muted-foreground" />
                  <YAxis stroke="currentColor" className="text-xs text-muted-foreground" domain={[60, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Score" />
                  <Line type="monotone" dataKey="expected" stroke="#38bdf8" strokeDasharray="6 4" strokeWidth={2} name="AI Trend" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/80">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" /> AI Scoring Breakdown
              </CardTitle>
              <CardDescription>Weighted rubric signals averaged across graded submissions.</CardDescription>
            </CardHeader>
            <CardContent className="flex h-[320px] flex-col">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownAverage} dataKey="value" nameKey="area" innerRadius={60} outerRadius={100} paddingAngle={3}>
                      {breakdownAverage.map((segment, index) => (
                        <Cell key={segment.area} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground">
                {breakdownAverage.map((segment, index) => (
                  <div key={segment.area} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                      {segment.area}
                    </span>
                    <span>{segment.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.06 }}>
        <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" /> Assessment Pipeline
                  </CardTitle>
                  <CardDescription>AI ranks tasks by urgency, recency, and projected impact.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {typeFilters.map((option) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={typeFilter === option ? "default" : "ghost"}
                      className="rounded-2xl"
                      onClick={() => setTypeFilter(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => (
                    <TableRow key={assessment.id} className="transition hover:bg-muted/40">
                      <TableCell className="max-w-[220px] font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>{assessment.title}</span>
                          <span className="text-xs text-muted-foreground">{assessment.aiFeedback}</span>
                        </div>
                      </TableCell>
                      <TableCell>{assessment.type}</TableCell>
                      <TableCell>{assessment.course}</TableCell>
                      <TableCell>
                        {typeof assessment.score === "number" ? (
                          <span className="font-semibold text-primary">{assessment.score}%</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusBadgeStyles[assessment.status]} capitalize`}>{assessment.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{assessment.date}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Sparkles className="h-4 w-4" /> View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/95">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                                <Star className="h-5 w-5 text-primary" /> {assessment.title}
                              </DialogTitle>
                              <DialogDescription>
                                {assessment.course} • {assessment.type} • {assessment.date}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 dark:bg-slate-900/50">
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                                    {assessment.status}
                                  </Badge>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <TrendingUp className="h-4 w-4" />
                                    {typeof assessment.score === "number" ? `${assessment.score}% achieved` : "Score pending"}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{assessment.aiFeedback}</p>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-border/60 p-4">
                                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Brain className="h-4 w-4 text-primary" /> Teacher Feedback
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{assessment.teacherFeedback}</p>
                                </div>
                                <div className="rounded-2xl border border-border/60 p-4">
                                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <MessageCircle className="h-4 w-4 text-primary" /> Peer Perspective
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{assessment.peerFeedback ?? "Peers will add notes after review."}</p>
                                </div>
                              </div>

                              <div className="space-y-3 rounded-2xl border border-border/60 p-4">
                                <h4 className="text-sm font-semibold text-foreground">Next Steps</h4>
                                <div className="grid gap-2 text-sm text-muted-foreground">
                                  {assessment.aiRecommendations.map((item) => (
                                    <div key={item} className="flex items-start gap-2 rounded-xl border border-border/60 bg-white/80 px-3 py-2 dark:bg-slate-900/60">
                                      <ArrowUpRight className="h-4 w-4 text-primary" />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3 rounded-2xl border border-border/60 p-4">
                                <h4 className="text-sm font-semibold text-foreground">Rubric Distribution</h4>
                                <div className="space-y-3">
                                  {assessment.breakdown.map((segment) => (
                                    <div key={segment.area} className="space-y-1">
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{segment.area}</span>
                                        <span>{segment.value}%</span>
                                      </div>
                                      <Progress value={segment.value} className="h-2" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="secondary">Export summary</Button>
                              <Button className="gap-2">
                                <Sparkles className="h-4 w-4" /> Ask AI for deeper review
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-primary/15 via-primary/10 to-white/70 backdrop-blur-md dark:from-primary/20 dark:via-primary/10 dark:to-slate-950/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" /> AI Feedback Capsule
              </CardTitle>
              <CardDescription>Model-generated narrative aligns focus for the next study block.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Your consistency improved by 12% this semester. Keep leveraging visual storytelling techniques to maintain engagement.</p>
              <p>AI advises prioritizing incident response drills and ethics citations to balance analytical and reflective strengths.</p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.09 }}>
        <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" /> Teacher &amp; Peer Feedback Panel
            </CardTitle>
            <CardDescription>Consolidated reflections highlight strengths, opportunities, and morale signals.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px] pr-2">
              <div className="grid gap-3">
                {assessments.filter((item) => item.teacherFeedback || item.peerFeedback).map((assessment) => (
                  <div key={assessment.id} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 dark:bg-slate-900/50">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{assessment.title}</span>
                        <span className="text-xs text-muted-foreground">{assessment.course}</span>
                      </div>
                      <Badge variant="secondary" className="bg-sky-500/15 text-sky-500">{assessment.status}</Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <div className="rounded-xl border border-border/60 bg-white/75 p-3 dark:bg-slate-950/70">
                        <span className="font-semibold text-foreground">Teacher</span>
                        <p className="mt-1 leading-relaxed">{assessment.teacherFeedback}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-white/75 p-3 dark:bg-slate-950/70">
                        <span className="font-semibold text-foreground">AI Summary</span>
                        <p className="mt-1 leading-relaxed">{assessment.aiFeedback}</p>
                      </div>
                    </div>
                    {assessment.peerFeedback && (
                      <div className="rounded-xl border border-dashed border-border/60 bg-white/80 p-3 text-sm text-muted-foreground dark:bg-slate-950/70">
                        <span className="font-semibold text-foreground">Peer Note:</span> {assessment.peerFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
