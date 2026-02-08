import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
import { cn } from "@/lib/utils";
import { TrendingUp, Filter, Sparkles, Download, Target, Award } from "lucide-react";

const trendDataset = {
  weekly: [
    { label: "W1", score: 74 },
    { label: "W2", score: 78 },
    { label: "W3", score: 83 },
    { label: "W4", score: 86 },
    { label: "W5", score: 88 },
    { label: "W6", score: 90 },
  ],
  monthly: [
    { label: "Apr", score: 68 },
    { label: "May", score: 72 },
    { label: "Jun", score: 77 },
    { label: "Jul", score: 82 },
    { label: "Aug", score: 88 },
    { label: "Sep", score: 90 },
  ],
  semester: [
    { label: "T1", score: 64 },
    { label: "T2", score: 70 },
    { label: "T3", score: 82 },
    { label: "T4", score: 87 },
  ],
} as const;

type TrendRange = keyof typeof trendDataset;

type CourseFilter = "all" | "math" | "ai-fundamentals";

type CourseReport = {
  course: string;
  completion: number;
  average: number;
  studyTime: string;
  status: "top" | "improve" | "neutral";
};

const summaryMetrics = [
  { label: "Total Learning Hours", value: "46 hrs", icon: Target, accent: "bg-primary/15 text-primary" },
  { label: "Average Quiz Score", value: "82%", icon: Award, accent: "bg-emerald-500/10 text-emerald-500" },
  { label: "Completed Lessons", value: "12", icon: Target, accent: "bg-sky-500/10 text-sky-500" },
  { label: "AI Efficiency Score", value: "91", icon: Sparkles, accent: "bg-fuchsia-500/10 text-fuchsia-500" },
];

const courseReportData: CourseReport[] = [
  { course: "Math Fundamentals", completion: 90, average: 84, studyTime: "8h 22m", status: "top" },
  { course: "AI Basics", completion: 75, average: 79, studyTime: "6h 40m", status: "neutral" },
  { course: "Neural Networks", completion: 58, average: 64, studyTime: "5h 18m", status: "improve" },
  { course: "Design Thinking", completion: 82, average: 86, studyTime: "7h 05m", status: "top" },
];

const studyDistribution = [
  { name: "Math", value: 38, color: "#0ea5e9" },
  { name: "Programming", value: 27, color: "#22c55e" },
  { name: "AI", value: 23, color: "#a855f7" },
  { name: "Other", value: 12, color: "#f97316" },
];

const learningGoals = [
  {
    id: "goal-lessons",
    label: "Finish 15 lessons this month",
    target: "15 lessons",
    current: "12 completed",
    progress: 80,
    tone: "positive" as const,
  },
  {
    id: "goal-score",
    label: "Maintain above 85% score",
    target: "85%",
    current: "81%",
    progress: 81,
    tone: "warning" as const,
  },
  {
    id: "goal-hours",
    label: "Log 12 focused study hours",
    target: "12 hrs",
    current: "9 hrs",
    progress: 75,
    tone: "neutral" as const,
  },
];

type GoalTone = (typeof learningGoals)[number]["tone"];

const insightsByCourse: Record<CourseFilter, string> = {
  all: "You're showing consistent improvement in analytical modules. Keep reinforcing neural network fundamentals to close the performance gap next term.",
  math: "Strong progression in calculus sequences. Continue spaced repetition on proofs to maintain momentum.",
  "ai-fundamentals": "Your model implementation labs are on track. Increase focus on theory quizzes to ensure balanced mastery.",
};

const insightVariants: Record<TrendRange, string> = {
  weekly: "Weekly focus: maintain the current streak and log daily review notes to boost retention by 12%.",
  monthly: "Monthly trend indicates a 14% rise in consistency. Schedule a peer session on neural networks to unlock the next tier.",
  semester: "Semester snapshot shows exponential growth. Double down on experiments to capitalize on compounding mastery.",
};

const toneClasses: Record<GoalTone, string> = {
  positive: "text-emerald-500",
  warning: "text-amber-500",
  neutral: "text-muted-foreground",
};

export default function Reports() {
  const { toast } = useToast();
  const [range, setRange] = useState<TrendRange>("weekly");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");

  const trendSeries = useMemo(() => trendDataset[range], [range]);

  const filteredCourses = useMemo(() => {
    if (courseFilter === "all") return courseReportData;
    return courseReportData.filter((course) => {
      if (courseFilter === "math") return course.course.toLowerCase().includes("math");
      if (courseFilter === "ai-fundamentals") return course.course.toLowerCase().includes("ai");
      return true;
    });
  }, [courseFilter]);

  const aiSummary = useMemo(() => {
    const base = insightsByCourse[courseFilter];
    const variant = insightVariants[range];
    return `${base} ${variant}`;
  }, [courseFilter, range]);

  const handleExport = () => {
    // TODO: integrate with fetchLearningReportAPI for PDF export
    toast({
      title: "Report exported successfully",
      description: "Your learning report PDF is on its way to your inbox.",
    });
  };

  return (
    <div className="space-y-8">
      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        <div className="grid gap-6 rounded-3xl border border-border/50 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:bg-slate-950/75 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-4">
            <div className="space-y-1">
              <Badge variant="outline" className="w-fit uppercase tracking-widest">Learning Reports</Badge>
              <h1 className="text-3xl font-bold tracking-tight">📊 Learning Reports &amp; Progress Analytics</h1>
              <p className="text-muted-foreground">
                Track academic growth, trend trajectories, and subject mastery. AI surfaces the right datasets and insights so
                you can act quickly on coaching opportunities.
              </p>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Latest Insight</p>
                <p className="text-base font-semibold text-foreground">Consistency up 14% MoM</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Signal</p>
                <p className="text-base font-semibold text-primary">Review neural network labs</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Select value={range} onValueChange={(value: TrendRange) => setRange(value)}>
                <SelectTrigger className="rounded-2xl border-border/60">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="semester">Semester</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courseFilter} onValueChange={(value: CourseFilter) => setCourseFilter(value)}>
                <SelectTrigger className="rounded-2xl border-border/60">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="ai-fundamentals">AI Fundamentals</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Search report..." className="rounded-2xl border-border/60" />
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-3xl" />
            <DotLottieReact
              src="https://lottie.host/0e4a4889-3bc8-4f69-a73e-9d6dcbcda575/iWaSnkduvc.lottie"
              autoplay
              loop
              className="relative h-48 w-48 md:h-56 md:w-56"
            />
          </div>
        </div>
      </motion.header>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryMetrics.map((metric) => (
            <Card key={metric.label} className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-2xl", metric.accent)}>
                    <metric.icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-3xl font-semibold text-foreground">{metric.value}</p>
                <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">Live</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.04 }}>
        <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" /> Performance Over Time
              </CardTitle>
              <CardDescription>Powered by mock analytics data. Replace via fetchLearningReportAPI.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" /> Compare period
            </Button>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="label" stroke="currentColor" className="text-xs text-muted-foreground" />
                <YAxis stroke="currentColor" className="text-xs text-muted-foreground" domain={[60, 100]} />
                <Tooltip formatter={(value: number) => [`${value}%`, "Score"]} />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }}>
        <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>Course-wise Report</CardTitle>
            <CardDescription>Sortable table summarizing completion, scores, and study time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr] gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Course</span>
              <span>Completion</span>
              <span>Avg. Score</span>
              <span>Study Time</span>
              <span>Progress</span>
            </div>
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <div
                  key={course.course}
                  className="grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr] items-center gap-3 rounded-3xl border border-border/60 bg-white/85 p-4 transition hover:border-primary/50 dark:bg-slate-950/70"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{course.course}</span>
                    {course.status === "top" && <Badge className="w-fit bg-emerald-500/10 text-emerald-500">Top performer</Badge>}
                    {course.status === "improve" && <Badge variant="destructive" className="w-fit">Improve</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">{course.completion}%</span>
                  <span className={cn("text-sm", course.status === "top" ? "text-emerald-500" : course.status === "improve" ? "text-amber-500" : "text-muted-foreground")}>{course.average}%</span>
                  <span className="text-sm text-muted-foreground">{course.studyTime}</span>
                  <Progress value={course.completion} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.08 }}>
        <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader>
              <CardTitle>AI Insights Summary</CardTitle>
              <CardDescription>Generated messages will flow from generateAIInsightAPI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{aiSummary}</p>
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-xs uppercase tracking-wide text-muted-foreground dark:bg-slate-900/60">
                Placeholder for conversational insight generation.
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" /> Generate New Insight
              </Button>
              <Button onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" /> Export Full Report (PDF)
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader>
              <CardTitle>Study Time Distribution</CardTitle>
              <CardDescription>Mock data for study allocation. Swap with fetchLearningReportAPI.</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={studyDistribution} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                    {studyDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.1 }}>
        <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
          <CardHeader>
            <CardTitle>Goal Achievement</CardTitle>
            <CardDescription>Monitor commitments and adjust learning rhythms accordingly.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {learningGoals.map((goal) => (
              <div key={goal.id} className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white/85 p-4 dark:bg-slate-950/70">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{goal.label}</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">Goal</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: <span className="font-semibold text-foreground">{goal.target}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Current: <span className={cn("font-semibold", toneClasses[goal.tone])}>{goal.current}</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">{goal.progress}% progress</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
