import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle2, Play, Lock } from "lucide-react";

const learningPaths = [
  {
    id: 1,
    title: "Data Science Fundamentals",
    level: "Beginner",
    progress: 65,
    duration: "12 weeks",
    modules: 8,
    completed: 5,
    status: "In Progress",
    color: "primary"
  },
  {
    id: 2,
    title: "AI & Machine Learning",
    level: "Intermediate",
    progress: 30,
    duration: "16 weeks",
    modules: 12,
    completed: 4,
    status: "In Progress",
    color: "secondary"
  },
  {
    id: 3,
    title: "Web Development Bootcamp",
    level: "Beginner",
    progress: 100,
    duration: "10 weeks",
    modules: 10,
    completed: 10,
    status: "Completed",
    color: "accent"
  },
  {
    id: 4,
    title: "Advanced Python Programming",
    level: "Advanced",
    progress: 0,
    duration: "14 weeks",
    modules: 14,
    completed: 0,
    status: "Not Started",
    color: "muted"
  },
];

const modules = [
  { id: 1, title: "Introduction to Python", status: "completed", duration: "2h 30m" },
  { id: 2, title: "Data Structures & Algorithms", status: "completed", duration: "3h 15m" },
  { id: 3, title: "NumPy & Pandas Basics", status: "completed", duration: "2h 45m" },
  { id: 4, title: "Data Visualization", status: "completed", duration: "3h 00m" },
  { id: 5, title: "Statistical Analysis", status: "in-progress", duration: "3h 30m" },
  { id: 6, title: "Machine Learning Intro", status: "locked", duration: "4h 00m" },
  { id: 7, title: "Deep Learning Basics", status: "locked", duration: "4h 30m" },
  { id: 8, title: "Final Project", status: "locked", duration: "6h 00m" },
];

export default function Learning() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Personalized Learning Paths</h2>
        <p className="text-muted-foreground">AI-curated courses tailored to your career goals</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Paths */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Learning Paths</h3>
            {learningPaths.map((path, index) => (
              <Card
                key={path.id}
                className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">{path.title}</h4>
                      <Badge variant={path.status === "Completed" ? "default" : "secondary"}>
                        {path.level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {path.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {path.completed}/{path.modules} modules
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={path.progress === 0 ? "outline" : "default"}
                    className={path.progress > 0 ? "bg-gradient-primary" : ""}
                  >
                    {path.progress === 0 ? "Start" : path.progress === 100 ? "Review" : "Continue"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{path.progress}%</span>
                  </div>
                  <Progress value={path.progress} className="h-2" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Course Modules Sidebar */}
        <div className="space-y-6">
          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Course Modules
            </h3>
            <div className="space-y-3">
              {modules.map((module, index) => (
                <div
                  key={module.id}
                  className={`p-3 rounded-lg transition-all hover-scale ${
                    module.status === "completed"
                      ? "bg-accent/10 border border-accent/30"
                      : module.status === "in-progress"
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/20 border border-muted/30 opacity-60"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {module.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                    ) : module.status === "in-progress" ? (
                      <Play className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{module.title}</p>
                      <p className="text-xs text-muted-foreground">{module.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass p-6 bg-gradient-card">
            <h3 className="text-lg font-semibold mb-3">AI Recommendations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Based on your progress, we recommend focusing on:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Complete Statistical Analysis module to maintain momentum</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Practice with 3 more coding exercises</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Review NumPy concepts before ML module</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
