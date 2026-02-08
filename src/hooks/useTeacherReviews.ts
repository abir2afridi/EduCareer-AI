import { useEffect, useState } from "react";
import type { TeacherReviewRecord } from "@/data/teachers";
import { listenToTeacherReviews } from "@/lib/firebaseHelpers";

export type UseTeacherReviewsResult = {
  reviews: TeacherReviewRecord[];
  isLoading: boolean;
  error: string | null;
};

export const useTeacherReviews = (teacherId?: string): UseTeacherReviewsResult => {
  const [reviews, setReviews] = useState<TeacherReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setReviews([]);
      setIsLoading(false);
      setError("Missing teacher id");
      return;
    }

    setIsLoading(true);
    const unsubscribe = listenToTeacherReviews(
      teacherId,
      (records) => {
        setReviews(records);
        setIsLoading(false);
        setError(null);
      },
      (firestoreError) => {
        setError(firestoreError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [teacherId]);

  return { reviews, isLoading, error };
};
