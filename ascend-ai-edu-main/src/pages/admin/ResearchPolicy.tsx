import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const comparisonData = [
  { metric: "Medium of instruction", english: "68%", bangla: "32%", insight: "Offer bilingual materials for core subjects." },
  { metric: "Female enrolment", english: "43%", bangla: "57%", insight: "Launch mentorship for English-medium cohorts." },
  { metric: "STEM performance", english: "85%", bangla: "79%", insight: "Provide lab access grants to Bangla-medium schools." },
] as const;

export default function ResearchPolicyPage() {
  return (
    <div className="space-y-6 text-white">
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Research &amp; Policy Insights</CardTitle>
            <CardDescription>Analyze demographic splits and craft institutional whitepapers.</CardDescription>
          </div>
          <Button className="rounded-xl bg-primary/80 text-white hover:bg-primary">Generate summary report</Button>
        </CardHeader>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Comparative insights</CardTitle>
          <CardDescription>Key differences between English &amp; Bangla medium cohorts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 backdrop-blur-xl">
              <TableRow className="border-white/10">
                <TableHead className="text-slate-300">Metric</TableHead>
                <TableHead className="text-slate-300">English-medium</TableHead>
                <TableHead className="text-slate-300">Bangla-medium</TableHead>
                <TableHead className="text-slate-300">AI Insight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((row) => (
                <TableRow key={row.metric} className="border-white/10 text-slate-200">
                  <TableCell className="font-medium text-white">{row.metric}</TableCell>
                  <TableCell>{row.english}</TableCell>
                  <TableCell>{row.bangla}</TableCell>
                  <TableCell>{row.insight}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
