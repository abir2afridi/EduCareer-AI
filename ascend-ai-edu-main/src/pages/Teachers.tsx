import { useEffect, useMemo, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/StarRating";
import { useTeacherRatingsBatch } from "@/hooks/useTeacherRatings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Search, Mail, Phone, Award, BookOpen, GraduationCap, Loader2, CreditCard, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTeachersCollection } from "@/hooks/useTeachersCollection";
import { useAuth } from "@/components/auth-provider";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { submitTeacherPayment } from "@/lib/firebaseHelpers";
import { useStudentTeacherHires } from "@/hooks/useStudentTeacherHires";
import type { StudentTeacherHireRecord } from "@/hooks/useStudentTeacherHire";

const formatAmount = (amount: number) => `৳${amount.toLocaleString()}`;

const getExpiryDate = (expiresAt: unknown): Date | null => {
  if (!expiresAt) return null;
  if (typeof expiresAt === "object" && expiresAt !== null && "toDate" in expiresAt && typeof expiresAt.toDate === "function") {
    return expiresAt.toDate() as Date;
  }
  if (expiresAt instanceof Date) return expiresAt;
  return null;
};

const formatCountdown = (expiresAt: Date | null, now: number) => {
  if (!expiresAt) return null;
  const diffMs = expiresAt.getTime() - now;
  if (diffMs <= 0) return "Access ended";

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const segments: string[] = [];
  if (days > 0) segments.push(`${days}d`);
  if (hours > 0 || days > 0) segments.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) segments.push(`${minutes}m`);
  segments.push(`${seconds}s`);

  return `${segments.join(" ")} remaining`;
};

const formatExpiryDetail = (expiresAt: Date | null) => {
  if (!expiresAt) return null;
  return expiresAt.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

export default function Teachers() {
  const navigate = useNavigate();
  const { teachers, isLoading, error } = useTeachersCollection();
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid ?? null);
  const { hires } = useStudentTeacherHires(user?.uid ?? null);
  const { toast } = useToast();
  
  // Get ratings for all teachers
  const { ratings: teacherRatings } = useTeacherRatingsBatch(
    teachers.map(teacher => teacher.id)
  );

  // Debug logs
  useEffect(() => {
    console.log('Teacher ratings:', teacherRatings);
  }, [teacherRatings]);

  const [isHireDialogOpen, setIsHireDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState("1");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const monthsOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => String(index + 1)), []);

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === selectedTeacherId) ?? null,
    [teachers, selectedTeacherId],
  );

  const monthlyFee = selectedTeacher?.monthlyFee ?? 0;
  const totalAmount = useMemo(() => monthlyFee * Number(selectedMonths || "1"), [monthlyFee, selectedMonths]);

  const totalExperience = teachers.reduce((sum, teacher) => {
    const numeric = parseInt(teacher.experience, 10);
    return Number.isFinite(numeric) ? sum + numeric : sum;
  }, 0);

  const featuredTeachers = teachers.slice(0, 3);

  const resetHireState = () => {
    setSelectedTeacherId(null);
    setSelectedMonths("1");
    setTransactionId("");
    setIsSubmitting(false);
  };

  const handleOpenHireDialog = (teacherId: string) => {
    if (!user) {
      toast({ title: "Sign-in required", description: "Please sign in to hire a teacher.", variant: "destructive" });
      navigate("/auth/signin", { state: { from: { pathname: "/teachers" } } });
      return;
    }

    setSelectedTeacherId(teacherId);
    setSelectedMonths("1");
    setTransactionId("");
    setIsHireDialogOpen(true);
  };

  const handleHireSubmit = async () => {
    if (!user || !selectedTeacher) {
      toast({ title: "Unable to proceed", description: "Missing student or teacher information.", variant: "destructive" });
      return;
    }

    const monthsNumber = Number(selectedMonths);
    if (!Number.isInteger(monthsNumber) || monthsNumber < 1) {
      toast({ title: "Invalid duration", description: "Please choose a valid month selection.", variant: "destructive" });
      return;
    }

    if (!transactionId.trim()) {
      toast({ title: "Transaction ID required", description: "Enter the bKash transaction ID to continue.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitTeacherPayment({
        studentId: user.uid,
        studentUid: user.uid,
        studentName: profile?.name ?? user.displayName ?? undefined,
        teacherId: selectedTeacher.id,
        teacherName: selectedTeacher.teacherName,
        months: monthsNumber,
        monthlyFee: selectedTeacher.monthlyFee ?? 0,
        totalAmount: (selectedTeacher.monthlyFee ?? 0) * monthsNumber,
        transactionId: transactionId.trim(),
      });

      toast({ title: "Payment submitted", description: "Your payment is under review." });
      setIsHireDialogOpen(false);
      resetHireState();
    } catch (submitError) {
      if (submitError && typeof submitError === "object" && "code" in submitError && "message" in submitError) {
        const { code, message } = submitError as { code?: unknown; message?: unknown };
        console.error("FIRESTORE ERROR: submitTeacherPayment failed", {
          code,
          message,
          studentUid: user.uid,
          teacherId: selectedTeacher?.id,
        });
      } else {
        console.error("FIRESTORE ERROR: submitTeacherPayment failed", submitError);
      }

      const message = submitError instanceof Error ? submitError.message : "Unable to submit payment.";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hiresLookup = useMemo(() => {
    const lookup = new Map<string, StudentTeacherHireRecord>();
    hires.forEach((hire) => {
      lookup.set(hire.teacherId, hire);
    });
    return lookup;
  }, [hires]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 rounded-3xl border border-border/50 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:bg-slate-950/75 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="outline" className="w-fit uppercase tracking-widest">Mentor Network</Badge>
              <h2 className="text-3xl font-bold gradient-text mt-2">Explore Mentors</h2>
              <p className="text-muted-foreground">
                Browse our active faculty database. Profiles update instantly whenever the admin panel changes.
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Faculty</p>
              <p className="text-base font-semibold text-primary">{teachers.length}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/70 p-3 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Avg Experience Snapshot</p>
              <p className="text-base font-semibold text-foreground">
                {teachers.length > 0 ? `${Math.round(totalExperience / teachers.length)} yrs` : "—"}
              </p>
            </div>
          </div>
          {user && hires.length > 0 && (
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-widest text-primary/80">Your active sessions</p>
              <div className="mt-2 space-y-2 text-sm">
                {hires
                  .filter((hire) => hire.status === "active")
                  .map((hire) => {
                    const expiresAt = getExpiryDate(hire.expiresAt ?? null);
                    const countdown = formatCountdown(expiresAt, now);
                    const expiryDetail = formatExpiryDetail(expiresAt);
                    const countdownEnded = countdown === "Access ended" || countdown === null;
                    return (
                      <div key={hire.teacherId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background/70 px-3 py-2">
                        <span className="font-medium text-foreground">{hire.teacherName ?? "Teacher"}</span>
                        <span className={`flex flex-col text-right text-xs ${countdownEnded ? "text-destructive" : "text-primary"}`}>
                          {countdown ?? "Access ended"}
                          {!countdownEnded && expiryDetail && (
                            <span className="text-[10px] text-muted-foreground">({expiryDetail})</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                {hires.filter((hire) => hire.status === "active").length === 0 && (
                  <p className="text-xs text-muted-foreground">No active hires right now.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-3xl" />
          <DotLottieReact
            src="https://lottie.host/421f068f-1128-4ec0-818b-6323e40be4bb/E93DMvnPPk.lottie"
            autoplay
            loop
            className="relative h-48 w-48 md:h-56 md:w-56"
          />
        </div>
      </div>

      <Card className="glass p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers by name or department..."
              className="pl-10 bg-input border-border/50"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading && (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} className="glass p-6">
                  <div className="flex flex-col gap-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <Card className="glass p-6 text-center text-sm text-red-500">
              Unable to load teachers right now. {error}
            </Card>
          )}

          {!isLoading && !error && teachers.length === 0 && (
            <Card className="glass p-6 text-center text-muted-foreground">
              No teachers found yet. Once the admin adds faculty, they will appear here automatically.
            </Card>
          )}

          {teachers.map((teacher, index) => {
            const hireRecord = hiresLookup.get(teacher.id);
            const expiresAt = getExpiryDate(hireRecord?.expiresAt ?? null);
            const countdownLabel = hireRecord?.status === "active" ? formatCountdown(expiresAt, now) : null;
            const expiryDetailLabel = formatExpiryDetail(expiresAt);
            const hasActiveHire =
              hireRecord?.status === "active" && countdownLabel !== null && countdownLabel !== "Access ended";
            const hireButtonLabel = hasActiveHire ? "Already Hired" : "Hire This Teacher";
            const isAccessEnded = countdownLabel === null || countdownLabel === "Access ended";

            return (
              <Card
                key={teacher.id}
                className="glass p-6 hover:shadow-glow transition-all animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-16 w-16">
                      {teacher.avatarUrl ? (
                        <AvatarImage src={teacher.avatarUrl} alt={teacher.teacherName} />
                      ) : (
                        <AvatarFallback className="bg-gradient-primary text-lg text-white">
                          {teacher.teacherName
                            .split(" ")
                            .filter(Boolean)
                            .map(word => word[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{teacher.teacherName}</h3>
                      <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {teacherRatings[teacher.id]?.totalReviews > 0 ? (
                          <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
                            <span className="text-sm font-medium text-foreground">
                              {teacherRatings[teacher.id]?.averageRating?.toFixed(1) || '0.0'}
                            </span>
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground ml-1">
                              ({teacherRatings[teacher.id]?.totalReviews || 0} {teacherRatings[teacher.id]?.totalReviews === 1 ? 'review' : 'reviews'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No reviews yet</span>
                        )}
                      </div>
                    </div>
                    {teacher.experience && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        {teacher.experience}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Qualification</p>
                      <p className="text-sm font-medium text-foreground">{teacher.qualification || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Experience</p>
                      <p className="text-sm font-medium text-secondary">{teacher.experience || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Fee</p>
                      <p className="text-sm font-semibold text-foreground">
                        {teacher.monthlyFee ? formatAmount(teacher.monthlyFee) : "Not set"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {teacher.email && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => (window.location.href = `mailto:${teacher.email}`)}>
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      )}
                      {teacher.description && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/teachers/${teacher.id}`)}>
                          <Phone className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/30 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{teacher.email || "No email provided"}</span>
                    </span>
                    {hireRecord?.status === "active" && (
                      <Badge
                        variant="outline"
                        className={`flex flex-wrap items-center gap-2 border-primary/40 text-primary ${
                          isAccessEnded ? "text-destructive border-destructive/40" : ""
                        }`}
                      >
                        {isAccessEnded ? (
                          "Access ended"
                        ) : (
                          <>
                            <span className="font-medium">Access ends:</span>
                            <span>{countdownLabel}</span>
                            {expiryDetailLabel && (
                              <span className="text-xs text-muted-foreground">({expiryDetailLabel})</span>
                            )}
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/teachers/${teacher.id}`)}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenHireDialog(teacher.id)}
                      disabled={hasActiveHire}
                      variant={hasActiveHire ? "secondary" : "default"}
                      className={hasActiveHire ? "cursor-not-allowed" : undefined}
                    >
                      {hireButtonLabel}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Top Mentors
          </h3>
          <div className="space-y-3">
            {featuredTeachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                <span className="text-sm font-medium">{teacher.teacherName}</span>
                <span className="text-xs text-muted-foreground">{teacher.subject}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            Qualifications
          </h3>
          <div className="space-y-3">
            {featuredTeachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                <span className="text-sm font-medium">{teacher.teacherName}</span>
                <span className="text-xs text-muted-foreground">{teacher.qualification || "—"}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-6 bg-gradient-card">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-white" />
            Snapshot
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Faculty</span>
              <span className="font-semibold">{teachers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Experience</span>
              <span className="font-semibold">
                {teachers.length > 0 ? `${Math.round(totalExperience / teachers.length)} yrs` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Highlighted Subjects</span>
              <span className="font-semibold">
                {Array.from(new Set(teachers.map((teacher) => teacher.subject))).slice(0, 2).join(", ") || "—"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Dialog
        open={isHireDialogOpen}
        onOpenChange={(open) => {
          setIsHireDialogOpen(open);
          if (!open) {
            resetHireState();
          }
        }}
      >
        <DialogContent className="w-full max-w-2xl rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
          <DialogHeader>
            <DialogTitle>Hire {selectedTeacher?.teacherName}</DialogTitle>
            <DialogDescription>
              Complete the payment details to submit your hire request. Admin will review and approve shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="space-y-2 rounded-2xl border border-border/50 bg-muted/10 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <CreditCard className="h-4 w-4" />
                Payment Number
              </div>
              <p className="text-lg font-semibold tracking-wide">01612340404</p>
              <p className="text-muted-foreground">Send the total amount to this bKash number before submitting.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Months to hire</Label>
                <Select value={selectedMonths} onValueChange={setSelectedMonths}>
                  <SelectTrigger className="rounded-xl border border-border/60 bg-background/70">
                    <SelectValue placeholder="Select months" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    sideOffset={8}
                    className="max-h-60 overflow-auto rounded-xl border border-border/60 bg-background/95 shadow-xl"
                  >
                    {monthsOptions.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month} {Number(month) > 1 ? "months" : "month"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fee summary</Label>
                <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                    <span>Per month</span>
                    <span className="text-sm font-semibold text-foreground">{formatAmount(monthlyFee)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Selected months</span>
                    <span className="font-medium text-foreground">{selectedMonths}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                    <span>Total fee</span>
                    <span>{formatAmount(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-id">bKash Transaction ID</Label>
              <Input
                id="transaction-id"
                placeholder="Enter your bKash transaction ID"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                className="rounded-xl border border-border/60 bg-background/80"
              />
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-widest text-primary/80">Total payable</p>
              <p className="text-2xl font-bold text-primary">{formatAmount(totalAmount)}</p>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsHireDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={handleHireSubmit} disabled={isSubmitting || !selectedTeacher}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
