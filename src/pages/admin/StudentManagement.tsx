import { useMemo, useState } from "react";
import { Loader2, Search, ArrowUpDown, Filter, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { publicUniversities, privateUniversities } from "@/constants/universities";
import { departments, genders, skillsOptions } from "@/constants/profileOptions";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useStudentsCollection, type StudentRecord } from "@/hooks/useStudentsCollection";
import { addAdminNotification, deleteStudentDoc, updateStudentDoc } from "@/lib/firebaseHelpers";
import { serverTimestamp } from "firebase/firestore";

type CompletionFilter = "all" | "completed" | "incomplete";
type SortField = "lastUpdated" | "gpa" | "name";

type EditFormState = {
  name: string;
  email: string;
  gender: string;
  department: string;
  university: string;
  rollNumber: string;
  contactNumber: string;
  address: string;
  gpa: string;
  skills: string[];
  profileCompleted: boolean;
  emergencyContact: string;
  profilePictureUrl: string;
};

const initialEditState: EditFormState = {
  name: "",
  email: "",
  gender: "",
  department: "",
  university: "",
  rollNumber: "",
  contactNumber: "",
  address: "",
  gpa: "",
  skills: [],
  profileCompleted: false,
  emergencyContact: "",
  profilePictureUrl: "",
};

type UniversityFilterOption = "all" | "public" | "private";

const formatDate = (date: Date | null) => {
  if (!date) return "—";
  return date.toLocaleString();
};

const sanitizeEditPayload = (form: EditFormState): Record<string, unknown> => {
  const trimmedGpa = form.gpa.trim();
  const gpaValue = trimmedGpa.length > 0 ? Number(trimmedGpa) : null;
  const timestamp = serverTimestamp();
  const normalizedSkills = Array.from(
    new Set(
      form.skills
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0),
    ),
  );

  return {
    name: form.name.trim(),
    email: form.email.trim(),
    gender: form.gender.trim(),
    department: form.department.trim(),
    university: form.university.trim(),
    rollNumber: form.rollNumber.trim(),
    contactNumber: form.contactNumber.trim(),
    address: form.address.trim(),
    gpa: Number.isFinite(gpaValue) ? gpaValue : null,
    skills: normalizedSkills,
    profileCompleted: form.profileCompleted,
    emergencyContact: form.emergencyContact.trim(),
    profilePictureUrl: form.profilePictureUrl.trim(),
    updatedAt: timestamp,
    lastProfileUpdateAt: timestamp,
  };
};

const getSortLabel = (field: SortField) => {
  switch (field) {
    case "gpa":
      return "GPA";
    case "name":
      return "Name";
    default:
      return "Last update";
  }
};

export default function StudentManagementPage() {
  const { students, isLoading, error } = useStudentsCollection();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");
  const [sortField, setSortField] = useState<SortField>("lastUpdated");
  const [sortDirectionDesc, setSortDirectionDesc] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(initialEditState);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);
  const [isUniversityPickerOpen, setIsUniversityPickerOpen] = useState(false);
  const [universityFilter, setUniversityFilter] = useState<UniversityFilterOption>("all");
  const [isSkillsPickerOpen, setIsSkillsPickerOpen] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<StudentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const departmentOptions = useMemo(() => {
    const unique = new Set<string>();
    students.forEach((student) => {
      if (student.department) unique.add(student.department);
    });
    return ["all", ...Array.from(unique)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = (student: StudentRecord) => {
      if (query.length === 0) return true;
      return (
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query)
      );
    };

    const matchesDepartment = (student: StudentRecord) =>
      departmentFilter === "all" || student.department.toLowerCase() === departmentFilter.toLowerCase();

    const matchesCompletion = (student: StudentRecord) => {
      if (completionFilter === "completed") return student.profileCompleted;
      if (completionFilter === "incomplete") return !student.profileCompleted;
      return true;
    };

    return students.filter((student) => matchesSearch(student) && matchesDepartment(student) && matchesCompletion(student));
  }, [students, searchQuery, departmentFilter, completionFilter]);

  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    list.sort((a, b) => {
      const multiplier = sortDirectionDesc ? -1 : 1;
      if (sortField === "gpa") {
        const aValue = a.gpa ?? -Infinity;
        const bValue = b.gpa ?? -Infinity;
        if (aValue === bValue) return 0;
        return aValue > bValue ? multiplier : -multiplier;
      }

      if (sortField === "name") {
        return a.name.localeCompare(b.name) * multiplier;
      }

      const aDate = a.lastProfileUpdateAt ?? a.updatedAt ?? a.createdAt ?? null;
      const bDate = b.lastProfileUpdateAt ?? b.updatedAt ?? b.createdAt ?? null;
      const aTime = aDate ? aDate.getTime() : 0;
      const bTime = bDate ? bDate.getTime() : 0;
      if (aTime === bTime) return 0;
      return aTime > bTime ? multiplier : -multiplier;
    });
    return list;
  }, [filteredStudents, sortField, sortDirectionDesc]);

  const openEditDialog = (student: StudentRecord) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      email: student.email,
      gender: student.gender,
      department: student.department,
      university: student.university,
      rollNumber: student.rollNumber,
      contactNumber: student.contactNumber,
      address: student.address,
      gpa: student.gpa !== null ? student.gpa.toString() : "",
      skills: student.skills ?? [],
      profileCompleted: student.profileCompleted,
      emergencyContact: student.emergencyContact,
      profilePictureUrl: student.profilePictureUrl,
    });
    setIsEditOpen(true);
    setUniversityFilter("all");
    setIsUniversityPickerOpen(false);
    setIsSkillsPickerOpen(false);
    setCustomSkillInput("");
  };

  const closeEditDialog = () => {
    setIsEditOpen(false);
    setSelectedStudent(null);
    setEditForm(initialEditState);
    setIsProcessingEdit(false);
    setIsUniversityPickerOpen(false);
    setIsSkillsPickerOpen(false);
    setCustomSkillInput("");
  };

  const handleEditFieldChange = (field: keyof EditFormState, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSkill = (skill: string) => {
    setEditForm((prev) => {
      const isSelected = prev.skills.includes(skill);
      const nextSkills = isSelected ? prev.skills.filter((item) => item !== skill) : [...prev.skills, skill];
      return { ...prev, skills: nextSkills };
    });
  };

  const handleClearSkills = () => {
    setEditForm((prev) => ({ ...prev, skills: [] }));
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed.length === 0) return;
    setEditForm((prev) => {
      if (prev.skills.includes(trimmed)) {
        return prev;
      }
      return { ...prev, skills: [...prev.skills, trimmed] };
    });
    setCustomSkillInput("");
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;
    setIsProcessingEdit(true);
    try {
      const payload = sanitizeEditPayload(editForm);
      await updateStudentDoc(selectedStudent.id, payload);
      await addAdminNotification({
        type: "updateStudent",
        uid: selectedStudent.id,
        studentName: (payload.name as string) || selectedStudent.name,
        message: "Student data updated",
        metadata: { profileCompleted: payload.profileCompleted },
      });
      toast({
        title: "Student updated",
        description: `${(payload.name as string) || selectedStudent.name} has been updated.`,
      });
      closeEditDialog();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Unable to update student.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
      setIsProcessingEdit(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteStudentDoc(deleteTarget.id);
      await addAdminNotification({
        type: "deleteStudent",
        uid: deleteTarget.id,
        studentName: deleteTarget.name,
        message: "Student deleted",
      });
      toast({ title: "Student removed", description: `${deleteTarget.name} has been deleted.` });
      setDeleteTarget(null);
      setIsDeleting(false);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete student.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle>Student Management</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>{sortedStudents.length} students</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Label htmlFor="student-search" className="text-xs uppercase tracking-wide text-muted-foreground">
                Search
              </Label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 dark:bg-slate-950/60">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="student-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, or roll number"
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Department</Label>
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground dark:bg-slate-950/60"
              >
                {departmentOptions.map((department) => (
                  <option key={department} value={department} className="bg-background text-foreground dark:bg-slate-900 dark:text-slate-100">
                    {department === "all" ? "All departments" : department}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between lg:flex-col">
              <div className="flex-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Profile status</Label>
                <select
                  value={completionFilter}
                  onChange={(event) => setCompletionFilter(event.target.value as CompletionFilter)}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground dark:bg-slate-950/60"
                >
                  <option value="all">All students</option>
                  <option value="completed">Completed</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sort by</Label>
                  <select
                    value={sortField}
                    onChange={(event) => setSortField(event.target.value as SortField)}
                    className="mt-1 w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground dark:bg-slate-950/60"
                  >
                    <option value="lastUpdated">Last update</option>
                    <option value="gpa">GPA</option>
                    <option value="name">Name</option>
                  </select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 h-10 w-10 rounded-xl"
                  onClick={() => setSortDirectionDesc((prev) => !prev)}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active students</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">Unable to load students at the moment.</p>
              <p className="text-xs text-muted-foreground/80">{error}</p>
            </div>
          ) : sortedStudents.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-12 text-center text-muted-foreground">
              <p>No students found.</p>
              <p className="text-xs">Students will appear here once they complete their profile.</p>
            </div>
          ) : (
            <div className="max-h-[520px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background backdrop-blur-xl">
                  <TableRow className="border-border/60">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Department</TableHead>
                    <TableHead className="text-muted-foreground">GPA</TableHead>
                    <TableHead className="text-muted-foreground">Profile completed</TableHead>
                    <TableHead className="text-muted-foreground">Last update</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className={cn(
                        "border-border/60 text-muted-foreground transition hover:bg-muted/40",
                        !student.profileCompleted && "bg-amber-50/70 dark:bg-amber-500/10",
                      )}
                    >
                      <TableCell className="font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>{student.name || "Unnamed student"}</span>
                          {student.rollNumber && <span className="text-xs text-muted-foreground">ID: {student.rollNumber}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{student.email || "—"}</TableCell>
                      <TableCell>
                        {student.department ? (
                          <Badge variant="outline" className="rounded-xl border-border/60 bg-muted/40 text-xs text-foreground dark:bg-white/10 dark:text-slate-100">
                            {student.department}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{student.gpa !== null ? student.gpa.toFixed(2) : "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={student.profileCompleted ? "secondary" : "destructive"}
                          className="rounded-xl text-xs"
                        >
                          {student.profileCompleted ? "Completed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(student.lastProfileUpdateAt ?? student.updatedAt ?? student.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => openEditDialog(student)}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            View / Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-xl"
                            onClick={() => setDeleteTarget(student)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={(open) => (open ? setIsEditOpen(true) : closeEditDialog())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
            <DialogDescription>Update student details and profile completion status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-background/60 p-4 dark:bg-slate-900/60">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={editForm.profilePictureUrl} alt={editForm.name} />
                  <AvatarFallback>{editForm.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="edit-profile-picture">Profile picture URL</Label>
                  <Input
                    id="edit-profile-picture"
                    value={editForm.profilePictureUrl}
                    onChange={(event) => handleEditFieldChange("profilePictureUrl", event.target.value)}
                    placeholder="https://..."
                    className="mt-1 rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Paste a valid image URL to update the student's photo.</p>
                </div>
              </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(event) => handleEditFieldChange("name", event.target.value)}
                placeholder="Student name"
                className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(event) => handleEditFieldChange("email", event.target.value)}
                placeholder="name@example.com"
                className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-gender">Gender</Label>
              <Select value={editForm.gender} onValueChange={(value) => handleEditFieldChange("gender", value)}>
                <SelectTrigger id="edit-gender" className="rounded-xl border border-border/60 bg-background/80 text-left font-normal dark:bg-slate-900/60">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/60 bg-background/95 text-foreground dark:bg-slate-950/95">
                  {genders.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select value={editForm.department} onValueChange={(value) => handleEditFieldChange("department", value)}>
                <SelectTrigger id="edit-department" className="rounded-xl border border-border/60 bg-background/80 text-left font-normal dark:bg-slate-900/60">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/60 bg-background/95 text-foreground dark:bg-slate-950/95">
                  {departments.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-university">University</Label>
              <Popover open={isUniversityPickerOpen} onOpenChange={setIsUniversityPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isUniversityPickerOpen}
                    className="justify-between rounded-xl border border-border/60 bg-background/80 text-left font-normal dark:bg-slate-900/60"
                  >
                    {editForm.university || "Select university"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] rounded-2xl border border-border/60 bg-background/95 p-0 text-foreground shadow-xl backdrop-blur-xl dark:bg-slate-950/95">
                  <div className="border-b border-border/40 p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { key: "all" as const, label: "All" },
                          { key: "public" as const, label: "Public" },
                          { key: "private" as const, label: "Private" },
                        ]
                      ).map(({ key, label }) => (
                        <Button
                          key={key}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setUniversityFilter(key)}
                          className={cn(
                            "h-8 w-full border-border/40 bg-background/80 text-xs font-medium hover:bg-background",
                            universityFilter === key && "border-primary bg-primary/10 text-primary",
                          )}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Search universities..." className="border-b border-border/40" />
                    <CommandEmpty className="px-3 py-2 text-sm text-muted-foreground">No university found.</CommandEmpty>
                    <CommandList className="max-h-72">
                      {(universityFilter === "all" || universityFilter === "public") && (
                        <CommandGroup heading="Public Universities">
                          {publicUniversities.map((university) => {
                            const isSelected = editForm.university === university;
                            return (
                              <CommandItem
                                key={`public-${university}`}
                                value={university}
                                onSelect={() => {
                                  handleEditFieldChange("university", university);
                                  setIsUniversityPickerOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                {university}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                      {(universityFilter === "all" || universityFilter === "private") && (
                        <CommandGroup heading="Private Universities">
                          {privateUniversities.map((university) => {
                            const isSelected = editForm.university === university;
                            return (
                              <CommandItem
                                key={`private-${university}`}
                                value={university}
                                onSelect={() => {
                                  handleEditFieldChange("university", university);
                                  setIsUniversityPickerOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                {university}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-roll">Roll number</Label>
              <Input
                id="edit-roll"
                value={editForm.rollNumber}
                onChange={(event) => handleEditFieldChange("rollNumber", event.target.value)}
                placeholder="Student ID"
                className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-contact">Contact number</Label>
              <Input
                id="edit-contact"
                name="contactNumber"
                value={editForm.contactNumber}
                onChange={(event) => handleEditFieldChange("contactNumber", event.target.value)}
                placeholder="Contact number"
                className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={editForm.address}
                onChange={(event) => handleEditFieldChange("address", event.target.value)}
                placeholder="Residential address"
                className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-emergency">Emergency contact</Label>
              <Input
                id="edit-emergency"
                value={editForm.emergencyContact}
                onChange={(event) => handleEditFieldChange("emergencyContact", event.target.value)}
                placeholder="Emergency contact information"
                className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-gpa">GPA</Label>
              <Input
                id="edit-gpa"
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={editForm.gpa}
                onChange={(event) => handleEditFieldChange("gpa", event.target.value)}
                placeholder="3.75"
                className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
              />
            </div>
            <div className="grid gap-2">
              <Label>Skills / Interests</Label>
              <Popover open={isSkillsPickerOpen} onOpenChange={setIsSkillsPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isSkillsPickerOpen}
                    className="justify-between rounded-xl border border-border/60 bg-background/80 text-left font-normal dark:bg-slate-900/60"
                  >
                    {editForm.skills.length > 0 ? `${editForm.skills.length} selected` : "Select skills"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] rounded-2xl border border-border/60 bg-background/95 p-0 text-foreground shadow-xl backdrop-blur-xl dark:bg-slate-950/95">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Search skills..." className="border-b border-border/40" />
                    <CommandEmpty className="px-3 py-2 text-sm text-muted-foreground">No skills found.</CommandEmpty>
                    <CommandList className="max-h-72">
                      <CommandGroup heading="Popular Skills">
                        {skillsOptions.map((skill) => {
                          const isSelected = editForm.skills.includes(skill);
                          return (
                            <CommandItem
                              key={skill}
                              value={skill}
                              onSelect={() => handleToggleSkill(skill)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                              {skill}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex flex-wrap gap-2">
                {editForm.skills.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No skills selected.</p>
                ) : (
                  editForm.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="flex items-center gap-1 rounded-full px-2 py-1 text-xs"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleToggleSkill(skill)}
                        className="ml-1 text-muted-foreground transition hover:text-foreground"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="edit-custom-skill"
                  value={customSkillInput}
                  onChange={(event) => setCustomSkillInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  placeholder="Add custom skill"
                  className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={handleAddCustomSkill} className="flex-1 sm:flex-none">
                    Add skill
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleClearSkills} className="flex-1 sm:flex-none">
                    Clear all
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3 dark:bg-slate-900/60">
              <div>
                <p className="text-sm font-medium text-foreground">Profile completed</p>
                <p className="text-xs text-muted-foreground">Toggle to mark whether the student finished their profile.</p>
              </div>
              <Switch
                checked={editForm.profileCompleted}
                onCheckedChange={(checked) => handleEditFieldChange("profileCompleted", checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeEditDialog} disabled={isProcessingEdit}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateStudent} disabled={isProcessingEdit}>
              {isProcessingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <AlertDialogContent className="rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The student's profile record will be permanently deleted from Firestore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
