import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";

export default function AdminLogin() {
  const { login, isLoading } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("abir2afridi@gmail.com");
  const [password, setPassword] = useState("220031");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      const success = await login({ email, password });
      setIsSubmitting(false);

      if (!success) {
        toast({
          variant: "destructive",
          title: "Invalid credentials",
          description: "Please verify your email and password and try again.",
        });
        return;
      }

      toast({
        title: "Welcome back, Admin!",
        description: "Redirecting to the admin dashboard...",
      });

      const redirectTo = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/admin/dashboard";
      navigate(redirectTo, { replace: true });
    },
    [email, password, login, toast, navigate, location.state],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.3),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.25),_transparent_45%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("w-full max-w-md")}
        >
          <Card className="border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.75)]">
            <CardHeader className="space-y-2 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
              >
                <span className="text-2xl font-bold text-primary">EA</span>
              </motion.div>
              <CardTitle className="text-2xl font-semibold text-white">🔐 Admin Login Portal</CardTitle>
              <p className="text-sm text-slate-300">
                Access the EduCareer AI admin console to monitor performance, manage cohorts, and configure the platform.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2 text-left">
                  <Label htmlFor="admin-email" className="text-slate-200">
                    Email
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="admin@educareer.ai"
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="admin-password" className="text-slate-200">
                    Password
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Enter your admin password"
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary via-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? "Authenticating..." : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
