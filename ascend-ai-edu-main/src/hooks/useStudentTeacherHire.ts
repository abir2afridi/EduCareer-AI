import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export type StudentTeacherHireRecord = {
  teacherId: string;
  teacherName?: string | null;
  paymentId?: string | null;
  months?: number;
  monthlyFee?: number;
  totalAmount?: number;
  transactionId?: string;
  status?: string;
  approvedAt?: unknown;
  updatedAt?: unknown;
  expiresAt?: unknown;
};

export type UseStudentTeacherHireResult = {
  hire: StudentTeacherHireRecord | null;
  isLoading: boolean;
  error: string | null;
};

export const useStudentTeacherHire = (
  studentId?: string | null,
  teacherId?: string | null,
): UseStudentTeacherHireResult => {
  const [hire, setHire] = useState<StudentTeacherHireRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(studentId && teacherId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !teacherId) {
      setHire(null);
      setIsLoading(false);
      return;
    }

    const hireDocRef = doc(db, "students", studentId, "hiredTeachers", teacherId);
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      hireDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setHire(null);
        } else {
          setHire({ teacherId: snapshot.id, ...(snapshot.data() as StudentTeacherHireRecord) });
        }
        setIsLoading(false);
        setError(null);
      },
      (listenerError) => {
        setError(listenerError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [studentId, teacherId]);

  return { hire, isLoading, error };
};
