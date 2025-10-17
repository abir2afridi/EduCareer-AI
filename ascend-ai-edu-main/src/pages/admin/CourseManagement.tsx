import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const courseData = [
  { code: "DS101", title: "Data Structures", instructor: "Dr. Nabila Karim", enrolled: 240 },
  { code: "AI204", title: "Applied Machine Learning", instructor: "Md. Tahsin Alam", enrolled: 185 },
  { code: "UX307", title: "Design Thinking Clinic", instructor: "Afia Rahman", enrolled: 96 },
  { code: "BA112", title: "Business Intelligence Lab", instructor: "Samia Chowdhury", enrolled: 168 },
] as const;

export default function CourseManagementPage() {
  const [materialsUploading, setMaterialsUploading] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Management</CardTitle>
            <CardDescription>Assign instructors, manage cohorts, and stage content releases.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-xl">Add Course</Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
                <DialogHeader>
                  <DialogTitle>Add a new course (mock)</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="course-code">Course code</Label>
                    <Input id="course-code" className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="course-title">Course title</Label>
                    <Input id="course-title" className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="course-owner">Instructor</Label>
                    <Input id="course-owner" className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" className="rounded-xl">Save mock course</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setMaterialsUploading(true)}
              disabled={materialsUploading}
            >
              {materialsUploading ? "Uploading..." : "Upload materials"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Active courses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 backdrop-blur-xl">
              <TableRow className="border-border/60">
                <TableHead className="text-muted-foreground">Course</TableHead>
                <TableHead className="text-muted-foreground">Instructor</TableHead>
                <TableHead className="text-muted-foreground">Enrolled</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseData.map((course) => (
                <TableRow key={course.code} className="border-border/60 text-muted-foreground">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{course.title}</span>
                      <Badge variant="outline" className="mt-1 w-max rounded-xl border-border/60 bg-muted/40 text-xs text-foreground dark:bg-white/10 dark:text-slate-100">
                        {course.code}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{course.instructor}</TableCell>
                  <TableCell>{course.enrolled}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl">
                        Assign teacher
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-xl">
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive">
                        Delete
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
