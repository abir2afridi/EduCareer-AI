import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, GraduationCap, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth-provider";

type FormErrors = Record<string, string>;

type SignInForm = {
  email: string;
  password: string;
};

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.78-.07-1.54-.2-2.27H12v4.3h6.48c-.28 1.45-1.1 2.68-2.34 3.51v2.92h3.77c2.21-2.04 3.58-5.06 3.58-8.46z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.77-2.92c-1.05.7-2.39 1.12-4.18 1.12-3.21 0-5.94-2.17-6.91-5.09H1.2v3.13C3.16 21.53 7.24 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.09 14.2c-.24-.7-.37-1.44-.37-2.2s.13-1.5.37-2.2V6.67H1.2A11.97 11.97 0 0 0 0 12c0 1.9.45 3.69 1.2 5.33l3.89-3.13z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.33.6 4.57 1.78l3.43-3.43C17.95 1.07 15.24 0 12 0 7.24 0 3.16 2.47 1.2 6.67l3.89 3.13c.97-2.92 3.7-5.09 6.91-5.09z"
    />
  </svg>
);

const SignIn = () => {
  const [formData, setFormData] = useState<SignInForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signin, user, isAuthLoading, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.add("dark");

    return () => {
      if (!wasDark) {
        root.classList.remove("dark");
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthLoading, user, navigate]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signin(formData.email, formData.password);
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign in. Please try again.";
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignInForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const passwordType = useMemo(() => (showPassword ? "text" : "password"), [showPassword]);

  const handleGoogleSignIn = async () => {
    setErrors((prev) => ({ ...prev, submit: "" }));
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to authenticate with Google at this time.";
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/40 dark:bg-blue-400/30 rounded-full"
            animate={{
              y: [0, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 text-center text-slate-200 lg:w-1/2 lg:text-left"
        >
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-4 lg:items-start">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-primary-foreground shadow-lg">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <span className="text-3xl font-bold text-white">EduCareer AI</span>
              </div>
              <div className="max-w-md space-y-3">
                <h1 className="text-3xl font-bold leading-snug text-white">Welcome Back</h1>
                <p className="text-base text-slate-300">
                  Sign in to continue your personalized learning journey and access AI-powered insights tailored to you.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:w-1/2">
          <Card className="bg-white/85 dark:bg-slate-900/60 backdrop-blur-xl border border-border shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-foreground">Sign In</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.submit && (
                <Alert className="border-red-300 bg-red-50 text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(event) => handleInputChange("email", event.target.value)}
                      className={`pl-10 bg-white/80 dark:bg-slate-950/70 border-slate-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/40 ${
                        errors.email ? "border-red-500" : ""
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500 dark:text-red-400">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="password"
                      type={passwordType}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(event) => handleInputChange("password", event.target.value)}
                      className={`pl-10 pr-10 bg-white/80 dark:bg-slate-950/70 border-slate-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/40 ${
                        errors.password ? "border-red-500" : ""
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500 dark:text-red-400">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-primary-foreground font-semibold py-2.5"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="space-y-3 pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/90 dark:bg-slate-900/80 px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-border/80 bg-white/85 text-foreground hover:bg-primary/10 dark:bg-slate-900/70"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full bg-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/90 dark:bg-slate-900/80 px-2 text-muted-foreground">
                    New to EduCareer AI?
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link to="/auth/signup">
                  <Button variant="ghost" className="w-full text-foreground hover:bg-slate-200/70 dark:hover:bg-slate-800/80">
                    Create an Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
};

export default SignIn;
