import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { AlertCircle, Check, CheckCircle2, ChevronsUpDown, Loader2, Shield, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAuth } from "@/components/auth-provider";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useToast } from "@/components/ui/use-toast";
import { db, storage } from "@/lib/firebaseClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { addAdminNotification } from "@/lib/firebaseHelpers";

const initialFormState = {
  name: "",
  dob: "",
  gender: "",
  department: "",
  university: "",
  rollNumber: "",
  contactNumber: "",
  address: "",
  email: "",
  gpa: "",
  skills: "",
  emergencyContact: "",
};

type FormState = typeof initialFormState;
type FormErrors = Partial<Record<keyof FormState, string>>;

const genders = ["Male", "Female", "Non-binary", "Prefer not to say"] as const;
const departments = [
  "Computer Science",
  "Business Analytics",
  "AI & Robotics",
  "Design & UI",
  "Data Science",
  "Finance",
  "Marketing",
] as const;

const publicUniversities = [
  "University of Dhaka",
  "University of Rajshahi",
  "University of Chittagong",
  "Jahangirnagar University",
  "Khulna University",
  "Islamic University, Kushtia",
  "Shahjalal University of Science and Technology (SUST)",
  "Bangladesh Agricultural University",
  "Bangabandhu Sheikh Mujibur Rahman Agricultural University",
  "Sher-e-Bangla Agricultural University",
  "Patuakhali Science and Technology University",
  "Bangladesh University of Engineering and Technology (BUET)",
  "Chittagong University of Engineering and Technology (CUET)",
  "Khulna University of Engineering and Technology (KUET)",
  "Rajshahi University of Engineering and Technology (RUET)",
  "Bangladesh University of Textiles (BUTEX)",
  "Dhaka University of Engineering and Technology (DUET)",
  "Jagannath University",
  "Comilla University",
  "Begum Rokeya University",
  "Jatiya Kabi Kazi Nazrul Islam University",
  "Barisal University",
  "Pabna University of Science and Technology",
  "Noakhali Science and Technology University",
  "Mawlana Bhashani Science and Technology University",
  "Jessore University of Science and Technology",
  "Hajee Mohammad Danesh Science and Technology University",
  "Bangabandhu Sheikh Mujibur Rahman Science & Technology University",
  "Rangamati Science and Technology University",
  "Rabindra University, Bangladesh",
  "Sheikh Hasina University",
  "Islamic Arabic University",
  "Bangladesh Open University",
  "National University",
  "Bangladesh University of Professionals (BUP)",
  "Bangladesh University of Health Sciences",
  "Sylhet Agricultural University",
  "Chittagong Veterinary and Animal Sciences University",
  "Bangabandhu Sheikh Mujibur Rahman Maritime University",
  "Bangamata Sheikh Fojilatunnesa Mujib Science & Technology University",
  "Sheikh Hasina University of Science and Technology",
  "Bangabandhu Sheikh Mujibur Rahman Digital University",
  "Khulna Agricultural University",
  "Gopalganj University of Science and Technology",
  "Chandpur Science and Technology University",
  "Habiganj Agricultural University",
  "Sylhet Medical University",
  "Bangabandhu Sheikh Mujibur Rahman Aviation and Aerospace University",
  "Rajshahi Medical University",
  "Chittagong Medical University",
  "Rangpur Medical University",
  "Sheikh Hasina Medical University, Khulna",
  "Sheikh Hasina Medical University, Sylhet",
  "Sheikh Sayera Khatun Medical University",
  "Sheikh Hasina University of Veterinary and Animal Sciences",
] as const;

const privateUniversities = [
  "North South University (NSU)",
  "Independent University, Bangladesh (IUB)",
  "BRAC University",
  "American International University-Bangladesh (AIUB)",
  "East West University (EWU)",
  "Ahsanullah University of Science and Technology (AUST)",
  "Daffodil International University (DIU)",
  "United International University (UIU)",
  "University of Asia Pacific (UAP)",
  "Stamford University Bangladesh",
  "Southeast University",
  "Primeasia University",
  "Eastern University",
  "University of Liberal Arts Bangladesh (ULAB)",
  "Green University of Bangladesh",
  "Bangladesh University",
  "City University",
  "Northern University Bangladesh",
  "State University of Bangladesh",
  "Bangladesh University of Business and Technology (BUBT)",
  "World University of Bangladesh",
  "International University of Business Agriculture and Technology (IUBAT)",
  "Dhaka International University",
  "Manarat International University",
  "Premier University",
  "International Islamic University Chittagong (IIUC)",
  "Southern University Bangladesh",
  "University of Development Alternative (UODA)",
  "Asian University of Bangladesh",
  "Bangladesh Islami University",
  "The People's University of Bangladesh",
  "Royal University of Dhaka",
  "University of South Asia",
  "Victoria University of Bangladesh",
  "The Millennium University",
  "Atish Dipankar University of Science & Technology",
  "ASA University Bangladesh",
  "East Delta University",
  "Leading University",
  "Britannia University",
  "Varendra University",
  "North East University Bangladesh",
  "Port City International University",
  "Sonargaon University",
  "Cox’s Bazar International University",
  "University of Global Village",
  "Prime University",
  "Central Women’s University",
  "Canadian University of Bangladesh",
  "University of Information Technology and Sciences (UITS)",
  "Bangladesh Army International University of Science and Technology (BAIUST)",
  "Bangladesh Army University of Engineering & Technology (BAUET)",
  "Bangladesh Army University of Science and Technology (BAUST)",
  "Bangladesh Army University of Professionals (Private sector division)",
  "Exim Bank Agricultural University",
  "German University Bangladesh",
  "Hamdard University Bangladesh",
  "North Bengal International University",
  "Ishakha International University",
  "Fareast International University",
  "Feni University",
  "Bangamata Sheikh Fojilatunnesa Mujib Science & Technology University (Private Branch)",
  "The International University of Scholars",
  "NPI University of Bangladesh",
  "CCN University of Science & Technology",
  "Rabindra Maitree University",
  "University of Creative Technology, Chittagong",
  "University of Skill Enrichment and Technology",
  "Ranada Prasad Shaha University",
  "Times University Bangladesh",
  "Z.H. Sikder University of Science and Technology",
  "European University of Bangladesh",
  "Northern University of Business & Technology, Khulna",
  "Bangladesh University of Business and Communication",
  "Khwaja Yunus Ali University",
  "Notre Dame University Bangladesh",
  "University of Science and Technology, Chittagong (USTC)",
  "Central University of Science and Technology",
  "Bangladesh University of Medical Science",
  "University of Information Technology, Barishal",
  "Dhaka International Medical College & University",
  "International Standard University (ISU)",
  "Bangladesh University of Communication and Journalism",
  "Microland University of Science and Technology",
  "Global University Bangladesh",
  "Sheikh Fazilatunnesa Mujib University",
  "Islamic University of Technology (IUT)",
  "Canadian University of Science and Technology",
  "North Western University",
  "Bangladesh Institute of Science and Technology University",
  "Gono Bishwabidyalay",
  "Bangladesh Institute of Health Sciences University",
  "University of Brahmanbaria",
  "Chittagong Independent University",
  "Khulna Khan Bahadur Ahsanullah University",
  "Rajshahi Science and Technology University",
  "First Capital University of Bangladesh",
  "Bangladesh Continental University",
  "ASA University of Health and Technology",
  "Greenstone University",
  "University of Modern Sciences",
  "Kazi Nazrul Islam University College (Private)",
  "South East Medical University",
  "R.P. Shaha University",
  "Bangladesh University of Life Sciences",
  "International Cultural University",
  "BGMEA University of Fashion and Technology (BUFT)",
  "Asian University for Women (AUW)",
  "UITS University",
  "University of Creative Technology",
] as const;
const toNullIfEmpty = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export default function CompleteProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading, error } = useStudentProfile(user?.uid ?? null);
  const { toast } = useToast();

  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isUniversityOpen, setIsUniversityOpen] = useState(false);
  const [universityFilter, setUniversityFilter] = useState<"all" | "public" | "private">("all");

  useEffect(() => {
    if (!profile) return;
    setFormState({
      name: profile.name ?? "",
      dob: profile.dob ?? "",
      gender: profile.gender ?? "",
      department: profile.department ?? "",
      university: profile.university ?? "",
      rollNumber: profile.rollNumber ?? "",
      contactNumber: profile.contactNumber ?? "",
      address: profile.address ?? "",
      email: profile.email ?? user?.email ?? "",
      gpa: profile.gpa !== undefined && profile.gpa !== null ? profile.gpa.toString() : "",
      skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
      emergencyContact: profile.emergencyContact ?? "",
    });
  }, [profile, user?.email]);

  useEffect(() => {
    if (!profile && user?.email) {
      setFormState((prev) => ({ ...prev, email: user.email ?? prev.email }));
    }
  }, [profile, user?.email]);

  useEffect(() => {
    if (error) {
      toast({ title: "Unable to load profile", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  const requiredFields = useMemo(
    () => ["name", "dob", "gender", "department", "university", "rollNumber", "contactNumber", "address"] as const,
    [],
  );

  const progressSegmentClasses = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-teal-400",
    "bg-sky-400",
    "bg-indigo-400",
    "bg-violet-400",
    "bg-fuchsia-400",
    "bg-pink-400",
  ];

  const completion = useMemo(() => {
    const filled = requiredFields.filter((field) => formState[field].trim().length > 0).length;
    const percentage = Math.round((filled / requiredFields.length) * 100);
    const segmentTotal = progressSegmentClasses.length;
    const segmentsFilled = Math.min(segmentTotal, Math.max(0, Math.round((percentage / 100) * segmentTotal)));

    return {
      filled,
      total: requiredFields.length,
      percentage,
      segmentTotal,
      segmentsFilled,
    };
  }, [formState, requiredFields, progressSegmentClasses.length]);

  const BackgroundParticles = ({ prefix }: { prefix: string }) => (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.div
          key={`${prefix}-${index}`}
          className="absolute h-2 w-2 rounded-full bg-blue-400/40"
          animate={{
            y: [0, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );

  const handleChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    requiredFields.forEach((field) => {
      if (!formState[field] || formState[field].trim().length === 0) {
        nextErrors[field] = "This field is required.";
      }
    });

    if (!user?.uid) {
      nextErrors.name = "Authentication required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isPermissionDeniedError = (error: unknown): boolean => {
    if (!error || typeof error !== "object") return false;
    if (!("code" in error)) return false;
    const code = (error as { code?: unknown }).code;
    if (typeof code !== "string") return false;
    return code === "permission-denied" || code === "storage/unauthorized";
  };

  const submitProfile = async (): Promise<boolean> => {
    try {
      let profilePictureUrl = profile?.profilePictureUrl ?? null;
      if (profilePictureFile) {
        try {
          console.log("Profile submission: starting upload", profilePictureFile.name);
          const storageRef = ref(storage, `students/${user!.uid}/profile-${Date.now()}-${profilePictureFile.name}`);
          const snapshot = await uploadBytes(storageRef, profilePictureFile);
          profilePictureUrl = await getDownloadURL(snapshot.ref);
          console.log("Profile submission: upload complete", profilePictureUrl);
        } catch (uploadError) {
          console.error("Profile photo upload failed", uploadError);
          if (isPermissionDeniedError(uploadError)) {
            toast({ title: "Permission denied. Contact admin.", description: "Storage permissions are required to upload your photo.", variant: "destructive" });
          } else {
            const message = uploadError instanceof Error ? uploadError.message : "Unable to upload profile photo.";
            toast({ title: "Upload failed", description: message, variant: "destructive" });
          }
          return false;
        }
      }

      const skillsArray = formState.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      const payload: Record<string, unknown> = {
        name: formState.name.trim(),
        dob: formState.dob.trim(),
        gender: formState.gender.trim(),
        department: formState.department.trim(),
        university: formState.university.trim(),
        rollNumber: formState.rollNumber.trim(),
        contactNumber: formState.contactNumber.trim(),
        address: formState.address.trim(),
        email: formState.email.trim(),
        gpa: formState.gpa.trim().length > 0 ? Number(formState.gpa) : null,
        skills: skillsArray,
        emergencyContact: toNullIfEmpty(formState.emergencyContact),
        profilePictureUrl,
        profileCompleted: true,
        lastProfileUpdateAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!profile?.createdAt) {
        payload.createdAt = serverTimestamp();
      }

      try {
        console.log("Profile submission: saving document", payload);
        await setDoc(doc(db, "students", user!.uid), payload, { merge: true });
      } catch (firestoreError) {
        console.error("Failed to save profile document", firestoreError);
        if (isPermissionDeniedError(firestoreError)) {
          toast({ title: "Permission denied. Contact admin.", description: "You do not have access to save this profile.", variant: "destructive" });
        } else {
          const message = firestoreError instanceof Error ? firestoreError.message : "Unable to save your profile.";
          toast({ title: "Save failed", description: message, variant: "destructive" });
        }
        return false;
      }

      try {
        console.log("Profile submission: notifying admin");
        await addAdminNotification({
          type: "newStudent",
          uid: user!.uid,
          message: "New student profile submitted",
          studentName: formState.name.trim() || profile?.name || user!.displayName || "Unknown student",
          metadata: { profileCompleted: true },
        });
      } catch (notificationError) {
        console.error("Failed to send admin notification", notificationError);
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("profile-bypass", "true");
      }

      toast({ title: "Profile submitted successfully", description: "Your profile is now up to date." });
      navigate("/dashboard", { replace: true, state: { bypassProfileCheck: true } });
      return true;
    } catch (unexpectedError) {
      console.error("Unexpected profile submission error", unexpectedError);
      const message = unexpectedError instanceof Error ? unexpectedError.message : "Unable to submit your profile.";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
      return false;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.uid) {
      toast({ title: "Authentication required", description: "Please sign in again.", variant: "destructive" });
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    console.log("Submitting profile with form state", formState);
    try {
      await submitProfile();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (profile?.profileCompleted) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <BackgroundParticles prefix="profile-complete" />

        <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <Card className="border border-white/10 bg-white/10 text-white backdrop-blur-xl dark:bg-slate-900/60">
              <CardHeader className="flex flex-col gap-3">
                <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  Profile already completed
                </CardTitle>
                <CardDescription className="text-slate-200">
                  Your information is on file. You can edit it later from the profile update section inside the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button
                  onClick={() => navigate("/dashboard", { replace: true, state: { bypassProfileCheck: true } })}
                  className="rounded-xl bg-white/90 text-slate-900"
                >
                  Continue to dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <BackgroundParticles prefix="complete-profile" />

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 lg:ml-0 lg:mr-auto lg:flex-row lg:gap-14">
          <Card className="h-fit w-full border border-white/10 bg-white/10 text-white backdrop-blur-xl lg:w-[360px] dark:bg-slate-900/70">
            <CardHeader className="space-y-4">
              <CardTitle className="text-2xl font-semibold">Profile completion</CardTitle>
              <CardDescription className="text-slate-300">
                Fill the required fields to unlock your personalised dashboard and learning insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>Progress</span>
                  <span>
                    {completion.segmentsFilled}/{completion.segmentTotal}
                  </span>
                </div>
                <div className="flex gap-1">
                  {progressSegmentClasses.map((colorClass, index) => {
                    const isFilled = index < completion.segmentsFilled;
                    return (
                      <div
                        key={`progress-segment-${index}`}
                        className={`h-2 flex-1 rounded-full transition ${
                          isFilled ? colorClass : "bg-white/20"
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="sr-only">{completion.percentage}% completed</span>
                <p className="text-xs text-slate-300">
                  Complete all mandatory fields marked with * to continue to your dashboard.
                </p>
              </div>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 text-sky-300" />
                  <span>Your data is stored securely and is only visible to authorised EduCareer personnel.</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-amber-300" />
                  <span>You can update your information later from the dashboard profile section.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full border border-white/10 bg-white/10 text-white backdrop-blur-xl dark:bg-slate-900/70 lg:ml-auto lg:flex-1 lg:max-h-[calc(100vh-6rem)] lg:overflow-hidden lg:px-0">
            <CardHeader className="space-y-3 border-b border-white/10 pb-6 lg:px-6 lg:pb-4">
              <CardTitle className="text-3xl font-semibold">Complete your student profile</CardTitle>
              <CardDescription className="text-slate-300">
                We need a few more details to personalise your EduCareer experience.
              </CardDescription>
            </CardHeader>
            <ScrollArea className="lg:h-full">
              <CardContent className="pt-6 lg:px-6 lg:pb-20">
                <form id="complete-profile-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name *</Label>
                      <Input
                        id="name"
                        value={formState.name}
                        onChange={(event) => handleChange("name", event.target.value)}
                        className={`bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-white/50 ${
                          errors.name ? "border-red-400" : "border-white/20"
                        }`}
                      />
                      {errors.name && <p className="text-sm text-red-300">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formState.dob}
                        onChange={(event) => handleChange("dob", event.target.value)}
                        className={`bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-white/50 ${
                          errors.dob ? "border-red-400" : "border-white/20"
                        }`}
                      />
                      {errors.dob && <p className="text-sm text-red-300">{errors.dob}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Select value={formState.gender} onValueChange={(value) => handleChange("gender", value)}>
                        <SelectTrigger
                          className={`bg-white/10 text-white focus:ring-white/50 ${
                            errors.gender ? "border-red-400" : "border-white/20"
                          }`}
                        >
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 text-white">
                          {genders.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-sm text-red-300">{errors.gender}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Department / Major *</Label>
                      <Select value={formState.department} onValueChange={(value) => handleChange("department", value)}>
                        <SelectTrigger
                          className={`bg-white/10 text-white focus:ring-white/50 ${
                            errors.department ? "border-red-400" : "border-white/20"
                          }`}
                        >
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 text-white">
                          {departments.map((department) => (
                            <SelectItem key={department} value={department}>
                              {department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.department && <p className="text-sm text-red-300">{errors.department}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>University *</Label>
                      <Popover open={isUniversityOpen} onOpenChange={setIsUniversityOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isUniversityOpen}
                            className={cn(
                              "w-full justify-between bg-white/10 text-left text-white hover:bg-white/20",
                              errors.university ? "border-red-400" : "border-white/20",
                            )}
                          >
                            {formState.university || "Select university"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[320px] border border-white/15 bg-slate-950/90 p-0 text-white backdrop-blur-xl"
                          align="start"
                        >
                          <div className="border-b border-white/10 p-2">
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
                                    "h-8 w-full border-white/20 bg-white/10 text-xs font-medium text-white hover:bg-white/20",
                                    universityFilter === key && "border-white bg-white text-slate-900",
                                  )}
                                >
                                  {label}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <Command className="bg-transparent text-white">
                            <CommandInput
                              placeholder="Search universities..."
                              className="border-b border-white/10 bg-transparent text-white placeholder:text-slate-400"
                            />
                            <CommandEmpty className="px-3 py-2 text-sm text-slate-300">No university found.</CommandEmpty>
                            <CommandList className="max-h-72 text-white">
                              {(universityFilter === "all" || universityFilter === "public") && (
                                <CommandGroup heading="Public Universities" className="text-white">
                                  {publicUniversities.map((university) => {
                                    const isSelected = formState.university === university;
                                    return (
                                      <CommandItem
                                        key={`public-${university}`}
                                        value={university}
                                        onSelect={() => {
                                          handleChange("university", university);
                                          setIsUniversityOpen(false);
                                        }}
                                        className="text-sm text-white"
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                        {university}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              )}
                              {(universityFilter === "all" || universityFilter === "private") && (
                                <CommandGroup heading="Private Universities" className="text-white">
                                  {privateUniversities.map((university) => {
                                    const isSelected = formState.university === university;
                                    return (
                                      <CommandItem
                                        key={`private-${university}`}
                                        value={university}
                                        onSelect={() => {
                                          handleChange("university", university);
                                          setIsUniversityOpen(false);
                                        }}
                                        className="text-sm text-white"
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
                      {errors.university && <p className="text-sm text-red-300">{errors.university}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber">Student ID / Roll number *</Label>
                      <Input
                        id="rollNumber"
                        value={formState.rollNumber}
                        onChange={(event) => handleChange("rollNumber", event.target.value)}
                        className={`bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-white/50 ${
                          errors.rollNumber ? "border-red-400" : "border-white/20"
                        }`}
                      />
                      {errors.rollNumber && <p className="text-sm text-red-300">{errors.rollNumber}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact number *</Label>
                      <Input
                        id="contactNumber"
                        value={formState.contactNumber}
                        onChange={(event) => handleChange("contactNumber", event.target.value)}
                        className={`bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-white/50 ${
                          errors.contactNumber ? "border-red-400" : "border-white/20"
                        }`}
                      />
                      {errors.contactNumber && <p className="text-sm text-red-300">{errors.contactNumber}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Textarea
                        id="address"
                        value={formState.address}
                        onChange={(event) => handleChange("address", event.target.value)}
                        className={`bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-white/50 ${
                          errors.address ? "border-red-400" : "border-white/20"
                        }`}
                        rows={3}
                      />
                      {errors.address && <p className="text-sm text-red-300">{errors.address}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Institution email</Label>
                      <Input id="email" value={formState.email} readOnly className="bg-white/10 text-white/90 border-white/20" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gpa">Current GPA (optional)</Label>
                      <Input
                        id="gpa"
                        type="number"
                        step="0.01"
                        value={formState.gpa}
                        onChange={(event) => handleChange("gpa", event.target.value)}
                        className="bg-white/10 text-white border-white/20 placeholder:text-slate-400 focus-visible:ring-white/50"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="skills">Skills / Interests (comma separated)</Label>
                      <Input
                        id="skills"
                        value={formState.skills}
                        onChange={(event) => handleChange("skills", event.target.value)}
                        className="bg-white/10 text-white border-white/20 placeholder:text-slate-400 focus-visible:ring-white/50"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="emergencyContact">Emergency contact (optional)</Label>
                      <Input
                        id="emergencyContact"
                        value={formState.emergencyContact}
                        onChange={(event) => handleChange("emergencyContact", event.target.value)}
                        className="bg-white/10 text-white border-white/20 placeholder:text-slate-400 focus-visible:ring-white/50"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Profile picture (optional)</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                          onClick={() => document.getElementById("profile-picture-input")?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" /> Upload image
                        </Button>
                        <span className="text-sm text-slate-300">
                          {profilePictureFile?.name ?? profile?.profilePictureUrl ?? "No file selected"}
                        </span>
                      </div>
                      <input
                        id="profile-picture-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            setProfilePictureFile(file);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="h-32" />
                </form>
              </CardContent>
            </ScrollArea>
            <div className="sticky bottom-0 border-t border-white/10 bg-slate-950">
              <div className="flex flex-col gap-3 px-6 py-4 text-sm text-slate-200 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl rounded-xl border border-white/15 bg-slate-900 px-4 py-3 leading-relaxed text-slate-100">
                  Your profile must be completed to access the dashboard. You can revisit this page later to update any information.
                </div>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    const formElement = document.getElementById("complete-profile-form") as HTMLFormElement | null;
                    formElement?.requestSubmit();
                  }}
                  className="rounded-xl bg-white/90 px-6 font-semibold text-slate-900 transition hover:bg-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving profile
                    </>
                  ) : (
                    "Save and continue"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
