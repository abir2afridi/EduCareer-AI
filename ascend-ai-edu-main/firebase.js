// firebase.js
// Centralized Firebase configuration, service exports, and helper utilities for EduCareer AI.

import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration values specific to this project.
const firebaseConfig = {
  apiKey: "AIzaSyCPn35WcfiyvYLaTkEFpKZwTNhtNkORRZU",
  authDomain: "educareer-ai.firebaseapp.com",
  projectId: "educareer-ai",
  storageBucket: "educareer-ai.appspot.com",
  messagingSenderId: "441122339451",
  appId: "1:441122339451:web:ddb90025fc778d1e6140de",
  measurementId: "G-0Y1F8WXHNM",
};

// Initialize the Firebase app exactly once, even during hot reloads.
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Create reusable service instances that can be imported anywhere in the app.
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics only in supported browser environments.
let analytics = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

/**
 * Creates a Firebase Authentication user with an email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's chosen password.
 * @returns {Promise<import("firebase/auth").User>} The newly created Firebase user.
 */
export const signUpWithEmail = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Signs in an existing Firebase Authentication user via email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<import("firebase/auth").User>} The authenticated Firebase user.
 */
export const signInWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Creates or overwrites a user document inside the Firestore `users` collection.
 * @param {string} uid - The Firebase Authentication user ID.
 * @param {object} data - Arbitrary user profile data to store.
 * @returns {Promise<void>} Resolves when the document has been written.
 */
export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, "users", uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Retrieves a user document from the Firestore `users` collection.
 * @param {string} uid - The Firebase Authentication user ID.
 * @returns {Promise<object|null>} The user data with the document ID or null if missing.
 */
export const getUserProfile = async (uid) => {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() };
};

/**
 * Updates fields on an existing user document in the Firestore `users` collection.
 * @param {string} uid - The Firebase Authentication user ID.
 * @param {object} data - Partial user profile data to merge.
 * @returns {Promise<void>} Resolves when the document has been updated.
 */
export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Deletes a user document from the Firestore `users` collection.
 * @param {string} uid - The Firebase Authentication user ID.
 * @returns {Promise<void>} Resolves once the document has been removed.
 */
export const deleteUserProfile = async (uid) => {
  await deleteDoc(doc(db, "users", uid));
};

/**
 * Uploads a file to Firebase Storage and returns its downloadable URL.
 * @param {File} file - The file object selected by the user.
 * @param {string} [path="uploads"] - Directory path within the storage bucket.
 * @returns {Promise<{ downloadURL: string, fullPath: string }>} Metadata about the stored file.
 */
export const uploadFileToStorage = async (file, path = "uploads") => {
  const storageRef = ref(storage, `${path}/${crypto.randomUUID()}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return { downloadURL, fullPath: snapshot.metadata.fullPath };
};

// Export initialized Firebase instances for use throughout the project.
export { app, auth, db, storage, analytics };
