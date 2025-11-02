import { Card } from "@/components/ui/card";
import DashboardBadge from "./Badge";
import { Award, BookOpen, DollarSign, Users } from "lucide-react";

const metrics = [
  {
    title: "Active Learners",
    value: "3,782",
    badge: { label: "+11.0%", variant: "success" as const },
    description: "vs last month",
    icon: Users,
  },
  {
    title: "Course Completions",
    value: "5,359",
    badge: { label: "-9.0%", variant: "error" as const },
    description: "drop detected",
    icon: BookOpen,
  },
  {
    title: "Monthly Revenue",
    value: "$128K",
    badge: { label: "+6.4%", variant: "success" as const },
    description: "from premium tiers",
    icon: DollarSign,
  },
  {
    title: "Top Certifications",
    value: "456",
    badge: { label: "Stable", variant: "info" as const },
    description: "awarded this month",
    icon: Award,
  },
];

export default function OverviewMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item) => (
        <Card
          key={item.title}
          className="group rounded-2xl border border-border/60 bg-white/90 p-6 shadow-theme-md transition hover:shadow-theme-lg dark:bg-slate-950/90"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{item.value}</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-105">
              <item.icon className="h-6 w-6" />
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3 text-sm">
            <DashboardBadge variant={item.badge.variant}>{item.badge.label}</DashboardBadge>
            <span className="text-muted-foreground">{item.description}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
