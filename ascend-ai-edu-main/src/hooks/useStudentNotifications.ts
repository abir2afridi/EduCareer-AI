import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, type DocumentData, type FirestoreError, type QuerySnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export type StudentNotification = {
  id: string;
  uid: string;
  title: string;
  message: string;
  type: string;
  metadata: Record<string, unknown>;
  read: boolean;
  timestamp: Date | null;
};

export type UseStudentNotificationsResult = {
  notifications: StudentNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const mapSnapshot = (uid: string, snapshot: QuerySnapshot<DocumentData>): StudentNotification[] =>
  snapshot.docs.map((notificationDoc) => {
    const data = notificationDoc.data();
    return {
      id: notificationDoc.id,
      uid: uid ?? (data.uid ?? ""),
      title: data.title ?? "",
      message: data.message ?? "",
      type: data.type ?? "info",
      metadata: data.metadata ?? {},
      read: data.read ?? false,
      timestamp: data.timestamp?.toDate?.() ?? null,
    } satisfies StudentNotification;
  });

export const useStudentNotifications = (uid: string | null | undefined): UseStudentNotificationsResult => {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const messagesCollection = collection(db, "studentNotifications", uid, "messages");
    const notificationsQuery = query(messagesCollection, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setNotifications(mapSnapshot(uid, snapshot));
        setIsLoading(false);
      },
      (snapshotError: FirestoreError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [uid]);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const markAsRead = async (notificationId: string) => {
    if (!uid) return;

    try {
      await updateDoc(doc(db, "studentNotifications", uid, "messages", notificationId), { read: true });
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Unable to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    if (!uid) return;

    const unread = notifications.filter((notification) => !notification.read);
    await Promise.all(unread.map((notification) => markAsRead(notification.id)));
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, error };
};
