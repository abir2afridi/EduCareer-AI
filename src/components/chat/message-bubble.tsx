"use client"

import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

interface Message {
  id: string
  content: string
  sender: "user" | "other"
  senderName: string
  timestamp: Date
  avatar?: string
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user"

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      {!isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.avatar} alt={message.senderName} />
          <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-xs px-4 py-2 rounded-2xl ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
        <p
          className={`mt-1 text-xs ${
            isUser
              ? "text-primary-foreground/70"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {format(message.timestamp, "h:mm a")}
        </p>
      </div>

      {/* User avatar (for sent messages) */}
      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
