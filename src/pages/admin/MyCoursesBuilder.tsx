import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCcw, UploadCloud, ImageIcon } from "lucide-react";
import {
  CourseListDraft,
  CoursePlanDraft,
  CourseTopic,
  SemesterPlan,
  createEmptySemester,
  createEmptyTopic,
  fetchCourseBuilderDraft,
  publishCourseList,
  publishCoursePlan,
  saveCourseListDraft,
  saveCoursePlanDraft,
  uploadUniversityLogo,
} from "@/utils/courseBuilder";
import { CourseListBuilder } from "@/components/course-builder/CourseListBuilder";
import { CoursePlanBuilder } from "@/components/course-builder/CoursePlanBuilder";
import { UniversityOption, UniversitySelect } from "@/components/university/UniversitySelect";

const MIN_TOPICS = 1;
const MIN_SEMESTERS = 1;

const createDefaultTopics = () => [createEmptyTopic("Topic 1")];
const createDefaultSemesters = () => [createEmptySemester("Semester 1")];

const buildListDraft = (university: UniversityOption, topics: CourseTopic[], logoUrl: string | null): CourseListDraft => ({
  universityId: university.id,
  universityName: university.name,
  logoUrl,
  topics,
});

const buildPlanDraft = (
  university: UniversityOption,
  semesters: SemesterPlan[],
  logoUrl: string | null,
  title: string,
): CoursePlanDraft => ({
  universityId: university.id,
  universityName: university.name,
  logoUrl,
  title,
  semesters,
});

export default function MyCoursesBuilderPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityOption | null>(null);
  const [topics, setTopics] = useState<CourseTopic[]>(createDefaultTopics);
  const [semesters, setSemesters] = useState<SemesterPlan[]>(createDefaultSemesters);
  const [programTitle, setProgramTitle] = useState("BSc in Computer Science & Engineering (CSE)");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingList, setSavingList] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [publishingList, setPublishingList] = useState(false);
  const [publishingPlan, setPublishingPlan] = useState(false);

  const canEdit = Boolean(selectedUniversity);
  const isBusy = loadingDraft || savingList || savingPlan || publishingList || publishingPlan;

  const resetState = () => {
    setTopics(createDefaultTopics());
    setSemesters(createDefaultSemesters());
    setLogoUrl(null);
    setProgramTitle("BSc in Computer Science & Engineering (CSE)");
  };

  const hydrateFromFirestore = async (university: UniversityOption) => {
    setLoadingDraft(true);
    try {
      const data = await fetchCourseBuilderDraft(university.id);
      setTopics(data.list?.topics?.length ? data.list.topics : createDefaultTopics());
      setSemesters(data.plan?.semesters?.length ? data.plan.semesters : createDefaultSemesters());
      setProgramTitle(data.plan?.title ?? `Study Plan @ ${university.name}`);
      setLogoUrl(data.list?.logoUrl ?? data.plan?.logoUrl ?? null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to load draft",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      resetState();
    } finally {
      setLoadingDraft(false);
    }
  };

  useEffect(() => {
    if (!selectedUniversity) {
      resetState();
      return;
    }
    hydrateFromFirestore(selectedUniversity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUniversity?.id]);

  const triggerLogoUpload = () => {
    if (!canEdit) return;
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUniversity) return;
    setLogoUploading(true);
    try {
      const url = await uploadUniversityLogo(file, selectedUniversity.id);
      setLogoUrl(url);
      toast({ title: "Logo uploaded", description: "New logo applied to drafts and publish." });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try another file",
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  };

  const handleSaveList = async () => {
    if (!selectedUniversity) return;
    if (topics.length < MIN_TOPICS) {
      toast({ title: "Add topics", description: "Create at least one topic before saving", variant: "destructive" });
      return;
    }
    setSavingList(true);
    try {
      await saveCourseListDraft(buildListDraft(selectedUniversity, topics, logoUrl));
      toast({ title: "Draft saved", description: "List of courses saved." });
    } catch (error) {
      toast({
        title: "Unable to save",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSavingList(false);
    }
  };

  const handlePublishList = async () => {
    if (!selectedUniversity) return;
    setPublishingList(true);
    try {
      await publishCourseList(buildListDraft(selectedUniversity, topics, logoUrl));
      toast({ title: "Published", description: "Students can now view the updated list." });
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setPublishingList(false);
    }
  };

  const handleSavePlan = async () => {
    if (!selectedUniversity) return;
    if (semesters.length < MIN_SEMESTERS) {
      toast({ title: "Add semesters", description: "Create at least one semester before saving", variant: "destructive" });
      return;
    }
    setSavingPlan(true);
    try {
      const payload = buildPlanDraft(selectedUniversity, semesters, logoUrl, programTitle.trim() || selectedUniversity.name);
      await saveCoursePlanDraft(payload);
      toast({ title: "Plan saved", description: "Semester plan draft stored." });
    } catch (error) {
      toast({
        title: "Unable to save",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSavingPlan(false);
    }
  };

  const handlePublishPlan = async () => {
    if (!selectedUniversity) return;
    setPublishingPlan(true);
    try {
      const payload = buildPlanDraft(selectedUniversity, semesters, logoUrl, programTitle.trim() || selectedUniversity.name);
      await publishCoursePlan(payload);
      toast({ title: "Plan published", description: "Students will see the new course plan." });
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setPublishingPlan(false);
    }
  };

  const LogoPreview = useMemo(() => {
    if (!logoUrl) return null;
    return (
      <div className="group relative inline-flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 shadow-sm dark:bg-slate-950/60">
        <img src={logoUrl} alt="University logo" className="h-14 w-14 rounded-xl bg-white object-contain" />
        <div className="flex flex-col text-left">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Logo preview</span>
          <span className="text-sm text-foreground">Linked to current draft</span>
        </div>
      </div>
    );
  }, [logoUrl]);

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>My Courses Builder</CardTitle>
          <CardDescription>Draft in /courseBuilder & publish to /universityCourses for students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Select university</p>
              <UniversitySelect
                value={selectedUniversity?.id}
                onChange={setSelectedUniversity}
                placeholder="Pick a university"
                className="bg-white"
              />
              <p className="text-xs text-muted-foreground">Drafts auto-load per university. Publishing overwrites student view.</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Program title</p>
              <Input
                value={programTitle}
                onChange={(event) => setProgramTitle(event.target.value)}
                placeholder="BSc in ..."
                disabled={!canEdit || loadingDraft}
              />
              <p className="text-xs text-muted-foreground">Shown on the Course Plan tab for students.</p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <Button variant="outline" size="sm" className="gap-2" onClick={triggerLogoUpload} disabled={!canEdit || logoUploading}>
              {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {logoUploading ? "Uploading..." : "Upload logo"}
            </Button>
            {logoUrl ? (
              <Button variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>
                Remove logo
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" /> No logo yet
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => selectedUniversity && hydrateFromFirestore(selectedUniversity)}
              disabled={!canEdit || loadingDraft}
            >
              {loadingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Reload draft
            </Button>
          </div>
          {LogoPreview}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="list">List of Courses</TabsTrigger>
          <TabsTrigger value="plan">Course Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="border-border/60 bg-white/90 dark:bg-slate-950/75">
            <CardHeader>
              <CardTitle>Dynamic Grid Builder</CardTitle>
              <CardDescription>Draft rows, columns, and course names. Drag headers to reorder.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingDraft ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <CourseListBuilder topics={topics} onChange={setTopics} />
              )}
              <div className="flex flex-wrap gap-3 border-t border-dashed border-border/60 pt-4">
                <Button onClick={handleSaveList} disabled={!canEdit || savingList || isBusy}>
                  {savingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Draft
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePublishList}
                  disabled={!canEdit || publishingList || isBusy}
                  className="gap-2"
                >
                  {publishingList ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Publish to students
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <Card className="border-border/60 bg-white/90 dark:bg-slate-950/75">
            <CardHeader>
              <CardTitle>Course Plan</CardTitle>
              <CardDescription>Mirror the semester layout shown on university sites. Add credits & notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingDraft ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <CoursePlanBuilder semesters={semesters} onChange={setSemesters} />
              )}
              <div className="flex flex-wrap gap-3 border-t border-dashed border-border/60 pt-4">
                <Button onClick={handleSavePlan} disabled={!canEdit || savingPlan || isBusy}>
                  {savingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Draft
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePublishPlan}
                  disabled={!canEdit || publishingPlan || isBusy}
                  className="gap-2"
                >
                  {publishingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Publish to students
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
