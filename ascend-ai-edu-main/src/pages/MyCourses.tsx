import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";
import { Loader2, GraduationCap, LayoutGrid, BookOpenCheck, Sparkles, CheckCircle2, BookMarked, Clock3 } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuth } from "@/components/auth-provider";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { UniversitySelect, type UniversityOption, universityOptions } from "@/components/university/UniversitySelect";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  type PublishedCourseGrid,
  type PublishedCourseRow,
  type UniversityCourseDocument,
  type StudentCourseCompletion,
  listenToPublishedCoursePreset,
  listenToStudentCourseCompletions,
  setStudentCourseCompletion,
  slugifyUniversityId,
} from "@/utils/courseBuilder";

type ChecklistItem = {
  docId: string;
  courseId: string;
  presetId: string;
  source: "admin";
  title: string;
  context?: string;
};

const formatTimestamp = (value: unknown): string | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toLocaleString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
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

  return null;
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-3xl border border-dashed border-border/60 bg-muted/30 p-8 text-center text-muted-foreground">
    {message}
  </div>
);

const LoadingState = () => (
  <div className="flex h-40 items-center justify-center text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
  </div>
);

type UniversityChoice = {
  id: string;
  name: string;
};

const buildGridChecklist = (presetId: string, grid: PublishedCourseGrid): ChecklistItem[] => {
  const items: ChecklistItem[] = [];
  grid.forEach((row) => {
    row.cells.forEach((course) => {
      const docId = `admin-${presetId}-${course.id}`;
      items.push({
        docId,
        courseId: course.id,
        presetId,
        source: "admin",
        title: course.title.trim(),
        context: `${course.topicTitle} · ${course.rowTitle} · ${course.columnTitle}`,
      });
    });
  });
  return items;
};

const buildPlanChecklist = (
  presetId: string,
  semesters: UniversityCourseDocument["coursePlan"]["semesters"],
): ChecklistItem[] => {
  const items: ChecklistItem[] = [];
  semesters.forEach((semester) => {
    semester.courses.forEach((course) => {
      if (!course.title.trim()) return;
      const docId = `admin-${presetId}-${course.id}`;
      items.push({
        docId,
        courseId: course.id,
        presetId,
        source: "admin",
        title: course.title.trim(),
        context: `${semester.name}${course.code ? ` · ${course.code}` : ""}`,
      });
    });
  });
  return items;
};

const computeProgress = (items: ChecklistItem[], completions: Record<string, StudentCourseCompletion>) => {
  if (items.length === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = items.filter((item) => completions[item.docId]?.completed).length;
  const percent = Math.round((completed / items.length) * 100);
  return { completed, total: items.length, percent };
};

type TopicGroup = {
  topicId: string;
  topicTitle: string;
  columns: { columnId: string; columnTitle: string }[];
  rows: {
    rowId: string;
    rowTitle: string;
    cells: Record<string, PublishedCourseRow["cells"][number]>;
  }[];
};

const groupPublishedGrid = (grid: PublishedCourseGrid): TopicGroup[] => {
  const topics = new Map<
    string,
    {
      topicId: string;
      topicTitle: string;
      columnOrder: string[];
      columns: Record<string, { columnId: string; columnTitle: string }>;
      rowOrder: string[];
      rows: Map<
        string,
        {
          rowId: string;
          rowTitle: string;
          cells: Record<string, PublishedCourseRow["cells"][number]>;
        }
      >;
    }
  >();

  grid.forEach((row) => {
    if (!row || !Array.isArray(row.cells)) return;
    row.cells.forEach((cell) => {
      if (!cell || typeof cell !== "object") return;
      if (!cell.id || !cell.columnId) return;
      if (!cell.title) return;
      const topicId = cell.topicId ?? "topic";
      const topicTitle = cell.topicTitle || "Topic";

      let topic = topics.get(topicId);
      if (!topic) {
        topic = {
          topicId,
          topicTitle,
          columnOrder: [],
          columns: {},
          rowOrder: [],
          rows: new Map(),
        };
        topics.set(topicId, topic);
      }

      if (!topic.columnOrder.includes(cell.columnId)) {
        topic.columnOrder.push(cell.columnId);
        topic.columns[cell.columnId] = {
          columnId: cell.columnId,
          columnTitle: cell.columnTitle || "Column",
        };
      }

      const rowId = cell.rowId ?? `row-${cell.id}`;
      let rowEntry = topic.rows.get(rowId);
      if (!rowEntry) {
        rowEntry = {
          rowId,
          rowTitle: cell.rowTitle || "Row",
          cells: {},
        };
        topic.rows.set(rowId, rowEntry);
        topic.rowOrder.push(rowId);
      }

      rowEntry.cells[cell.columnId] = cell;
    });
  });

  return Array.from(topics.values()).map((topic) => ({
    topicId: topic.topicId,
    topicTitle: topic.topicTitle,
    columns: topic.columnOrder.map((columnId) => topic.columns[columnId]),
    rows: topic.rowOrder.map((rowId) => topic.rows.get(rowId)!),
  }));
};

const normalizePublishedPreset = (preset: UniversityCourseDocument | null): UniversityCourseDocument | null => {
  if (!preset) return null;

  const listOfCourses: PublishedCourseGrid = Array.isArray(preset.listOfCourses)
    ? preset.listOfCourses
        .filter((row): row is PublishedCourseRow => Boolean(row && Array.isArray((row as PublishedCourseRow).cells)))
        .map((row, index) => ({
          rowId: row.rowId || `row-${index}`,
          rowTitle: row.rowTitle || "Row",
          topicId: row.topicId || "topic",
          topicTitle: row.topicTitle || "Topic",
          cells: Array.isArray(row.cells)
            ? row.cells
                .filter((cell): cell is PublishedCourseRow["cells"][number] => Boolean(cell && typeof cell === "object" && cell.id && cell.title))
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
            : [],
        }))
        .filter((row) => row.cells.length > 0)
    : [];

  const semesters = Array.isArray(preset.coursePlan?.semesters)
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
    : [];

  return {
    universityId: preset.universityId,
    universityName: preset.universityName || "University",
    universityLogo: preset.universityLogo || "",
    listOfCourses,
    coursePlan: {
      programTitle: preset.coursePlan?.programTitle || preset.universityName || "Program",
      semesters,
    },
    createdAt: preset.createdAt ?? null,
    updatedAt: preset.updatedAt ?? null,
  } satisfies UniversityCourseDocument;
};

export default function MyCoursesPage() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useStudentProfile(user?.uid ?? null);
  const { toast } = useToast();

  const [publishedPreset, setPublishedPreset] = useState<UniversityCourseDocument | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityChoice | null>(null);
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [publishedCatalogue, setPublishedCatalogue] = useState<Record<string, { data: UniversityCourseDocument; updatedAt: string }>>({});
  const [publishedSelection, setPublishedSelection] = useState<string>("");
  const [completions, setCompletions] = useState<Record<string, StudentCourseCompletion>>({});
  const [isLoadingPublished, setIsLoadingPublished] = useState(false);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");

  const baseUniversities = useMemo<UniversityOption[]>(() => (universities.length ? universities : universityOptions), [universities]);

  const publishedOptions = useMemo(
    () =>
      Object.entries(publishedCatalogue).map(([id, entry]) => ({
        id,
        name: entry.data.universityName,
        updatedAt: entry.updatedAt,
      })),
    [publishedCatalogue],
  );

  const derivedUniversity = useMemo(() => {
    if (selectedUniversity) {
      return selectedUniversity;
    }
    if (publishedSelection && publishedCatalogue[publishedSelection]) {
      const entry = publishedCatalogue[publishedSelection];
      return { id: publishedSelection, name: entry.data.universityName } satisfies UniversityChoice;
    }
    if (!profile?.university) return null;
    const slug = slugifyUniversityId(profile.university);
    const option = baseUniversities.find((university) => university.id === slug);
    if (option) return { id: option.id, name: option.name } satisfies UniversityChoice;
    return { id: slug, name: profile.university } satisfies UniversityChoice;
  }, [baseUniversities, profile?.university, publishedCatalogue, publishedSelection, selectedUniversity]);

  const selectedPublishedEntry = publishedSelection ? publishedCatalogue[publishedSelection] ?? null : null;

  useEffect(() => {
    let isMounted = true;

    const fetchUniversities = async () => {
      try {
        const snap = await getDocs(collection(db, "universities"));
        if (!isMounted) return;
        const options = snap.docs
          .map((docSnap) => docSnap.data() as { id: string; name: string; category?: UniversityOption["category"] })
          .filter((doc) => doc?.id && doc?.name)
          .map((doc) => ({ id: doc.id, name: doc.name, category: doc.category ?? "public" }));
        setUniversities(options);
      } catch (error) {
        console.error("Failed to load universities", error);
        toast({ title: "Unable to load universities", description: "Using built-in list instead." });
        setUniversities([]);
      } finally {
        if (isMounted) {
          setLoadingUniversities(false);
        }
      }
    };

    fetchUniversities().catch(() => undefined);

    const unsubscribe = onSnapshot(
      query(collection(db, "universityCourses"), orderBy("updatedAt", "desc")),
      (snapshot) => {
        if (!isMounted) return;
        const catalogue: Record<string, { data: UniversityCourseDocument; updatedAt: string }> = {};
        snapshot.docs.forEach((docSnap) => {
          const normalized = normalizePublishedPreset(docSnap.data() as UniversityCourseDocument);
          if (!normalized) return;
          catalogue[docSnap.id] = {
            data: normalized,
            updatedAt: formatTimestamp(normalized.updatedAt ?? normalized.createdAt ?? new Date()) ?? "Unknown",
          };
        });
        setPublishedCatalogue(catalogue);
      },
      (error) => {
        if (!isMounted) return;
        console.error("Failed to load published presets", error);
        toast({
          title: "Unable to load published presets",
          description: "Showing cached presets if available.",
          variant: "destructive",
        });
      },
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    if (publishedSelection && !publishedCatalogue[publishedSelection]) {
      setPublishedSelection("");
    }
  }, [publishedCatalogue, publishedSelection]);

  useEffect(() => {
    if (!publishedSelection && derivedUniversity && publishedCatalogue[derivedUniversity.id]) {
      setPublishedSelection(derivedUniversity.id);
    }
  }, [derivedUniversity, publishedCatalogue, publishedSelection]);

  useEffect(() => {
    if (!derivedUniversity) {
      setPublishedPreset(null);
      return;
    }
    setIsLoadingPublished(true);
    const unsubscribe = listenToPublishedCoursePreset(
      derivedUniversity.id,
      (preset) => {
        setPublishedPreset(normalizePublishedPreset(preset));
        setIsLoadingPublished(false);
      },
      (error) => {
        console.error("Failed to listen to published preset", error);
        toast({
          title: "Unable to load courses",
          description: "Please try again later.",
          variant: "destructive",
        });
        setIsLoadingPublished(false);
      },
    );
    return () => unsubscribe();
  }, [derivedUniversity?.id, toast]);

  useEffect(() => {
    if (!user?.uid) {
      setCompletions({});
      return;
    }
    if (isLoadingPublished) {
      return;
    }
    setIsLoadingCompletions(true);
    const unsubscribe = listenToStudentCourseCompletions(
      user.uid,
      (map) => {
        const sanitized: Record<string, StudentCourseCompletion> = {};
        Object.entries(map).forEach(([docId, value]) => {
          if (!value || typeof value !== "object") return;
          if (!value.courseId) return;
          sanitized[docId] = {
            courseId: value.courseId,
            completed: Boolean(value.completed),
            completedAt: value.completedAt,
          } satisfies StudentCourseCompletion;
        });
        setCompletions(sanitized);
        setIsLoadingCompletions(false);
      },
      (error) => {
        console.error("Failed to listen to completions", error);
        setIsLoadingCompletions(false);
      },
    );
    return () => unsubscribe();
  }, [isLoadingPublished, user?.uid]);

  const heroTitle = publishedPreset?.coursePlan.programTitle || publishedPreset?.universityName || "My Courses";
  const heroLogo = publishedPreset?.universityLogo || null;
  const lastUpdated = formatTimestamp(publishedPreset?.updatedAt);
  const heroDescription = publishedPreset
    ? `Viewing published structure for ${publishedPreset.universityName}. Updates arrive once your university admin publishes.`
    : derivedUniversity
      ? `No published preset is live for ${derivedUniversity.name} yet. Ask your university admin to publish one.`
      : "Select a university to view the published course structure.";

  const adminChecklistItems = useMemo(() => {
    if (!publishedPreset) return [] as ChecklistItem[];
    const fromGrid = buildGridChecklist(publishedPreset.universityId, publishedPreset.listOfCourses ?? []);
    const fromPlan = buildPlanChecklist(publishedPreset.universityId, publishedPreset.coursePlan.semesters ?? []);
    const dedupeMap = new Map<string, ChecklistItem>();
    [...fromGrid, ...fromPlan].forEach((item) => {
      if (!dedupeMap.has(item.docId)) {
        dedupeMap.set(item.docId, item);
      }
    });
    return Array.from(dedupeMap.values());
  }, [publishedPreset]);

  const handleToggleCompletion = async (item: ChecklistItem, completed: boolean) => {
    if (!user?.uid) return;
    setCompletions((prev) => {
      const next = { ...prev };
      if (completed) {
        next[item.docId] = {
          courseId: item.courseId,
          completed: true,
        } satisfies StudentCourseCompletion;
      } else {
        delete next[item.docId];
      }
      return next;
    });
    try {
      await setStudentCourseCompletion(user.uid, item.docId, completed);
    } catch (error) {
      console.error("Failed to toggle completion", error);
      setCompletions((prev) => {
        const rollback = { ...prev };
        if (completed) {
          delete rollback[item.docId];
        } else {
          rollback[item.docId] = {
            courseId: item.courseId,
            completed: true,
          } satisfies StudentCourseCompletion;
        }
        return rollback;
      });
      toast({
        title: "Unable to update",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const adminProgress = computeProgress(adminChecklistItems, completions);

  const totalPublishedCourses = useMemo(() => {
    if (!publishedPreset) return 0;
    return publishedPreset.listOfCourses?.reduce((count, row) => count + row.cells.length, 0) ?? 0;
  }, [publishedPreset]);

  const totalSemesters = useMemo(() => publishedPreset?.coursePlan.semesters?.length ?? 0, [publishedPreset]);

  const quickStats = useMemo<{ label: string; value: string; hint?: string; icon: LucideIcon }[]>(() => {
    const hasPreset = Boolean(publishedPreset);
    const selectionHint = selectedUniversity
      ? "Waiting for the latest publish from this university"
      : "Select a university to load live stats";
    const coursesValue = hasPreset ? totalPublishedCourses.toString() : "0";
    const coursesHint = hasPreset && totalSemesters
      ? `${Math.round(totalPublishedCourses / Math.max(totalSemesters, 1))} per semester on average`
      : selectionHint;
    const completionTarget = hasPreset ? adminProgress.total || totalPublishedCourses : 0;
    const completionValue = hasPreset ? `${adminProgress.completed}/${completionTarget || 0}` : "0/0";
    const completionHint = hasPreset ? `${adminProgress.percent}% complete` : selectionHint;
    const semesterValue = hasPreset ? totalSemesters.toString() : "0";
    const semesterHint = hasPreset && totalSemesters > 0 && publishedPreset?.coursePlan.semesters?.[0]?.name
      ? `Starting with ${publishedPreset.coursePlan.semesters[0].name}`
      : selectionHint;

    return [
      {
        label: "Total courses",
        value: coursesValue,
        hint: coursesHint,
        icon: BookMarked,
      },
      {
        label: "Completed",
        value: completionValue,
        hint: completionHint,
        icon: CheckCircle2,
      },
      {
        label: "Semesters",
        value: semesterValue,
        hint: semesterHint,
        icon: Clock3,
      },
    ];
  }, [adminProgress.completed, adminProgress.percent, adminProgress.total, publishedPreset, selectedUniversity, totalPublishedCourses, totalSemesters]);

  const livePresetTiles = useMemo<{ label: string; value: string }[]>(() => {
    const hasPreset = Boolean(publishedPreset);
    const hasSelection = Boolean(selectedUniversity);

    return [
      {
        label: "University",
        value: hasPreset
          ? publishedPreset!.universityName
          : hasSelection
            ? selectedUniversity!.name
            : "—",
      },
      {
        label: "Program title",
        value: hasPreset
          ? publishedPreset!.coursePlan.programTitle || "Untitled program"
          : hasSelection
            ? "Awaiting publish"
            : "—",
      },
      {
        label: "Total courses",
        value: hasPreset ? `${totalPublishedCourses} published` : "0 published",
      },
    ];
  }, [publishedPreset, selectedUniversity, totalPublishedCourses]);

  const livePresetDescription = useMemo(() => {
    if (publishedPreset) {
      return "This snapshot is read-only for students and reflects the latest publish from your university.";
    }
    if (derivedUniversity) {
      return "No published preset is live for this university yet. Ask your university admin to publish one.";
    }
    return "Select a university to preview its published roadmap once available.";
  }, [derivedUniversity, publishedPreset]);

  const handleUniversitySelect = useCallback(
    (option: UniversityOption) => {
      const choice: UniversityChoice = { id: option.id, name: option.name };
      setSelectedUniversity(choice);
      if (publishedCatalogue[option.id]) {
        setPublishedSelection(option.id);
      } else {
        setPublishedSelection("");
      }
    },
    [publishedCatalogue],
  );

  const clearSelections = useCallback(() => {
    setSelectedUniversity(null);
    setPublishedSelection("");
    setPublishedPreset(null);
    // Reset the published catalogue to force a refresh
    setPublishedCatalogue({});
  }, []);

  const handlePublishedSelect = useCallback(
    (value: string) => {
      if (value === "__clear") {
        clearSelections();
        return;
      }
      setPublishedSelection(value);
      const entry = publishedCatalogue[value];
      if (entry) {
        setSelectedUniversity({ id: value, name: entry.data.universityName });
      }
    },
    [clearSelections, publishedCatalogue],
  );

  if (profileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border border-border/40 bg-white/95 shadow-lg shadow-primary/5 dark:bg-slate-950/85">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.06),transparent_50%)]" />
          <div className="absolute -top-16 -right-8 h-48 w-48 animate-[spin_18s_linear_infinite] rounded-full border border-primary/15" />
          <div className="absolute -bottom-28 -left-10 h-56 w-56 animate-[spin_24s_linear_reverse_infinite] rounded-full border border-secondary/15" />
        </div>
        <CardHeader className="relative z-10 space-y-0.5 pb-2">
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">New</span>
            Course Journey Hub
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Preview your curated roadmap, understand live stats, and then fine-tune the university you want to explore next.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-8 pb-8">
          <section className="space-y-5">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-5 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_70%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_60%)]" aria-hidden="true" />
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-500/20 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />
              <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[auto,1fr,auto] lg:items-center">
                {/* Lottie Animation - Left */}
                <div className="flex items-center justify-center lg:mr-4">
                  <div className="h-32 w-32 transition-all duration-500 group-hover:scale-105 md:h-36 md:w-36">
                    <DotLottieReact
                      src="https://lottie.host/203a8136-44dd-4c1f-9be0-b0b2bcab8cd1/mytm2DgzYK.lottie"
                      loop
                      autoplay
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </div>

                {/* Text Content - Middle */}
                <div className="flex flex-col justify-center space-y-1.5 text-center lg:ml-4 lg:text-left">
                  <div className="flex justify-center lg:justify-start">
                    <Badge className="w-fit gap-1.5 rounded-full border-0 bg-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white shadow-md backdrop-blur-sm hover:bg-white/30">
                      <BookOpenCheck className="h-3.5 w-3.5" /> Course plan overview
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground lg:justify-start">
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/90">University curated journey</p>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">{heroTitle}</h1>
                  <p className="mx-auto max-w-xl text-sm text-white/90 lg:mx-0">{heroDescription}</p>
                  {selectedPublishedEntry ? (
                    <p className="text-xs text-white/80">🔄 Last published update: {selectedPublishedEntry.updatedAt}</p>
                  ) : lastUpdated ? (
                    <p className="text-xs text-white/80">🔄 Last sync: {lastUpdated}</p>
                  ) : derivedUniversity ? (
                    <p className="text-xs text-white/80">⏳ Waiting for the latest publish from this university.</p>
                  ) : null}
                </div>

                {/* University Logo - Right */}
                <div className="mt-4 flex items-center justify-center lg:ml-8 lg:mt-0 lg:justify-end">
                  {heroLogo ? (
                    <div className="relative">
                      <div className="h-24 w-24 rounded-xl border-2 border-white/80 bg-white p-1.5 shadow-lg ring-2 ring-primary/20 transition-all duration-300 hover:scale-105 hover:ring-primary/40">
                        <img
                          src={heroLogo}
                          alt="University logo"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-white/60 bg-white/80 p-1.5 text-muted-foreground shadow-lg transition-all duration-300 hover:scale-105">
                      <GraduationCap className="h-10 w-10" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Live preset details</p>
                  <p className="text-xs text-muted-foreground">{livePresetDescription}</p>
                </div>
                <Badge variant="secondary" className="gap-2 rounded-full bg-primary/10 text-primary">
                  {derivedUniversity && (isLoadingPublished || isLoadingCompletions) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : null}
                  {derivedUniversity
                    ? isLoadingPublished || isLoadingCompletions
                      ? "Syncing live…"
                      : "Live updates enabled"
                    : "Awaiting university selection"}
                </Badge>
              </div>
              <div className="grid gap-4 text-sm md:grid-cols-3">
                {livePresetTiles.map(({ label, value }) => (
                  <SummaryTile key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          </section>

          <Separator className="bg-border/70" />

          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">All universities</p>
                <UniversitySelect
                  value={selectedUniversity?.id ?? ""}
                  onChange={handleUniversitySelect}
                  placeholder={loadingUniversities ? "Loading universities..." : "Search by university"}
                  disabled={loadingUniversities || baseUniversities.length === 0}
                  options={baseUniversities}
                />
                <p className="text-xs text-muted-foreground">
                  Filter by category (All / Public / Private) or search by name. Selecting here auto-loads matching drafts when published copies exist.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Already published presets</p>
                <Select value={publishedSelection || undefined} onValueChange={handlePublishedSelect}>
                  <SelectTrigger className="w-full rounded-xl border border-border/60 bg-background text-left text-sm">
                    <SelectValue placeholder={publishedOptions.length ? "Choose a published university" : "No universities published yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {publishedOptions.length ? (
                      publishedOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex flex-col text-sm">
                            <span className="font-medium text-foreground">{option.name}</span>
                            <span className="text-xs text-muted-foreground">Updated {option.updatedAt}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No published presets available.</div>
                    )}
                    {publishedOptions.length ? (
                      <SelectItem value="__clear" className="text-destructive">
                        Clear selection
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Published presets sync live from the admin console. Choosing one focuses the Course Plan tab below.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  clearSelections();
                  // Reset the form to initial state
                  setSearch("");
                  setFilter("all");
                }} 
                disabled={!selectedUniversity && !publishedSelection}
                className="hover:bg-accent/50"
              >
                Reset selection
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>

      <Tabs defaultValue="plan" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="plan">Course Plan</TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickStats.map(({ label, value, hint, icon: Icon }) => (
              <div
                key={label}
                className={`group flex items-start gap-3 overflow-hidden rounded-2xl border border-border/50 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-lg ${
                  label === 'Total courses' 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-blue-200/50' 
                    : label === 'Completed' 
                      ? 'bg-gradient-to-br from-green-50 to-green-100 hover:shadow-green-200/50' 
                      : 'bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-purple-200/50'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  label === 'Total courses' 
                    ? 'bg-blue-100 text-blue-600' 
                    : label === 'Completed' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-purple-100 text-purple-600'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold text-foreground">{value}</p>
                  {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
                </div>
              </div>
            ))}
          </div>

          {derivedUniversity ? (
            publishedPreset ? (
              <>
                <Tabs defaultValue="grid" className="space-y-4">
                  <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="grid">Course grid</TabsTrigger>
                    <TabsTrigger value="timeline">Semester timeline</TabsTrigger>
                  </TabsList>
                  <TabsContent value="grid">
                    {isLoadingPublished ? (
                      <LoadingState />
                    ) : (
                      <AdminCourseGrid
                        preset={publishedPreset}
                        completions={completions}
                        onToggle={handleToggleCompletion}
                        checklistItems={adminChecklistItems}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="timeline">
                    {isLoadingPublished ? (
                      <LoadingState />
                    ) : (
                      <AdminCoursePlan
                        preset={publishedPreset}
                        completions={completions}
                        onToggle={handleToggleCompletion}
                        checklistItems={adminChecklistItems}
                      />
                    )}
                  </TabsContent>
                </Tabs>

                <CompletionSummaryCard title="Admin preset" progress={adminProgress} />
              </>
            ) : (
              <EmptyState message="No published preset is live for this university yet. Ask your university admin to publish one." />
            )
          ) : (
            <EmptyState message="Select a university above to load the published plan. Once chosen, the official grid and semester timeline will appear here." />
          )}
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <div className="rounded-3xl border border-border/60 bg-muted/30 p-5 text-sm text-muted-foreground">
        <p>➤ If you want your university course plan to be updated, please contact: abir2afridi@gmail.com</p>
      </div>
    </div>
  );
}

const AdminCourseGrid = ({
  preset,
  completions,
  onToggle,
  checklistItems,
}: {
  preset: UniversityCourseDocument;
  completions: Record<string, StudentCourseCompletion>;
  onToggle: (item: ChecklistItem, completed: boolean) => void;
  checklistItems: ChecklistItem[];
}) => {
  const itemMap = useMemo(() => new Map(checklistItems.map((item) => [item.docId, item] as const)), [checklistItems]);
  const groupedTopics = useMemo(() => groupPublishedGrid(preset.listOfCourses ?? []), [preset.listOfCourses]);

  if (groupedTopics.length === 0) {
    return <EmptyState message="No published course grid yet. Check back after your university publishes." />;
  }

  return (
    <div className="space-y-6">
      {groupedTopics.map((topic) => (
        <Card key={topic.topicId} className="border-border/60 bg-white/90 dark:bg-slate-950/70">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{topic.topicTitle}</CardTitle>
              <CardDescription>
                {topic.rows.length} rows · {topic.columns.length} columns
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1 text-xs">
              <LayoutGrid className="h-3.5 w-3.5" /> Structured grid
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-56 rounded-l-2xl bg-muted/40 p-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Row
                    </th>
                    {topic.columns.map((column) => (
                      <th
                        key={column.columnId}
                        className="min-w-[11rem] bg-muted/40 p-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                      >
                        {column.columnTitle}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topic.rows.map((row) => (
                    <tr key={row.rowId} className="border-b border-border/40 last:border-0">
                      <td className="bg-muted/10 p-3 font-medium text-muted-foreground">{row.rowTitle}</td>
                      {topic.columns.map((column) => {
                        const course = row.cells[column.columnId];
                        if (!course) {
                          return <td key={`${row.rowId}-${column.columnId}`} className="p-3 text-sm text-muted-foreground">—</td>;
                        }
                        const docId = `admin-${preset.universityId}-${course.id}`;
                        const completed = completions[docId]?.completed ?? false;
                        const item = itemMap.get(docId);
                        return (
                          <td key={`${row.rowId}-${column.columnId}`} className="p-3">
                            <label className="flex items-start gap-2">
                              <Checkbox
                                checked={completed}
                                onCheckedChange={(value) => item && onToggle(item, Boolean(value))}
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground">{course.title}</p>
                                <p className="text-xs text-muted-foreground">{column.columnTitle}</p>
                              </div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const AdminCoursePlan = ({
  preset,
  completions,
  onToggle,
  checklistItems,
}: {
  preset: UniversityCourseDocument;
  completions: Record<string, StudentCourseCompletion>;
  onToggle: (item: ChecklistItem, completed: boolean) => void;
  checklistItems: ChecklistItem[];
}) => {
  const itemMap = useMemo(() => new Map(checklistItems.map((item) => [item.docId, item] as const)), [checklistItems]);
  const semesters = preset.coursePlan.semesters ?? [];

  if (semesters.length === 0) {
    return <EmptyState message="No published semester plan yet." />;
  }

  return (
    <div className="space-y-4">
      {semesters.map((semester) => (
        <Card key={semester.id} className="border-border/60 bg-white/90 dark:bg-slate-950/75">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>{semester.name || "Semester"}</CardTitle>
              <CardDescription>{semester.courses.length} courses</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 text-xs">
              <GraduationCap className="h-3.5 w-3.5" /> Semester
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {semester.courses.map((course) => {
              const courseTitle = (course.title ?? "").toString().trim();
              if (!courseTitle) return null;
              const docId = `admin-${preset.universityId}-${course.id}`;
              const completed = completions[docId]?.completed ?? false;
              const item = itemMap.get(docId);
              return (
                <div key={course.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border/50 bg-muted/10 p-4">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">{courseTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {[course.code, course.creditHours ? `${course.creditHours} credits` : null]
                        .filter(Boolean)
                        .join(" · ") || "Required"}
                    </p>
                    {course.note ? <p className="text-xs text-muted-foreground">{course.note}</p> : null}
                  </div>
                  <Checkbox
                    checked={completed}
                    onCheckedChange={(value) => item && onToggle(item, Boolean(value))}
                    className="mt-1"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const SummaryTile = ({ label, value }: { label: string; value: string }) => {
  // Define color variants based on label
  const variants = {
    'University': {
      bg: 'from-blue-500/10 to-blue-600/10',
      border: 'border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-400',
      icon: '🏛️',
      hover: 'hover:shadow-blue-500/20 hover:border-blue-500/50'
    },
    'Program title': {
      bg: 'from-purple-500/10 to-purple-600/10',
      border: 'border-purple-500/30',
      text: 'text-purple-700 dark:text-purple-400',
      icon: '🎓',
      hover: 'hover:shadow-purple-500/20 hover:border-purple-500/50'
    },
    'Total courses': {
      bg: 'from-emerald-500/10 to-emerald-600/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: '📚',
      hover: 'hover:shadow-emerald-500/20 hover:border-emerald-500/50'
    }
  };

  const variant = variants[label as keyof typeof variants] || {
    bg: 'from-gray-500/10 to-gray-600/10',
    border: 'border-gray-500/30',
    text: 'text-foreground',
    icon: '📌',
    hover: 'hover:shadow-gray-500/20 hover:border-gray-500/50'
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-sm transition-all duration-300 ${variant.bg} ${variant.border} ${variant.hover} hover:shadow-lg`}
    >
      <div className="absolute -right-3 -top-3 text-4xl opacity-20 transition-opacity group-hover:opacity-30">
        {variant.icon}
      </div>
      <p className="relative z-10 mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`relative z-10 text-lg font-semibold ${variant.text}`}>
        {value}
      </p>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 dark:to-black/30" />
    </div>
  );
};

const CompletionSummaryCard = ({
  title,
  progress,
}: {
  title: string;
  progress: { completed: number; total: number; percent: number };
}) => (
  <Card className="border-border/60 bg-white/90 dark:bg-slate-950/80">
    <CardContent className="space-y-2 py-4">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="flex items-center justify-between text-sm text-foreground">
        <span>
          Completed {progress.completed}/{progress.total}
        </span>
        <span>{progress.percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
      </div>
    </CardContent>
  </Card>
);
