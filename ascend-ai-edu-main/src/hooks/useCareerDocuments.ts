import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type CareerDocumentRecord,
  type CareerDocumentMetadata,
  listenToCareerDocsMetadata,
  uploadCareerDoc,
  updateCareerDocMetadata,
  removeCareerDoc,
} from "@/lib/firebaseHelpers";
import { supabase } from "@/integrations/supabase/client";

const ACCEPTED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export type CareerDocumentUploadState = {
  isUploading: boolean;
  progress: number;
  currentFileName: string | null;
  error: Error | null;
};

export type UseCareerDocumentsResult = {
  documents: CareerDocumentRecord[];
  isLoading: boolean;
  uploadState: CareerDocumentUploadState;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (doc: CareerDocumentRecord) => Promise<void>;
};

const defaultUploadState: CareerDocumentUploadState = {
  isUploading: false,
  progress: 0,
  currentFileName: null,
  error: null,
};

type OcrResult = {
  extractedTextSnippet: string | null;
  docConfidence: number | null;
  warnings: string[];
  classification: string | null;
};

const parseJson = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (error) {
      const match = raw.match(/```json([\s\S]*?)```/i) || raw.match(/```([\s\S]*?)```/i);
      if (match?.[1]) {
        try {
          return JSON.parse(match[1].trim());
        } catch {
          return null;
        }
      }
      const braceStart = raw.indexOf("{");
      const braceEnd = raw.lastIndexOf("}");
      if (braceStart !== -1 && braceEnd > braceStart) {
        try {
          return JSON.parse(raw.slice(braceStart, braceEnd + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = (event) => reject(event instanceof Error ? event : new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const sanitizeFileName = (name: string): string => name.trim().replace(/\s+/g, " ");

const determineMimeByExtension = (file: File): string => {
  if (file.type) return file.type;
  const lowered = file.name.toLowerCase();
  if (lowered.endsWith(".pdf")) return "application/pdf";
  if (lowered.endsWith(".png")) return "image/png";
  if (lowered.endsWith(".jpg") || lowered.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
};

const isAcceptedFile = (file: File): boolean => {
  const type = determineMimeByExtension(file);
  if (ACCEPTED_MIME_TYPES.includes(type)) return true;
  const lowered = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => lowered.endsWith(extension));
};

const normalizeWarnings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "message" in item && typeof item.message === "string") {
        return item.message;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
};

const parseOcrResult = (payload: unknown): OcrResult => {
  const defaults: OcrResult = {
    extractedTextSnippet: null,
    docConfidence: null,
    warnings: [],
    classification: null,
  };

  if (!payload || typeof payload !== "object") return defaults;

  const candidate = payload as Record<string, unknown>;
  const snippetCandidate = candidate.extractedTextSnippet ?? candidate.snippet ?? candidate.preview ?? null;
  const confidenceCandidate = candidate.docConfidence ?? candidate.confidence ?? candidate.confidenceScore ?? null;
  const classificationCandidate = candidate.classification ?? candidate.category ?? null;
  const warningsCandidate = candidate.warnings ?? candidate.flags ?? [];

  return {
    extractedTextSnippet: typeof snippetCandidate === "string" ? snippetCandidate.slice(0, 400) : defaults.extractedTextSnippet,
    docConfidence:
      typeof confidenceCandidate === "number"
        ? Math.min(100, Math.max(0, confidenceCandidate))
        : defaults.docConfidence,
    warnings: normalizeWarnings(warningsCandidate),
    classification: typeof classificationCandidate === "string" ? classificationCandidate : defaults.classification,
  };
};

export function useCareerDocuments(uid?: string | null): UseCareerDocumentsResult {
  const [documents, setDocuments] = useState<CareerDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadState, setUploadState] = useState<CareerDocumentUploadState>(defaultUploadState);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!uid) {
      setDocuments([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const unsubscribe = listenToCareerDocsMetadata(
      uid,
      (records) => {
        setDocuments(records);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, [uid]);

  useEffect(
    () => () => {
      if (uploadAbortRef.current) {
        uploadAbortRef.current.abort();
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    },
    [],
  );

  const enrichDocumentMetadata = useCallback(
    async (file: File, document: CareerDocumentRecord) => {
      if (!uid) return;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const [, base64Payload = ""] = dataUrl.split(",");
        const truncatedBase64 = base64Payload.length > 35000 ? `${base64Payload.slice(0, 35000)}...` : base64Payload;

        const prompt = [
          "You are an OCR triage assistant helping a career guidance system validate academic documents.",
          "You will receive metadata and a base64 payload (may be truncated).",
          "Respond with STRICT JSON including keys: extractedTextSnippet (<=240 chars), docConfidence (0-100 number), classification (string), warnings (array of strings).",
          "If the content does not look like an academic certificate / transcript, set docConfidence <= 35 and add a warning advising reupload.",
          "If you cannot read the text, set extractedTextSnippet to 'No readable text detected.' and docConfidence <= 20.",
          "Document metadata follows:",
          `Filename: ${sanitizeFileName(file.name)}`,
          `Content-Type: ${determineMimeByExtension(file)}`,
          `SizeBytes: ${file.size}`,
          "Base64Payload:",
          truncatedBase64,
        ].join("\n");

        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: {
            message: prompt,
            conversationHistory: [],
          },
        });

        if (error) throw error;

        const parsed = parseJson(data?.reply ?? data) ?? parseJson(JSON.stringify(data ?? {}));
        const ocrResult = parseOcrResult(parsed);

        let updates: Partial<CareerDocumentMetadata> = {
          extractedTextSnippet: ocrResult.extractedTextSnippet,
          docConfidence: ocrResult.docConfidence,
          warnings: ocrResult.warnings,
          ocrStatus:
            ocrResult.extractedTextSnippet && ocrResult.extractedTextSnippet !== "No readable text detected."
              ? "success"
              : "no_text",
        };

        if (ocrResult.classification) {
          updates = {
            ...updates,
            metadataClassification: ocrResult.classification,
          };
        }

        await updateCareerDocMetadata(uid, document.id, updates as CareerDocumentMetadata);
      } catch (ocrError) {
        console.warn("OCR enrichment failed", ocrError);
        await updateCareerDocMetadata(uid, document.id, {
          ocrStatus: "failed",
          warnings: ["We couldn't extract text automatically. Please ensure the document is clear."],
        });
      }
    },
    [uid],
  );

  const uploadDocument = useCallback(
    async (file: File) => {
      if (!uid) throw new Error("You must be signed in to upload documents.");
      if (uploadState.isUploading) throw new Error("Another document is currently uploading.");

      if (!isAcceptedFile(file)) {
        throw new Error("Unsupported file type. Please upload a PDF or clear image (PNG/JPG).");
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error("File is too large. Maximum allowed size is 8MB.");
      }

      setUploadState({ isUploading: true, progress: 10, currentFileName: file.name, error: null });
      uploadAbortRef.current = new AbortController();

      try {
        const storedDocument = await uploadCareerDoc(uid, file);
        setUploadState((prev) => ({ ...prev, progress: 65 }));

        await enrichDocumentMetadata(file, storedDocument);
        setUploadState({ isUploading: false, progress: 100, currentFileName: file.name, error: null });
        resetTimeoutRef.current = window.setTimeout(() => {
          setUploadState({ ...defaultUploadState });
          resetTimeoutRef.current = null;
        }, 800);
      } catch (error) {
        console.error("Document upload failed", error);
        setUploadState({ isUploading: false, progress: 0, currentFileName: null, error: error instanceof Error ? error : new Error("Upload failed") });
      } finally {
        uploadAbortRef.current = null;
      }
    },
    [uid, uploadState.isUploading, enrichDocumentMetadata],
  );

  const deleteDocument = useCallback(
    async (doc: CareerDocumentRecord) => {
      if (!uid) throw new Error("You must be signed in to delete documents.");
      await removeCareerDoc(uid, doc.id, doc.storagePath);
    },
    [uid],
  );

  const orderedDocuments = useMemo(
    () =>
      [...documents].sort((a, b) => {
        const aTime = a.uploadedAt?.toMillis?.() ?? 0;
        const bTime = b.uploadedAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      }),
    [documents],
  );

  return {
    documents: orderedDocuments,
    isLoading,
    uploadState,
    uploadDocument,
    deleteDocument,
  };
}
