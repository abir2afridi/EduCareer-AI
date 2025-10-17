import { useMemo, useState, useCallback } from "react";
import { Loader2, Search, Check, X, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useProfileChangeRequests } from "@/hooks/useProfileChangeRequests";
import { useStudentsCollection } from "@/hooks/useStudentsCollection";
import { addStudentNotification, updateProfileChangeRequestStatus, updateStudentDoc } from "@/lib/firebaseHelpers";
import { serverTimestamp } from "firebase/firestore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const formatDate = (value: Date | null) => {
  if (!value) return "—";
  try {
    return value.toLocaleString();
  } catch (error) {
    return value.toString();
  }
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value === "number" && Number.isFinite(value)) return value.toString();
  return String(value);
};

const sanitizeRequestedPayload = (requestedData: Record<string, unknown>): Record<string, unknown> => {
  const payload: Record<string, unknown> = { ...requestedData };

  if (payload.gpa !== undefined && payload.gpa !== null) {
    const numeric = Number(payload.gpa);
    payload.gpa = Number.isFinite(numeric) ? numeric : null;
  }

  payload.lastProfileUpdateAt = serverTimestamp();
  payload.updatedAt = serverTimestamp();

  return payload;
};

export default function ProfileChangeRequestsPage() {
  const { toast } = useToast();
  const { requests, isLoading } = useProfileChangeRequests();
  const { students } = useStudentsCollection();

  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"approve" | "reject" | null>(null);
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});

  const studentsMap = useMemo(() => {
    const map = new Map<string, (typeof students)[number]>();
    students.forEach((student) => map.set(student.id, student));
    return map;
  }, [students]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return requests.filter((request) => {
      if (request.status !== "pending") return false;
      if (query.length === 0) return true;
      const student = studentsMap.get(request.uid);
      const studentName = student?.name ?? (typeof request.requestedData.name === "string" ? request.requestedData.name : "");
      return (
        request.uid.toLowerCase().includes(query) ||
        studentName.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery, studentsMap]);

  const isRequestExpanded = useCallback((requestId: string) => expandedRequests[requestId] ?? true, [expandedRequests]);

  const handleToggleRequest = useCallback((requestId: string, next: boolean) => {
    setExpandedRequests((prev) => ({ ...prev, [requestId]: next }));
  }, []);

  const handleApprove = async (requestId: string, uid: string, requestedData: Record<string, unknown>, studentName: string) => {
    setProcessingId(requestId);
    setProcessingAction("approve");

    toast({
      title: "Submitting…",
      description: "Processing the approval.",
    });

    try {
      const sanitizedPayload = sanitizeRequestedPayload(requestedData);
      await updateStudentDoc(uid, sanitizedPayload);
      await updateProfileChangeRequestStatus(requestId, "approved");
      await addStudentNotification({
        uid,
        title: "Profile change approved",
        message: "Your requested changes have been applied successfully.",
        type: "profile-change-status",
        metadata: { requestId, status: "approved" },
      });

      toast({
        title: "✅ Successfully submitted!",
        description: `${studentName} has been updated successfully.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to approve request.";
      toast({ title: "Approval failed", description: message, variant: "destructive" });
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (requestId: string, uid: string) => {
    setProcessingId(requestId);
    setProcessingAction("reject");

    toast({
      title: "Submitting…",
      description: "Processing the rejection.",
    });

    try {
      await updateProfileChangeRequestStatus(requestId, "rejected");
      await addStudentNotification({
        uid,
        title: "Profile change rejected",
        message: "Your requested changes were rejected.",
        type: "profile-change-status",
        metadata: { requestId, status: "rejected" },
      });

      toast({
        title: "✅ Successfully submitted!",
        description: "The student has been notified.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reject request.";
      toast({ title: "Rejection failed", description: message, variant: "destructive" });
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile change requests</h1>
          <p className="text-sm text-muted-foreground">Review and moderate student-submitted profile updates in real time.</p>
        </div>
        <div className="w-full max-w-xs">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or UID"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card className="border border-border/60">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Pending requests</CardTitle>
            <CardDescription>{filteredRequests.length} request(s) awaiting review.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading requests…
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <p className="text-sm font-medium">No pending requests</p>
              <p className="text-xs">New submissions will appear here instantly.</p>
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 pb-2">
              {filteredRequests.map((request) => {
                const student = studentsMap.get(request.uid);
                const studentName = student?.name ?? (typeof request.requestedData.name === "string" ? request.requestedData.name : "Unknown student");
                const isProcessing = processingId === request.id;
                const expanded = isRequestExpanded(request.id);

                return (
                  <Collapsible
                    key={request.id}
                    open={expanded}
                    onOpenChange={(next) => handleToggleRequest(request.id, next)}
                  >
                    <Card className="border border-border/60 bg-background/95 shadow-sm transition-shadow hover:shadow-md">
                      <CardHeader className="space-y-2">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-2 py-1 transition hover:border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            <div className="flex flex-1 flex-col gap-1 text-left">
                              <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="text-lg font-semibold text-foreground">{studentName}</CardTitle>
                                <Badge variant="outline" className="rounded-xl">
                                  Requested {formatDate(request.timestamp)}
                                </Badge>
                              </div>
                              <CardDescription className="text-xs font-mono text-muted-foreground">UID: {request.uid}</CardDescription>
                              {student && (
                                <p className="text-xs text-muted-foreground">Current department: {student.department || "Not set"} • University: {student.university || "Not set"}</p>
                              )}
                            </div>
                            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "rotate-0")} />
                          </button>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent className="px-6 pb-6 pt-0 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">Requested changes</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {Object.entries(request.requestedData).map(([field, value]) => {
                                const previousValue = student ? (student as Record<string, unknown>)[field] : undefined;
                                const newValue = formatValue(value);
                                const oldValue = formatValue(previousValue);
                                const changed = newValue !== oldValue;

                                return (
                                  <div key={field} className="rounded-xl border border-border/60 bg-background/80 p-3 shadow-[0_2px_8px_-6px_rgba(15,23,42,0.45)]">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field}</p>
                                    <p className={cn("mt-2 text-sm font-semibold", changed ? "text-emerald-500" : "text-foreground")}>New: {newValue}</p>
                                    <p className={cn("mt-1 text-xs", changed ? "text-rose-500" : "text-muted-foreground")}>Previous: {oldValue}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <Separator />
                          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="sm:w-36"
                              disabled={isProcessing}
                              onClick={() => handleReject(request.id, request.uid)}
                            >
                              {isProcessing && processingAction === "reject" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <X className="mr-2 h-4 w-4" />
                              )}
                              Reject
                            </Button>
                            <Button
                              type="button"
                              className="sm:w-40"
                              disabled={isProcessing}
                              onClick={() => handleApprove(request.id, request.uid, request.requestedData, studentName)}
                            >
                              {isProcessing && processingAction === "approve" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="mr-2 h-4 w-4" />
                              )}
                              Approve
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
