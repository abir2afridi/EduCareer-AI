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

    // Get API key from Supabase Secret (do not expose it to the frontend)
    const apiKey = getEnv("EduCareerAi_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        {
          error: "Server is missing EduCareerAi_API_KEY secret. Add it in Supabase and redeploy.",
        },
        { status: 500 },
      );
    }

    // Call Gemini API
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are EduCareer AI, an advanced educational assistant. Help with educational topics, career guidance, study strategies, and learning techniques. For non-educational content, politely redirect: "I specialize in education and career guidance. How can I help with your learning journey?"

Give **comprehensive** and **detailed** answers. Be thorough and insightful. Use **bold** for key concepts. Provide examples, context, and practical applications. Explain concepts clearly with depth. Be helpful and encouraging. No emojis.

User: ${message}

Assistant:`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!aiResponse.ok) {
      const raw = await aiResponse.text().catch(() => "");
      
      return jsonResponse(
        {
          error: "Gemini API request failed",
          status: aiResponse.status,
          details: raw ? raw.slice(0, 2000) : undefined,
        },
        { status: 502 },
      );
    }

    const data = (await aiResponse.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) {
      return jsonResponse({ error: "Gemini API returned an empty response" }, { status: 502 });
    }

    // Send AI reply back to frontend
    return jsonResponse({ reply }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
