import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Activity,
  Bell,
  BarChart3,
  Rocket,
  Loader2,
} from "lucide-react";
import { useMemo } from "react";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";

export default function AdminDashboard() {
  const { metrics, gpaTrend, subjectPerformance, attendanceByDepartment, alerts, isLoading, error } =
    useAdminDashboardData();

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Students",
        value: metrics.totalStudents,
        icon: Users,
        color: "text-primary",
        helper: "Active enrollments",
        formatter: (value: number | null | undefined) =>
          typeof value === "number" ? value.toLocaleString() : "—",
      },
      {
        label: "Total Teachers",
        value: metrics.totalTeachers,
        icon: GraduationCap,
        color: "text-secondary",
        helper: "Faculty members",
        formatter: (value: number | null | undefined) =>
          typeof value === "number" ? value.toLocaleString() : "—",
      },
      {
        label: "Average GPA",
        value: metrics.averageGpa,
        icon: TrendingUp,
        color: "text-accent",
        helper: "Across all students",
        formatter: (value: number | null | undefined) =>
          typeof value === "number" ? value.toFixed(2) : "—",
      },
      {
        label: "Dropout Rate",
        value: metrics.dropoutRate,
        icon: AlertTriangle,
        color: "text-rose-500",
        helper: "Current academic year",
        formatter: (value: number | null | undefined) =>
          typeof value === "number" ? `${value.toFixed(1)}%` : "—",
      },
      {
        label: "Employability",
        value: metrics.employabilityRate,
        icon: Briefcase,
        color: "text-emerald-500",
        helper: "Latest analytics snapshot",
        formatter: (value: number | null | undefined) =>
          typeof value === "number" ? `${value.toFixed(1)}%` : "—",
      },
    ],
    [metrics],
  );

  const alertsToDisplay = alerts;
  const hasGpaTrend = gpaTrend.length > 0;
  const hasAttendanceData = attendanceByDepartment.length > 0;
  const hasSubjectPerformance = subjectPerformance.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2 gradient-text">Institution Control Center</h2>
        <p className="text-muted-foreground">Unified analytics, risk insights, and placement momentum for leadership teams.</p>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card, index) => (
          <Card
            key={card.label}
            className="glass p-6 hover:shadow-glow transition-all cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                <p className="text-3xl font-bold">
                  {isLoading ? <span className="block h-7 w-20 animate-pulse rounded-xl bg-muted/60" /> : card.formatter(card.value)}
                </p>
              </div>
              <card.icon className={cn("h-12 w-12 opacity-80", card.color)} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{card.helper}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <Card className="glass p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold leading-tight">GPA Trend</h3>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-100">
              {typeof metrics.averageGpa === "number" ? `Avg ${metrics.averageGpa.toFixed(2)}` : "No data"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Live academic performance captured from Firestore analytics by month.</p>
          <div className="h-72">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : hasGpaTrend ? (
              <ChartContainer
                config={{
                  avgGpa: {
                    label: "Average GPA",
                    color: "var(--chart-1)",
                  },
                }}
                className="h-full"
              >
                <ResponsiveContainer>
                  <LineChart data={gpaTrend}>
                    <CartesianGrid opacity={0.16} strokeDasharray="4 4" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" dy={6} />
                    <YAxis stroke="var(--muted-foreground)" domain={[0, 4]} />
                    <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: "var(--border)" }} />
                    <Line type="monotone" dataKey="avgGpa" stroke="var(--color-avgGpa)" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No analytics data available.
              </div>
            )}
          </div>
        </Card>

        <Card className="glass p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-secondary" />
              <h3 className="text-xl font-semibold leading-tight">Recent Alerts</h3>
            </div>
            <Badge variant="secondary" className="bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-white">
              AI Signals
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Live risk and opportunity summaries for rapid interventions.</p>
          <ScrollArea className="h-64 pr-3">
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
                  ))}
                </div>
              ) : alertsToDisplay.length > 0 ? (
                alertsToDisplay.map((alert) => (
                  <div key={alert.title + alert.date} className="rounded-2xl bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          alert.type === "critical" && "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200",
                          alert.type === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
                          alert.type === "info" && "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-100",
                        )}
                      >
                        {alert.date ?? ""}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{alert.message || "No description provided."}</p>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No alerts available.
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold leading-tight">Department Attendance</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Comparative attendance averages across departments, refreshed in real time.</p>
          <div className="h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : hasAttendanceData ? (
              <ChartContainer
                config={{
                  attendance: {
                    label: "Attendance %",
                    color: "var(--chart-2)",
                  },
                }}
                className="h-full"
              >
                <ResponsiveContainer>
                  <BarChart data={attendanceByDepartment}>
                    <CartesianGrid opacity={0.12} vertical={false} />
                    <XAxis dataKey="department" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="attendance" radius={[10, 10, 0, 0]} fill="var(--color-attendance)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No attendance data available.
              </div>
            )}
          </div>
          {hasSubjectPerformance && (
            <div className="mt-6 space-y-2 text-sm">
              <h4 className="font-semibold text-foreground">Subject performance snapshot</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {subjectPerformance.map((subject) => (
                  <div key={subject.department} className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{subject.department}</p>
                    <p className="text-xs text-muted-foreground">Avg GPA {subject.averageGpa.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="glass p-6">
          <div className="mb-4 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-secondary" />
            <h3 className="text-xl font-semibold leading-tight">Employability Trends</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Graduates placed within 90 days of completion, modeled by program.</p>
          <div className="h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : hasGpaTrend ? (
              <ChartContainer
                config={{
                  employability: {
                    label: "Employability %",
                    color: "var(--chart-3)",
                  },
                  dropoutRate: {
                    label: "Dropout %",
                    color: "var(--chart-4)",
                  },
                }}
                className="h-full"
              >
                <ResponsiveContainer>
                  <AreaChart data={gpaTrend}>
                    <defs>
                      <linearGradient id="colorEmployability" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-employability)" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="var(--color-employability)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="employability" stroke="var(--color-employability)" fill="url(#colorEmployability)" strokeWidth={3} />
                    <Line type="monotone" dataKey="dropoutRate" stroke="var(--color-dropoutRate)" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No employability analytics available.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
