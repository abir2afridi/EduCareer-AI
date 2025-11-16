import {
  collection,
  collectionGroup,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  type DocumentData,
  type QuerySnapshot,
  type FirestoreError,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app, db, storage } from "@/lib/firebaseClient";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";

const studentsCollection = collection(db, "students");
const notificationsCollection = collection(db, "adminNotifications");
const profileChangeRequestsCollection = collection(db, "profileChangeRequests");
const careerDocsMetaCollection = (uid: string) => collection(db, "careerDocsMeta", uid, "documents");
const careerAssessmentsCollection = (uid: string) => collection(db, "careerAssessments", uid, "assessments");
const quizAttemptsCollection = (uid: string) => collection(db, "quizAttempts", uid, "attempts");
const careerRecommendationsCollection = (uid: string) => collection(db, "careerRecommendations", uid, "items");
const userSettingsDocRef = (uid: string) => doc(db, "users", uid, "settings", "app");
const careerGuidancePreferencesDoc = (uid: string) => doc(db, "users", uid, "careerGuidance", "preferences");

export const PROFILE_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export type AdminNotificationType = "newStudent" | "updateStudent" | "deleteStudent" | "profileChangeRequest";

export type AdminNotificationPayload = {
  type: AdminNotificationType;
  uid: string;
  message?: string;
  studentName?: string;
  metadata?: Record<string, unknown>;
};

export type UserSettingsDocument = {
  notifications?: {
    email?: boolean;
    assignments?: boolean;
    grades?: boolean;
    courseAnnouncements?: boolean;
    career?: boolean;
  };
  display?: {
    compact?: boolean;
    animations?: boolean;
    highContrast?: boolean;
  };
  ai?: {
    proactiveSuggestions?: boolean;
    learningStyleAdaptation?: boolean;
    performanceTracking?: boolean;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const defaultUserSettings = (): UserSettingsDocument => ({
  notifications: {
    email: true,
    assignments: true,
    grades: true,
    courseAnnouncements: true,
    career: false,
  },
  display: {
    compact: false,
    animations: true,
    highContrast: false,
  },
  ai: {
    proactiveSuggestions: true,
    learningStyleAdaptation: true,
    performanceTracking: true,
  },
});

export const getUserSettings = async (uid: string): Promise<UserSettingsDocument> => {
  if (!uid) throw new Error("Missing user id for user settings fetch");
  const ref = userSettingsDocRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return defaultUserSettings();
  const data = snap.data() as UserSettingsDocument;
  return {
    ...defaultUserSettings(),
    ...data,
    notifications: { ...defaultUserSettings().notifications, ...data.notifications },
    display: { ...defaultUserSettings().display, ...data.display },
    ai: { ...defaultUserSettings().ai, ...data.ai },
  };
};

export const saveUserSettings = async (uid: string, updates: Partial<UserSettingsDocument>) => {
  if (!uid) throw new Error("Missing user id for user settings save");
  const ref = userSettingsDocRef(uid);
  const now = serverTimestamp();
  const existing = await getDoc(ref);
  const base: Record<string, unknown> = existing.exists() ? {} : { createdAt: now };
  await setDoc(
    ref,
    {
      ...base,
      ...updates,
      updatedAt: now,
    },
    { merge: true },
  );
};

export type ProfileChangeRequestPayload = {
  uid: string;
  requestedData: Record<string, unknown>;
  status?: "pending" | "approved" | "rejected";
};

export type StudentNotificationPayload = {
  uid: string;
  title: string;
  message: string;
  type?: string;
  metadata?: Record<string, unknown>;
};

export type CareerSurveyDocument = {
  careerGoals: string[];
  studyTracks: string[];
  choices?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type CareerSurveyPayload = {
  careerGoals: string[];
  studyTracks: string[];
};

export type CareerDocumentMetadata = {
  filename: string;
  storagePath: string;
  size: number;
  contentType: string;
  downloadUrl?: string | null;
  extractedTextSnippet?: string | null;
  ocrStatus?: "pending" | "success" | "no_text" | "failed";
  docConfidence?: number | null;
  warnings?: string[];
  metadataClassification?: string | null;
  uploadedAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type CareerDocumentRecord = CareerDocumentMetadata & {
  id: string;
};

export type CareerAssessmentQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  topic?: string | null;
  difficulty?: string | null;
};

export type CareerAssessmentDocument = {
  id: string;
  generatedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  generatedByAI: boolean;
  sourceSurveyChoices: string[];
  sourceStudyTracks?: string[];
  documentSummary: string | null;
  questions: CareerAssessmentQuestion[];
};

export type CareerQuizAttempt = {
  assessmentId: string;
  score: number;
  correctCount: number;
  questions: CareerAssessmentQuestion[];
  answers: Record<string, string | null>;
  timeTakenSeconds: number;
  totalSeconds: number;
  iqPoints?: number;
  submittedAt?: Timestamp;
  source?: string;
};

export type CareerRecommendation = {
  careerName: string;
  confidenceScore: number;
  why: string;
  recommendedSubjectsToStudy: string[];
  actionPlan: string[];
};

export type CareerRecommendationDocument = {
  assessmentId: string;
  generatedAt?: Timestamp;
  aiPayload: Record<string, unknown>;
  recommendations: CareerRecommendation[];
  flags?: string[];
};

export type CareerAssessmentRecord = CareerAssessmentDocument & { id: string };
export type CareerQuizAttemptRecord = CareerQuizAttempt & { id: string };
export type CareerRecommendationRecord = CareerRecommendationDocument & { id: string };

export type AdminCareerDocumentRecord = CareerDocumentRecord & { userId: string };
export type AdminCareerAssessmentRecord = CareerAssessmentRecord & { userId: string };
export type AdminCareerQuizAttemptRecord = CareerQuizAttemptRecord & { userId: string };
export type AdminCareerRecommendationRecord = CareerRecommendationRecord & { userId: string };

export const getStudentsSnapshot = (
  onNext: (snapshot: QuerySnapshot<DocumentData>) => void,
  onError?: (error: FirestoreError) => void,
) => onSnapshot(studentsCollection, onNext, onError);

export const updateStudentDoc = (studentId: string, updatedData: Record<string, unknown>) =>
  updateDoc(doc(studentsCollection, studentId), updatedData);

export const deleteStudentDoc = async (studentId: string) => {
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    const error = new Error("deleteStudentDoc: no authenticated user");
    console.error("deleteStudentDoc:permission", error);
    throw error;
  }

  const tokenResult = await currentUser.getIdTokenResult();
  const role = typeof tokenResult.claims.role === "string" ? (tokenResult.claims.role as string) : undefined;

  console.info("deleteStudentDoc:claims", { uid: currentUser.uid, role });

  if (role !== "admin") {
    const error = new Error("deleteStudentDoc: missing admin role claim");
    console.error("deleteStudentDoc:permission", error);
    throw error;
  }

  try {
    await deleteDoc(doc(studentsCollection, studentId));
  } catch (error) {
    console.error("deleteStudentDoc:permission", error);
    throw error;
  }
};

export const addAdminNotification = async (payload: AdminNotificationPayload) => {
  const timestamp = serverTimestamp();
  const data: Record<string, unknown> = {
    type: payload.type,
    uid: payload.uid,
    timestamp,
    createdAt: timestamp,
    seen: false,
  };

  if (payload.message) {
    data.message = payload.message;
  }

  if (payload.studentName) {
    data.studentName = payload.studentName;
  }

  if (payload.metadata) {
    data.metadata = payload.metadata;
  }

  await addDoc(notificationsCollection, data);
};

export const submitProfileChangeRequest = async (payload: ProfileChangeRequestPayload): Promise<boolean> => {
  console.log("submitProfileChangeRequest:start", payload.uid);

  const timestamp = serverTimestamp();
  const requestData: Record<string, unknown> = {
    uid: payload.uid,
    studentUid: payload.uid,
    requestedData: payload.requestedData,
    status: payload.status ?? "pending",
    timestamp,
    lastSubmissionTimestamp: timestamp,
  };

  try {
    console.log("submitProfileChangeRequest:before addDoc", payload.uid, requestData);
    await addDoc(profileChangeRequestsCollection, requestData);
    console.log("submitProfileChangeRequest:after addDoc", payload.uid);
    return true;
  } catch (error) {
    console.error("submitProfileChangeRequest:error", error);
    throw error;
  }
};

export const updateProfileChangeRequestStatus = (requestId: string, status: "pending" | "approved" | "rejected") =>
  updateDoc(doc(profileChangeRequestsCollection, requestId), { status, resolvedAt: serverTimestamp() });

export const addStudentNotification = async (payload: StudentNotificationPayload) => {
  const timestamp = serverTimestamp();
  const notificationData: Record<string, unknown> = {
    uid: payload.uid,
    title: payload.title,
    message: payload.message,
    type: payload.type ?? "info",
    metadata: payload.metadata ?? {},
    read: false,
    timestamp,
  };

  await addDoc(collection(db, "studentNotifications", payload.uid, "messages"), notificationData);
};

export const markProfileChangePending = async (uid: string) => {
  await updateDoc(doc(studentsCollection, uid), {
    profileChangePending: true,
    profileChangeLastSubmissionAt: serverTimestamp(),
  });
};

export const markProfileChangeResolved = async (uid: string, status: "approved" | "rejected") => {
  const updatePayload: Record<string, unknown> = {
    profileChangePending: false,
  };

  if (status === "approved") {
    updatePayload.profileChangeLastApprovedAt = serverTimestamp();
  } else {
    updatePayload.profileChangeLastRejectedAt = serverTimestamp();
  }

  await updateDoc(doc(studentsCollection, uid), updatePayload);
};

export const saveCareerSurvey = async (uid: string, payload: CareerSurveyPayload) => {
  if (!uid) throw new Error("Missing user id for survey save");
  const surveyRef = careerGuidancePreferencesDoc(uid);
  const timestamp = serverTimestamp();
  const existing = await getDoc(surveyRef);
  const careerGoals = Array.isArray(payload.careerGoals) ? payload.careerGoals.slice(0, 3) : [];
  const studyTracks = Array.isArray(payload.studyTracks) ? payload.studyTracks.slice(0, 3) : [];
  const data: Record<string, unknown> = {
    careerGoals,
    studyTracks,
    choices: careerGoals,
    updatedAt: timestamp,
  };
  if (!existing.exists()) {
    data.createdAt = timestamp;
  }
  await setDoc(surveyRef, data, { merge: true });
};

export const getCareerSurvey = async (uid: string): Promise<CareerSurveyDocument | null> => {
  if (!uid) return null;
  const surveyRef = careerGuidancePreferencesDoc(uid);
  const snapshot = await getDoc(surveyRef);
  if (!snapshot.exists()) return null;
  const raw = snapshot.data() as CareerSurveyDocument & { choices?: unknown };
  const careerGoals = Array.isArray(raw.careerGoals)
    ? raw.careerGoals
    : Array.isArray(raw.choices)
      ? (raw.choices as string[])
      : [];
  const studyTracks = Array.isArray(raw.studyTracks) ? raw.studyTracks : [];
  return {
    ...raw,
    careerGoals,
    studyTracks,
    choices: Array.isArray(raw.choices) ? (raw.choices as string[]) : careerGoals,
  };
};

export const addCareerDocMetadata = async (uid: string, metadata: CareerDocumentMetadata) => {
  if (!uid) throw new Error("Missing user id for document metadata");
  const docsCollection = careerDocsMetaCollection(uid);
  const timestamp = serverTimestamp();
  return addDoc(docsCollection, {
    ...metadata,
    uploadedAt: timestamp,
    updatedAt: timestamp,
  });
};

export const updateCareerDocMetadata = async (uid: string, docId: string, updates: Partial<CareerDocumentMetadata>) => {
  if (!uid) throw new Error("Missing user id for document metadata update");
  const docRef = doc(careerDocsMetaCollection(uid), docId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCareerDocMetadata = async (uid: string, docId: string) => {
  if (!uid) throw new Error("Missing user id for document metadata delete");
  const docRef = doc(careerDocsMetaCollection(uid), docId);
  await deleteDoc(docRef);
};

export const listenToCareerDocsMetadata = (
  uid: string,
  onNext: (docs: CareerDocumentRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const docsCollection = careerDocsMetaCollection(uid);
  const docsQuery = query(docsCollection, orderBy("uploadedAt", "desc"));
  return onSnapshot(
    docsQuery,
    (snapshot) => {
      const records: CareerDocumentRecord[] = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as CareerDocumentMetadata),
      }));
      onNext(records);
    },
    onError,
  );
};

export const listenToAllCareerDocuments = (
  onNext: (records: AdminCareerDocumentRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const documentsGroup = collectionGroup(db, "documents");
  const documentsQuery = query(documentsGroup, orderBy("uploadedAt", "desc"));
  return onSnapshot(
    documentsQuery,
    (snapshot) => {
      const records: AdminCareerDocumentRecord[] = snapshot.docs
        .map((docSnapshot) => {
          const userId = docSnapshot.ref.parent.parent?.id;
          if (!userId) return null;
          const data = docSnapshot.data() as CareerDocumentMetadata;
          return {
            userId,
            id: docSnapshot.id,
            ...data,
          } satisfies AdminCareerDocumentRecord;
        })
        .filter((record): record is AdminCareerDocumentRecord => Boolean(record));
      onNext(records);
    },
    onError,
  );
};

export const listenToAllCareerAssessments = (
  onNext: (records: AdminCareerAssessmentRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const assessmentsGroup = collectionGroup(db, "assessments");
  const assessmentsQuery = query(assessmentsGroup, orderBy("createdAt", "desc"));
  return onSnapshot(
    assessmentsQuery,
    (snapshot) => {
      const records: AdminCareerAssessmentRecord[] = snapshot.docs
        .map((docSnapshot) => {
          const userId = docSnapshot.ref.parent.parent?.id;
          if (!userId) return null;
          const data = docSnapshot.data() as Omit<CareerAssessmentDocument, "id">;
          return {
            userId,
            id: docSnapshot.id,
            ...data,
          } satisfies AdminCareerAssessmentRecord;
        })
        .filter((record): record is AdminCareerAssessmentRecord => Boolean(record));
      onNext(records);
    },
    onError,
  );
};

export const listenToAllCareerQuizAttempts = (
  onNext: (records: AdminCareerQuizAttemptRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const attemptsGroup = collectionGroup(db, "attempts");
  const attemptsQuery = query(attemptsGroup, orderBy("submittedAt", "desc"));
  return onSnapshot(
    attemptsQuery,
    (snapshot) => {
      const records: AdminCareerQuizAttemptRecord[] = snapshot.docs
        .map((docSnapshot) => {
          const userId = docSnapshot.ref.parent.parent?.id;
          if (!userId) return null;
          const data = docSnapshot.data() as CareerQuizAttempt;
          return {
            userId,
            id: docSnapshot.id,
            ...data,
          } satisfies AdminCareerQuizAttemptRecord;
        })
        .filter((record): record is AdminCareerQuizAttemptRecord => Boolean(record));
      onNext(records);
    },
    onError,
  );
};

export const listenToAllCareerRecommendations = (
  onNext: (records: AdminCareerRecommendationRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const recommendationsGroup = collectionGroup(db, "items");
  const recommendationsQuery = query(recommendationsGroup, orderBy("generatedAt", "desc"));
  return onSnapshot(
    recommendationsQuery,
    (snapshot) => {
      const records: AdminCareerRecommendationRecord[] = snapshot.docs
        .map((docSnapshot) => {
          const userId = docSnapshot.ref.parent.parent?.id;
          if (!userId) return null;
          const data = docSnapshot.data() as CareerRecommendationDocument;
          return {
            userId,
            id: docSnapshot.id,
            ...data,
          } satisfies AdminCareerRecommendationRecord;
        })
        .filter((record): record is AdminCareerRecommendationRecord => Boolean(record));
      onNext(records);
    },
    onError,
  );
};

export const listenToCareerAssessments = (
  uid: string,
  onNext: (assessments: CareerAssessmentRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const assessmentsCollection = careerAssessmentsCollection(uid);
  const assessmentsQuery = query(assessmentsCollection, orderBy("createdAt", "desc"));
  return onSnapshot(
    assessmentsQuery,
    (snapshot) => {
      const records: CareerAssessmentRecord[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as Omit<CareerAssessmentDocument, "id">;
        return {
          id: docSnapshot.id,
          ...data,
        };
      });
      onNext(records);
    },
    onError,
  );
};

export const listenToCareerQuizAttempts = (
  uid: string,
  onNext: (attempts: CareerQuizAttemptRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const attemptsRef = quizAttemptsCollection(uid);
  const attemptsQuery = query(attemptsRef, orderBy("submittedAt", "desc"));
  return onSnapshot(
    attemptsQuery,
    (snapshot) => {
      const records: CareerQuizAttemptRecord[] = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as CareerQuizAttempt),
      }));
      onNext(records);
    },
    onError,
  );
};

export const listenToCareerRecommendations = (
  uid: string,
  onNext: (items: CareerRecommendationRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const recommendationsRef = careerRecommendationsCollection(uid);
  const recommendationsQuery = query(recommendationsRef, orderBy("generatedAt", "desc"));
  return onSnapshot(
    recommendationsQuery,
    (snapshot) => {
      const records: CareerRecommendationRecord[] = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as CareerRecommendationDocument),
      }));
      onNext(records);
    },
    onError,
  );
};

export const uploadCareerDoc = async (uid: string, file: File): Promise<CareerDocumentRecord> => {
  if (!uid) throw new Error("Missing user id for document upload");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `careerDocs/${uid}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
  const downloadUrl = await getDownloadURL(snapshot.ref);

  const metadata: CareerDocumentMetadata = {
    filename: file.name,
    storagePath,
    size: file.size,
    contentType: file.type || "application/octet-stream",
    downloadUrl,
    ocrStatus: "pending",
    warnings: [],
  };

  const docRef = await addCareerDocMetadata(uid, metadata);
  return {
    id: docRef.id,
    ...metadata,
  };
};

export const removeCareerDoc = async (uid: string, docId: string, storagePath: string) => {
  if (!uid) throw new Error("Missing user id for document removal");
  if (!storagePath) throw new Error("Missing storage path for document removal");
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef).catch((error) => {
    if (import.meta.env.DEV) {
      console.warn("Failed to delete storage object", error);
    }
  });
  await deleteCareerDocMetadata(uid, docId);
};

export const createCareerAssessment = async (
  uid: string,
  payload: Omit<CareerAssessmentDocument, "id" | "createdAt" | "updatedAt">,
) => {
  if (!uid) throw new Error("Missing user id for career assessment");
  const collectionRef = careerAssessmentsCollection(uid);
  const timestamp = serverTimestamp();
  const docRef = await addDoc(collectionRef, {
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return docRef.id;
};

export const updateCareerAssessment = async (uid: string, assessmentId: string, updates: Partial<CareerAssessmentDocument>) => {
  if (!uid) throw new Error("Missing user id for career assessment update");
  const docRef = doc(careerAssessmentsCollection(uid), assessmentId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const saveCareerQuizAttempt = async (uid: string, attempt: CareerQuizAttempt) => {
  if (!uid) throw new Error("Missing user id for quiz attempt");
  const attemptsRef = quizAttemptsCollection(uid);
  await addDoc(attemptsRef, {
    ...attempt,
    submittedAt: serverTimestamp(),
    source: attempt.source ?? "careerGuidance",
  });
};

export const saveCareerRecommendation = async (uid: string, payload: CareerRecommendationDocument) => {
  if (!uid) throw new Error("Missing user id for career recommendation");
  const collectionRef = careerRecommendationsCollection(uid);
  await addDoc(collectionRef, {
    ...payload,
    generatedAt: serverTimestamp(),
  });
};
