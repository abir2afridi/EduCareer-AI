import type { Timestamp } from "firebase/firestore";

export type SocialLinks = {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  whatsapp?: string;
  github?: string;
  researchGate?: string;
  googleScholar?: string;
};

export type TeacherPayload = {
  teacherName: string;
  subject: string;
  email: string;
  qualification: string;
  qualificationDetails?: string;
  institution?: string;
  experience: string;
  description: string;
  avatarUrl: string;
  socialLinks?: SocialLinks;
  monthlyFee: number;
  hiredStudents?: string[];
};

export type TeacherRecord = TeacherPayload & {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export const emptyTeacher: TeacherRecord = {
  id: "",
  teacherName: "",
  subject: "",
  email: "",
  qualification: "",
  qualificationDetails: "",
  institution: "",
  experience: "",
  description: "",
  avatarUrl: "",
  socialLinks: {},
  monthlyFee: 0,
  hiredStudents: [],
};

export type TeacherPaymentStatus = "pending" | "approved" | "rejected";

export type TeacherPaymentPayload = {
  studentId: string;
  studentUid?: string;
  studentName?: string;
  teacherId: string;
  teacherName?: string;
  months: number;
  monthlyFee: number;
  totalAmount: number;
  transactionId: string;
  status?: TeacherPaymentStatus;
  notes?: string;
  expiresAt?: Timestamp;
  approvedAt?: Timestamp;
  hireRequestId?: string;
};

export type TeacherPaymentRecord = TeacherPaymentPayload & {
  id: string;
  submittedAt?: Timestamp;
  updatedAt?: Timestamp;
  resolvedAt?: Timestamp;
};

export type TeacherHireRequestStatus = "pending" | "approved" | "rejected";

export type TeacherHireRequestPayload = {
  studentUid: string;
  studentName?: string;
  teacherId: string;
  teacherName?: string;
  months: number;
  monthlyFee: number;
  totalAmount: number;
  transactionId: string;
  paymentId?: string;
  status?: TeacherHireRequestStatus;
  notes?: string;
};

export type TeacherHireRequestRecord = TeacherHireRequestPayload & {
  id: string;
  submittedAt?: Timestamp;
  updatedAt?: Timestamp;
  resolvedAt?: Timestamp;
};

export type TeacherReviewPayload = {
  studentId: string;
  studentName?: string;
  rating: number;
  review: string;
};

export type TeacherReviewRecord = TeacherReviewPayload & {
  id: string; // studentId = review document id
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
