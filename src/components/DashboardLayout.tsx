import { type PropsWithChildren } from "react";
import DashboardShell from "../layout/dashboard/DashboardShell";

export function DashboardLayout({ children }: PropsWithChildren) {
  return <DashboardShell>{children}</DashboardShell>;
}
