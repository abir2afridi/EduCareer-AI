import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Briefcase, TrendingUp, Target, Upload, ExternalLink, Award } from "lucide-react";

const careerPaths = [
  {
    id: 1,
    title: "AI/ML Engineer",
    match: 92,
    demand: "Very High",
    salary: "$120k - $180k",
    growth: "+35%",
    skills: ["Python", "TensorFlow", "Deep Learning", "Statistics"],
    skillsMatched: 3,
    skillsTotal: 4,
  },
  {
    id: 2,
    title: "Data Scientist",
    match: 88,
    demand: "High",
    salary: "$100k - $150k",
    growth: "+28%",
    skills: ["Python", "SQL", "Machine Learning", "Data Viz"],
    skillsMatched: 4,
    skillsTotal: 4,
  },
  {
    id: 3,
    title: "Full Stack Developer",
    match: 85,
    demand: "High",
    salary: "$90k - $140k",
    growth: "+22%",
    skills: ["JavaScript", "React", "Node.js", "Databases"],
    skillsMatched: 3,
    skillsTotal: 4,
  },
];

const skillGaps = [
  { skill: "Advanced ML Algorithms", current: 65, required: 90, priority: "High" },
  { skill: "Cloud Computing (AWS/Azure)", current: 45, required: 80, priority: "High" },
  { skill: "System Design", current: 55, required: 85, priority: "Medium" },
  { skill: "DevOps & CI/CD", current: 40, required: 75, priority: "Medium" },
];

const recommendations = [
  {
    type: "Course",
    title: "Advanced Machine Learning Specialization",
    platform: "Coursera",
    duration: "3 months",
    impact: "Closes 2 skill gaps",
  },
  {
    type: "Certificate",
    title: "AWS Certified Solutions Architect",
    platform: "AWS",
    duration: "2 months",
    impact: "Industry recognized",
  },
  {
    type: "Project",
    title: "Build an AI-powered Application",
    platform: "Self-paced",
    duration: "1 month",
    impact: "Portfolio boost",
  },
];

export default function Career() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-2">Career Guidance</h2>
          <p className="text-muted-foreground">AI-powered career planning and job matching</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Upload className="h-4 w-4 mr-2" />
          Upload Resume
        </Button>
      </div>

      {/* Career Path Matches */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Top Career Matches</h3>
        {careerPaths.map((path, index) => (
          <Card
            key={path.id}
            className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-semibold">{path.title}</h3>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20">
                    <span className="text-2xl font-bold text-primary">{path.match}%</span>
                    <span className="text-sm text-muted-foreground">Match</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Demand</p>
                    <Badge variant="default" className="bg-accent">{path.demand}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Salary Range</p>
                    <p className="font-semibold">{path.salary}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Growth</p>
                    <p className="font-semibold text-accent flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {path.growth}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Skills Match</span>
                    <span className="font-semibold">{path.skillsMatched}/{path.skillsTotal} skills</span>
                  </div>
                  <Progress value={(path.skillsMatched / path.skillsTotal) * 100} className="h-2 mb-3" />
                  <div className="flex flex-wrap gap-2">
                    {path.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:items-end">
                <Button className="bg-gradient-primary">
                  View Details
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline">Find Jobs</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skill Gaps */}
        <Card className="glass p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-secondary" />
            Skill Gap Analysis
          </h3>
          <div className="space-y-4">
            {skillGaps.map((gap, index) => (
              <div
                key={gap.skill}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{gap.skill}</span>
                  <Badge
                    variant={gap.priority === "High" ? "default" : "secondary"}
                    className={gap.priority === "High" ? "bg-destructive" : ""}
                  >
                    {gap.priority}
                  </Badge>
                </div>
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="absolute h-full bg-accent/30 transition-all"
                    style={{ width: `${gap.required}%` }}
                  />
                  <div
                    className="absolute h-full bg-gradient-primary transition-all"
                    style={{ width: `${gap.current}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                    <span>Current: {gap.current}%</span>
                    <span>Required: {gap.required}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Recommendations */}
        <Card className="glass p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Recommended Actions
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge variant="outline" className="mb-2">{rec.type}</Badge>
                    <h4 className="font-semibold">{rec.title}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{rec.platform}</span>
                  <span>•</span>
                  <span>{rec.duration}</span>
                </div>
                <div className="mt-2 text-sm font-medium text-primary">
                  ✓ {rec.impact}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Market Insights */}
      <Card className="glass p-6 bg-gradient-card">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-accent" />
          Job Market Insights
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary mb-2">2,840</p>
            <p className="text-sm text-muted-foreground">Open Positions</p>
            <p className="text-xs text-accent mt-1">in AI/ML field</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-secondary mb-2">+42%</p>
            <p className="text-sm text-muted-foreground">Growth Rate</p>
            <p className="text-xs text-accent mt-1">next 5 years</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-accent mb-2">$135k</p>
            <p className="text-sm text-muted-foreground">Median Salary</p>
            <p className="text-xs text-accent mt-1">for your skills</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
