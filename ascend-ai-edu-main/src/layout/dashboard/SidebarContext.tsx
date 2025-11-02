import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface SidebarContextValue {
  isExpanded: boolean;
  toggleExpanded: () => void;
  setExpanded: (value: boolean) => void;
  isHovered: boolean;
  setHovered: (value: boolean) => void;
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const STORAGE_KEY = "educareer-dashboard-sidebar-expanded-v2";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : true;
    } catch (error) {
      console.warn("Failed to read sidebar state", error);
      return true;
    }
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const setExpanded = useCallback((value: boolean) => {
    setIsExpanded(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  const value = useMemo<SidebarContextValue>(
    () => ({
      isExpanded,
      toggleExpanded,
      setExpanded,
      isHovered,
      setHovered: setIsHovered,
      isMobileOpen,
      openMobile,
      closeMobile,
      toggleSidebar: toggleExpanded,
      toggleMobileSidebar,
    }),
    [isExpanded, toggleExpanded, setExpanded, isHovered, isMobileOpen, openMobile, closeMobile, toggleMobileSidebar],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
