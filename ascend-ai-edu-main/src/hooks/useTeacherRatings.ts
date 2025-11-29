import { useEffect, useState } from "react";
import { listenToTeacherReviews } from "@/lib/firebaseHelpers";

export type TeacherRating = {
  averageRating: number;
  totalReviews: number;
};

export const useTeacherRatings = (teacherId?: string) => {
  const [rating, setRating] = useState<TeacherRating>({
    averageRating: 0,
    totalReviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = listenToTeacherReviews(
      teacherId,
      (reviews) => {
        if (reviews.length === 0) {
          setRating({ averageRating: 0, totalReviews: 0 });
          setIsLoading(false);
          return;
        }

        const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const average = parseFloat((total / reviews.length).toFixed(1));
        
        setRating({
          averageRating: average,
          totalReviews: reviews.length,
        });
        setIsLoading(false);
        setError(null);
      },
      (firestoreError) => {
        console.error("Error fetching teacher reviews:", firestoreError);
        setError(firestoreError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [teacherId]);

  return { rating, isLoading, error };
};

export const useTeacherRatingsBatch = (teacherIds: string[]) => {
  const [ratings, setRatings] = useState<Record<string, TeacherRating>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    if (teacherIds.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadingCount(0);
    const unsubscribes: (() => void)[] = [];
    const newRatings: Record<string, TeacherRating> = {};

    teacherIds.forEach((teacherId) => {
      const unsubscribe = listenToTeacherReviews(
        teacherId,
        (reviews) => {
          if (reviews.length === 0) {
            newRatings[teacherId] = { averageRating: 0, totalReviews: 0 };
          } else {
            const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            const average = parseFloat((total / reviews.length).toFixed(1));
            newRatings[teacherId] = {
              averageRating: average,
              totalReviews: reviews.length,
            };
          }

          setLoadingCount((prev) => {
            const newCount = prev + 1;
            if (newCount === teacherIds.length) {
              setRatings({ ...newRatings });
              setIsLoading(false);
            }
            return newCount;
          });
        },
        (firestoreError) => {
          console.error(`Error fetching reviews for teacher ${teacherId}:`, firestoreError);
          setError(firestoreError.message);
          setLoadingCount((prev) => {
            const newCount = prev + 1;
            if (newCount === teacherIds.length) {
              setIsLoading(false);
            }
            return newCount;
          });
        },
      );
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [teacherIds.join(",")]); // Re-run when teacherIds change

  return { ratings, isLoading, error };
};
