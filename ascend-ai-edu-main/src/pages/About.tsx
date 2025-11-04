import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Database, Activity, Target, BarChart3, Clock, Shield, TrendingUp, CheckCircle, Zap, Brain } from "lucide-react";

const teamMembers = [
  { name: "Abir Hasan Siam", role: "Head of Learner Analytics", icon: Brain },
  { name: "Jannatun Naim", role: "Principal Full-Stack Engineer", icon: Activity },
  { name: "Nur Muhammad", role: "Lead Career Strategist", icon: Target },
  { name: "Jannatul Mahia", role: "Student Success Manager", icon: Users },
  { name: "Sumaiya Hossain Onika", role: "Learning Experience Designer", icon: BarChart3 },
  { name: "Asraful Islam Sojib", role: "Business Intelligence Developer", icon: Database },
  { name: "AI Success Coach", role: "Virtual Guidance Assistant", icon: Zap },
] as const;

const dataSources = [
  "University learning management systems (LMS)",
  "Career outcome and alumni success surveys",
  "Industry hiring and skills demand APIs",
  "Assessment analytics & competency rubrics",
  "Mentor and advisor feedback loops",
  "Third-party credential & certification providers",
  "Labour market intelligence from government datasets",
] as const;

const coreValues = [
  { title: "Personalized Journeys", icon: BarChart3 },
  { title: "Real-time Coaching", icon: Clock },
  { title: "Trusted Guidance", icon: Shield },
  { title: "Career Intelligence", icon: Brain },
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <DotLottieReact src="https://lottie.host/6d8dcd6b-e6cc-4e60-8b27-712b49f0b3f6/QZkjUXZ6nq.lottie" loop autoplay style={{ width: "520px", maxWidth: "100%" }} />
          <h1 className="text-4xl font-bold text-foreground">About EduCareer AI</h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Platform Status: Live & Assisting Learners</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <span>Empowering Learners with Intelligent Guidance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-muted-foreground">
            EduCareer AI equips universities, bootcamps, and training partners with AI-powered insights to guide
            students from enrollment to employment. Our platform unifies academic data, labour-market signals, and
            personalized coaching to help every learner discover, plan, and achieve their next milestone.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Core Team</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teamMembers.map((member) => {
              const IconComponent = member.icon;
              return (
                <div
                  key={member.name}
                  className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span>Platform Highlights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2 text-center">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">Completion Prediction Accuracy</div>
              <Progress value={98} className="h-2" />
            </div>
            <div className="space-y-2 text-center">
              <div className="text-3xl font-bold text-primary">10min</div>
              <div className="text-sm text-muted-foreground">Personalized Plan Refresh</div>
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Real-time nudges</span>
              </div>
            </div>
            <div className="space-y-2 text-center">
              <div className="text-3xl font-bold text-primary">180+</div>
              <div className="text-sm text-muted-foreground">Programs Supported</div>
              <div className="text-xs text-muted-foreground">Across universities, skills bootcamps, and corporate academies</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span>Signals We Aggregate</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dataSources.map((source) => (
              <div key={source} className="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span className="text-sm text-foreground">{source}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span>Core Values &amp; Highlights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {coreValues.map((value) => {
              const IconComponent = value.icon;
              return (
                <div
                  key={value.title}
                  className="space-y-2 rounded-lg border bg-card p-4 text-center transition-shadow hover:shadow-md"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {value.title}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="border-t py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 EduCareer AI – Independent University, Bangladesh.
        </p>
      </div>
    </div>
  );
}
