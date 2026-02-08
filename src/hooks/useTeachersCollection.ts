import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, type DocumentData, type QuerySnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import type { TeacherRecord } from "@/data/teachers";
import { normalizeTeacherRecord } from "@/lib/teacherNormalizer";

type UseTeachersCollectionResult = {
  teachers: TeacherRecord[];
  isLoading: boolean;
  error: string | null;
};

const mapSnapshot = (snapshot: QuerySnapshot<DocumentData>): TeacherRecord[] =>
  snapshot.docs.map((teacherDoc) => {
    const data = teacherDoc.data() as Partial<TeacherRecord> & DocumentData;

    return normalizeTeacherRecord(teacherDoc.id, data);
  });

export const useTeachersCollection = (): UseTeachersCollectionResult => {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const teachersRef = collection(db, "teachers");
    const teachersQuery = query(teachersRef, orderBy("teacherName"));

    const unsubscribe = onSnapshot(
      teachersQuery,
      (snapshot) => {
        setTeachers(mapSnapshot(snapshot));
        setIsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { teachers, isLoading, error };
};
