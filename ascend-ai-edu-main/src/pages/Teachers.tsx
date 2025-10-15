import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Mail, Phone, Award } from "lucide-react";

const teachers = [
  {
    id: 1,
    name: "Dr. Emily Carter",
    email: "emily.carter@edu.com",
    phone: "+1 234-567-8901",
    department: "Computer Science",
    courses: ["AI & ML", "Data Structures", "Python"],
    rating: 4.8,
    students: 145,
    experience: "12 years",
  },
  {
    id: 2,
    name: "Prof. Michael Zhang",
    email: "michael.zhang@edu.com",
    phone: "+1 234-567-8902",
    department: "Mathematics",
    courses: ["Calculus", "Linear Algebra", "Statistics"],
    rating: 4.9,
    students: 132,
    experience: "15 years",
  },
  {
    id: 3,
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@edu.com",
    phone: "+1 234-567-8903",
    department: "Physics",
    courses: ["Quantum Physics", "Mechanics", "Thermodynamics"],
    rating: 4.7,
    students: 128,
    experience: "10 years",
  },
  {
    id: 4,
    name: "Prof. David Lee",
    email: "david.lee@edu.com",
    phone: "+1 234-567-8904",
    department: "Chemistry",
    courses: ["Organic Chemistry", "Biochemistry"],
    rating: 4.6,
    students: 115,
    experience: "8 years",
  },
];

export default function Teachers() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 rounded-3xl border border-border/50 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:bg-slate-950/75 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="outline" className="w-fit uppercase tracking-widest">Mentor Network</Badge>
              <h2 className="text-3xl font-bold gradient-text mt-2">Teacher Management</h2>
              <p className="text-muted-foreground">
                Manage faculty, track instructional impact, and surface AI nudges that keep your educator network aligned with
                learner outcomes.
              </p>
            </div>
            <Button className="bg-gradient-primary hover:opacity-90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Signal</p>
              <p className="text-base font-semibold text-primary">Mentor sync scheduled tonight</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Faculty Pulse</p>
              <p className="text-base font-semibold text-foreground">92% satisfaction this term</p>
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-3xl" />
          <DotLottieReact
            src="https://lottie.host/421f068f-1128-4ec0-818b-6323e40be4bb/E93DMvnPPk.lottie"
            autoplay
            loop
            className="relative h-48 w-48 md:h-56 md:w-56"
          />
        </div>
      </div>

      <Card className="glass p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers by name or department..."
              className="pl-10 bg-input border-border/50"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {teachers.map((teacher, index) => (
            <Card
              key={teacher.id}
              className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                    {teacher.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold mb-1">{teacher.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{teacher.department}</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.courses.map((course, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {course}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{teacher.rating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{teacher.students}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-secondary">{teacher.experience}</p>
                    <p className="text-xs text-muted-foreground">Experience</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="ghost" className="h-8 px-2">
                      <Mail className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2">
                      <Phone className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{teacher.email}</span>
                </div>
                <Button variant="outline" size="sm">View Profile</Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Top Rated
          </h3>
          <div className="space-y-3">
            {teachers.slice(0, 3).map((teacher, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                <span className="text-sm font-medium">{teacher.name.split(' ')[1]}</span>
                <span className="text-lg font-bold text-primary">{teacher.rating}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-3">Most Students</h3>
          <div className="space-y-3">
            {[...teachers].sort((a, b) => b.students - a.students).slice(0, 3).map((teacher, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                <span className="text-sm font-medium">{teacher.name.split(' ')[1]}</span>
                <span className="text-lg font-bold text-accent">{teacher.students}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-6 bg-gradient-card">
          <h3 className="text-lg font-semibold mb-3">Department Stats</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Faculty</span>
              <span className="font-semibold">{teachers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Rating</span>
              <span className="font-semibold">4.75</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Students</span>
              <span className="font-semibold">{teachers.reduce((sum, t) => sum + t.students, 0)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
