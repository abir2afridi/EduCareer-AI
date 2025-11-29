import { useEffect, useState } from "react";
import type { TeacherRecord } from "@/data/teachers";
import { getTeacherDoc } from "@/lib/firebaseHelpers";

type UseTeacherDocumentResult = {
  teacher: TeacherRecord | null;
  isLoading: boolean;
  error: string | null;
};

export const useTeacherDocument = (teacherId?: string): UseTeacherDocumentResult => {
  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTeacher = async () => {
      if (!teacherId) {
        setTeacher(null);
        setError("Missing teacher id");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const record = await getTeacherDoc(teacherId);
        if (!isMounted) return;
        if (record) {
          setTeacher(record);
          setError(null);
        } else {
          setTeacher(null);
          setError("Teacher not found");
        }
      } catch (fetchError) {
        if (!isMounted) return;
        const message = fetchError instanceof Error ? fetchError.message : "Unable to load teacher";
        setError(message);
        setTeacher(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTeacher();

    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  return { teacher, isLoading, error };
};
