import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Smile, Send, Loader2, Circle, Search, Phone, Video, MoreVertical, Paperclip, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StudentProfile {
  uid: string;
  fullName: string;
  headline?: string;
  photoUrl?: string;
}

interface ChatMessage {
  id: string;
  senderUid: string;
  receiverUid: string;
  text: string;
  timestamp?: Date | null;
}

const emojiPalette = ["😀", "😁", "😂", "😊", "😍", "🥳", "🤝", "👍", "🙏", "🚀", "✨", "💡", "📚", "🎯", "🔥"];

const getChatId = (uidA: string, uidB: string) => [uidA, uidB].sort().join("__");

export default function Messages() {
  const { user } = useAuth();
  const currentUid = user?.uid;

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, { isOnline: boolean; lastSeen?: Date | null }>>({});
  const [selectedUser, setSelectedUser] = useState<StudentProfile | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [chatSearch, setChatSearch] = useState("");

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!currentUid) return;

    const ref = collection(db, "students");
    const unsub = onSnapshot(ref, (snapshot) => {
      const items = snapshot.docs
        .filter((docSnapshot) => docSnapshot.id !== currentUid)
        .map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            uid: docSnapshot.id,
            fullName: data.fullName ?? data.name ?? "Unknown",
            headline: data.headline ?? data.bio ?? data.role ?? "Learner at EduCareer AI",
            photoUrl: data.avatarUrl ?? data.photoURL ?? data.photo ?? undefined,
          } satisfies StudentProfile;
        });
      setStudents(items);
      if (!selectedUser && items.length > 0) {
        setSelectedUser(items[0]);
      } else if (selectedUser && items.every((student) => student.uid !== selectedUser.uid)) {
        setSelectedUser(items[0] ?? null);
      }
    });

    return unsub;
  }, [currentUid, selectedUser]);

  useEffect(() => {
    const ref = collection(db, "onlineUsers");
    const unsub = onSnapshot(ref, (snapshot) => {
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
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUid) return;
    const statusRef = doc(db, "onlineUsers", currentUid);
    const markOnline = async (isOnline: boolean) => {
      try {
        await setDoc(statusRef, { isOnline, lastSeen: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Status update failed", error);
      }
    };

    void markOnline(true);

    const visibility = () => {
      void markOnline(!document.hidden);
    };
    const unload = () => {
      void markOnline(false);
    };

    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("beforeunload", unload);

    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("beforeunload", unload);
      void markOnline(false);
    };
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid || !selectedUser) {
      setChatId(null);
      setMessages([]);
      return;
    }

    const id = getChatId(currentUid, selectedUser.uid);
    setChatId(id);
    setLoadingMessages(true);

    const parentRef = doc(db, "messages", id);
    void getDoc(parentRef).then((snapshot) => {
      if (!snapshot.exists()) {
        void setDoc(parentRef, {
          participants: [currentUid, selectedUser.uid],
          createdAt: serverTimestamp(),
        });
      }
    });
  }, [currentUid, selectedUser]);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    const ref = collection(db, "messages", chatId, "chats");
    const q = query(ref, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const items: ChatMessage[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          senderUid: data.senderUid,
          receiverUid: data.receiverUid,
          text: data.text ?? "",
          timestamp: data.timestamp?.toDate?.() ?? null,
        };
      });
      setMessages(items);
      setLoadingMessages(false);
    });

    return unsub;
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    const typingRef = collection(db, "messages", chatId, "typing");
    const unsub = onSnapshot(typingRef, (snapshot) => {
      const map: Record<string, boolean> = {};
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        map[docSnapshot.id] = Boolean(data.isTyping);
      });
      setTypingUsers(map);
    });

    return unsub;
  }, [chatId]);

  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const isTyping = useMemo(() => {
    if (!selectedUser) return false;
    return Boolean(typingUsers[selectedUser.uid]);
  }, [typingUsers, selectedUser]);

  const handleSelectUser = (profile: StudentProfile) => {
    setSelectedUser(profile);
  };

  const handleTyping = async (value: string) => {
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
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !chatId || !currentUid || !selectedUser) return;

    setSending(true);
    const chatsRef = collection(db, "messages", chatId, "chats");

    try {
      await addDoc(chatsRef, {
        senderUid: currentUid,
        receiverUid: selectedUser.uid,
        text: trimmed,
        timestamp: serverTimestamp(),
      });
      setInputValue("");
      const typingRef = doc(db, "messages", chatId, "typing", currentUid);
      void setDoc(typingRef, { isTyping: false, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Sending message failed", error);
    } finally {
      setSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  const formatTimestamp = (date?: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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

  const renderChatItem = (profile: StudentProfile) => {
    const active = selectedUser?.uid === profile.uid;
    const presence = onlineUsers[profile.uid];
    const online = Boolean(presence?.isOnline);
    const rel = online ? "now" : formatRelative(presence?.lastSeen);
    return (
      <button
        key={profile.uid}
        onClick={() => handleSelectUser(profile)}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition hover:bg-muted/40",
          active && "bg-muted/50",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.photoUrl} alt={profile.fullName} />
              <AvatarFallback>{profile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {online && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{profile.fullName}</span>
            <span className="truncate text-xs text-muted-foreground">{online ? "Online" : `Last seen ${rel}`}</span>
          </div>
        </div>
        <span className="ml-2 whitespace-nowrap text-[11px] text-muted-foreground">{rel}</span>
      </button>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwn = message.senderUid === currentUid;
    const rel = formatRelative(message.timestamp);
    return (
      <div key={message.id} className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[70%] rounded-3xl px-4 py-2 text-sm shadow-sm",
            isOwn
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
              : "bg-muted text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          {message.timestamp && (
            <span className={cn("mt-1 block text-[10px]", isOwn ? "text-white/70" : "text-muted-foreground")}> 
              {isOwn ? rel : `${selectedUser?.fullName?.split(" ")[0] ?? ""}, ${rel}`}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (!currentUid) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="text-muted-foreground">Sign in to view your messages.</span>
      </div>
    );
  }

  return (
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
        <ScrollArea className="h-[calc(100vh-18rem)] pr-2">
          <div className="space-y-1 px-2 pb-3">
            {filteredStudents.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">No chats found.</div>
            ) : (
              filteredStudents.map((student) => renderChatItem(student))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex min-w-0 flex-1 rounded-3xl border border-border/60 bg-white/90 shadow-sm dark:bg-slate-950/70">
        <div className="flex min-h-[360px] flex-1 flex-col">
          {selectedUser ? (
            <Fragment>
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUser.photoUrl} alt={selectedUser.fullName} />
                    <AvatarFallback>{selectedUser.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {selectedUser.fullName}
                      {onlineUsers[selectedUser.uid]?.isOnline && (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isTyping
                        ? "Typing..."
                        : onlineUsers[selectedUser.uid]?.isOnline
                          ? "Online"
                          : `Last seen ${formatRelative(onlineUsers[selectedUser.uid]?.lastSeen)}`}
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

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="flex-1 px-6 py-4">
                  <div className="space-y-3">
                    {loadingMessages ? (
                      <div className="flex justify-center py-10 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading messages...
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((message) => renderMessage(message))
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
                        <Smile className="h-10 w-10 text-muted-foreground/60" />
                        <span>Start the conversation by sending a message.</span>
                      </div>
                    )}
                    <div ref={listEndRef} />
                  </div>
                </ScrollArea>
              </div>

              <div className="border-t border-border/60 px-6 py-4">
                <form
                  className="flex items-end gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSend();
                  }}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="secondary" type="button" className="h-10 w-10 rounded-full p-0">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 rounded-2xl p-3" align="start">
                      <div className="grid grid-cols-6 gap-2 text-lg">
                        {emojiPalette.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiSelect(emoji)}
                            className="rounded-xl p-2 hover:bg-muted"
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
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    className="min-h-[56px] flex-1 rounded-2xl border border-border/60"
                  />
                  <Button type="button" variant="secondary" className="h-10 w-10 rounded-full p-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="secondary" className="h-10 w-10 rounded-full p-0">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button type="submit" className="rounded-2xl px-6" disabled={sending || !inputValue.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </Fragment>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Smile className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Select a chat from the list to view your conversation or start a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
