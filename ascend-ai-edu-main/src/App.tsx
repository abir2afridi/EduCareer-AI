import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Quiz from "./pages/student/Quiz";
import Courses from "./pages/Courses";
import Insights from "./pages/Insights";
import Tasks from "./pages/Tasks";
import Learning from "./pages/Learning";
import Analytics from "./pages/Analytics";
import Teachers from "./pages/Teachers";
import Assessments from "./pages/Assessments";
import Career from "./pages/Career";
import Reports from "./pages/Reports";
import Research from "./pages/Research";
import Assistant from "./pages/Assistant";
import Chat from "./pages/FriendsAndMessages";
import EmailInbox from "./pages/EmailInbox";
import EmailDetails from "./pages/EmailDetails";
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import CompleteProfile from "./pages/student/CompleteProfile";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentQuizResultsPage from "./pages/admin/StudentQuizResults";
import StudentManagementPage from "./pages/admin/StudentManagement";
import TeacherManagementPage from "./pages/admin/TeacherManagement";
import CourseManagementPage from "./pages/admin/CourseManagement";
import AssessmentsGradingPage from "./pages/admin/AssessmentsGrading";
import CareerEmployabilityPage from "./pages/admin/CareerEmployability";
import PerformanceAnalyticsPage from "./pages/admin/PerformanceAnalytics";
import ResearchPolicyPage from "./pages/admin/ResearchPolicy";
import ReportsExportsPage from "./pages/admin/ReportsExports";
import NotificationsPage from "./pages/admin/Notifications";
import ProfileChangeRequestsPage from "./pages/admin/ProfileChangeRequests";
import SystemSettingsPage from "./pages/admin/SystemSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/chat"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Chat />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Quiz />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Students />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Courses />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Insights />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Tasks />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learning"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Learning />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Analytics />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Teachers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Assessments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/career"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Career />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/research"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Research />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Assistant />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/email"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <EmailInbox />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/email/details"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <EmailDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Contact />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/adminlogin" element={<Navigate to="/admin/login" replace />} />
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <About />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagementPage />} />
            <Route path="teachers" element={<TeacherManagementPage />} />
            <Route path="courses" element={<CourseManagementPage />} />
            <Route path="assessments" element={<AssessmentsGradingPage />} />
            <Route path="career" element={<CareerEmployabilityPage />} />
            <Route path="analytics" element={<PerformanceAnalyticsPage />} />
            <Route path="research" element={<ResearchPolicyPage />} />
            <Route path="reports" element={<ReportsExportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile-requests" element={<ProfileChangeRequestsPage />} />
            <Route path="quiz-results" element={<StudentQuizResultsPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
          </Route>
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route
            path="/student/complete-profile"
            element={
              <ProtectedRoute>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Notifications />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
