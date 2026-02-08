// @ts-ignore - Remote imports are resolved by Deno when deploying Supabase Edge Functions.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message;
    const image = body?.image;
    const rawHistory = body?.conversationHistory ?? body?.history ?? [];
    
    if (!message) {
      throw new Error("Message is required");
    }

    console.log('Received message:', message);
    console.log('History length:', Array.isArray(rawHistory) ? rawHistory.length : 0);

    const denoEnv = (globalThis as { Deno?: { env: { get: (key: string) => string | undefined } } }).Deno?.env;
    const LOVABLE_API_KEY =
      denoEnv?.get("LOVABLE_API_KEY") ??
      (typeof process !== "undefined" ? process.env?.LOVABLE_API_KEY : undefined);
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build messages array with system prompt and conversation history
    const systemMessage = {
      role: "system",
      content:
        "You are a helpful AI study assistant. Help students with their questions about various subjects, provide explanations, study tips, and educational guidance. Be encouraging and supportive.",
    };

    const normalizedHistory = Array.isArray(rawHistory)
      ? rawHistory
          .map((msg: unknown) => {
            if (!msg || typeof msg !== "object") return null;
            const record = msg as Record<string, unknown>;
            const role = typeof record.role === "string" ? record.role : "user";
            const content = typeof record.content === "string" ? record.content : "";
            const historyImage = typeof record.image === "string" ? record.image : null;

            if (!content && !historyImage) return null;

            if (historyImage) {
              return {
                role,
                content: [{ type: "text", text: content || "Please analyze this image" }, { type: "image_url", image_url: { url: historyImage } }],
              };
            }

            return { role, content };
          })
          .filter(Boolean)
      : [];

    // Build user message with optional image
    const userMessage: any = image 
      ? {
          role: "user",
          content: [
            { type: "text", text: message },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      : { role: "user", content: message };

    const messages = [systemMessage, ...normalizedHistory, userMessage];

    console.log('Calling Lovable AI Gateway...');
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI Gateway error");
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.";

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiText, reply: aiText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
