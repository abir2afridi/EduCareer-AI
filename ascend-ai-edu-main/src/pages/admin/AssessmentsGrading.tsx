import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const pendingAssessments = [
  { course: "AI Ethics", cohort: "Spring 2025", submissions: 96, status: "Pending AI review" },
  { course: "Data Visualization", cohort: "Fast-track Bootcamp", submissions: 42, status: "Awaiting approval" },
  { course: "Career Readiness", cohort: "Final year", submissions: 128, status: "Ready to publish" },
] as const;

export default function AssessmentsGradingPage() {
  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assessments &amp; Grading</CardTitle>
            <CardDescription>Trigger AI-assisted evaluation workflows and publish results.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-xl bg-primary/80 text-white hover:bg-primary">Run AI Evaluation</Button>
            <Button variant="outline" className="rounded-xl border-white/20 text-white">
              Upload OCR batch
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Pending assessments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 backdrop-blur-xl">
              <TableRow className="border-white/10">
                <TableHead className="text-slate-300">Course</TableHead>
                <TableHead className="text-slate-300">Cohort</TableHead>
                <TableHead className="text-slate-300">Submissions</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAssessments.map((item) => (
                <TableRow key={item.course} className="border-white/10 text-slate-200">
                  <TableCell className="font-medium text-white">{item.course}</TableCell>
                  <TableCell>{item.cohort}</TableCell>
                  <TableCell>{item.submissions}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/20 bg-white/5 text-xs text-white">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-white/20 text-white">
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                        Publish
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
