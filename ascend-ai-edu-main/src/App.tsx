import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Learning from "./pages/Learning";
import Analytics from "./pages/Analytics";
import Teachers from "./pages/Teachers";
import Assessments from "./pages/Assessments";
import Career from "./pages/Career";
import Research from "./pages/Research";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";
import { DashboardLayout } from "./components/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/students" element={<DashboardLayout><Students /></DashboardLayout>} />
          <Route path="/learning" element={<DashboardLayout><Learning /></DashboardLayout>} />
          <Route path="/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
          <Route path="/teachers" element={<DashboardLayout><Teachers /></DashboardLayout>} />
          <Route path="/assessments" element={<DashboardLayout><Assessments /></DashboardLayout>} />
          <Route path="/career" element={<DashboardLayout><Career /></DashboardLayout>} />
          <Route path="/research" element={<DashboardLayout><Research /></DashboardLayout>} />
          <Route path="/assistant" element={<DashboardLayout><Assistant /></DashboardLayout>} />
          <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
