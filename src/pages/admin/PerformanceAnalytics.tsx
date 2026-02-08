import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, LineChart, Line } from "recharts";

const dropoutRiskData = [
  { month: "Apr", risk: 4.8 },
  { month: "May", risk: 4.6 },
  { month: "Jun", risk: 4.1 },
  { month: "Jul", risk: 3.7 },
  { month: "Aug", risk: 3.4 },
  { month: "Sep", risk: 3.1 },
];

const attendanceVsGpa = [
  { cohort: "CSE-25", attendance: 88, gpa: 3.42 },
  { cohort: "CSE-26", attendance: 91, gpa: 3.58 },
  { cohort: "DS-25", attendance: 85, gpa: 3.29 },
  { cohort: "DS-26", attendance: 89, gpa: 3.47 },
  { cohort: "BA-25", attendance: 94, gpa: 3.62 },
];

export default function PerformanceAnalyticsPage() {
  return (
    <div className="space-y-6 text-white">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Predictive analytics</CardTitle>
          <CardDescription>Track leading indicators and AI-generated insights to stay ahead of churn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-200">
          <p>
            Our AI engine ingests attendance, engagement, and assessment signals to predict learner outcomes. Mitigate risk
            by reviewing trends below and scheduling proactive interventions with mentors and program leads.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Dropout risk forecasting</CardTitle>
            <CardDescription>Projected percentage of at-risk students per month</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={{
                risk: {
                  label: "Risk %",
                  color: "var(--chart-4)",
                },
              }}
              className="h-72"
            >
              <ResponsiveContainer>
                <AreaChart data={dropoutRiskData}>
                  <defs>
                    <linearGradient id="dropoutGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-risk)" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="var(--color-risk)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid opacity={0.15} strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" domain={[0, 6]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="risk" stroke="var(--color-risk)" fill="url(#dropoutGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Attendance vs GPA correlation</CardTitle>
            <CardDescription>Overlay correlation to identify cohorts needing academic support.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={{
                attendance: { label: "Attendance %", color: "var(--chart-2)" },
                gpa: { label: "Avg GPA", color: "var(--chart-3)" },
              }}
              className="h-72"
            >
              <ResponsiveContainer>
                <LineChart data={attendanceVsGpa}>
                  <CartesianGrid opacity={0.15} strokeDasharray="3 3" />
                  <XAxis dataKey="cohort" stroke="var(--muted-foreground)" />
                  <YAxis yAxisId="left" tickFormatter={(value) => `${value}%`} stroke="var(--muted-foreground)" />
                  <YAxis yAxisId="right" orientation="right" domain={[3, 4]} stroke="var(--muted-foreground)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line yAxisId="left" type="monotone" dataKey="attendance" stroke="var(--color-attendance)" strokeWidth={3} dot />
                  <Line yAxisId="right" type="monotone" dataKey="gpa" stroke="var(--color-gpa)" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
