import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle2, AlertCircle, Plus, Upload } from "lucide-react";

const upcomingTests = [
  { id: 1, title: "Data Structures Mid-term", course: "Computer Science", date: "Oct 20, 2025", time: "10:00 AM", duration: "2 hours", type: "Written" },
  { id: 2, title: "Calculus Quiz", course: "Mathematics", date: "Oct 22, 2025", time: "2:00 PM", duration: "1 hour", type: "MCQ" },
  { id: 3, title: "Physics Lab Practical", course: "Physics", date: "Oct 25, 2025", time: "9:00 AM", duration: "3 hours", type: "Practical" },
];

const completedTests = [
  { id: 1, title: "Python Basics Test", course: "CS", score: 95, maxScore: 100, grade: "A+", date: "Oct 10, 2025" },
  { id: 2, title: "Linear Algebra Quiz", course: "Math", score: 88, maxScore: 100, grade: "A", date: "Oct 8, 2025" },
  { id: 3, title: "Chemistry Lab Report", course: "Chem", score: 92, maxScore: 100, grade: "A", date: "Oct 5, 2025" },
  { id: 4, title: "English Essay", course: "Eng", score: 85, maxScore: 100, grade: "B+", date: "Oct 3, 2025" },
];

const assignments = [
  { id: 1, title: "Machine Learning Project", course: "AI & ML", dueDate: "Oct 18, 2025", status: "in-progress", progress: 70 },
  { id: 2, title: "Research Paper", course: "Research Methods", dueDate: "Oct 21, 2025", status: "not-started", progress: 0 },
  { id: 3, title: "Database Design", course: "DBMS", dueDate: "Oct 16, 2025", status: "submitted", progress: 100 },
];

export default function Assessments() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-2">Assessments</h2>
          <p className="text-muted-foreground">Track your tests, quizzes, and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border/50">
            <Upload className="h-4 w-4 mr-2" />
            Submit Work
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            New Assessment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="upcoming">Upcoming Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingTests.map((test, index) => (
            <Card
              key={test.id}
              className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{test.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{test.course}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {test.date} at {test.time}
                      </span>
                      <Badge variant="secondary">{test.duration}</Badge>
                      <Badge variant="outline">{test.type}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button size="sm" className="bg-gradient-primary">Prepare</Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card className="glass p-6">
            <div className="space-y-4">
              {completedTests.map((test, index) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <CheckCircle2 className="h-8 w-8 text-accent flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{test.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{test.course}</span>
                        <span>•</span>
                        <span>{test.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{test.score}/{test.maxScore}</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <Badge
                        variant={test.grade.startsWith('A') ? 'default' : 'secondary'}
                        className="text-lg px-3 py-1"
                      >
                        {test.grade}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass p-6 bg-gradient-card">
            <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary mb-1">90%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent mb-1">A</p>
                <p className="text-sm text-muted-foreground">Average Grade</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-secondary mb-1">{completedTests.length}</p>
                <p className="text-sm text-muted-foreground">Tests Completed</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {assignments.map((assignment, index) => (
            <Card
              key={assignment.id}
              className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    assignment.status === 'submitted' ? 'bg-accent/20' :
                    assignment.status === 'in-progress' ? 'bg-primary/20' : 'bg-muted/30'
                  }`}>
                    {assignment.status === 'submitted' ? (
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                    ) : assignment.status === 'in-progress' ? (
                      <Clock className="h-6 w-6 text-primary" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{assignment.course}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">Due: {assignment.dueDate}</span>
                      <Badge
                        variant={
                          assignment.status === 'submitted' ? 'default' :
                          assignment.status === 'in-progress' ? 'secondary' : 'outline'
                        }
                      >
                        {assignment.status === 'submitted' ? 'Submitted' :
                         assignment.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant={assignment.status === 'submitted' ? 'outline' : 'default'}
                  className={assignment.status === 'in-progress' ? 'bg-gradient-primary' : ''}
                >
                  {assignment.status === 'submitted' ? 'View' : 'Continue'}
                </Button>
              </div>
              {assignment.status !== 'not-started' && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{assignment.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary transition-all"
                      style={{ width: `${assignment.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
