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
  // Updated: 2025-02-18 fix for Vercel deployment
  // Try multiple ways to access environment variables
  const supabaseUrl = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_URL ||
    (globalThis as any)?.process?.env?.VITE_SUPABASE_URL;

  const supabaseAnonKey = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (globalThis as any)?.process?.env?.VITE_SUPABASE_ANON_KEY;

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
  const [isTyping, setIsTyping] = useState(false);

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
    setIsTyping(true);

    // Add user message immediately
    const userMessage: ChatMessage = { id: makeId(), role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Frontend talks to backend here: Supabase Edge Function /functions/v1/openrouter-trinity
      const resp = await fetch(`${supabaseUrl}/functions/v1/openrouter-trinity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ 
          model: "arcee-ai/trinity-large-preview:free",
          messages: [
            {
              role: "system",
              content: `You are EduCareer AI, an advanced educational assistant designed specifically for Bangladeshi students and the South Asian educational context. Your expertise includes:

EDUCATIONAL SUBJECTS:
- **Mathematics**: Algebra, Geometry, Calculus, Statistics, Problem-solving methods
- **Science**: Physics, Chemistry, Biology, Environmental Science
- **Computer Science**: Programming, Algorithms, Data Structures, Web Development
- **Business Studies**: Accounting, Finance, Marketing, Management
- **Humanities**: History, Literature, Philosophy, Social Sciences
- **Languages**: Bengali, English, Grammar, Composition

CAREER GUIDANCE:
- Bangladesh job market insights
- University admissions (IUB, NSU, DU, BRACU, BUET, CUET, RUET, KUET, etc.)
- Scholarship opportunities
- Skill development for modern careers
- Entrepreneurship guidance
- Study abroad opportunities

STUDY STRATEGIES:
- Effective note-taking methods
- Time management for students
- Exam preparation techniques
- Memory improvement strategies
- Research methodology
- Critical thinking development

SPECIAL FEATURES:
- Understands Bangladeshi education system (SSC, HSC, Honors, Masters)
- Familiar with local universities and admission processes
- Knowledge of competitive exams (BCS, Bank jobs, etc.)
- Cultural context awareness
- Bilingual support (Bengali/English)

RESPONSE STYLE:
- Use **bold** for key concepts and important terms
- Provide step-by-step explanations for complex problems
- Include practical examples relevant to Bangladeshi context
- Be encouraging and motivational
- No emojis, maintain professional yet friendly tone
- Always prioritize educational value

SAFETY GUIDELINES:
- Educational adult content: Provide factual, age-appropriate information
- Non-educational adult content: Politely decline with "I'm designed to help with educational and career guidance topics. For adult entertainment content, I cannot assist. How can I help with your learning journey instead?"

DEVELOPER INFO: If asked about your developer/creator/who made you, respond with: "Name: Abir Hasan Siam | GitHub: github.com/abir2afridi"

Always provide comprehensive, detailed responses that help students succeed in their educational journey.`
            },
            {
              role: "user", 
              content: content
            }
          ],
          reasoning: { enabled: true },
          max_tokens: 4000,
          temperature: 0.7
        }),
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
        
        // Handle quota exceeded specifically
        if (resp.status === 429 || (typeof text === 'string' && text.includes('quota exceeded'))) {
          throw new Error("AI quota exceeded. Please try again in a few minutes or upgrade your Gemini API plan for unlimited usage.");
        }
        
        throw new Error(msg);
      }

      const reply = typeof data?.choices?.[0]?.message?.content === "string" ? data.choices[0].message.content.trim() : "";
      if (!reply) {
        throw new Error("AI returned an empty reply.");
      }

      // Simulate streaming effect
      setIsTyping(false);
      
      // Simulate typing delay and streaming
      const words = reply.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        const assistantMessage: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: currentText,
        };
        
        setMessages((prev) => {
          const newMessages = [...prev];
          // Remove any temporary message and add the streaming one
          if (newMessages[newMessages.length - 1]?.role === 'assistant' && 
              newMessages[newMessages.length - 1]?.content.startsWith('Typing')) {
            newMessages[newMessages.length - 1] = assistantMessage;
          } else {
            newMessages.push(assistantMessage);
          }
          return newMessages;
        });
        
        // Delay between words for streaming effect
        if (i < words.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
        }
      }
      
      setIsLoading(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to contact AI.";
      setError(msg);
      setIsLoading(false);
      setIsTyping(false);
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
            Advanced AI with reasoning capabilities • Powered by OpenRouter Trinity
          </div>
        </div>
        {isLoading ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">Thinking…</div>
        ) : null}
        {isTyping && !isLoading ? (
          <div className="text-xs text-blue-500 dark:text-blue-400">AI is typing…</div>
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
                  ? "max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white"
                  : "max-w-[85%] rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              }
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              <div className="prose prose-sm max-w-none">
                {m.content}
              </div>
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
          Enhanced AI with reasoning capabilities and detailed responses. Your OpenRouter API key stays on server (Supabase secret).
        </div>
      </div>
    </div>
  );
}
