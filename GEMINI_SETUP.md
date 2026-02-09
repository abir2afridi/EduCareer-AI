# Gemini API Integration Guide

## Step 1: Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (it starts with `AIza...`)

## Step 2: Add API Key to Supabase
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Scroll down to **Secrets**
4. Add a new secret:
   - **Name**: `EduCareerAi_API_KEY`
   - **Value**: Your Gemini API key from Step 1
5. Click **Save**

## Step 3: Deploy the Edge Function
Run this command in your project root:

```bash
supabase functions deploy ai-chat
```

## Step 4: Verify the Setup
1. Open your app and navigate to the AI workspace
2. Try sending a message like "Hello, how can you help me?"
3. You should receive a response from the AI assistant

## How It Works
- The frontend (`AiChatBox.tsx`) calls your Supabase Edge Function
- The Edge Function (`supabase/functions/ai-chat/index.ts`) uses the Gemini API
- Your API key is stored securely in Supabase secrets (never exposed to the frontend)
- The AI assistant is configured to be educational and student-friendly

## Troubleshooting
- **Error: "Server is missing EduCareerAi_API_KEY secret"** → Make sure you added the secret in Supabase
- **Error: "Gemini API request failed"** → Check that your API key is valid and has quota
- **No response** → Try redeploying the Edge Function

## Current Configuration
- Model: `gemini-2.5-flash` (latest stable model)
- Temperature: 0.4 (balanced creativity)
- Max tokens: 4096
- System prompt: Configured for educational assistance

## Status: ✅ WORKING
Your Gemini API integration is now fully functional! The AI assistant is responding correctly to messages.
