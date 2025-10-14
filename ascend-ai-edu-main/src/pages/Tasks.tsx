import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Layers3,
  ListFilter,
  Sparkles,
  Tag,
  TrendingUp,
  XCircle,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
  priority: "high" | "medium" | "low";
  remaining: string;
  aiPriority: "High Impact" | "Recommended" | "Standard";
  progress: { completed: number; total: number };
}

type StatusFilter = "all" | Task["status"];
type SortKey = "date" | "course" | "priority" | "ai";

const tasks: Task[] = [
  {
    id: "task-1",
    title: "AI Ethics Case Study",
    course: "AI Studio",
    dueDate: "Oct 16, 2025 • 4:00 PM",
    status: "pending",
    priority: "high",
    remaining: "2 days left",
    aiPriority: "High Impact",
    progress: { completed: 2, total: 5 },
  },
  {
    id: "task-2",
    title: "Gradient Boosting Lab",
    course: "Machine Learning Studio",
    dueDate: "Oct 18, 2025 • 6:00 PM",
    status: "pending",
    priority: "medium",
    remaining: "4 days left",
    aiPriority: "Recommended",
    progress: { completed: 1, total: 4 },
  },
  {
    id: "task-3",
    title: "Narrative Dashboard Draft",
    course: "Data Storytelling",
    dueDate: "Oct 20, 2025 • 11:59 PM",
    status: "pending",
    priority: "medium",
    remaining: "6 days left",
    aiPriority: "Standard",
    progress: { completed: 3, total: 6 },
  },
  {
    id: "task-4",
    title: "Accessibility Audit Feedback",
    course: "UX Systems",
    dueDate: "Oct 14, 2025 • 9:00 PM",
    status: "overdue",
    priority: "high",
    remaining: "18 hours overdue",
    aiPriority: "High Impact",
    progress: { completed: 4, total: 5 },
  },
  {
    id: "task-5",
    title: "Incident Response Simulation",
    course: "Cyber Security",
    dueDate: "Oct 22, 2025 • 5:00 PM",
    status: "pending",
    priority: "high",
    remaining: "8 days left",
    aiPriority: "Recommended",
    progress: { completed: 0, total: 3 },
  },
  {
    id: "task-6",
    title: "Portfolio Reflection Upload",
    course: "Career Portfolio Lab",
    dueDate: "Oct 12, 2025 • 8:00 PM",
    status: "completed",
    priority: "low",
    remaining: "Submitted",
    aiPriority: "Standard",
    progress: { completed: 5, total: 5 },
  },
];

const reminders = [
  {
    id: "reminder-1",
    label: "⚡ AI Mentor",
    message: "Quiz on Applied AI scheduled for Thursday 3:00 PM. Reserve revision slot tomorrow.",
  },
  {
    id: "reminder-2",
    label: "📘 Research Desk",
    message: "Upload AI research abstract before Oct 20 to unlock faculty feedback window.",
  },
];

const statusBadges: Record<Task["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
};

const priorityBadges: Record<Task["priority"], string> = {
  high: "bg-rose-500/15 text-rose-500",
  medium: "bg-amber-500/15 text-amber-500",
  low: "bg-emerald-500/15 text-emerald-500",
};

const statusSorter: SortKey[] = ["date", "course", "priority", "ai"];

const parseDueDate = (due: string) => new Date(due.replace(/•/g, ""));

const sortFunctions: Record<SortKey, (a: Task, b: Task) => number> = {
  date: (a, b) => parseDueDate(a.dueDate).getTime() - parseDueDate(b.dueDate).getTime(),
  course: (a, b) => a.course.localeCompare(b.course),
  priority: (a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    return order[a.priority] - order[b.priority];
  },
  ai: (a, b) => {
    const order = { "High Impact": 0, Recommended: 1, Standard: 2 } as const;
    return order[a.aiPriority] - order[b.aiPriority];
  },
};

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date");

  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    const overdue = tasks.filter((task) => task.status === "overdue").length;
    return { total, completed, pending, overdue };
  }, []);

  const filteredTasks = useMemo(() => {
    const taskPool = statusFilter === "all" ? tasks : tasks.filter((task) => task.status === statusFilter);
    const sorted = [...taskPool].sort(sortFunctions[sortBy]);
    return sorted;
  }, [statusFilter, sortBy]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Tasks & Deadlines</h1>
          <p className="text-muted-foreground">AI-curated schedule tracking for the next sprint. Stay ahead with smart prioritization.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <CalendarDays className="h-4 w-4" /> This Week
          </Button>
          <Button variant="outline" className="gap-2">
            <Layers3 className="h-4 w-4" /> Next 7 Days
          </Button>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" /> Ask AI Plan
          </Button>
        </div>
      </div>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Total Tasks</span>
              <p className="text-3xl font-semibold text-foreground">{summary.total}</p>
              <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
                +2 new this week
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Completed</span>
              <p className="text-3xl font-semibold text-foreground">{summary.completed}</p>
              <Badge variant="secondary" className="w-fit bg-emerald-500/15 text-emerald-500">
                Great momentum
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Pending</span>
              <p className="text-3xl font-semibold text-foreground">{summary.pending}</p>
              <Badge variant="secondary" className="w-fit bg-amber-500/15 text-amber-500">
                Focus today
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Overdue</span>
              <p className="text-3xl font-semibold text-rose-500">{summary.overdue}</p>
              <Badge variant="secondary" className="w-fit bg-rose-500/15 text-rose-500">
                Immediate action
              </Badge>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.05 }}>
        <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-white/70 backdrop-blur-md dark:from-primary/20 dark:via-primary/10 dark:to-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-primary" /> Smart Reminders
            </CardTitle>
            <CardDescription>AI will surface nudges as deadlines approach. Hook into reminders API here.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[130px] pr-2">
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-2xl border border-border/60 bg-white/75 p-4 text-sm text-muted-foreground dark:bg-slate-950/70">
                    <span className="font-semibold text-primary">{reminder.label}:</span> {reminder.message}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
        <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListFilter className="h-5 w-5 text-primary" /> Task Queue
              </CardTitle>
              <CardDescription>Use filters and sorting to view what matters now. AI ranking placeholders included.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1 dark:bg-slate-900/60">
                {["all", "pending", "completed", "overdue"].map((value) => (
                  <Button
                    key={value}
                    variant={statusFilter === value ? "default" : "ghost"}
                    size="sm"
                    className="capitalize"
                    onClick={() => setStatusFilter(value as StatusFilter)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1 dark:bg-slate-900/60">
                {statusSorter.map((value) => (
                  <Button
                    key={value}
                    variant={sortBy === value ? "default" : "ghost"}
                    size="sm"
                    className="capitalize"
                    onClick={() => setSortBy(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <AnimatePresence>
              {filteredTasks.map((task) => {
                const completionPercent = (task.progress.completed / task.progress.total) * 100;
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white/85 p-5 shadow-sm transition hover:shadow-md dark:bg-slate-950/70"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                          <Badge className={`${statusBadges[task.status]} capitalize`}>{task.status}</Badge>
                          <Badge className={`${priorityBadges[task.priority]} capitalize`}>{task.priority} priority</Badge>
                          {task.aiPriority === "High Impact" && (
                            <Badge className="bg-primary/15 text-primary">AI Priority: 🔺 {task.aiPriority}</Badge>
                          )}
                          {task.aiPriority === "Recommended" && (
                            <Badge className="bg-sky-500/15 text-sky-500">AI Priority: {task.aiPriority}</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {task.dueDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            {task.course}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {task.remaining}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {task.status === "completed" ? (
                          <Button size="sm" variant="outline" className="gap-2 text-emerald-500">
                            <CheckCircle2 className="h-4 w-4" />
                            Submitted
                          </Button>
                        ) : task.status === "overdue" ? (
                          <Button size="sm" variant="destructive" className="gap-2">
                            <XCircle className="h-4 w-4" />
                            Resolve now
                          </Button>
                        ) : (
                          <Button size="sm" className="gap-2">
                            <Flame className="h-4 w-4" />
                            Start now
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Course progress: {task.progress.completed} of {task.progress.total} complete
                        </span>
                        <span>{Math.round(completionPercent)}%</span>
                      </div>
                      <Progress value={completionPercent} className="h-2" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Separator className="bg-border/60" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Need something else? Export to calendar or sync with mentor once API is connected.</span>
              <Button variant="ghost" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Advanced filters
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.1 }}>
        <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" /> AI Planning Insight
            </CardTitle>
            <CardDescription>Future integration: performancePredictionAPI will refine scheduling heuristics here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>AI suggests finishing the gradient boosting lab before Friday to unlock advanced mentor feedback.</p>
            <p>Schedule a 25-minute rehearsal for the cyber incident simulation—risk score flagged as high due to overdue status.</p>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
