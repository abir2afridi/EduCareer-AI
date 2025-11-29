import type { SocialLinks, TeacherRecord } from "@/data/teachers";

const SOCIAL_LINK_KEYS = [
  "linkedin",
  "twitter",
  "facebook",
  "whatsapp",
  "github",
  "researchGate",
  "googleScholar",
] as const;

type SocialLinkKey = (typeof SOCIAL_LINK_KEYS)[number];

const isSocialLinkKey = (value: string): value is SocialLinkKey =>
  SOCIAL_LINK_KEYS.includes(value as SocialLinkKey);

type FirestoreTeacherData = Partial<TeacherRecord> & Record<string, unknown>;

export const normalizeSocialLinks = (links: unknown): SocialLinks | undefined => {
  if (!links || typeof links !== "object") return undefined;

  const normalized: SocialLinks = {};

  for (const [rawKey, rawValue] of Object.entries(links as Record<string, unknown>)) {
    if (!isSocialLinkKey(rawKey) || typeof rawValue !== "string") continue;
    const trimmed = rawValue.trim();
    if (!trimmed) continue;
    normalized[rawKey] = trimmed;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

export const sanitizeMonthlyFee = (value: unknown): number => {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return Math.round(numericValue * 100) / 100;
};

export const sanitizeHiredStudents = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const filtered = value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim());

  return Array.from(new Set(filtered));
};

export const normalizeTeacherRecord = (id: string, data: FirestoreTeacherData): TeacherRecord => {
  const trimmedName = typeof data.teacherName === "string" ? data.teacherName.trim() : "";

  return {
    id,
    teacherName: trimmedName.length > 0 ? trimmedName : "Unnamed Teacher",
    subject: typeof data.subject === "string" ? data.subject : "Subject not set",
    email: typeof data.email === "string" ? data.email : "",
    qualification: typeof data.qualification === "string" ? data.qualification : "",
    qualificationDetails: typeof data.qualificationDetails === "string" ? data.qualificationDetails : undefined,
    institution: typeof data.institution === "string" ? data.institution : undefined,
    experience: typeof data.experience === "string" ? data.experience : "",
    description: typeof data.description === "string" ? data.description : "",
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : "",
    socialLinks: normalizeSocialLinks(data.socialLinks),
    monthlyFee: sanitizeMonthlyFee(data.monthlyFee),
    hiredStudents: sanitizeHiredStudents(data.hiredStudents),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } satisfies TeacherRecord;
};

export const sanitizeTeacherWritePayload = <T extends Partial<TeacherRecord>>(payload: T) => {
  const sanitized: Partial<TeacherRecord> = { ...payload };

  if ("monthlyFee" in payload) {
    sanitized.monthlyFee = sanitizeMonthlyFee(payload.monthlyFee);
  }

  if ("hiredStudents" in payload) {
    sanitized.hiredStudents = sanitizeHiredStudents(payload.hiredStudents);
  }

  if ("socialLinks" in payload) {
    sanitized.socialLinks = normalizeSocialLinks(payload.socialLinks) ?? undefined;
  }

  return sanitized;
};
