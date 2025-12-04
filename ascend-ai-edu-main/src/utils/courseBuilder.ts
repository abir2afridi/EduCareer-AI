import { db, storage } from "@/lib/firebaseClient";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentReference,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export type CourseCell = {
  id: string;
  columnId: string;
  name: string;
};

export type CourseColumn = {
  id: string;
  title: string;
};

export type CourseRow = {
  id: string;
  title?: string;
  courses: CourseCell[];
};

export type CourseTopic = {
  id: string;
  name: string;
  columns: CourseColumn[];
  rows: CourseRow[];
};

export type SemesterCourse = {
  id: string;
  code?: string;
  title: string;
  creditHours?: string;
  note?: string;
};

export type SemesterPlan = {
  id: string;
  name: string;
  courses: SemesterCourse[];
};

export type PublishedCourseCell = {
  id: string;
  title: string;
  columnId: string;
  columnTitle: string;
  rowId: string;
  rowTitle: string;
  topicId: string;
  topicTitle: string;
};

export type PublishedCourseRow = {
  rowId: string;
  rowTitle: string;
  topicId: string;
  topicTitle: string;
  cells: PublishedCourseCell[];
};

export type PublishedCourseGrid = PublishedCourseRow[];

export type PublishedCoursePlanCourse = {
  id: string;
  title: string;
  code?: string;
  creditHours?: string;
  note?: string;
};

export type PublishedCoursePlanSemester = {
  id: string;
  name: string;
  courses: PublishedCoursePlanCourse[];
};

export type PublishedCoursePlan = {
  programTitle: string;
  semesters: PublishedCoursePlanSemester[];
};

export type UniversityCourseDocument = {
  universityId: string;
  universityName: string;
  universityLogo: string;
  listOfCourses: PublishedCourseGrid;
  coursePlan: PublishedCoursePlan;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type CoursePresetContent = {
  universityId: string;
  universityName: string;
  programTitle: string;
  topics: CourseTopic[];
  semesters: SemesterPlan[];
  logoUrl?: string | null;
  updatedAt?: Timestamp;
  publishedAt?: Timestamp;
  publishedBy?: string;
  createdBy?: string;
};

export type CourseDraftDocument = CoursePresetContent & {
  draftId: string;
  createdAt?: Timestamp;
};

export type StudentCourseCompletion = {
  courseId: string;
  completed: boolean;
  completedAt?: Timestamp;
};

export type StudentCustomCourse = {
  id: string;
  title: string;
  note?: string;
};

export type StudentCustomCoursePreset = {
  id: string;
  title: string;
  description?: string;
  courses: StudentCustomCourse[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const randomId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export const createRandomId = () => randomId();

export const slugifyUniversityId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "university";

export const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const cleanData = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const courseDraftDoc = (adminUid: string, draftId: string): DocumentReference =>
  doc(db, "courseBuilder", adminUid, "drafts", draftId);

const universityCourseDoc = (universityId: string): DocumentReference => doc(db, "universityCourses", universityId);

const studentCourseCompletionDoc = (uid: string, courseId: string): DocumentReference =>
  doc(db, "students", uid, "completedCourses", courseId);

const studentCustomPresetDoc = (uid: string, presetId: string): DocumentReference =>
  doc(db, "students", uid, "customCoursePresets", presetId);

const studentCustomPresetsCollection = (uid: string) => collection(db, "students", uid, "customCoursePresets");

const studentCourseCompletionsCollection = (uid: string) => collection(db, "students", uid, "completedCourses");

export const createEmptyColumn = (title = "Column"): CourseColumn => ({
  id: randomId(),
  title,
});

export const createEmptyRow = (columnIds: string[]): CourseRow => ({
  id: randomId(),
  title: undefined,
  courses: columnIds.map((columnId) => ({
    id: randomId(),
    columnId,
    name: "",
  })),
});

export const createEmptyTopic = (name = "New Topic"): CourseTopic => {
  const baseColumns = [createEmptyColumn("Core"), createEmptyColumn("Elective")];
  return {
    id: randomId(),
    name,
    columns: baseColumns,
    rows: [createEmptyRow(baseColumns.map((column) => column.id))],
  };
};

export const createEmptySemester = (name = "Semester 1"): SemesterPlan => ({
  id: randomId(),
  name,
  courses: [
    {
      id: randomId(),
      code: "",
      title: "",
      creditHours: "",
      note: "",
    },
  ],
});

export const fetchCourseDraft = async (adminUid: string, draftId: string): Promise<CourseDraftDocument | null> => {
  const snap = await getDoc(courseDraftDoc(adminUid, draftId));
  if (!snap.exists()) return null;
  return snap.data() as CourseDraftDocument;
};

export const saveCourseDraft = async (adminUid: string, content: CoursePresetContent): Promise<void> => {
  const sanitizedContent = clean({
    ...content,
    createdBy: content.createdBy ?? adminUid,
  });

  if (!sanitizedContent.universityId) {
    throw new Error("University ID is required before saving a draft.");
  }

  const payload: CourseDraftDocument = {
    ...sanitizedContent,
    draftId: sanitizedContent.universityId,
  };

  await setDoc(
    courseDraftDoc(adminUid, sanitizedContent.universityId),
    {
      ...payload,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const deleteCourseDraft = async (adminUid: string, draftId: string): Promise<void> => {
  await deleteDoc(courseDraftDoc(adminUid, draftId));
};

export const publishCoursePreset = async (payload: UniversityCourseDocument): Promise<void> => {
  if (!payload.universityId) {
    throw new Error("University ID is required before publishing.");
  }

  if (!payload.universityName) {
    throw new Error("University name is required before publishing.");
  }

  const docRef = universityCourseDoc(payload.universityId);
  const cleaned = cleanData({
    ...payload,
    createdAt: undefined,
    updatedAt: undefined,
  });

  console.log("[publishCoursePreset] Writing document", cleaned);

  await setDoc(
    docRef,
    {
      ...cleaned,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const deletePublishedCoursePreset = async (universityId: string): Promise<void> => {
  await deleteDoc(universityCourseDoc(universityId));
};

export const listenToPublishedCoursePreset = (
  universityId: string,
  onNext: (preset: UniversityCourseDocument | null) => void,
  onError?: (error: unknown) => void,
): Unsubscribe =>
  onSnapshot(
    universityCourseDoc(universityId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onNext(null);
        return;
      }
      const data = snapshot.data() as UniversityCourseDocument;
      console.log("[listenToPublishedCoursePreset] Received", universityId, data);
      onNext(data);
    },
    (error) => {
      console.error("listenToPublishedCoursePreset", error);
      onError?.(error);
    },
  );

export const uploadUniversityLogo = async (file: File, universityId: string) => {
  const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
  const objectRef = ref(storage, `university-logos/${universityId}/${Date.now()}-${safeName}`);
  await uploadBytes(objectRef, file);
  return getDownloadURL(objectRef);
};

export const listenToStudentCourseCompletions = (
  uid: string,
  onNext: (completions: Record<string, StudentCourseCompletion>) => void,
  onError?: (error: unknown) => void,
): Unsubscribe =>
  onSnapshot(
    studentCourseCompletionsCollection(uid),
    (snapshot) => {
      const map: Record<string, StudentCourseCompletion> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<StudentCourseCompletion> | undefined;
        const courseId = typeof data?.courseId === "string" && data.courseId.trim().length > 0 ? data.courseId : docSnap.id;
        if (!courseId) return;
        map[courseId] = {
          courseId,
          completed: Boolean(data?.completed),
          completedAt: data?.completedAt,
        } satisfies StudentCourseCompletion;
      });
      onNext(map);
    },
    (error) => {
      console.error("listenToStudentCourseCompletions", error);
      onError?.(error);
    },
  );

export const setStudentCourseCompletion = async (uid: string, courseId: string, completed: boolean): Promise<void> => {
  if (completed) {
    await setDoc(studentCourseCompletionDoc(uid, courseId), {
      courseId,
      completed: true,
      completedAt: serverTimestamp(),
    });
    return;
  }

  await deleteDoc(studentCourseCompletionDoc(uid, courseId));
};

export const listenToStudentCustomPresets = (
  uid: string,
  onNext: (presets: StudentCustomCoursePreset[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe =>
  onSnapshot(
    studentCustomPresetsCollection(uid),
    (snapshot) => {
      const presets: StudentCustomCoursePreset[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as StudentCustomCoursePreset),
      }));
      onNext(presets);
    },
    (error) => {
      console.error("listenToStudentCustomPresets", error);
      onError?.(error);
    },
  );

export const createStudentCustomPreset = async (
  uid: string,
  preset: Omit<StudentCustomCoursePreset, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<string> => {
  const presetId = preset.id ?? createRandomId();
  await setDoc(
    studentCustomPresetDoc(uid, presetId),
    {
      ...preset,
      id: presetId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return presetId;
};

export const updateStudentCustomPreset = async (
  uid: string,
  preset: StudentCustomCoursePreset,
): Promise<void> => {
  await setDoc(
    studentCustomPresetDoc(uid, preset.id),
    {
      ...preset,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const deleteStudentCustomPreset = async (uid: string, presetId: string): Promise<void> => {
  await deleteDoc(studentCustomPresetDoc(uid, presetId));
};
