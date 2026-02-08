import { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicRoute;
