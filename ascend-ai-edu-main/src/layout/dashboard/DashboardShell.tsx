import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, LogOut, Sparkles, Briefcase as BriefcaseIcon, Settings, ChevronDown, ChevronLeft, Bell, Info, BarChart3, BrainCircuit, BarChart2, Users2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { SidebarProvider, useSidebar } from "./SidebarContext";
import DashboardSidebar, { type SidebarSection, type SidebarNavItem } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/components/auth-provider";
import NotificationDropdown, { NotificationList, sampleNotifications } from "@/components/dashboard/NotificationDropdown";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Backdrop from "./DashboardSidebarBackdrop";
import { HamburgerToggle } from "@/components/home/HamburgerToggle";

import {
  ArrowRightIcon,
  BoxCubeIcon,
  CalenderIcon,
  ChartIcon,
  ChatIcon,
  DocsIcon,
  GridIcon,
  GroupIcon,
  ListIcon,
  MailIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  SidebarCloseIcon,
  SidebarOpenIcon,
  TaskIcon,
  UserCircleIcon,
} from "@/icons";

type SearchResult = {
  label: string;
  path: string;
  section: string;
  parentLabel?: string;
  icon?: SidebarNavItem["icon"];
};

type SearchResultsListProps = {
  results: SearchResult[];
  activeIndex: number;
  onSelect: (result: SearchResult) => void;
  onHighlight?: (index: number) => void;
  emptyMessage?: string;
  className?: string;
};

function SearchResultsList({ results, activeIndex, onSelect, onHighlight, emptyMessage = "No matches found", className }: SearchResultsListProps) {
  if (!results.length) {
    return <div className={cn("px-4 py-6 text-center text-sm text-muted-foreground", className)}>{emptyMessage}</div>;
  }

  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {results.map((result, index) => {
        const IconComponent = result.icon ?? Search;
        const isActive = index === activeIndex;
        return (
          <li key={`${result.section}-${result.path}`}>
            <button
              type="button"
              onMouseEnter={() => onHighlight?.(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(result);
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition",
                isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/20 hover:text-foreground",
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                <IconComponent className="h-4 w-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{result.label}</span>
                <span className="text-xs text-muted-foreground">
                  {result.parentLabel ? `${result.parentLabel} • ` : ""}
                  {result.section}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type ProfileMenuProps = {
  displayName: string;
  secondaryEmail?: string;
  avatarUrl?: string;
  initials: string;
  onLogout: () => Promise<void> | void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  searchResults: SearchResult[];
  isSearchOpen: boolean;
  onSearchSelect: (result: SearchResult) => void;
  activeResultIndex: number;
  onActiveResultIndexChange: (index: number) => void;
  setSearchOpen: (open: boolean) => void;
};

// Animation variants
const wrapperVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.16,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.02,
    },
  },
  closed: {
    opacity: 0,
    y: 6,
    transition: {
      duration: 0.14,
      ease: "easeIn",
      when: "afterChildren",
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
  closed: {
    opacity: 0,
    y: 6,
    transition: { duration: 0.12, ease: "easeIn" },
  },
};

function ProfileMenu({
  displayName,
  secondaryEmail,
  avatarUrl,
  initials,
  onLogout,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  searchResults,
  isSearchOpen,
  onSearchSelect,
  activeResultIndex,
  onActiveResultIndexChange,
  setSearchOpen,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"menu" | "notifications">("menu");
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handler = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }

    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  const actions = useMemo(
    () => [
      {
        label: "Account settings",
        description: "Manage profile & preferences",
        icon: Settings,
        onSelect: () => navigate("/settings"),
      },
      {
        label: "Upgrade workspace",
        description: "Unlock premium analytics",
        icon: Sparkles,
        onSelect: () => navigate("/analytics"),
      },
      {
        label: "Sign out",
        description: "Log out of EduCareer AI",
        icon: LogOut,
        onSelect: onLogout,
      },
    ],
    [navigate, onLogout],
  );

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      const target = event.target as HTMLElement;
      if (!target.closest("#profile-menu")) {
        closeMenu();
        setMobileView("menu");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        setMobileView("menu");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeMenu]);

  const handleOpenNotifications = () => {
    if (!isDesktop) {
      setMobileView("notifications");
    }
  };

  const handleBackToMenu = () => {
    setMobileView("menu");
  };

  useEffect(() => {
    if (!open) {
      setSearchOpen(false);
    }
  }, [open, setSearchOpen]);

  return (
    <div id="profile-menu" className="relative">
      <motion.button
        type="button"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (!next) {
              setMobileView("menu");
            }
            return next;
          });
        }}
        className="flex h-11 items-center gap-2 rounded-2xl border border-border/60 bg-white px-2 text-left text-foreground shadow-theme-xs transition hover:border-border/50 hover:bg-white dark:bg-slate-900 sm:gap-3 sm:px-3"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="hidden min-w-[120px] flex-col text-left sm:flex">
          <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
          {secondaryEmail && <span className="truncate text-xs text-muted-foreground">{secondaryEmail}</span>}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="h-4 w-4 text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute right-0 z-50 mt-3 w-72 origin-top-right rounded-2xl border border-border/60 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={wrapperVariants}
            >
              <motion.div 
                className="flex items-center gap-3 rounded-xl bg-muted/20 p-3"
                variants={itemVariants}
              >
                <Avatar className="h-11 w-11">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{displayName}</span>
                  {secondaryEmail && <span className="text-xs text-muted-foreground">{secondaryEmail}</span>}
                </div>
              </motion.div>

              <motion.div 
                className="my-3 h-px bg-border/60"
                variants={itemVariants}
              />

              {!isDesktop && mobileView === "notifications" && (
                <motion.div className="space-y-3" variants={itemVariants}>
                  <button
                    type="button"
                    onClick={handleBackToMenu}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  <div className="rounded-xl bg-muted/15 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Bell className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Notifications</div>
                        <div className="text-xs text-muted-foreground">Latest updates for you</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <NotificationList notifications={sampleNotifications} onSelect={handleBackToMenu} />
                    </div>
                  </div>
                </motion.div>
              )}

              {!isDesktop && mobileView === "menu" && (
                <>
                  <motion.form
                    onSubmit={(event) => {
                      onSearchSubmit(event);
                      closeMenu();
                    }}
                    className="space-y-2 rounded-xl bg-muted/15 p-3"
                    variants={itemVariants}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Search</div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(event) => {
                            const value = event.target.value;
                            onSearchChange(value);
                            setSearchOpen(value.trim().length > 0);
                          }}
                          placeholder="Search the workspace..."
                          className="w-full rounded-lg border border-border/60 bg-white pl-9 text-sm shadow-none dark:bg-slate-900"
                          onFocus={() => setSearchOpen(searchQuery.trim().length > 0)}
                        />
                      </div>
                      <Button type="submit" size="icon" variant="secondary" className="h-10 w-10">
                        <span className="sr-only">Submit search</span>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.form>

                  {isSearchOpen && (
                    <motion.div variants={itemVariants} className="max-h-64 overflow-y-auto rounded-xl border border-border/60 bg-white dark:border-slate-800 dark:bg-slate-900">
                      <SearchResultsList
                        results={searchResults}
                        activeIndex={activeResultIndex}
                        onSelect={(result) => {
                          onSearchSelect(result);
                          closeMenu();
                        }}
                        onHighlight={onActiveResultIndexChange}
                        emptyMessage="No results"
                      />
                    </motion.div>
                  )}
                </>
              )}

              <motion.ul className="space-y-1">
                {!isDesktop && mobileView === "menu" && (
                  <>
                    <motion.li variants={itemVariants}>
                      <button
                        type="button"
                        onClick={handleOpenNotifications}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Bell className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">Notifications</span>
                          <span className="text-xs text-muted-foreground">View recent alerts</span>
                        </span>
                      </button>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <ThemeToggle variant="menu" />
                    </motion.li>
                  </>
                )}
                {(isDesktop || mobileView === "menu") &&
                  actions.map((action) => (
                    <motion.li
                      key={action.label}
                      variants={itemVariants}
                    >
                      <motion.button
                        type="button"
                        onClick={() => {
                          closeMenu();
                          Promise.resolve(action.onSelect()).catch((error) =>
                            console.error("Profile action failed", error),
                          );
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.span
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <action.icon className="h-4 w-4" />
                        </motion.span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{action.label}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                        </div>
                      </motion.button>
                    </motion.li>
                  ))}
              </motion.ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type HeaderProps = {
  title: string;
  description: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  searchResults: SearchResult[];
  isSearchOpen: boolean;
  onSearchSelect: (result: SearchResult) => void;
  activeResultIndex: number;
  onActiveResultIndexChange: (index: number) => void;
  setSearchOpen: (open: boolean) => void;
  displayName: string;
  secondaryEmail?: string;
  avatarUrl?: string;
  initials: string;
  onLogout: () => Promise<void> | void;
  now: Date;
};

function DashboardHeader({
  title,
  description,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  searchResults,
  isSearchOpen,
  onSearchSelect,
  activeResultIndex,
  onActiveResultIndexChange,
  setSearchOpen,
  displayName,
  secondaryEmail,
  avatarUrl,
  initials,
  onLogout,
  now,
}: HeaderProps) {
  const { isMobileOpen, toggleMobileSidebar, toggleSidebar, isExpanded } = useSidebar();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/95 backdrop-blur-xl dark:bg-slate-950/90">
      <div className="mx-auto flex h-20 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <HamburgerToggle
              open={isMobileOpen}
              onToggle={toggleMobileSidebar}
              className="text-muted-foreground"
              variantClassName="flex h-11 w-11 items-center justify-center rounded-xl bg-transparent transition hover:text-foreground"
            />
          </div>
          <div className="hidden lg:block">
            <HamburgerToggle
              open={isExpanded}
              onToggle={toggleSidebar}
              className="text-muted-foreground"
              variantClassName="hidden h-11 w-11 items-center justify-center rounded-xl bg-transparent transition hover:text-foreground lg:flex"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
              <span className="hidden items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:border-amber-500/30 dark:bg-amber-600/15 dark:text-amber-300 lg:inline-flex">
                <Sparkles className="h-3 w-3" />
                Smart Insights
              </span>
            </div>
            <p className="hidden truncate text-sm text-muted-foreground lg:block">{description}</p>
          </div>
        </div>

        <div className={cn("flex items-center gap-2 sm:gap-3", isMobileOpen ? "hidden lg:flex" : "")}>
          <div className="hidden min-w-[140px] flex-col text-right md:flex">
            <span className="text-sm font-semibold text-foreground">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-xs text-muted-foreground">
              {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="relative hidden lg:block">
            <form onSubmit={onSearchSubmit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    const value = event.target.value;
                    onSearchChange(value);
                    setSearchOpen(value.trim().length > 0);
                  }}
                  placeholder="Search the workspace..."
                  className="w-80 rounded-2xl border border-border/60 bg-white pl-10 text-sm shadow-theme-xs dark:bg-slate-900"
                  onFocus={() => setSearchOpen(searchQuery.trim().length > 0)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
                />
                <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-border/60 bg-white px-2 py-0.5 text-[11px] font-medium text-muted-foreground md:inline-flex">
                  <span>⌘</span>
                  <span>K</span>
                </span>
              </div>
            </form>

            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full z-40 mt-2 w-[320px] overflow-hidden rounded-2xl border border-border/60 bg-white/95 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <SearchResultsList
                    results={searchResults}
                    activeIndex={activeResultIndex}
                    onSelect={(result) => {
                      onSearchSelect(result);
                      setSearchOpen(false);
                    }}
                    onHighlight={onActiveResultIndexChange}
                    emptyMessage="No results"
                    className="p-3"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="hidden lg:block">
            <NotificationDropdown />
          </div>
          <ThemeToggle className="hidden lg:inline-flex" />
          <ProfileMenu
            displayName={displayName}
            secondaryEmail={secondaryEmail}
            avatarUrl={avatarUrl}
            initials={initials}
            onLogout={onLogout}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            searchResults={searchResults}
            isSearchOpen={isSearchOpen}
            onSearchSelect={onSearchSelect}
            activeResultIndex={activeResultIndex}
            onActiveResultIndexChange={onActiveResultIndexChange}
            setSearchOpen={setSearchOpen}
          />
        </div>
      </div>
    </header>
  );
}

function mapNavToSections(navMain: SidebarSection["items"], navSecondary: SidebarSection["items"]) {
  const primary: SidebarSection = {
    title: "Overview",
    items: navMain,
  };
  const secondary: SidebarSection = {
    title: "Workflow",
    items: navSecondary,
  };
  return [primary, secondary];
}

function ShellContent({ children }: PropsWithChildren) {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const userMetadata = (user as { user_metadata?: { name?: string; plan?: string; tier?: string; org?: string; avatar_url?: string } } | null)?.user_metadata;
  const displayName = userMetadata?.name || user?.displayName || user?.email || "Account";
  const email = user?.email;
  const secondaryEmail = email && email !== displayName ? email : undefined;
  const initials = useMemo(() => {
    if (!displayName) return "AC";
    return displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  const isPremium = Boolean((userMetadata?.plan ?? "") === "premium" || userMetadata?.tier);

  const navMain = useMemo<SidebarSection["items"]>(
    () => [
      { label: "Dashboard", path: "/dashboard", icon: GridIcon },
      { label: "Students", path: "/students", icon: GroupIcon },
      {
        label: "AI Workspace",
        icon: Sparkles,
        subItems: [
          { label: "AI Quiz", path: "/quiz" },
          { label: "AI Assistant", path: "/assistant" },
        ],
      },
      { label: "AI Learning Insights", path: "/insights", icon: BarChart3 },
      { label: "Upcoming Tasks", path: "/tasks", icon: CalenderIcon },
      { label: "My Courses", path: "/courses", icon: PageIcon },
      { label: "Learning Paths", path: "/learning", icon: ListIcon },
      {
        label: isPremium ? "Analytics" : "Upgrade to Analytics",
        path: "/analytics",
        icon: isPremium ? BarChart2 : ArrowRightIcon,
      },
      { label: "Teachers", path: "/teachers", icon: Users2 },
      { label: "Assessments", path: "/assessments", icon: DocsIcon },
      { label: "Career Guidance", path: "/career", icon: BriefcaseIcon },
      { label: "Learning Reports", path: "/reports", icon: FileText },
      { label: "Contact", path: "/contact", icon: MailIcon },
      { label: "About", path: "/about", icon: Info },
    ],
    [isPremium],
  );

  const navSecondary = useMemo<SidebarSection["items"]>(
    () => [
      { label: "Profile", path: "/profile", icon: UserCircleIcon },
      { label: "Research", path: "/research", icon: BoxCubeIcon },
      {
        label: "Email",
        icon: MailIcon,
        subItems: [
          { label: "Inbox", path: "/email" },
          { label: "Details", path: "/email/details" },
        ],
      },
      {
        label: "Chat",
        path: "/dashboard/chat",
        icon: ChatIcon,
      },
      { label: "Tasks", path: "/tasks", icon: TaskIcon },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
    [],
  );

  const sections = useMemo(() => mapNavToSections(navMain, navSecondary), [navMain, navSecondary]);

  const flatNavItems = useMemo(() => {
    const items: SearchResult[] = [];
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.path) {
          items.push({ label: item.label, path: item.path, section: section.title, icon: item.icon });
        }
        if (item.subItems) {
          item.subItems.forEach((sub) => {
            items.push({ label: sub.label, path: sub.path, section: section.title, parentLabel: item.label, icon: item.icon });
          });
        }
      });
    });
    return items;
  }, [sections]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setActiveResultIndex(0);
      return;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matched = flatNavItems
      .filter((item) => item.label.toLowerCase().includes(normalizedQuery) || item.section.toLowerCase().includes(normalizedQuery) || (item.parentLabel?.toLowerCase().includes(normalizedQuery) ?? false))
      .slice(0, 8);
    setSearchResults(matched);
    setActiveResultIndex((index) => (matched.length ? Math.min(index, matched.length - 1) : 0));
  }, [searchQuery, flatNavItems]);

  const currentPage = useMemo(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.path === location.pathname) {
          return { title: item.label, description: "Smart insights tailored to your journey." };
        }
        if (item.subItems) {
          const match = item.subItems.find((sub) => sub.path === location.pathname);
          if (match) {
            return { title: match.label, description: "Smart insights tailored to your journey." };
          }
        }
      }
    }
    return { title: "EduCareer AI", description: "Elevate learning and career journeys." };
  }, [location.pathname, sections]);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (searchResults[activeResultIndex]) {
        navigate(searchResults[activeResultIndex].path);
      }
      setSearchOpen(false);
    },
    [activeResultIndex, navigate, searchResults],
  );

  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.path);
      setSearchQuery("");
      setSearchOpen(false);
    },
    [navigate],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSearchOpen || !searchResults.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveResultIndex((index) => (index + 1) % searchResults.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveResultIndex((index) => (index - 1 + searchResults.length) % searchResults.length);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const result = searchResults[activeResultIndex];
        if (result) {
          handleSearchSelect(result);
        }
      } else if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeResultIndex, handleSearchSelect, isSearchOpen, searchResults]);

  const handleLogout = useCallback(async () => {
    try {
      await signout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  }, [navigate, signout]);

  return (
    <div className="relative min-h-screen bg-slate-100/90 dark:bg-slate-950">
      <DashboardSidebar
        sections={sections}
        displayName={displayName}
        secondaryEmail={secondaryEmail}
        avatarUrl={userMetadata?.avatar_url}
        initials={initials}
        onLogout={handleLogout}
      />
      <Backdrop />

      <div className="flex min-h-screen flex-col pl-[var(--dashboard-sidebar-width,18rem)]">
        <DashboardHeader
          title={currentPage.title}
          description={currentPage.description}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          searchResults={searchResults}
          isSearchOpen={isSearchOpen}
          onSearchSelect={handleSearchSelect}
          activeResultIndex={activeResultIndex}
          onActiveResultIndexChange={setActiveResultIndex}
          setSearchOpen={setSearchOpen}
          displayName={displayName}
          secondaryEmail={secondaryEmail}
          avatarUrl={userMetadata?.avatar_url}
          initials={initials}
          onLogout={handleLogout}
          now={now}
        />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <ShellContent>{children}</ShellContent>
    </SidebarProvider>
  );
}