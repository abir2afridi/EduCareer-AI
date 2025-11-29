import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveTeacherPayment, rejectTeacherPayment } from "@/lib/firebaseHelpers";
import type { TeacherPaymentRecord } from "@/data/teachers";
import { Loader2, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface PaymentDetailsDialogProps {
  payment: TeacherPaymentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentResolved: () => void;
}

export function PaymentDetailsDialog({ payment, open, onOpenChange, onPaymentResolved }: PaymentDetailsDialogProps) {
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (open) {
      setNotes(payment?.notes ?? "");
    }
  }, [open, payment]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const expiresAtDate = useMemo(() => (payment?.expiresAt ? payment.expiresAt.toDate() : null), [payment]);
  const approvalDate = useMemo(() => (payment?.approvedAt ? payment.approvedAt.toDate() : null), [payment]);

  const countdown = useMemo(() => {
    if (!expiresAtDate) return null;
    const diffMs = expiresAtDate.getTime() - now;
    if (diffMs <= 0) return "Expired";

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }, [expiresAtDate, now]);

  const handleApprove = async () => {
    if (!payment) return;
    
    setIsProcessing(true);
    try {
      const trimmedNotes = notes.trim();
      await approveTeacherPayment(payment.id, { notes: trimmedNotes ? trimmedNotes : undefined });
      toast({
        title: "Payment Approved",
        description: `Payment for ${payment.teacherName} has been approved.`,
      });
      onPaymentResolved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error approving payment:", error);
      toast({
        title: "Error",
        description: "Failed to approve payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!payment) return;

    setIsProcessing(true);
    try {
      const trimmedNotes = notes.trim();
      await rejectTeacherPayment(payment.id, { notes: trimmedNotes ? trimmedNotes : undefined });
      toast({
        title: "Payment Rejected",
        description: `Payment for ${payment.teacherName} has been rejected.`,
      });
      onPaymentResolved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast({
        title: "Error",
        description: "Failed to reject payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!payment) return null;

  const isResolved = payment.status !== "pending";
  const isPending = payment.status === "pending";
  const isRejected = payment.status === "rejected";
  const showNotesInput = isPending || isRejected;
  const formattedDate = payment.submittedAt ? format(payment.submittedAt.toDate(), "PPpp") : "N/A";
  const formattedResolvedDate = payment.resolvedAt ? format(payment.resolvedAt.toDate(), "PPpp") : "N/A";
  const formattedExpiresAt = expiresAtDate ? format(expiresAtDate, "PPpp") : "N/A";
  const formattedApprovedAt = approvalDate ? format(approvalDate, "PPpp") : formattedResolvedDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Review payment details and take appropriate action.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Teacher</Label>
              <p className="font-medium">{payment.teacherName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Student</Label>
              <p className="font-medium">{payment.studentName || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Months</Label>
              <p>{payment.months}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Monthly Fee</Label>
              <p>${payment.monthlyFee.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Total Amount</Label>
              <p className="font-semibold">${payment.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Transaction ID</Label>
            <p className="font-mono text-sm bg-muted p-2 rounded-md">{payment.transactionId}</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Submitted At</Label>
            <p>{formattedDate}</p>
          </div>

          {payment.status === "approved" && (
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Approved At</Label>
                <p className="font-medium text-foreground">{formattedApprovedAt}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Access Expires</Label>
                <p className="font-medium text-foreground">{formattedExpiresAt}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-primary">
                  <Hourglass className="h-3.5 w-3.5" />
                  <span>{countdown ?? "Expired"}</span>
                </div>
              </div>
            </div>
          )}

          {isResolved && (
            <div>
              <Label className="text-muted-foreground text-sm">
                {payment.status === "approved" ? "Approved" : "Rejected"} At
              </Label>
              <p>{formattedResolvedDate}</p>
              {payment.notes && (
                <div className="mt-2">
                  <Label className="text-muted-foreground text-sm">Notes</Label>
                  <p className="whitespace-pre-line bg-muted p-3 rounded-md">{payment.notes}</p>
                </div>
              )}
            </div>
          )}

          {showNotesInput && (
            <div className="space-y-2">
              <Label htmlFor="notes">{isRejected ? "Notes for approval (optional)" : "Notes (optional)"}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or reason for rejection"
                className="min-h-[100px]"
              />
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex items-center">
            {isResolved && (
              <div className="flex items-center text-sm text-muted-foreground">
                {payment.status === "approved" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive mr-2" />
                )}
                Payment has been {payment.status}
              </div>
            )}
          </div>
          
          <div className="space-x-2">
            {isPending && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Approve
                </Button>
              </>
            )}
            {isRejected && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isProcessing}
                >
                  Close
                </Button>
                <Button onClick={handleApprove} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Re-approve
                </Button>
              </>
            )}
            {payment.status === "approved" && (
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
