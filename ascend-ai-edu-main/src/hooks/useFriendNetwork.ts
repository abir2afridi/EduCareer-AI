import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { 
  addDoc, 
  collection, 
  deleteDoc, 
  doc, 
  getDoc, 
  onSnapshot, 
  orderBy, 
  query, 
  serverTimestamp, 
  setDoc, 
  updateDoc,
  where,
  writeBatch 
} from "firebase/firestore";

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
  respondedAt?: Date | null;
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

  const setupOutgoingListener = useCallback(() => {
    if (!currentUid) return;
    
    const outgoing = query(
      collection(db, "friendRequests"), 
      where("senderUid", "==", currentUid)
    );
    
    return onSnapshot(outgoing, 
      (snapshot) => {
        console.log("Outgoing requests updated:", snapshot.docs.length, "requests");
        const requests: FriendRequestEntry[] = [];
        
        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          console.log("Outgoing request:", { 
            id: docSnapshot.id, 
            sender: data.senderUid, 
            receiver: data.receiverUid, 
            status: data.status 
          });
          
          requests.push({
            id: docSnapshot.id,
            senderUid: data.senderUid,
            receiverUid: data.receiverUid,
            status: data.status,
            createdAt: data.createdAt?.toDate?.() ?? null,
            respondedAt: data.respondedAt?.toDate?.() ?? null,
          });
        });
        
        setOutgoingRequests(requests);
      },
      (error) => {
        console.error("Error in outgoing requests listener:", error);
      }
    );
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;

    const incoming = query(
      collection(db, "friendRequests"), 
      where("receiverUid", "==", currentUid)
    );

    const unsubIncoming = onSnapshot(
      incoming, 
      (snapshot) => {
        const requests: FriendRequestEntry[] = [];
        
        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          requests.push({
            id: docSnapshot.id,
            senderUid: data.senderUid,
            receiverUid: data.receiverUid,
            status: data.status,
            createdAt: data.createdAt?.toDate?.() ?? null,
            respondedAt: data.respondedAt?.toDate?.() ?? null,
          });
        });
        
        setIncomingRequests(requests);
      },
      (error) => {
        console.error("Error in incoming requests listener:", error);
      }
    );

    const unsubOutgoing = setupOutgoingListener();

    return () => {
      unsubIncoming();
      unsubOutgoing?.();
    };
  }, [currentUid, setupOutgoingListener]);

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
    async (receiverUid: string): Promise<void> => {
      if (!currentUid || currentUid === receiverUid) return;

      try {
        // Create a deterministic ID for the friend request (sorted to ensure consistency)
        const [smallerUid, largerUid] = [currentUid, receiverUid].sort();
        const requestId = `${smallerUid}_${largerUid}`;
        
        const requestRef = doc(db, "friendRequests", requestId);
        const requestSnap = await getDoc(requestRef);
        
        // If request already exists, don't create a new one
        if (requestSnap.exists()) {
          console.log("Friend request already exists");
          return;
        }

        // Create the friend request
        await setDoc(requestRef, {
          senderUid: currentUid,
          receiverUid,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error sending friend request:", error);
        throw error;
      }
    },
    [currentUid]
  );

  const handleRespondToRequest = useCallback(
    async (request: FriendRequestEntry, response: "accepted" | "rejected"): Promise<void> => {
      if (!currentUid || request.receiverUid !== currentUid) {
        console.error("Not authorized to respond to this request");
        return;
      }

      try {
        const requestRef = doc(db, "friendRequests", request.id);
        
        if (response === "accepted") {
          // Create friendship in both directions
          const userFriendRef = doc(db, "users", currentUid, "friends", request.senderUid);
          const otherUserFriendRef = doc(db, "users", request.senderUid, "friends", currentUid);
          
          // Use batch to ensure atomic updates
          const batch = writeBatch(db);
          
          // Add friend to current user's friends list
          batch.set(userFriendRef, {
            uid: request.senderUid,
            since: serverTimestamp(),
            status: "accepted"
          });
          
          // Add current user to the other user's friends list
          batch.set(otherUserFriendRef, {
            uid: currentUid,
            since: serverTimestamp(),
            status: "accepted"
          });
          
          // Update request status to accepted
          batch.update(requestRef, { 
            status: "accepted",
            respondedAt: serverTimestamp()
          });
          
          await batch.commit();
          console.log("Friend request accepted and friendship created");
        } else {
          // For rejection, just update the status
          await updateDoc(requestRef, { 
            status: "rejected",
            respondedAt: serverTimestamp()
          });
          console.log("Friend request rejected");
        }
      } catch (error) {
        console.error(`Error ${response}ing friend request:`, error);
        throw error;
      }
    },
    [currentUid]
  );

  const handleCancelRequest = useCallback(
    async (requestId: string): Promise<void> => {
      if (!currentUid) return;

      try {
        console.log("Attempting to cancel request with ID:", requestId);
        const requestRef = doc(db, "friendRequests", requestId);
        const requestSnap = await getDoc(requestRef);
        
        if (!requestSnap.exists()) {
          console.error("Request not found:", requestId);
          return;
        }
        
        const requestData = requestSnap.data();
        if (requestData.senderUid !== currentUid) {
          console.error("Not authorized to cancel this request");
          return;
        }
        
        await deleteDoc(requestRef);
        console.log("Successfully deleted request:", requestId);
      } catch (error) {
        console.error("Error canceling friend request:", error);
        throw error;
      }
    },
    [currentUid]
  );

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
