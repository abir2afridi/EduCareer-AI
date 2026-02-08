import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, Phone, MapPin, GraduationCap, CalendarDays, Shield, Bell, AlertCircle, ChevronsUpDown, Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth-provider";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useStudentNotifications } from "@/hooks/useStudentNotifications";
import {
  submitProfileChangeRequest,
  addAdminNotification,
  addStudentNotification,
  markProfileChangePending,
  PROFILE_CHANGE_COOLDOWN_MS,
} from "@/lib/firebaseHelpers";
import { departments, genders } from "@/constants/profileOptions";
import { publicUniversities, privateUniversities } from "@/constants/universities";
import { db, storage } from "@/lib/firebaseClient";
import { cn } from "@/lib/utils";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "number") return new Date(value);
  return null;
};

const formatDate = (value: unknown, fallback = "—") => {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
};

const formatDob = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name || email || "";
  if (!source) return "ST";
  const parts = source.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const createDefaultFormState = () => ({
  name: "",
  email: "",
  department: "",
  university: "",
  rollNumber: "",
  contactNumber: "",
  address: "",
  gpa: "",
  dob: "",
  gender: "",
  emergencyContact: "",
  skills: "",
});

type FormState = ReturnType<typeof createDefaultFormState>;

const allUniversities = [...publicUniversities, ...privateUniversities];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useStudentProfile(user?.uid ?? null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading: isNotificationsLoading,
    error: notificationsError,
  } = useStudentNotifications(user?.uid ?? null);
  const { toast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<FormState>(createDefaultFormState);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isUniversityOpen, setIsUniversityOpen] = useState(false);
  const [universityFilter, setUniversityFilter] = useState<"all" | "public" | "private">("all");
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const safeProfile = profile ?? null;
  const notificationsList = useMemo(
    () => (Array.isArray(notifications) ? notifications : []),
    [notifications],
  );
  const initials = useMemo(
    () => getInitials(profile?.name, profile?.email ?? user?.email ?? null),
    [profile?.name, profile?.email, user?.email],
  );

  const cooldownActive = cooldownRemainingMs > 0;

  const cooldownLabel = useMemo(() => {
    if (!cooldownActive) return "";
    const totalSeconds = Math.max(0, Math.floor(cooldownRemainingMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) {
      const parts: string[] = [`${days}d`];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      return parts.join(" ");
    }
    if (hours > 0) {
      const parts: string[] = [`${hours}h`];
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      return parts.join(" ");
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [cooldownActive, cooldownRemainingMs]);

  const submitButtonLabel = useMemo(() => {
    if (isSubmitting) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      );
    }
    if (hasPendingRequest) {
      if (cooldownActive && cooldownLabel) {
        return `Request pending • ${cooldownLabel}`;
      }
      return "Request pending review";
    }
    if (cooldownActive) {
      return `Submit request • ${cooldownLabel}`;
    }
    return "Submit request";
  }, [cooldownActive, cooldownLabel, hasPendingRequest, isSubmitting]);

  const submitDisabledReason = useMemo(() => {
    if (isSubmitting) return "";
    if (hasPendingRequest) {
      if (cooldownActive && cooldownLabel) {
        return `Request pending review. Next submission available in ${cooldownLabel}.`;
      }
      return "You already have a request awaiting review.";
    }
    if (cooldownActive) return `Next submission available in ${cooldownLabel}.`;
    return "";
  }, [cooldownActive, cooldownLabel, hasPendingRequest, isSubmitting]);

  const skillsList = useMemo(
    () =>
      Array.isArray(safeProfile?.skills)
        ? safeProfile.skills.filter((skill): skill is string => Boolean(skill))
        : [],
    [safeProfile?.skills],
  );

  const resetPhotoSelection = () => {
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
    }
    setProfilePicturePreview(null);
    setProfilePictureFile(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      resetPhotoSelection();
      setIsUniversityOpen(false);
      setUniversityFilter("all");
    }
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
    }

    setProfilePictureFile(file);
    setProfilePicturePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!safeProfile) {
      setFormState(createDefaultFormState());
      return;
    }

    setFormState({
      name: safeProfile.name ?? "",
      email: safeProfile.email ?? user?.email ?? "",
      department: safeProfile.department ?? "",
      university: safeProfile.university ?? "",
      rollNumber: safeProfile.rollNumber ?? "",
      contactNumber: safeProfile.contactNumber ?? "",
      address: safeProfile.address ?? "",
      gpa: safeProfile.gpa !== undefined && safeProfile.gpa !== null ? safeProfile.gpa.toString() : "",
      dob: safeProfile.dob ?? "",
      gender: safeProfile.gender ?? "",
      emergencyContact: safeProfile.emergencyContact ?? "",
      skills: Array.isArray(safeProfile.skills) ? safeProfile.skills.join(", ") : "",
    });
  }, [safeProfile, user?.email]);

  const applyCooldown = (target: Date | null) => {
    setCooldownUntil(target);
    if (target) {
      const diff = target.getTime() - Date.now();
      setCooldownRemainingMs(diff > 0 ? diff : 0);
    } else {
      setCooldownRemainingMs(0);
    }
  };

  useEffect(() => {
    return () => {
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [profilePicturePreview]);

  useEffect(() => {
    if (!user?.uid) {
      applyCooldown(null);
      return;
    }

    const requestsRef = collection(db, "profileChangeRequests");
    const requestsQuery = query(requestsRef, where("studentUid", "==", user.uid), limit(50));

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        let latestSubmission: Date | null = null;
        let pendingWithinCooldown = false;
        const now = Date.now();

        snapshot.docs.forEach((requestDoc) => {
          const data = requestDoc.data();
          const status = typeof data.status === "string" ? data.status : "pending";
          const submission = toDate(data.lastSubmissionTimestamp) ?? toDate(data.timestamp);

          if (status === "pending") {
            if (!submission) {
              pendingWithinCooldown = true;
            } else if (submission.getTime() + PROFILE_CHANGE_COOLDOWN_MS > now) {
              pendingWithinCooldown = true;
            }
          }

          if (submission && (!latestSubmission || submission.getTime() > latestSubmission.getTime())) {
            latestSubmission = submission;
          }
        });

        setHasPendingRequest(pendingWithinCooldown);

        if (latestSubmission) {
          applyCooldown(new Date(latestSubmission.getTime() + PROFILE_CHANGE_COOLDOWN_MS));
        } else {
          applyCooldown(null);
        }
      },
      (subscriptionError) => {
        console.error("profileChangeRequests subscription failed", subscriptionError);
        setHasPendingRequest(false);
        applyCooldown(null);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const submissionAt =
      toDate(safeProfile?.profileChangeLastSubmissionAt) ?? toDate(safeProfile?.profileChangeLastApprovedAt);

    if (safeProfile?.profileChangePending === true) {
      if (submissionAt) {
        const remaining = submissionAt.getTime() + PROFILE_CHANGE_COOLDOWN_MS - Date.now();
        setHasPendingRequest(remaining > 0);
      } else {
        setHasPendingRequest(true);
      }
    } else if (safeProfile?.profileChangePending === false) {
      setHasPendingRequest(false);
    }

    if (submissionAt) {
      applyCooldown(new Date(submissionAt.getTime() + PROFILE_CHANGE_COOLDOWN_MS));
    }
  }, [safeProfile?.profileChangePending, safeProfile?.profileChangeLastSubmissionAt, safeProfile?.profileChangeLastApprovedAt]);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownRemainingMs(0);
      return;
    }

    const updateRemaining = () => {
      const diff = cooldownUntil.getTime() - Date.now();
      setCooldownRemainingMs(diff > 0 ? diff : 0);
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldownUntil]);

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const requiredFields: (keyof FormState)[] = ["name", "email", "department", "university", "rollNumber", "contactNumber"];
    const errors: Record<string, string> = {};

    requiredFields.forEach((field) => {
      if (!formState[field].trim()) {
        errors[field] = "This field is required";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitRequest = async () => {
    if (!user || !safeProfile) {
      toast({ title: "Unavailable", description: "A valid profile is required before submitting changes.", variant: "destructive" });
      return;
    }

    if (cooldownActive) {
      toast({
        title: "Cooldown active",
        description: `You can submit another request in ${cooldownLabel || "a short while"}.`,
        variant: "destructive",
      });
      return;
    }

    if (hasPendingRequest) {
      toast({
        title: "Request in review",
        description: "You already have a pending request. Please wait for admin feedback.",
      });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    toast({
      title: "Submitting…",
      description: "Please wait while we process your request.",
    });

    const sanitizedSkills = formState.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    let uploadedPhotoUrl: string | null = null;
    if (profilePictureFile) {
      try {
        console.log("handleSubmitRequest:before uploadBytes", profilePictureFile.name);
        const storageRef = ref(storage, `students/${user.uid}/profile-change/${Date.now()}-${profilePictureFile.name}`);
        const snapshot = await uploadBytes(storageRef, profilePictureFile);
        console.log("handleSubmitRequest:after uploadBytes");
        console.log("handleSubmitRequest:before getDownloadURL");
        uploadedPhotoUrl = await getDownloadURL(snapshot.ref);
        console.log("handleSubmitRequest:after getDownloadURL", uploadedPhotoUrl);
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : "Unable to upload profile photo.";
        toast({ title: "Submission failed", description: message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }

    const requestedData: Record<string, unknown> = {
      name: formState.name.trim(),
      email: formState.email.trim(),
      department: formState.department.trim(),
      university: formState.university.trim(),
      rollNumber: formState.rollNumber.trim(),
      contactNumber: formState.contactNumber.trim(),
      address: formState.address.trim(),
      gpa: formState.gpa.trim().length > 0 ? Number(formState.gpa) : null,
      dob: formState.dob.trim(),
      gender: formState.gender.trim(),
      emergencyContact: formState.emergencyContact.trim(),
      skills: sanitizedSkills,
    };

    if (uploadedPhotoUrl) {
      requestedData.profilePictureUrl = uploadedPhotoUrl;
    }

    try {
      console.log("handleSubmitRequest:before submitProfileChangeRequest");
      const submissionResult = await submitProfileChangeRequest({ uid: user.uid, requestedData });
      console.log("handleSubmitRequest:after submitProfileChangeRequest", submissionResult);
      if (!submissionResult) {
        throw new Error("Profile change request was not saved.");
      }

      console.log("handleSubmitRequest:before addStudentNotification");
      try {
        await addStudentNotification({
          uid: user.uid,
          title: "Profile request pending",
          message: "Your profile change request is awaiting admin review.",
          type: "profile-change-status",
          metadata: { status: "pending" },
        });
      } catch (notificationError) {
        console.error("Failed to add pending notification", notificationError);
      }
      console.log("handleSubmitRequest:after addStudentNotification");

      console.log("handleSubmitRequest:before addAdminNotification");
      await addAdminNotification({
        type: "profileChangeRequest",
        uid: user.uid,
        studentName: formState.name.trim() || safeProfile.name || "Unknown student",
        message: `${formState.name.trim() || safeProfile.name || "A student"} requested profile changes`,
        metadata: { requestedFields: Object.keys(requestedData) },
      });
      console.log("handleSubmitRequest:after addAdminNotification");

      toast({
        title: "Your request has been submitted successfully",
        description: "We will notify you once an admin reviews your request.",
      });

      setHasPendingRequest(true);
      applyCooldown(new Date(Date.now() + PROFILE_CHANGE_COOLDOWN_MS));
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = window.setTimeout(() => {
        handleDialogOpenChange(false);
        closeTimerRef.current = null;
      }, 1200);

      try {
        await markProfileChangePending(user.uid);
      } catch (pendingError) {
        console.error("Failed to mark profile change pending", pendingError);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit change request.";
      const isPermissionDenied =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string" &&
        (error as { code: string }).code === "permission-denied";

      if (isPermissionDenied) {
        toast({ title: "Permission denied", description: "You do not have access to submit this request.", variant: "destructive" });
      } else {
        toast({ title: "Submission failed", description: message, variant: "destructive" });
      }

      console.error(error);
      console.error("Profile change request submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      toast({ title: "Action failed", description: "Could not mark notification as read.", variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
      toast({ title: "Action failed", description: "Could not mark all notifications as read.", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Shield className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-lg font-semibold text-foreground">Authentication required</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">Please log in again to view your profile details.</p>
      </div>
    );
  }

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-semibold text-foreground">We couldn&apos;t load your profile.</p>
        <p className="max-w-md text-sm text-muted-foreground">{profileError}</p>
        <Button
          variant="outline"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!safeProfile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div>
          <p className="text-lg font-semibold text-foreground">Profile not found</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            We could not find your profile details. Please complete your student profile to keep your information up to date.
          </p>
        </div>
        <Button onClick={() => navigate("/student/complete-profile")} className="rounded-xl px-6">
          Complete profile
        </Button>
      </div>
    );
  }

  const hasCompleted = safeProfile.profileCompleted === true;
  const displayEmail = safeProfile.email ?? user.email ?? "Not provided";
  const displayDepartment = safeProfile.department ?? "Department not set";
  const displayContact = safeProfile.contactNumber ?? "Not provided";
  const displayAddress = safeProfile.address ?? "Not provided";
  const displayEmergency = safeProfile.emergencyContact ?? "Not provided";
  const displayUniversity = safeProfile.university ?? "Not provided";
  const displayRoll = safeProfile.rollNumber ?? "Not provided";
  const displayGender = safeProfile.gender ?? "Not provided";
  const displayDob = formatDob(safeProfile.dob ?? undefined);
  const displayGpa = typeof safeProfile.gpa === "number" ? safeProfile.gpa.toFixed(2) : "Not provided";

  const hasNotifications = notificationsList.length > 0;
  const unreadBadge = unreadCount && unreadCount > 0 ? unreadCount : null;
  const canMarkAllAsRead = notificationsList.some((notification) => Boolean((notification as { id?: unknown } | null)?.id) && (notification as { read?: unknown } | null)?.read !== true);

  return (
    <div className="space-y-10 pb-16">
      <Card className="overflow-hidden border-border/60 bg-white/95 shadow-lg backdrop-blur-md dark:bg-slate-950/80">
        <div className="bg-gradient-to-r from-primary/90 via-primary to-primary/80 px-6 py-10 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-24 w-24 border-4 border-white/40">
                {safeProfile.profilePictureUrl ? <AvatarImage src={safeProfile.profilePictureUrl} alt={safeProfile.name ?? "Student avatar"} /> : null}
                <AvatarFallback className="bg-primary/30 text-lg font-semibold text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full border border-white/30 bg-white/15 text-white backdrop-blur">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Student profile
                  </Badge>
                  {hasCompleted ? (
                    <Badge variant="outline" className="rounded-full border-white/40 bg-white/10 text-white">
                      Profile complete
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full border-white/40 bg-white/10 text-white">
                      Complete your profile
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-white">{safeProfile.name ?? "Unnamed student"}</h1>
                  <p className="text-white/80">{displayDepartment}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {displayEmail}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {displayContact}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {displayAddress}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/25 bg-white/15 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Profile health</p>
              <p className="text-lg font-semibold text-white">{hasCompleted ? "Ready for admissions" : "Needs review"}</p>
              <p className="text-xs text-white/70">
                {hasCompleted
                  ? "All information is verified. You can request updates at any time."
                  : "Fill in missing information and submit a change request for review."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/25 bg-white/15 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Change requests</p>
              <p className="text-lg font-semibold text-white">{hasPendingRequest ? "Pending review" : "No open requests"}</p>
              <p className="text-xs text-white/70">
                {cooldownActive
                  ? `Next submission available in ${cooldownLabel}.`
                  : hasPendingRequest
                    ? "We'll notify you when an admin reviews your submission."
                    : "Request profile edits whenever you need updates."}
              </p>
            </div>
          </div>
        </div>

    <CardContent className="space-y-8 bg-white/90 px-6 py-8 text-muted-foreground dark:bg-slate-950/85">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem icon={<GraduationCap className="h-4 w-4 text-primary" />} label="University" value={displayUniversity} />
        <InfoItem icon={<CalendarDays className="h-4 w-4 text-primary" />} label="Date of birth" value={displayDob} />
        <InfoItem icon={<Shield className="h-4 w-4 text-primary" />} label="Gender" value={displayGender} />
        <InfoItem icon={<Shield className="h-4 w-4 text-primary" />} label="Roll number" value={displayRoll} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem icon={<MapPin className="h-4 w-4 text-primary" />} label="Address" value={displayAddress} />
        <InfoItem icon={<Phone className="h-4 w-4 text-primary" />} label="Emergency contact" value={displayEmergency} />
        <InfoItem icon={<GraduationCap className="h-4 w-4 text-primary" />} label="GPA" value={displayGpa} />
        <InfoItem icon={<Shield className="h-4 w-4 text-primary" />} label="Profile status" value={hasCompleted ? "Completed" : "Incomplete"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="rounded-2xl border border-border/70 bg-white/80 p-5 shadow-sm dark:bg-slate-950/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Skills & strengths</p>
              <p className="text-sm text-muted-foreground">
                Highlighted skills help mentors and universities understand where you shine.
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
              {skillsList.length} skill{skillsList.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <div className="mt-4">
            {skillsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <Badge key={skill} variant="outline" className="rounded-full border-primary/40 text-primary">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet. Share your strengths so we can help you grow.</p>
            )}
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Profile health</p>
            <p className="text-sm font-semibold text-foreground">{hasCompleted ? "Ready for admissions" : "Needs review"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasCompleted
                ? "All information is verified. Keep it up to date for faster admissions."
                : "Fill in missing information and submit a change request for review."}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Change requests</p>
            <p className="text-sm font-semibold text-foreground">{hasPendingRequest ? "Pending review" : "No open requests"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {cooldownActive
                ? `Next submission available in ${cooldownLabel}.`
                : hasPendingRequest
                  ? "We're reviewing your latest submission."
                  : "Request updates whenever your details change."}
            </p>
          </div>
        </div>
      </div>
    </CardContent>

      </Card>

    <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
      <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle className="text-lg">Profile change requests</CardTitle>
          <CardDescription>Submit updates to keep your academic information accurate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground dark:bg-slate-950/60">
            <p className="font-medium text-foreground">Need to update something?</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Change contact details so mentors can reach you easily.</li>
              <li>Update academic information before submitting applications.</li>
              <li>Upload a fresh profile photo that represents you best.</li>
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">Submission status</p>
              <p className="text-sm text-foreground">
                {hasPendingRequest
                  ? "An admin is currently reviewing your latest request."
                  : "No pending requests. Submit one whenever you need updates."}
              </p>
              {cooldownActive ? <p className="text-xs">Next submission in {cooldownLabel}.</p> : null}
            </div>
            <Dialog open={isEditOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2 rounded-full">
                  {hasPendingRequest ? "View pending request" : "Request changes"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
                <DialogHeader>
                  <DialogTitle>Profile change request</DialogTitle>
                  <DialogDescription>Provide the details you would like to update. Our admin team will review your request.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Full name" error={formErrors.name}>
                      <Input value={formState.name} onChange={(event) => handleFieldChange("name", event.target.value)} placeholder="Jane Doe" />
                    </Field>
                    <Field label="Email" error={formErrors.email}>
                      <Input value={formState.email} onChange={(event) => handleFieldChange("email", event.target.value)} placeholder="you@example.com" type="email" />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Department" error={formErrors.department}>
                      <Select value={formState.department} onValueChange={(value) => handleFieldChange("department", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department} value={department}>
                              {department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="University" error={formErrors.university}>
                      <Popover open={isUniversityOpen} onOpenChange={setIsUniversityOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={isUniversityOpen} className="mt-1 w-full justify-between">
                            {formState.university || "Select university"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0" align="start">
                          <div className="border-b border-border/60 p-2">
                            <div className="grid grid-cols-3 gap-2">
                              {(
                                [
                                  { key: "all", label: "All" },
                                  { key: "public", label: "Public" },
                                  { key: "private", label: "Private" },
                                ] as const
                              ).map(({ key, label }) => (
                                <Button
                                  key={key}
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setUniversityFilter(key)}
                                  className={cn(
                                    "h-8 w-full border-border bg-background/60 text-xs font-medium",
                                    universityFilter === key && "border-primary bg-primary/10 text-primary",
                                  )}
                                >
                                  {label}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <Command>
                            <CommandInput placeholder="Search universities..." />
                            <CommandEmpty>No university found.</CommandEmpty>
                            <CommandList className="max-h-72">
                              {universityFilter === "all" || universityFilter === "public" ? (
                                <CommandGroup heading="Public Universities">
                                  {publicUniversities.map((university) => {
                                    const isSelected = formState.university === university;
                                    return (
                                      <CommandItem
                                        key={`public-${university}`}
                                        value={university}
                                        onSelect={() => {
                                          handleFieldChange("university", university);
                                          setIsUniversityOpen(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                        {university}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              ) : null}
                              {universityFilter === "all" || universityFilter === "private" ? (
                                <CommandGroup heading="Private Universities">
                                  {privateUniversities.map((university) => {
                                    const isSelected = formState.university === university;
                                    return (
                                      <CommandItem
                                        key={`private-${university}`}
                                        value={university}
                                        onSelect={() => {
                                          handleFieldChange("university", university);
                                          setIsUniversityOpen(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                        {university}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              ) : null}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Roll number" error={formErrors.rollNumber}>
                      <Input value={formState.rollNumber} onChange={(event) => handleFieldChange("rollNumber", event.target.value)} placeholder="2023-001" />
                    </Field>
                    <Field label="Contact number" error={formErrors.contactNumber}>
                      <Input value={formState.contactNumber} onChange={(event) => handleFieldChange("contactNumber", event.target.value)} placeholder="+8801X-XXXXXXX" />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Date of birth">
                      <Input value={formState.dob} onChange={(event) => handleFieldChange("dob", event.target.value)} placeholder="YYYY-MM-DD" />
                    </Field>
                    <Field label="Gender">
                      <Select value={formState.gender} onValueChange={(value) => handleFieldChange("gender", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {genders.map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Address">
                    <Textarea value={formState.address} onChange={(event) => handleFieldChange("address", event.target.value)} placeholder="Street, city, country" rows={3} />
                  </Field>
                  <Field label="Emergency contact">
                    <Input value={formState.emergencyContact} onChange={(event) => handleFieldChange("emergencyContact", event.target.value)} placeholder="Name and phone number" />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="GPA">
                      <Input value={formState.gpa} onChange={(event) => handleFieldChange("gpa", event.target.value)} placeholder="3.75" />
                    </Field>
                    <Field label="Profile photo (optional)">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-16 w-16">
                            {profilePicturePreview ? (
                              <AvatarImage src={profilePicturePreview} alt="Selected profile preview" />
                            ) : safeProfile.profilePictureUrl ? (
                              <AvatarImage src={safeProfile.profilePictureUrl} alt={safeProfile.name ?? "Current profile"} />
                            ) : (
                              <AvatarFallback>{initials}</AvatarFallback>
                            )}
                          </Avatar>
                          <p className="text-xs text-muted-foreground">
                            Upload a new profile photo to include in your change request. Supported formats: JPG, PNG, WEBP.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Input type="file" accept="image/*" onChange={handlePhotoChange} disabled={isSubmitting} />
                          {profilePictureFile ? (
                            <Button type="button" variant="ghost" size="sm" onClick={resetPhotoSelection} disabled={isSubmitting}>
                              Remove
                            </Button>
                          ) : null}
                        </div>
                        {profilePictureFile ? <p className="text-xs text-muted-foreground">Selected file: {profilePictureFile.name}</p> : null}
                      </div>
                    </Field>
                  </div>
                  <Field label="Skills (comma separated)">
                    <Textarea value={formState.skills} onChange={(event) => handleFieldChange("skills", event.target.value)} placeholder="Leadership, Data analysis, Public speaking" rows={3} />
                  </Field>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => handleDialogOpenChange(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitRequest}
                    disabled={isSubmitting || hasPendingRequest || cooldownActive}
                    className={cn((hasPendingRequest || cooldownActive) && !isSubmitting ? "opacity-80" : undefined)}
                  >
                    {submitButtonLabel}
                  </Button>
                </DialogFooter>
                {submitDisabledReason ? (
                  <p className="px-6 pb-4 text-xs font-medium text-muted-foreground">{submitDisabledReason}</p>
                ) : null}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
            <CardDescription>Stay updated on every profile review and admin response.</CardDescription>
          </div>
          {unreadBadge ? <Badge>{unreadBadge}</Badge> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {isNotificationsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading notifications...</span>
            </div>
          ) : null}
          {notificationsError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {notificationsError}
            </div>
          ) : null}
          {!hasNotifications && !isNotificationsLoading && !notificationsError ? (
            <p className="text-sm text-muted-foreground">No notifications yet. We will let you know as soon as anything changes.</p>
          ) : null}
          <div className="space-y-3">
            {notificationsList.map((rawNotification, index) => {
              if (!rawNotification || typeof rawNotification !== "object") {
                return null;
              }

              const notification = rawNotification as {
                id?: string;
                title?: string;
                message?: string;
                read?: boolean;
                timestamp?: unknown;
              };

              const key = typeof notification.id === "string" ? notification.id : `generated-${index}`;
              const isRead = notification.read === true;
              const title = notification.title ?? "Notification";
              const message = notification.message ?? "";
              const timestamp = formatDate(notification.timestamp ?? null);
              const canMarkSingle = !isRead && typeof notification.id === "string";

              const handleSingleMark = () => {
                if (typeof notification.id !== "string") return;
                void handleMarkAsRead(notification.id);
              };

              const notificationClasses = cn("rounded-2xl border p-4 transition", isRead ? "bg-muted" : "bg-background shadow-sm");

              return (
                <div key={key} className={notificationClasses}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{timestamp}</p>
                    </div>
                    {canMarkSingle ? (
                      <Button size="sm" variant="outline" onClick={handleSingleMark}>
                        Mark as read
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        {hasNotifications ? (
          <CardFooter className="border-t border-border/60 bg-muted/20 px-6 py-3">
            <Button variant="ghost" className="w-full" onClick={handleMarkAllAsRead} disabled={!canMarkAllAsRead}>
              Mark all as read
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  </div>
);

}

type InfoItemProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
      <span className="mt-1 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

function Field({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
