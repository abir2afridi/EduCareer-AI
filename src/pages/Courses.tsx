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
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  CalendarDays,
  Download,
  Filter,
  Layers3,
  Play,
  Sparkles,
  Users,
} from "lucide-react";

interface Course {
  id: string;
  name: string;
  instructor: string;
  subject: string;
  lastAccessed: string;
  progress: number;
  recommended: boolean;
  upcomingAssignment?: {
    title: string;
    dueDate: string;
    status: "on_track" | "due_soon" | "overdue";
  };
}

type FilterOption = "all" | "recommended" | "in-progress" | "completed";

const courses: Course[] = [
  {
    id: "mlx-201",
    name: "Machine Learning Studio",
    instructor: "Dr. Evelyn Park",
    subject: "AI Engineering",
    lastAccessed: "2 hours ago",
    progress: 68,
    recommended: true,
    upcomingAssignment: {
      title: "Gradient Boosting Lab",
      dueDate: "Tomorrow, 6:00 PM",
      status: "due_soon",
    },
  },
  {
    id: "ds-140",
    name: "Data Storytelling & Visual Analytics",
    instructor: "Prof. Samuel Ibrahim",
    subject: "Data Science",
    lastAccessed: "Yesterday",
    progress: 45,
    recommended: false,
    upcomingAssignment: {
      title: "Narrative Dashboard Draft",
      dueDate: "Friday, 11:59 PM",
      status: "on_track",
    },
  },
  {
    id: "ui-305",
    name: "UI Systems & Accessibility",
    instructor: "Alicia Gomez",
    subject: "Design Systems",
    lastAccessed: "3 days ago",
    progress: 82,
    recommended: true,
    upcomingAssignment: {
      title: "Design Audit Submission",
      dueDate: "Today, 9:00 PM",
      status: "due_soon",
    },
  },
  {
    id: "sec-220",
    name: "Applied Cyber Security",
    instructor: "Dr. Henry Li",
    subject: "Cyber Security",
    lastAccessed: "5 days ago",
    progress: 34,
    recommended: false,
    upcomingAssignment: {
      title: "Incident Response Simulation",
      dueDate: "Sunday, 5:00 PM",
      status: "on_track",
    },
  },
  {
    id: "pf-180",
    name: "Career Portfolio Lab",
    instructor: "Mentor Team",
    subject: "Career Prep",
    lastAccessed: "4 hours ago",
    progress: 92,
    recommended: false,
  },
];

const statusStyles: Record<NonNullable<Course["upcomingAssignment"]>["status"], string> = {
  on_track: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  due_soon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
};

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "recommended", label: "AI Picks" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function Courses() {
  const [filter, setFilter] = useState<FilterOption>("all");

  const filteredCourses = useMemo(() => {
    switch (filter) {
      case "recommended":
        return courses.filter((course) => course.recommended);
      case "in-progress":
        return courses.filter((course) => course.progress > 0 && course.progress < 95);
      case "completed":
        return courses.filter((course) => course.progress >= 95);
      default:
        return courses;
    }
  }, [filter]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 rounded-3xl border border-border/50 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:bg-slate-950/75 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Badge variant="outline" className="w-fit uppercase tracking-widest">My Courses</Badge>
            <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
            <p className="text-muted-foreground">
              Review enrolled courses, continue where you left off, and follow AI-backed suggestions tailored to your strengths.
              Keep your learning sprint aligned with upcoming milestones.
            </p>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Focus</p>
              <p className="text-base font-semibold text-primary">Resume Machine Learning Studio</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Momentum Snapshot</p>
              <p className="text-base font-semibold text-foreground">68% average course progress</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                onClick={() => setFilter(option.value)}
                className="gap-2"
              >
                {option.value === "recommended" ? <Sparkles className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-3xl" />
          <DotLottieReact
            src="https://lottie.host/6b1b59dc-eb62-4d2b-b957-d4ba28474003/MuJ6eAro54.lottie"
            autoplay
            loop
            className="relative h-48 w-48 md:h-56 md:w-56"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardHeader>
            <Badge className="w-fit gap-1 bg-primary/15 text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI Spotlight
            </Badge>
            <CardTitle className="text-xl">Your Recommended Focus</CardTitle>
            <CardDescription>
              Based on weekly performance reviews, AI suggests prioritizing these two courses to unlock your next milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {courses
              .filter((course) => course.recommended)
              .slice(0, 2)
              .map((course) => (
                <div key={course.id} className="rounded-2xl border border-primary/20 bg-white/80 p-3 dark:bg-slate-950/60">
                  <p className="text-base font-semibold text-foreground">{course.name}</p>
                  <p className="text-xs text-muted-foreground">Instructor: {course.instructor}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress: {course.progress}%</span>
                    <span>Last accessed {course.lastAccessed}</span>
                  </div>
                </div>
              ))}
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full gap-2">
              Plan AI Study Sprint
              <Layers3 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-primary" /> Enrolled Courses Overview
            </CardTitle>
            <CardDescription>
              Monitor momentum across every course. Actions are placeholders until the LMS API is connected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredCourses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                No courses in this filter yet. Adjust filters or check back later.
              </div>
            ) : (
              filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex flex-col gap-4 rounded-3xl border p-5 transition ${
                    course.recommended
                      ? "border-primary/50 bg-primary/5 shadow-[0_20px_45px_-30px_rgba(59,130,246,0.6)]"
                      : "border-border/60 bg-white/85 shadow-sm dark:bg-slate-950/70"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-1 items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Users className="h-5 w-5" />
                      </span>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">{course.name}</h3>
                          {course.recommended && (
                            <Badge className="gap-1 bg-primary/15 text-primary">
                              <Sparkles className="h-3.5 w-3.5" /> AI Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Instructor: {course.instructor} · {course.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">Last accessed {course.lastAccessed}</p>
                      </div>
                    </div>
                    <div className="flex w-full flex-col items-start gap-2 md:w-auto md:items-end">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{course.progress}%</span>
                        complete
                      </div>
                      <div className="w-full md:w-48">
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {course.upcomingAssignment && (
                    <div className="flex flex-col gap-2 rounded-2xl bg-muted/40 p-3 text-sm dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={statusStyles[course.upcomingAssignment.status]}>
                          {course.upcomingAssignment.status === "due_soon"
                            ? "Due soon"
                            : course.upcomingAssignment.status === "on_track"
                            ? "On track"
                            : "Overdue"}
                        </Badge>
                        <span className="font-medium text-foreground">Upcoming Assignment:</span>
                        <span className="text-muted-foreground">{course.upcomingAssignment.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {course.upcomingAssignment.dueDate}
                      </div>
                    </div>
                  )}

                  <Separator className="bg-border/60" />

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Course ID: {course.id}</span>
                      <span>Subject: {course.subject}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="gap-2">
                        <Play className="h-4 w-4" /> Continue Course
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <CalendarDays className="h-4 w-4" /> View Assignments
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-2">
                        <Download className="h-4 w-4" /> Download Materials
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" /> Future Enhancements
          </CardTitle>
          <CardDescription>
            Planned AI integrations will push adaptive study playlists, schedule nudges, and resource bundles into these actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <p className="rounded-2xl border border-dashed border-border/60 p-4 text-muted-foreground">
            API-ready structure: replace mock data with live course feeds from GET /api/courses, including instructor avatars and resource links.
          </p>
          <p className="rounded-2xl border border-dashed border-border/60 p-4 text-muted-foreground">
            AI recommendations will soon adapt based on quiz outcomes, attendance heatmaps, and mentor feedback loops.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
