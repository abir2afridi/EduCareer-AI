import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const reportTemplates = [
  { name: "Institutional Benchmark", format: "PDF", lastGenerated: "Oct 12, 2025" },
  { name: "Department KPI Snapshot", format: "CSV", lastGenerated: "Oct 10, 2025" },
  { name: "Mentor Activity Summary", format: "PDF", lastGenerated: "Oct 9, 2025" },
] as const;

export default function ReportsExportsPage() {
  return (
    <div className="space-y-6 text-white">
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Reports &amp; Exports</CardTitle>
            <CardDescription>Generate institutional reports and share snapshots with leadership.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-xl bg-primary/80 text-white hover:bg-primary">Export PDF Report</Button>
            <Button variant="outline" className="rounded-xl border-white/20 text-white">
              Export CSV File
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Report templates</CardTitle>
          <CardDescription>Recently generated artefacts and quick actions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 backdrop-blur-xl">
              <TableRow className="border-white/10">
                <TableHead className="text-slate-300">Name</TableHead>
                <TableHead className="text-slate-300">Format</TableHead>
                <TableHead className="text-slate-300">Last generated</TableHead>
                <TableHead className="text-slate-300" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportTemplates.map((report) => (
                <TableRow key={report.name} className="border-white/10 text-slate-200">
                  <TableCell className="font-medium text-white">{report.name}</TableCell>
                  <TableCell>{report.format}</TableCell>
                  <TableCell>{report.lastGenerated}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-white/20 text-white">
                        Export now
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                        Schedule
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
