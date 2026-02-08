import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import ChartDropdown from "./ChartDropdown";

const rows = [
  {
    student: "Sarah Johnson",
    program: "Data Science",
    status: "Mentor session complete",
    time: "2 hours ago",
    trend: "Improving",
  },
  {
    student: "Michael Chen",
    program: "AI Engineering",
    status: "Capstone review pending",
    time: "4 hours ago",
    trend: "On track",
  },
  {
    student: "Emma Davis",
    program: "Web Development",
    status: "Portfolio updated",
    time: "Yesterday",
    trend: "Rising",
  },
  {
    student: "Lucas Patel",
    program: "Product Design",
    status: "Feedback submitted",
    time: "2 days ago",
    trend: "Stable",
  },
];

const trendVariant: Record<string, "outline" | "secondary" | "default"> = {
  Improving: "default",
  "On track": "secondary",
  Rising: "default",
  Stable: "outline",
};

export default function RecentActivityTable() {
  return (
    <Card className="rounded-2xl border border-border/60 bg-white/95 p-6 shadow-theme-md dark:bg-slate-950">
      <div className="flex flex-wrap items-start gap-4 sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Recent activity</h3>
          <p className="text-sm text-muted-foreground">Live feed across programmes and mentors</p>
        </div>
        <ChartDropdown />
      </div>

      <div className="mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead className="whitespace-nowrap text-muted-foreground">Student</TableHead>
              <TableHead className="whitespace-nowrap text-muted-foreground">Programme</TableHead>
              <TableHead className="whitespace-nowrap text-muted-foreground">Status</TableHead>
              <TableHead className="whitespace-nowrap text-muted-foreground">Updated</TableHead>
              <TableHead className="whitespace-nowrap text-muted-foreground">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.student} className="border-border/60">
                <TableCell className="font-medium text-foreground">{row.student}</TableCell>
                <TableCell className="text-muted-foreground">{row.program}</TableCell>
                <TableCell className="text-muted-foreground">{row.status}</TableCell>
                <TableCell className="text-muted-foreground">{row.time}</TableCell>
                <TableCell>
                  <Badge variant={trendVariant[row.trend] ?? "outline"} className="rounded-full px-3 py-1 text-xs">
                    {row.trend}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
