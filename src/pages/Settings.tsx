import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { User, Bell, Lock, Palette, Database, Shield, Mail, CalendarCheck, GraduationCap, Megaphone, Briefcase, MonitorCog, Sparkles, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth-provider";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { submitProfileChangeRequest, addAdminNotification, addStudentNotification, markProfileChangePending, PROFILE_CHANGE_COOLDOWN_MS, getUserSettings, saveUserSettings, type UserSettingsDocument } from "@/lib/firebaseHelpers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword } from "firebase/auth";

type PersonalInfoForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
};

const defaultForm = (): PersonalInfoForm => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bio: "",
});

const defaultPasswordForm = () => ({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const SettingRow = ({
  icon: Icon,
  title,
  description,
  action,
  disabled,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: React.ReactNode;
  disabled?: boolean;
}) => (
  <div
    className={cn(
      "flex items-center justify-between gap-4 rounded-2xl border border-border/40 bg-muted/10 p-4",
      disabled && "opacity-70"
    )}
  >
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium text-sm leading-tight text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">{action}</div>
  </div>
);

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, isLoading: isProfileLoading, error: profileError } = useStudentProfile(user?.uid ?? null);

  const [formState, setFormState] = useState<PersonalInfoForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PersonalInfoForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof ReturnType<typeof defaultPasswordForm>, string>>>({});
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettingsDocument | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

  const cooldownRemainingMs = useMemo(() => {
    if (!cooldownUntil) return 0;
    const diff = cooldownUntil.getTime() - Date.now();
    return diff > 0 ? diff : 0;
  }, [cooldownUntil]);

  const cooldownLabel = useMemo(() => {
    const ms = cooldownRemainingMs;
    if (ms <= 0) return "";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remMinutes = minutes % 60;
      return `${hours}h ${remMinutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [cooldownRemainingMs]);

  const cooldownActive = cooldownRemainingMs > 0;

  useEffect(() => {
    if (!profile || !user) {
      setFormState((prev) => ({ ...prev, email: user?.email ?? prev.email }));
      return;
    }

    const nameParts = (profile.name ?? "").trim().split(" ");
    const [firstName = "", ...rest] = nameParts;
    const lastName = rest.join(" ");

    setFormState({
      firstName,
      lastName,
      email: profile.email ?? user.email ?? "",
      phone: profile.contactNumber ?? "",
      bio: profile.bio ?? "",
    });

    if (profile.profileChangePending) {
      setHasPendingRequest(true);
    }

    const submissionAt = profile.profileChangeLastSubmissionAt ?? profile.profileChangeLastApprovedAt ?? profile.profileChangeLastRejectedAt;
    if (submissionAt && typeof submissionAt === "object" && "toDate" in submissionAt && typeof submissionAt.toDate === "function") {
      const submissionDate = submissionAt.toDate();
      setCooldownUntil(new Date(submissionDate.getTime() + PROFILE_CHANGE_COOLDOWN_MS));
    }
  }, [profile, user]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = window.setInterval(() => {
      const diff = cooldownUntil.getTime() - Date.now();
      if (diff <= 0) {
        setCooldownUntil(null);
        window.clearInterval(interval);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!user?.uid) return;
    setIsSettingsLoading(true);
    void getUserSettings(user.uid)
      .then((data) => setUserSettings(data))
      .finally(() => setIsSettingsLoading(false));
  }, [user?.uid]);

  const updateAndSave = useCallback(
    async (updates: Partial<UserSettingsDocument>) => {
      if (!user?.uid) return;
      setIsSettingsSaving(true);
      setUserSettings((prev) => {
        const next: UserSettingsDocument = {
          ...(prev ?? {}),
          ...updates,
          notifications: updates.notifications ? { ...(prev?.notifications ?? {}), ...updates.notifications } : prev?.notifications,
          display: updates.display ? { ...(prev?.display ?? {}), ...updates.display } : prev?.display,
          ai: updates.ai ? { ...(prev?.ai ?? {}), ...updates.ai } : prev?.ai,
        };
        return next;
      });
      try {
        await saveUserSettings(user.uid, updates);
      } finally {
        setIsSettingsSaving(false);
      }
    },
    [user?.uid],
  );

  const handleChange = useCallback((field: keyof PersonalInfoForm, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [formErrors]);

  const validate = useCallback(() => {
    const errors: Partial<Record<keyof PersonalInfoForm, string>> = {};
    if (!formState.firstName.trim()) errors.firstName = "First name is required";
    if (!formState.lastName.trim()) errors.lastName = "Last name is required";
    if (!formState.email.trim()) errors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) errors.email = "Enter a valid email";
    if (!formState.phone.trim()) errors.phone = "Phone number is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState]);

  const handleSubmit = useCallback(async () => {
    if (!user || !profile) {
      toast({ title: "Unable to submit", description: "Please make sure you are signed in.", variant: "destructive" });
      return;
    }

    if (!validate()) return;
    if (cooldownActive) {
      toast({ title: "Please wait", description: `You can submit again in ${cooldownLabel || "a moment"}.`, variant: "destructive" });
      return;
    }
    if (hasPendingRequest) {
      toast({ title: "Request already pending", description: "Please wait for the current request to be reviewed." });
      return;
    }

    setIsSubmitting(true);

    const fullName = `${formState.firstName.trim()} ${formState.lastName.trim()}`.trim();
    const requestedData: Record<string, unknown> = {
      name: fullName,
      email: formState.email.trim(),
      contactNumber: formState.phone.trim(),
      bio: formState.bio.trim(),
    };

    toast({ title: "Submitting…", description: "We're sending your request for review." });

    try {
      await submitProfileChangeRequest({ uid: user.uid, requestedData });

      await addStudentNotification({
        uid: user.uid,
        title: "Profile update requested",
        message: "Your personal information change request is awaiting review.",
        type: "profile-change-status",
        metadata: { section: "personal-information" },
      });

      await addAdminNotification({
        type: "profileChangeRequest",
        uid: user.uid,
        studentName: fullName || profile.name || "Student",
        message: `${fullName || profile.name || "A student"} updated personal information`,
        metadata: { section: "personal-information" },
      });

      await markProfileChangePending(user.uid);

      toast({ title: "Request submitted", description: "We'll notify you after admin review." });
      setHasPendingRequest(true);
      setCooldownUntil(new Date(Date.now() + PROFILE_CHANGE_COOLDOWN_MS));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit request.";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [addAdminNotification, addStudentNotification, cooldownActive, cooldownLabel, formState.bio, formState.email, formState.firstName, formState.lastName, formState.phone, hasPendingRequest, markProfileChangePending, profile, submitProfileChangeRequest, toast, user, validate]);

  const submitLabel = useMemo(() => {
    if (isSubmitting) return (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Submitting…</span>
      </>
    );
    if (hasPendingRequest) return "Request pending review";
    if (cooldownActive && cooldownLabel) return `Submit again in ${cooldownLabel}`;
    return "Save Changes";
  }, [cooldownActive, cooldownLabel, hasPendingRequest, isSubmitting]);

  /**
   * Handles secured password updates with re-authentication when required.
   */
  const handleChangePassword = useCallback(async () => {
    if (!user || !user.email) {
      toast({ title: "Unable to update password", description: "Please sign in again to continue.", variant: "destructive" });
      return;
    }

    const trimmedCurrent = passwordForm.currentPassword.trim();
    const trimmedNew = passwordForm.newPassword.trim();
    const trimmedConfirm = passwordForm.confirmPassword.trim();

    const errors: Partial<Record<keyof ReturnType<typeof defaultPasswordForm>, string>> = {};
    if (!trimmedCurrent) errors.currentPassword = "Current password is required";
    if (!trimmedNew) {
      errors.newPassword = "New password is required";
    } else if (trimmedNew.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    } else if (trimmedNew === trimmedCurrent) {
      errors.newPassword = "New password must be different from the current password";
    }
    if (!trimmedConfirm) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (trimmedNew !== trimmedConfirm) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Unable to update password", description: "No authenticated user found.", variant: "destructive" });
      return;
    }

    setIsPasswordUpdating(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, trimmedCurrent);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, trimmedNew);

      toast({ title: "✅ Password updated successfully!" });
      setPasswordForm(defaultPasswordForm());
      setPasswordErrors({});
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
      const message = error instanceof Error ? error.message : "Failed to update password.";

      if (code === "auth/requires-recent-login") {
        toast({
          title: "Re-authentication required",
          description: "For security reasons, please log in again and retry the password change.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Password update failed", description: message, variant: "destructive" });
      }

      console.error("Password update error", error);
    } finally {
      setIsPasswordUpdating(false);
    }
  }, [passwordForm, toast, user]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] animate-fade-in">
      <div className="space-y-6">
        <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_70%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.1),transparent_60%)]" aria-hidden="true" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex w-fit items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                <User className="h-3.5 w-3.5" /> Account Settings
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white lg:text-3xl">Settings</h2>
              <p className="max-w-xl text-white/90">Manage your account details, preferences, and security in one place.</p>
            </div>
            <div className="mx-auto w-full max-w-[180px] md:mx-0 md:w-auto">
              <div className="relative h-full w-full">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 backdrop-blur-sm" />
                <DotLottieReact 
                  src="https://lottie.host/b9f251c8-9f9e-46f3-9d33-1256953d8f52/vEvLUQtvpL.lottie" 
                  loop 
                  autoplay 
                  className="relative z-10 h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </h3>
            {isProfileLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading your profile details…</span>
              </div>
            ) : null}
            {profileError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {profileError}
              </div>
            ) : null}
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formState.firstName}
                    onChange={(event) => handleChange("firstName", event.target.value)}
                    disabled={isProfileLoading || isSubmitting}
                    aria-invalid={Boolean(formErrors.firstName)}
                    className={cn("bg-input border-border/50", formErrors.firstName && "border-destructive focus-visible:ring-destructive")}
                  />
                  {formErrors.firstName ? <p className="text-xs text-destructive">{formErrors.firstName}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formState.lastName}
                    onChange={(event) => handleChange("lastName", event.target.value)}
                    disabled={isProfileLoading || isSubmitting}
                    aria-invalid={Boolean(formErrors.lastName)}
                    className={cn("bg-input border-border/50", formErrors.lastName && "border-destructive focus-visible:ring-destructive")}
                  />
                  {formErrors.lastName ? <p className="text-xs text-destructive">{formErrors.lastName}</p> : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formState.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  disabled={isProfileLoading || isSubmitting}
                  aria-invalid={Boolean(formErrors.email)}
                  className={cn("bg-input border-border/50", formErrors.email && "border-destructive focus-visible:ring-destructive")}
                />
                {formErrors.email ? <p className="text-xs text-destructive">{formErrors.email}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formState.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                  disabled={isProfileLoading || isSubmitting}
                  aria-invalid={Boolean(formErrors.phone)}
                  className={cn("bg-input border-border/50", formErrors.phone && "border-destructive focus-visible:ring-destructive")}
                />
                {formErrors.phone ? <p className="text-xs text-destructive">{formErrors.phone}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={formState.bio}
                  onChange={(event) => handleChange("bio", event.target.value)}
                  disabled={isProfileLoading || isSubmitting}
                  className="bg-input border border-border/50"
                  placeholder="Tell us a little about yourself"
                />
              </div>
              <Button
                type="submit"
                className="bg-gradient-primary hover:opacity-90"
                disabled={isSubmitting || cooldownActive || hasPendingRequest || isProfileLoading}
              >
                {submitLabel}
              </Button>
              {hasPendingRequest || cooldownActive ? (
                <p className="text-xs text-muted-foreground">
                  {hasPendingRequest
                    ? "You already have a pending profile update request."
                    : cooldownActive && cooldownLabel
                      ? `You can submit another request in ${cooldownLabel}.`
                      : null}
                </p>
              ) : null}
            </form>
          </Card>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Database className="h-5 w-5 text-secondary" />
              Academic Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input value="STU2024-001" disabled className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value="Computer Science" className="bg-input border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input value="3rd Year" className="bg-input border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Current GPA</Label>
                <div className="flex items-center gap-2">
                  <Input value="3.85" disabled className="bg-muted/30" />
                  <Badge className="bg-accent">A</Badge>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Notification Preferences</h3>
              </div>
              {isSettingsSaving ? (
                <Badge variant="outline" className="rounded-full border-dashed">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full">
                  Synced
                </Badge>
              )}
            </div>
            {isSettingsLoading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <SettingRow
                  icon={Mail}
                  title="Email Notifications"
                  description="Receive important updates directly to your inbox."
                  disabled={isSettingsLoading}
                  action={
                    <Switch
                      checked={Boolean(userSettings?.notifications?.email)}
                      onCheckedChange={(v) => updateAndSave({ notifications: { email: v } })}
                    />
                  }
                />
                <SettingRow
                  icon={CalendarCheck}
                  title="Assignment Reminders"
                  description="Never miss a deadline with timely reminders."
                  disabled={isSettingsLoading}
                  action={
                    <Switch
                      checked={Boolean(userSettings?.notifications?.assignments)}
                      onCheckedChange={(v) => updateAndSave({ notifications: { assignments: v } })}
                    />
                  }
                />
                <SettingRow
                  icon={GraduationCap}
                  title="Grade Alerts"
                  description="Be informed when instructors publish new grades."
                  disabled={isSettingsLoading}
                  action={
                    <Switch
                      checked={Boolean(userSettings?.notifications?.grades)}
                      onCheckedChange={(v) => updateAndSave({ notifications: { grades: v } })}
                    />
                  }
                />
                <SettingRow
                  icon={Megaphone}
                  title="Course Announcements"
                  description="Get notified about important course changes."
                  disabled={isSettingsLoading}
                  action={
                    <Switch
                      checked={Boolean(userSettings?.notifications?.courseAnnouncements)}
                      onCheckedChange={(v) => updateAndSave({ notifications: { courseAnnouncements: v } })}
                    />
                  }
                />
                <SettingRow
                  icon={Briefcase}
                  title="Career Opportunities"
                  description="Discover internships and job openings curated for you."
                  disabled={isSettingsLoading}
                  action={
                    <Switch
                      checked={Boolean(userSettings?.notifications?.career)}
                      onCheckedChange={(v) => updateAndSave({ notifications: { career: v } })}
                    />
                  }
                />
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Password & Authentication
            </h3>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleChangePassword();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  disabled={isPasswordUpdating}
                  aria-invalid={Boolean(passwordErrors.currentPassword)}
                  className={cn("bg-input border-border/50", passwordErrors.currentPassword && "border-destructive focus-visible:ring-destructive")}
                />
                {passwordErrors.currentPassword ? <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  disabled={isPasswordUpdating}
                  aria-invalid={Boolean(passwordErrors.newPassword)}
                  className={cn("bg-input border-border/50", passwordErrors.newPassword && "border-destructive focus-visible:ring-destructive")}
                />
                {passwordErrors.newPassword ? <p className="text-xs text-destructive">{passwordErrors.newPassword}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  disabled={isPasswordUpdating}
                  aria-invalid={Boolean(passwordErrors.confirmPassword)}
                  className={cn("bg-input border-border/50", passwordErrors.confirmPassword && "border-destructive focus-visible:ring-destructive")}
                />
                {passwordErrors.confirmPassword ? <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p> : null}
              </div>
              <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={isPasswordUpdating}>
                {isPasswordUpdating ? (
                  <span className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating…
                  </span>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </Card>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Two-Factor Authentication
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="glass p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Display & Accessibility</h3>
            </div>
            {isSettingsLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <SettingRow
                  icon={MonitorCog}
                  title="Compact Mode"
                  description="Reduce spacing to see more content on screen."
                  disabled={isSettingsLoading}
                  action={
                    <Switch checked={Boolean(userSettings?.display?.compact)} onCheckedChange={(v) => updateAndSave({ display: { compact: v } })} />
                  }
                />
                <SettingRow
                  icon={Sparkles}
                  title="Show Animations"
                  description="Enable smooth transitions and motion effects."
                  disabled={isSettingsLoading}
                  action={
                    <Switch checked={Boolean(userSettings?.display?.animations)} onCheckedChange={(v) => updateAndSave({ display: { animations: v } })} />
                  }
                />
                <SettingRow
                  icon={Activity}
                  title="High Contrast"
                  description="Boost accessibility with stronger color contrast."
                  disabled={isSettingsLoading}
                  action={
                    <Switch checked={Boolean(userSettings?.display?.highContrast)} onCheckedChange={(v) => updateAndSave({ display: { highContrast: v } })} />
                  }
                />
              </div>
            )}
          </Card>

          <Card className="glass p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">AI Assistant Preferences</h3>
            </div>
            {isSettingsLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <SettingRow
                  icon={Sparkles}
                  title="Proactive Suggestions"
                  description="Let the assistant surface tips and shortcuts automatically."
                  disabled={isSettingsLoading}
                  action={
                    <Switch checked={Boolean(userSettings?.ai?.proactiveSuggestions)} onCheckedChange={(v) => updateAndSave({ ai: { proactiveSuggestions: v } })} />
                  }
                />
                <SettingRow
                  icon={MonitorCog}
                  title="Learning Style Adaptation"
                  description="Have guidance tailored to your preferred learning style."
                  disabled={isSettingsLoading}
                  action={
                    <Switch checked={Boolean(userSettings?.ai?.learningStyleAdaptation)} onCheckedChange={(v) => updateAndSave({ ai: { learningStyleAdaptation: v } })} />
                  }
                />
                <SettingRow
                  icon={Activity}
                  title="Performance Tracking"
                  description="Allow AI to analyze your study progress for smarter insights."
                  disabled={isSettingsLoading}
                  action={
                    <Switch checked={Boolean(userSettings?.ai?.performanceTracking)} onCheckedChange={(v) => updateAndSave({ ai: { performanceTracking: v } })} />
                  }
                />
              </div>
            )}
          </Card>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 text-center">AI Personalization Preview</h3>
            <div className="flex flex-col items-center gap-6">
              <DotLottieReact
                src="https://lottie.host/b9f251c8-9f9e-46f3-9d33-1256953d8f52/vEvLUQtvpL.lottie"
                loop
                autoplay
                style={{ width: "320px", height: "320px" }}
              />
              <p className="max-w-xl text-center text-sm text-muted-foreground">
                This animation illustrates how EduCareer AI adapts to your preferences in real time to tailor guidance and learning experiences.
              </p>
            </div>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-6">
        <Card className="glass p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.photoUrl ?? undefined} alt={profile?.name ?? user?.displayName ?? "User"} />
              <AvatarFallback>{(profile?.name ?? user?.displayName ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{profile?.name ?? user?.displayName ?? "Your profile"}</h3>
                <Badge variant="secondary" className="rounded-full">
                  {profile?.department ?? "Student"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.bio?.slice(0, 120) || "Keep your profile up to date to unlock personalized recommendations."}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between rounded-2xl bg-muted/10 px-3 py-2">
              <span>Email</span>
              <span className="font-medium text-foreground">{profile?.email ?? user?.email ?? "N/A"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-muted/10 px-3 py-2">
              <span>Phone</span>
              <span className="font-medium text-foreground">{profile?.contactNumber || "Not provided"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-muted/10 px-3 py-2">
              <span>Last updated</span>
              <span className="font-medium text-foreground">{profile?.updatedAt ? "Recently" : "Pending"}</span>
            </div>
          </div>
        </Card>

        <Card className="glass p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Recent Account Activity</h3>
          <ul className="space-y-3 text-xs text-muted-foreground">
            <li className="flex items-start gap-3 rounded-2xl bg-muted/10 p-3">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
              <div>
                <p className="font-medium text-foreground">Profile information synced</p>
                <p>We keep your profile in sync with admin approvals.</p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-2xl bg-muted/10 p-3">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
              <div>
                <p className="font-medium text-foreground">Security status</p>
                <p>Password last updated when you ran the update password action.</p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-2xl bg-muted/10 p-3">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
              <div>
                <p className="font-medium text-foreground">Notification preferences</p>
                <p>Preferences are saved instantly to all devices.</p>
              </div>
            </li>
          </ul>
        </Card>

        <Card className="glass p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Need support?</h3>
          <p className="text-sm text-muted-foreground">
            Having trouble with your account or settings? Reach out and the EduCareer AI support team will assist you.
          </p>
          <div className="grid gap-3 text-sm">
            <Button variant="default" className="rounded-2xl">
              Contact Support
            </Button>
            <Button variant="secondary" className="rounded-2xl">
              View Help Center
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Response time is typically under 24 hours.
          </p>
        </Card>
      </div>
    </div>
  );
}
