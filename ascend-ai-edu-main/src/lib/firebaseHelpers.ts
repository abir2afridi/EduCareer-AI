import {
  collection,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  type DocumentData,
  type QuerySnapshot,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

const studentsCollection = collection(db, "students");
const notificationsCollection = collection(db, "adminNotifications");
const profileChangeRequestsCollection = collection(db, "profileChangeRequests");

export const PROFILE_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export type AdminNotificationType = "newStudent" | "updateStudent" | "deleteStudent" | "profileChangeRequest";

export type AdminNotificationPayload = {
  type: AdminNotificationType;
  uid: string;
  message?: string;
  studentName?: string;
  metadata?: Record<string, unknown>;
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

export const getStudentsSnapshot = (
  onNext: (snapshot: QuerySnapshot<DocumentData>) => void,
  onError?: (error: FirestoreError) => void,
) => onSnapshot(studentsCollection, onNext, onError);

export const updateStudentDoc = (studentId: string, updatedData: Record<string, unknown>) =>
  updateDoc(doc(studentsCollection, studentId), updatedData);

export const deleteStudentDoc = (studentId: string) => deleteDoc(doc(studentsCollection, studentId));

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
