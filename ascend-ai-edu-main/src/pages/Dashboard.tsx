import { Card } from "@/components/ui/card";
import { Users, BookOpen, TrendingUp, Award } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const stats = [
  { title: "Total Students", value: "1,248", icon: Users, color: "text-primary" },
  { title: "Active Courses", value: "32", icon: BookOpen, color: "text-secondary" },
  { title: "Avg Performance", value: "87%", icon: TrendingUp, color: "text-accent" },
  { title: "Certifications", value: "456", icon: Award, color: "text-primary" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2 gradient-text">Welcome to EduCareer AI</h2>
        <p className="text-muted-foreground">Your intelligent education & career management platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="glass p-6 hover:shadow-glow transition-all cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`h-12 w-12 ${stat.color} opacity-80`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">New student enrolled</p>
                  <p className="text-sm text-muted-foreground">{i} hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-secondary" />
              Top Performers
            </h3>
            <div className="space-y-4">
              {[
                { name: "Sarah Johnson", score: 95, course: "Data Science" },
                { name: "Michael Chen", score: 93, course: "AI Engineering" },
                { name: "Emma Davis", score: 91, course: "Web Development" },
              ].map((student, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.course}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">{student.score}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-secondary mb-2">
                  Student Intelligence Dashboard
                </p>
                <h3 className="text-2xl font-semibold mb-3">Personalized Snapshot: Sarah</h3>
                <p className="text-muted-foreground mb-4">
                  Personalized academic analytics, AI guidance, and next best actions to keep Sarah on track across her
                  Data Science journey.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span>Mastery Progress</span>
                    <span className="font-semibold text-primary">87%</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span>AI Guidance</span>
                    <span className="font-semibold text-secondary">"Review ML model overfitting drills"</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Next Action</span>
                    <span className="font-semibold text-accent">Schedule mentor sync</span>
                  </li>
                </ul>
              </div>
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-3xl" />
                <DotLottieReact
                  src="https://lottie.host/672e8695-444c-4e02-8b2f-7561c42b5c2a/XTiO9J61j7.lottie"
                  autoplay
                  loop
                  className="relative h-48 w-48"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
