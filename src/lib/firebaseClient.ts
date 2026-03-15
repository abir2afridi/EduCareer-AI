import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (import.meta as any).env?.FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (import.meta as any).env?.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (import.meta as any).env?.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (import.meta as any).env?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (import.meta as any).env?.FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (import.meta as any).env?.FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (import.meta as any).env?.FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Missing Firebase configuration. Please set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in your environment variables.",
  );
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Firebase analytics initialization failed", error);
    }
  }
}

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

if (import.meta.env.MODE === "development" && typeof window !== "undefined" && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (error) {
    console.warn("Firestore emulator connection failed", error);
  }
}

export { app, db, analytics, storage, auth };
