import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Twitter, Facebook, MessageCircle, Building2, CalendarClock, Loader2 } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

type TeamMember = {
  name: string;
  role: string;
  education: string;
  experience: string;
  specialties: string[];
  email: string;
  github?: string;
  linkedin?: string;
};

const teamMembers: TeamMember[] = [
  {
    name: "Abir Hasan Siam",
    role: "Head of Learner Analytics & Program Lead",
    education: "MS in Data Science, University of Illinois Urbana-Champaign",
    experience: "12+ years leading analytics teams across edtech platforms",
    specialties: ["Predictive learner success", "Curriculum intelligence", "AI governance"],
    email: "abir@educareer.ai",
    github: "https://github.com/abir2afridi",
  },
  {
    name: "Jannatun Naim",
    role: "Principal Full-Stack Engineer",
    education: "BS in Computer Science, University of Dhaka",
    experience: "10+ years architecting large-scale web experiences",
    specialties: ["React/Next.js", "Design systems", "Platform scalability"],
    email: "jannatun@educareer.ai",
    github: "https://github.com/Yeonali",
  },
  {
    name: "Nur Muhammad",
    role: "Lead Career Strategist",
    education: "MBA in Human Capital & Career Development, IBA - University of Dhaka",
    experience: "9+ years coaching graduates into future-ready roles",
    specialties: ["Career pathway modeling", "Competency frameworks", "Industry partnerships"],
    email: "nur@educareer.ai",
    linkedin: "https://linkedin.com/in/nurmuhammad",
  },
  {
    name: "Jannatul Mahia",
    role: "Student Success Manager & Onboarding Lead",
    education: "MA in Education Technology, University of British Columbia",
    experience: "8+ years designing learner support journeys",
    specialties: ["Retention playbooks", "Mentor enablement", "Support operations"],
    email: "mahia@educareer.ai",
    linkedin: "https://linkedin.com/in/jannatulmahia",
  },
  {
    name: "Sumaiya Hossain Onika",
    role: "Learning Experience Designer",
    education: "MS in Instructional Design, University of Melbourne",
    experience: "11+ years crafting blended learning experiences",
    specialties: ["Microlearning", "Assessment strategy", "UX writing"],
    email: "sumaiya@educareer.ai",
    github: "https://github.com/sumaiyahossain",
  },
  {
    name: "Asraful Islam Sojib",
    role: "Business Intelligence Developer",
    education: "MS in Data Science, Carnegie Mellon University",
    experience: "7+ years building BI pipelines and dashboards",
    specialties: ["Analytics engineering", "Data visualization", "Self-serve insights"],
    email: "sojib@educareer.ai",
    github: "https://github.com/asrafulislamsojib",
  },
  {
    name: "Farhana Rahman",
    role: "Partnerships & Outreach Manager",
    education: "BBA in Marketing, North South University",
    experience: "6+ years building university and employer alliances",
    specialties: ["Institutional partnerships", "Community programs", "Brand storytelling"],
    email: "farhana@educareer.ai",
    linkedin: "https://linkedin.com/in/farhanarahman",
  },
  {
    name: "AI Success Coach",
    role: "Virtual Academic & Career Assistant",
    education: "Advanced machine learning models trained on education best practices",
    experience: "Real-time student nudges, roadmap generation, and skill suggestions",
    specialties: ["Automated coaching", "Pattern recognition", "Predictive analytics"],
    email: "coach@educareer.ai",
  },
];

const companyInfo = {
  name: "EduCareer AI",
  description: "Intelligent guidance platform for academic planning and career readiness",
  address: "Level 5, Startup Tower, Dhaka 1212, Bangladesh",
  phone: "+880 1768-220031",
  email: "hello@educareer.ai",
  website: "https://www.educareer.ai",
  founded: "2023",
  employees: "25+",
  mission: "Empower every learner with data-driven insights to discover, plan, and thrive in future careers.",
};

const contactChannels = [
  {
    title: "Admissions & Learner Support",
    description: "Get help with onboarding, course access, and personalised guidance for every learner.",
    icon: Mail,
    ctaLabel: "support@educareer.ai",
    href: "mailto:support@educareer.ai",
  },
  {
    title: "University & Partnerships",
    description: "Co-create employability programs, workshops, and talent pipelines for your institution.",
    icon: Building2,
    ctaLabel: "partnerships@educareer.ai",
    href: "mailto:partnerships@educareer.ai",
  },
  {
    title: "Product & Platform Demos",
    description: "Schedule a deep dive into EduCareer AI's analytics, automations, and success playbooks.",
    icon: MessageCircle,
    ctaLabel: "Book a demo",
    href: "mailto:demos@educareer.ai",
  },
  {
    title: "Media & Speaking",
    description: "Invite our team to share insights on future skills, AI in education, and workforce readiness.",
    icon: Phone,
    ctaLabel: "+880 1768-220031",
    href: "tel:+8801768220031",
  },
] satisfies Array<{ title: string; description: string; icon: typeof Mail; ctaLabel: string; href: string }>;

const contactTopics = [
  { value: "general", label: "General inquiry" },
  { value: "partnerships", label: "Partnership opportunity" },
  { value: "admissions", label: "Admissions or learner support" },
  { value: "demo", label: "Request a demo" },
  { value: "media", label: "Press or media" },
];

type ContactFormState = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

const initialFormState: ContactFormState = {
  name: "",
  email: "",
  topic: contactTopics[0]?.value ?? "general",
  message: "",
};

export default function ContactPage() {
  const { toast } = useToast();
  const [formState, setFormState] = useState<ContactFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof ContactFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      toast({ title: "Missing information", description: "Please share your name, email, and message so we can respond.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      toast({
        title: "Message received",
        description: "Thanks for reaching out! The EduCareer AI team will respond within one business day.",
      });
      setFormState(initialFormState);
      setIsSubmitting(false);
    }, 900);
  };

  return (
    <div className="space-y-10 pb-16">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white shadow-lg">
        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <Badge variant="secondary" className="w-fit rounded-full border border-white/40 bg-white/10 text-white">
              Let's talk
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">Contact EduCareer AI</h1>
              <p className="max-w-xl text-base text-white/80">
                Whether you're a university partner, student success leader, or prospective learner, our team is ready to design the
                next growth milestone with you.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" className="rounded-full px-5" asChild>
                <a href={`mailto:${companyInfo.email}`} className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email the team
                </a>
              </Button>
              <Button variant="outline" className="rounded-full border-white/60 bg-white/10 px-5 text-white transition hover:bg-white/20" asChild>
                <a href="https://www.educareer.ai" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Visit website
                </a>
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80">
                <CalendarClock className="h-4 w-4" /> Sunday – Thursday, 9am – 6pm BST
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" aria-hidden />
            <div className="relative flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <DotLottieReact
                src="https://lottie.host/1c425408-06f9-4b2b-b3f7-3071f631d5f3/xecxbkHzkr.lottie"
                loop
                autoplay
                style={{ width: "100%", maxWidth: 340 }}
              />
            </div>
            <p className="mt-4 text-sm text-white/75">
              We typically respond within one business day. Urgent? Call {companyInfo.phone}.
            </p>
          </div>
        </div>
        <div className="border-t border-white/20 bg-white/10 px-8 py-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[{ label: "Founded", value: companyInfo.founded }, { label: "Team size", value: companyInfo.employees }, { label: "Learners guided", value: "18k+" }, { label: "Partner campuses", value: "40+" }].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25rem] text-white/70">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card className="border-border/60 bg-white/95 shadow-sm dark:bg-slate-950/80">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Company information & channels
            </CardTitle>
            <CardDescription>
              All the ways to collaborate with EduCareer AI's learner success, partnerships, and product teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{companyInfo.name}</h3>
                  <p>{companyInfo.description}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{companyInfo.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href={`tel:${companyInfo.phone}`} className="transition hover:text-primary">
                      {companyInfo.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <a href={`mailto:${companyInfo.email}`} className="transition hover:text-primary">
                      {companyInfo.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <a href={companyInfo.website} target="_blank" rel="noreferrer" className="transition hover:text-primary">
                      {companyInfo.website}
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground dark:bg-slate-900/70">
                  <p className="font-medium text-foreground">Support hours</p>
                  <p className="mt-1">Sunday – Thursday, 9am – 6pm BST</p>
                  <p className="mt-3 text-foreground">Need a tailored roadmap?</p>
                  <p>Book a strategy call and we'll tailor the right launch plan for your campus or cohort.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Facebook className="h-4 w-4" /> Facebook
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Twitter className="h-4 w-4" /> Twitter
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Github className="h-4 w-4" /> GitHub
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {contactChannels.map(({ title, description, icon: Icon, ctaLabel, href }) => (
                <div key={title} className="flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm transition hover:border-primary/60 hover:shadow-md dark:bg-slate-950/70">
                  <div className="space-y-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">{title}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="ghost" className="px-0 text-primary" asChild>
                      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
                        {ctaLabel}
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-border/60 bg-white/95 shadow-sm dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>
              Share a few details and we'll route your inquiry to the right specialist on the EduCareer AI team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Full name</Label>
                  <Input id="contact-name" value={formState.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input id="contact-email" type="email" value={formState.email} onChange={(event) => updateField("email", event.target.value)} placeholder="you@educareer.ai" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-topic">Topic</Label>
                <Select value={formState.topic} onValueChange={(value) => updateField("topic", value)}>
                  <SelectTrigger id="contact-topic">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactTopics.map((topic) => (
                      <SelectItem key={topic.value} value={topic.value}>
                        {topic.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message">How can we help?</Label>
                <Textarea
                  id="contact-message"
                  value={formState.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  placeholder="Tell us about your goals, questions, or the program you're exploring."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    "Send message"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  By submitting, you agree to receive follow-up emails about EduCareer AI's programs and resources. We respect your inbox.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-6 rounded-3xl border border-border/60 bg-white/95 p-6 shadow-sm dark:bg-slate-950/80">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Meet the team</h2>
          <p className="text-sm text-muted-foreground">The experts powering EduCareer AI's learner journeys and partner programs.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <div key={member.name} className="flex h-full flex-col rounded-2xl border border-border/50 bg-white/90 p-5 shadow-sm transition hover:border-primary/60 hover:shadow-md dark:bg-slate-900/70">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm font-medium text-primary">{member.role}</p>
              </div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Education</p>
                  <p>{member.education}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Experience</p>
                  <p>{member.experience}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Specialties</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {member.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                  <a href={`mailto:${member.email}`}>
                    <Mail className="mr-1 h-3 w-3" /> Email
                  </a>
                </Button>
                {member.github && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={member.github} target="_blank" rel="noreferrer">
                      <Github className="h-3 w-3" />
                    </a>
                  </Button>
                )}
                {member.linkedin && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={member.linkedin} target="_blank" rel="noreferrer">
                      <Linkedin className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
