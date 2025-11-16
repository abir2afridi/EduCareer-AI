import { useCallback, useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";

import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebaseClient";

export interface FriendStudentProfile {
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

export interface FriendEntry {
  uid: string;
  since?: Date | null;
  status?: string;
}

export interface FriendRequestEntry {
  id: string;
  senderUid: string;
  receiverUid: string;
  status: "pending" | "accepted" | "rejected";
  createdAt?: Date | null;
}

export interface OnlineUserEntry {
  isOnline: boolean;
  lastSeen?: Date | null;
}

export interface UseFriendNetworkResult {
  currentUid: string | undefined;
  students: FriendStudentProfile[];
  friendsMap: Record<string, FriendEntry>;
  onlineUsers: Record<string, OnlineUserEntry>;
  incomingRequests: FriendRequestEntry[];
  outgoingRequests: FriendRequestEntry[];
  pendingIncoming: FriendRequestEntry[];
  pendingOutgoing: FriendRequestEntry[];
  handleAddFriend: (receiverUid: string) => Promise<void>;
  handleRespondToRequest: (request: FriendRequestEntry, action: "accepted" | "rejected") => Promise<void>;
  handleCancelRequest: (requestId: string) => Promise<void>;
  hasPendingIncoming: (uid: string) => boolean;
}

export const useFriendNetwork = (): UseFriendNetworkResult => {
  const { user } = useAuth();
  const currentUid = user?.uid;

  const [students, setStudents] = useState<FriendStudentProfile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUserEntry>>({});
  const [friendsMap, setFriendsMap] = useState<Record<string, FriendEntry>>({});
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestEntry[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestEntry[]>([]);

  useEffect(() => {
    if (!currentUid) return;

    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const list: FriendStudentProfile[] = snapshot.docs
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
          } satisfies FriendStudentProfile;
        });

      setStudents(list);
    });

    return unsubscribe;
  }, [currentUid]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "onlineUsers"), (snapshot) => {
      const map: Record<string, OnlineUserEntry> = {};
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        map[docSnapshot.id] = {
          isOnline: Boolean(data.isOnline),
          lastSeen: data.lastSeen?.toDate?.() ?? null,
        } satisfies OnlineUserEntry;
      });
      setOnlineUsers(map);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUid) return;

    const friendsQuery = query(collection(db, "users", currentUid, "friends"), orderBy("since", "desc"));
    const unsubscribe = onSnapshot(friendsQuery, (snapshot) => {
      const map: Record<string, FriendEntry> = {};
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        map[docSnapshot.id] = {
          uid: docSnapshot.id,
          since: data.since?.toDate?.() ?? null,
          status: data.status ?? "accepted",
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
      setIncomingRequests(
        snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            senderUid: data.senderUid,
            receiverUid: data.receiverUid,
            status: data.status,
            createdAt: data.createdAt?.toDate?.() ?? null,
          } satisfies FriendRequestEntry;
        }),
      );
    });

    const unsubOutgoing = onSnapshot(outgoing, (snapshot) => {
      setOutgoingRequests(
        snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            senderUid: data.senderUid,
            receiverUid: data.receiverUid,
            status: data.status,
            createdAt: data.createdAt?.toDate?.() ?? null,
          } satisfies FriendRequestEntry;
        }),
      );
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

  const pendingIncoming = useMemo(
    () => incomingRequests.filter((request) => request.status === "pending"),
    [incomingRequests],
  );

  const pendingOutgoing = useMemo(
    () => outgoingRequests.filter((request) => request.status === "pending"),
    [outgoingRequests],
  );

  const handleAddFriend = useCallback(
    async (receiverUid: string) => {
      if (!currentUid || receiverUid === currentUid) return;
      const exists = pendingOutgoing.some((request) => request.receiverUid === receiverUid);
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
    },
    [currentUid, pendingOutgoing],
  );

  const handleRespondToRequest = useCallback(
    async (request: FriendRequestEntry, action: "accepted" | "rejected") => {
      if (!currentUid) return;
      try {
        await setDoc(doc(db, "friendRequests", request.id), { status: action, respondedAt: serverTimestamp() }, { merge: true });

        if (action === "accepted" && request.receiverUid === currentUid) {
          const otherUid = request.senderUid;
          await setDoc(
            doc(db, "users", currentUid, "friends", otherUid),
            { since: serverTimestamp(), status: "accepted" },
            { merge: true },
          );
        }
      } catch (error) {
        console.error("Respond to friend request failed", error);
      }
    },
    [currentUid],
  );

  const handleCancelRequest = useCallback(async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "friendRequests", requestId));
    } catch (error) {
      console.error("Cancel friend request failed", error);
    }
  }, []);

  useEffect(() => {
    if (!currentUid) return;

    const accepted = [...incomingRequests, ...outgoingRequests].filter((request) => request.status === "accepted");

    accepted.forEach((request) => {
      const otherUid = request.senderUid === currentUid ? request.receiverUid : request.senderUid;
      const existing = friendsMap[otherUid];

      if (!existing || existing.status !== "accepted") {
        void setDoc(
          doc(db, "users", currentUid, "friends", otherUid),
          { since: serverTimestamp(), status: "accepted" },
          { merge: true },
        ).catch((error) => {
          console.error("Friend sync failed", error);
        });
      }
    });
  }, [incomingRequests, outgoingRequests, friendsMap, currentUid]);

  const hasPendingIncoming = useCallback(
    (uid: string) => pendingIncoming.some((request) => request.senderUid === uid),
    [pendingIncoming],
  );

  return {
    currentUid,
    students,
    friendsMap,
    onlineUsers,
    incomingRequests,
    outgoingRequests,
    pendingIncoming,
    pendingOutgoing,
    handleAddFriend,
    handleRespondToRequest,
    handleCancelRequest,
    hasPendingIncoming,
  };
};
