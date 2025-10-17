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

export type AdminNotificationType = "newStudent" | "updateStudent" | "deleteStudent";

export type AdminNotificationPayload = {
  type: AdminNotificationType;
  uid: string;
  message?: string;
  studentName?: string;
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
