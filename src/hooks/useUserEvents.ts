import { useEffect, useMemo, useState } from "react";
import type { UserEventRecord, UserEventView } from "@/data/events";
import { listenToUserEvents } from "@/lib/firebaseHelpers";

const transformEventRecord = (record: UserEventRecord): UserEventView => {
  const date = record.date.toDate();
  const createdAt = record.createdAt.toDate();
  const updatedAt = record.updatedAt?.toDate();

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? undefined,
    date,
    time: record.time ?? undefined,
    category: record.category ?? undefined,
    createdAt,
    updatedAt,
  };
};

export type UseUserEventsResult = {
  events: UserEventView[];
  isLoading: boolean;
  error: string | null;
};

export const useUserEvents = (uid: string | null | undefined): UseUserEventsResult => {
  const [events, setEvents] = useState<UserEventView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = listenToUserEvents(
      uid,
      (records) => {
        const transformed = records.map(transformEventRecord);
        setEvents(transformed);
        setIsLoading(false);
        setError(null);
      },
      (firestoreError) => {
        setError(firestoreError.message);
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [uid]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  return { events: sortedEvents, isLoading, error };
};
