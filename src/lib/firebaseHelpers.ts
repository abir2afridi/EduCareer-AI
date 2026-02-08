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
  arrayUnion,
  Timestamp,
  type DocumentData,
  type QuerySnapshot,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app, db, storage } from "@/lib/firebaseClient";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import type {
  TeacherPayload,
  TeacherRecord,
  TeacherPaymentPayload,
  TeacherPaymentRecord,
  TeacherPaymentStatus,
  TeacherHireRequestPayload,
  TeacherHireRequestRecord,
  TeacherHireRequestStatus,
  TeacherReviewPayload,
  TeacherReviewRecord,
} from "@/data/teachers";
import type { NewUserEventInput, UserEventRecord } from "@/data/events";
import { normalizeTeacherRecord, sanitizeTeacherWritePayload } from "@/lib/teacherNormalizer";

const studentsCollection = collection(db, "students");
const teachersCollection = collection(db, "teachers");
const paymentsCollection = collection(db, "payments");
const hireRequestsCollection = collection(db, "hireRequests");
const teacherReviewsCollection = (teacherId: string) => collection(db, "teachers", teacherId, "reviews");
const teacherReviewDoc = (teacherId: string, studentId: string) => doc(teacherReviewsCollection(teacherId), studentId);
const studentHireDoc = (studentId: string, teacherId: string) => doc(studentHiresCollection(studentId), teacherId);
const notificationsCollection = collection(db, "adminNotifications");
const profileChangeRequestsCollection = collection(db, "profileChangeRequests");
const careerDocsMetaCollection = (uid: string) => collection(db, "careerDocsMeta", uid, "documents");
const careerAssessmentsCollection = (uid: string) => collection(db, "careerAssessments", uid, "assessments");
const quizAttemptsCollection = (uid: string) => collection(db, "quizAttempts", uid, "attempts");
const careerRecommendationsCollection = (uid: string) => collection(db, "careerRecommendations", uid, "items");
const userSettingsDocRef = (uid: string) => doc(db, "users", uid, "settings", "app");
const careerGuidancePreferencesDoc = (uid: string) => doc(db, "users", uid, "careerGuidance", "preferences");
const studentHiresCollection = (uid: string) => collection(db, "students", uid, "hiredTeachers");
const userEventsCollection = (uid: string) => collection(db, "users", uid, "events");
const userEventDoc = (uid: string, eventId: string) => doc(userEventsCollection(uid), eventId);

export const PROFILE_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const getCurrentUserOrThrow = () => {
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Operation requires an authenticated user.");
  }
  return currentUser;
};

const normalizeTeacherReviewRecord = (reviewId: string, data: Partial<TeacherReviewRecord> & DocumentData): TeacherReviewRecord => {
  const ratingValue = Number(data.rating);
  const rating = Number.isFinite(ratingValue) ? Math.min(Math.max(Math.round(ratingValue), 1), 5) : 1;

  return {
    id: reviewId,
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    studentName: typeof data.studentName === "string" ? data.studentName : undefined,
    rating,
    review: typeof data.review === "string" ? data.review : "",
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  } satisfies TeacherReviewRecord;
};

const normalizeUserEventRecord = (eventId: string, data: Partial<UserEventRecord> & DocumentData): UserEventRecord => {
  const date = data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date());
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date());
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt : undefined;

  return {
    id: eventId,
    title: typeof data.title === "string" ? data.title : "Untitled Event",
    description: typeof data.description === "string" ? data.description : undefined,
    date,
    time: typeof data.time === "string" ? data.time : undefined,
    category: typeof data.category === "string" ? data.category : undefined,
    createdAt,
    updatedAt,
  } satisfies UserEventRecord;
};

export type UserEventUpdateInput = Partial<Omit<NewUserEventInput, "date">> & {
  date?: Date;
};

const sanitizeUserEventWritePayload = (input: NewUserEventInput | UserEventUpdateInput) => {
  const payload: Record<string, unknown> = {};

  if ("title" in input && typeof input.title === "string") {
    payload.title = input.title.trim();
  }

  if ("description" in input) {
    const value = typeof input.description === "string" ? input.description.trim() : undefined;
    if (value) {
      payload.description = value;
    } else {
      payload.description = null;
    }
  }

  if ("date" in input && input.date instanceof Date && !Number.isNaN(input.date.getTime())) {
    payload.date = Timestamp.fromDate(input.date);
  }

  if ("time" in input) {
    payload.time = input.time ?? null;
  }

  if ("category" in input) {
    payload.category = input.category ?? null;
  }

  return payload;
};

export const createUserEvent = async (uid: string, input: NewUserEventInput): Promise<string> => {
  const payload = sanitizeUserEventWritePayload(input);
  const timestamp = serverTimestamp();

  const docRef = await addDoc(userEventsCollection(uid), {
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return docRef.id;
};

export const updateUserEvent = async (uid: string, eventId: string, updates: UserEventUpdateInput): Promise<void> => {
  const payload = sanitizeUserEventWritePayload(updates);

  await updateDoc(userEventDoc(uid, eventId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUserEvent = async (uid: string, eventId: string): Promise<void> => {
  await deleteDoc(userEventDoc(uid, eventId));
};

export const listenToUserEvents = (
  uid: string,
  onNext: (events: UserEventRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const eventsQuery = query(userEventsCollection(uid), orderBy("date", "asc"));

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const records = snapshot.docs.map((docSnapshot) =>
        normalizeUserEventRecord(docSnapshot.id, docSnapshot.data() as Partial<UserEventRecord> & DocumentData),
      );
      onNext(records);
    },
    (error) => {
      console.error("Error listening to user events:", error);
      onError?.(error);
    },
  );
};

const assertAdminRole = async () => {
  const currentUser = getCurrentUserOrThrow();
  const tokenResult = await currentUser.getIdTokenResult();
  const role = typeof tokenResult.claims.role === "string" ? (tokenResult.claims.role as string) : undefined;

  if (role !== "admin") {
    throw new Error("Operation requires admin privileges.");
  }
};

const normalizePaymentRecord = (paymentId: string, data: Partial<TeacherPaymentRecord> & DocumentData): TeacherPaymentRecord => {
  const months = Number.isFinite(data.months) ? Math.max(1, Number(data.months)) : 1;
  const monthlyFee = Number.isFinite(data.monthlyFee) ? Number(data.monthlyFee) : 0;
  const totalAmount = Number.isFinite(data.totalAmount) ? Number(data.totalAmount) : months * monthlyFee;

  return {
    id: paymentId,
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    studentName: typeof data.studentName === "string" ? data.studentName : undefined,
    teacherId: typeof data.teacherId === "string" ? data.teacherId : "",
    teacherName: typeof data.teacherName === "string" ? data.teacherName : undefined,
    months,
    monthlyFee,
    totalAmount,
    transactionId: typeof data.transactionId === "string" ? data.transactionId : "",
    status: (data.status as TeacherPaymentStatus) ?? "pending",
    notes: typeof data.notes === "string" ? data.notes : undefined,
    submittedAt: data.submittedAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
    resolvedAt: data.resolvedAt as Timestamp | undefined,
    approvedAt: data.approvedAt as Timestamp | undefined,
    expiresAt: data.expiresAt as Timestamp | undefined,
  } satisfies TeacherPaymentRecord;
};

export const createTeacherDoc = async (payload: TeacherPayload): Promise<string> => {
  await assertAdminRole();
  const timestamp = serverTimestamp();
  const sanitizedPayload = sanitizeTeacherWritePayload(payload);
  const docRef = await addDoc(teachersCollection, {
    ...sanitizedPayload,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return docRef.id;
};

export const updateTeacherDoc = async (teacherId: string, updates: Partial<TeacherPayload>) => {
  await assertAdminRole();
  const teacherRef = doc(teachersCollection, teacherId);
  const sanitizedUpdates = sanitizeTeacherWritePayload(updates);
  await updateDoc(teacherRef, {
    ...sanitizedUpdates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTeacherDoc = async (teacherId: string) => {
  await assertAdminRole();
  await deleteDoc(doc(teachersCollection, teacherId));
};

export const getTeacherDoc = async (teacherId: string): Promise<TeacherRecord | null> => {
  if (!teacherId) return null;
  const teacherRef = doc(teachersCollection, teacherId);
  const snapshot = await getDoc(teacherRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<TeacherRecord> & Record<string, unknown>;
  return normalizeTeacherRecord(snapshot.id, data);
};

const sanitizePaymentPayload = (payload: TeacherPaymentPayload) => {
  const monthsValue = Number.isFinite(payload.months) ? Number(payload.months) : 1;
  const months = Math.max(1, Math.round(monthsValue));
  const monthlyFeeValue = Number.isFinite(payload.monthlyFee) ? Number(payload.monthlyFee) : 0;
  const monthlyFee = Math.max(0, Math.round(monthlyFeeValue * 100) / 100);
  const totalAmountValue = Number.isFinite(payload.totalAmount) ? Number(payload.totalAmount) : months * monthlyFee;
  const totalAmount = Math.max(0, Math.round(totalAmountValue * 100) / 100);

  return {
    studentId: payload.studentId,
    studentUid: payload.studentUid ?? payload.studentId,
    studentName: payload.studentName ?? null,
    teacherId: payload.teacherId,
    teacherName: payload.teacherName ?? null,
    months,
    monthlyFee,
    totalAmount,
    transactionId: payload.transactionId,
    status: payload.status ?? "pending",
    notes: payload.notes ?? null,
    expiresAt: payload.expiresAt ?? null,
    approvedAt: payload.approvedAt ?? null,
    hireRequestId: payload.hireRequestId ?? null,
  } satisfies TeacherPaymentPayload & { notes: string | null };
};

const sanitizeHireRequestPayload = (payload: TeacherHireRequestPayload) => {
  const monthsValue = Number.isFinite(payload.months) ? Number(payload.months) : 1;
  const months = Math.max(1, Math.round(monthsValue));
  const monthlyFeeValue = Number.isFinite(payload.monthlyFee) ? Number(payload.monthlyFee) : 0;
  const monthlyFee = Math.max(0, Math.round(monthlyFeeValue * 100) / 100);
  const totalAmountValue = Number.isFinite(payload.totalAmount) ? Number(payload.totalAmount) : months * monthlyFee;
  const totalAmount = Math.max(0, Math.round(totalAmountValue * 100) / 100);

  return {
    studentUid: payload.studentUid,
    studentName: payload.studentName ?? null,
    teacherId: payload.teacherId,
    teacherName: payload.teacherName ?? null,
    months,
    monthlyFee,
    totalAmount,
    transactionId: payload.transactionId,
    paymentId: payload.paymentId ?? null,
    status: payload.status ?? "pending",
    notes: payload.notes ?? null,
  } satisfies TeacherHireRequestPayload & { notes: string | null; paymentId: string | null };
};

const normalizeHireRequestRecord = (
  requestId: string,
  data: Partial<TeacherHireRequestRecord> & DocumentData,
): TeacherHireRequestRecord => {
  const months = Number.isFinite(data.months) ? Number(data.months) : 1;
  const monthlyFee = Number.isFinite(data.monthlyFee) ? Number(data.monthlyFee) : 0;
  const totalAmount = Number.isFinite(data.totalAmount) ? Number(data.totalAmount) : months * monthlyFee;

  return {
    id: requestId,
    studentUid: typeof data.studentUid === "string" ? data.studentUid : "",
    studentName: typeof data.studentName === "string" ? data.studentName : undefined,
    teacherId: typeof data.teacherId === "string" ? data.teacherId : "",
    teacherName: typeof data.teacherName === "string" ? data.teacherName : undefined,
    months,
    monthlyFee,
    totalAmount,
    transactionId: typeof data.transactionId === "string" ? data.transactionId : "",
    paymentId: typeof data.paymentId === "string" ? data.paymentId : undefined,
    status: (data.status as TeacherHireRequestStatus) ?? "pending",
    notes: typeof data.notes === "string" ? data.notes : undefined,
    submittedAt: data.submittedAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
    resolvedAt: data.resolvedAt as Timestamp | undefined,
  } satisfies TeacherHireRequestRecord;
};

export const submitTeacherHireRequest = async (payload: TeacherHireRequestPayload): Promise<string> => {
  const currentUser = getCurrentUserOrThrow();

  if (currentUser.uid !== payload.studentUid) {
    throw new Error("You can only submit hire requests for your own account.");
  }

  const sanitized = sanitizeHireRequestPayload(payload);
  const timestamp = serverTimestamp();

  const docRef = await addDoc(hireRequestsCollection, {
    ...sanitized,
    submittedAt: timestamp,
    updatedAt: timestamp,
  });

  return docRef.id;
};

export const submitTeacherPayment = async (payload: TeacherPaymentPayload): Promise<string> => {
  const currentUser = getCurrentUserOrThrow();
  const tokenResult = await currentUser.getIdTokenResult();
  const isAdmin = tokenResult.claims.role === "admin";

  if (!isAdmin && currentUser.uid !== payload.studentId) {
    throw new Error("You can only submit payments for your own account.");
  }

  const sanitized = sanitizePaymentPayload(payload);
  const timestamp = serverTimestamp();

  const docRef = await addDoc(paymentsCollection, {
    ...sanitized,
    submittedAt: timestamp,
    updatedAt: timestamp,
  });

  return docRef.id;
};

export const listenToTeacherPayments = (
  onNext: (payments: TeacherPaymentRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const paymentsQuery = query(paymentsCollection, orderBy("submittedAt", "desc"));
  return onSnapshot(
    paymentsQuery,
    (snapshot) => {
      const records = snapshot.docs.map((docSnapshot) =>
        normalizePaymentRecord(docSnapshot.id, docSnapshot.data() as Partial<TeacherPaymentRecord> & DocumentData),
      );
      onNext(records);
    },
    onError,
  );
};

const getTeacherPaymentOrThrow = async (paymentId: string): Promise<TeacherPaymentRecord> => {
  if (!paymentId) {
    throw new Error("Missing payment id");
  }

  const paymentRef = doc(paymentsCollection, paymentId);
  const snapshot = await getDoc(paymentRef);
  if (!snapshot.exists()) {
    throw new Error("Teacher payment not found");
  }

  return normalizePaymentRecord(paymentId, snapshot.data() as Partial<TeacherPaymentRecord> & DocumentData);
};

export const approveTeacherPayment = async (paymentId: string, options?: { notes?: string }) => {
  await assertAdminRole();
  const payment = await getTeacherPaymentOrThrow(paymentId);

  if (!payment.studentId || !payment.teacherId) {
    throw new Error("Payment is missing the student or teacher reference");
  }

  if (payment.status === "approved") {
    throw new Error("Payment has already been approved");
  }

  if (payment.status !== "pending" && payment.status !== "rejected") {
    throw new Error("Payment cannot be approved from its current state");
  }

  const paymentRef = doc(paymentsCollection, paymentId);
  const months = Math.max(1, payment.months);
  const approvalDate = new Date();
  const expiryDate = new Date(approvalDate);
  expiryDate.setMonth(expiryDate.getMonth() + months);
  const expiresAt = Timestamp.fromDate(expiryDate);
  const trimmedNotes = typeof options?.notes === "string" ? options.notes.trim() : undefined;
  const paymentUpdate: Record<string, unknown> = {
    status: "approved",
    updatedAt: serverTimestamp(),
    resolvedAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
    expiresAt,
    notes: trimmedNotes ?? null,
  };
  await updateDoc(paymentRef, paymentUpdate);

  await updateDoc(doc(teachersCollection, payment.teacherId), {
    hiredStudents: arrayUnion(payment.studentId),
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    doc(studentHiresCollection(payment.studentId), payment.teacherId),
    {
      teacherId: payment.teacherId,
      teacherName: payment.teacherName ?? null,
      paymentId,
      months: payment.months,
      monthlyFee: payment.monthlyFee,
      totalAmount: payment.totalAmount,
      transactionId: payment.transactionId,
      status: "active",
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt,
    },
    { merge: true },
  );
};

export const rejectTeacherPayment = async (paymentId: string, options?: { notes?: string }) => {
  await assertAdminRole();
  const payment = await getTeacherPaymentOrThrow(paymentId);

  if (payment.status !== "pending") {
    throw new Error("Payment has already been resolved");
  }

  const paymentRef = doc(paymentsCollection, paymentId);
  const trimmedNotes = typeof options?.notes === "string" ? options.notes.trim() : undefined;
  const paymentUpdate: Record<string, unknown> = {
    status: "rejected",
    updatedAt: serverTimestamp(),
    resolvedAt: serverTimestamp(),
    notes: trimmedNotes ?? null,
  };
  await updateDoc(paymentRef, paymentUpdate);
};

const sanitizeReviewRating = (value: unknown): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(Math.max(Math.round(numeric), 1), 5);
};

export const submitTeacherReview = async (
  teacherId: string,
  payload: Omit<TeacherReviewPayload, "rating"> & { rating: number },
) => {
  if (!teacherId) throw new Error("Missing teacher id");

  const currentUser = getCurrentUserOrThrow();
  if (currentUser.uid !== payload.studentId) {
    throw new Error("You can only submit reviews for your own account.");
  }

  const trimmedReview = payload.review.trim();
  if (!trimmedReview) {
    throw new Error("Review text cannot be empty.");
  }

  const [hireSnap, existingReviewSnap] = await Promise.all([
    getDoc(studentHireDoc(payload.studentId, teacherId)),
    getDoc(teacherReviewDoc(teacherId, payload.studentId)),
  ]);

  if (!hireSnap.exists()) {
    throw new Error("Only hired students can submit reviews for this teacher.");
  }

  const reviewRef = teacherReviewDoc(teacherId, payload.studentId);
  const sanitizedRating = sanitizeReviewRating(payload.rating);
  const reviewData: Record<string, unknown> = {
    studentId: payload.studentId,
    studentName: payload.studentName ?? null,
    rating: sanitizedRating,
    review: trimmedReview,
    updatedAt: serverTimestamp(),
  };

  if (!existingReviewSnap.exists()) {
    reviewData.createdAt = serverTimestamp();
  }

  await setDoc(reviewRef, reviewData, { merge: true });
};

export const listenToTeacherReviews = (
  teacherId: string,
  onNext: (reviews: TeacherReviewRecord[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  if (!teacherId) {
    throw new Error("Missing teacher id for reviews listener.");
  }

  const reviewsQuery = query(teacherReviewsCollection(teacherId), orderBy("createdAt", "desc"));
  return onSnapshot(
    reviewsQuery,
    (snapshot) => {
      const records = snapshot.docs.map((docSnapshot) =>
        normalizeTeacherReviewRecord(docSnapshot.id, docSnapshot.data() as Partial<TeacherReviewRecord> & DocumentData),
      );
      onNext(records);
    },
    onError,
  );
};

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
