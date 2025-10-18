import { useEffect, useState } from "react";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export type StudentProfile = {
  id: string;
  name?: string;
  dob?: string;
  gender?: string;
  department?: string;
  university?: string;
  rollNumber?: string;
  contactNumber?: string;
  address?: string;
  email?: string;
  gpa?: number;
  profilePictureUrl?: string;
  skills?: string[];
  emergencyContact?: string;
  profileCompleted?: boolean;
  lastProfileUpdateAt?: unknown;
  createdAt?: unknown;
  profileChangePending?: boolean;
  profileChangeLastApprovedAt?: unknown;
  profileChangeLastRejectedAt?: unknown;
  profileChangeLastSubmissionAt?: unknown;
};

type UseStudentProfileResult = {
  profile: StudentProfile | null;
  isLoading: boolean;
  error: string | null;
};

export const useStudentProfile = (uid?: string | null): UseStudentProfileResult => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const documentRef = doc(db, "students", uid);

    const unsubscribe = onSnapshot(
      documentRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setProfile(null);
        } else {
          const data = snapshot.data() as DocumentData;
          setProfile({ id: snapshot.id, ...data });
        }
        setIsLoading(false);
      },
      (listenerError) => {
        console.error("Failed to load student profile", listenerError);
        setError(listenerError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [uid]);

  return { profile, isLoading, error };
};
