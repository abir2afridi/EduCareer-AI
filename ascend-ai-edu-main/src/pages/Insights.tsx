import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Activity,
  AlertTriangle,
  Brain,
  Download,
  LineChart as LineChartIcon,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarRadiusAxis,
  Legend,
  ComposedChart,
} from "recharts";

const summaryStats = [
  { title: "GPA", value: "3.86", delta: "+0.12", tone: "text-emerald-500" },
  { title: "Attendance", value: "94%", delta: "+4%", tone: "text-sky-500" },
  { title: "Completion", value: "78%", delta: "12 modules", tone: "text-primary" },
  { title: "Engagement", value: "High", delta: "Focus index 82", tone: "text-amber-500" },
];

const performanceTrend = [
  { week: "W1", score: 78 },
  { week: "W2", score: 82 },
  { week: "W3", score: 86 },
  { week: "W4", score: 89 },
  { week: "W5", score: 92 },
  { week: "W6", score: 94 },
];

const courseScores = [
  { course: "AI Studio", score: 94 },
  { course: "Data Viz", score: 88 },
  { course: "Cyber Sec", score: 82 },
  { course: "UX Systems", score: 90 },
];

const strengthSplit = [
  { area: "Strengths", value: 62 },
  { area: "Growth", value: 38 },
];

const strengthsColors = ["#22c55e", "#f97316"];

const performanceTimeline = [
  { label: "Week 1", score: 78, predicted: 80 },
  { label: "Week 2", score: 82, predicted: 84 },
  { label: "Week 3", score: 86, predicted: 88 },
  { label: "Week 4", score: 89, predicted: 91 },
  { label: "Week 5", score: 92, predicted: 94 },
  { label: "Week 6", score: 94, predicted: 96 },
];

const coursePerformance = [
  { name: "AI Studio", score: 94, instructor: "Dr. Park", credits: 4 },
  { name: "Data Viz", score: 78, instructor: "Prof. Ibrahim", credits: 3 },
  { name: "Cyber Sec", score: 61, instructor: "Dr. Li", credits: 4 },
  { name: "UX Systems", score: 88, instructor: "Alicia Gomez", credits: 2 },
];

const subjectRadar = [
  { subject: "Math", competency: 92, tip: "Extend leadership in advanced analytics by co-leading peer workshops." },
  { subject: "AI", competency: 88, tip: "Keep iterating on capstone experiments to maintain mastery." },
  { subject: "Cyber", competency: 63, tip: "Schedule two lab retakes and review incident response guides." },
  { subject: "Design", competency: 81, tip: "Pair with a mentor for rapid UI critique cycles." },
  { subject: "Writing", competency: 58, tip: "Draft weekly reflections focusing on storytelling clarity." },
];

const attendanceVsPerformance = [
  { segment: "Week 1", attendance: 88, performance: 80 },
  { segment: "Week 2", attendance: 90, performance: 84 },
  { segment: "Week 3", attendance: 92, performance: 86 },
  { segment: "Week 4", attendance: 93, performance: 88 },
  { segment: "Week 5", attendance: 95, performance: 92 },
];

const courseColor = (score: number) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#facc15";
  return "#f97316";
};

const weakestSubjects = subjectRadar
  .slice()
  .sort((a, b) => a.competency - b.competency)
  .slice(0, 2);

const predictions = [
  {
    course: "Machine Learning Studio",
    predicted: "A",
    risk: "Low",
    focus: "Maintain weekly model lab cadence to ensure mastery.",
  },
  {
    course: "Data Storytelling",
    predicted: "B+",
    risk: "Medium",
    focus: "Improve narrative flow and practice dashboard walkthroughs.",
  },
  {
    course: "Applied Cyber Security",
    predicted: "B",
    risk: "High",
    focus: "Schedule lab retries and review incident response drills.",
  },
];

const recommendations = [
  "Allocate 2 Pomodoro cycles to revise gradient boosting techniques.",
  "Revisit accessibility checklist before the next UX critique.",
  "Book a mentor session for cyber security labs this Thursday.",
  "Upload weekly reflections to keep engagement index above 80.",
];

const engagementRadial = [{ name: "Focus", value: 82, fill: "hsl(var(--primary))" }];

const activityLog = [
  {
    course: "AI Studio",
    activity: "Quiz attempt",
    result: "92%",
    date: "Oct 11, 2025",
  },
  {
    course: "Data Storytelling",
    activity: "Project milestone",
    result: "On track",
    date: "Oct 10, 2025",
  },
  {
    course: "Cyber Sec",
    activity: "Lab simulation",
    result: "Needs review",
    date: "Oct 9, 2025",
  },
  {
    course: "UX Systems",
    activity: "Peer critique",
    result: "Completed",
    date: "Oct 8, 2025",
  },
  {
    course: "AI Studio",
    activity: "Assignment upload",
    result: "Graded A",
    date: "Oct 7, 2025",
  },
];

const riskTone: Record<string, string> = {
  Low: "text-emerald-500",
  Medium: "text-amber-500",
  High: "text-rose-500",
};

const filters = ["All", "AI Studio", "Data Storytelling", "Cyber Sec", "UX Systems"];

export default function Insights() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [insightScope, setInsightScope] = useState<"weekly" | "monthly">("weekly");

  const filteredActivities = useMemo(() => {
    if (activeFilter === "All") return activityLog;
    return activityLog.filter((item) => item.course === activeFilter);
  }, [activeFilter]);

  const trendData = useMemo(() => {
    if (insightScope === "weekly") return performanceTimeline;
    return performanceTimeline.map((point, index) => ({
      ...point,
      score: Math.min(100, point.score + index * 1.5),
      predicted: Math.min(100, point.predicted + index * 1.8),
    }));
  }, [insightScope]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">AI Learning Insights</h1>
          <p className="text-muted-foreground">
            Intelligent analytics synthesizing performance data, engagement patterns, and AI predictions tailored to your journey.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={insightScope === "weekly" ? "default" : "outline"}
            onClick={() => setInsightScope("weekly")}
            className="gap-2"
          >
            <Activity className="h-4 w-4" /> Weekly
          </Button>
          <Button
            variant={insightScope === "monthly" ? "default" : "outline"}
            onClick={() => setInsightScope("monthly")}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" /> Monthly
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryStats.map((stat) => (
            <Card key={stat.title} className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">Live</Badge>
                </div>
                <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
                <p className={`text-sm font-medium ${stat.tone}`}>{stat.delta}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.05 }}>
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-primary" /> AI Progress Prediction
              </CardTitle>
              <CardDescription>Forecasted outcomes leverage quiz history, attendance rhythm, and engagement signals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {predictions.map((prediction) => (
                <div key={prediction.course} className="rounded-3xl border border-border/60 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">{prediction.course}</p>
                      <p className="text-sm text-muted-foreground">Recommended focus: {prediction.focus}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">Expected grade</span>
                        <span className="text-lg font-semibold text-primary">{prediction.predicted}</span>
                      </span>
                      <span className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">Risk</span>
                        <span className={`text-base font-semibold ${riskTone[prediction.risk]}`}>{prediction.risk}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-primary/15 via-primary/10 to-white/70 backdrop-blur-md dark:from-primary/20 dark:via-primary/10 dark:to-slate-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" /> Engagement Tracker
              </CardTitle>
              <CardDescription>AI-estimated focus index based on activity cadence.</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="60%" outerRadius="100%" data={engagementRadial} startAngle={180} endAngle={0}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar cornerRadius={16} dataKey="value" />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-2xl font-semibold text-foreground">82 / 100</p>
                <p className="text-sm text-muted-foreground">Consistency meter is stable. Keep daily micro-learning streaks active.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.08 }}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">📊 Performance Analytics</h2>
            <span className="text-sm text-muted-foreground">Powered by EduCareer AI trend engine</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
              <CardHeader className="gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LineChartIcon className="h-5 w-5 text-primary" /> Performance Over Time
                </CardTitle>
                <CardDescription>Includes AI projected trendline for the selected scope.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
                    <XAxis dataKey="label" stroke="currentColor" className="text-xs text-muted-foreground" />
                    <YAxis stroke="currentColor" className="text-xs text-muted-foreground" domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={2} name="AI Forecast" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
              <CardHeader className="gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" /> Course-wise Performance
                </CardTitle>
                <CardDescription>Color coded by AI confidence tiers.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coursePerformance}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
                    <XAxis dataKey="name" stroke="currentColor" className="text-xs text-muted-foreground" />
                    <YAxis stroke="currentColor" className="text-xs text-muted-foreground" domain={[0, 100]} />
                    <Tooltip formatter={(value, _name, props) => [`${value}%`, `${props.payload.instructor} • ${props.payload.credits} credits`]} />
                    <Legend />
                    <Bar dataKey="score" radius={[8, 8, 4, 4]}>
                      {coursePerformance.map((entry) => (
                        <Cell key={entry.name} fill={courseColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
              <CardHeader className="gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" /> Subject Strength & Weakness
                </CardTitle>
                <CardDescription>Radar comparison sourced from AI competency estimator.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={subjectRadar} outerRadius={110}>
                    <PolarGrid stroke="rgba(148,163,184,0.3)" />
                    <PolarAngleAxis dataKey="subject" stroke="currentColor" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={4} stroke="currentColor" />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Competency"]} />
                    <Radar dataKey="competency" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>
                    Weakest focus areas: {weakestSubjects.map((subject) => subject.subject).join(", ")} — queue AI review sessions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
              <CardHeader className="gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" /> Attendance vs Performance
                </CardTitle>
                <CardDescription>Correlates presence with scoring across recent periods.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={attendanceVsPerformance}>
                    <XAxis dataKey="segment" stroke="currentColor" className="text-xs text-muted-foreground" />
                    <YAxis yAxisId="left" stroke="hsl(var(--primary))" domain={[70, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="attendance" fill="hsl(var(--primary))" opacity={0.7} radius={[6, 6, 2, 2]} name="Attendance" />
                    <Line yAxisId="right" type="monotone" dataKey="performance" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} name="Performance" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-white/60 backdrop-blur-md dark:from-primary/20 dark:via-primary/10 dark:to-slate-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" /> AI Summary Insight
              </CardTitle>
              <CardDescription>Placeholder sample generated by the future insight summary API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Consistency improved by <span className="font-semibold text-foreground">15%</span> this month. Analytical subjects remain a stronghold while written communication needs deliberate practice.</p>
              <p>Focus next week: dedicate 30 minutes to "Narrative dashboards" and schedule a mentor sync to reinforce cyber security labs.</p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, delay: 0.1 }}>
        <div className="grid gap-4 lg:grid-cols-[1.7fr,1fr]">
          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-primary" /> Smart Recommendations
              </CardTitle>
              <CardDescription>Generated using performancePredictionAPI and recommendationsAPI placeholders.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[260px] pr-2">
                <div className="space-y-3">
                  {recommendations.map((text, index) => (
                    <div key={text} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 p-4 dark:bg-slate-900/60">
                      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button className="w-full gap-2" variant="secondary">
                <Brain className="h-4 w-4" /> Request new AI plan
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-slate-50/80 via-white/80 to-primary/10 backdrop-blur-md dark:from-slate-950/80 dark:via-slate-950/70 dark:to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" /> Motivation Pulse
              </CardTitle>
              <CardDescription>Computed from engagement ledger and reflection cadence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Progress value={82} className="h-3" />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Consistency</span>
                  <span>82%</span>
                </div>
              </div>
              <div>
                <Progress value={68} className="h-3" />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Focus Index</span>
                  <span>68%</span>
                </div>
              </div>
              <div>
                <Progress value={91} className="h-3" />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Engagement streak</span>
                  <span>19 days</span>
                </div>
              </div>
              <Separator className="bg-border/60" />
              <p className="text-sm text-muted-foreground">Momentum is trending positively. Schedule short review bursts on lower scoring modules to maintain trajectory.</p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.12 }}>
        <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" /> Learning Activity Log
              </CardTitle>
              <CardDescription>Recent actions across courses. Filter to focus by module.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((entry) => (
                  <TableRow key={`${entry.course}-${entry.date}-${entry.activity}`}>
                    <TableCell className="font-medium text-foreground">{entry.course}</TableCell>
                    <TableCell>{entry.activity}</TableCell>
                    <TableCell>{entry.result}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{entry.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
