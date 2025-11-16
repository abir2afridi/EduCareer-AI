import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { FirebaseError } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, type Auth } from "firebase/auth";
import { app } from "@/lib/firebaseClient";

type AdminUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
};

type LoginPayload = { email: string; password: string };

type LoginResult = {
  success: boolean;
  errorMessage?: string;
  errorCode?: string;
  missingAdminClaim?: boolean;
};

type AdminAuthContextValue = {
  user: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const extractRoleClaim = (claims: Record<string, unknown>): string | undefined => {
  const roleClaim = claims.role;
  return typeof roleClaim === "string" ? roleClaim : undefined;
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useMemo<Auth>(() => getAuth(app), []);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isActive) return;

      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const tokenResult = await firebaseUser.getIdTokenResult();
        const roleClaim = extractRoleClaim(tokenResult.claims);
        console.info("AdminAuthContext:claims", { uid: firebaseUser.uid, role: roleClaim });

        if (roleClaim === "admin") {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: roleClaim,
          });
        } else {
          console.warn("AdminAuthContext: user missing admin claim", { uid: firebaseUser.uid, role: roleClaim });
          setUser(null);
        }
      } catch (error) {
        console.error("AdminAuthContext: failed to resolve admin claims", error);
        setUser(null);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [auth]);

  const login = useCallback(
    async ({ email, password }: LoginPayload): Promise<LoginResult> => {
      setIsLoading(true);
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await credential.user.getIdToken(true);
        const tokenResult = await credential.user.getIdTokenResult();
        const roleClaim = extractRoleClaim(tokenResult.claims);

        console.info("AdminAuthContext:login", { uid: credential.user.uid, role: roleClaim });

        if (roleClaim !== "admin") {
          await signOut(auth);
          setUser(null);
          setIsLoading(false);
          return {
            success: false,
            missingAdminClaim: true,
            errorMessage: "Authenticated user does not have the required admin role claim.",
          };
        }

        setUser({
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          role: roleClaim,
        });
        setIsLoading(false);
        return { success: true };
      } catch (error) {
        console.error("AdminAuthContext: login failed", error);
        setUser(null);
        setIsLoading(false);
        const firebaseError = error as FirebaseError;
        return {
          success: false,
          errorCode: firebaseError?.code,
          errorMessage: firebaseError?.message ?? "Failed to sign in as admin.",
        };
      }
    },
    [auth],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setIsLoading(false);
  }, [auth]);

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === "admin",
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
