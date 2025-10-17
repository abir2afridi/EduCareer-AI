import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const jobMatchData = [
  { dept: "CSE", matches: 86 },
  { dept: "Data Science", matches: 92 },
  { dept: "Business", matches: 74 },
  { dept: "Design", matches: 68 },
  { dept: "AI & Robotics", matches: 88 },
];

const skillGapData = [
  { skill: "Generative AI", gap: "High", action: "Launch mentor pods" },
  { skill: "Cloud DevOps", gap: "Medium", action: "Invite AWS guest session" },
  { skill: "Storytelling", gap: "Low", action: "Share playbooks" },
  { skill: "Product Strategy", gap: "High", action: "Embed case studies" },
];

export default function CareerEmployabilityPage() {
  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Career &amp; Employability</CardTitle>
            <CardDescription>Analyze job alignment, surface skill gaps, and coordinate placement drives.</CardDescription>
          </div>
          <Button className="rounded-xl bg-primary/80 text-white hover:bg-primary">Export placement report</Button>
        </CardHeader>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Job matching analytics</CardTitle>
          <CardDescription>Department-wise alignment with current openings</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer
            config={{
              matches: {
                label: "Matches",
                color: "var(--chart-1)",
              },
            }}
            className="h-72"
          >
            <ResponsiveContainer>
              <BarChart data={jobMatchData}>
                <CartesianGrid opacity={0.2} vertical={false} />
                <XAxis dataKey="dept" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="matches" radius={[10, 10, 0, 0]} fill="var(--color-matches)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Skill gap summary</CardTitle>
          <CardDescription>AI recommendation engine flagging key interventions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 backdrop-blur-xl">
              <TableRow className="border-white/10">
                <TableHead className="text-slate-300">Skill cluster</TableHead>
                <TableHead className="text-slate-300">Gap level</TableHead>
                <TableHead className="text-slate-300">Next action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skillGapData.map((item) => (
                <TableRow key={item.skill} className="border-white/10 text-slate-200">
                  <TableCell className="font-medium text-white">{item.skill}</TableCell>
                  <TableCell>
                    <Badge
                      className="border-white/20 text-xs text-white"
                      variant={item.gap === "High" ? "destructive" : item.gap === "Medium" ? "secondary" : "outline"}
                    >
                      {item.gap}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
