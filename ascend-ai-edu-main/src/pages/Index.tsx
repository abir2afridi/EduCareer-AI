import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, Users, TrendingUp, Award, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-hero opacity-20" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Powered by Advanced AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="gradient-text">EduCareer AI</span>
              <br />
              <span className="text-foreground/90">Smart Education Portal</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform education with AI-powered personalized learning, intelligent career guidance, 
              and comprehensive analytics for students, teachers, and administrators.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 shadow-glow">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/assistant">
                <Button size="lg" variant="outline" className="text-lg px-8 border-border/50">
                  Try AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
            Powerful Features
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: "AI-Powered Learning",
                description: "Personalized learning paths that adapt to each student's pace and style",
                color: "text-primary"
              },
              {
                icon: Users,
                title: "Student Analytics",
                description: "Track progress, identify risks, and optimize performance with data insights",
                color: "text-secondary"
              },
              {
                icon: TrendingUp,
                title: "Career Guidance",
                description: "AI-driven job matching and skill gap analysis for better employability",
                color: "text-accent"
              },
              {
                icon: Award,
                title: "Smart Assessments",
                description: "Automated grading, OCR mark entry, and outcome-based evaluation",
                color: "text-primary"
              }
            ].map((feature, index) => (
              <Card
                key={index}
                className="glass p-6 hover:shadow-glow transition-all cursor-pointer group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <feature.icon className={`h-12 w-12 ${feature.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { value: "1,200+", label: "Active Students" },
              { value: "95%", label: "Success Rate" },
              { value: "32", label: "AI-Powered Courses" }
            ].map((stat, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-muted-foreground text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <Card className="glass p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 gradient-text">
              Ready to Transform Education?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of students and educators using AI to achieve better learning outcomes
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-12 shadow-glow">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
