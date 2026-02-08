import { useEffect, useState } from "react";
import type { DocumentData, QuerySnapshot } from "firebase/firestore";
import { getStudentsSnapshot } from "@/lib/firebaseHelpers";

type NullableDate = Date | null;

type RawStudentDoc = {
  name?: string;
  email?: string;
  dob?: string;
  gender?: string;
  department?: string;
  university?: string;
  rollNumber?: string;
  contactNumber?: string;
  address?: string;
  gpa?: number | string | null;
  skills?: unknown;
  profilePicture?: string;
  profilePictureUrl?: string;
  profileCompleted?: boolean;
  lastProfileUpdateAt?: { toDate?: () => Date };
  updatedAt?: { toDate?: () => Date };
  createdAt?: { toDate?: () => Date };
  emergencyContact?: string;
};

export type StudentRecord = {
  id: string;
  name: string;
  email: string;
  dob: string;
  gender: string;
  department: string;
  university: string;
  rollNumber: string;
  contactNumber: string;
  address: string;
  gpa: number | null;
  skills: string[];
  profilePicture: string;
  profileCompleted: boolean;
  lastProfileUpdateAt: NullableDate;
  updatedAt: NullableDate;
  createdAt: NullableDate;
  profilePictureUrl: string;
  emergencyContact: string;
};

type UseStudentsCollectionResult = {
  students: StudentRecord[];
  isLoading: boolean;
  error: string | null;
};

const mapSnapshot = (snapshot: QuerySnapshot<DocumentData>): StudentRecord[] =>
  snapshot.docs.map((studentDoc) => {
    const data = studentDoc.data() as RawStudentDoc;
    const gpaValue = typeof data.gpa === "number" ? data.gpa : data.gpa ? Number(data.gpa) : null;

    return {
      id: studentDoc.id,
      name: data.name ?? "",
      email: data.email ?? "",
      dob: data.dob ?? "",
      gender: data.gender ?? "",
      department: data.department ?? "",
      university: data.university ?? "",
      rollNumber: data.rollNumber ?? "",
      contactNumber: data.contactNumber ?? "",
      address: data.address ?? "",
      gpa: Number.isFinite(gpaValue) ? (gpaValue as number) : null,
      skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
      profilePicture: typeof data.profilePicture === "string" ? data.profilePicture : data.profilePictureUrl ?? "",
      profilePictureUrl: data.profilePictureUrl ?? data.profilePicture ?? "",
      profileCompleted: data.profileCompleted === true,
      lastProfileUpdateAt: data.lastProfileUpdateAt?.toDate?.() ?? null,
      updatedAt: data.updatedAt?.toDate?.() ?? null,
      createdAt: data.createdAt?.toDate?.() ?? null,
      emergencyContact: data.emergencyContact ?? "",
    };
  });

export const useStudentsCollection = (): UseStudentsCollectionResult => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = getStudentsSnapshot(
      (snapshot) => {
        setStudents(mapSnapshot(snapshot));
        setIsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { students, isLoading, error };
};
