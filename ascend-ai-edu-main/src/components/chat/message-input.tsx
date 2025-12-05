import { useState, useRef, KeyboardEvent } from "react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Paperclip, Mic, Smile, Send, AlertCircle } from "lucide-react"

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  error?: string | null
}

export function MessageInput({ onSend, disabled = false, error }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [message, setMessage] = useState("")
  const [isComposing, setIsComposing] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage("")
      // Reset the textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
    setMessage(e.target.value)
  }

  const canSend = message.trim().length > 0 && !disabled

  return (
    <div className="relative">
      {/* Error message */}
      {error && (
        <div className="mb-2 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-end rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full"
          disabled={disabled}
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full"
          disabled={disabled}
          title="Add emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>
        
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={disabled ? "Cannot send message" : "Type a message..."}
            disabled={disabled}
            className="max-h-32 min-h-10 resize-none border-0 bg-transparent px-3 py-2.5 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
            rows={1}
            style={{ overflow: 'hidden' }}
          />
        </div>
        
        <Button
          size="icon"
          className={`ml-2 h-10 w-10 rounded-full transition-colors ${
            canSend 
              ? "bg-primary text-white hover:bg-primary/90" 
              : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
          }`}
          onClick={handleSend}
          disabled={!canSend}
          title={canSend ? "Send message" : disabled ? "Cannot send message" : "Type a message to send"}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="mt-2 flex items-center justify-between px-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs text-muted-foreground"
          disabled={disabled}
          title="Voice messages coming soon"
        >
          <Mic className="mr-1.5 h-3.5 w-3.5" />
          Press to talk
        </Button>
        <span className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </span>
      </div>
    </div>
  )
}
