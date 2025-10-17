import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Brain,
  Briefcase,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crown,
  Diamond,
  FileText,
  GraduationCap,
  Home,
  Info,
  LogOut,
  Menu,
  MessageSquare,
  Mail,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
  BarChart3,
  BarChart4,
  CalendarDays,
  IdCard,
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
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./auth-provider";
import IubLogo from "../assets/iub-logo.png";

const SIDEBAR_STORAGE_KEY = "educareer-sidebar-collapsed";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
  gradient: string;
  badge?: string;
  premium?: boolean;
};

type UserMetadata = {
  name?: string;
  plan?: string;
  tier?: string;
  org?: string;
  avatar_url?: string;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const userMetadata = (user as { user_metadata?: UserMetadata } | null)?.user_metadata;

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
  const premiumTier = userMetadata?.tier?.toLowerCase() ?? (isPremium ? "premium" : "member");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (!stored) return;
      setIsCollapsed(JSON.parse(stored));
    } catch (error) {
      console.warn("Failed to parse sidebar state", error);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const openMobileNav = useCallback(() => setIsMobileOpen(true), []);
  const closeMobileNav = useCallback(() => setIsMobileOpen(false), []);

  const navigationData = useMemo(() => {
    const navMain: NavItem[] = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        description: "Overview & analytics",
        gradient: "from-emerald-100 via-emerald-50 to-white dark:from-emerald-900/40 dark:via-emerald-950/40 dark:to-transparent",
      },
      {
        title: "Students",
        url: "/students",
        icon: Users,
        description: "Manage cohorts",
        gradient: "from-blue-100 via-indigo-50 to-white dark:from-blue-900/40 dark:via-indigo-950/40 dark:to-transparent",
      },
      {
        title: "AI Learning Insights",
        url: "/insights",
        icon: BarChart3,
        description: "Personalized analytics",
        gradient: "from-fuchsia-100 via-purple-50 to-white dark:from-fuchsia-900/40 dark:via-purple-950/40 dark:to-transparent",
      },
      {
        title: "Upcoming Tasks",
        url: "/tasks",
        icon: CalendarDays,
        description: "Deadlines & reminders",
        gradient: "from-amber-100 via-orange-50 to-white dark:from-amber-900/40 dark:via-orange-950/40 dark:to-transparent",
      },
      {
        title: "My Courses",
        url: "/courses",
        icon: BookOpen,
        description: "Track enrolled modules",
        gradient: "from-sky-100 via-cyan-50 to-white dark:from-sky-900/40 dark:via-cyan-950/40 dark:to-transparent",
      },
      {
        title: "Learning Paths",
        url: "/learning",
        icon: Briefcase,
        description: "Curate journeys",
        gradient: "from-purple-100 via-violet-50 to-white dark:from-purple-900/40 dark:via-violet-950/40 dark:to-transparent",
      },
      {
        title: "Analytics",
        url: "/analytics",
        icon: Trophy,
        description: "Performance metrics",
        gradient: "from-indigo-100 via-slate-50 to-white dark:from-indigo-900/40 dark:via-slate-950/40 dark:to-transparent",
        badge: isPremium ? "Pro" : "Upgrade",
        premium: !isPremium,
      },
      {
        title: "Teachers",
        url: "/teachers",
        icon: GraduationCap,
        description: "Mentor network",
        gradient: "from-rose-100 via-red-50 to-white dark:from-rose-900/40 dark:via-red-950/40 dark:to-transparent",
      },
      {
        title: "Assessments",
        url: "/assessments",
        icon: FileText,
        description: "Build evaluations",
        gradient: "from-amber-100 via-orange-50 to-white dark:from-amber-900/40 dark:via-orange-950/40 dark:to-transparent",
      },
      {
        title: "Career Guidance",
        url: "/career",
        icon: Briefcase,
        description: "Tailored planning",
        gradient: "from-green-100 via-teal-50 to-white dark:from-green-900/40 dark:via-teal-950/40 dark:to-transparent",
      },
      {
        title: "Learning Reports",
        url: "/reports",
        icon: BarChart4,
        description: "In-depth analytics",
        gradient: "from-emerald-100 via-lime-50 to-white dark:from-emerald-900/40 dark:via-lime-950/40 dark:to-transparent",
      },
      {
        title: "Contact",
        url: "/contact",
        icon: Mail,
        description: "Team directory",
        gradient: "from-blue-100 via-slate-50 to-white dark:from-blue-900/40 dark:via-slate-950/40 dark:to-transparent",
      },
      {
        title: "About",
        url: "/about",
        icon: Info,
        description: "Vision & team",
        gradient: "from-indigo-100 via-blue-50 to-white dark:from-indigo-900/40 dark:via-blue-950/40 dark:to-transparent",
      },
    ];

    const navSecondary: NavItem[] = [
      {
        title: "Profile",
        url: "/profile",
        icon: IdCard,
        description: "Personal information",
        gradient: "from-emerald-100 via-green-50 to-white dark:from-emerald-900/40 dark:via-green-950/40 dark:to-transparent",
      },
      {
        title: "Research",
        url: "/research",
        icon: Brain,
        description: "Insights & reports",
        gradient: "from-cyan-100 via-blue-50 to-white dark:from-cyan-900/40 dark:via-blue-950/40 dark:to-transparent",
      },
      {
        title: "AI Assistant",
        url: "/assistant",
        icon: MessageSquare,
        description: "Instant guidance",
        gradient: "from-pink-100 via-purple-50 to-white dark:from-pink-900/40 dark:via-purple-950/40 dark:to-transparent",
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        description: "Customize portal",
        gradient: "from-slate-100 via-zinc-50 to-white dark:from-slate-900/40 dark:via-zinc-950/40 dark:to-transparent",
      },
    ];

    return { navMain, navSecondary };
  }, [isPremium]);

  const pageMeta = useMemo(() => {
    const allItems = [...navigationData.navMain, ...navigationData.navSecondary];
    const match = allItems.find((item) => item.url === location.pathname);
    if (match) {
      return { title: match.title, description: match.description };
    }
    return { title: "EduCareer AI", description: "Elevate learning and career journeys" };
  }, [location.pathname, navigationData.navMain, navigationData.navSecondary]);

  const getPremiumIcon = () => {
    if (!isPremium) return <Star className="h-5 w-5 text-slate-400" />;
    if (premiumTier === "platinum") return <Diamond className="h-5 w-5 text-purple-400" />;
    return <Crown className="h-5 w-5 text-amber-400" />;
  };

  const getPremiumGradient = () => {
    if (!isPremium) {
      return "from-slate-100 via-white to-blue-50 dark:from-slate-950/80 dark:via-slate-950/70 dark:to-blue-950/70";
    }
    if (premiumTier === "platinum") {
      return "from-purple-200 via-pink-100 to-blue-100 dark:from-purple-950/70 dark:via-pink-950/60 dark:to-blue-950/60";
    }
    return "from-blue-200 via-teal-100 to-emerald-100 dark:from-blue-950/70 dark:via-cyan-950/60 dark:to-emerald-950/60";
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery("");
  };

  const handleLogout = async () => {
    try {
      await signout();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("profile-bypass");
      }
      navigate("/", { replace: true });
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          window.location.replace("/");
        }, 250);
      }
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  const renderNavItem = (item: NavItem, { collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void } = {}) => {
    const isActive = location.pathname === item.url;
    const badgeVariant = item.premium && !isPremium ? "destructive" : "secondary";

    return (
      <Link
        key={item.title}
        to={item.url}
        onClick={onNavigate}
        className={`group relative flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-3xl transition-colors duration-200 ease-out ${
          isActive
            ? `bg-gradient-to-r ${item.gradient} shadow-lg ring-1 ring-primary/25 text-foreground`
            : "border border-transparent text-muted-foreground hover:border-border/60 hover:bg-white/70 dark:hover:bg-white/5"
        } ${collapsed ? "h-12 w-12" : "px-4 py-3"}`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
            isActive ? "bg-white/80 text-primary dark:bg-white/10" : "bg-white/50 text-muted-foreground dark:bg-white/5"
          }`}
        >
          <item.icon className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="text-sm font-semibold text-foreground truncate">{item.title}</span>
            <span className="text-xs text-muted-foreground truncate">{item.description}</span>
          </div>
        )}
        {!collapsed && item.badge && (
          <Badge variant={badgeVariant} className="ml-auto text-[10px] px-2 py-0">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const cartItemCount = 3;
  const desktopPadding = isCollapsed ? "md:pl-24" : "md:pl-80";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/40">
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobileNav} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-border/60 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.35)] md:flex ${
          isPremium
            ? "bg-gradient-to-b from-white/95 via-purple-50/90 to-blue-50/85 dark:from-slate-950/95 dark:via-purple-950/90 dark:to-blue-950/85"
            : "bg-white/95 dark:bg-slate-950/95"
        } ${isCollapsed ? "w-24" : "w-80"}`}
      >
          <div className="flex items-center justify-between px-5 py-6">
            <div className="flex items-center gap-3">
              <img src={IubLogo} alt="EduCareer Logo" className="h-11 w-11 rounded-2xl bg-white object-contain p-1" />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">EduCareer</span>
                  <span className="text-lg font-semibold leading-tight text-foreground">Navigator Suite</span>
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

          {!isCollapsed && (
            <div className={`mx-5 mb-5 rounded-md border border-white/60 bg-gradient-to-br ${getPremiumGradient()} p-2.5 shadow-inner dark:border-white/10`}>
              <div className="flex items-start gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/80 text-primary shadow-sm dark:bg-white/10">
                  {getPremiumIcon()}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-foreground">{displayName}</span>
                    <Badge variant="secondary" className="px-1 py-0 text-[9px] capitalize">
                      {premiumTier}
                    </Badge>
                  </div>
                  {secondaryEmail && <span className="text-[10px] text-muted-foreground">{secondaryEmail}</span>}
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Empower {userMetadata?.org || "your learners"} with adaptive guidance and smart automation.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="rounded-md border border-white/60 bg-white/70 px-2 py-1.5 text-center font-semibold text-primary shadow-sm dark:border-white/10 dark:bg-white/5">
                      <span className="text-[13px] leading-none">1.2k</span>
                      <span className="mt-1 block text-[9px] font-normal text-muted-foreground">Active Learners</span>
                    </div>
                    <div className="rounded-md border border-white/60 bg-white/70 px-2 py-1.5 text-center font-semibold text-primary shadow-sm dark:border-white/10 dark:bg-white/5">
                      <span className="text-[13px] leading-none">32</span>
                      <span className="mt-1 block text-[9px] font-normal text-muted-foreground">Programs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-6">
            <div className="space-y-2">
              {!isCollapsed && <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</p>}
              <div className={`grid gap-2 ${isCollapsed ? "justify-items-center" : ""}`}>
                {navigationData.navMain.map((item) => renderNavItem(item, { collapsed: isCollapsed }))}
              </div>
            </div>

            <div className="space-y-2">
              {!isCollapsed && <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workflow</p>}
              <div className={`grid gap-2 ${isCollapsed ? "justify-items-center" : ""}`}>
                {navigationData.navSecondary.map((item) => renderNavItem(item, { collapsed: isCollapsed }))}
              </div>
            </div>
          </div>

          <div className="px-5 pb-6">
            <div className={`rounded-2xl border border-border/60 bg-white/85 p-3 shadow-sm dark:bg-slate-900/70 ${isCollapsed ? "hidden" : "block"}`}>
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userMetadata?.avatar_url} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">{displayName}</span>
                  {secondaryEmail && <span className="text-[11px] text-muted-foreground">{secondaryEmail}</span>}
                </div>
              </div>
              <Button className="mt-3 w-full rounded-xl py-2 text-xs font-medium" variant="secondary" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
      </aside>

      <div className={`flex min-h-screen flex-col ${desktopPadding}`}>
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
                    Smart Insights
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
                    placeholder="Search the workspace..."
                    className="w-72 rounded-2xl border border-border/60 bg-white/80 pl-9 text-sm dark:bg-slate-900/60"
                  />
                </div>
              </form>

              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 rounded-2xl border border-border/60 bg-white/75 text-muted-foreground transition-all hover:text-foreground dark:bg-slate-900/70"
              >
                <ShoppingBag className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-medium text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
              </Button>
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
                      <AvatarImage src={userMetadata?.avatar_url} alt={displayName} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-sm font-medium text-foreground leading-tight">{displayName}</span>
                      {secondaryEmail && (
                        <span className="text-xs text-muted-foreground leading-tight truncate max-w-[140px]">{secondaryEmail}</span>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-border/60 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
                  <DropdownMenuLabel className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userMetadata?.avatar_url} alt={displayName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-tight text-foreground">{displayName}</p>
                        {secondaryEmail && (
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{secondaryEmail}</p>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/80" />
                  <div className="px-3 py-3">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">Spotlights</p>
                        <p className="text-xs">New cohort analytics shipped this week.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Usage</p>
                        <p className="text-xs">12 new learners onboarded today.</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/80" />
                  <DropdownMenuGroup className="px-1 py-1 text-sm">
                    <DropdownMenuItem className="gap-3">
                      <Settings className="h-4 w-4" />
                      Account settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-3">
                      <Sparkles className="h-4 w-4" />
                      Upgrade workspace
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-3">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="relative px-4 pb-10 pt-6 sm:px-6 lg:px-8">
            <div className="rounded-[28px] border border-border/60 bg-white/95 p-6 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.45)] dark:bg-slate-950/80">
              {children}
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
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">EduCareer</span>
                  <span className="text-sm font-semibold text-foreground">Navigator Suite</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={closeMobileNav}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 flex-1 space-y-6 overflow-y-auto pb-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</p>
                <div className="grid gap-2">
                  {navigationData.navMain.map((item) => renderNavItem(item, { onNavigate: closeMobileNav }))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workflow</p>
                <div className="grid gap-2">
                  {navigationData.navSecondary.map((item) => renderNavItem(item, { onNavigate: closeMobileNav }))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-white/85 p-3 shadow-sm dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userMetadata?.avatar_url} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">{displayName}</span>
                  {secondaryEmail && <span className="text-[11px] text-muted-foreground">{secondaryEmail}</span>}
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
