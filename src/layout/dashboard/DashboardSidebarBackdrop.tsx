import { useSidebar } from "./SidebarContext";

export default function DashboardSidebarBackdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={toggleMobileSidebar} />;
}
