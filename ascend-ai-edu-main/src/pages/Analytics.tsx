import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, Award, Clock, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const performanceData = [
  { subject: "Mathematics", score: 92, trend: "up", change: "+5%" },
  { subject: "Physics", score: 88, trend: "up", change: "+3%" },
  { subject: "Chemistry", score: 85, trend: "down", change: "-2%" },
  { subject: "Computer Science", score: 95, trend: "up", change: "+8%" },
  { subject: "English", score: 87, trend: "stable", change: "0%" },
];

const metrics = [
  { label: "Overall Performance", value: "89.4%", icon: Target, color: "primary", trend: "+4.2%" },
  { label: "Attendance Rate", value: "94%", icon: Users, color: "accent", trend: "+2%" },
  { label: "Avg Study Time", value: "5.2h/day", icon: Clock, color: "secondary", trend: "+0.5h" },
  { label: "Achievements", value: "23", icon: Award, color: "primary", trend: "+5" },
];

const weeklyActivity = [
  { day: "Mon", hours: 4.5, assignments: 3 },
  { day: "Tue", hours: 6.2, assignments: 5 },
  { day: "Wed", hours: 5.8, assignments: 4 },
  { day: "Thu", hours: 7.1, assignments: 6 },
  { day: "Fri", hours: 4.9, assignments: 3 },
  { day: "Sat", hours: 3.2, assignments: 2 },
  { day: "Sun", hours: 5.5, assignments: 4 },
];

export default function Analytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Performance Analytics</h2>
        <p className="text-muted-foreground">Track your academic progress and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card
            key={metric.label}
            className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <metric.icon className={`h-8 w-8 text-${metric.color}`} />
              <span className="text-sm font-medium text-accent">{metric.trend}</span>
            </div>
            <div>
              <p className="text-2xl font-bold mb-1">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="performance">Subject Performance</TabsTrigger>
          <TabsTrigger value="activity">Weekly Activity</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6">Subject-wise Performance</h3>
            <div className="space-y-6">
              {performanceData.map((subject, index) => (
                <div
                  key={subject.subject}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{subject.subject}</span>
                      {subject.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-accent" />
                      ) : subject.trend === "down" ? (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      ) : null}
                      <span className={`text-sm ${subject.trend === "up" ? "text-accent" : subject.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                        {subject.change}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{subject.score}%</span>
                  </div>
                  <Progress value={subject.score} className="h-3" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6">Weekly Study Activity</h3>
            <div className="space-y-4">
              {weeklyActivity.map((day, index) => (
                <div
                  key={day.day}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-16 text-center">
                    <p className="font-semibold">{day.day}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Study Hours</span>
                      <span className="font-semibold">{day.hours}h</span>
                    </div>
                    <Progress value={(day.hours / 8) * 100} className="h-2" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Assignments</p>
                    <p className="text-xl font-bold text-primary">{day.assignments}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="glass p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Strengths
              </h3>
              <ul className="space-y-3">
                {[
                  "Exceptional performance in Computer Science (+8%)",
                  "Consistent improvement in Mathematics",
                  "High attendance rate (94%)",
                  "Above-average study time commitment"
                ].map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-accent text-lg">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="glass p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Growth Areas
              </h3>
              <ul className="space-y-3">
                {[
                  "Chemistry needs attention (2% decrease)",
                  "Consider additional practice in weak topics",
                  "Balance study time across all subjects",
                  "Review missed assignments"
                ].map((area, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-secondary text-lg">→</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="glass p-6 bg-gradient-card">
            <h3 className="text-lg font-semibold mb-3">AI Recommendation</h3>
            <p className="text-muted-foreground mb-4">
              Based on your performance patterns, here's what we suggest:
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Focus on Chemistry</p>
                  <p className="text-muted-foreground">Allocate 30 more minutes daily to chemistry concepts and practice problems</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10">
                <Clock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Optimize Study Schedule</p>
                  <p className="text-muted-foreground">Your peak performance hours are Tuesday-Thursday. Schedule difficult topics then</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
