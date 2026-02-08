import { type PropsWithChildren } from "react";
import { Badge as UiBadge } from "@/components/ui/badge";

export type DashboardBadgeVariant = "success" | "error" | "warning" | "info";

const variantMap: Record<DashboardBadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  error: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};

export default function DashboardBadge({
  variant = "info",
  children,
}: PropsWithChildren<{ variant?: DashboardBadgeVariant }>) {
  return <UiBadge className={variantMap[variant]}>{children}</UiBadge>;
}
