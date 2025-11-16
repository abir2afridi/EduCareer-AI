import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import { FirebaseError } from "firebase/app";
import {
  Smile,
  Send,
  Loader2,
  Users,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Mic,
  Sparkles,
  Menu,
  ArrowLeft,
  ArrowDown,
  MessageSquare,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { db } from "@/lib/firebaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useFriendNetwork } from "@/hooks/useFriendNetwork";

const emojiPalette = ["😀", "😁", "😂", "🤣", "😊", "😍", "🥳", "🤝", "👍", "🙏", "🚀", "✨", "💡", "📚", "🎯", "🔥"];
const getChatId = (uidA: string, uidB: string) => [uidA, uidB].sort().join("_");
const MAX_COMPOSER_HEIGHT = 132;
const MIN_COMPOSER_HEIGHT = 48;

interface ChatMessage {
  id: string;
  senderUid: string;
  receiverUid: string;
  text: string;
  timestamp?: Date | null;
  seen?: boolean;
}

const shellMotion = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } },
};

const listItemMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({ opacity: 1, y: 0, transition: { delay: index * 0.03, duration: 0.16 } }),
};

const messageBubbleMotion = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15 } },
};

const scrollIndicatorMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.16 } },
};

const overlayMotion = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const mobileSidebarMotion = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: { type: "spring", stiffness: 320, damping: 32 } },
  exit: { x: "-100%", transition: { duration: 0.18 } },
};

const TYPING_TIMEOUT_MS = 1200;

const FriendsAndMessages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { currentUid, students, friendsMap, onlineUsers, pendingIncoming, pendingOutgoing, handleAddFriend, handleRespondToRequest } =
    useFriendNetwork();

  const [activeFriendUid, setActiveFriendUid] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [typingStates, setTypingStates] = useState<Record<string, boolean>>({});
  const [composerError, setComposerError] = useState<string | null>(null);
  const [recentThreads, setRecentThreads] = useState<Record<string, string>>({});
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [reciprocalStatus, setReciprocalStatus] = useState<"unknown" | "accepted" | "missing">("unknown");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [deletingMessages, setDeletingMessages] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustComposerHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.max(Math.min(textarea.scrollHeight, MAX_COMPOSER_HEIGHT), MIN_COMPOSER_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = nextHeight >= MAX_COMPOSER_HEIGHT ? "auto" : "hidden";
  }, []);

  useEffect(() => () => {
    Object.values(typingTimeoutRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
  }, []);

  useEffect(() => {
    if (!currentUid || !activeFriendUid) {
      setChatId(null);
      setMessages([]);
      return;
    }
    const id = getChatId(currentUid, activeFriendUid);
    setChatId(id);
    setLoadingMessages(true);
    const threadDoc = doc(db, "messages", id);
    void getDoc(threadDoc).then((snapshot) => {
      if (!snapshot.exists()) {
        void setDoc(threadDoc, { participants: [currentUid, activeFriendUid], createdAt: serverTimestamp() }, { merge: true });
      }
    });
  }, [currentUid, activeFriendUid, friendsMap]);

  useEffect(() => {
    if (!chatId || !currentUid) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    const unsubscribe = onSnapshot(query(collection(db, "messages", chatId, "chats"), orderBy("timestamp", "asc")), async (snapshot) => {
      const items: ChatMessage[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          senderUid: data.senderUid,
          receiverUid: data.receiverUid,
          text: data.text ?? "",
          timestamp: data.timestamp?.toDate?.() ?? null,
          seen: Boolean(data.seen),
        } satisfies ChatMessage;
      });
      setMessages(items);
      setLoadingMessages(false);
      if (activeFriendUid) {
        const lastMessage = items[items.length - 1]?.text ?? "";
        setRecentThreads((previous) => ({ ...previous, [activeFriendUid]: lastMessage }));
      }
      const unseen = snapshot.docs.filter((docSnapshot) => docSnapshot.data().receiverUid === currentUid && !docSnapshot.data().seen);
      if (unseen.length > 0) {
        await Promise.all(unseen.map((docSnapshot) => updateDoc(docSnapshot.ref, { seen: true, seenAt: serverTimestamp() }))).catch((error) =>
          console.error("Seen update failed", error),
        );
      }
    });
    return unsubscribe;
  }, [chatId, currentUid, activeFriendUid]);

  useEffect(() => {
    if (!currentUid) return;
    let isMounted = true;
    const loadRecentPreviews = async () => {
      try {
        const threadsSnapshot = await getDocs(query(collection(db, "messages"), limit(200)));
        const previews: Record<string, string> = {};
        await Promise.all(
          threadsSnapshot.docs.map(async (threadDoc) => {
            const participants = (threadDoc.data().participants ?? []) as string[];
            if (!participants.includes(currentUid)) return;
            const otherUid = participants.find((uid) => uid !== currentUid);
            if (!otherUid) return;
            const messagesSnapshot = await getDocs(
              query(collection(db, "messages", threadDoc.id, "chats"), orderBy("timestamp", "desc"), limit(1)),
            );
            const lastMessageDoc = messagesSnapshot.docs[0];
            if (!lastMessageDoc) return;
            previews[otherUid] = (lastMessageDoc.data().text as string) ?? "";
          }),
        );
        if (isMounted) {
          setRecentThreads((previous) => ({ ...previews, ...previous }));
        }
      } catch (error) {
        console.error("Recent previews load failed", error);
      }
    };
    void loadRecentPreviews();
    return () => {
      isMounted = false;
    };
  }, [currentUid]);

  useEffect(() => {
    if (!activeFriendUid) return;
    const currentToFriend = friendsMap[activeFriendUid];
    if (currentToFriend && currentToFriend.status === "accepted" && reciprocalStatus === "missing") {
      setReciprocalStatus("unknown");
    }
  }, [activeFriendUid, friendsMap, reciprocalStatus]);

  useEffect(() => {
    if (!activeFriendUid || !currentUid) {
      setReciprocalStatus("unknown");
      return undefined;
    }

    const friendDocRef = doc(db, "users", activeFriendUid, "friends", currentUid);
    const unsubscribe = onSnapshot(
      friendDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setReciprocalStatus("missing");
          return;
        }
        const data = snapshot.data();
        const status = data.status ?? "accepted";
        setReciprocalStatus(status === "accepted" ? "accepted" : "unknown");
      },
      (error) => {
        console.warn("Reciprocal friend lookup failed", error);
        setReciprocalStatus("unknown");
      },
    );

    return unsubscribe;
  }, [activeFriendUid, currentUid]);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = onSnapshot(collection(db, "messages", chatId, "typing"), (snapshot) => {
      const map: Record<string, boolean> = {};
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        map[docSnapshot.id] = Boolean(data.isTyping);
      });
      setTypingStates(map);
    });
    return unsubscribe;
  }, [chatId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = messagesViewportRef.current;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const threshold = 160;
    const delta = viewport.scrollHeight - viewport.clientHeight;
    const scrollable = delta > 8;
    if (!scrollable) {
      setIsAtBottom(false);
      return;
    }
    const atBottom = viewport.scrollTop >= delta - threshold;
    setIsAtBottom(atBottom);
  }, []);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll, activeFriendUid]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    const sentByCurrentUser = lastMessage.senderUid === currentUid;
    const viewport = messagesViewportRef.current;
    const scrollable = viewport ? viewport.scrollHeight - viewport.clientHeight > 8 : false;
    if ((isAtBottom && scrollable) || (sentByCurrentUser && scrollable)) {
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom, isAtBottom, currentUid]);

  useEffect(() => {
    scrollToBottom("auto");
    setIsAtBottom(true);
  }, [activeFriendUid, scrollToBottom]);

  useEffect(() => {
    adjustComposerHeight();
  }, [inputValue, adjustComposerHeight]);

  const sortedStudents = useMemo(() => [...students].sort((a, b) => a.fullName.localeCompare(b.fullName)), [students]);
  const friendsList = useMemo(
    () => sortedStudents.filter((student) => {
      const entry = friendsMap[student.uid];
      return entry && (entry.status ?? "accepted") === "accepted";
    }),
    [sortedStudents, friendsMap],
  );
  const filteredFriends = useMemo(
    () => friendsList.filter((s) => s.fullName.toLowerCase().includes(chatSearch.trim().toLowerCase())),
    [friendsList, chatSearch],
  );
  const activeFriend = useMemo(() => sortedStudents.find((student) => student.uid === activeFriendUid) ?? null, [sortedStudents, activeFriendUid]);
  const isFriendTyping = activeFriendUid ? Boolean(typingStates[activeFriendUid]) : false;
  const canChatWithActiveFriend = useMemo(() => {
    if (!activeFriendUid) return false;
    const currentToFriend = friendsMap[activeFriendUid];
    if (!currentToFriend || (currentToFriend.status ?? "accepted") !== "accepted") return false;
    if (reciprocalStatus === "missing") return false;
    return true;
  }, [activeFriendUid, friendsMap, reciprocalStatus]);
  const showFriendshipBanner = Boolean(activeFriendUid && !canChatWithActiveFriend);

  useEffect(() => {
    const to = searchParams.get("to");
    if (!to) return;
    const exists = students.some((s) => s.uid === to);
    if (!exists) return;
    if (friendsMap[to] && (friendsMap[to].status ?? "accepted") === "accepted") {
      setActiveFriendUid(to);
    }
  }, [searchParams, students, friendsMap]);

  useEffect(() => {
    if (friendsList.length === 0) {
      if (activeFriendUid) {
        setActiveFriendUid(null);
      }
      return;
    }

    if (!activeFriendUid) {
      const nextFriendUid = friendsList[0]?.uid ?? null;
      if (nextFriendUid) {
        setActiveFriendUid(nextFriendUid);
      }
    }
  }, [friendsList, activeFriendUid]);

  const openSidebar = useCallback(() => setSidebarVisible(true), []);
  const closeSidebar = useCallback(() => setSidebarVisible(false), []);

  const handleSelectFriend = useCallback(
    (uid: string) => {
      setActiveFriendUid(uid);
      closeSidebar();
    },
    [closeSidebar],
  );

  const handleTyping = useCallback(
    async (value: string) => {
      if (!canChatWithActiveFriend) {
        setInputValue(value);
        return;
      }
      setInputValue(value);
      if (!chatId || !currentUid) return;
      const typingRef = doc(db, "messages", chatId, "typing", currentUid);
      try {
        await setDoc(typingRef, { isTyping: true, updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Typing update failed", error);
      }
      if (typingTimeoutRef.current[currentUid]) {
        clearTimeout(typingTimeoutRef.current[currentUid]);
      }
      typingTimeoutRef.current[currentUid] = setTimeout(() => {
        void setDoc(typingRef, { isTyping: false, updatedAt: serverTimestamp() }, { merge: true });
      }, TYPING_TIMEOUT_MS);
    },
    [chatId, currentUid, canChatWithActiveFriend],
  );

  const handleSendMessage = useCallback(async () => {
    const originalInput = inputValue;
    const trimmed = originalInput.trim();
    if (!trimmed || !chatId || !currentUid || !activeFriendUid) return;
    if (!canChatWithActiveFriend) {
      setComposerError("You are no longer friends and cannot send new messages.");
      setReciprocalStatus("missing");
      return;
    }
    setComposerError(null);
    setInputValue("");
    if (typingTimeoutRef.current[currentUid]) {
      clearTimeout(typingTimeoutRef.current[currentUid]);
      delete typingTimeoutRef.current[currentUid];
    }
    try {
      await addDoc(collection(db, "messages", chatId, "chats"), {
        senderUid: currentUid,
        receiverUid: activeFriendUid,
        text: trimmed,
        timestamp: serverTimestamp(),
        seen: false,
      });
      void setDoc(doc(db, "messages", chatId, "typing", currentUid), { isTyping: false, updatedAt: serverTimestamp() }, { merge: true }).catch((typingError) => {
        console.warn("Typing reset failed", typingError);
      });
    } catch (error) {
      console.error("Send failed", error);
      const firebaseError = error as FirebaseError;
      setInputValue(originalInput);
      if (firebaseError?.code === "permission-denied") {
        setComposerError("You are no longer friends and cannot send new messages.");
        setReciprocalStatus("missing");
      } else {
        setComposerError("Message could not be sent. Please try again.");
      }
    }
  }, [inputValue, chatId, currentUid, activeFriendUid, canChatWithActiveFriend]);

  const handleComposerSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canChatWithActiveFriend) return;
      await handleSendMessage();
    },
    [handleSendMessage, canChatWithActiveFriend],
  );

  const handleComposerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!canChatWithActiveFriend) return;
        void handleSendMessage();
      }
    },
    [handleSendMessage, canChatWithActiveFriend],
  );

  useEffect(() => {
    if (canChatWithActiveFriend) {
      setComposerError(null);
    }
  }, [canChatWithActiveFriend]);

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!chatId || !currentUid) return;
      setDeletingMessages((prev) => ({ ...prev, [messageId]: true }));
      try {
        await updateDoc(doc(db, "messages", chatId, "chats", messageId), { text: "", deleted: true });
      } catch (error) {
        console.error("Delete failed", error);
      } finally {
        setDeletingMessages((prev) => {
          const next = { ...prev };
          delete next[messageId];
          return next;
        });
      }
    },
    [chatId, currentUid],
  );

  const handleEmojiSelect = (emoji: string) => {
    handleTyping(`${inputValue}${emoji}`);
  };

  const formatLastSeen = (date?: Date | null) => {
    if (!date) return "Unknown";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  };

  const formatRelative = (date?: Date | null) => {
    if (!date) return "-";
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins} mins`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? "day" : "days"}`;
  };

  const formatTimestamp = (date?: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
  };

  if (!currentUid) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div variants={shellMotion} initial="hidden" animate="visible" className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <span>Please sign in to view your messages.</span>
          <Button variant="default" onClick={() => navigate("/sign-in")}>Sign in</Button>
        </motion.div>
      </div>
    );
  }

  const renderSidebarContent = (variant: "desktop" | "mobile") => {
    const isMobile = variant === "mobile";
    const titleId = isMobile ? "chat-sidebar-mobile-title" : "chat-sidebar-title";

    return (
      <motion.aside layout className="flex h-full w-full flex-col">
        <div
          className={cn(
            "border-b border-white/70 px-5 py-4 backdrop-blur-sm dark:border-slate-800/70",
            isMobile && "px-4 py-4",
          )}
        >
          <div className="flex items-center justify-between gap-3 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={closeSidebar}
                  className="h-9 w-9 rounded-full border border-transparent bg-white/80 text-slate-500 shadow-sm transition hover:border-blue-400 hover:text-blue-500 dark:bg-slate-900/60"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="flex flex-col">
                <span id={titleId} className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                  Messages
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">Stay connected with your network</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full border border-transparent bg-white/80 text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-500 dark:bg-slate-900/60"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full text-slate-600 hover:text-blue-500">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className={cn("px-5 pb-4 pt-4", isMobile && "px-4 pb-4 pt-5")}> 
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-500" />
            <Input
              value={chatSearch}
              onChange={(event) => setChatSearch(event.target.value)}
              placeholder="Search messages"
              aria-labelledby={titleId}
              className={cn(
                "h-10 w-full rounded-2xl border border-white/70 bg-white pl-10 text-sm text-slate-700 shadow-sm transition focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-slate-800/70 dark:bg-slate-950",
                isMobile && "h-11",
              )}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className={cn("h-full min-h-0 pr-3", isMobile && "pr-2")}> 
            <div className={cn("space-y-1 px-2 pb-6", isMobile && "px-2")}> 
              {filteredFriends.length === 0 ? (
                chatSearch.trim().length === 0 && friendsList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-xs text-slate-600 shadow-inner dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
                    No friends yet. Explore Discover to add classmates.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-xs text-slate-600 shadow-inner dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
                    No chats matched your search.
                  </div>
                )
              ) : (
                filteredFriends.map((profile, index) => {
                  const onlineEntry = onlineUsers[profile.uid];
                  const online = Boolean(onlineEntry?.isOnline);
                  const rel = online ? "now" : formatRelative(onlineEntry?.lastSeen);
                  const preview = (recentThreads[profile.uid] ?? "").trim();
                  const subtitle = preview || profile.headline || (online ? "Online" : `Last seen ${rel}`);

                  return (
                    <motion.button
                      key={profile.uid}
                      custom={index}
                      variants={listItemMotion}
                      initial="hidden"
                      animate="visible"
                      onClick={() => handleSelectFriend(profile.uid)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white/70 px-3 py-2 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-slate-950/70",
                        activeFriendUid === profile.uid
                          ? "border-blue-200 shadow-[0_12px_30px_-24px_rgba(37,99,235,0.45)] dark:border-blue-500/40"
                          : "hover:border-blue-200 hover:bg-blue-50/70 dark:hover:border-blue-500/40 dark:hover:bg-blue-900/20",
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-11 w-11 border border-white/80 shadow-sm dark:border-slate-800/80">
                          <AvatarImage src={profile.photoUrl} alt={profile.fullName} />
                          <AvatarFallback>{profile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {online && (
                          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_3px_rgba(56,189,248,0.25)]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-slate-900 dark:text-slate-100">
                          <p className="truncate text-sm font-semibold">{profile.fullName}</p>
                          <span className="whitespace-nowrap text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
                            {rel}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.aside>
    );
  };

  const renderMessages = () => {
    if (!activeFriendUid) {
      return (
        <motion.section
          variants={shellMotion}
          initial="hidden"
          animate="visible"
          className="flex h-full w-full flex-1 flex-col items-center justify-center rounded-3xl border border-white/60 bg-white/80 p-6 text-center backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/70"
        >
          <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800/70">
            <MessageSquare className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-100">Select a conversation</h3>
          <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Choose a friend to start chatting or discover new people to connect with.
          </p>
        </motion.section>
      );
    }

    const activeFriend = students.find((s) => s.uid === activeFriendUid);
    if (!activeFriend) return null;

    const onlineEntry = onlineUsers[activeFriendUid];
    const online = Boolean(onlineEntry?.isOnline);
    const lastSeenText = onlineEntry?.lastSeen ? formatLastSeen(onlineEntry.lastSeen) : null;

    return (
      <motion.section
        layout
        className="relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white text-slate-900 shadow-sm backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/70 dark:text-slate-100"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 text-sm text-slate-900 dark:border-slate-800/60 dark:text-slate-100 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={openSidebar}
              className="mr-1 h-10 w-10 rounded-full border border-transparent bg-white/70 text-slate-500 shadow-sm transition hover:border-blue-400 hover:text-blue-500 dark:bg-slate-900/60 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Avatar className="h-12 w-12 border-2 border-white/70 shadow-lg dark:border-slate-800/80">
              <AvatarImage src={activeFriend.photoUrl} alt={activeFriend.fullName} />
              <AvatarFallback>{activeFriend.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{activeFriend.fullName}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {isFriendTyping ? (
                  <span className="flex items-center gap-1 text-blue-500">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/80 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                    </span>
                    Typing...
                  </span>
                ) : online ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" /> Online
                  </span>
                ) : (
                  `Last seen ${lastSeenText}`
                )}
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {[{ icon: Phone, label: "Call" }, { icon: Video, label: "Video" }, { icon: MoreVertical, label: "More" }].map(({ icon: Icon, label }) => (
              <Button
                key={label}
                variant="ghost"
                size="icon"
                className="group h-10 w-10 rounded-full border border-transparent bg-slate-100/60 text-slate-500 transition hover:bg-white hover:text-blue-500 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-blue-400"
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4" ref={messagesViewportRef} onScroll={handleScroll}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-28 text-slate-800 dark:text-inherit">
            {showFriendshipBanner && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-800 shadow-sm dark:border-amber-500/40 dark:bg-amber-400/10 dark:text-amber-100">
                You are no longer friends. Chat history is read-only until you reconnect.
              </div>
            )}
            {loadingMessages ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-blue-200 bg-blue-50 px-8 py-12 text-center text-sm text-slate-700 dark:border-blue-500/40 dark:bg-blue-900/20 dark:text-slate-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                  <Smile className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-100">Start the conversation</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Send a friendly hello and kick off your chat.</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderUid === currentUid;
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const showAvatar = !isOwn && (!previousMessage || previousMessage.senderUid === currentUid);
                return (
                  <motion.div
                    key={message.id}
                    layout
                    variants={messageBubbleMotion}
                    initial="initial"
                    animate="animate"
                    className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("flex max-w-[82%] items-end gap-2", isOwn ? "flex-row-reverse text-right" : "flex-row")}>
                      {!isOwn && (showAvatar ? (
                        <Avatar className="h-8 w-8 border border-white/70 shadow-sm dark:border-slate-800/70">
                          <AvatarImage src={activeFriend?.photoUrl} alt={activeFriend?.fullName} />
                          <AvatarFallback>{activeFriend?.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="h-8 w-8" />
                      ))}
                      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2 text-sm shadow-sm transition",
                            isOwn
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-slate-100",
                          )}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        </div>
                        <div className={cn("flex items-between gap-2 text-[11px]", isOwn ? "text-white/80" : "text-slate-500 dark:text-slate-500")}
                        >
                          <span className="text-slate-500 dark:text-slate-500">{formatTimestamp(message.timestamp)}</span>
                          {isOwn && message.seen && <span>Seen</span>}
                          {isOwn && (
                            <button
                              type="button"
                              className="text-[11px] text-white/80 underline-offset-2 transition hover:underline"
                              onClick={() => handleDeleteMessage(message.id)}
                              disabled={Boolean(deletingMessages[message.id])}
                            >
                              {deletingMessages[message.id] ? "Removing…" : "Unsend"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <footer className="sticky bottom-0 border-t border-slate-200/80 bg-white px-4 py-3 shadow-[0_-12px_45px_-30px_rgba(47,73,157,0.35)] backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/80">
          <form onSubmit={handleComposerSubmit} className="flex items-end gap-2 sm:gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-transparent bg-white/70 text-slate-500 shadow-inner transition hover:border-blue-400 hover:text-blue-500 dark:bg-slate-900/60"
                  disabled={!canChatWithActiveFriend}
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 rounded-2xl border border-white/60 bg-white/95 p-3 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/90" align="start">
                <div className="grid grid-cols-6 gap-2 text-lg">
                  {emojiPalette.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="rounded-xl p-2 text-xl transition hover:bg-blue-50 dark:hover:bg-slate-800"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(event) => handleTyping(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder={canChatWithActiveFriend ? "Message" : "Reconnect to enable messaging"}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-inner transition focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-transparent dark:bg-slate-900/70 dark:text-slate-100"
                disabled={!canChatWithActiveFriend}
              />
            </div>
            {[{ icon: Paperclip, label: "Attach" }, { icon: Mic, label: "Voice" }].map(({ icon: Icon, label }) => (
              <Button
                key={label}
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-transparent bg-white/80 text-slate-600 shadow-inner transition hover:border-blue-400 hover:text-blue-500 dark:bg-slate-900/60"
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
            <Button
              type="submit"
              disabled={!inputValue.trim() || !canChatWithActiveFriend}
              className="h-10 rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 text-white shadow-lg transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-2 hidden items-center justify-between text-[10px] text-slate-500 sm:flex">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Press Enter to send
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <ArrowDown className="h-3 w-3" />
              Shift + Enter for new line
            </span>
          </div>
          {composerError && <p className="mt-2 text-xs text-rose-500">{composerError}</p>}
        </footer>
        <AnimatePresence>
          {!isAtBottom && messages.length > 0 ? (
            <motion.button
              key="scroll-indicator"
              type="button"
              variants={scrollIndicatorMotion}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => scrollToBottom("smooth")}
              className="absolute bottom-[108px] right-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/95 px-4 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur-md transition hover:text-blue-600 dark:border-slate-800/70 dark:bg-slate-950/90 dark:text-slate-200 md:bottom-24"
            >
              <ArrowDown className="h-4 w-4" />
              New messages
            </motion.button>
          ) : null}
        </AnimatePresence>
      </motion.section>
    );
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] w-full flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col overflow-hidden px-3 py-4 sm:px-6 sm:py-6">
        <motion.div
          variants={shellMotion}
          initial="hidden"
          animate="visible"
          className="flex h-full w-full flex-1 gap-4 overflow-hidden"
        >
          <div className="hidden h-full w-[320px] flex-shrink-0 flex-col rounded-3xl border border-white/60 bg-white/80 shadow-[0_30px_90px_-60px_rgba(46,73,157,0.35)] backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/75 md:flex">
            {renderSidebarContent("desktop")}
          </div>
          <div className="flex h-full flex-1 flex-col">
            {renderMessages()}
          </div>
        </motion.div>
      </div>
      <AnimatePresence>
        {isSidebarVisible ? (
          <motion.div className="fixed inset-0 z-40 md:hidden" variants={overlayMotion} initial="hidden" animate="visible" exit="exit">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={closeSidebar} aria-label="Close sidebar" />
            <motion.div variants={mobileSidebarMotion} initial="hidden" animate="visible" exit="exit" className="relative h-full w-[80%] max-w-sm">
              <div className="flex h-full flex-col rounded-r-3xl border border-r-0 border-white/60 bg-white/95 shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-950/90">
                {renderSidebarContent("mobile")}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default FriendsAndMessages;
