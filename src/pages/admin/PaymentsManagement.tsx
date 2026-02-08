import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { TeacherPaymentRecord } from "@/data/teachers";
import { listenToTeacherPayments } from "@/lib/firebaseHelpers";
import { PaymentsTable } from "@/components/teacher/PaymentsTable";
import { PaymentDetailsDialog } from "@/components/teacher/PaymentDetailsDialog";

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<TeacherPaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<TeacherPaymentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Listen to payments
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = listenToTeacherPayments(
      (fetchedPayments) => {
        setPayments(fetchedPayments);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching payments:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter payments based on search term and active tab
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch = 
        payment.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === "all") return matchesSearch;
      return payment.status === activeTab && matchesSearch;
    });
  }, [payments, searchTerm, activeTab]);

  const handleViewPayment = (payment: TeacherPaymentRecord) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
  };

  const handlePaymentResolved = () => {
    // The payment was approved/rejected, refresh the list
    setSelectedPayment(null);
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Payment Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review and manage teacher payments
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search payments..."
                className="w-full rounded-xl pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="glass">
        <Tabs 
          defaultValue="all" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="flex flex-col space-y-4 p-6 pb-0 md:flex-row md:items-center md:justify-between md:space-y-0">
            <TabsList className="grid w-full grid-cols-3 md:w-fit">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              {filteredPayments.length} {filteredPayments.length === 1 ? 'payment' : 'payments'} found
            </div>
          </div>
          
          <CardContent className="p-6">
            <TabsContent value="all">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <PaymentsTable 
                  payments={filteredPayments} 
                  onViewPayment={handleViewPayment} 
                />
              )}
            </TabsContent>
            <TabsContent value="pending">
              <PaymentsTable 
                payments={filteredPayments.filter(p => p.status === "pending")} 
                onViewPayment={handleViewPayment} 
              />
            </TabsContent>
            <TabsContent value="approved">
              <PaymentsTable 
                payments={filteredPayments.filter(p => p.status === "approved")} 
                onViewPayment={handleViewPayment} 
              />
            </TabsContent>
            <TabsContent value="rejected">
              <PaymentsTable 
                payments={filteredPayments.filter(p => p.status === "rejected")} 
                onViewPayment={handleViewPayment} 
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {selectedPayment && (
        <PaymentDetailsDialog
          payment={selectedPayment}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onPaymentResolved={handlePaymentResolved}
        />
      )}
    </div>
  );
}
