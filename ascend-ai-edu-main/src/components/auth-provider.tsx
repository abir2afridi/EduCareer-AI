import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { auth, signInWithEmail, signUpWithEmail } from "../../firebase";

type AuthContextValue = {
  user: User | null;
  isAuthLoading: boolean;
  signup: (email: string, password: string, name?: string) => Promise<User | null>;
  signin: (email: string, password: string) => Promise<User | null>;
  signout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    setIsAuthLoading(true);
    try {
      const createdUser = await signUpWithEmail(email, password);

      if (createdUser && name) {
        await updateProfile(createdUser, { displayName: name });
      }

      setUser(createdUser);
      return createdUser;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const signin = useCallback(async (email: string, password: string) => {
    setIsAuthLoading(true);
    try {
      const signedInUser = await signInWithEmail(email, password);
      setUser(signedInUser);
      return signedInUser;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const signout = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      signup,
      signin,
      signout,
      signInWithGoogle,
    }),
    [user, isAuthLoading, signup, signin, signout, signInWithGoogle],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
