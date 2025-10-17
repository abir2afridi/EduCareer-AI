import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/components/auth-provider";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";

createRoot(document.getElementById("root")!).render(
  <AdminAuthProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </AdminAuthProvider>,
);
