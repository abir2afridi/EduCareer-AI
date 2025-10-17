import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const ADMIN_EMAIL = "abir2afridi@gmail.com";
const ADMIN_PASSWORD = "220031";
const STORAGE_KEY = "educareer-admin-auth";

type AdminAuthContextValue = {
  isAdmin: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { isAdmin: boolean };
        setIsAdmin(Boolean(parsed.isAdmin));
      } catch (error) {
        console.warn("Failed to parse admin auth state", error);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true);
    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => {
        const success = email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
        if (success) {
          setIsAdmin(true);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ isAdmin: true }));
        }
        setIsLoading(false);
        resolve(success);
      }, 450);
    });
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      isAdmin,
      isLoading,
      login,
      logout,
    }),
    [isAdmin, isLoading, login, logout],
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
