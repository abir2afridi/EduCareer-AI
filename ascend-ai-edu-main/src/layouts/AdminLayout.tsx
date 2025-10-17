import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  Inbox,
  Layers,
  LineChart,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import IubLogo from "../assets/iub-logo.png";

const ADMIN_SIDEBAR_STORAGE_KEY = "educareer-admin-sidebar-collapsed";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
  gradient: string;
  badge?: string;
};

const adminProfile = {
  name: "Platform Admin",
  email: "abir2afridi@gmail.com",
  avatarUrl: "",
};

export function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(() => new Date());

  const initials = useMemo(() => {
    return adminProfile.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);
      if (!stored) return;
      setIsCollapsed(JSON.parse(stored));
    } catch (error) {
      console.warn("Failed to parse admin sidebar state", error);
    }
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const navigationData = useMemo(() => {
    const navMain: NavItem[] = [
      {
        title: "Dashboard Overview",
        url: "/admin/dashboard",
        icon: Home,
        description: "Executive analytics",
        gradient: "from-emerald-100 via-emerald-50 to-white dark:from-emerald-900/40 dark:via-emerald-950/40 dark:to-transparent",
      },
      {
        title: "Student Management",
        url: "/admin/students",
        icon: Users,
        description: "Roster & attendance",
        gradient: "from-blue-100 via-indigo-50 to-white dark:from-blue-900/40 dark:via-indigo-950/40 dark:to-transparent",
      },
      {
        title: "Teacher Management",
        url: "/admin/teachers",
        icon: GraduationCap,
        description: "Faculty analytics",
        gradient: "from-rose-100 via-red-50 to-white dark:from-rose-900/40 dark:via-red-950/40 dark:to-transparent",
      },
      {
        title: "Course Management",
        url: "/admin/courses",
        icon: ClipboardList,
        description: "Curriculum operations",
        gradient: "from-sky-100 via-cyan-50 to-white dark:from-sky-900/40 dark:via-cyan-950/40 dark:to-transparent",
      },
      {
        title: "Assessments & Grading",
        url: "/admin/assessments",
        icon: FileText,
        description: "AI evaluation queue",
        gradient: "from-amber-100 via-orange-50 to-white dark:from-amber-900/40 dark:via-orange-950/40 dark:to-transparent",
      },
      {
        title: "Career & Employability",
        url: "/admin/career",
        icon: Briefcase,
        description: "Placement signals",
        gradient: "from-green-100 via-teal-50 to-white dark:from-green-900/40 dark:via-teal-950/40 dark:to-transparent",
      },
      {
        title: "Performance Analytics",
        url: "/admin/analytics",
        icon: LineChart,
        description: "Predictive insights",
        gradient: "from-purple-100 via-violet-50 to-white dark:from-purple-900/40 dark:via-violet-950/40 dark:to-transparent",
      },
    ];

    const navSecondary: NavItem[] = [
      {
        title: "Research & Policy",
        url: "/admin/research",
        icon: Layers,
        description: "Equity dashboard",
        gradient: "from-indigo-100 via-slate-50 to-white dark:from-indigo-900/40 dark:via-slate-950/40 dark:to-transparent",
      },
      {
        title: "Reports & Exports",
        url: "/admin/reports",
        icon: CheckCircle,
        description: "Institutional decks",
        gradient: "from-lime-100 via-emerald-50 to-white dark:from-lime-900/40 dark:via-emerald-950/40 dark:to-transparent",
      },
      {
        title: "Notifications / Alerts",
        url: "/admin/notifications",
        icon: Inbox,
        description: "System signals",
        gradient: "from-slate-100 via-zinc-50 to-white dark:from-slate-900/40 dark:via-zinc-950/40 dark:to-transparent",
      },
      {
        title: "Profile Change Requests",
        url: "/admin/profile-requests",
        icon: ClipboardCheck,
        description: "Review profile updates",
        gradient: "from-emerald-100 via-teal-50 to-white dark:from-emerald-900/40 dark:via-teal-950/40 dark:to-transparent",
      },
      {
        title: "System Settings",
        url: "/admin/settings",
        icon: Settings,
        description: "Platform controls",
        gradient: "from-slate-200 via-slate-100 to-white dark:from-slate-900/40 dark:via-slate-950/40 dark:to-transparent",
      },
    ];

    return { navMain, navSecondary };
  }, []);

  const pageMeta = useMemo(() => {
    const allItems = [...navigationData.navMain, ...navigationData.navSecondary];
    const match = allItems.find((item) => item.url === location.pathname);
    if (match) {
      return { title: match.title, description: match.description };
    }
    return { title: "Admin Console", description: "Monitor operations and outcomes" };
  }, [location.pathname, navigationData.navMain, navigationData.navSecondary]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const openMobileNav = useCallback(() => setIsMobileOpen(true), []);
  const closeMobileNav = useCallback(() => setIsMobileOpen(false), []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery("");
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const renderNavItem = (item: NavItem, { collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void } = {}) => {
    const isActive = location.pathname === item.url;

    return (
      <Link
        key={item.title}
        to={item.url}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center transition-all duration-200 ease-out",
          collapsed ? "h-12 w-12 justify-center rounded-3xl" : "gap-3 rounded-3xl px-4 py-3",
          isActive
            ? `bg-gradient-to-r ${item.gradient} shadow-lg ring-1 ring-primary/20 text-foreground`
            : "border border-transparent hover:border-border/60 hover:bg-white/70 text-slate-900 dark:text-slate-100 dark:hover:bg-white/5",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-2xl",
            isActive ? "bg-white/80 text-primary dark:bg-white/10" : "bg-white/60 text-slate-600 dark:bg-white/10 dark:text-slate-200",
          )}
        >
          <item.icon className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="flex flex-1 flex-col overflow-hidden text-slate-900 dark:text-slate-100">
            <span className="text-sm font-semibold truncate">{item.title}</span>
            <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{item.description}</span>
          </div>
        )}
        {!collapsed && item.badge && (
          <Badge variant="secondary" className="ml-auto px-2 py-0 text-[10px]">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const desktopPadding = isCollapsed ? "md:pl-24" : "md:pl-80";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/40">
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobileNav} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-border/60 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.35)] md:flex",
          "bg-white/95 dark:bg-slate-950/95",
          isCollapsed ? "w-24" : "w-80",
        )}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-3">
            <img src={IubLogo} alt="EduCareer Logo" className="h-11 w-11 rounded-2xl bg-white object-contain p-1" />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">EduCareer AI</span>
                <span className="text-lg font-semibold leading-tight text-foreground">Admin Console</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="hidden h-9 w-9 rounded-xl border border-border/60 bg-white/60 text-muted-foreground transition-all hover:text-foreground md:flex"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className={cn("mx-5 mb-5 rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-3 shadow-inner dark:border-white/10 dark:from-slate-950/90 dark:via-slate-950/80 dark:to-blue-950/70", {
          hidden: isCollapsed,
        })}>
          <p className="text-xs font-semibold text-muted-foreground">Realtime Updates</p>
          <div className="mt-2 flex items-end gap-2 text-primary">
            <span className="text-2xl font-semibold">12</span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Alerts today</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">AI recently synced compliance, assessments, and placement signals.</p>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-6">
          <div className="space-y-2">
            {!isCollapsed && <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operations</p>}
            <div className={cn("grid gap-2", { "justify-items-center": isCollapsed })}>
              {navigationData.navMain.map((item) => renderNavItem(item, { collapsed: isCollapsed }))}
            </div>
          </div>

          <div className="space-y-2">
            {!isCollapsed && <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Governance</p>}
            <div className={cn("grid gap-2", { "justify-items-center": isCollapsed })}>
              {navigationData.navSecondary.map((item) => renderNavItem(item, { collapsed: isCollapsed }))}
            </div>
          </div>
        </div>

        {!isCollapsed && (
          <div className="px-5 pb-6">
            <div className="rounded-2xl border border-border/60 bg-white/85 p-3 shadow-sm dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">{adminProfile.name}</span>
                  <span className="text-[11px] text-muted-foreground">{adminProfile.email}</span>
                </div>
              </div>
              <Button className="mt-3 w-full rounded-xl py-2 text-xs font-medium" variant="secondary" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        )}
      </aside>

      <div className={cn("flex min-h-screen flex-col", desktopPadding)}>
        <header className="sticky top-0 z-40 border-b border-border/60 bg-white/95 dark:bg-slate-950/85">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl border border-border/60 bg-white/70 text-muted-foreground transition-all hover:text-foreground md:hidden"
                onClick={openMobileNav}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-foreground sm:text-xl">{pageMeta.title}</h1>
                  <Badge variant="secondary" className="hidden items-center gap-1 px-2 py-0 text-xs sm:inline-flex">
                    <Sparkles className="h-3 w-3" />
                    AI Assisted
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{pageMeta.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden min-w-[120px] flex-col text-right sm:flex">
                <span className="text-sm font-semibold text-foreground">
                  {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search admin workspace..."
                    className="w-72 rounded-2xl border border-border/60 bg-white/80 pl-9 text-sm dark:bg-slate-900/60"
                  />
                </div>
              </form>

              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 rounded-2xl border border-border/60 bg-white/75 text-muted-foreground transition-all hover:text-foreground dark:bg-slate-900/70"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-medium text-primary-foreground">
                  4
                </span>
              </Button>
              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-white/85 px-3 text-left dark:bg-slate-900/75">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col text-left sm:flex">
                      <span className="text-sm font-medium leading-tight text-foreground">{adminProfile.name}</span>
                      <span className="truncate text-xs leading-tight text-muted-foreground max-w-[140px]">{adminProfile.email}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-border/60 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
                  <DropdownMenuLabel className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-tight text-foreground">{adminProfile.name}</p>
                        <p className="truncate text-xs text-muted-foreground max-w-[160px]">{adminProfile.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/80" />
                  <DropdownMenuGroup className="px-1 py-1 text-sm">
                    <DropdownMenuItem className="gap-3">
                      <Settings className="h-4 w-4" />
                      Admin settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-3">
                      <Sparkles className="h-4 w-4" />
                      Feature flags
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-border/80" />
                  <DropdownMenuItem className="gap-3 text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="relative px-4 pb-10 pt-6 sm:px-6 lg:px-8">
            <div className="rounded-[28px] border border-border/60 bg-white/95 p-6 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.45)] dark:bg-slate-950/80">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {isMobileOpen && (
        <div className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col border-r border-border/60 bg-white px-4 py-5 shadow-2xl dark:bg-slate-950 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={IubLogo} alt="EduCareer Logo" className="h-10 w-10 rounded-2xl bg-white object-contain p-1" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">EduCareer AI</span>
                <span className="text-sm font-semibold text-foreground">Admin Console</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={closeMobileNav}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 flex-1 space-y-6 overflow-y-auto pb-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operations</p>
              <div className="grid gap-2">
                {navigationData.navMain.map((item) => renderNavItem(item, { onNavigate: closeMobileNav }))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Governance</p>
              <div className="grid gap-2">
                {navigationData.navSecondary.map((item) => renderNavItem(item, { onNavigate: closeMobileNav }))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white/85 p-3 shadow-sm dark:bg-slate-900/70">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9">
                <AvatarImage src={adminProfile.avatarUrl} alt={adminProfile.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">{adminProfile.name}</span>
                <span className="text-[11px] text-muted-foreground">{adminProfile.email}</span>
              </div>
            </div>
            <Button className="mt-3 w-full rounded-xl py-2 text-xs font-medium" variant="secondary" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
