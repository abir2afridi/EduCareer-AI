import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Users, GraduationCap, BarChart3, FileText } from "lucide-react";

const insights = [
  {
    title: "Student Performance Trends",
    description: "Average GPA increased by 12% after implementing AI-powered personalized learning",
    impact: "High",
    metric: "+12%",
    icon: TrendingUp,
  },
  {
    title: "Dropout Risk Analysis",
    description: "Early intervention reduced dropout rate by 18% in at-risk students",
    impact: "Critical",
    metric: "-18%",
    icon: Users,
  },
  {
    title: "Teaching Method Effectiveness",
    description: "Hybrid learning models showed 25% better engagement than traditional methods",
    impact: "High",
    metric: "+25%",
    icon: GraduationCap,
  },
];

const reports = [
  {
    id: 1,
    title: "Annual Performance Analysis 2024-25",
    type: "Performance Report",
    date: "Oct 1, 2025",
    insights: 15,
    pages: 48,
  },
  {
    id: 2,
    title: "AI Learning Impact Study",
    type: "Research Paper",
    date: "Sep 15, 2025",
    insights: 22,
    pages: 65,
  },
  {
    id: 3,
    title: "Career Placement Success Rate",
    type: "Analytics Report",
    date: "Aug 30, 2025",
    insights: 18,
    pages: 32,
  },
];

const metrics = [
  { label: "Student Satisfaction", value: "92%", trend: "+5%", color: "primary" },
  { label: "Placement Rate", value: "87%", trend: "+8%", color: "accent" },
  { label: "Avg GPA Improvement", value: "12%", trend: "+3%", color: "secondary" },
  { label: "Research Publications", value: "45", trend: "+12", color: "primary" },
];

const predictions = [
  {
    category: "Enrollment",
    prediction: "15% increase expected in next semester",
    confidence: 92,
    recommendation: "Prepare additional faculty and resources",
  },
  {
    category: "Performance",
    prediction: "AI-assisted students will show 20% better outcomes",
    confidence: 88,
    recommendation: "Expand AI tool integration across all courses",
  },
  {
    category: "Employability",
    prediction: "85% placement rate achievable with current trajectory",
    confidence: 85,
    recommendation: "Focus on skill gap programs for top careers",
  },
];

export default function Research() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Research & Policy Insights</h2>
        <p className="text-muted-foreground">Data-driven insights for institutional excellence</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card
            key={metric.label}
            className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <span className="text-sm font-medium text-accent">{metric.trend}</span>
            </div>
            <p className={`text-3xl font-bold text-${metric.color}`}>{metric.value}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight, index) => (
            <Card
              key={insight.title}
              className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <insight.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold">{insight.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={insight.impact === "Critical" ? "default" : "secondary"}
                        className={insight.impact === "Critical" ? "bg-destructive" : ""}
                      >
                        {insight.impact} Impact
                      </Badge>
                      <span className="text-2xl font-bold text-primary">{insight.metric}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </Card>
          ))}

          <Card className="glass p-6 bg-gradient-card">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Methodology Comparison
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Traditional Learning</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className="font-semibold">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retention</span>
                    <span className="font-semibold">72%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-semibold">75%</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">AI-Powered Learning</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className="font-semibold text-accent">93% (+25%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retention</span>
                    <span className="font-semibold text-accent">89% (+17%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-semibold text-accent">91% (+16%)</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictions.map((pred, index) => (
            <Card
              key={pred.category}
              className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{pred.category}</h3>
                      <p className="text-muted-foreground">{pred.prediction}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{pred.confidence}%</p>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm">
                      <span className="font-semibold">Recommendation:</span> {pred.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Card className="glass p-6 bg-gradient-card">
            <h3 className="text-lg font-semibold mb-3">Model Accuracy</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our AI prediction models are trained on 5+ years of institutional data
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary mb-1">94%</p>
                <p className="text-sm text-muted-foreground">Overall Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent mb-1">50k+</p>
                <p className="text-sm text-muted-foreground">Data Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary mb-1">15</p>
                <p className="text-sm text-muted-foreground">Prediction Models</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reports.map((report, index) => (
            <Card
              key={report.id}
              className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{report.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <Badge variant="outline">{report.type}</Badge>
                      <span>{report.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {report.insights} insights
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {report.pages} pages
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Preview</Button>
                  <Button size="sm" className="bg-gradient-primary">Download</Button>
                </div>
              </div>
            </Card>
          ))}

          <Button className="w-full bg-gradient-primary hover:opacity-90">
            <FileText className="h-4 w-4 mr-2" />
            Generate New Report
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
