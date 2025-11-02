import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, LogOut, Sparkles, Briefcase as BriefcaseIcon, Settings, ChevronDown, Info, BarChart3, BrainCircuit, BarChart2, Users2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { SidebarProvider, useSidebar } from "./SidebarContext";
import DashboardSidebar, { type SidebarSection } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/components/auth-provider";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Backdrop from "./DashboardSidebarBackdrop";

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

type ProfileMenuProps = {
  displayName: string;
  secondaryEmail?: string;
  avatarUrl?: string;
  initials: string;
  onLogout: () => Promise<void> | void;
};

// Animation variants
const wrapperVariants = {
  open: {
    scaleY: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
  closed: {
    scaleY: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  closed: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

function ProfileMenu({ displayName, secondaryEmail, avatarUrl, initials, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeMenu]);

  return (
    <div id="profile-menu" className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 items-center gap-3 rounded-2xl border border-border/60 bg-white px-3 text-left text-foreground shadow-theme-xs transition hover:border-border/50 hover:bg-white dark:bg-slate-900"
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

              <motion.ul className="space-y-1">
                {actions.map((action) => (
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
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-lg border border-border/60 bg-white text-muted-foreground shadow-theme-xs transition hover:text-foreground lg:hidden"
            onClick={toggleMobileSidebar}
            aria-label="Toggle sidebar"
          >
            {isMobileOpen ? <SidebarCloseIcon className="h-5 w-5" /> : <SidebarOpenIcon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-11 w-11 rounded-lg border border-border/60 bg-white text-muted-foreground shadow-theme-xs transition hover:text-foreground lg:inline-flex"
            onClick={toggleSidebar}
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? <SidebarCloseIcon className="h-5 w-5" /> : <SidebarOpenIcon className="h-5 w-5" />}
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:border-amber-500/30 dark:bg-amber-600/15 dark:text-amber-300">
                <Sparkles className="h-3 w-3" />
                Smart Insights
              </span>
            </div>
            <p className="truncate text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden min-w-[140px] flex-col text-right md:flex">
            <span className="text-sm font-semibold text-foreground">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-xs text-muted-foreground">
              {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <form onSubmit={onSearchSubmit} className="hidden md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search the workspace..."
                className="w-80 rounded-2xl border border-border/60 bg-white pl-10 text-sm shadow-theme-xs dark:bg-slate-900"
              />
              <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-border/60 bg-white px-2 py-0.5 text-[11px] font-medium text-muted-foreground md:inline-flex">
                <span>⌘</span>
                <span>K</span>
              </span>
            </div>
          </form>

          <NotificationDropdown />
          <ThemeToggle />
          <ProfileMenu
            displayName={displayName}
            secondaryEmail={secondaryEmail}
            avatarUrl={avatarUrl}
            initials={initials}
            onLogout={onLogout}
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
      { label: "AI Quiz", path: "/quiz", icon: BrainCircuit },
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
        icon: ChatIcon,
        subItems: [
          { label: "Messages", path: "/dashboard/chat" },
          { label: "AI Assistant", path: "/assistant" },
        ],
      },
      { label: "Tasks", path: "/tasks", icon: TaskIcon },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
    [],
  );

  const sections = useMemo(() => mapNavToSections(navMain, navSecondary), [navMain, navSecondary]);

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
      setSearchQuery("");
    },
    [],
  );

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

      <div className="flex min-h-screen flex-col lg:pl-[var(--dashboard-sidebar-width,18rem)]">
        <DashboardHeader
          title={currentPage.title}
          description={currentPage.description}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
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