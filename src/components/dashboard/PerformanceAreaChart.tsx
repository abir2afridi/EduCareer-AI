import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const data = [
  { month: "Jan", enrolments: 120, completions: 72 },
  { month: "Feb", enrolments: 156, completions: 94 },
  { month: "Mar", enrolments: 182, completions: 111 },
  { month: "Apr", enrolments: 205, completions: 132 },
  { month: "May", enrolments: 188, completions: 125 },
  { month: "Jun", enrolments: 214, completions: 143 },
  { month: "Jul", enrolments: 238, completions: 161 },
  { month: "Aug", enrolments: 260, completions: 179 },
  { month: "Sep", enrolments: 244, completions: 172 },
  { month: "Oct", enrolments: 268, completions: 191 },
  { month: "Nov", enrolments: 252, completions: 184 },
  { month: "Dec", enrolments: 276, completions: 205 },
];

export default function PerformanceAreaChart() {
  return (
    <Card className="rounded-2xl border border-border/60 bg-white/95 p-6 shadow-theme-md dark:bg-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Enrolments vs Completions</h3>
          <p className="text-sm text-muted-foreground">Program health across the last 12 months</p>
        </div>
        <Badge variant="outline" className="rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest">
          Live data sync
        </Badge>
      </div>

      <div className="mt-6 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 16 }}>
            <defs>
              <linearGradient id="colorEnrolments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 8" stroke="rgba(148, 163, 184, 0.25)" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ stroke: "hsl(var(--primary))", strokeDasharray: "4 4" }}
              contentStyle={{ borderRadius: 16, border: "1px solid rgba(148, 163, 184, 0.4)", boxShadow: "var(--shadow)", padding: "0.75rem 1rem" }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "0.75rem" }} />
            <Area
              type="monotone"
              dataKey="enrolments"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorEnrolments)"
              name="Enrolments"
            />
            <Area
              type="monotone"
              dataKey="completions"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              fill="url(#colorCompletions)"
              name="Completions"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
