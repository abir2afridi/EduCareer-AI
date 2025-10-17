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

  useEffect(() => {
    if (profileError) {
      toast({
        title: "Unable to verify profile",
        description: profileError,
        variant: "destructive",
      });
    }
  }, [profileError, toast]);

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

  const isOnProfileRoute = location.pathname.startsWith("/student/complete-profile");
  const bypassProfileCheck = routeState?.bypassProfileCheck === true;
  const profileCompleted = profile?.profileCompleted === true;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (profileCompleted) {
      window.sessionStorage.removeItem("profile-bypass");
    }
  }, [profileCompleted]);

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileCompleted && !isOnProfileRoute && !bypassProfileCheck && !sessionBypass) {
    return <Navigate to="/student/complete-profile" replace state={{ from: location }} />;
  }

  if (profileCompleted && isOnProfileRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
