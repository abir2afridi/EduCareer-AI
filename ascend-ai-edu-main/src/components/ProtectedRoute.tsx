import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useToast } from "@/components/ui/use-toast";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();
  const routeState = (location.state as { bypassProfileCheck?: boolean } | null) ?? null;
  const sessionBypass =
    typeof window !== "undefined" && window.sessionStorage.getItem("profile-bypass") === "true";
  const { toast } = useToast();
  const { profile, isLoading: isProfileLoading, error: profileError } = useStudentProfile(user?.uid ?? null);
  const isOnProfileRoute = location.pathname.startsWith("/student/complete-profile");
  const bypassProfileCheck = routeState?.bypassProfileCheck === true || sessionBypass;
  const profileCompleted = profile?.profileCompleted === true;

  useEffect(() => {
    if (profileError) {
      toast({
        title: "Unable to verify profile",
        description: profileError,
        variant: "destructive",
      });
    }
  }, [profileError, toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!profileCompleted) return;
    window.sessionStorage.removeItem("profile-bypass");
  }, [profileCompleted]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileCompleted && !isOnProfileRoute && !bypassProfileCheck) {
    return <Navigate to="/student/complete-profile" replace state={{ from: location }} />;
  }

  if (profileCompleted && isOnProfileRoute && !bypassProfileCheck) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
