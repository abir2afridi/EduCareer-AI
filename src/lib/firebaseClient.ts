import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const readEnv = (key: string): string | undefined => {
  const viteValue = (import.meta as any)?.env?.[key];
  if (typeof viteValue === "string" && viteValue.length) return viteValue;

  const nodeValue = (globalThis as any)?.process?.env?.[key];
  if (typeof nodeValue === "string" && nodeValue.length) return nodeValue;

  return undefined;
};

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY") ?? readEnv("FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN") ?? readEnv("FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID") ?? readEnv("FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET") ?? readEnv("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") ?? readEnv("FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID") ?? readEnv("FIREBASE_APP_ID"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID") ?? readEnv("FIREBASE_MEASUREMENT_ID"),
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
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
