"use client"

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Timestamp } from "firebase/firestore"
import { Trash2, ChevronDown } from "lucide-react"
import { useState, useEffect, useRef } from "react"

interface Message {
  id: string
  senderUid: string
  receiverUid: string
  message: string
  timestamp: any
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  onDeleteMessage: (messageId: string) => void
  canDeleteMessage: (message: Message) => boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
}

const formatMessageTime = (timestamp: any): string => {
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

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatMessageDate = (timestamp: any): string => {
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

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  } else {
    return date.toLocaleDateString()
  }
}

export function MessageList({ 
  messages, 
  currentUserId, 
  onDeleteMessage, 
  canDeleteMessage, 
  messagesEndRef 
}: MessageListProps) {
  const [showScrollButton, setShowScrollButton] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }

  const handleScroll = () => {
    if (!containerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50
    const canScroll = scrollHeight > clientHeight
    
    setShowScrollButton(canScroll && !isAtBottom)
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (!showScrollButton) {
      scrollToBottom()
    }
  }, [messages, showScrollButton])

  useEffect(() => {
    // Check initial scroll state
    if (containerRef.current) {
      handleScroll()
    }
  }, [messages])
  if (messages.length === 0) {
    return (
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
        <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-gray-100">No messages yet</h3>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Start a conversation! Send your first message to begin chatting.
        </p>
        <div ref={messagesEndRef} />
      </div>
    )
  }

  const groupedMessages: { [date: string]: Message[] } = {}
  
  messages.forEach((message) => {
    const date = formatMessageDate(message.timestamp)
    if (!groupedMessages[date]) {
      groupedMessages[date] = []
    }
    groupedMessages[date].push(message)
  })

  return (
    <div className="flex-1 relative overflow-hidden h-full">
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto px-6 py-4"
        style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9',
          WebkitScrollbarWidth: 'thin',
          WebkitScrollbarColor: '#cbd5e1 #f1f5f9'
        }}
      >
        <div className="space-y-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              {/* Date separator */}
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {date}
                </div>
              </div>
              
              {/* Messages for this date */}
              {dateMessages.map((message) => {
                const isOwn = message.senderUid === currentUserId
                const canDelete = canDeleteMessage(message)
                
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {isOwn ? "You" : message.senderUid.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                        }`}
                      >
                        <p className="text-sm break-words">{message.message}</p>
                      </div>
                      
                      <div className={`flex items-center gap-2 mt-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        
                        {canDelete && (
                          <button
                            onClick={() => onDeleteMessage(message.id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 active:scale-95"
          title="Scroll to bottom"
          style={{
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
