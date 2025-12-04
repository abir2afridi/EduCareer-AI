import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CourseListBuilder } from "@/components/course-builder/CourseListBuilder";
import { CoursePlanBuilder } from "@/components/course-builder/CoursePlanBuilder";
import { UniversityOption, UniversitySelect, universityOptions } from "@/components/university/UniversitySelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  CoursePresetContent,
  CourseTopic,
  SemesterPlan,
  UniversityCourseDocument,
  PublishedCourseCell,
  PublishedCoursePlanSemester,
  PublishedCourseRow,
  createEmptySemester,
  createEmptyTopic,
  createRandomId,
  deleteCourseDraft,
  deletePublishedCoursePreset,
  fetchCourseDraft,
  listenToPublishedCoursePreset,
  publishCoursePreset,
  saveCourseDraft,
  uploadUniversityLogo,
} from "@/utils/courseBuilder";
import { Loader2, UploadCloud, ImageIcon, RefreshCcw, Trash2, ShieldCheck, Eye, Pencil, RotateCcw } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const createDefaultTopics = () => [createEmptyTopic("Topic 1")];
const createDefaultSemesters = () => [createEmptySemester("Semester 1")];

const defaultProgramTitle = (option?: UniversityOption) =>
  option ? `Study Plan @ ${option.name}` : "University Program";

type PublishedPresetCard = {
  docId: string;
  universityId: string;
  universityName: string;
  universityLogo: string;
  totalCourses: number;
  updatedAt: string;
  raw: UniversityCourseDocument;
};

const normalizePublishedPreset = (preset: UniversityCourseDocument | null): UniversityCourseDocument | null => {
  if (!preset) return null;

  const listOfCourses: PublishedCourseRow[] = Array.isArray(preset.listOfCourses)
    ? preset.listOfCourses
        .filter((row): row is PublishedCourseRow => Boolean(row && typeof row === "object" && Array.isArray((row as PublishedCourseRow).cells)))
        .map((row, index) => {
          const cells = Array.isArray(row.cells)
            ? row.cells
                .filter((cell): cell is PublishedCourseCell => Boolean(cell && typeof cell === "object" && cell.id && cell.title))
                .map((cell) => ({
                  id: cell.id,
                  title: cell.title || "Course",
                  columnId: cell.columnId || "",
                  columnTitle: cell.columnTitle || "Column",
                  rowId: cell.rowId || row.rowId || `row-${index}`,
                  rowTitle: cell.rowTitle || row.rowTitle || "Row",
                  topicId: cell.topicId || row.topicId || "topic",
                  topicTitle: cell.topicTitle || row.topicTitle || "Topic",
                }))
            : [];

          const firstCell = cells[0];

          return {
            rowId: row.rowId || firstCell?.rowId || `row-${index}`,
            rowTitle: row.rowTitle || firstCell?.rowTitle || "Row",
            topicId: row.topicId || firstCell?.topicId || "topic",
            topicTitle: row.topicTitle || firstCell?.topicTitle || "Topic",
            cells,
          } satisfies PublishedCourseRow;
        })
        .filter((row) => row.cells.length > 0)
    : [];

  const coursePlan = {
    programTitle: preset.coursePlan?.programTitle || preset.universityName || "Program",
    semesters: Array.isArray(preset.coursePlan?.semesters)
      ? preset.coursePlan.semesters
          .filter((semester) => Boolean(semester && semester.id))
          .map((semester) => ({
            id: semester.id,
            name: semester.name || "Semester",
            courses: Array.isArray(semester.courses)
              ? semester.courses
                  .filter((course) => Boolean(course && course.id))
                  .map((course) => ({
                    id: course.id,
                    title: course.title || "Course",
                    code: course.code || undefined,
                    creditHours: course.creditHours || undefined,
                    note: course.note || undefined,
                  }))
              : [],
          }))
      : [],
  } satisfies UniversityCourseDocument["coursePlan"];

  return {
    universityId: preset.universityId,
    universityName: preset.universityName || "University",
    universityLogo: preset.universityLogo || "",
    listOfCourses,
    coursePlan,
    createdAt: preset.createdAt ?? null,
    updatedAt: preset.updatedAt ?? null,
  } satisfies UniversityCourseDocument;
};

const formatTimestamp = (value: unknown): string => {
  if (!value) return "Unknown";
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Unknown" : value.toLocaleString();
  }
  if (typeof value === "object" && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === "function") {
      const date = maybeTimestamp.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
  }
  return "Unknown";
};

export default function CourseManagementPage() {
  const { toast } = useToast();
  const { user, isAdmin, isLoading: adminLoading } = useAdminAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedUniversity, setSelectedUniversity] = useState<UniversityOption | null>(null);
  const [programTitle, setProgramTitle] = useState<string>(defaultProgramTitle());
  const [listOfCourses, setListOfCourses] = useState<CourseTopic[]>(createDefaultTopics);
  const [coursePlan, setCoursePlan] = useState<{ semesters: SemesterPlan[] }>({ semesters: createDefaultSemesters() });
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [universityId, setUniversityId] = useState<string>("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [deletingPublished, setDeletingPublished] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [publishedPreset, setPublishedPreset] = useState<UniversityCourseDocument | null>(null);
  const [draftReloadToken, setDraftReloadToken] = useState(0);
  const [publishedPresets, setPublishedPresets] = useState<PublishedPresetCard[]>([]);
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [loadingPublishedPresets, setLoadingPublishedPresets] = useState(true);
  const [viewingPreset, setViewingPreset] = useState<PublishedPresetCard | null>(null);
  const [presetAction, setPresetAction] = useState<{ id: string; type: "delete" | "republish" } | null>(null);

  const canManage = Boolean(user?.uid) && isAdmin;

  const baseUniversityOptions = useMemo<UniversityOption[]>(() => {
    if (universities.length) {
      return universities;
    }
    return universityOptions;
  }, [universities]);

  const filteredUniversityOptions = useMemo<UniversityOption[]>(
    () => baseUniversityOptions.filter((option) => !publishedIds.has(option.id)),
    [baseUniversityOptions, publishedIds],
  );

  const isSelectedPublished = selectedUniversity ? publishedIds.has(selectedUniversity.id) : false;

  const selectOptions = useMemo(() => {
    if (isSelectedPublished && selectedUniversity) {
      return [selectedUniversity, ...filteredUniversityOptions.filter((option) => option.id !== selectedUniversity.id)];
    }
    return filteredUniversityOptions;
  }, [filteredUniversityOptions, isSelectedPublished, selectedUniversity]);

  const selectDisabled = loadingUniversities || selectOptions.length === 0 || isSelectedPublished;

  const resetBuilderState = useCallback((option?: UniversityOption) => {
    setListOfCourses(createDefaultTopics());
    setCoursePlan({ semesters: createDefaultSemesters() });
    setProgramTitle(defaultProgramTitle(option));
    setLogoUrl("");
    setUniversityId(option?.id ?? "");
    setHasDraft(false);
  }, []);

  const loadDraftForUniversity = useCallback(
    async (option: UniversityOption) => {
      if (!user?.uid) return;

      setLoadingDraft(true);
      try {
        const draft = await fetchCourseDraft(user.uid, option.id);
        if (draft) {
          setListOfCourses(draft.topics.length ? draft.topics : createDefaultTopics());
          setCoursePlan({ semesters: draft.semesters.length ? draft.semesters : createDefaultSemesters() });
          setProgramTitle(draft.programTitle || defaultProgramTitle(option));
          setLogoUrl(draft.logoUrl ?? "");
          setUniversityId(option.id);
          setHasDraft(true);
        } else {
          resetBuilderState(option);
        }
      } catch (error) {
        console.error("Failed to load draft", error);
        toast({
          title: "Unable to load draft",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      } finally {
        setLoadingDraft(false);
      }
    },
    [resetBuilderState, toast, user?.uid],
  );

  useEffect(() => {
    if (!selectedUniversity || !user?.uid) return;

    let isCancelled = false;
    loadDraftForUniversity(selectedUniversity).catch(() => undefined);

    const unsubscribe = listenToPublishedCoursePreset(
      selectedUniversity.id,
      (preset) => {
        if (!isCancelled) {
          setPublishedPreset(normalizePublishedPreset(preset));
        }
      },
      (error) => {
        if (!isCancelled) {
          console.error("Failed to listen to published preset", error);
          toast({
            title: "Realtime sync error",
            description: "Unable to sync the published preset in realtime.",
            variant: "destructive",
          });
        }
      },
    );

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [selectedUniversity?.id, user?.uid, loadDraftForUniversity, toast, draftReloadToken]);

  useEffect(() => {
    let isMounted = true;

    const fetchUniversities = async () => {
      try {
        const snap = await getDocs(collection(db, "universities"));
        if (!isMounted) return;
        const options: UniversityOption[] = snap.docs
          .map((docSnap) => docSnap.data() as { id: string; name: string; category?: UniversityOption["category"] })
          .filter((doc) => doc?.id && doc?.name)
          .map((doc) => ({ id: doc.id, name: doc.name, category: doc.category ?? "public" }));

        setUniversities(options.length ? options : []);
      } catch (error) {
        console.error("Failed to fetch universities", error);
        toast({
          title: "Unable to load universities",
          description: "Using built-in list as fallback.",
        });
        const fallback = universityOptions;
        setUniversities(fallback);
      } finally {
        if (isMounted) {
          setLoadingUniversities(false);
        }
      }
    };

    const unsubscribe = onSnapshot(
      query(collection(db, "universityCourses"), orderBy("updatedAt", "desc")),
      (snapshot) => {
        if (!isMounted) return;
        const records: PublishedPresetCard[] = snapshot.docs.map((docSnap) => {
          const data = normalizePublishedPreset(docSnap.data() as UniversityCourseDocument) ?? {
            universityId: docSnap.id,
            universityName: "Unknown University",
            universityLogo: "",
            listOfCourses: [],
            coursePlan: { programTitle: "Program", semesters: [] },
            createdAt: null,
            updatedAt: null,
          };

          const totalCourses = data.listOfCourses.reduce((total, row) => total + row.cells.length, 0);

          return {
            docId: docSnap.id,
            universityId: data.universityId,
            universityName: data.universityName,
            universityLogo: data.universityLogo,
            totalCourses,
            updatedAt: formatTimestamp(data.updatedAt ?? data.createdAt ?? new Date()),
            raw: data,
          } satisfies PublishedPresetCard;
        });

        setPublishedPresets(records);
        setPublishedIds(new Set(records.map((record) => record.universityId)));
        setLoadingPublishedPresets(false);
      },
      (error) => {
        if (!isMounted) return;
        console.error("Failed to watch published presets", error);
        toast({
          title: "Unable to load published presets",
          description: "Please refresh to retry.",
          variant: "destructive",
        });
        setLoadingPublishedPresets(false);
      },
    );

    fetchUniversities().catch(() => undefined);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [toast]);

  const handleUniversityChange = (option: UniversityOption) => {
    setSelectedUniversity(option);
    resetBuilderState(option);
    setPublishedPreset(null);
    setDraftReloadToken((token) => token + 1);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUniversity) {
      event.target.value = "";
      return;
    }
    setLogoUploading(true);
    try {
      const url = await uploadUniversityLogo(file, selectedUniversity.id);
      setLogoUrl(url ?? "");
      toast({ title: "Logo uploaded", description: "Logo is attached to draft and publish." });
    } catch (error) {
      console.error("Logo upload failed", error);
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

  const triggerLogoUpload = () => {
    if (!canManage || !selectedUniversity) return;
    fileInputRef.current?.click();
  };

  const buildPresetContent = useCallback((): CoursePresetContent | null => {
    if (!selectedUniversity || !user?.uid) {
      toast({
        title: "Select a university",
        description: "Choose a university before saving or publishing.",
        variant: "destructive",
      });
      return null;
    }

    if (!universityId) {
      toast({ title: "Select a university.", variant: "destructive" });
      return null;
    }

    const sourceTopics = listOfCourses.length ? listOfCourses : createDefaultTopics();

    const sanitizedTopics = sourceTopics.map((topic) => ({
      ...topic,
      name: topic.name?.trim() || "",
      columns: topic.columns.map((column) => ({
        ...column,
        title: column.title?.trim() || "",
      })),
      rows: topic.rows.map((row) => ({
        ...row,
        title: row.title?.trim() || "",
        courses: row.courses.map((course) => ({
          ...course,
          name: course.name?.trim() || "",
          columnId: course.columnId || topic.columns[0]?.id || createRandomId(),
          id: course.id || createRandomId(),
        })),
      })),
    }));

    const sourceSemesters = coursePlan.semesters?.length ? coursePlan.semesters : createDefaultSemesters();

    const sanitizedSemesters = sourceSemesters.map((semester) => ({
      ...semester,
      name: semester.name?.trim() || "",
      courses: semester.courses.map((course) => ({
        ...course,
        title: course.title?.trim() || "",
        code: course.code?.trim() || "",
        creditHours: course.creditHours?.toString().trim() || "",
        note: course.note?.trim() || "",
        id: course.id || createRandomId(),
      })),
    }));

    const sanitizedProgramTitle = programTitle.trim() || defaultProgramTitle(selectedUniversity);

    return {
      universityId: universityId,
      universityName: selectedUniversity.name,
      programTitle: sanitizedProgramTitle,
      topics: sanitizedTopics,
      semesters: sanitizedSemesters,
      logoUrl: logoUrl || "",
      createdBy: user.uid,
    } satisfies CoursePresetContent;
  }, [coursePlan, listOfCourses, logoUrl, programTitle, selectedUniversity, toast, universityId, user?.uid]);

  const buildPublishedDocument = useCallback(
    (preset: CoursePresetContent): UniversityCourseDocument => {
      const grid: PublishedCourseRow[] = [];
      const seenCourseIds = new Set<string>();

      preset.topics.forEach((topic) => {
        topic.rows.forEach((row) => {
          const rowCells: PublishedCourseCell[] = [];
          topic.columns.forEach((column) => {
            const course = row.courses.find((c) => c.columnId === column.id);
            const title = course?.name?.trim() ?? "";
            if (!course || !title) {
              return;
            }
            const cell: PublishedCourseCell = {
              id: course.id,
              title,
              columnId: column.id,
              columnTitle: column.title || "Untitled column",
              rowId: row.id,
              rowTitle: row.title || "Untitled row",
              topicId: topic.id,
              topicTitle: topic.name || "Untitled topic",
            };
            rowCells.push(cell);
            seenCourseIds.add(cell.id);
          });
          if (rowCells.length > 0) {
            grid.push({
              rowId: row.id,
              rowTitle: row.title || "Untitled row",
              topicId: topic.id,
              topicTitle: topic.name || "Untitled topic",
              cells: rowCells,
            });
          }
        });
      });

      const planSemesters: PublishedCoursePlanSemester[] = preset.semesters
        .map((semester) => ({
          id: semester.id,
          name: semester.name || "Semester",
          courses: semester.courses
            .filter((course) => course.title)
            .map((course) => ({
              id: course.id,
              title: course.title,
              code: course.code || undefined,
              creditHours: course.creditHours || undefined,
              note: course.note || undefined,
            })),
        }))
        .filter((semester) => semester.courses.length > 0);

      if (grid.length === 0 || seenCourseIds.size === 0) {
        throw new Error("Add at least one course before publishing.");
      }

      if (planSemesters.length === 0) {
        throw new Error("Add at least one course to the semester plan before publishing.");
      }

      return {
        universityId: preset.universityId,
        universityName: preset.universityName,
        universityLogo: preset.logoUrl ?? "",
        listOfCourses: grid,
        coursePlan: {
          programTitle: preset.programTitle,
          semesters: planSemesters,
        },
      } satisfies UniversityCourseDocument;
    },
    [],
  );

  const handleSaveDraft = async () => {
    if (!canManage) return;
    if (!universityId) {
      toast({ title: "Select a university.", variant: "destructive" });
      return;
    }
    if (listOfCourses.length === 0) {
      toast({
        title: "Add at least one course",
        description: "Add at least one topic with courses before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!coursePlan.semesters?.length) {
      toast({
        title: "Course plan missing",
        description: "Create at least one semester before saving.",
        variant: "destructive",
      });
      return;
    }

    const preset = buildPresetContent();
    if (!preset || !user?.uid) return;

    setSavingDraft(true);
    try {
      await saveCourseDraft(user.uid, preset);
      setHasDraft(true);
      toast({ title: "Draft saved", description: "Draft stored under your admin workspace." });
    } catch (error) {
      console.error("Failed to save draft", error);
      toast({
        title: "Unable to save",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!canManage) return;
    if (!universityId) {
      toast({ title: "Select a university.", variant: "destructive" });
      return;
    }
    if (!listOfCourses.length) {
      toast({
        title: "Add at least one course.",
        variant: "destructive",
      });
      return;
    }
    if (!coursePlan.semesters?.length) {
      toast({
        title: "Course plan missing.",
        variant: "destructive",
      });
      return;
    }
    const preset = buildPresetContent();
    if (!preset || !user?.uid) return;

    setPublishing(true);
    try {
      const publishedDocument = buildPublishedDocument(preset);
      await publishCoursePreset(publishedDocument);
      toast({ title: "Published to students!", description: `${publishedDocument.universityName} preset is live.` });
      setPublishedPreset(publishedDocument);
    } catch (error) {
      console.error("Failed to publish preset", error);
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!canManage || !selectedUniversity || !hasDraft || !user?.uid) return;
    setDeletingDraft(true);
    try {
      await deleteCourseDraft(user.uid, selectedUniversity.id);
      resetBuilderState(selectedUniversity);
      toast({ title: "Draft deleted", description: "Draft removed from your workspace." });
    } catch (error) {
      console.error("Failed to delete draft", error);
      toast({
        title: "Unable to delete draft",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setDeletingDraft(false);
    }
  };

  const handleDeletePublished = async () => {
    if (!canManage || !selectedUniversity || !publishedPreset) return;
    setDeletingPublished(true);
    try {
      await deletePublishedCoursePreset(selectedUniversity.id);
      toast({ title: "Published preset removed", description: "Students will no longer see this preset." });
    } catch (error) {
      console.error("Failed to delete published preset", error);
      toast({
        title: "Unable to delete preset",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setDeletingPublished(false);
    }
  };

  const handleReloadDraft = () => {
    if (!selectedUniversity) return;
    setDraftReloadToken((token) => token + 1);
  };

  const publishedSummary = useMemo(() => {
    if (!publishedPreset) return null;
    const totalCourses = publishedPreset.listOfCourses.reduce((total, row) => total + row.cells.length, 0);
    const totalRows = publishedPreset.listOfCourses.length;
    const totalSemesters = publishedPreset.coursePlan.semesters.length;
    const updatedAt =
      typeof (publishedPreset as { updatedAt?: { toDate?: () => Date } }).updatedAt?.toDate === "function"
        ? publishedPreset.updatedAt!.toDate()
        : null;
    return {
      totalCourses,
      totalRows,
      totalSemesters,
      updatedAt,
    };
  }, [publishedPreset]);

  const isWorking = savingDraft || publishing || logoUploading || deletingDraft || deletingPublished;

  if (adminLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="max-w-md border-destructive/40 bg-destructive/10">
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>Sign in with an admin account to manage course presets.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-white/90 backdrop-blur-md dark:bg-slate-950/80">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Course Management</CardTitle>
              <CardDescription>
                Build university presets, save drafts under your admin workspace, and publish to the student portal.
              </CardDescription>
            </div>
            {publishedPreset ? (
              <Badge variant="outline" className="gap-2 text-xs">
                <ShieldCheck className="h-3.5 w-3.5" /> Published preset active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">No published preset</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Select university</p>
              <UniversitySelect
                value={selectedUniversity?.id}
                onChange={handleUniversityChange}
                placeholder={loadingUniversities ? "Loading universities..." : "Pick a university"}
                disabled={loadingUniversities || filteredUniversityOptions.length === 0}
                options={filteredUniversityOptions}
              />
              <p className="text-xs text-muted-foreground">
                Drafts are scoped to your admin account. Publishing overwrites the student-facing preset for this university.
              </p>
              {filteredUniversityOptions.length === 0 && !loadingUniversities ? (
                <p className="text-xs text-destructive">All universities are already published. Unpublish a preset to create a new one.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Program title</p>
              <Input
                value={programTitle}
                onChange={(event) => setProgramTitle(event.target.value)}
                placeholder="BSc in Computer Science & Engineering (CSE)"
                disabled={!selectedUniversity || loadingDraft}
              />
              <p className="text-xs text-muted-foreground">Displayed to students on the My Courses page.</p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={triggerLogoUpload}
              disabled={!selectedUniversity || logoUploading || isWorking}
            >
              {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {logoUploading ? "Uploading..." : "Upload logo"}
            </Button>
            {logoUrl ? (
              <Button variant="ghost" size="sm" onClick={() => setLogoUrl("")} disabled={isWorking}>
                Remove logo
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" /> No logo selected
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleReloadDraft}
              disabled={!selectedUniversity || loadingDraft}
            >
              {loadingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Reload draft
            </Button>
          </div>

          {logoUrl && (
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border/60 bg-white/70 px-4 py-3 shadow-sm dark:bg-slate-950/60">
              <img src={logoUrl} alt="University logo" className="h-14 w-14 rounded-xl bg-white object-contain" />
              <div className="flex flex-col text-left">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Logo preview</span>
                <span className="text-sm text-foreground">Attached to current draft</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUniversity ? (
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="list">List of Courses</TabsTrigger>
            <TabsTrigger value="plan">Course Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card className="border-border/60 bg-white/90 dark:bg-slate-950/75">
              <CardHeader>
                <CardTitle>Dynamic Grid Builder</CardTitle>
                <CardDescription>Draft topics, rows, and columns. Drag headers or row handles to reorder.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDraft ? (
                  <LoadingState />
                ) : (
                  <CourseListBuilder
                    topics={listOfCourses.length ? listOfCourses : createDefaultTopics()}
                    onChange={setListOfCourses}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan">
            <Card className="border-border/60 bg-white/90 dark:bg-slate-950/75">
              <CardHeader>
                <CardTitle>Course Plan</CardTitle>
                <CardDescription>Mirror the semester layout shown on university sites. Add credits & notes.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDraft ? (
                  <LoadingState />
                ) : (
                  <CoursePlanBuilder
                    semesters={coursePlan.semesters?.length ? coursePlan.semesters : createDefaultSemesters()}
                    onChange={(semesters) => setCoursePlan({ semesters })}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-dashed border-border/60 bg-muted/20">
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a university to begin drafting course presets.
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-white/90 dark:bg-slate-950/80">
        <CardContent className="flex flex-wrap items-center gap-3 border-b border-border/50 pb-4">
          <Button onClick={handleSaveDraft} disabled={!selectedUniversity || isWorking || loadingDraft}>
            {savingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Draft
          </Button>
          <Button variant="secondary" onClick={handlePublish} disabled={!selectedUniversity || isWorking || loadingDraft} className="gap-2">
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish to students
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteDraft}
            disabled={!selectedUniversity || !hasDraft || deletingDraft || loadingDraft}
            className="gap-2 text-destructive"
          >
            {deletingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete draft
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeletePublished}
            disabled={!selectedUniversity || !publishedPreset || deletingPublished}
            className="gap-2 text-destructive"
          >
            {deletingPublished ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete published preset
          </Button>
        </CardContent>
        <CardContent className="space-y-3 pt-4">
          <div className="grid gap-2 md:grid-cols-2">
            <StatusTile
              title="Draft status"
              value={hasDraft ? "Draft saved" : "No draft"}
              description={hasDraft ? "Stored under your admin account." : "Save your work-in-progress as a draft."}
            />
            <StatusTile
              title="Published preset"
              value={publishedPreset ? "Live" : "Not published"}
              description={
                publishedPreset
                  ? `Updated ${publishedSummary?.updatedAt ? publishedSummary.updatedAt.toLocaleString() : "recently"}`
                  : "Publish to make the preset visible to students."
              }
            />
          </div>
          {publishedSummary ? (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>
                {publishedSummary.totalCourses} courses · {publishedSummary.totalRows} rows · {publishedSummary.totalSemesters} semesters. Latest
                sync {publishedSummary.updatedAt ? publishedSummary.updatedAt.toLocaleString() : "in progress"}.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <PublishedPresetsSection
        loading={loadingPublishedPresets}
        presets={publishedPresets}
        onView={(preset) => {
          setViewingPreset(preset);
          setSelectedUniversity({ id: preset.universityId, name: preset.universityName, category: "public" });
          setPublishedPreset(preset.raw);
          setProgramTitle(preset.raw.coursePlan.programTitle);
          setLogoUrl(preset.raw.universityLogo ?? "");
        }}
        onEdit={(preset) => {
          setViewingPreset(null);
          handleUniversityChange({ id: preset.universityId, name: preset.universityName, category: "public" });
        }}
        onDelete={(preset) => {
          setSelectedUniversity({ id: preset.universityId, name: preset.universityName, category: "public" });
          handleDeletePublished().catch(() => undefined);
        }}
        onRepublish={(preset) => {
          setSelectedUniversity({ id: preset.universityId, name: preset.universityName, category: "public" });
          handlePublish().catch(() => undefined);
        }}
      />

      <PublishedPresetDialog preset={viewingPreset} onOpenChange={setViewingPreset} />
    </div>
  );
}

const LoadingState = () => (
  <div className="flex h-40 items-center justify-center text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
  </div>
);

const StatusTile = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) => (
  <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-950/60">
    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
    <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const PublishedPresetsSection = ({
  loading,
  presets,
  onView,
  onEdit,
  onDelete,
  onRepublish,
}: {
  loading: boolean;
  presets: PublishedPresetCard[];
  onView: (preset: PublishedPresetCard) => void;
  onEdit: (preset: PublishedPresetCard) => void;
  onDelete: (preset: PublishedPresetCard) => void;
  onRepublish: (preset: PublishedPresetCard) => void;
}) => (
  <Card className="border-border/60 bg-white/90 dark:bg-slate-950/80">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Published University Course Presets</CardTitle>
          <CardDescription>View and manage university presets already live for students.</CardDescription>
        </div>
        <Badge variant="outline" className="text-xs">
          {loading ? "Loading..." : `${presets.length} preset${presets.length === 1 ? "" : "s"}`}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : presets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
          No universities have been published yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {presets.map((preset) => (
            <Card key={preset.docId} className="border-border/70 bg-background/95">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  {preset.universityLogo ? (
                    <img src={preset.universityLogo} alt="University logo" className="h-12 w-12 rounded-xl border border-border/60 object-contain" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{preset.universityName}</p>
                    <p className="text-xs text-muted-foreground">Updated {preset.updatedAt}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{preset.totalCourses} courses in published grid</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => onView(preset)}>
                    <Eye className="h-4 w-4" /> View
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => onEdit(preset)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => onDelete(preset)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => onRepublish(preset)}>
                    <RotateCcw className="h-4 w-4" /> Publish again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const PublishedPresetDialog = ({
  preset,
  onOpenChange,
}: {
  preset: PublishedPresetCard | null;
  onOpenChange: (preset: PublishedPresetCard | null) => void;
}) => (
  <Dialog open={Boolean(preset)} onOpenChange={(open) => !open && onOpenChange(null)}>
    <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
      {preset ? (
        <>
          <DialogHeader className="border-b border-border/60 px-6 py-4">
            <DialogTitle className="text-xl">{preset.universityName}</DialogTitle>
            <CardDescription>Preview of the published preset. Switch to Edit for making changes.</CardDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 p-6">
              <div className="flex flex-wrap items-center gap-4">
                {preset.universityLogo ? (
                  <img src={preset.universityLogo} alt="University logo" className="h-20 w-20 rounded-2xl border border-border/60 object-contain" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-border/60 text-muted-foreground">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{preset.universityName}</p>
                  <p className="text-xs text-muted-foreground">Updated {preset.updatedAt}</p>
                  <p className="text-xs text-muted-foreground">{preset.totalCourses} courses published</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Course Plan</h3>
                {preset.raw.coursePlan.semesters.map((semester) => (
                  <Card key={semester.id} className="border-border/60 bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-base">{semester.name}</CardTitle>
                      <CardDescription>{semester.courses.length} courses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {semester.courses.map((course) => (
                        <div key={course.id} className="rounded-xl border border-border/50 bg-background/70 p-3 text-sm">
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {[course.code, course.creditHours ? `${course.creditHours} credits` : null].filter(Boolean).join(" · ") || "Required"}
                          </p>
                          {course.note && <p className="text-xs text-muted-foreground">{course.note}</p>}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </>
      ) : null}
    </DialogContent>
  </Dialog>
);
