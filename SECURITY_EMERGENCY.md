# 🚨 SECURITY EMERGENCY: API Key Exposure Fix

## IMMEDIATE ACTIONS REQUIRED:

### 1. Rotate All Exposed Keys RIGHT NOW

#### Firebase Keys:
- Go to: https://console.firebase.google.com/project/educareer-ai/settings/general
- Click "Web API Key" → Regenerate
- Update all references with new key

#### Supabase Keys:
- Go to: https://zofkiodjguseuronzhkt.supabase.co/project/settings/api
- Regenerate anon key and service role key
- Update Supabase secrets for edge functions

#### Vercel Deployment:
- Revoke OIDC token in Vercel dashboard
- Generate new deployment token

### 2. Remove Exposed Files

```bash
# Delete backup file with exposed keys
rm .env.local.backup

# Remove from git history if already committed
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env.local.backup' --prune-empty --tag-name-filter cat -- --all
```

### 3. Secure Firebase Configuration

Replace firebase.js with environment-based config:

```javascript
// firebase.js - SECURE VERSION
import { getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Add validation
if (!firebaseConfig.apiKey) {
  throw new Error("Missing Firebase configuration. Check your environment variables.");
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
```

### 4. Update Environment Files

#### .env.example (Add Firebase vars):
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### .env.local (NEVER commit):
```env
# Add your new keys here
VITE_FIREBASE_API_KEY=AIzaSyNEW_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=educareer-ai.firebaseapp.com
# ... rest of Firebase config
VITE_SUPABASE_URL=https://zofkiodjguseuronzhkt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Update TypeScript Types

Create src/types/env.d.ts:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### 6. Production Deployment

#### Vercel Environment Variables:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all VITE_ variables
3. Mark as sensitive (🔒)
4. Redeploy

#### Supabase Edge Functions:
```bash
# Set OpenRouter API key as secret
supabase secrets set OPENROUTER_API_KEY=your_new_openrouter_key
```

### 7. Git History Cleanup

```bash
# Remove sensitive data from git history
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch firebase.js' \
--prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

### 8. Security Best Practices

#### .gitignore Updates:
```
# Add these lines
.env*.backup
.env*.local
firebase.js.backup
*keys.json
```

#### Pre-commit Hook:
```bash
# .husky/pre-commit
#!/bin/sh
# Check for API keys before commit
if git diff --cached --name-only | xargs grep -l "AIzaSy\|sk-or-\|eyJhbGciOiJI"; then
  echo "❌ API keys detected in staged files!"
  exit 1
fi
```

### 9. Monitoring

Set up GitHub Secret Scanning:
1. Go to Repository Settings → Security → Secret scanning
2. Enable alerts
3. Review any detected secrets

### 10. Validation

Test locally:
```bash
# Remove all .env files
rm .env*

# Start with example
cp .env.example .env.local

# Add your new keys
# Test application
npm run dev
```

## ⚠️ URGENT TIMELINE

- **IMMEDIATE**: Rotate all exposed keys (0-1 hour)
- **TODAY**: Update code and environment files
- **TOMORROW**: Clean git history and redeploy
- **THIS WEEK**: Set up monitoring and prevention

## 🆘 HELP NEEDED?

If you need assistance:
1. Contact Firebase/Supabase support for key rotation
2. Use GitHub support for history cleanup
3. Consider security audit if data was exposed

## 📞 EMERGENCY CONTACTS

- Firebase Support: https://firebase.google.com/support
- Supabase Support: https://supabase.com/support
- GitHub Security: https://github.com/security

---

**⚠️ THIS IS A CRITICAL SECURITY INCIDENT - ACT IMMEDIATELY**
