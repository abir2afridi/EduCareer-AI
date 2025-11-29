import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Pencil, Plus, Trash2, Users, DollarSign, Clock, Eye } from "lucide-react";
import { useTeachersCollection } from "@/hooks/useTeachersCollection";
import { createTeacherDoc, deleteTeacherDoc, updateTeacherDoc, listenToTeacherPayments } from "@/lib/firebaseHelpers";
import type { SocialLinks, TeacherPayload, TeacherRecord, TeacherPaymentRecord } from "@/data/teachers";
import { PaymentDetailsDialog } from "@/components/teacher/PaymentDetailsDialog";

type PaymentTab = "all" | "pending" | "approved" | "rejected";

const emptyForm: TeacherPayload = {
  teacherName: "",
  subject: "",
  email: "",
  qualification: "",
  qualificationDetails: "",
  institution: "",
  experience: "",
  description: "",
  avatarUrl: "",
  socialLinks: {},
  monthlyFee: 0,
  hiredStudents: [],
};

export default function TeacherManagementPage() {
  const { teachers, isLoading, error } = useTeachersCollection();
  const { toast } = useToast();
  const [payments, setPayments] = useState<TeacherPaymentRecord[]>([]);

  useEffect(() => {
    const unsubscribe = listenToTeacherPayments(
      (payments) => setPayments(payments),
      (error) => console.error("Error listening to payments:", error)
    );
    return () => unsubscribe();
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formState, setFormState] = useState<TeacherPayload>(emptyForm);
  const [activeTeacher, setActiveTeacher] = useState<TeacherRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHiresDialogOpen, setIsHiresDialogOpen] = useState(false);
  const [teacherDialogTab, setTeacherDialogTab] = useState<PaymentTab>("all");
  const [teacherForDialog, setTeacherForDialog] = useState<TeacherRecord | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<TeacherPaymentRecord | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  }, [teachers]);

  const openAddDialog = () => {
    setActiveTeacher(null);
    setFormState(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (teacher: TeacherRecord) => {
    setActiveTeacher(teacher);
    setFormState({
      teacherName: teacher.teacherName,
      subject: teacher.subject,
      email: teacher.email,
      qualification: teacher.qualification,
      qualificationDetails: teacher.qualificationDetails ?? "",
      institution: teacher.institution ?? "",
      experience: teacher.experience,
      description: teacher.description,
      avatarUrl: teacher.avatarUrl,
      socialLinks: teacher.socialLinks ?? {},
      monthlyFee: teacher.monthlyFee ?? 0,
      hiredStudents: teacher.hiredStudents ?? [],
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: keyof TeacherPayload, value: string | number) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (field: keyof SocialLinks, value: string) => {
    setFormState((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks ?? {}),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!formState.teacherName.trim() || !formState.subject.trim()) {
      toast({ title: "Missing fields", description: "Name and subject are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTeacher) {
        await updateTeacherDoc(activeTeacher.id, formState);
        toast({ title: "Teacher updated", description: `${formState.teacherName} has been updated.` });
      } else {
        await createTeacherDoc(formState);
        toast({ title: "Teacher added", description: `${formState.teacherName} has been added.` });
      }
      setIsDialogOpen(false);
      setActiveTeacher(null);
      setFormState(emptyForm);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Something went wrong.";
      toast({ title: "Action failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "৳0.00";
    }
    return `৳${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTimestampMs = (timestamp: TeacherPaymentRecord["submittedAt"]) => {
    if (!timestamp) return 0;
    if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
    if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
    return 0;
  };

  const teacherPaymentsForDialog = useMemo(() => {
    if (!teacherForDialog) return [] as TeacherPaymentRecord[];
    return payments
      .filter((payment) => payment.teacherId === teacherForDialog.id)
      .sort((a, b) => getTimestampMs(b.submittedAt) - getTimestampMs(a.submittedAt));
  }, [payments, teacherForDialog]);

  const paymentsByTab = useMemo(() => {
    const grouped: Record<PaymentTab, TeacherPaymentRecord[]> = {
      all: teacherPaymentsForDialog,
      pending: teacherPaymentsForDialog.filter((payment) => payment.status === "pending"),
      approved: teacherPaymentsForDialog.filter((payment) => payment.status === "approved"),
      rejected: teacherPaymentsForDialog.filter((payment) => payment.status === "rejected"),
    };
    return grouped;
  }, [teacherPaymentsForDialog]);

  const tabEmptyMessages: Record<PaymentTab, string> = {
    all: "No hire requests submitted for this teacher yet.",
    pending: "No pending approvals at the moment.",
    approved: "No approved hires yet.",
    rejected: "No rejected requests yet.",
  };

  const paymentCounts = useMemo(
    () => ({
      all: paymentsByTab.all.length,
      pending: paymentsByTab.pending.length,
      approved: paymentsByTab.approved.length,
      rejected: paymentsByTab.rejected.length,
    }),
    [paymentsByTab],
  );

  const getStatusVariant = (status: TeacherPaymentRecord["status"]) => {
    switch (status) {
      case "approved":
        return "default" as const;
      case "rejected":
        return "destructive" as const;
      case "pending":
      default:
        return "outline" as const;
    }
  };

  const getCountdownLabel = (payment: TeacherPaymentRecord) => {
    if (!payment.expiresAt) {
      return payment.status === "approved" ? "Expired" : "—";
    }
    const expiresAtDate = payment.expiresAt.toDate();
    const diffMs = expiresAtDate.getTime() - now;
    if (diffMs <= 0) return "Expired";

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const formatDateTime = (timestamp: TeacherPaymentRecord["submittedAt"]) => {
    if (!timestamp || typeof timestamp.toDate !== "function") return "—";
    return format(timestamp.toDate(), "MMM d, yyyy p");
  };

  const openTeacherHiresDialog = (teacher: TeacherRecord, initialTab: PaymentTab = "all") => {
    setTeacherForDialog(teacher);
    setTeacherDialogTab(initialTab);
    setIsHiresDialogOpen(true);
  };

  const handleViewPayment = (payment: TeacherPaymentRecord) => {
    setSelectedPayment(payment);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentDialogChange = (open: boolean) => {
    setIsPaymentDialogOpen(open);
    if (!open) {
      setSelectedPayment(null);
    }
  };

  const handlePaymentResolved = () => {
    setSelectedPayment(null);
    setIsPaymentDialogOpen(false);
  };

  const renderPaymentsTable = (entries: TeacherPaymentRecord[], emptyMessage: string) => {
    if (entries.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-border/60 bg-background/80">
        <ScrollArea className="max-h-[420px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
              <TableRow>
                <TableHead className="text-muted-foreground">Student</TableHead>
                <TableHead className="text-muted-foreground">Submitted</TableHead>
                <TableHead className="text-muted-foreground">Duration</TableHead>
                <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground">Access</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const countdown = getCountdownLabel(entry);
                const expiresLabel = entry.expiresAt ? format(entry.expiresAt.toDate(), "MMM d, yyyy") : "—";
                return (
                  <TableRow key={entry.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-foreground">{entry.studentName || "Unknown"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(entry.submittedAt)}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <span className="font-medium text-foreground">
                          {entry.months} {entry.months === 1 ? "month" : "months"}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Monthly: {formatCurrency(entry.monthlyFee)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">
                      {formatCurrency(entry.totalAmount)}
                    </TableCell>
                    <TableCell>
                      {entry.status === "approved" ? (
                        <div className="space-y-1 text-sm">
                          <span className={`font-medium ${countdown === "Expired" ? "text-destructive" : "text-primary"}`}>
                            {countdown}
                          </span>
                          <span className="block text-xs text-muted-foreground">Ends {expiresLabel}</span>
                        </div>
                      ) : entry.status === "pending" ? (
                        <span className="text-xs text-amber-500">Awaiting approval</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(entry.status)} className="rounded-full px-3 py-1 text-xs">
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleViewPayment(entry)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {entry.status === "pending" ? "Review" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  const confirmDelete = (teacher: TeacherRecord) => {
    setActiveTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!activeTeacher) return;
    setIsDeleting(true);
    try {
      await deleteTeacherDoc(activeTeacher.id);
      toast({ title: "Teacher removed", description: `${activeTeacher.teacherName} has been deleted.` });
      setIsDeleteDialogOpen(false);
      setActiveTeacher(null);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete teacher.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Teacher Management</CardTitle>
            <p className="text-sm text-muted-foreground">Keep the mentor roster fresh and synced with Firestore.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-4" onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
              <DialogHeader>
                <DialogTitle>{activeTeacher ? "Edit teacher" : "Add new teacher"}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Provide faculty details. Changes persist to the /teachers collection.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="teacher-name">Full name</Label>
                    <Input
                      id="teacher-name"
                      value={formState.teacherName}
                      onChange={(event) => handleInputChange("teacherName", event.target.value)}
                      placeholder="Dr. Jane Doe"
                      className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teacher-subject">Subject</Label>
                    <Input
                      id="teacher-subject"
                      value={formState.subject}
                      onChange={(event) => handleInputChange("subject", event.target.value)}
                      placeholder="AI & Ethics"
                      className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="teacher-email">Email</Label>
                    <Input
                      id="teacher-email"
                      type="email"
                      value={formState.email}
                      onChange={(event) => handleInputChange("email", event.target.value)}
                      placeholder="name@example.com"
                      className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teacher-experience">Experience</Label>
                    <Input
                      id="teacher-experience"
                      value={formState.experience}
                      onChange={(event) => handleInputChange("experience", event.target.value)}
                      placeholder="10 years"
                      className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="teacher-qualification">Qualification</Label>
                    <Input
                      id="teacher-qualification"
                      value={formState.qualification}
                      onChange={(event) => handleInputChange("qualification", event.target.value)}
                      placeholder="PhD in Computer Science"
                      className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teacher-institution">Institution</Label>
                    <Input
                      id="teacher-institution"
                      value={formState.institution ?? ""}
                      onChange={(event) => handleInputChange("institution", event.target.value)}
                      placeholder="MIT"
                      className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="teacher-qualification-details">Qualification details</Label>
                  <Textarea
                    id="teacher-qualification-details"
                    value={formState.qualificationDetails ?? ""}
                    onChange={(event) => handleInputChange("qualificationDetails", event.target.value)}
                    placeholder="Specialized research areas, awards, thesis topics..."
                    className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="teacher-description">Description</Label>
                  <Textarea
                    id="teacher-description"
                    value={formState.description}
                    onChange={(event) => handleInputChange("description", event.target.value)}
                    placeholder="Brief bio or teaching philosophy"
                    className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="teacher-avatar">Avatar URL</Label>
                    <Input
                      id="teacher-avatar"
                      value={formState.avatarUrl}
                      onChange={(event) => handleInputChange("avatarUrl", event.target.value)}
                      placeholder="https://"
                      className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teacher-monthly-fee">Monthly Fee (USD)</Label>
                    <Input
                      id="teacher-monthly-fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.monthlyFee ?? 0}
                      onChange={(event) => handleInputChange("monthlyFee", Number(event.target.value))}
                      placeholder="0.00"
                      className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Social links</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {(
                      [
                        { key: "linkedin", label: "LinkedIn" },
                        { key: "twitter", label: "Twitter" },
                        { key: "facebook", label: "Facebook" },
                        { key: "whatsapp", label: "WhatsApp" },
                        { key: "github", label: "GitHub" },
                        { key: "researchGate", label: "ResearchGate" },
                        { key: "googleScholar", label: "Google Scholar" },
                      ] as { key: keyof SocialLinks; label: string }[]
                    ).map(({ key, label }) => (
                      <Input
                        key={key}
                        placeholder={`${label} URL`}
                        value={formState.socialLinks?.[key] ?? ""}
                        onChange={(event) => handleSocialLinkChange(key, event.target.value)}
                        className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" className="rounded-xl" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {activeTeacher ? "Update" : "Save"}
                </Button>
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
          <ScrollArea className="max-h-[520px]">
            <Table>
              <TableHeader className="sticky top-0 backdrop-blur-xl">
                <TableRow className="border-border/60">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Subject</TableHead>
                  <TableHead className="text-muted-foreground">Qualification</TableHead>
                  <TableHead className="text-muted-foreground">Experience</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground text-center">Hired</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && error && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-red-500">
                      Unable to load teachers. {error}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && sortedTeachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No teachers found. Add your first mentor using the button above.
                    </TableCell>
                  </TableRow>
                )}
                {sortedTeachers.map((teacher) => (
                  <TableRow key={teacher.id} className="border-border/60 text-muted-foreground hover:bg-muted/40">
                    <TableCell className="font-semibold text-foreground">{teacher.teacherName || "—"}</TableCell>
                    <TableCell>{teacher.subject || "—"}</TableCell>
                    <TableCell>{teacher.qualification || "—"}</TableCell>
                    <TableCell>{teacher.experience || "—"}</TableCell>
                    <TableCell>{teacher.email || "—"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-medium text-xs">
                          {teacher.hiredStudents?.length || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openEditDialog(teacher)}>
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openTeacherHiresDialog(teacher)} title="View hire requests">
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {}} title="Payment History">
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => confirmDelete(teacher)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
          <DialogHeader>
            <DialogTitle>Remove teacher</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The teacher will be removed from the /teachers collection and disappear from the student dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            {activeTeacher ? `Delete ${activeTeacher.teacherName}?` : "Delete this teacher?"}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHiresDialogOpen} onOpenChange={setIsHiresDialogOpen}>
        <DialogContent className="w-full max-w-4xl rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
          <DialogHeader>
            <DialogTitle>Hire requests {teacherForDialog ? `· ${teacherForDialog.teacherName}` : ""}</DialogTitle>
            <DialogDescription>Track payment submissions and manage approvals for this mentor.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Tabs value={teacherDialogTab} onValueChange={(value) => setTeacherDialogTab(value as PaymentTab)} className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <TabsList className="flex w-full flex-wrap gap-2 md:w-auto">
                  {(
                    [
                      { key: "all", label: "All", count: paymentCounts.all },
                      { key: "pending", label: "Pending", count: paymentCounts.pending },
                      { key: "approved", label: "Approved", count: paymentCounts.approved },
                      { key: "rejected", label: "Rejected", count: paymentCounts.rejected },
                    ] as { key: PaymentTab; label: string; count: number }[]
                  ).map(({ key, label, count }) => (
                    <TabsTrigger key={key} value={key} className="rounded-full px-4 py-2">
                      <span>{label}</span>
                      <Badge variant="secondary" className="ml-2 rounded-full px-2 text-xs">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Live countdown updates every second
                </div>
              </div>

              <TabsContent value="all" className="mt-0">
                {renderPaymentsTable(paymentsByTab.all, tabEmptyMessages.all)}
              </TabsContent>
              <TabsContent value="pending" className="mt-0">
                {renderPaymentsTable(paymentsByTab.pending, tabEmptyMessages.pending)}
              </TabsContent>
              <TabsContent value="approved" className="mt-0">
                {renderPaymentsTable(paymentsByTab.approved, tabEmptyMessages.approved)}
              </TabsContent>
              <TabsContent value="rejected" className="mt-0">
                {renderPaymentsTable(paymentsByTab.rejected, tabEmptyMessages.rejected)}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHiresDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedPayment && (
        <PaymentDetailsDialog
          payment={selectedPayment}
          open={isPaymentDialogOpen}
          onOpenChange={handlePaymentDialogChange}
          onPaymentResolved={handlePaymentResolved}
        />
      )}
    </div>
  );
}
