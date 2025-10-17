import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

type AdminNotificationType = "newStudent" | "updateStudent" | "deleteStudent";

type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  message: string;
  studentName: string;
  createdAt: Date | null;
  seen: boolean;
};

type UseAdminNotificationsResult = {
  notifications: AdminNotification[];
  unseenCount: number;
  markAsSeen: (notificationId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const notificationsCollection = collection(db, "adminNotifications");

export const useAdminNotifications = (): UseAdminNotificationsResult => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const notificationsQuery = query(notificationsCollection, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const nextNotifications: AdminNotification[] = snapshot.docs.map((notificationDoc) => {
          const data = notificationDoc.data();
          return {
            id: notificationDoc.id,
            type: data.type ?? "newStudent",
            message: data.message ?? "",
            studentName: data.studentName ?? "",
            createdAt: data.createdAt?.toDate?.() ?? null,
            seen: data.seen ?? false,
          };
        });

        setNotifications(nextNotifications);
        setIsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const unseenCount = useMemo(() => notifications.filter((notification) => !notification.seen).length, [notifications]);

  const markAsSeen = async (notificationId: string) => {
    try {
      await updateDoc(doc(notificationsCollection, notificationId), { seen: true });
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Unable to mark notification as seen");
    }
  };

  return { notifications, unseenCount, markAsSeen, isLoading, error };
};
