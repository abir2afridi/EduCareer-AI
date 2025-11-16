import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  Trash2,
  ShieldCheck,
  Loader2,
  Sparkles,
  BadgeCheck,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { useCareerDocuments } from "@/hooks/useCareerDocuments";

const MAX_FILE_SIZE_LABEL = "8MB";
const ACCEPTED_TYPES_LABEL = "PDF, PNG, JPG";

const ocrBadgeVariant = (status: string | undefined) => {
  switch (status) {
    case "success":
      return "default";
    case "no_text":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
};

const ocrStatusLabel = (status: string | undefined) => {
  switch (status) {
    case "success":
      return "OCR complete";
    case "no_text":
      return "No readable text";
    case "failed":
      return "OCR failed";
    case "pending":
      return "Analysing";
    default:
      return "Pending";
  }
};

export default function CareerDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { documents, isLoading, uploadState, uploadDocument, deleteDocument } = useCareerDocuments(user?.uid);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];
      try {
        await uploadDocument(file);
        toast({
          title: "Document uploaded",
          description: "We'll extract key details to support the AI recommendation stage.",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
        toast({ title: "Upload failed", description: message, variant: "destructive" });
      }
    },
    [toast, uploadDocument],
  );

  const onDropRejected = useCallback(
    (fileRejections: Parameters<ReturnType<typeof useDropzone>["onDropRejected"]>[0]) => {
      const [{ file, errors }] = fileRejections;
      const reason = errors[0]?.message ?? "Unsupported file";
      toast({
        title: `Cannot upload ${file.name}`,
        description: reason,
        variant: "destructive",
      });
    },
    [toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxSize: 8 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    onDrop,
    onDropRejected,
  });

  const handleDelete = async (docId: string) => {
    const doc = documents.find((item) => item.id === docId);
    if (!doc) return;
    try {
      await deleteDocument(doc);
      toast({ title: "Document removed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete document.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  const uploadIsBusy = uploadState.isUploading;

  return (
    <div className="space-y-8 pb-16">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="grid gap-4 rounded-3xl border border-border/50 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:bg-slate-950/75 lg:grid-cols-[1.2fr,1fr]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold tracking-tight">Upload academic evidence</h1>
              <p className="text-muted-foreground">
                Add up to three clear transcripts, certificates, or mark sheets. Our AI will verify document quality, extract
                relevant achievements, and blend them with your MCQ performance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> AI assisted OCR
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                Step 2 of 4
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {ACCEPTED_TYPES_LABEL} • &lt;= {MAX_FILE_SIZE_LABEL}
              </Badge>
            </div>
          </div>
          <Card className="border-border/60 bg-white/70 backdrop-blur-md dark:bg-slate-950/60">
            <CardHeader className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/15 p-2 text-primary">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">Quality tips</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Use scans instead of photos when possible. Ensure text and seals are readable. Low-confidence uploads will
                  trigger a warning so you can re-submit.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.05 }}>
        <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-lg">Upload zone</CardTitle>
              <CardDescription>Drop one document at a time. We securely store everything via Firebase Storage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                {...getRootProps()}
                className={cn(
                  "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border/70 bg-muted/20 p-8 text-center transition",
                  isDragActive && "border-primary bg-primary/10",
                  uploadIsBusy && "pointer-events-none opacity-60",
                )}
              >
                <input {...getInputProps()} />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {uploadIsBusy ? <Loader2 className="h-8 w-8 animate-spin" /> : <UploadCloud className="h-8 w-8" />}
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">Drag &amp; drop your document</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse — supported types: {ACCEPTED_TYPES_LABEL}, max size {MAX_FILE_SIZE_LABEL}.
                  </p>
                </div>
              </div>

              {uploadState.error ? (
                <Alert className="border-red-400 bg-red-50 text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-100">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadState.error.message}</AlertDescription>
                </Alert>
              ) : null}

              {uploadIsBusy ? (
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Uploading {uploadState.currentFileName ?? "document"}</p>
                    <p className="text-xs text-muted-foreground">Hang tight while we process and run OCR.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full text-xs">
                    {Math.round(uploadState.progress)}%
                  </Badge>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-lg">Why documents matter</CardTitle>
              <CardDescription>
                The AI analyses grades, subject coverage, and achievements to tailor your MCQ assessment and career map.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/60 p-3 dark:bg-slate-950/70">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Secure storage</p>
                  <p>Documents stay private to you and approved admins. We only store metadata needed for guidance.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/60 p-3 dark:bg-slate-950/70">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">OCR quality check</p>
                  <p>Automatic text extraction flags blurry scans and suggests re-uploads before assessment day.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/60 p-3 dark:bg-slate-950/70">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Career evidence</p>
                  <p>High-confidence documents strengthen recommendation accuracy and unlock more personalised advice.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card className="border-border/60 bg-white/95 backdrop-blur-md dark:bg-slate-950/80">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="text-lg">Uploaded documents</CardTitle>
            <CardDescription>
              We keep a running history so you always know which files were accepted and how the OCR performed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/20" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-muted-foreground">
                <p className="font-semibold text-foreground">No documents uploaded yet</p>
                <p className="mt-1 text-sm">Upload your first transcript or certificate to power the guidance engine.</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[420px] pr-3">
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm transition hover:border-primary/50 dark:bg-slate-950/70"
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex flex-1 items-start gap-3">
                          <div className="mt-1 rounded-xl bg-primary/10 p-2 text-primary">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{doc.filename}</p>
                              <Badge variant="outline" className="rounded-full text-[11px]">
                                {`${(doc.size / 1024 / 1024).toFixed(2)} MB`}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {doc.uploadedAt?.toDate ? formatDistanceToNow(doc.uploadedAt.toDate(), { addSuffix: true }) : "moments ago"}
                              {doc.metadataClassification ? ` • ${doc.metadataClassification}` : ""}
                            </p>
                            {doc.extractedTextSnippet ? (
                              <p className="text-xs text-muted-foreground">“{doc.extractedTextSnippet}”</p>
                            ) : null}
                            {doc.warnings && doc.warnings.length > 0 ? (
                              <div className="flex flex-col gap-1 text-xs text-amber-600 dark:text-amber-300">
                                {doc.warnings.map((warning, index) => (
                                  <div key={index} className="flex items-start gap-1">
                                    <AlertCircle className="mt-0.5 h-3 w-3" />
                                    <span>{warning}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={ocrBadgeVariant(doc.ocrStatus)} className="rounded-full text-xs">
                            {ocrStatusLabel(doc.ocrStatus)}
                            {doc.docConfidence !== undefined && doc.docConfidence !== null ? ` • ${Math.round(doc.docConfidence)}%` : ""}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{doc.contentType}</span>
                        <span>•</span>
                        <span>{doc.storagePath}</span>
                        {doc.downloadUrl ? (
                          <>
                            <span>•</span>
                            <a
                              href={doc.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-primary underline-offset-2 hover:underline"
                            >
                              Open in new tab
                            </a>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
