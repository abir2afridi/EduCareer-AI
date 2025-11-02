import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import {
  Smile,
  Send,
  Circle,
  Loader2,
  UserPlus,
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Mic,
} from "lucide-react";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const emojiPalette = ["😀","😁","😂","🤣","😊","😍","🥳","🤝","👍","🙏","🚀","✨","💡","📚","🎯","🔥"];
const getChatId = (uidA: string, uidB: string) => [uidA, uidB].sort().join("_");

interface StudentProfile {
  uid: string;
  fullName: string;
  department?: string;
  batch?: string;
  email?: string;
  headline?: string;
  photoUrl?: string;
  status?: string;
  lastSeen?: Date | null;
  profileCompleted?: boolean;
}

interface FriendEntry {
  uid: string;
  since?: Date | null;
}

interface FriendRequest {
  id: string;
  senderUid: string;
  receiverUid: string;
  status: "pending" | "accepted" | "rejected";
  createdAt?: Date | null;
}

interface ChatMessage {
  id: string;
  senderUid: string;
  receiverUid: string;
  text: string;
  timestamp?: Date | null;
  seen?: boolean;
}

const FriendsAndMessages = () => {
  const { user } = useAuth();
  const currentUid = user?.uid;

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, { isOnline: boolean; lastSeen?: Date | null }>>({});
  const [friendsMap, setFriendsMap] = useState<Record<string, FriendEntry>>({});
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [activeFriendUid, setActiveFriendUid] = useState<string | null>(null);
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [typingStates, setTypingStates] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(typingTimeoutRef.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  useEffect(() => {
    if (!currentUid) return;
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const list: StudentProfile[] = snapshot.docs
        .filter((docSnapshot) => docSnapshot.id !== currentUid)
        .map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            uid: docSnapshot.id,
            fullName: data.fullName ?? data.name ?? "Unknown",
            department: data.department ?? data.major ?? undefined,
            batch: data.batch ?? data.cohort ?? undefined,
            email: data.email ?? data.contactEmail ?? undefined,
            headline: data.headline ?? data.bio ?? undefined,
            photoUrl: data.avatarUrl ?? data.photoURL ?? data.photo ?? undefined,
            status: data.status ?? undefined,
            lastSeen: data.lastSeen?.toDate?.() ?? null,
            profileCompleted: Boolean(data.profileCompleted),
          } satisfies StudentProfile;
        });
      setStudents(list);
    });
    return unsubscribe;
  }, [currentUid]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "onlineUsers"), (snapshot) => {
      const map: Record<string, { isOnline: boolean; lastSeen?: Date | null }> = {};
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        map[docSnapshot.id] = {
          isOnline: Boolean(data.isOnline),
          lastSeen: data.lastSeen?.toDate?.() ?? null,
        };
      });
      setOnlineUsers(map);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUid) return;
    const unsubscribe = onSnapshot(collection(db, "users", currentUid, "friends"), (snapshot) => {
      const map: Record<string, FriendEntry> = {};
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        map[docSnapshot.id] = {
          uid: docSnapshot.id,
          since: data.since?.toDate?.() ?? null,
        } satisfies FriendEntry;
      });
      setFriendsMap(map);
    });
    return unsubscribe;
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;
    const incoming = query(collection(db, "friendRequests"), where("receiverUid", "==", currentUid));
    const outgoing = query(collection(db, "friendRequests"), where("senderUid", "==", currentUid));
    const unsubIncoming = onSnapshot(incoming, (snapshot) => {
      setIncomingRequests(snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          senderUid: data.senderUid,
          receiverUid: data.receiverUid,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() ?? null,
        } satisfies FriendRequest;
      }));
    });
    const unsubOutgoing = onSnapshot(outgoing, (snapshot) => {
      setOutgoingRequests(snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          senderUid: data.senderUid,
          receiverUid: data.receiverUid,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() ?? null,
        } satisfies FriendRequest;
      }));
    });
    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;
    const onlineDoc = doc(db, "onlineUsers", currentUid);
    const studentDoc = doc(db, "students", currentUid);
    const updatePresence = async (isOnline: boolean) => {
      try {
        await Promise.all([
          setDoc(onlineDoc, { isOnline, lastSeen: serverTimestamp() }, { merge: true }),
          setDoc(studentDoc, { status: isOnline ? "online" : "offline", lastSeen: serverTimestamp() }, { merge: true }),
        ]);
      } catch (error) {
        console.error("Presence update failed", error);
      }
    };
    void updatePresence(true);
    const handleVisibility = () => void updatePresence(!document.hidden);
    const handleBeforeUnload = () => void updatePresence(false);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void updatePresence(false);
    };
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid || !activeFriendUid || !friendsMap[activeFriendUid]) {
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
      const unseen = snapshot.docs.filter((docSnapshot) => docSnapshot.data().receiverUid === currentUid && !docSnapshot.data().seen);
      if (unseen.length > 0) {
        await Promise.all(unseen.map((docSnapshot) => updateDoc(docSnapshot.ref, { seen: true, seenAt: serverTimestamp() }))).catch((error) => console.error("Seen update failed", error));
      }
    });
    return unsubscribe;
  }, [chatId, currentUid]);

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sortedStudents = useMemo(() => [...students].sort((a, b) => a.fullName.localeCompare(b.fullName)), [students]);
  const friendsList = useMemo(() => sortedStudents.filter((student) => friendsMap[student.uid]), [sortedStudents, friendsMap]);
  const filteredFriends = useMemo(
    () => friendsList.filter((s) => s.fullName.toLowerCase().includes(chatSearch.trim().toLowerCase())),
    [friendsList, chatSearch],
  );
  const completedStudents = useMemo(
    () => sortedStudents.filter((s) => Boolean(s.profileCompleted) || Boolean(s.department) || Boolean(s.batch) || Boolean(s.headline)),
    [sortedStudents],
  );
  const pendingIncoming = useMemo(() => incomingRequests.filter((request) => request.status === "pending"), [incomingRequests]);
  const pendingOutgoing = useMemo(() => outgoingRequests.filter((request) => request.status === "pending"), [outgoingRequests]);
  const activeFriend = useMemo(() => sortedStudents.find((student) => student.uid === activeFriendUid) ?? null, [sortedStudents, activeFriendUid]);
  const activeFriendMeta = activeFriendUid ? friendsMap[activeFriendUid] : undefined;
  const selectedProfile = useMemo(() => sortedStudents.find((student) => student.uid === selectedProfileUid) ?? null, [sortedStudents, selectedProfileUid]);
  const selectedProfileMeta = selectedProfileUid ? friendsMap[selectedProfileUid] : undefined;
  const isFriendTyping = activeFriendUid ? Boolean(typingStates[activeFriendUid]) : false;

  useEffect(() => {
    if (friendsList.length === 0) {
      if (activeFriendUid) {
        setActiveFriendUid(null);
      }
      return;
    }

    if (!activeFriendUid) {
      const nextFriendUid = friendsList[0]?.uid ?? null;
      if (nextFriendUid && (!selectedProfileUid || friendsMap[selectedProfileUid])) {
        setActiveFriendUid(nextFriendUid);
      }
      if (!selectedProfileUid && nextFriendUid) {
        setSelectedProfileUid(nextFriendUid);
      }
    }
  }, [friendsList, activeFriendUid, selectedProfileUid, friendsMap]);

  useEffect(() => {
    if (selectedProfileUid && !sortedStudents.some((student) => student.uid === selectedProfileUid)) {
      setSelectedProfileUid(null);
    }
  }, [selectedProfileUid, sortedStudents]);

  useEffect(() => {
    if (selectedProfileUid && friendsMap[selectedProfileUid] && activeFriendUid !== selectedProfileUid) {
      setActiveFriendUid(selectedProfileUid);
    }
  }, [selectedProfileUid, friendsMap, activeFriendUid]);

  const handleSelectFriend = useCallback((uid: string) => {
    setActiveFriendUid(uid);
    setSelectedProfileUid(uid);
  }, []);

  const handleSelectProfile = useCallback((uid: string) => {
    setSelectedProfileUid(uid);
    if (friendsMap[uid]) {
      setActiveFriendUid(uid);
    } else {
      setActiveFriendUid(null);
    }
  }, [friendsMap]);

  const handleTyping = useCallback(async (value: string) => {
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
    }, 1200);
  }, [chatId, currentUid]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !chatId || !currentUid || !activeFriendUid) return;
    
    // Create a temporary message for immediate UI update
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderUid: currentUid,
      receiverUid: activeFriendUid,
      text: trimmed,
      timestamp: new Date(),
      seen: false
    };
    
    // Update local state immediately for better UX
    setMessages(prev => [...prev, tempMessage]);
    setInputValue("");
    setSending(true);
    
    try {
      // Send to Firestore
      const docRef = await addDoc(collection(db, "messages", chatId, "chats"), {
        senderUid: currentUid,
        receiverUid: activeFriendUid,
        text: trimmed,
        timestamp: serverTimestamp(),
        seen: false,
      });
      
      // Update the temporary message with the real ID from Firestore
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id ? { ...msg, id: docRef.id } : msg
        )
      );
      
      // Update typing status
      await setDoc(
        doc(db, "messages", chatId, "typing", currentUid), 
        { isTyping: false, updatedAt: serverTimestamp() }, 
        { merge: true }
      );
      
    } catch (error) {
      console.error("Send failed", error);
      // Remove the temporary message if sending fails
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      // Restore the input value if sending fails
      setInputValue(trimmed);
    } finally {
      setSending(false);
    }
  }, [inputValue, chatId, currentUid, activeFriendUid]);

  const handleComposerSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSendMessage();
  }, [handleSendMessage]);

  const handleComposerKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleEmojiSelect = (emoji: string) => {
    handleTyping(`${inputValue}${emoji}`);
  };

  const formatLastSeen = (date?: Date | null) => {
    if (!date) return "Unknown";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  };

  const formatSince = (date?: Date | null) => {
    if (!date) return "Recently connected";
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
  };

  const formatTimestamp = (date?: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
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

  const handleAddFriend = async (receiverUid: string) => {
    if (!currentUid || receiverUid === currentUid) return;
    const exists = pendingOutgoing.some((request) => request.receiverUid === receiverUid && request.status === "pending");
    if (exists) return;
    try {
      await addDoc(collection(db, "friendRequests"), {
        senderUid: currentUid,
        receiverUid,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Friend request failed", error);
    }
  };

  const handleRespondToRequest = async (request: FriendRequest, action: "accepted" | "rejected") => {
    try {
      await setDoc(doc(db, "friendRequests", request.id), { status: action, respondedAt: serverTimestamp() }, { merge: true });
      if (action === "accepted") {
        await Promise.all([
          setDoc(doc(db, "users", request.senderUid, "friends", request.receiverUid), { since: serverTimestamp() }, { merge: true }),
          setDoc(doc(db, "users", request.receiverUid, "friends", request.senderUid), { since: serverTimestamp() }, { merge: true }),
        ]);
        const counterpartUid = request.senderUid === currentUid ? request.receiverUid : request.senderUid;
        setActiveFriendUid(counterpartUid);
        setSelectedProfileUid(counterpartUid);
      }
    } catch (error) {
      console.error("Respond failed", error);
    }
  };

  const hasPendingIncoming = (uid: string) => pendingIncoming.some((request) => request.senderUid === uid && request.status === "pending");

  const renderFriendCard = (profile: StudentProfile) => {
    const onlineEntry = onlineUsers[profile.uid];
    const online = Boolean(onlineEntry?.isOnline);
    const meta = friendsMap[profile.uid];

    return (
      <motion.button
        key={profile.uid}
        layout
        onClick={() => handleSelectFriend(profile.uid)}
        className={cn(
          "w-full rounded-2xl border border-transparent px-4 py-3 text-left transition-all",
          activeFriendUid === profile.uid
            ? "bg-gradient-to-r from-blue-500/10 via-white to-transparent shadow"
            : "hover:border-border/60 hover:bg-muted/50",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.photoUrl} alt={profile.fullName} />
              <AvatarFallback>{profile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {online && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold text-foreground">{profile.fullName}</span>
            <span className="text-xs text-muted-foreground">{meta?.since ? `Friends since ${formatSince(meta.since)}` : "New connection"}</span>
          </div>
          {online ? (
            <Badge variant="outline" className="gap-1 text-[11px]">
              <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Online
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground">Last seen {formatLastSeen(onlineEntry?.lastSeen)}</span>
          )}
        </div>
      </motion.button>
    );
  };

  const renderDiscoverCard = (profile: StudentProfile) => {
    const onlineEntry = onlineUsers[profile.uid];
    const online = Boolean(onlineEntry?.isOnline);
    const friend = Boolean(friendsMap[profile.uid]);
    const pendingOut = pendingOutgoing.some((request) => request.receiverUid === profile.uid && request.status === "pending");
    const pendingIn = hasPendingIncoming(profile.uid);
    return (
      <motion.div
        key={profile.uid}
        layout
        className={cn(
          "rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm",
          selectedProfileUid === profile.uid && "border-blue-500/70 shadow-md"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile.photoUrl} alt={profile.fullName} />
              <AvatarFallback>{profile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {online && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-semibold text-foreground">{profile.fullName}</span>
            <span className="text-xs text-muted-foreground">
              {profile.department ? `${profile.department}${profile.batch ? ` · ${profile.batch}` : ""}` : profile.headline ?? "Learner"}
            </span>
            {profile.email && <span className="text-xs text-muted-foreground">{profile.email}</span>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {friend ? (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <UserCheck className="h-3.5 w-3.5" /> Friend
              </Badge>
            ) : pendingIn ? (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Loader2 className="h-3 w-3 animate-spin" /> Awaiting response
              </Badge>
            ) : online ? (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Online
              </Badge>
            ) : (
              <span className="text-[11px] text-muted-foreground">Last seen {formatLastSeen(onlineEntry?.lastSeen)}</span>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="rounded-xl text-xs" onClick={() => handleSelectProfile(profile.uid)}>
                View Profile
              </Button>
              <Button
                variant="default"
                size="sm"
                className="rounded-xl text-xs"
                disabled={friend || pendingOut || pendingIn}
                onClick={() => handleAddFriend(profile.uid)}
              >
                {pendingOut ? (
                  <span className="inline-flex items-center gap-1 text-xs"><Loader2 className="h-3 w-3 animate-spin" /> Pending</span>
                ) : friend ? (
                  <span className="inline-flex items-center gap-1 text-xs"><CheckCircle2 className="h-3 w-3" /> Connected</span>
                ) : pendingIn ? (
                  <span className="inline-flex items-center gap-1 text-xs">Respond in Requests</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs"><UserPlus className="h-3 w-3" /> Add Friend</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderMessages = () => (
    <div className="flex-1 overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={activeFriend?.photoUrl} alt={activeFriend?.fullName} />
              <AvatarFallback>{activeFriend?.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{activeFriend?.fullName ?? "Select a friend"}</span>
              <span className="text-xs text-muted-foreground">
                {isFriendTyping
                  ? "Typing..."
                  : onlineUsers[activeFriendUid ?? ""]?.isOnline
                    ? "Online"
                    : `Last seen ${formatLastSeen(onlineUsers[activeFriendUid ?? ""]?.lastSeen)}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {loadingMessages ? (
              <div className="flex justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
                <Smile className="h-10 w-10 text-muted-foreground/60" />
                <span>Start the conversation by sending a message.</span>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderUid === currentUid;
                return (
                  <motion.div
                    key={message.id}
                    layout
                    className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-3xl px-4 py-2 text-sm shadow-sm",
                        isOwn
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                          : "bg-muted text-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      <div
                        className={cn(
                          "mt-1 flex items-center gap-2 text-[10px]",
                          isOwn ? "text-white/70" : "text-muted-foreground",
                        )}
                      >
                        <span>{formatTimestamp(message.timestamp)}</span>
                        {isOwn && message.seen && <span>Seen</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="border-t border-border/60 px-6 py-4">
          <form onSubmit={handleComposerSubmit} className="flex items-end gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="secondary" size="icon" className="h-10 w-10 rounded-full">
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 rounded-2xl p-3" align="start">
                <div className="grid grid-cols-6 gap-2 text-lg">
                  {emojiPalette.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="rounded-xl p-2 hover:bg-muted"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Textarea
              value={inputValue}
              onChange={(event) => handleTyping(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message"
              className="min-h-[56px] flex-1 rounded-2xl border border-border/60"
            />
            <Button type="button" variant="secondary" size="icon" className="h-10 w-10 rounded-full">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="h-10 w-10 rounded-full">
              <Mic className="h-4 w-4" />
            </Button>
            <Button type="submit" disabled={sending || !inputValue.trim()} className="rounded-2xl px-6">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => {
    if (!selectedProfile) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          Select someone to view their profile.
        </div>
      );
    }

    const isFriend = Boolean(friendsMap[selectedProfile.uid]);
    const pendingIncomingRequest = pendingIncoming.find((request) => request.senderUid === selectedProfile.uid);
    const pendingOutgoingRequest = pendingOutgoing.find((request) => request.receiverUid === selectedProfile.uid);

    return (
      <div className="flex h-full flex-col gap-6 border-l border-border/60 bg-muted/30 p-6">
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
          </div>
        </div>
        <Separator />
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Friends since</span>
            <span className="font-medium text-foreground">{formatSince(selectedProfileMeta?.since)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last seen</span>
            <span className="font-medium text-foreground">{formatLastSeen(onlineUsers[selectedProfile.uid]?.lastSeen)}</span>
          </div>
          {selectedProfile.email && (
            <div className="flex items-center justify-between">
              <span>Email</span>
              <span className="font-medium text-foreground">{selectedProfile.email}</span>
            </div>
          )}
        </div>
        {!isFriend && (
          <>
            <Separator />
            <div className="space-y-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connection</span>
              {pendingIncomingRequest ? (
                <div className="space-y-3 text-xs text-muted-foreground">
                  <p>{selectedProfile.fullName} sent you a friend request.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={() => handleRespondToRequest(pendingIncomingRequest, "accepted")}
                    >
                      <CheckCircle2 className="mr-2 h-3 w-3" /> Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={() => handleRespondToRequest(pendingIncomingRequest, "rejected")}
                    >
                      <XCircle className="mr-2 h-3 w-3" /> Reject
                    </Button>
                  </div>
                </div>
              ) : pendingOutgoingRequest ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Pending response to your request
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => handleAddFriend(selectedProfile.uid)}
                >
                  <UserPlus className="mr-2 h-3 w-3" /> Send friend request
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMainPanel = () => {
    if (!selectedProfile) {
      return (
        <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
          Select a friend to start chatting.
        </div>
      );
    }

    const isFriend = Boolean(friendsMap[selectedProfile.uid]);
    const pendingIncomingRequest = pendingIncoming.find((request) => request.senderUid === selectedProfile.uid);
    const pendingOutgoingRequest = pendingOutgoing.find((request) => request.receiverUid === selectedProfile.uid);

    if (!isFriend) {
      return (
        <div className="flex h-full w-full items-center justify-center px-6 py-10">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-border/60 bg-white/80 p-8 text-center text-sm text-muted-foreground shadow-sm dark:bg-slate-950/70">
            <Avatar className="h-16 w-16">
              <AvatarImage src={selectedProfile.photoUrl} alt={selectedProfile.fullName} />
              <AvatarFallback>{selectedProfile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">{selectedProfile.fullName}</p>
              <p>
                You are not connected yet. Send a friend request to start chatting and see updates.
              </p>
            </div>
            {pendingIncomingRequest ? (
              <div className="flex flex-col gap-3">
                <span className="text-xs text-muted-foreground">This person already sent you a request.</span>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => handleRespondToRequest(pendingIncomingRequest, "accepted")}
                  >
                    <CheckCircle2 className="mr-2 h-3 w-3" /> Accept request
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => handleRespondToRequest(pendingIncomingRequest, "rejected")}
                  >
                    <XCircle className="mr-2 h-3 w-3" /> Reject
                  </Button>
                </div>
              </div>
            ) : pendingOutgoingRequest ? (
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Waiting for them to respond
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => handleAddFriend(selectedProfile.uid)}
              >
                <UserPlus className="mr-2 h-3 w-3" /> Send friend request
              </Button>
            )}
          </div>
        </div>
      );
    }

    return renderMessages();
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-4 p-4">
        <div className="flex h-full gap-4">
          <div className="flex w-80 flex-col rounded-3xl border border-border/60 bg-white/80 shadow-sm dark:bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">Chats</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-10 w-full rounded-xl border border-border/60 bg-white pl-10 text-sm shadow-theme-xs dark:bg-slate-900"
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-22rem)] pr-2">
              <div className="space-y-1 px-2 pb-3">
                {filteredFriends.length === 0 ? (
                  chatSearch.trim().length === 0 && friendsList.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">No friends yet. Explore Discover to add classmates.</div>
                  ) : (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">No chats found.</div>
                  )
                ) : (
                  filteredFriends.map((profile) => {
                    const onlineEntry = onlineUsers[profile.uid];
                    const online = Boolean(onlineEntry?.isOnline);
                    const rel = online ? "now" : formatRelative(onlineEntry?.lastSeen);
                    return (
                      <button
                        key={profile.uid}
                        onClick={() => handleSelectFriend(profile.uid)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition hover:bg-muted/40",
                          activeFriendUid === profile.uid && "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={profile.photoUrl} alt={profile.fullName} />
                              <AvatarFallback>{profile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {online && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />}
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-foreground">{profile.fullName}</span>
                            <span className="truncate text-xs text-muted-foreground">{profile.headline ?? (online ? "Online" : `Last seen ${rel}`)}</span>
                          </div>
                        </div>
                        <span className="ml-2 whitespace-nowrap text-[11px] text-muted-foreground">{rel}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <Tabs defaultValue="people" className="flex flex-col gap-3 border-t border-border/60 p-3">
              <TabsList className="grid h-9 grid-cols-3 rounded-xl bg-muted/40 p-1 text-xs">
                <TabsTrigger value="people" className="rounded-lg">People</TabsTrigger>
                <TabsTrigger value="friends" className="rounded-lg">Friends</TabsTrigger>
                <TabsTrigger value="discover" className="rounded-lg">Discover</TabsTrigger>
              </TabsList>
              
              <TabsContent value="people" className="mt-0">
                <ScrollArea className="h-[calc(100vh-28rem)] pr-2">
                  <div className="space-y-1">
                    {completedStudents.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">No profiles available.</div>
                    ) : (
                      completedStudents.map((student) => (
                        <div key={student.uid} className="flex items-center justify-between rounded-2xl px-3 py-2 hover:bg-muted/40">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={student.photoUrl} alt={student.fullName} />
                              <AvatarFallback className="text-xs">
                                {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{student.fullName}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {student.headline || student.department || student.batch || "Learner"}
                              </div>
                            </div>
                          </div>
                          {!friendsMap[student.uid] && student.uid !== currentUid ? (
                            <Button 
                              size="sm" 
                              className="h-8 rounded-full text-xs" 
                              variant="outline"
                              onClick={() => handleAddFriend(student.uid)}
                            >
                              Add
                            </Button>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="friends" className="mt-0">
                {friendsList.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center px-3 text-center">
                    <Users className="mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No friends yet.</p>
                    <p className="text-xs text-muted-foreground/60">Explore Discover to add classmates</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-28rem)] pr-2">
                    <div className="space-y-2">
                      {friendsList.map((friend) => (
                        <div key={friend.uid} className="flex items-center justify-between rounded-2xl px-3 py-2 hover:bg-muted/40">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={friend.photoUrl} alt={friend.fullName} />
                              <AvatarFallback className="text-xs">
                                {friend.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{friend.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                {friend.headline || friend.department || friend.batch || ""}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 rounded-full px-3 text-xs"
                            onClick={() => handleSelectFriend(friend.uid)}
                          >
                            Message
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="discover" className="mt-0">
                <ScrollArea className="h-[calc(100vh-28rem)] pr-2">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Suggested Classmates</h4>
                      {completedStudents.filter(s => !friendsMap[s.uid] && s.uid !== currentUid && 
                        !incomingRequests.some(r => r.senderUid === s.uid) && 
                        !outgoingRequests.some(r => r.receiverUid === s.uid)).length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                          No suggestions available right now.
                        </div>
                      ) : (
                        completedStudents
                          .filter(s => !friendsMap[s.uid] && s.uid !== currentUid && 
                            !incomingRequests.some(r => r.senderUid === s.uid) && 
                            !outgoingRequests.some(r => r.receiverUid === s.uid))
                          .map((student) => (
                            <div key={student.uid} className="flex items-center justify-between rounded-2xl px-3 py-2 hover:bg-muted/40">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={student.photoUrl} alt={student.fullName} />
                                  <AvatarFallback className="text-xs">
                                    {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{student.fullName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {student.headline || student.department || student.batch || ""}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className="h-8 rounded-full text-xs" 
                                variant="outline"
                                onClick={() => handleAddFriend(student.uid)}
                              >
                                Add
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                    
                    <div className="pt-2">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">Friend Requests</h4>
                        <span className="text-xs text-muted-foreground/60">
                          {incomingRequests.length + outgoingRequests.length} total
                        </span>
                      </div>
                      
                      {incomingRequests.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground/80">Incoming</h5>
                          {incomingRequests.map((request) => {
                            const sender = students.find(s => s.uid === request.senderUid);
                            if (!sender) return null;
                            return (
                              <div key={request.id} className="flex items-center justify-between rounded-2xl bg-muted/20 p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={sender.photoUrl} alt={sender.fullName} />
                                    <AvatarFallback className="text-xs">
                                      {sender.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{sender.fullName}</p>
                                    <p className="text-xs text-muted-foreground">Wants to connect</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="h-8 rounded-full text-xs"
                                    onClick={() => handleRespondToRequest(request, 'accepted')}
                                  >
                                    Accept
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 rounded-full text-xs"
                                    onClick={() => handleRespondToRequest(request, 'rejected')}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {outgoingRequests.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground/80">Sent</h5>
                          {outgoingRequests.map((request) => {
                            const receiver = students.find(s => s.uid === request.receiverUid);
                            if (!receiver) return null;
                            return (
                              <div key={request.id} className="flex items-center justify-between rounded-2xl bg-muted/10 p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={receiver.photoUrl} alt={receiver.fullName} />
                                    <AvatarFallback className="text-xs">
                                      {receiver.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{receiver.fullName}</p>
                                    <p className="text-xs text-muted-foreground">Request sent</p>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 rounded-full text-xs text-muted-foreground"
                                  onClick={() => handleCancelRequest(request.id)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                          No pending friend requests.
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
          <div className="flex min-w-0 flex-1 rounded-3xl border border-border/60 bg-white/90 shadow-sm dark:bg-slate-950/70">
            {renderMainPanel()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsAndMessages;
