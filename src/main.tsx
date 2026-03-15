import { Component, type ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/components/auth-provider";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";

class RootErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("App crashed during bootstrap", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = typeof this.state.error.message === "string" ? this.state.error.message : "";
    const isFirebaseConfigError = /Missing Firebase configuration/i.test(message);

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          background: "#0b1220",
          color: "#e5e7eb",
        }}
      >
        <div style={{ maxWidth: 720, width: "100%" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>EduCareer AI failed to start</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
            {isFirebaseConfigError
              ? "Firebase environment variables are missing in this deployment."
              : "An unexpected runtime error occurred."}
          </div>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 16,
              fontSize: 12,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {message || "(no error message)"}
          </pre>

          {isFirebaseConfigError ? (
            <div style={{ marginTop: 16, fontSize: 13, opacity: 0.9 }}>
              Set these variables in Vercel (Production + Preview) and redeploy:
              <div style={{ marginTop: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                VITE_FIREBASE_API_KEY
                <br />
                VITE_FIREBASE_PROJECT_ID
                <br />
                VITE_FIREBASE_AUTH_DOMAIN
                <br />
                VITE_FIREBASE_STORAGE_BUCKET
                <br />
                VITE_FIREBASE_MESSAGING_SENDER_ID
                <br />
                VITE_FIREBASE_APP_ID
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <AdminAuthProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AdminAuthProvider>
  </RootErrorBoundary>,
);
