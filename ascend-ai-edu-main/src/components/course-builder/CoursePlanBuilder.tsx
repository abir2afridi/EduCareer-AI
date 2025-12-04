import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  SemesterPlan,
  createEmptySemester,
  createRandomId,
} from "@/utils/courseBuilder";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface CoursePlanBuilderProps {
  semesters: SemesterPlan[];
  onChange: (value: SemesterPlan[]) => void;
}

export function CoursePlanBuilder({ semesters, onChange }: CoursePlanBuilderProps) {
  const [dragSemesterId, setDragSemesterId] = useState<string | null>(null);

  const updateSemester = (semesterId: string, updater: (semester: SemesterPlan) => SemesterPlan) => {
    onChange(
      semesters.map((semester) => {
        if (semester.id !== semesterId) return semester;
        return updater(semester);
      }),
    );
  };

  const addSemester = () => {
    const nextIndex = semesters.length + 1;
    onChange([...semesters, createEmptySemester(`Semester ${nextIndex}`)]);
  };

  const removeSemester = (semesterId: string) => {
    if (semesters.length === 1) return;
    onChange(semesters.filter((semester) => semester.id !== semesterId));
  };

  const addCourse = (semesterId: string) => {
    updateSemester(semesterId, (semester) => ({
      ...semester,
      courses: [
        ...semester.courses,
        {
          id: createRandomId(),
          code: "",
          title: "",
          creditHours: "",
          note: "",
        },
      ],
    }));
  };

  const removeCourse = (semesterId: string, courseId: string) => {
    updateSemester(semesterId, (semester) => ({
      ...semester,
      courses: semester.courses.filter((course) => course.id !== courseId),
    }));
  };

  const updateCourseField = (semesterId: string, courseId: string, field: "code" | "title" | "creditHours" | "note", value: string) => {
    updateSemester(semesterId, (semester) => ({
      ...semester,
      courses: semester.courses.map((course) => (course.id === courseId ? { ...course, [field]: value } : course)),
    }));
  };

  const updateSemesterName = (semesterId: string, value: string) => {
    updateSemester(semesterId, (semester) => ({ ...semester, name: value }));
  };

  const beginDrag = (semesterId: string) => setDragSemesterId(semesterId);

  const reorderSemester = (targetId: string) => {
    if (!dragSemesterId || dragSemesterId === targetId) return;
    const order = [...semesters];
    const sourceIndex = order.findIndex((semester) => semester.id === dragSemesterId);
    const targetIndex = order.findIndex((semester) => semester.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    order.splice(targetIndex, 0, order.splice(sourceIndex, 1)[0]);
    onChange(order);
    setDragSemesterId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Define semester-by-semester plans, credit hours, and notes.</p>
        <Button onClick={addSemester} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" /> Add Semester
        </Button>
      </div>

      {semesters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          No semesters yet. Add your first semester plan.
        </div>
      ) : (
        <div className="space-y-6">
          {semesters.map((semester) => (
            <div key={semester.id} className="rounded-3xl border border-border/60 bg-white/80 p-5 shadow-sm dark:bg-slate-950/60">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={semester.name}
                    onChange={(event) => updateSemesterName(semester.id, event.target.value)}
                    className="flex-1"
                    placeholder="Semester name"
                    draggable
                    onDragStart={() => beginDrag(semester.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      reorderSemester(semester.id);
                    }}
                  />
                </div>
                <Badge variant="outline" className="rounded-2xl border-dashed px-3 py-1 text-xs">
                  {semester.courses.length} courses
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeSemester(semester.id)}
                  disabled={semesters.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                {semester.courses.map((course) => (
                  <div
                    key={course.id}
                    className="grid gap-3 rounded-2xl border border-border/40 bg-white/75 p-3 dark:bg-slate-950/60 md:grid-cols-[1fr,2fr,120px,auto]"
                  >
                    <Input
                      value={course.code ?? ""}
                      onChange={(event) => updateCourseField(semester.id, course.id, "code", event.target.value)}
                      placeholder="Code"
                    />
                    <Input
                      value={course.title}
                      onChange={(event) => updateCourseField(semester.id, course.id, "title", event.target.value)}
                      placeholder="Course title"
                    />
                    <Input
                      value={course.creditHours ?? ""}
                      onChange={(event) => updateCourseField(semester.id, course.id, "creditHours", event.target.value)}
                      placeholder="Credits"
                    />
                    <div className="flex items-center gap-2">
                      <Textarea
                        value={course.note ?? ""}
                        onChange={(event) => updateCourseField(semester.id, course.id, "note", event.target.value)}
                        placeholder="Notes"
                        className="min-h-[48px]"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeCourse(semester.id, course.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-2" onClick={() => addCourse(semester.id)}>
                  <Plus className="h-4 w-4" /> Add Course
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
