import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, type FirestoreError, type QuerySnapshot, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export type ProfileChangeRequest = {
  id: string;
  uid: string;
  requestedData: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  timestamp: Date | null;
};

export type UseProfileChangeRequestsResult = {
  requests: ProfileChangeRequest[];
  isLoading: boolean;
  error: string | null;
};

const profileChangeRequestsCollection = collection(db, "profileChangeRequests");

const mapSnapshot = (snapshot: QuerySnapshot<DocumentData>): ProfileChangeRequest[] => (
  snapshot.docs.map((requestDoc) => {
    const data = requestDoc.data();
    return {
      id: requestDoc.id,
      uid: data.uid ?? "",
      requestedData: data.requestedData ?? {},
      status: data.status ?? "pending",
      timestamp: data.timestamp?.toDate?.() ?? null,
    } satisfies ProfileChangeRequest;
  })
);

export const useProfileChangeRequests = (): UseProfileChangeRequestsResult => {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestsQuery = query(profileChangeRequestsCollection, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        setRequests(mapSnapshot(snapshot));
        setIsLoading(false);
      },
      (snapshotError: FirestoreError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const sortedRequests = useMemo(() => requests, [requests]);

  return { requests: sortedRequests, isLoading, error };
};
