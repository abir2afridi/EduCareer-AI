import { useAuth } from "@/components/auth-provider";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useCareerSurvey } from "@/hooks/useCareerSurvey";
import OverviewMetrics from "@/components/dashboard/OverviewMetrics";
import MonthlySalesChart from "@/components/dashboard/MonthlySalesChart";
import MonthlyTargetCard from "@/components/dashboard/MonthlyTargetCard";
import PerformanceAreaChart from "@/components/dashboard/PerformanceAreaChart";
import GeoDistributionCard from "@/components/dashboard/GeoDistributionCard";
import RecentActivityTable from "@/components/dashboard/RecentActivityTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  UserPlus,
  Filter,
  GraduationCap,
  CalendarCheck,
  Brain,
  Award,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Download,
  MessageCircle,
  Send,
  LucideIcon,
  Target,
  BookOpen,
  Trophy,
  ShieldCheck,
  Activity,
  Compass,
  Clock4,
  Users2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
};

type UpcomingStatus = "on_track" | "due_soon" | "overdue";

const overviewStats = [
  {
    title: "GPA / Grade Progress",
    value: "3.86",
    change: "+0.12",
    descriptor: "vs last term",
    icon: GraduationCap,
    accent: "from-violet-500/20 to-indigo-500/20",
  },
  {
    title: "Attendance",
    value: "94%",
    change: "+4%",
    descriptor: "Past 30 days",
    icon: CalendarCheck,
    accent: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "AI Focus Areas",
    value: "3",
    change: "2 new",
    descriptor: "Updated 2h ago",
    icon: Brain,
    accent: "from-sky-500/20 to-cyan-500/20",
  },
  {
    title: "Badges Earned",
    value: "12",
    change: "+3",
    descriptor: "This semester",
    icon: Award,
    accent: "from-amber-500/25 to-orange-500/25",
  },
];

const courseProgress = [
  {
    id: "ds101",
    name: "Data Science Fundamentals",
    icon: BookOpen,
    completion: 82,
    lastAccessed: "2 hours ago",
    nextStep: "Complete Unit 08 Labs",
    isRecommended: true,
  },
  {
    id: "ml201",
    name: "Machine Learning Studio",
    icon: Brain,
    completion: 64,
    lastAccessed: "Yesterday",
    nextStep: "Review gradient boosting",
    isRecommended: false,
  },
  {
    id: "ui301",
    name: "UI/UX for Developers",
    icon: Sparkles,
    completion: 48,
    lastAccessed: "3 days ago",
    nextStep: "Finish wireframe critique",
    isRecommended: false,
  },
];

const aiInsights = [
  {
    title: "Math Mastery",
    detail: "You improved Applied Mathematics performance by 8% this week. Keep practicing adaptive quizzes to maintain momentum.",
    impact: "Positive",
  },
  {
    title: "English Grammar",
    detail: "Focus 20 minutes on sentence structuring exercises. Recommended module: Grammar Pro Level 2.",
    impact: "Attention",
  },
  {
    title: "Study Rhythm",
    detail: "AI suggests a focused Pomodoro session on Thursday to increase consistency before quizzes.",
    impact: "Action",
  },
];

const quizPerformance = [
  { label: "Quiz 1", score: 78 },
  { label: "Quiz 2", score: 84 },
  { label: "Quiz 3", score: 92 },
  { label: "Quiz 4", score: 88 },
  { label: "Quiz 5", score: 95 },
];

const attendanceTrend = [
  { week: "Week 1", attendance: 88 },
  { week: "Week 2", attendance: 91 },
  { week: "Week 3", attendance: 94 },
  { week: "Week 4", attendance: 92 },
  { week: "Week 5", attendance: 96 },
];

const timeAllocation = [
  { subject: "AI Engineering", value: 14 },
  { subject: "Data Science", value: 10 },
  { subject: "Design Systems", value: 6 },
  { subject: "Career Prep", value: 4 },
];

const upcomingTasks: { title: string; due: string; status: UpcomingStatus; description: string }[] = [
  {
    title: "AI Ethics Case Study",
    due: "Tomorrow, 4:00 PM",
    status: "due_soon",
    description: "Submit reflections on bias mitigation.",
  },
  {
    title: "Data Science Capstone Milestone",
    due: "Friday, 11:59 PM",
    status: "on_track",
    description: "Upload exploratory data analysis notebook.",
  },
  {
    title: "Cyber Security Simulation",
    due: "Yesterday, 6:00 PM",
    status: "overdue",
    description: "Complete incident response walkthrough.",
  },
];

const quizRecommendations = [
  {
    topic: "Neural Network Optimization",
    difficulty: "Advanced",
    duration: "15 mins",
    focus: "Gradient descent variants",
  },
  {
    topic: "Statistical Inference",
    difficulty: "Intermediate",
    duration: "10 mins",
    focus: "Confidence intervals & hypothesis testing",
  },
  {
    topic: "UI Accessibility",
    difficulty: "Beginner",
    duration: "8 mins",
    focus: "ARIA labels and color contrast",
  },
];

const statusStyles: Record<UpcomingStatus, string> = {
  on_track: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  due_soon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
};

const statusEmoji: Record<UpcomingStatus, string> = {
  on_track: "🟢",
  due_soon: "🟠",
  overdue: "🔴",
};

const pieColors = ["#6366F1", "#0EA5E9", "#10B981", "#F97316"];

const habitProgress = [
  {
    title: "Focus blocks completed",
    value: "8 / 10",
    progress: 80,
    insight: "Two more sessions to beat last week’s streak.",
  },
  {
    title: "Practice quizzes taken",
    value: "4 / 6",
    progress: 66,
    insight: "Target one stats quiz to lift accuracy by 5%.",
  },
  {
    title: "Reflection entries logged",
    value: "5 / 5",
    progress: 100,
    insight: "AI tagged two insights as high impact—review them Friday.",
  },
];

const mentorSupport = {
  mentorName: "Ayesha Rahman",
  sessionTime: "Thursday · 4:00 PM",
  meetingType: "Virtual meet",
  agenda: [
    "Review updated capstone slides",
    "Lock internship shortlist",
    "Plan weekend practice session",
  ],
};

const pinnedResources = [
  {
    title: "Scholarship tracker",
    description: "3 applications ready for submission. Add supporting docs before Monday.",
    action: "Open tracker",
  },
  {
    title: "AI mentor notes",
    description: "Summary of last feedback cycle and action items agreed with Ayesha.",
    action: "Review notes",
  },
  {
    title: "Portfolio polish kit",
    description: "UI checklist and code snippets to tighten accessibility before demo day.",
    action: "Launch kit",
  },
];

const initialChatMessages: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    content: "Hi Sarah! I’m your AI study mentor. Ask me for course tips, scholarship info, or personalized learning paths any time.",
    timestamp: "just now",
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);
  const { survey } = useCareerSurvey(user?.uid);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const recommendedCourseId = useMemo(() => courseProgress.find((course) => course.isRecommended)?.id, []);

  const handleGenerateReport = () => {
    if (typeof window === "undefined") return;
    const reportWindow = window.open("", "_blank", "width=900,height=1200");
    if (!reportWindow) return;

    const now = new Date().toLocaleString();
    reportWindow.document.write(`
      <html>
        <head>
          <title>EduCareer AI Progress Report</title>
          <style>
            body { font-family: Inter, system-ui, sans-serif; padding: 2rem; color: #111827; }
            h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
            h2 { margin-top: 2rem; font-size: 1.25rem; }
            ul { padding-left: 1.25rem; }
            li { margin-bottom: 0.35rem; }
            .meta { font-size: 0.875rem; color: #6B7280; margin-bottom: 1.75rem; }
            table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
            th, td { border: 1px solid #E5E7EB; padding: 0.65rem; text-align: left; font-size: 0.95rem; }
          </style>
        </head>
        <body>
          <h1>EduCareer AI Progress Report</h1>
          <p class="meta">Generated on ${now} · Student: Sarah Johnson</p>
          <h2>Academic Overview</h2>
          <ul>
            <li>GPA / Grade Progress: 3.86 (up 0.12 vs last term)</li>
            <li>Attendance: 94% over the past 30 days</li>
            <li>Active AI Focus Areas: 3 (updated within the last 2 hours)</li>
            <li>Total Badges Earned: 12 this semester</li>
          </ul>
          <h2>Course Progress</h2>
          <table>
            <thead>
              <tr><th>Course</th><th>Completion</th><th>Last Accessed</th><th>Next Step</th></tr>
            </thead>
            <tbody>
              ${courseProgress
                .map(
                  (course) => `
                    <tr>
                      <td>${course.name}${course.isRecommended ? " (AI Recommended)" : ""}</td>
                      <td>${course.completion}%</td>
                      <td>${course.lastAccessed}</td>
                      <td>${course.nextStep}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
          <h2>AI Learning Insights</h2>
          <ul>
            ${aiInsights
              .map((insight) => `<li><strong>${insight.title}:</strong> ${insight.detail}</li>`)
              .join("")}
          </ul>
          <h2>Upcoming Tasks</h2>
          <ul>
            ${upcomingTasks
              .map((task) => `<li>${task.title} – ${task.due} (${statusEmoji[task.status]} ${task.status.replace("_", " ")})</li>`)
              .join("")}
          </ul>
          <p style="margin-top: 2.5rem; font-size: 0.875rem; color: #6B7280;">This document was generated via EduCareer AI dashboard. Use Print &gt; Save as PDF to download the file.</p>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const handleSendChat = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: trimmed,
      timestamp: "just now",
    };

    const aiFollowUp: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content:
        "Thanks! I’ve logged that. I recommend revisiting the AI Assistant page for deeper guidance and booking a mentor slot this week.",
      timestamp: "a moment ago",
    };

    setChatMessages((prev) => [...prev, userMessage, aiFollowUp]);
    setChatInput("");
  };

  const displayName = profile?.name ?? user?.displayName ?? "Sarah Johnson";
  const primaryGoal = survey?.careerGoals?.[0] ?? "Finish ML Capstone";
  const primaryTrack = survey?.studyTracks?.[0] ?? "AI Engineering";

  const latestActivity = [
    {
      label: "Weekly Reflection",
      value: "Complete today",
      icon: Activity,
    },
    {
      label: "Career Track",
      value: primaryTrack,
      icon: Compass,
    },
    {
      label: "Next Milestone",
      value: primaryGoal,
      icon: Target,
    },
    {
      label: "Mentor Sync",
      value: "Book now",
      icon: Users2,
    },
  ];

  const learningPace = 12;

  return (
    <div className="relative space-y-10 pb-24">
      <section className="overflow-hidden rounded-4xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-background p-8 shadow-lg transition-all">
        <div className="grid gap-8 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">Student Dashboard</Badge>
              <span className="rounded-full bg-white/60 px-3 py-1 text-xs uppercase tracking-[0.35em] text-muted-foreground backdrop-blur">
                Live · AI Powered
              </span>
            </div>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-4xl">Hey {displayName.split(" ")[0]}, here’s your focus for today</h1>
                <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                  Your AI mentor lined up study blocks, tracked your progress, and surfaced the next best actions. Keep your streak alive by completing one focus area and checking in with your mentor.
                </p>
              </div>
              <div className="flex items-center gap-4 rounded-3xl border border-border/50 bg-white/80 p-4 shadow-sm backdrop-blur dark:bg-slate-950/70">
                <Avatar className="h-14 w-14 border border-white/70 shadow-md">
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {displayName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">This week’s momentum</p>
                  <p className="text-2xl font-semibold text-foreground">{learningPace} hrs focused</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-3xl border border-border/50 bg-background/30 p-1">
                <TabsTrigger value="overview" className="rounded-2xl text-xs uppercase tracking-widest">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="wellbeing" className="rounded-2xl text-xs uppercase tracking-widest">
                  Wellbeing
                </TabsTrigger>
                <TabsTrigger value="journey" className="rounded-2xl text-xs uppercase tracking-widest">
                  Career Journey
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {latestActivity.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-4 rounded-3xl border border-border/50 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:border-primary/40 dark:bg-slate-950/70"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">{item.label}</p>
                        <p className="mt-1 text-base font-semibold text-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="wellbeing" className="mt-6">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Energy vs Focus</CardTitle>
                        <CardDescription>See where your study energy peaks.</CardDescription>
                      </div>
                      <Clock4 className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { day: "Mon", energy: 68, focus: 62 },
                            { day: "Tue", energy: 74, focus: 70 },
                            { day: "Wed", energy: 80, focus: 78 },
                            { day: "Thu", energy: 72, focus: 66 },
                            { day: "Fri", energy: 64, focus: 60 },
                            { day: "Sat", energy: 58, focus: 55 },
                            { day: "Sun", energy: 62, focus: 59 },
                          ]}
                        >
                          <defs>
                            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.25)" />
                          <XAxis dataKey="day" stroke="currentColor" className="text-xs text-muted-foreground" />
                          <YAxis stroke="currentColor" className="text-xs text-muted-foreground" domain={[40, 90]} />
                          <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
                          <Legend verticalAlign="top" height={24} />
                          <Area
                            type="monotone"
                            dataKey="energy"
                            stroke="hsl(var(--primary))"
                            fill="url(#energyGradient)"
                            strokeWidth={2.5}
                          />
                          <Area type="monotone" dataKey="focus" stroke="#0EA5E9" fill="#0EA5E915" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-white/60 backdrop-blur-md dark:from-primary/20 dark:via-primary/10 dark:to-slate-950/70">
                    <CardHeader>
                      <CardTitle className="text-base">Mindful Wins</CardTitle>
                      <CardDescription>Celebrate small victories to stay energized.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>• Completed 3 focused Pomodoros yesterday.</p>
                      <p>• Logged gratitude entry about team hackathon.</p>
                      <p>• Took a 20-minute outdoor walk after study block.</p>
                      <Button className="mt-3 w-full gap-2" variant="secondary">
                        Log a mindful habit
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="journey" className="mt-6">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
                    <CardHeader>
                      <CardTitle className="text-base">Career GPS</CardTitle>
                      <CardDescription>AI tracks how close you are to your target role.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl border border-border/50 p-4">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">Desired role</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">{primaryGoal}</p>
                        </div>
                        <div className="rounded-3xl border border-border/50 p-4">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">Readiness</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">70%</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Milestone roadmap</p>
                        <div className="mt-3 grid gap-3 text-sm">
                          {["Polish portfolio", "Complete AI quiz", "Prepare mentor questions"].map((action, index) => (
                            <div key={action + index} className="flex items-start gap-3 rounded-2xl border border-border/50 p-3">
                              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-foreground">{action}</p>
                                <p className="text-muted-foreground">Auto-generated milestone from your AI mentor.</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
                    <CardHeader>
                      <CardTitle className="text-base">Momentum Log</CardTitle>
                      <CardDescription>Last 7 days of notable actions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ScrollArea className="h-[220px] pr-2">
                        <div className="space-y-3 text-sm text-muted-foreground">
                          {["Submitted AI ethics case study (97%)", "Booked mentor session for Thursday", "Completed adaptive quiz: Neural Networks", "Shared capstone draft in cohort channel"].map((event, index) => (
                            <div key={event + index} className="flex items-start gap-3 rounded-2xl border border-border/50 p-3">
                              <span className="mt-1 text-lg">•</span>
                              <p>{event}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="relative">
            <div className="absolute -left-16 top-16 hidden h-56 w-56 rounded-full bg-primary/20 blur-3xl md:block" />
            <div className="absolute -right-12 bottom-12 hidden h-64 w-64 rounded-full bg-primary/25 blur-3xl md:block" />
            <Card className="relative z-10 border-none bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground shadow-xl">
              <CardHeader className="space-y-4">
                <CardTitle className="text-xl font-semibold">Today’s suggested focus stack</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  AI curated these three micro-actions to keep your streak alive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">1</span>
                    <div>
                      <p className="font-semibold">Review ML Lab highlights</p>
                      <p className="text-primary-foreground/70">10-minute walkthrough of flagged lab exercises.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">2</span>
                    <div>
                      <p className="font-semibold">Apply mentor feedback</p>
                      <p className="text-primary-foreground/70">Ship updates to your capstone slides before Thursday.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">3</span>
                    <div>
                      <p className="font-semibold">Log a reflection</p>
                      <p className="text-primary-foreground/70">Capture one aha moment from today’s study block.</p>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" className="w-full justify-center gap-2 bg-white/15 text-primary-foreground hover:bg-white/25">
                  Start focus timer
                  <Clock4 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <OverviewMetrics />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <MonthlySalesChart />
          <MonthlyTargetCard />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <PerformanceAreaChart />
          <GeoDistributionCard />
        </div>
        <RecentActivityTable />
      </section>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <motion.h2
            className="text-3xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            Student Intelligence Dashboard
          </motion.h2>
          <p className="text-muted-foreground">Personalized academic analytics, AI guidance, and next actions for Sarah Johnson.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Mentor
          </Button>
          <Button onClick={handleGenerateReport} className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 gap-2">
            <Download className="h-4 w-4" />
            Generate AI Progress Report
          </Button>
        </div>
      </div>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(3, minmax(0, 1fr))]">
          {overviewStats.map((stat) => {
            const IconComponent = stat.icon as LucideIcon;
            return (
              <Card key={stat.title} className="h-full overflow-hidden border-border/60 bg-white/80 backdrop-blur-md transition hover:shadow-lg dark:bg-slate-950/70">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{stat.value}</p>
                    </div>
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent}`}>
                      <IconComponent className="h-5 w-5 text-primary" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {stat.change}
                    </Badge>
                    <span className="text-muted-foreground">{stat.descriptor}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Card className="col-span-full overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-white to-emerald-50 p-6 backdrop-blur-md dark:from-slate-950/80 dark:via-slate-950/70 dark:to-primary/10">
            <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
              <div className="space-y-4">
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">Progress Digest</Badge>
                <h3 className="text-2xl font-semibold text-foreground">Where you shined this week</h3>
                <p className="text-muted-foreground">
                  Your GPA momentum stayed strong, attendance improved, and AI found two new focus areas worth exploring. Keep this pace to unlock the Scholarship milestone waiting for you.
                </p>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-white/75 p-3 text-center backdrop-blur-sm dark:bg-slate-950/60">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">GPA Trend</p>
                    <p className="text-xl font-semibold text-primary">+0.12</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-white/75 p-3 text-center backdrop-blur-sm dark:bg-slate-950/60">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Attendance</p>
                    <p className="text-xl font-semibold text-primary">94%</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-white/75 p-3 text-center backdrop-blur-sm dark:bg-slate-950/60">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">New Focus</p>
                    <p className="text-xl font-semibold text-primary">2 areas</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Reflection streak</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">5 days</p>
                  <p className="mt-1 text-sm text-muted-foreground">AI has logged meaningful reflections every day this week.</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Scholarship readiness</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">78%</p>
                  <p className="mt-1 text-sm text-muted-foreground">Complete one more capstone milestone to cross 80%.</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Mentor sentiment</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">Positive</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your mentor noted great progress on UI polish.</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Weekly focus</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">Design systems</p>
                  <p className="mt-1 text-sm text-muted-foreground">Stay in flow and submit the design critique by Friday.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <Card className="border-border/60 bg-white/80 backdrop-blur-md dark:bg-slate-950/70">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" /> Recent Courses Progress
              </CardTitle>
              <CardDescription>Track current course momentum and follow AI guidance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseProgress.map((course) => {
                const IconComponent = course.icon as LucideIcon;
                return (
                  <div
                    key={course.id}
                    className={`rounded-3xl border border-border/50 p-4 transition ${
                      course.isRecommended ? "ring-2 ring-primary/40" : "hover:border-border/70"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </span>
                        <div>
                          <p className="text-base font-semibold text-foreground">{course.name}</p>
                          <p className="text-sm text-muted-foreground">Last accessed {course.lastAccessed}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        {course.isRecommended && (
                          <Badge className="bg-primary/15 text-primary">
                            <Sparkles className="mr-1 h-3.5 w-3.5" /> AI Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Completion</span>
                        <span>{course.completion}%</span>
                      </div>
                      <Progress value={course.completion} className="h-2" />
                      <p className="text-sm text-muted-foreground">Next up: {course.nextStep}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-slate-50/80 via-white/80 to-primary/5 backdrop-blur-md dark:from-slate-950/80 dark:via-slate-950/70 dark:to-primary/10">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-primary" /> AI Learning Insights
              </CardTitle>
              <CardDescription>Adaptive coaching generated from weekly reflections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[280px] pr-2">
                <div className="space-y-4">
                  {aiInsights.map((insight) => (
                    <div key={insight.title} className="rounded-2xl border border-border/40 bg-white/70 p-4 text-sm dark:bg-slate-950/60">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">{insight.title}</p>
                        <Badge variant="outline" className="capitalize">
                          {insight.impact}
                        </Badge>
                      </div>
                      <p className="mt-2 text-muted-foreground">{insight.detail}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator className="bg-border/60" />
              <div className="rounded-2xl bg-primary/10 p-4 text-sm text-primary">
                "Remember: small, focused sessions beat marathon cramming. Book your AI mentor slot for Thursday." – EduCareer Copilot
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" /> Quiz Performance
              </CardTitle>
              <CardDescription>Latest evaluated quizzes</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizPerformance}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.25)" />
                  <XAxis dataKey="label" stroke="currentColor" className="text-xs text-muted-foreground" />
                  <YAxis stroke="currentColor" className="text-xs text-muted-foreground" domain={[60, 100]} />
                  <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.15)" }} />
                  <Bar dataKey="score" radius={[8, 8, 4, 4]} fill="url(#quizGradient)" />
                  <defs>
                    <linearGradient id="quizGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck className="h-5 w-5 text-primary" /> Attendance Trend
              </CardTitle>
              <CardDescription>Five-week engagement snapshot</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.25)" />
                  <XAxis dataKey="week" stroke="currentColor" className="text-xs text-muted-foreground" />
                  <YAxis stroke="currentColor" className="text-xs text-muted-foreground" domain={[80, 100]} />
                  <Tooltip cursor={{ stroke: "rgba(14, 165, 233, 0.4)", strokeWidth: 2 }} />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ strokeWidth: 2, r: 5, stroke: "hsl(var(--primary))", fill: "white" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-primary" /> Focus Time Distribution
              </CardTitle>
              <CardDescription>Time spent per subject (hrs)</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={timeAllocation} dataKey="value" nameKey="subject" innerRadius={60} outerRadius={110} paddingAngle={4}>
                    {timeAllocation.map((entry, index) => (
                      <Cell key={entry.subject} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70 xl:col-span-2">
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck className="h-5 w-5 text-primary" /> Upcoming Tasks & Deadlines
              </CardTitle>
              <CardDescription>Stay ahead with priority alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.title} className="flex flex-col gap-2 rounded-2xl border border-border/60 p-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusStyles[task.status]}>{statusEmoji[task.status]} {task.status.replace("_", " ")}</Badge>
                      {task.status === "due_soon" && recommendedCourseId && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Focus course: {courseProgress.find((course) => course.id === recommendedCourseId)?.name}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-base font-semibold text-foreground">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CalendarCheck className="h-4 w-4" />
                    {task.due}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
              <CardHeader className="gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-primary" /> AI Quiz Recommendations
                </CardTitle>
                <CardDescription>Generated from /api/quiz/generate fallback data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quizRecommendations.map((quiz) => (
                  <div key={quiz.topic} className="rounded-2xl border border-border/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{quiz.topic}</p>
                        <p className="text-sm text-muted-foreground">Focus: {quiz.focus}</p>
                      </div>
                      <Badge variant="outline" className="text-xs uppercase">
                        {quiz.difficulty}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{quiz.duration}</span>
                      <Button size="sm" className="gap-1">
                        Start Quiz
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-white/60 backdrop-blur-md dark:from-primary/20 dark:via-primary/10 dark:to-slate-950/70">
              <CardHeader className="gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Career Guidance Snapshot
                </CardTitle>
                <CardDescription>Quick wins to reach your desired role.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-base font-semibold text-foreground">Target Role: Frontend Developer</p>
                <p className="text-muted-foreground">You’re 70% ready for Frontend Developer roles.</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Strengthen TypeScript design patterns for UI scaling.</li>
                  <li>• Complete portfolio case study on accessibility tuning.</li>
                  <li>• Book 30-min mentor review next Tuesday.</li>
                </ul>
                <Button variant="secondary" className="mt-2 w-full justify-center gap-2">
                  Explore Career Path
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-full max-w-sm rounded-3xl border border-border/70 bg-white/95 shadow-2xl backdrop-blur-lg dark:bg-slate-950/90"
          >
            <Card className="border-none bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between p-5">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-4 w-4 text-primary" /> AI Assistant
                  </CardTitle>
                  <CardDescription>Ask for study plans, feedback, or scholarships.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 p-5 pt-0">
                <ScrollArea className="h-64 pr-2">
                  <div className="space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-2xl p-3 text-sm ${
                          message.role === "assistant"
                            ? "bg-primary/10 text-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-line">{message.content}</p>
                        <span className="mt-1 block text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendChat} className="space-y-2">
                  <Textarea
                    rows={3}
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Ask anything about your courses, performance, or scholarships..."
                    className="resize-none"
                  />
                  <Button type="submit" className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105"
        onClick={() => setIsChatOpen((prev) => !prev)}
        aria-label="Toggle AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    </div>
  );
}
