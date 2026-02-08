"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useFriendNetwork } from "@/hooks/useFriendNetwork"
import { useAuth } from "@/components/auth-provider"
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDoc,
  type DocumentData,
  type FirestoreError,
  type Unsubscribe
} from "firebase/firestore"
import { db } from "@/lib/firebaseClient"
import { FriendsSidebar } from "./friends-sidebar"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"

interface Message {
  id: string
  senderUid: string
  receiverUid: string
  message: string
  timestamp: any
}

interface Friend {
  uid: string
  name: string
  email?: string
  photoURL?: string
}

interface ChatPreview {
  friend: Friend
  lastMessage?: string
  lastTimestamp?: any
  unreadCount?: number
}

export function ChatPage() {
  const { user } = useAuth()
  const { students, friendsMap } = useFriendNetwork()
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)

  // Convert friendsMap to friends array
  const acceptedFriendIds = useMemo(() => new Set<string>(Object.keys(friendsMap)), [friendsMap])

  const friends = useMemo(() => {
    if (!user?.uid) return []

    return Array.from(acceptedFriendIds)
      .filter((uid) => uid !== user.uid)
      .map((uid) => {
        const student = students.find((s) => s.uid === uid)
        return {
          uid,
          name: student?.fullName || "Unknown User",
          email: student?.email,
          photoURL: student?.photoUrl,
          status: student?.status || "offline",
          lastSeen: student?.lastSeen,
        }
      })
  }, [acceptedFriendIds, students, user?.uid])

  useEffect(() => {
    setIsLoading(false)
  }, [students, friendsMap])

  const generateChatId = (uid1: string, uid2: string): string => {
    return [uid1, uid2].sort().join("_")
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!user || friends.length === 0) return

    const loadChatPreviews = async () => {
      const previews: ChatPreview[] = []
      
      for (const friend of friends) {
        try {
          const chatId = generateChatId(user.uid, friend.uid)
          const messagesRef = collection(db, "messages", chatId, "chats")
          const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"))
          
          const unsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
              if (!snapshot.empty) {
                const lastMessageDoc = snapshot.docs[0]
                const lastMessage = lastMessageDoc.data() as Message
                
                const preview: ChatPreview = {
                  friend,
                  lastMessage: lastMessage.message,
                  lastTimestamp: lastMessage.timestamp,
                  unreadCount: 0
                }
                
                setChatPreviews(prev => {
                  const existing = prev.findIndex(p => p.friend.uid === friend.uid)
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = preview
                    return updated
                  }
                  return [...prev, preview]
                })
              }
            },
            (err) => {
              console.error(`Error loading chat preview for ${friend.uid}:`, err)
            }
          )
          
          return unsubscribe
        } catch (err) {
          console.error(`Error setting up chat preview for ${friend.uid}:`, err)
        }
      }
    }

    loadChatPreviews()
  }, [user, friends])

  useEffect(() => {
    if (!user || !selectedFriend) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      setMessages([])
      return
    }

    const chatId = generateChatId(user.uid, selectedFriend.uid)
    const messagesRef = collection(db, "messages", chatId, "chats")
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"))

    unsubscribeRef.current = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList: Message[] = []
        snapshot.forEach((doc) => {
          const data = doc.data() as Message
          messagesList.push({
            id: doc.id,
            senderUid: data.senderUid,
            receiverUid: data.receiverUid,
            message: data.message,
            timestamp: data.timestamp
          })
        })
        setMessages(messagesList)
        setError(null)
      },
      (err: FirestoreError) => {
        console.error("Error listening to messages:", err)
        setError("Failed to load messages")
      }
    )

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [user, selectedFriend])

  const checkFriendship = async (senderUid: string, receiverUid: string): Promise<boolean> => {
    try {
      // Check if sender has receiver as a friend
      const senderFriendRef = doc(db, "users", senderUid, "friends", receiverUid)
      const senderFriendSnap = await getDoc(senderFriendRef)
      
      if (!senderFriendSnap.exists()) {
        return false
      }
      
      // Check if receiver has sender as a friend (bidirectional friendship)
      const receiverFriendRef = doc(db, "users", receiverUid, "friends", senderUid)
      const receiverFriendSnap = await getDoc(receiverFriendRef)
      
      return receiverFriendSnap.exists()
    } catch (err) {
      console.error("Error checking friendship:", err)
      return false
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!user || !selectedFriend || !content.trim()) return

    try {
      setIsSending(true)
      setError(null)

      const areFriends = await checkFriendship(user.uid, selectedFriend.uid)
      if (!areFriends) {
        setError("You can only message users who are in your Friends list.")
        return
      }

      const chatId = generateChatId(user.uid, selectedFriend.uid)
      const messagesRef = collection(db, "messages", chatId, "chats")

      const messageData = {
        senderUid: user.uid,
        receiverUid: selectedFriend.uid,
        message: content.trim(),
        timestamp: serverTimestamp()
      }

      await addDoc(messagesRef, messageData)
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!user || !selectedFriend) return

    try {
      const chatId = generateChatId(user.uid, selectedFriend.uid)
      const messageRef = doc(db, "messages", chatId, "chats", messageId)
      await deleteDoc(messageRef)
    } catch (err) {
      console.error("Error deleting message:", err)
      setError("Failed to delete message")
    }
  }

  const canDeleteMessage = (message: Message): boolean => {
    return message.senderUid === user?.uid
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-500">Loading chats...</p>
        </div>
      </div>
    )
  }

  if (error && !selectedFriend) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 rounded-full bg-red-100 p-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-medium text-gray-900">Error</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="w-80 border-r border-gray-200 dark:border-gray-800">
        <FriendsSidebar 
          friends={friends}
          chatPreviews={chatPreviews}
          selectedFriend={selectedFriend}
          onSelectFriend={setSelectedFriend}
        />
      </div>

      <div className="flex flex-1 flex-col">
        {selectedFriend ? (
          <>
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-300">
                  {selectedFriend.photoURL ? (
                    <img 
                      src={selectedFriend.photoURL} 
                      alt={selectedFriend.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 text-white">
                      {selectedFriend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{selectedFriend.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedFriend.email || "No email"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <MessageList 
                messages={messages}
                currentUserId={user?.uid || ""}
                onDeleteMessage={handleDeleteMessage}
                canDeleteMessage={canDeleteMessage}
                messagesEndRef={messagesEndRef}
              />
            </div>

            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
              <MessageInput 
                onSend={handleSendMessage}
                disabled={isSending}
                error={error}
              />
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-12 w-12 text-gray-400"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-gray-100">Select a conversation</h3>
            <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Choose a friend from the sidebar to start chatting.
            </p>
            {friends.length === 0 && (
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                No friends found. Add friends to start messaging.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
