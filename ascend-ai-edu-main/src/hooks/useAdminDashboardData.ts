import { useEffect, useMemo, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

type StudentDoc = {
  name?: string;
  department?: string;
  gpa?: number;
  attendance?: number;
  status?: string;
};

type TeacherDoc = {
  name?: string;
  subject?: string;
  feedbackScore?: number;
};

type AnalyticsDoc = {
  month?: string;
  avgGPA?: number;
  dropoutRate?: number;
  employability?: number;
};

type AlertDoc = {
  title?: string;
  message?: string;
  type?: string;
  date?: unknown;
};

const mapSnapshot = <T,>(snapshot: QuerySnapshot<DocumentData>): T[] =>
  snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));

const normaliseDate = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && "toDate" in (value as { toDate?: () => Date })) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch (error) {
      console.warn("Failed to convert Firestore timestamp", error);
      return null;
    }
  }
  return null;
};

export const useAdminDashboardData = () => {
  const [students, setStudents] = useState<StudentDoc[]>([]);
  const [teachers, setTeachers] = useState<TeacherDoc[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsDoc[]>([]);
  const [alerts, setAlerts] = useState<AlertDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState({ students: false, teachers: false, analytics: false, alerts: false });

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const handleError = (context: string) => (snapshotError: Error) => {
      console.error(`Firestore listener failed for ${context}`, snapshotError);
      setError(snapshotError.message);
      setLoaded((prev) => ({ ...prev, [context]: true }));
    };

    try {
      const studentsRef = collection(db, "students");
      unsubscribers.push(
        onSnapshot(
          studentsRef,
          (snapshot) => {
            setStudents(mapSnapshot<StudentDoc>(snapshot));
            setLoaded((prev) => ({ ...prev, students: true }));
          },
          handleError("students"),
        ),
      );
    } catch (listenerError) {
      console.error("Failed to establish students listener", listenerError);
      setError((listenerError as Error).message);
      setLoaded((prev) => ({ ...prev, students: true }));
    }

    try {
      const teachersRef = collection(db, "teachers");
      unsubscribers.push(
        onSnapshot(
          teachersRef,
          (snapshot) => {
            setTeachers(mapSnapshot<TeacherDoc>(snapshot));
            setLoaded((prev) => ({ ...prev, teachers: true }));
          },
          handleError("teachers"),
        ),
      );
    } catch (listenerError) {
      console.error("Failed to establish teachers listener", listenerError);
      setError((listenerError as Error).message);
      setLoaded((prev) => ({ ...prev, teachers: true }));
    }

    try {
      const analyticsRef = query(collection(db, "analytics"), orderBy("month"));
      unsubscribers.push(
        onSnapshot(
          analyticsRef,
          (snapshot) => {
            setAnalytics(mapSnapshot<AnalyticsDoc>(snapshot));
            setLoaded((prev) => ({ ...prev, analytics: true }));
          },
          handleError("analytics"),
        ),
      );
    } catch (listenerError) {
      console.error("Failed to establish analytics listener", listenerError);
      setError((listenerError as Error).message);
      setLoaded((prev) => ({ ...prev, analytics: true }));
    }

    try {
      const alertsRef = query(collection(db, "alerts"), orderBy("date", "desc"), limit(5));
      unsubscribers.push(
        onSnapshot(
          alertsRef,
          (snapshot) => {
            setAlerts(mapSnapshot<AlertDoc>(snapshot));
            setLoaded((prev) => ({ ...prev, alerts: true }));
          },
          handleError("alerts"),
        ),
      );
    } catch (listenerError) {
      console.error("Failed to establish alerts listener", listenerError);
      setError((listenerError as Error).message);
      setLoaded((prev) => ({ ...prev, alerts: true }));
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (unsubscribeError) {
          console.warn("Failed to clean Firestore listener", unsubscribeError);
        }
      });
    };
  }, []);

  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const averageGpa =
      totalStudents > 0
        ? students.reduce((acc, student) => acc + (Number(student.gpa) || 0), 0) / totalStudents
        : null;

    const dropoutCount = students.filter((student) => student.status?.toLowerCase() === "dropout").length;
    const dropoutRate = totalStudents > 0 ? (dropoutCount / totalStudents) * 100 : null;

    const latestAnalytics = [...analytics].sort((a, b) => {
      const monthA = a.month ?? "";
      const monthB = b.month ?? "";
      return monthA.localeCompare(monthB);
    })?.at(-1);

    const employabilityRate = typeof latestAnalytics?.employability === "number" ? latestAnalytics.employability : null;

    return {
      totalStudents,
      totalTeachers,
      averageGpa,
      dropoutRate,
      employabilityRate,
    };
  }, [students, teachers, analytics]);

  const gpaTrend = useMemo(
    () =>
      analytics.map((entry) => ({
        month: entry.month ?? "",
        avgGpa: typeof entry.avgGPA === "number" ? Number(entry.avgGPA.toFixed(2)) : 0,
        employability: typeof entry.employability === "number" ? entry.employability : 0,
        dropoutRate: typeof entry.dropoutRate === "number" ? entry.dropoutRate : 0,
      })),
    [analytics],
  );

  const departmentAggregates = useMemo(() => {
    const aggregate = new Map<
      string,
      {
        totalGpa: number;
        totalAttendance: number;
        count: number;
      }
    >();

    students.forEach((student) => {
      const department = student.department || "Unknown";
      const entry = aggregate.get(department) ?? { totalGpa: 0, totalAttendance: 0, count: 0 };

      if (typeof student.gpa === "number") {
        entry.totalGpa += student.gpa;
      }
      if (typeof student.attendance === "number") {
        entry.totalAttendance += student.attendance;
      }
      entry.count += 1;

      aggregate.set(department, entry);
    });

    return aggregate;
  }, [students]);

  const subjectPerformance = useMemo(
    () =>
      Array.from(departmentAggregates.entries()).map(([department, stats]) => ({
        department,
        averageGpa: stats.count > 0 ? Number((stats.totalGpa / stats.count).toFixed(2)) : 0,
      })),
    [departmentAggregates],
  );

  const attendanceByDepartment = useMemo(
    () =>
      Array.from(departmentAggregates.entries()).map(([department, stats]) => ({
        department,
        attendance: stats.count > 0 ? Number((stats.totalAttendance / stats.count).toFixed(2)) : 0,
      })),
    [departmentAggregates],
  );

  const alertsList = useMemo(
    () =>
      alerts.map((alert) => {
        const parsedDate = normaliseDate(alert.date);
        return {
          title: alert.title || "Untitled alert",
          message: alert.message || "",
          type: alert.type || "info",
          date: parsedDate?.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }),
    [alerts],
  );

  const isLoading = !loaded.students || !loaded.teachers || !loaded.analytics || !loaded.alerts;

  return {
    metrics,
    gpaTrend,
    subjectPerformance,
    attendanceByDepartment,
    alerts: alertsList,
    isLoading,
    error,
  };
};
