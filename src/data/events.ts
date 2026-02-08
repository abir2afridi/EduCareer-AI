import type { Timestamp } from "firebase/firestore";

export type UserEventPayload = {
  title: string;
  description?: string;
  date: Timestamp;
  time?: string | null;
  category?: string | null;
};

export type NewUserEventInput = {
  title: string;
  description?: string;
  date: Date;
  time?: string | null;
  category?: string | null;
};

export type UserEventRecord = UserEventPayload & {
  id: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

export type UserEventView = Omit<UserEventRecord, "date" | "createdAt" | "updatedAt"> & {
  date: Date;
  createdAt: Date;
  updatedAt?: Date;
};
