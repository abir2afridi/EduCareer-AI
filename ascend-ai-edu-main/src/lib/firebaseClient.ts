import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCPn35WcfiyvYLaTkEFpKZwTNhtNkORRZU",
  authDomain: "educareer-ai.firebaseapp.com",
  projectId: "educareer-ai",
  storageBucket: "educareer-ai.firebasestorage.app",
  messagingSenderId: "441122339451",
  appId: "1:441122339451:web:ddb90025fc778d1e6140de",
  measurementId: "G-0Y1F8WXHNM",
};

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

if (import.meta.env.MODE === "development" && typeof window !== "undefined" && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (error) {
    console.warn("Firestore emulator connection failed", error);
  }
}

export { app, db, analytics, storage };
