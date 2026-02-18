// @ts-ignore
import { serve } from "https://deno.land/std/http/server.ts";

// Disable JWT verification for testing
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AiChatRequestBody = {
  message?: unknown;
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

function getEnv(name: string): string | null {
  // Loader-friendly: this file might be type-checked in Node where `Deno` doesn't exist.
  try {
    const denoLike = (globalThis as unknown as { Deno?: { env?: { get?: (k: string) => string | undefined } } }).Deno;
    const value = denoLike?.env?.get?.(name);
    return value ?? null;
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  // Log request details for debugging
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));
  console.log("Request method:", req.method);

  try {
    // Receive user message from frontend
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse({ error: "Content-Type must be application/json" }, { status: 415 });
    }

    const body = (await req.json()) as AiChatRequestBody;
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return jsonResponse({ error: "Missing 'message' in request body" }, { status: 400 });
    }

    // Get API key from Supabase Secret (do not expose it to frontend)
    const openRouterKey = getEnv("OPENROUTER_API_KEY");
    const geminiKey = getEnv("GEMINI_API_KEY");
    
    if (!openRouterKey && !geminiKey) {
      return jsonResponse(
        {
          error: "Server is missing API keys. Add OPENROUTER_API_KEY or GEMINI_API_KEY in Supabase secrets.",
        },
        { status: 500 },
      );
    }

    let aiResponse: Response;
    let providerUsed: string;

    // Try Gemini first (more reliable currently), then OpenRouter as backup
    if (geminiKey) {
      try {
        aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "You are EduCareer AI, an advanced educational assistant. Your role is to help students with educational topics, career guidance, study strategies, learning methods, academic questions, and general knowledge (when educational). IMPORTANT GUIDELINES: Answer questions directly and comprehensively. Be helpful, encouraging, and detailed. Use **bold** for key concepts. Provide examples and practical applications. No emojis. ADULT CONTENT POLICY: For EDUCATIONAL adult content (sex education, reproductive health, adult learning topics): Provide helpful, educational, and age-appropriate information. For NON-EDUCATIONAL adult content: Politely decline with: \"I'm designed to help with educational and career guidance topics. For adult entertainment content, I cannot assist. How can I help with your learning journey instead?\" Always prioritize educational value over entertainment. User: " + message + "\n\nAssistant:"
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4000,
            },
          }),
        });
        providerUsed = "Gemini 3 Flash";
      } catch (error) {
        console.warn("Gemini failed, trying OpenRouter:", error);
        // Fall back to OpenRouter if Gemini fails
      }
    }

    // Fallback to OpenRouter Aurora Alpha with reasoning if Gemini fails
    if (!aiResponse || !aiResponse.ok && openRouterKey) {
      try {
        aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openRouterKey}`,
            "HTTP-Referer": "https://educareer-ai.vercel.app",
          },
          body: JSON.stringify({
            model: "openrouter/aurora-alpha",
            messages: [
              {
                role: "system",
                content: "You are EduCareer AI, an advanced educational assistant. Your role is to help students with educational topics, career guidance, study strategies, learning methods, academic questions, and general knowledge (when educational). IMPORTANT GUIDELINES: Answer questions directly and comprehensively. Be helpful, encouraging, and detailed. Use **bold** for key concepts. Provide examples and practical applications. No emojis. ADULT CONTENT POLICY: For EDUCATIONAL adult content (sex education, reproductive health, adult learning topics): Provide helpful, educational, and age-appropriate information. For NON-EDUCATIONAL adult content: Politely decline with: \"I'm designed to help with educational and career guidance topics. For adult entertainment content, I cannot assist. How can I help with your learning journey instead?\" Always prioritize educational value over entertainment. User: " + message + " Assistant:"
              },
              {
                role: "user",
                content: message
              }
            ],
            reasoning: { enabled: true },
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });
        providerUsed = "OpenRouter Aurora Alpha with Reasoning";
      } catch (error) {
        console.warn("OpenRouter Aurora Alpha also failed:", error);
      }
    }

    if (!aiResponse.ok) {
      const raw = await aiResponse.text().catch(() => "");
      
      return jsonResponse(
        {
          error: `${providerUsed} API request failed`,
          provider: providerUsed,
          status: aiResponse.status,
          details: raw ? raw.slice(0, 2000) : undefined,
        },
        { status: 502 },
      );
    }

    let reply: string;
    
    if (providerUsed === "OpenRouter Aurora Alpha with Reasoning") {
      const data = (await aiResponse.json()) as {
        choices?: Array<{ message?: { content?: string; reasoning_details?: any } }>;
      };
      reply = data?.choices?.[0]?.message?.content?.trim() ?? "";
      
      // Include reasoning details in response for debugging
      if (data?.choices?.[0]?.message?.reasoning_details) {
        console.log("Aurora Alpha Reasoning:", data.choices[0].message.reasoning_details);
      }
    } else if (providerUsed === "OpenRouter Claude 3.5 Sonnet") {
      const data = (await aiResponse.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      reply = data?.choices?.[0]?.message?.content?.trim() ?? "";
    } else {
      const data = (await aiResponse.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    }
    
    if (!reply) {
      return jsonResponse({ error: `${providerUsed} API returned an empty response` }, { status: 502 });
    }

    // Send AI reply back to frontend
    return jsonResponse({ reply }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
