import { useEffect, useState } from "react";
import {
  auth,
  db,
  storage,
  signUpWithEmail,
  signInWithEmail,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  uploadFileToStorage,
} from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const FirebaseTest = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState({ name: "", role: "" });
  const [fetchedProfile, setFetchedProfile] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [status, setStatus] = useState("");

  // Subscribe to Firebase Auth state changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Handles new user registration.
  const handleSignUp = async () => {
    try {
      setStatus("Registering user...");
      const user = await signUpWithEmail(email, password);
      await createUserProfile(user.uid, {
        email: user.email,
        name: userData.name || "Anonymous",
        role: userData.role || "student",
      });
      setStatus("User registered and profile created successfully.");
    } catch (error) {
      setStatus(`Sign up failed: ${error.message}`);
    }
  };

  // Handles user login via email/password.
  const handleSignIn = async () => {
    try {
      setStatus("Logging in...");
      await signInWithEmail(email, password);
      setStatus("Logged in successfully.");
    } catch (error) {
      setStatus(`Login failed: ${error.message}`);
    }
  };

  // Fetches the authenticated user's Firestore profile.
  const handleFetchProfile = async () => {
    if (!currentUser) {
      setStatus("No authenticated user to fetch profile for.");
      return;
    }

    try {
      setStatus("Fetching profile...");
      const profile = await getUserProfile(currentUser.uid);
      setFetchedProfile(profile);
      setStatus("Profile fetched successfully.");
    } catch (error) {
      setStatus(`Failed to fetch profile: ${error.message}`);
    }
  };

  // Updates the authenticated user's profile fields.
  const handleUpdateProfile = async () => {
    if (!currentUser) {
      setStatus("No authenticated user to update.");
      return;
    }

    try {
      setStatus("Updating profile...");
      await updateUserProfile(currentUser.uid, {
        name: userData.name || "Anonymous",
        role: userData.role || "student",
      });
      setStatus("Profile updated successfully.");
    } catch (error) {
      setStatus(`Failed to update profile: ${error.message}`);
    }
  };

  // Deletes the authenticated user's profile document.
  const handleDeleteProfile = async () => {
    if (!currentUser) {
      setStatus("No authenticated user to delete profile for.");
      return;
    }

    try {
      setStatus("Deleting profile...");
      await deleteUserProfile(currentUser.uid);
      setFetchedProfile(null);
      setStatus("Profile deleted successfully.");
    } catch (error) {
      setStatus(`Failed to delete profile: ${error.message}`);
    }
  };

  // Uploads the selected file to Firebase Storage.
  const handleUploadFile = async () => {
    if (!file) {
      setStatus("Please select a file to upload.");
      return;
    }

    try {
      setStatus("Uploading file...");
      const result = await uploadFileToStorage(file, "test-uploads");
      setUploadResult(result);
      setStatus("File uploaded successfully.");
    } catch (error) {
      setStatus(`File upload failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-bold">Firebase Integration Test</h1>
      <p className="text-sm text-gray-500">
        Use this component to verify authentication, Firestore CRUD, and Storage uploads.
      </p>

      <section className="space-y-4 border rounded-xl p-4">
        <h2 className="text-xl font-semibold">Authentication</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col text-sm">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 rounded border px-3 py-2"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col text-sm">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 rounded border px-3 py-2"
              placeholder="••••••••"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleSignUp} className="rounded bg-indigo-600 px-4 py-2 text-white">
            Sign Up
          </button>
          <button onClick={handleSignIn} className="rounded bg-emerald-600 px-4 py-2 text-white">
            Sign In
          </button>
        </div>
        {currentUser && (
          <p className="text-sm text-emerald-600">
            Logged in as <strong>{currentUser.email}</strong>
          </p>
        )}
      </section>

      <section className="space-y-4 border rounded-xl p-4">
        <h2 className="text-xl font-semibold">Firestore: Users Collection</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col text-sm">
            Name
            <input
              type="text"
              value={userData.name}
              onChange={(event) => setUserData((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 rounded border px-3 py-2"
              placeholder="Ada Lovelace"
            />
          </label>
          <label className="flex flex-col text-sm">
            Role
            <input
              type="text"
              value={userData.role}
              onChange={(event) => setUserData((prev) => ({ ...prev, role: event.target.value }))}
              className="mt-1 rounded border px-3 py-2"
              placeholder="student"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleFetchProfile} className="rounded bg-slate-600 px-4 py-2 text-white">
            Fetch Profile
          </button>
          <button onClick={handleUpdateProfile} className="rounded bg-blue-600 px-4 py-2 text-white">
            Update Profile
          </button>
          <button onClick={handleDeleteProfile} className="rounded bg-rose-600 px-4 py-2 text-white">
            Delete Profile
          </button>
        </div>
        {fetchedProfile && (
          <pre className="rounded bg-slate-900/90 p-3 text-xs text-white">
            {JSON.stringify(fetchedProfile, null, 2)}
          </pre>
        )}
      </section>

      <section className="space-y-4 border rounded-xl p-4">
        <h2 className="text-xl font-semibold">Storage Upload</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button onClick={handleUploadFile} className="rounded bg-purple-600 px-4 py-2 text-white">
          Upload Image
        </button>
        {uploadResult && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-slate-700">Download URL:</p>
            <a
              href={uploadResult.downloadURL}
              className="text-blue-600 underline"
              target="_blank"
              rel="noreferrer"
            >
              {uploadResult.downloadURL}
            </a>
          </div>
        )}
      </section>

      {status && <p className="text-sm text-slate-600">Status: {status}</p>}
    </div>
  );
};

export default FirebaseTest;
