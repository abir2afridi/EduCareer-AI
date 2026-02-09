import { useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type AiChatBoxProps = {
  className?: string;
  title?: string;
  placeholder?: string;
  initialMessages?: ChatMessage[];
  maxHeightPx?: number;
};

function getSupabaseConfig(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
} {
  const supabaseUrl = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ??
    (import.meta as any).env?.VITE_SUPABASE_URL ??
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (or VITE_* equivalents).",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function AiChatBox({
  className,
  title = "EduCareer AI",
  placeholder = "Ask anything…",
  initialMessages,
  maxHeightPx = 420,
}: AiChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages?.length
      ? initialMessages
      : [
          {
            id: makeId(),
            role: "assistant",
            content: "Hi! How can I help you today?",
          },
        ],
  );
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const { supabaseUrl, supabaseAnonKey } = useMemo(() => {
    try {
      return getSupabaseConfig();
    } catch (e) {
      // Defer surfacing the error until render (so the component still mounts in dev tooling).
      return { supabaseUrl: "", supabaseAnonKey: "" };
    }
  }, []);

  const configError = useMemo(() => {
    try {
      getSupabaseConfig();
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Missing Supabase env.";
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, error]);

  const sendMessage = async () => {
    if (configError) return;
    const content = input.trim();
    if (!content || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = { id: makeId(), role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Frontend talks to backend here: Supabase Edge Function /functions/v1/ai-chat
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ message: content }),
      });

      const text = await resp.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!resp.ok) {
        const msg =
          data?.error ||
          `Request failed (${resp.status}). ${typeof text === "string" ? text.slice(0, 500) : ""}`;
        throw new Error(msg);
      }

      const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
      if (!reply) {
        throw new Error("AI returned an empty reply.");
      }

      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to contact AI.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        className ??
        "w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950"
      }
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
          <div className="truncate text-xs text-gray-500 dark:text-gray-400">
            Powered by Google Gemini AI
          </div>
        </div>
        {isLoading ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">Thinking…</div>
        ) : null}
      </div>

      <div
        className="space-y-3 overflow-y-auto px-4 py-4"
        style={{ maxHeight: maxHeightPx }}
      >
        {configError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {configError}
          </div>
        ) : null}

        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white"
                  : "max-w-[85%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              }
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            rows={1}
            className="min-h-[44px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
            disabled={!!configError || isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
          />

          <button
            type="submit"
            className="h-[44px] shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!!configError || isLoading || !input.trim()}
          >
            Send
          </button>
        </form>

        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Your Gemini API key stays on the server (Supabase secret). The frontend only calls your Edge Function.
        </div>
      </div>
    </div>
  );
}
