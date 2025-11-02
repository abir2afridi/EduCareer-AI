import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";
import IubLogo from "@/assets/iub-logo.png";
 

const EXPANDED_WIDTH = "15rem"; // ~240px
const COLLAPSED_WIDTH = "5rem"; // ~80px

export type SidebarNavItem = {
  label: string;
  path?: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  subItems?: { label: string; path: string; description?: string }[];
};

export interface SidebarSection {
  title: string;
  items: SidebarNavItem[];
}

interface DashboardSidebarProps {
  sections: SidebarSection[];
  displayName: string;
  secondaryEmail?: string;
  avatarUrl?: string;
  initials: string;
  onLogout: () => Promise<void> | void;
}

export default function DashboardSidebar({ sections, displayName, secondaryEmail, avatarUrl, initials, onLogout }: DashboardSidebarProps) {
  const location = useLocation();
  const { isExpanded, isHovered, setHovered, toggleSidebar, isMobileOpen, toggleMobileSidebar, closeMobile } = useSidebar();
  const [openSubmenu, setOpenSubmenu] = useState<{ section: number; index: number } | null>(null);

  const sidebarWidth = useMemo(
    () => ((isExpanded || isHovered) ? EXPANDED_WIDTH : COLLAPSED_WIDTH),
    [isExpanded, isHovered],
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--dashboard-sidebar-width", sidebarWidth);
    return () => {
      document.documentElement.style.removeProperty("--dashboard-sidebar-width");
    };
  }, [sidebarWidth]);

  useEffect(() => {
    const next = findActiveSubmenu(sections, location.pathname);
    setOpenSubmenu(next);
  }, [sections, location.pathname]);

  const collapsed = !isExpanded && !isHovered && !isMobileOpen;

  const handleSubmenuToggle = (sectionIndex: number, itemIndex: number) => {
    setOpenSubmenu((current) => {
      if (current && current.section === sectionIndex && current.index === itemIndex) {
        return null;
      }
      return { section: sectionIndex, index: itemIndex };
    });
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border/60 bg-white/95 transition-all duration-300 ease-in-out backdrop-blur-sm dark:bg-slate-950/95",
        collapsed ? "w-[80px]" : "w-[240px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
      onMouseEnter={() => !isExpanded && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={cn("flex h-20 items-center justify-between border-b border-border/60", collapsed ? "px-4" : "px-6")}
      >
        <Link
          to="/"
          className={cn(
            "flex items-center transition-all duration-200",
            collapsed ? "mx-auto justify-center" : "gap-3",
          )}
        >
          <img
            src={IubLogo}
            alt="EduCareer AI"
            className={cn(
              "rounded-2xl bg-white object-contain p-1 shadow-sm transition-all duration-200",
              collapsed ? "h-12 w-12" : "h-11 w-11",
            )}
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">EduCareer</span>
              <span className="text-lg font-semibold leading-tight text-foreground">Navigator Suite</span>
            </div>
          )}
        </Link>

        <div className="flex items-center gap-2" />
      </div>

      <div className={cn("flex-1 overflow-y-auto px-4 py-5", collapsed ? "space-y-4" : "space-y-5")}
      >
        {sections.map((section, sectionIndex) => (
          <Fragment key={section.title}>
            <div className="space-y-1.5">
              {(isExpanded || isHovered || isMobileOpen) && (
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                  {section.title}
                </p>
              )}
              <nav className={cn("flex flex-col gap-1", collapsed && "items-center gap-2")}
              >
                {section.items.map((item, itemIndex) => {
                  const hasSubmenu = item.subItems && item.subItems.length > 0;
                  const activeSub = hasSubmenu && item.subItems!.some((sub) => sub.path === location.pathname);
                  const isActive = item.path ? item.path === location.pathname : activeSub;
                  const isOpen =
                    openSubmenu && openSubmenu.section === sectionIndex && openSubmenu.index === itemIndex && !collapsed;

                  return (
                    <div key={item.label} className="w-full">
                      {hasSubmenu || !item.path ? (
                        <button
                          type="button"
                          onClick={hasSubmenu ? () => handleSubmenuToggle(sectionIndex, itemIndex) : undefined}
                          className={cn(
                            "group flex w-full items-center rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors",
                            collapsed ? "justify-center" : "gap-3",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-900",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors group-hover:text-primary",
                              isActive && "text-primary",
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                          </span>
                          {!collapsed && (
                            <span className="flex-1 text-left text-xs font-medium leading-tight whitespace-normal break-words">{item.label}</span>
                          )}
                          {!collapsed && hasSubmenu && (
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isOpen ? "rotate-180 text-primary" : "text-muted-foreground",
                              )}
                            />
                          )}
                        </button>
                      ) : (
                        <Link
                          to={item.path}
                          onClick={() => {
                            if (isMobileOpen) closeMobile();
                          }}
                          className={cn(
                            "group flex w-full items-center rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors",
                            collapsed ? "justify-center" : "gap-3",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-900",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors group-hover:text-primary",
                              isActive && "text-primary",
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                          </span>
                          {!collapsed && (
                            <span className="flex-1 text-left text-xs font-medium leading-tight whitespace-normal break-words">{item.label}</span>
                          )}
                        </Link>
                      )}

                      {hasSubmenu && !collapsed && (
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-200",
                            isOpen ? "max-h-60" : "max-h-0",
                          )}
                        >
                          <ul className="mt-1.5 space-y-0.5 pl-11">
                            {item.subItems!.map((subItem) => {
                              const subActive = subItem.path === location.pathname;
                              return (
                                <li key={subItem.path}>
                                  <Link
                                    to={subItem.path}
                                    onClick={() => {
                                      if (isMobileOpen) closeMobile();
                                    }}
                                    className={cn(
                                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors",
                                      subActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-900",
                                    )}
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {subItem.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

          </Fragment>
        ))}
      </div>

      <div className={cn("border-t border-border/60 px-3 py-3", collapsed ? "flex justify-center" : "")}
      >
        {collapsed ? (
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        )}
      </div>
    </aside>
  );
}

function findActiveSubmenu(sections: SidebarSection[], pathname: string) {
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    for (let itemIndex = 0; itemIndex < section.items.length; itemIndex += 1) {
      const item = section.items[itemIndex];
      if (item.subItems?.some((sub) => sub.path === pathname)) {
        return { section: sectionIndex, index: itemIndex };
      }
    }
  }
  return null;
}
