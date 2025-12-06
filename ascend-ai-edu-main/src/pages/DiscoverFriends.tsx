import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Users, UserPlus, UserCheck, Loader2, CheckCircle2, XCircle, Search, Inbox, Sparkles, X, LayoutGrid, Rows3, Clock, ChevronDown, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFriendNetwork, type FriendRequestEntry, type FriendStudentProfile } from "@/hooks/useFriendNetwork";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs } from "firebase/firestore";
import { useIsMobile } from "@/hooks/use-mobile";

type ViewMode = "discover" | "people" | "friends" | "requests";

type StatItem = {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  backgroundClass: string;
  iconClass: string;
};

const SORT_FILTER_OPTIONS: FilterOption[] = [
  { value: "name", label: "Name A–Z" },
  { value: "nameDesc", label: "Name Z–A" },
];

type FilterOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: FilterOption[];
};

const filterListVariants = {
  open: {
    scaleY: 1,
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
      ease: [0.22, 1, 0.36, 1],
      duration: 0.18,
    },
  },
  closed: {
    scaleY: 0.9,
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.06,
      ease: [0.4, 0, 0.2, 1],
      duration: 0.12,
    },
  },
};

const filterItemVariants = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ease: [0.22, 1, 0.36, 1],
      duration: 0.16,
    },
  },
  closed: {
    opacity: 0,
    y: -14,
    scale: 0.96,
    transition: {
      ease: [0.4, 0, 0.2, 1],
      duration: 0.1,
    },
  },
};

const AnimatedFilterSelect = ({ value, onValueChange, placeholder, options }: FilterSelectProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectedLabel = useMemo(() => options.find((option) => option.value === value)?.label ?? "", [options, value]);

  const handleSelect = useCallback(
    (nextValue: string) => {
      onValueChange(nextValue);
      setOpen(false);
    },
    [onValueChange],
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-border/60 bg-white px-3 text-sm shadow-theme-xs transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-slate-900",
        )}
      >
        <span className={cn("truncate text-left", !selectedLabel && "text-muted-foreground")}>{selectedLabel || placeholder}</span>
        <motion.span animate={open ? { rotate: 180 } : { rotate: 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            key="filter-dropdown"
            initial="closed"
            animate="open"
            exit="closed"
            variants={filterListVariants}
            style={{ transformOrigin: "top center" }}
            className="absolute left-0 top-[110%] z-50 min-w-full space-y-1 rounded-xl border border-border/60 bg-white/95 p-2 shadow-xl outline-none backdrop-blur-sm dark:bg-slate-950/95"
          >
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <motion.li
                  key={option.value}
                  variants={filterItemVariants}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition",
                    "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-900/80",
                    isActive && "bg-blue-50 text-blue-600 dark:bg-slate-900/70 dark:text-blue-300",
                  )}
                >
                  <motion.span
                    initial={false}
                    animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex h-4 w-4 items-center justify-center"
                  >
                    <Check className="h-4 w-4" />
                  </motion.span>
                  <span className="truncate">{option.label}</span>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const DiscoverFriends = () => {
  const {
    currentUid,
    students,
    friendsMap,
    onlineUsers,
    pendingIncoming,
    pendingOutgoing,
    incomingRequests,
    outgoingRequests,
    handleAddFriend,
    handleRespondToRequest,
    handleCancelRequest,
    hasPendingIncoming,
  } = useFriendNetwork();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("discover");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);
  const [completedOnly, setCompletedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"name" | "nameDesc">("name");
  const [mutualCount, setMutualCount] = useState<number | null>(null);
  const [mutualLoading, setMutualLoading] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  const handleSelectProfile = useCallback(
    (uid: string) => {
      setSelectedProfileUid(uid);
      if (isMobile) {
        setProfileDrawerOpen(true);
      }
    },
    [isMobile],
  );

  const handleProfileDrawerChange = useCallback(
    (open: boolean) => {
      setProfileDrawerOpen(open);
      if (!open && isMobile) {
        setSelectedProfileUid(null);
      }
    },
    [isMobile],
  );

  const getActivityMeta = useCallback(
    (uid: string) => {
      const entry = onlineUsers[uid];
      if (!entry) return null;
      if (entry.isOnline) {
        return { text: "Active now", tone: "online" as const };
      }
      const lastSeen = entry.lastSeen ?? null;
      if (!lastSeen) return null;
      try {
        return { text: `Active ${formatDistanceToNow(lastSeen, { addSuffix: true })}`, tone: "recent" as const };
      } catch (_error) {
        return null;
      }
    },
    [onlineUsers],
  );

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [students],
  );

  const lowerSearch = search.trim().toLowerCase();

  const highlight = useCallback(
    (text: string): ReactNode => {
      if (!lowerSearch) return text;
      const idx = text.toLowerCase().indexOf(lowerSearch);
      if (idx === -1) return text;
      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + lowerSearch.length);
      const after = text.slice(idx + lowerSearch.length);
      return (
        <span>
          {before}
          <mark className="rounded bg-yellow-200/70 px-0.5 py-0 dark:bg-yellow-400/30">{match}</mark>
          {after}
        </span>
      );
    },
    [lowerSearch],
  );

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department && s.department.trim()) set.add(s.department);
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [students]);

  const departmentSelectOptions = useMemo<FilterOption[]>(
    () =>
      departmentOptions.map((opt) => ({
        value: opt,
        label: opt === "all" ? "All departments" : opt,
      })),
    [departmentOptions],
  );

  const hasAnyFilter = useMemo(
    () => departmentFilter !== "all" || batchFilter !== "all" || onlineOnly || completedOnly || Boolean(lowerSearch),
    [departmentFilter, batchFilter, onlineOnly, completedOnly, lowerSearch],
  );

  const clearFilters = useCallback(() => {
    setDepartmentFilter("all");
    setBatchFilter("all");
    setOnlineOnly(false);
    setCompletedOnly(false);
    setSearch("");
    setSortBy("name");
  }, []);

  const batchOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.batch && s.batch.trim()) set.add(s.batch);
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [students]);

  const batchSelectOptions = useMemo<FilterOption[]>(
    () =>
      batchOptions.map((opt) => ({
        value: opt,
        label: opt === "all" ? "All batches" : opt,
      })),
    [batchOptions],
  );

  const computeScore = (profile: FriendStudentProfile): number => {
    let score = 0;
    const online = Boolean(onlineUsers[profile.uid]?.isOnline);
    if (online) score += 3;
    if (profile.profileCompleted) score += 1;
    return score;
  };

  const applyFilters = (list: FriendStudentProfile[]): FriendStudentProfile[] => {
    return list.filter((p) => {
      if (departmentFilter !== "all" && (p.department || "").toLowerCase() !== departmentFilter.toLowerCase()) return false;
      if (batchFilter !== "all" && (p.batch || "").toLowerCase() !== batchFilter.toLowerCase()) return false;
      if (onlineOnly && !onlineUsers[p.uid]?.isOnline) return false;
      if (completedOnly && !p.profileCompleted) return false;
      return true;
    });
  };

  const sortProfiles = (list: FriendStudentProfile[]): FriendStudentProfile[] => {
    if (sortBy === "nameDesc") {
      return [...list].sort((a, b) => b.fullName.localeCompare(a.fullName));
    }

    return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
  };

  const peopleList = useMemo(() => {
    const base = !lowerSearch
      ? sortedStudents
      : sortedStudents.filter((student) => student.fullName.toLowerCase().includes(lowerSearch));
    return sortProfiles(applyFilters(base));
  }, [sortedStudents, lowerSearch, departmentFilter, batchFilter, onlineOnly, completedOnly, sortBy]);

  const friendsList = useMemo(() => {
    const base = sortedStudents.filter((student) => Boolean(friendsMap[student.uid] && student.uid !== currentUid));
    return sortProfiles(applyFilters(base));
  }, [sortedStudents, friendsMap, currentUid, departmentFilter, batchFilter, onlineOnly, completedOnly, sortBy]);

  const discoverList = useMemo(() => {
    const base = sortedStudents.filter((student) => {
      if (student.uid === currentUid) return false;
      if (friendsMap[student.uid]) return false;
      const pendingOut = pendingOutgoing.some((request) => request.receiverUid === student.uid && request.status === "pending");
      const pendingIn = hasPendingIncoming(student.uid);
      return !(pendingOut || pendingIn);
    });
    const searched = !lowerSearch ? base : base.filter((student) => student.fullName.toLowerCase().includes(lowerSearch));
    return sortProfiles(applyFilters(searched));
  }, [sortedStudents, currentUid, friendsMap, pendingOutgoing, hasPendingIncoming, lowerSearch, departmentFilter, batchFilter, onlineOnly, completedOnly, sortBy]);

  const incomingPending = useMemo(() => pendingIncoming.filter((request) => request.status === "pending"), [pendingIncoming]);
  const outgoingPending = useMemo(() => pendingOutgoing.filter((request) => request.status === "pending"), [pendingOutgoing]);

  const totalPending = incomingPending.length + outgoingPending.length;

  const activeList = viewMode === "friends" ? friendsList : viewMode === "people" ? peopleList : discoverList;

  const onlineFriendCount = useMemo(
    () => friendsList.reduce((count, profile) => (onlineUsers[profile.uid]?.isOnline ? count + 1 : count), 0),
    [friendsList, onlineUsers],
  );

  const stats = useMemo<StatItem[]>(
    () => [
      {
        label: "Connections",
        value: friendsList.length,
        helper: `${onlineFriendCount} online now`,
        icon: UserCheck,
        backgroundClass: "bg-sky-50/70 dark:bg-sky-500/10",
        iconClass: "text-sky-600 dark:text-sky-300",
      },
      {
        label: "New suggestions",
        value: discoverList.length,
        helper: "Based on your program & cohort",
        icon: Sparkles,
        backgroundClass: "bg-amber-50/70 dark:bg-amber-500/10",
        iconClass: "text-amber-600 dark:text-amber-300",
      },
      {
        label: "Pending requests",
        value: incomingPending.length + outgoingPending.length,
        helper: `${incomingPending.length} incoming · ${outgoingPending.length} outgoing`,
        icon: Inbox,
        backgroundClass: "bg-violet-50/70 dark:bg-violet-500/10",
        iconClass: "text-violet-600 dark:text-violet-300",
      },
    ],
    [friendsList.length, onlineFriendCount, discoverList.length, incomingPending.length, outgoingPending.length],
  );

  const emptyState = useMemo(() => {
    if (viewMode === "friends") {
      return {
        title: "You haven't added any friends yet",
        description: "Send requests from the Discover tab to bring connections into your chat inbox.",
      };
    }
    if (viewMode === "people") {
      return {
        title: "No people match your search",
        description: hasAnyFilter
          ? "Try adjusting filters or clearing them to explore the full campus community."
          : `We couldn't find anyone matching "${search}".`,
      };
    }
    return {
      title: "No new classmates match your filters",
      description: hasAnyFilter
        ? "Relax filters or switch to the People tab to browse everyone on campus."
        : "You're connected with everyone for now. Check People to browse the full directory.",
    };
  }, [viewMode, hasAnyFilter, search]);

  const selectedProfile = useMemo(
    () => sortedStudents.find((student) => student.uid === selectedProfileUid) ?? null,
    [sortedStudents, selectedProfileUid],
  );

  const selectedIsFriend = selectedProfile ? Boolean(friendsMap[selectedProfile.uid]) : false;
  const selectedPendingIncoming = selectedProfile ? incomingRequests.find((request) => request.senderUid === selectedProfile.uid && request.status === "pending") : undefined;
  const selectedPendingOutgoing = selectedProfile ? outgoingRequests.find((request) => request.receiverUid === selectedProfile.uid && request.status === "pending") : undefined;

  // Lazy-load mutual friends count for the selected profile only
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedProfile || !currentUid) {
        setMutualCount(null);
        return;
      }
      if (selectedProfile.uid === currentUid) {
        setMutualCount(0);
        return;
      }
      try {
        setMutualLoading(true);
        const snap = await getDocs(collection(db, "users", selectedProfile.uid, "friends"));
        const theirFriendUids = new Set<string>();
        snap.forEach((d) => theirFriendUids.add(d.id));
        const myFriendUids = new Set(Object.keys(friendsMap));
        let count = 0;
        theirFriendUids.forEach((uid) => {
          if (uid !== currentUid && myFriendUids.has(uid)) count += 1;
        });
        if (!cancelled) setMutualCount(count);
      } catch (_e) {
        if (!cancelled) setMutualCount(null);
      } finally {
        if (!cancelled) setMutualLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedProfile, currentUid, friendsMap]);

  const renderRequestActions = (request: FriendRequestEntry) => (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="rounded-xl text-xs"
        onClick={(event) => {
          event.stopPropagation();
          handleRespondToRequest(request, "accepted");
        }}
      >
        <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Accept
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-xl text-xs"
        onClick={(event) => {
          event.stopPropagation();
          handleRespondToRequest(request, "rejected");
        }}
      >
        <XCircle className="mr-2 h-3.5 w-3.5" /> Reject
      </Button>
    </div>
  );

  const renderRequestsPanel = (variant: "inline" | "sheet"): ReactNode => {
    if (totalPending === 0) {
      return (
        <div
          className={cn(
            "rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground",
            variant === "sheet" ? "bg-muted/20" : "bg-white/90 dark:bg-slate-950/75",
          )}
        >
          You're all caught up on friend requests.
        </div>
      );
    }

    const requestCardClass = cn(
      "flex items-center justify-between rounded-2xl border border-border/60 bg-white/90 p-3 shadow-sm dark:bg-slate-950/80",
      variant === "sheet" && "bg-white/95 dark:bg-slate-950/75",
    );

    return (
      <div className="space-y-4">
        {incomingPending.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Incoming</span>
            <div className="space-y-3">
              {incomingPending.map((request) => {
                const sender = sortedStudents.find((student) => student.uid === request.senderUid);
                if (!sender) return null;
                const createdAtLabel = request.createdAt ? formatDistanceToNow(request.createdAt, { addSuffix: true }) : "Just now";
                return (
                  <div key={request.id} className={requestCardClass}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={sender.photoUrl} alt={sender.fullName} />
                        <AvatarFallback>{sender.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{sender.fullName}</span>
                        <span className="text-xs text-muted-foreground">wants to connect · {createdAtLabel}</span>
                      </div>
                    </div>
                    {renderRequestActions(request)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {outgoingPending.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outgoing</span>
            <div className="space-y-3">
              {outgoingPending.map((request) => {
                const receiver = sortedStudents.find((student) => student.uid === request.receiverUid);
                if (!receiver) return null;
                const createdAtLabel = request.createdAt ? formatDistanceToNow(request.createdAt, { addSuffix: true }) : "Just now";
                return (
                  <div key={request.id} className={requestCardClass}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={receiver.photoUrl} alt={receiver.fullName} />
                        <AvatarFallback>{receiver.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{receiver.fullName}</span>
                        <span className="text-xs text-muted-foreground">awaiting approval · sent {createdAtLabel}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => {
                      console.log("Cancel button clicked for request:", request.id);
                      console.log("Request details:", request);
                      handleCancelRequest(request.id);
                    }}>
                      Cancel
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProfilePreviewCard = (variant: "sidebar" | "sheet"): ReactNode => {
    if (!selectedProfile) {
      return (
        <div
          className={cn(
            "flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground",
            variant === "sheet" && "bg-muted/20",
          )}
        >
          Select a card to preview profile details here.
        </div>
      );
    }

    const handleMessage = () => {
      navigate(`/dashboard/chat?to=${selectedProfile.uid}`);
      if (isMobile) {
        setProfileDrawerOpen(false);
      }
    };

    const activity = getActivityMeta(selectedProfile.uid);
    const badges = [
      selectedProfile.department,
      selectedProfile.batch,
      selectedIsFriend ? "Friend" : null,
      selectedProfile.profileCompleted ? "Profile complete" : null,
    ].filter(Boolean) as string[];

    return (
      <div
        className={cn(
          "space-y-4 rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-slate-950/80",
          variant === "sheet" && "bg-white/95 dark:bg-slate-950/85",
        )}
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={selectedProfile.photoUrl} alt={selectedProfile.fullName} />
            <AvatarFallback>{selectedProfile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold text-foreground">{selectedProfile.fullName}</span>
            <span className="text-xs text-muted-foreground">
              {selectedProfile.department
                ? `${selectedProfile.department}${selectedProfile.batch ? ` · ${selectedProfile.batch}` : ""}`
                : selectedProfile.headline ?? "Learner"}
            </span>
            <span className="text-xs text-muted-foreground">
              Status: {onlineUsers[selectedProfile.uid]?.isOnline ? "Online" : "Offline"}
            </span>
            {activity ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {activity.text}
              </span>
            ) : null}
          </div>
        </div>
        <Separator />
        <div className="flex flex-wrap gap-1.5">
          {badges.length > 0 ? (
            badges.map((item) => (
              <Badge key={item} variant="outline" className="rounded-full bg-muted/30 text-[10px]">
                {item}
              </Badge>
            ))
          ) : (
            <span className="text-[11px] text-muted-foreground">No additional tags yet.</span>
          )}
        </div>
        <Separator />
        {selectedProfile.email && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Email</span>
            <span className="font-medium text-foreground">{selectedProfile.email}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Mutual friends</span>
          <span className="font-medium text-foreground">{mutualLoading ? "…" : mutualCount ?? "-"}</span>
        </div>
        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          Only connected friends appear in your chat inbox. Accept or send requests to start conversations.
        </div>
        <div className="flex flex-col gap-2">
          {selectedIsFriend ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="w-fit gap-1 text-[11px]">
                <UserCheck className="h-3.5 w-3.5" /> Already friends
              </Badge>
              <Button size="sm" className="rounded-xl text-xs" onClick={handleMessage}>
                Message
              </Button>
            </div>
          ) : selectedPendingIncoming ? (
            renderRequestActions(selectedPendingIncoming)
          ) : selectedPendingOutgoing ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => {
                console.log("Profile drawer cancel clicked for request:", selectedPendingOutgoing.id);
                console.log("Request details:", selectedPendingOutgoing);
                handleCancelRequest(selectedPendingOutgoing.id);
              }}
            >
              Cancel request
            </Button>
          ) : (
            <Button
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => handleAddFriend(selectedProfile.uid)}
              disabled={!currentUid || selectedProfile.uid === currentUid}
            >
              <UserPlus className="mr-2 h-3.5 w-3.5" /> Add friend
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderProfileCard = (profile: FriendStudentProfile) => {
    const onlineEntry = onlineUsers[profile.uid];
    const online = Boolean(onlineEntry?.isOnline);
    const friend = Boolean(friendsMap[profile.uid]);
    const pendingIncomingRequest = incomingPending.find((request) => request.senderUid === profile.uid);
    const pendingOutgoingRequest = outgoingPending.find((request) => request.receiverUid === profile.uid);
    const activity = getActivityMeta(profile.uid);
    const badges: string[] = [];
    if (profile.department) badges.push(profile.department);
    if (profile.batch) badges.push(profile.batch);
    if (friend) badges.push("Friend");
    if (profile.profileCompleted) badges.push("Profile complete");
    if (online) badges.push("Active");

    const highlightTone =
      activity?.tone === "online" ? "text-emerald-600" : activity?.tone === "recent" ? "text-amber-600" : "text-muted-foreground";

    const detailLine = profile.department
      ? `${profile.department}${profile.batch ? ` · ${profile.batch}` : ""}`
      : profile.headline ?? "Learner";

    const rawFriendSince = friendsMap[profile.uid]?.since ?? null;
    let friendSinceLabel: string | null = null;
    if (rawFriendSince) {
      let friendSinceDate: Date | null = null;
      if (rawFriendSince instanceof Date) {
        friendSinceDate = rawFriendSince;
      } else if (typeof (rawFriendSince as { toDate?: () => Date }).toDate === "function") {
        try {
          friendSinceDate = (rawFriendSince as { toDate: () => Date }).toDate();
        } catch (_error) {
          friendSinceDate = null;
        }
      }

      if (friendSinceDate instanceof Date && !Number.isNaN(friendSinceDate.getTime())) {
        try {
          friendSinceLabel = formatDistanceToNow(friendSinceDate, { addSuffix: true });
        } catch (_error) {
          friendSinceLabel = null;
        }
      }
    }

    const baseClass = cn(
      "flex h-full flex-col rounded-3xl border border-border/60 bg-white/80 p-4 shadow-sm transition hover:shadow-md dark:bg-slate-950/70 cursor-pointer",
      layoutMode === "grid" ? "h-full w-full" : "w-full",
      selectedProfileUid === profile.uid && "border-blue-500/60 shadow-lg",
    );

    const cardContent = (
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border border-border/60 shadow-sm">
              <AvatarImage src={profile.photoUrl} alt={profile.fullName} />
              <AvatarFallback>{profile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {online && <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500 shadow-sm" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-base font-semibold text-foreground">{highlight(profile.fullName)}</span>
                <span className="block text-xs text-muted-foreground">{highlight(detailLine)}</span>
                {profile.email && <span className="mt-1 block text-[11px] text-muted-foreground">{profile.email}</span>}
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Score {computeScore(profile)}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {badges.map((label) => (
                <Badge key={label} variant="outline" className="rounded-full bg-white/60 text-[10px] dark:bg-slate-950/70">
                  {label}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {activity ? (
                <span className={cn("inline-flex items-center gap-1", highlightTone)}>
                  <Clock className="h-3 w-3" /> {activity.text}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Seen recently
                </span>
              )}
              {pendingIncomingRequest && <span className="inline-flex items-center gap-1 text-amber-600">Awaiting your response</span>}
              {pendingOutgoingRequest && <span className="inline-flex items-center gap-1">Pending approval</span>}
              {friendSinceLabel && <span className="inline-flex items-center gap-1">Connected {friendSinceLabel}</span>}
            </div>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-xl text-xs"
            onClick={(event) => {
              event.stopPropagation();
              handleSelectProfile(profile.uid);
            }}
          >
            View profile
          </Button>
          {friend ? (
            <Button
              size="sm"
              className="rounded-xl text-xs"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/dashboard/chat?to=${profile.uid}`);
              }}
            >
              Message
            </Button>
          ) : pendingIncomingRequest ? (
            <div className="flex gap-2">
              {renderRequestActions(pendingIncomingRequest)}
            </div>
          ) : pendingOutgoingRequest ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={(event) => {
                event.stopPropagation();
                console.log("Profile card cancel clicked for request:", pendingOutgoingRequest.id);
                console.log("Request details:", pendingOutgoingRequest);
                handleCancelRequest(pendingOutgoingRequest.id);
              }}
            >
              Cancel request
            </Button>
          ) : (
            <Button
              size="sm"
              className="rounded-xl text-xs"
              onClick={(event) => {
                event.stopPropagation();
                handleAddFriend(profile.uid);
              }}
              disabled={!currentUid || profile.uid === currentUid}
            >
              <UserPlus className="mr-2 h-3.5 w-3.5" /> Add friend
            </Button>
          )}
        </div>
      </div>
    );

    if (layoutMode === "list") {
      return (
        <motion.div
          key={profile.uid}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={baseClass}
          role="button"
          tabIndex={0}
          onClick={() => handleSelectProfile(profile.uid)}
        >
          {cardContent}
        </motion.div>
      );
    }

    return (
      <div key={profile.uid} className={baseClass} role="button" tabIndex={0} onClick={() => handleSelectProfile(profile.uid)}>
        {cardContent}
      </div>
    );
  };

  const renderProfilesList = (list: FriendStudentProfile[], value: ViewMode) => {
    const containerClass =
      layoutMode === "grid"
        ? "grid w-full grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6"
        : "flex w-full flex-col gap-4";

    if (list.length === 0 && viewMode === value) {
      const icon = value === "friends" ? (
        <UserCheck className="h-5 w-5" />
      ) : value === "people" ? (
        <Users className="h-5 w-5" />
      ) : (
        <Sparkles className="h-5 w-5" />
      );

      return (
        <div className="flex min-h-[26rem] w-full items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/10 p-10 text-center text-sm text-muted-foreground">
          <div className="flex max-w-md flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">{icon}</div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">{emptyState.title}</h3>
              <p className="text-xs text-muted-foreground">{emptyState.description}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {hasAnyFilter && (
                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={clearFilters}>
                  <XCircle className="mr-2 h-3 w-3" /> Clear filters
                </Button>
              )}
              {value !== "friends" && (
                <Button size="sm" className="rounded-xl text-xs" onClick={() => setViewMode("discover")}>
                  <Sparkles className="mr-2 h-3.5 w-3.5" /> Jump to discover
                </Button>
              )}
              {value === "friends" && (
                <Button size="sm" className="rounded-xl text-xs" onClick={() => setViewMode("discover")}>
                  <UserPlus className="mr-2 h-3.5 w-3.5" /> Find new friends
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return <div className={containerClass}>{list.map((profile) => renderProfileCard(profile))}</div>;
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6 p-6">
        <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_70%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.1),transparent_60%)]" aria-hidden="true" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-4">
              <div className="flex w-fit items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                <Users className="h-3.5 w-3.5" /> Campus Network
              </div>
              <div className="space-y-3">
                <div className="flex w-fit items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                  <Users className="h-3.5 w-3.5" /> Campus Network
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Grow your campus network</h1>
                <p className="max-w-2xl text-white/90 md:text-base">
                  Get tailored suggestions, manage requests, and spotlight the classmates you want in your inbox.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-xl"
                  size="sm"
                  onClick={() => setViewMode("discover")}
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Browse suggestions
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setViewMode("friends")}
                >
                  <UserCheck className="mr-2 h-4 w-4" /> Review friends
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setViewMode("people")}
                >
                  <Users className="mr-2 h-4 w-4" /> Browse directory
                </Button>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((item, index) => {
                const Icon = item.icon;
                const bgGradients = [
                  'from-blue-500/10 to-blue-600/10',
                  'from-purple-500/10 to-purple-600/10',
                  'from-emerald-500/10 to-emerald-600/10'
                ];
                const borderColors = [
                  'border-blue-500/30',
                  'border-purple-500/30',
                  'border-emerald-500/30'
                ];
                const textColors = [
                  'text-blue-700 dark:text-blue-300',
                  'text-purple-700 dark:text-purple-300',
                  'text-emerald-700 dark:text-emerald-300'
                ];
                
                return (
                  <div
                    key={item.label}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border p-4 text-sm transition-all duration-300 hover:shadow-lg",
                      "backdrop-blur-sm bg-white/80 dark:bg-slate-900/80",
                      bgGradients[index % bgGradients.length],
                      borderColors[index % borderColors.length],
                      "hover:scale-[1.02]"
                    )}
                  >
                    <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</span>
                        <div className={cn("rounded-lg p-1.5", bgGradients[index % bgGradients.length].replace('10', '20').replace('10', '20'))}>
                          <Icon className={cn("h-4 w-4", textColors[index % textColors.length])} />
                        </div>
                      </div>
                      <div className={cn("mt-2 text-3xl font-bold", textColors[index % textColors.length])}>
                        {item.value.toLocaleString()}
                      </div>
                      <span className="mt-1 block text-xs text-muted-foreground">{item.helper}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-white/90 p-4 shadow-sm backdrop-blur dark:bg-slate-950/70">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm dark:bg-slate-950/80">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full sm:w-auto">
                      <TabsList className="rounded-full bg-muted/60 p-1 text-xs">
                        <TabsTrigger value="discover" className="rounded-full px-4 py-1 flex items-center gap-2">
                          <span>Discover</span>
                          <Badge variant="outline" className="rounded-full text-[10px]">{discoverList.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="people" className="rounded-full px-4 py-1 flex items-center gap-2">
                          <span>People</span>
                          <Badge variant="outline" className="rounded-full text-[10px]">{peopleList.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="friends" className="rounded-full px-4 py-1 flex items-center gap-2">
                          <span>Friends</span>
                          <Badge variant="outline" className="rounded-full text-[10px]">{friendsList.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="rounded-full px-4 py-1 flex items-center gap-2">
                          <span>Requests</span>
                          <Badge variant="outline" className="rounded-full text-[10px]">{totalPending}</Badge>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {viewMode !== "requests" && (
                      <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search by name"
                          className="h-10 w-full rounded-xl border border-border/60 bg-white pl-9 text-sm shadow-theme-xs dark:bg-slate-900"
                        />
                      </div>
                    )}
                  </div>
                  {hasAnyFilter && (
                    viewMode !== "requests" && (
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={clearFilters}>
                          <XCircle className="mr-2 h-3 w-3" /> Clear filters
                        </Button>
                      </div>
                    )
                  )}
                  {viewMode !== "requests" && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <AnimatedFilterSelect
                        value={departmentFilter}
                        onValueChange={setDepartmentFilter}
                        placeholder="Department"
                        options={departmentSelectOptions}
                      />
                      <AnimatedFilterSelect
                        value={batchFilter}
                        onValueChange={setBatchFilter}
                        placeholder="Batch"
                        options={batchSelectOptions}
                      />
                      <AnimatedFilterSelect
                        value={sortBy}
                        onValueChange={(value) => setSortBy(value as typeof sortBy)}
                        placeholder="Sort"
                        options={SORT_FILTER_OPTIONS}
                      />
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-1">
                        <Button
                          variant={layoutMode === "grid" ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setLayoutMode("grid")}
                          aria-pressed={layoutMode === "grid"}
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={layoutMode === "list" ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setLayoutMode("list")}
                          aria-pressed={layoutMode === "list"}
                        >
                          <Rows3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {hasAnyFilter && viewMode !== "requests" && (
                    <div className="flex flex-wrap gap-2">
                      {lowerSearch && (
                        <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setSearch("")}>
                          <Search className="mr-1 h-3 w-3" /> "{search}" <X className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      {departmentFilter !== "all" && (
                        <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setDepartmentFilter("all")}>
                          Dept: {departmentFilter} <X className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      {batchFilter !== "all" && (
                        <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setBatchFilter("all")}>
                          Batch: {batchFilter} <X className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      {onlineOnly && (
                        <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setOnlineOnly(false)}>
                          Online <X className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      {completedOnly && (
                        <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setCompletedOnly(false)}>
                          Profile completed <X className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  {viewMode !== "requests" ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                        <span>
                          Showing {activeList.length} {activeList.length === 1 ? "profile" : "profiles"}
                          {hasAnyFilter ? " · Filters active" : ""}
                        </span>
                        {viewMode === "discover" && discoverList.length > 0 && (
                          <span className="font-medium text-xs text-blue-700 dark:text-blue-300">Tailored suggestions refresh hourly</span>
                        )}
                      </div>
                      <Separator />
                    </>
                  ) : null}
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <TabsContent value="discover">{renderProfilesList(discoverList, "discover")}</TabsContent>
                    <TabsContent value="people">{renderProfilesList(peopleList, "people")}</TabsContent>
                    <TabsContent value="friends">{renderProfilesList(friendsList, "friends")}</TabsContent>
                    <TabsContent value="requests">
                      <div className="space-y-4 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-5 py-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="rounded-full">Total: {totalPending}</Badge>
                            <Badge variant="outline" className="rounded-full">Incoming: {incomingPending.length}</Badge>
                            <Badge variant="outline" className="rounded-full">Outgoing: {outgoingPending.length}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">Manage requests to keep conversations flowing.</span>
                        </div>
                        {renderRequestsPanel("inline")}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>

            <div className="hidden flex-col gap-4 rounded-2xl border border-border/60 bg-muted/20 p-5 shadow-sm lg:flex lg:h-full lg:w-[320px] lg:border-l lg:border-border/60 lg:pl-6 dark:bg-slate-950/60">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">Profile preview</h2>
                <p className="text-xs text-muted-foreground">Select someone to review details and take action.</p>
              </div>
              {renderProfilePreviewCard("sidebar")}
            </div>
          </div>
        </div>
      </div>
      <Sheet open={profileDrawerOpen} onOpenChange={handleProfileDrawerChange}>
        <SheetContent side="bottom" className="h-[80vh] overflow-hidden border-t border-border/80 bg-background/95">
          <SheetHeader className="items-start">
            <SheetTitle>Profile</SheetTitle>
            <SheetDescription>Preview details and take action on this connection.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 overflow-y-auto pb-8">{renderProfilePreviewCard("sheet")}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DiscoverFriends;
