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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  Target,
  Upload,
  ExternalLink,
  Award,
  Sparkles,
  Search,
  Brain,
  MessageCircle,
  LineChart as LineChartIcon,
  Layers,
  Rocket,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

type CareerMatch = {
  id: string;
  title: string;
  score: number;
  demand: "High" | "Very High" | "Moderate";
  salary: string;
  growth: string;
  skills: string[];
  trend: { period: string; score: number }[];
  readiness: number;
};

type SkillGap = {
  skill: string;
  current: number;
  target: number;
};

type ResumeInsight = {
  id: string;
  label: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
};

const careerMatches: CareerMatch[] = [
  {
    id: "match-1",
    title: "AI Product Strategist",
    score: 91,
    demand: "Very High",
    salary: "$120k - $178k",
    growth: "+34%",
    skills: ["Applied AI", "Product Vision", "Stakeholder Alignment", "Experimentation"],
    trend: [
      { period: "Apr", score: 62 },
      { period: "May", score: 68 },
      { period: "Jun", score: 72 },
      { period: "Jul", score: 81 },
      { period: "Aug", score: 87 },
      { period: "Sep", score: 91 },
    ],
    readiness: 0.78,
  },
  {
    id: "match-2",
    title: "Data Science Consultant",
    score: 86,
    demand: "High",
    salary: "$108k - $156k",
    growth: "+29%",
    skills: ["Statistical Modelling", "Client Advisory", "SQL", "Storytelling"],
    trend: [
      { period: "Apr", score: 58 },
      { period: "May", score: 64 },
      { period: "Jun", score: 70 },
      { period: "Jul", score: 74 },
      { period: "Aug", score: 82 },
      { period: "Sep", score: 86 },
    ],
    readiness: 0.73,
  },
  {
    id: "match-3",
    title: "Innovation Engineer",
    score: 82,
    demand: "High",
    salary: "$95k - $142k",
    growth: "+26%",
    skills: ["Prototyping", "Cloud Services", "ML Ops", "Design Thinking"],
    trend: [
      { period: "Apr", score: 55 },
      { period: "May", score: 60 },
      { period: "Jun", score: 66 },
      { period: "Jul", score: 70 },
      { period: "Aug", score: 78 },
      { period: "Sep", score: 82 },
    ],
    readiness: 0.69,
  },
];

const skillRadar = [
  { skill: "Data Analysis", current: 86, required: 90 },
  { skill: "ML Engineering", current: 73, required: 88 },
  { skill: "Cloud Architecture", current: 58, required: 82 },
  { skill: "Product Strategy", current: 81, required: 85 },
  { skill: "Communication", current: 76, required: 84 },
];

const skillPath: SkillGap[] = [
  { skill: "Advanced MLOps", current: 52, target: 80 },
  { skill: "Generative AI", current: 64, target: 88 },
  { skill: "Business Storytelling", current: 70, target: 90 },
];

const resumeHighlights: ResumeInsight[] = [
  {
    id: "resume-1",
    label: "Project Portfolio",
    detail: "Add quantified impact for the Responsible AI audit project to boost recruiter visibility.",
    priority: "High",
  },
  {
    id: "resume-2",
    label: "Keyword Density",
    detail: "Include terms like 'retrieval augmented generation' and 'governance policy' for ATS alignment.",
    priority: "Medium",
  },
  {
    id: "resume-3",
    label: "Leadership Snapshot",
    detail: "Add a mini case study demonstrating cross-functional mentorship and hackathon facilitation.",
    priority: "Low",
  },
];

const trainingInventory = [
  {
    id: "train-1",
    title: "Generative AI Product Strategy",
    provider: "DeepLearning.AI",
    format: "Course",
    impact: "Closes strategy & communication gap",
    link: "https://www.deeplearning.ai/",
  },
  {
    id: "train-2",
    title: "MLOps with Vertex AI Hands-on Lab",
    provider: "Google Cloud",
    format: "Lab",
    impact: "Improves MLOps proficiency by 20%",
    link: "https://cloud.google.com/",
  },
  {
    id: "train-3",
    title: "Executive Storytelling for Analysts",
    provider: "Coursera",
    format: "Workshop",
    impact: "Elevates stakeholder alignment skills",
    link: "https://www.coursera.org/",
  },
];

export default function Career() {
  const [careerQuery, setCareerQuery] = useState("");

  const readinessAverage = useMemo(() => {
    const total = careerMatches.reduce((sum, match) => sum + match.readiness, 0);
    return Math.round((total / careerMatches.length) * 100);
  }, []);

  const filteredMatches = useMemo(() => {
    if (!careerQuery.trim()) return careerMatches;
    return careerMatches.filter((match) => match.title.toLowerCase().includes(careerQuery.toLowerCase()));
  }, [careerQuery]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 rounded-3xl border border-border/50 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:bg-slate-950/75 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Career Guidance &amp; Recommendations</h1>
            <p className="text-muted-foreground">
              AI synthesizes your academic trajectory, portfolio strength, and market signals to curate next-step career journeys.
              Stay aligned with market demand while your assistant refreshes guidance in real time.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={careerQuery}
                onChange={(event) => setCareerQuery(event.target.value)}
                placeholder="Explore careers (e.g. AI Engineer)"
                className="rounded-2xl border-border/60 pl-9"
              />
            </div>
            <Button className="rounded-2xl bg-gradient-to-r from-primary to-primary/80">
              <Upload className="h-4 w-4" />
              <span className="ml-2">Upload Resume</span>
            </Button>
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-3xl" />
          <DotLottieReact
            src="https://lottie.host/f266a8d8-866c-46b8-90da-90174eabe28b/zDXHtDOKAm.lottie"
            autoplay
            loop
            className="relative h-48 w-48 md:h-56 md:w-56"
          />
        </div>
      </div>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/75">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Current Skill Level (AI)</span>
              <p className="text-3xl font-semibold text-foreground">Level 4</p>
              <Badge variant="secondary" className="w-fit bg-primary/15 text-primary">
                Benchmark: Advanced
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/75">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Matching Career Fields</span>
              <p className="text-lg font-semibold text-foreground">AI Strategy • Data Science • Innovation</p>
              <Badge variant="secondary" className="w-fit bg-sky-500/15 text-sky-500">
                3 prime domains
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/75">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">AI Confidence Score</span>
              <p className="text-3xl font-semibold text-primary">88%</p>
              <Badge variant="secondary" className="w-fit bg-emerald-500/15 text-emerald-500">
                Calibrated weekly
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 backdrop-blur-md dark:bg-slate-950/75">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">Job Readiness Index</span>
              <div className="flex items-center gap-3">
                <Progress value={readinessAverage} className="h-2 flex-1" />
                <span className="text-lg font-semibold text-foreground">{readinessAverage}%</span>
              </div>
              <Badge variant="secondary" className="w-fit bg-amber-500/15 text-amber-500">
                Based on AI readiness engine
              </Badge>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay: 0.05 }}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">AI Career Match Recommendations</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {/* careerMatchAPI placeholder */}
              AI curated list
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredMatches.map((match) => (
              <Card key={match.id} className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-xl">{match.title}</CardTitle>
                    <Badge className="rounded-full bg-primary/15 text-primary">
                      {match.score}% match
                    </Badge>
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" /> {match.growth} growth
                    </span>
                    <span className="text-muted-foreground">Demand: {match.demand}</span>
                    <span className="text-muted-foreground">Salary: {match.salary}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[2fr,1fr]">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Readiness</span>
                        <span className="font-semibold text-foreground">{Math.round(match.readiness * 100)}%</span>
                      </div>
                      <Progress value={match.readiness * 100} className="h-2" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {match.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="rounded-2xl">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="h-32 rounded-2xl border border-border/60 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={match.trend}>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" />
                        <XAxis dataKey="period" hide />
                        <YAxis domain={[40, 100]} hide />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {/* upcoming careerMatchAPI metadata */}
                    AI ranks this role high due to your portfolio momentum and mentor endorsements.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" /> Learn more
                    </Button>
                    <Button size="sm" className="gap-2">
                      <Sparkles className="h-4 w-4" /> View roadmap
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.08 }}>
        <div className="grid gap-4 xl:grid-cols-[1.6fr,1fr]">
          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" /> Skill Gap Analysis
              </CardTitle>
              <CardDescription>AI compares proficiency against target roles. Radar chart highlights focus zones.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
              <div className="h-[280px] rounded-2xl border border-border/60 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillRadar} outerRadius="80%">
                    <PolarGrid stroke="rgba(148,163,184,0.35)" />
                    <PolarAngleAxis dataKey="skill" stroke="currentColor" />
                    <PolarRadiusAxis stroke="currentColor" angle={30} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Competency"]} />
                    <Legend />
                    <Radar name="Current" dataKey="current" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                    <Radar name="Target" dataKey="required" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Suggested Skill Path</h4>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {skillPath.map((gap) => (
                    <div key={gap.skill} className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-950/70">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-primary">
                        {gap.skill}
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-500">
                          Priority
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Current {gap.current}%</span>
                        <span className="text-muted-foreground">Target {gap.target}%</span>
                      </div>
                      <Progress value={(gap.current / gap.target) * 100} className="mt-2 h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-white/70 backdrop-blur-md dark:from-primary/20 dark:via-primary/10 dark:to-slate-950/70">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-primary" /> Career Progress Tracker
              </CardTitle>
              <CardDescription>Progress towards top recommended roles. Updated nightly via careerMatchAPI.</CardDescription>
            </CardHeader>
            <CardContent className="flex h-[260px] flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="55%" outerRadius="100%" data={[{ name: "Ready", value: readinessAverage, fill: "hsl(var(--primary))" }]}> 
                  <RadialBar dataKey="value" cornerRadius={12} isAnimationActive />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Readiness"]} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="mt-[-120px] text-center">
                <p className="text-3xl font-semibold text-foreground">{readinessAverage}%</p>
                <p className="text-sm text-muted-foreground">Composite readiness across AI priority roles</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-primary" /> Resume &amp; Profile Feedback
              </CardTitle>
              <CardDescription>AI resume coach highlights quick wins. Integrate with resumeAnalysisAPI when ready.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1fr,1fr]">
              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4 dark:bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resume Strength</span>
                  <Badge className="bg-primary/15 text-primary">78 / 100</Badge>
                </div>
                <Progress value={78} className="h-2" />
                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-3 text-sm text-muted-foreground dark:bg-slate-950/70">
                  <Rocket className="h-4 w-4 text-primary" />
                  Highlight cross-functional leadership to unlock senior track opportunities.
                </div>
              </div>
              <ScrollArea className="h-[160px] rounded-2xl border border-border/60 bg-white/80 p-3 dark:bg-slate-950/70">
                <div className="space-y-3 text-sm text-muted-foreground">
                  {resumeHighlights.map((insight) => (
                    <div key={insight.id} className="rounded-xl border border-border/60 bg-white/90 p-3 dark:bg-slate-950/75">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-foreground">
                        {insight.label}
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-500">
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="mt-2 leading-relaxed">{insight.detail}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" /> AI Career Chat Assistant
              </CardTitle>
              <CardDescription>Coming soon: in-line NLP assistant for career Q&A.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-foreground font-medium">Ask AI</p>
                <p className="mt-1">“Which portfolio project should I complete next to boost my AI Strategist readiness?”</p>
              </div>
              <div className="rounded-2xl border border-dashed border-border/60 bg-white/80 p-4 text-xs uppercase tracking-wide text-muted-foreground dark:bg-slate-950/70">
                {/* Future AI chat integration hook */}
                Connect to careerChatAPI for conversational guidance.
              </div>
              <Button variant="outline" className="w-full gap-2" disabled>
                <Sparkles className="h-4 w-4" /> Launch beta soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.12 }}>
        <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/75">
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-primary" /> Training &amp; Course Recommendations
              </CardTitle>
              <CardDescription>Selected to close priority skills. Swap with your mentor or save for later.</CardDescription>
            </div>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" /> Export plan
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-3">
              {trainingInventory.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 transition hover:border-primary/60 hover:shadow-md dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-primary/15 text-primary">
                      {item.format}
                    </Badge>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      Save for later
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.provider}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.impact}</p>
                  <div className="mt-auto flex gap-2">
                    <Button size="sm" className="flex-1 gap-2">
                      <Rocket className="h-4 w-4" /> Enroll now
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" /> Visit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.14 }}>
        <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-white/70 backdrop-blur-md dark:from-primary/20 dark:via-primary/10 dark:to-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LineChartIcon className="h-5 w-5 text-primary" /> Job Market Insights
            </CardTitle>
            <CardDescription>Macro indicators refreshed weekly to align expectations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 text-center sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-4xl font-semibold text-primary">2,840</p>
              <p className="text-sm text-muted-foreground">Open roles aligned to your profile</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-semibold text-emerald-500">+42%</p>
              <p className="text-sm text-muted-foreground">Projected growth for AI strategy careers</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-semibold text-amber-500">$135k</p>
              <p className="text-sm text-muted-foreground">Median salary for your readiness percentile</p>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
