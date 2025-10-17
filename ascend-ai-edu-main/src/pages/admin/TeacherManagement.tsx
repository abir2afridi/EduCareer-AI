import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

const teacherData = [
  { name: "Dr. Afsana Karim", subject: "AI Ethics", rating: 4.8, feedback: 92 },
  { name: "Md. Tanvir Rahman", subject: "Full-stack Engineering", rating: 4.6, feedback: 88 },
  { name: "Ishrat Jahan", subject: "Career Design Studio", rating: 4.7, feedback: 94 },
  { name: "Shah Riaz", subject: "Data Storytelling", rating: 4.5, feedback: 90 },
] as const;

export default function TeacherManagementPage() {
  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Teacher Management</CardTitle>
            <p className="text-sm text-muted-foreground">Monitor faculty performance and update specialization areas.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-4">Add Teacher</Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
              <DialogHeader>
                <DialogTitle>Add new teacher (mock)</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Provide teacher details to extend this sandbox record. This does not persist.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="teacher-name">Full name</Label>
                  <Input id="teacher-name" className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="teacher-subject">Subject specialization</Label>
                  <Input id="teacher-subject" className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" className="rounded-xl">Save mock teacher</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Faculty overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[480px]">
            <Table>
              <TableHeader className="sticky top-0 backdrop-blur-xl">
                <TableRow className="border-border/60">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Subject</TableHead>
                  <TableHead className="text-muted-foreground">Rating</TableHead>
                  <TableHead className="text-muted-foreground">Feedback Score</TableHead>
                  <TableHead className="text-muted-foreground" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherData.map((teacher) => (
                  <TableRow key={teacher.name} className="border-border/60 text-muted-foreground hover:bg-muted/40">
                    <TableCell className="font-semibold text-foreground">{teacher.name}</TableCell>
                    <TableCell>{teacher.subject}</TableCell>
                    <TableCell>{teacher.rating.toFixed(1)}</TableCell>
                    <TableCell>{teacher.feedback}%</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        Edit specialization
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
