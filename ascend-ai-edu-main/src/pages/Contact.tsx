import { Mail, Phone, MapPin, Globe, Linkedin, Github, Twitter, Facebook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Contact EduCareer AI</h1>
        <p className="text-muted-foreground">Reach our cross-functional team to explore partnerships, support, or platform demos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>Learn more about EduCareer AI and how to reach the student success team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{companyInfo.name}</h3>
                <p className="text-sm text-muted-foreground">{companyInfo.description}</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{companyInfo.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{companyInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{companyInfo.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>{companyInfo.website}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Founded</p>
                  <p className="text-2xl font-bold text-primary">{companyInfo.founded}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Team Size</p>
                  <p className="text-2xl font-bold text-primary">{companyInfo.employees}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Mission</p>
                <p className="text-sm text-muted-foreground">{companyInfo.mission}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Facebook className="mr-2 h-4 w-4" />
                  Facebook
                </Button>
                <Button variant="outline" size="sm">
                  <Twitter className="mr-2 h-4 w-4" />
                  Twitter
                </Button>
                <Button variant="outline" size="sm">
                  <Linkedin className="mr-2 h-4 w-4" />
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-6 rounded-3xl border border-border/60 bg-white/95 p-6 shadow-sm dark:bg-slate-950/80">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Our Team</h2>
          <p className="text-sm text-muted-foreground">Meet the experts behind AgroSense AI.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <div key={member.name} className="flex h-full flex-col rounded-2xl border border-border/50 bg-white/90 p-5 shadow-sm dark:bg-slate-900/70">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-sm font-medium text-primary">{member.role}</p>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">Education</p>
                  <p className="text-muted-foreground">{member.education}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Experience</p>
                  <p className="text-muted-foreground">{member.experience}</p>
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
                    <Mail className="mr-1 h-3 w-3" />
                    Email
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
