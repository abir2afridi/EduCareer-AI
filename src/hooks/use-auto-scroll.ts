"use client"

import { useEffect, useRef, useState } from "react"

interface Message {
  id: string
  content: string
  sender: "user" | "other"
  senderName: string
  timestamp: Date
  avatar?: string
}

export function useAutoScroll(messages: Message[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false)

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
      setIsAtBottom(true)
      setShowNewMessageIndicator(false)
    }
  }

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50
      setIsAtBottom(isScrolledToBottom)
    }
  }

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive and user is at bottom
    if (isAtBottom && containerRef.current) {
      scrollToBottom()
    } else if (!isAtBottom && messages.length > 0) {
      // Show indicator when new message arrives and user is not at bottom
      setShowNewMessageIndicator(true)
    }
  }, [messages, isAtBottom])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return {
    containerRef,
    isAtBottom,
    scrollToBottom,
    showNewMessageIndicator,
  }
}
