import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAdminCareerGuidance } from "@/hooks/useAdminCareerGuidance";
import { useStudentsCollection } from "@/hooks/useStudentsCollection";
import {
  FileText,
  Inbox,
  Layers,
  GraduationCap,
  Sparkles,
  Compass,
  ClipboardList,
  Target,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Star,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StudentFilterOption = "all" | string;
type TabKey = "overview" | "surveys" | "documents" | "assessments" | "recommendations";

const formatTimestamp = (value: unknown): string | null => {
  const date =
    typeof value === "object" && value !== null && "toDate" in value
      ? (value as { toDate: () => Date }).toDate()
      : undefined;
  if (!date) return null;
  try {
    return format(date, "PP • p");
  } catch {
    return null;
  }
};

const formatRelative = (value: unknown): string | null => {
  const date =
    typeof value === "object" && value !== null && "toDate" in value
      ? (value as { toDate: () => Date }).toDate()
      : undefined;
  if (!date) return null;
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return null;
  }
};

const ocrStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  success: { label: "OCR Complete", variant: "secondary", icon: CheckCircle2 },
  failed: { label: "OCR Failed", variant: "destructive", icon: XCircle },
  no_text: { label: "No Text", variant: "outline", icon: AlertTriangle },
  pending: { label: "Analysing", variant: "outline", icon: Clock },
};

export default function AdminStudentCareerGuidancePage() {
  const { documents, assessments, attempts, recommendations, surveys, studentIds, isLoading: dataLoading } =
    useAdminCareerGuidance();
  const { students, isLoading: studentsLoading } = useStudentsCollection();

  const [studentFilter, setStudentFilter] = useState<StudentFilterOption>("all");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const isLoading = dataLoading || studentsLoading;

  const userIdToNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [students]);

  const filteredSurveys = useMemo(
    () => (studentFilter === "all" ? surveys : surveys.filter((s) => s.userId === studentFilter)),
    [surveys, studentFilter],
  );

  const filteredDocuments = useMemo(
    () => (studentFilter === "all" ? documents : documents.filter((doc) => doc.userId === studentFilter)),
    [documents, studentFilter],
  );

  const filteredAssessments = useMemo(
    () => (studentFilter === "all" ? assessments : assessments.filter((item) => item.userId === studentFilter)),
    [assessments, studentFilter],
  );

  const filteredAttempts = useMemo(
    () => (studentFilter === "all" ? attempts : attempts.filter((item) => item.userId === studentFilter)),
    [attempts, studentFilter],
  );

  const filteredRecommendations = useMemo(
    () =>
      studentFilter === "all" ? recommendations : recommendations.filter((item) => item.userId === studentFilter),
    [recommendations, studentFilter],
  );

  const averageScore = useMemo(() => {
    if (!filteredAttempts.length) return null;
    const sum = filteredAttempts.reduce((acc, attempt) => acc + (attempt.score ?? 0), 0);
    return Math.round(sum / filteredAttempts.length);
  }, [filteredAttempts]);

  const summaryCards = [
    {
      label: "Surveys completed",
      value: filteredSurveys.length,
      subtitle: filteredSurveys.length
        ? `${new Set(filteredSurveys.flatMap((s) => s.careerGoals)).size} unique goals`
        : "No surveys yet",
      icon: ClipboardList,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
    },
    {
      label: "Documents uploaded",
      value: filteredDocuments.length,
      subtitle: filteredDocuments.filter((d) => d.ocrStatus === "success").length
        ? `${filteredDocuments.filter((d) => d.ocrStatus === "success").length} OCR success`
        : "Awaiting uploads",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Quiz attempts",
      value: filteredAttempts.length,
      subtitle: averageScore !== null ? `${averageScore}% avg score` : "No submissions",
      icon: GraduationCap,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
    },
    {
      label: "AI recommendations",
      value: filteredRecommendations.length,
      subtitle: filteredRecommendations[0]?.recommendations?.[0]?.careerName
        ? `Latest: ${filteredRecommendations[0].recommendations[0].careerName}`
        : "Run assessments first",
      icon: Sparkles,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  const hasAnyData =
    filteredSurveys.length +
      filteredDocuments.length +
      filteredAttempts.length +
      filteredRecommendations.length >
    0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="border-border/60 bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/60 shadow-lg backdrop-blur-md dark:from-teal-950/30 dark:via-slate-950/80 dark:to-cyan-950/30">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Student Career Guidance</CardTitle>
              <CardDescription className="max-w-xl">
                View each student's complete career guidance journey — from survey choices and document uploads, through AI
                assessments and personalised career recommendations.
              </CardDescription>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Filter by student</div>
            <Select value={studentFilter} onValueChange={(value) => setStudentFilter(value as StudentFilterOption)}>
              <SelectTrigger className="lg:w-[240px]">
                <SelectValue placeholder="All students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {studentIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {userIdToNameMap[id] || (id.length > 20 ? `${id.slice(0, 8)}...${id.slice(-6)}` : id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-950/70"
            >
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{item.label}</span>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", item.bg)}>
                  <item.icon className={cn("h-4 w-4", item.color)} />
                </div>
              </div>
              <div className="mt-3 text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : item.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{item.subtitle}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Skeleton className="h-[480px] rounded-3xl" />
          <Skeleton className="h-[480px] rounded-3xl" />
        </div>
      ) : hasAnyData ? (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">
              <Layers className="mr-1.5 h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="surveys">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Surveys
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Documents
            </TabsTrigger>
            <TabsTrigger value="assessments">
              <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> Assessments
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Recommendations
            </TabsTrigger>
          </TabsList>

          {/* ======================== OVERVIEW ======================== */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Survey snapshot */}
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ClipboardList className="h-4 w-4 text-teal-500" /> Survey Snapshot
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredSurveys.length > 0 ? (
                    <div className="space-y-3">
                      {filteredSurveys.slice(0, 3).map((survey) => (
                        <div
                          key={survey.userId}
                          className="rounded-2xl border border-border/60 bg-background/80 p-3 space-y-2"
                        >
                          <div className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                            {userIdToNameMap[survey.userId] || (survey.userId.length > 20 ? `${survey.userId.slice(0, 8)}...${survey.userId.slice(-6)}` : survey.userId)}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {survey.careerGoals.map((goal) => (
                              <Badge key={goal} variant="secondary" className="rounded-full text-[10px]">
                                <Target className="mr-1 h-2.5 w-2.5" /> {goal}
                              </Badge>
                            ))}
                          </div>
                          {survey.studyTracks.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {survey.studyTracks.map((track) => (
                                <Badge key={track} variant="outline" className="rounded-full text-[10px]">
                                  <BookOpen className="mr-1 h-2.5 w-2.5" /> {track}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {filteredSurveys.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{filteredSurveys.length - 3} more surveys
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No surveys completed yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Document highlights */}
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-blue-500" /> Document Highlights
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {filteredDocuments.slice(0, 3).map((doc) => {
                        const status = ocrStatusConfig[doc.ocrStatus ?? "pending"] ?? ocrStatusConfig.pending;
                        return (
                          <div
                            key={`${doc.userId}-${doc.id}`}
                            className="rounded-2xl border border-border/60 bg-background/80 p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate max-w-[200px]">{doc.filename}</span>
                              <Badge variant={status.variant} className="rounded-full text-[10px]">
                                <status.icon className="mr-1 h-2.5 w-2.5" /> {status.label}
                              </Badge>
                            </div>
                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {userIdToNameMap[doc.userId] ||
                                (doc.userId.length > 20 ? `${doc.userId.slice(0, 8)}...${doc.userId.slice(-6)}` : doc.userId)}
                            </div>
                            {doc.extractedTextSnippet && doc.extractedTextSnippet !== "No readable text detected." && (
                              <div className="rounded-xl bg-muted/30 p-2.5 text-xs text-muted-foreground italic leading-relaxed">
                                "{doc.extractedTextSnippet}"
                              </div>
                            )}
                            {doc.metadataClassification && (
                              <Badge variant="outline" className="rounded-full text-[10px]">
                                {doc.metadataClassification}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Assessment results */}
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Trophy className="h-4 w-4 text-purple-500" /> Assessment Results
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredAttempts.length > 0 ? (
                    <div className="space-y-3">
                      {filteredAttempts.slice(0, 4).map((attempt) => (
                        <div
                          key={`${attempt.userId}-${attempt.id}`}
                          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 p-3"
                        >
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold",
                              attempt.score >= 70
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : attempt.score >= 40
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
                            )}
                          >
                            {attempt.score}%
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">
                               {userIdToNameMap[attempt.userId] || (attempt.userId.length > 20 ? `${attempt.userId.slice(0, 8)}...${attempt.userId.slice(-6)}` : attempt.userId)}
                             </div>
                            <div className="text-xs text-muted-foreground">
                              {attempt.correctCount}/{attempt.questions.length} correct •{" "}
                              {Math.round(attempt.timeTakenSeconds / 60)}m
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelative(attempt.submittedAt) ?? "recently"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No quiz attempts recorded.</p>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations snapshot */}
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-amber-500" /> AI Recommendations
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredRecommendations.length > 0 ? (
                    <div className="space-y-3">
                      {filteredRecommendations.slice(0, 3).map((item) => (
                        <div
                          key={`${item.userId}-${item.id}`}
                          className="rounded-2xl border border-border/60 bg-background/80 p-3 space-y-2"
                        >
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {userIdToNameMap[item.userId] ||
                              (item.userId.length > 20 ? `${item.userId.slice(0, 8)}...${item.userId.slice(-6)}` : item.userId)}
                          </div>
                          <div className="space-y-1.5">
                            {item.recommendations.slice(0, 2).map((rec) => (
                              <div key={rec.careerName} className="flex items-center gap-2">
                                <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <span className="text-sm font-medium">{rec.careerName}</span>
                                <Badge variant="secondary" className="rounded-full text-[10px] ml-auto">
                                  {rec.confidenceScore}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                          {item.flags?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {item.flags.map((flag) => (
                                <Badge key={flag} variant="outline" className="rounded-full text-[10px] text-amber-600">
                                  <AlertTriangle className="mr-1 h-2.5 w-2.5" /> {flag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No AI recommendations generated yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ======================== SURVEYS TAB ======================== */}
          <TabsContent value="surveys" className="space-y-6">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-lg">Career Guidance Surveys</CardTitle>
                <CardDescription>
                  What career goals and study tracks each student selected during onboarding.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredSurveys.length > 0 ? (
                  <ScrollArea className="max-h-[600px] pr-2">
                    <div className="space-y-4">
                      {filteredSurveys.map((survey) => (
                        <div
                          key={survey.userId}
                          className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm dark:bg-slate-950/70"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-mono text-muted-foreground">{survey.userId}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTimestamp(survey.updatedAt) ?? formatTimestamp(survey.createdAt) ?? "Unknown date"}
                            </div>
                          </div>
                          <Separator className="mb-3" />
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                Career Goals
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {survey.careerGoals.length > 0 ? (
                                  survey.careerGoals.map((goal) => (
                                    <Badge
                                      key={goal}
                                      className="rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
                                    >
                                      <Target className="mr-1 h-3 w-3" /> {goal}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">None specified</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                Study Tracks
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {survey.studyTracks.length > 0 ? (
                                  survey.studyTracks.map((track) => (
                                    <Badge
                                      key={track}
                                      variant="outline"
                                      className="rounded-full"
                                    >
                                      <BookOpen className="mr-1 h-3 w-3" /> {track}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">None specified</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <EmptyStateBlock
                    icon={ClipboardList}
                    title="No surveys completed"
                    body="Students will complete their career preference survey to kickstart the guidance journey."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================== DOCUMENTS TAB ======================== */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-lg">Uploaded Documents & Extracted Info</CardTitle>
                <CardDescription>
                  Scanned academic evidence with OCR-extracted text — only metadata is shown; raw images are not stored.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredDocuments.length > 0 ? (
                  <Accordion type="multiple" className="space-y-3">
                    {filteredDocuments.map((doc) => {
                      const status = ocrStatusConfig[doc.ocrStatus ?? "pending"] ?? ocrStatusConfig.pending;
                      return (
                        <AccordionItem
                          key={`${doc.userId}-${doc.id}`}
                          value={`${doc.userId}-${doc.id}`}
                          className="rounded-2xl border border-border/60 bg-white/80 px-4 shadow-sm dark:bg-slate-950/70"
                        >
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex flex-1 items-center gap-3 text-left">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate">{doc.filename}</div>
                                <div className="text-xs text-muted-foreground font-mono">{doc.userId}</div>
                              </div>
                              <Badge variant={status.variant} className="rounded-full text-[10px] shrink-0">
                                <status.icon className="mr-1 h-2.5 w-2.5" /> {status.label}
                              </Badge>
                              {typeof doc.docConfidence === "number" && (
                                <Badge variant="outline" className="rounded-full text-[10px] shrink-0">
                                  {doc.docConfidence}% confidence
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl bg-muted/20 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                  File Info
                                </p>
                                <p className="text-sm">{doc.contentType} • {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Uploaded {formatTimestamp(doc.uploadedAt) ?? "unknown date"}
                                </p>
                              </div>
                              {doc.metadataClassification && (
                                <div className="rounded-xl bg-muted/20 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                    Classification
                                  </p>
                                  <Badge variant="secondary" className="rounded-full">
                                    {doc.metadataClassification}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {doc.extractedTextSnippet && (
                              <div className="rounded-xl border border-border/60 bg-gradient-to-br from-slate-50 to-white p-4 dark:from-slate-950/60 dark:to-slate-950/40">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                  Extracted Text
                                </p>
                                <p className="text-sm leading-relaxed text-foreground/90 italic">
                                  "{doc.extractedTextSnippet}"
                                </p>
                              </div>
                            )}

                            {doc.warnings && doc.warnings.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Warnings</p>
                                {doc.warnings.map((warning, index) => (
                                  <div key={index} className="flex items-start gap-2 text-xs text-amber-600">
                                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                    <span>{warning}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <EmptyStateBlock
                    icon={FileText}
                    title="No documents uploaded"
                    body="Students upload transcripts, certificates, or mark sheets. The AI extracts text and metadata — raw images are never stored."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================== ASSESSMENTS TAB ======================== */}
          <TabsContent value="assessments" className="space-y-6">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-lg">AI-Tailored Assessment Results</CardTitle>
                <CardDescription>
                  Quiz scores, time taken, and question-level breakdown for each student attempt.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {filteredAttempts.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Correct</TableHead>
                          <TableHead>Questions</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>IQ Pts</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAttempts.map((attempt) => (
                          <TableRow key={`${attempt.userId}-${attempt.id}`} className="border-border/60">
                            <TableCell className="text-xs font-mono text-muted-foreground max-w-[140px] truncate">
                              {attempt.userId}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={attempt.score >= 70 ? "secondary" : attempt.score >= 40 ? "outline" : "destructive"}
                                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                              >
                                {attempt.score}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {attempt.correctCount}/{attempt.questions.length}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {attempt.questions.length} Q
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {Math.round(attempt.timeTakenSeconds / 60)}m {attempt.timeTakenSeconds % 60}s
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {attempt.iqPoints ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatRelative(attempt.submittedAt) ?? "Unknown"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="p-8">
                    <EmptyStateBlock
                      icon={GraduationCap}
                      title="No quiz attempts"
                      body="Students need to complete the AI-generated assessments before results appear here."
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assessment generation info */}
            {filteredAssessments.length > 0 && (
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-lg">Generated Assessments</CardTitle>
                  <CardDescription>
                    AI-generated question sets based on student survey choices and document analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[320px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Questions</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Study Tracks</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssessments.map((assessment) => (
                          <TableRow key={`${assessment.userId}-${assessment.id}`} className="border-border/60">
                            <TableCell className="text-xs font-mono text-muted-foreground max-w-[140px] truncate">
                              {assessment.userId}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {assessment.questions.length}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {assessment.sourceSurveyChoices?.slice(0, 2).map((choice) => (
                                  <Badge key={choice} variant="outline" className="rounded-full text-[10px]">
                                    {choice}
                                  </Badge>
                                ))}
                                {(assessment.sourceSurveyChoices?.length ?? 0) > 2 && (
                                  <Badge variant="outline" className="rounded-full text-[10px]">
                                    +{assessment.sourceSurveyChoices.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {assessment.sourceStudyTracks?.slice(0, 2).map((track) => (
                                  <Badge key={track} variant="secondary" className="rounded-full text-[10px]">
                                    {track}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatRelative(assessment.createdAt) ?? "Unknown"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ======================== RECOMMENDATIONS TAB ======================== */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-lg">AI Career Recommendations</CardTitle>
                <CardDescription>
                  Personalised career paths generated by AI, with confidence scores, action plans, and recommended subjects.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRecommendations.length > 0 ? (
                  <ScrollArea className="max-h-[700px] pr-2">
                    <div className="space-y-6">
                      {filteredRecommendations.map((item) => (
                        <div
                          key={`${item.userId}-${item.id}`}
                          className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm dark:bg-slate-950/70"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs font-mono text-muted-foreground">{item.userId}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTimestamp(item.generatedAt) ?? "Unknown"}
                            </div>
                          </div>
                          <Separator className="mb-4" />

                          <div className="space-y-4">
                            {item.recommendations.map((rec, index) => (
                              <div
                                key={rec.careerName}
                                className={cn(
                                  "rounded-2xl border p-4 space-y-3",
                                  index === 0
                                    ? "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
                                    : "border-border/60 bg-background/80",
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {index === 0 && <Trophy className="h-5 w-5 text-amber-500" />}
                                  <span className="text-base font-bold">{rec.careerName}</span>
                                  <Badge
                                    variant={rec.confidenceScore >= 70 ? "secondary" : "outline"}
                                    className="rounded-full ml-auto"
                                  >
                                    {rec.confidenceScore}% confidence
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{rec.why}</p>

                                {rec.recommendedSubjectsToStudy?.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                      Recommended Subjects
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {rec.recommendedSubjectsToStudy.map((subject) => (
                                        <Badge key={subject} variant="secondary" className="rounded-full text-[10px]">
                                          <BookOpen className="mr-1 h-2.5 w-2.5" /> {subject}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {rec.actionPlan?.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                                      Action Plan
                                    </p>
                                    <div className="space-y-1">
                                      {rec.actionPlan.map((step, stepIndex) => (
                                        <div key={stepIndex} className="flex items-start gap-2 text-xs text-muted-foreground">
                                          <ArrowRight className="mt-0.5 h-3 w-3 text-primary shrink-0" />
                                          <span>{step}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {item.flags?.length ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {item.flags.map((flag) => (
                                <Badge key={flag} variant="outline" className="rounded-full text-[10px] text-amber-600 dark:text-amber-300">
                                  <AlertTriangle className="mr-1 h-2.5 w-2.5" /> {flag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <EmptyStateBlock
                    icon={Sparkles}
                    title="No recommendations yet"
                    body="Once students complete assessments, the AI will generate personalised career pathways."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-border/60 bg-card/90">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Compass className="h-12 w-12 text-muted-foreground" />
            <div className="text-lg font-semibold">No career guidance activity yet</div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Once students complete their career survey, upload academic documents, take AI assessments, and receive recommendations,
              all their data will appear here for admin review.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyStateBlock({ icon: Icon, title, body }: { icon: typeof Sparkles; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Icon className="h-10 w-10 text-muted-foreground" />
      <div className="text-base font-semibold">{title}</div>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
