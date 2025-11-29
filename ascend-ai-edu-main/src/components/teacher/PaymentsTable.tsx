import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeacherPaymentRecord, TeacherPaymentStatus } from "@/data/teachers";
import { Eye } from "lucide-react";

interface PaymentsTableProps {
  payments: TeacherPaymentRecord[];
  onViewPayment: (payment: TeacherPaymentRecord) => void;
}

export function PaymentsTable({ payments, onViewPayment }: PaymentsTableProps) {
  const getStatusVariant = (status: TeacherPaymentStatus) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
      default:
        return "outline";
    }
  };

  const formatCountdown = (payment: TeacherPaymentRecord) => {
    if (!payment.expiresAt || payment.status !== "approved") return "—";
    const expiresAtDate = payment.expiresAt.toDate();
    const diffMs = expiresAtDate.getTime() - Date.now();
    if (diffMs <= 0) return "Expired";

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No payment records found.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Teacher</TableHead>
          <TableHead>Student</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-center">Access</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="whitespace-nowrap">
              {payment.submittedAt ? format(payment.submittedAt.toDate(), "MMM d, yyyy") : "N/A"}
            </TableCell>
            <TableCell className="font-medium">{payment.teacherName || "N/A"}</TableCell>
            <TableCell>{payment.studentName || "Anonymous"}</TableCell>
            <TableCell className="text-right font-medium">
              ${payment.totalAmount.toFixed(2)}
              <div className="text-xs text-muted-foreground">
                {payment.months} {payment.months === 1 ? "month" : "months"} × ${payment.monthlyFee.toFixed(2)}
              </div>
            </TableCell>
            <TableCell className="text-center text-sm text-muted-foreground">
              {payment.status === "approved" && payment.expiresAt
                ? `${formatCountdown(payment)}
${format(payment.expiresAt.toDate(), "MMM d, yyyy")}`
                : "—"}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(payment.status)}>
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onViewPayment(payment)}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">View details</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
