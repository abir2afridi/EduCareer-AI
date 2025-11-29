import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import type { StudentTeacherHireRecord } from "@/hooks/useStudentTeacherHire";

export type UseStudentTeacherHiresResult = {
  hires: StudentTeacherHireRecord[];
  isLoading: boolean;
  error: string | null;
};

export const useStudentTeacherHires = (studentId?: string | null): UseStudentTeacherHiresResult => {
  const [hires, setHires] = useState<StudentTeacherHireRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(studentId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setHires([]);
      setIsLoading(false);
      return;
    }

    const hiresRef = collection(db, "students", studentId, "hiredTeachers");
    const hiresQuery = query(hiresRef, orderBy("expiresAt", "desc"));

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      hiresQuery,
      (snapshot) => {
        const records: StudentTeacherHireRecord[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as Partial<StudentTeacherHireRecord> & DocumentData;
          return {
            teacherId: docSnapshot.id,
            teacherName: typeof data.teacherName === "string" ? data.teacherName : null,
            paymentId: typeof data.paymentId === "string" ? data.paymentId : null,
            months: typeof data.months === "number" ? data.months : undefined,
            monthlyFee: typeof data.monthlyFee === "number" ? data.monthlyFee : undefined,
            totalAmount: typeof data.totalAmount === "number" ? data.totalAmount : undefined,
            transactionId: typeof data.transactionId === "string" ? data.transactionId : undefined,
            status: typeof data.status === "string" ? data.status : undefined,
            approvedAt: data.approvedAt ?? undefined,
            updatedAt: data.updatedAt ?? undefined,
            expiresAt: data.expiresAt ?? undefined,
          } satisfies StudentTeacherHireRecord;
        });
        setHires(records);
        setIsLoading(false);
        setError(null);
      },
      (listenerError) => {
        setError(listenerError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [studentId]);

  return { hires, isLoading, error };
};
