import { cn } from "../../lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Input } from "../ui/input"
import { Search } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { useState } from "react"

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

interface FriendsSidebarProps {
  friends: Friend[]
  chatPreviews: ChatPreview[]
  selectedFriend: Friend | null
  onSelectFriend: (friend: Friend) => void
}

const formatTimeAgo = (timestamp: any): string => {
  if (!timestamp) return ""
  
  let date: Date
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate()
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else if (typeof timestamp === "object" && timestamp.toDate) {
    date = timestamp.toDate()
  } else {
    return ""
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

export function FriendsSidebar({ friends, chatPreviews, selectedFriend, onSelectFriend }: FriendsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.email && friend.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getChatPreview = (friend: Friend) => {
    return chatPreviews.find(preview => preview.friend.uid === friend.uid)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search Bar */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search messages or users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full bg-gray-100 pl-10 focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-gray-800"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mb-1 font-medium text-gray-900 dark:text-gray-100">No friends found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? "Try adjusting your search" : "Add friends to start messaging"}
            </p>
          </div>
        ) : (
          filteredFriends.map((friend) => {
            const preview = getChatPreview(friend)
            const isSelected = selectedFriend?.uid === friend.uid
            
            return (
              <div
                key={friend.uid}
                className={cn(
                  "flex cursor-pointer items-center border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
                  isSelected && "bg-gray-100 dark:bg-gray-800"
                )}
                onClick={() => onSelectFriend(friend)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={friend.photoURL} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-4 flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h4 className="truncate font-medium text-gray-900 dark:text-gray-100">{friend.name}</h4>
                    {preview?.lastTimestamp && (
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(preview.lastTimestamp)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {preview?.lastMessage || `Start a conversation with ${friend.name}`}
                  </p>
                </div>
                {preview?.unreadCount && preview.unreadCount > 0 && (
                  <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                    {preview.unreadCount}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
