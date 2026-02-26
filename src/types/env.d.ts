/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite development variables (with VITE_ prefix)
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  
  // Vercel production variables (without VITE_ prefix)
  readonly FIREBASE_API_KEY?: string
  readonly FIREBASE_AUTH_DOMAIN?: string
  readonly FIREBASE_PROJECT_ID?: string
  readonly FIREBASE_STORAGE_BUCKET?: string
  readonly FIREBASE_MESSAGING_SENDER_ID?: string
  readonly FIREBASE_APP_ID?: string
  readonly FIREBASE_MEASUREMENT_ID?: string
  
  // Next.js alternatives
  readonly NEXT_PUBLIC_SUPABASE_URL?: string
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
