# 🌐 Netlify Deployment Guide for EventLens AI / BPSCVS

Follow this quick step-by-step guide to deploy your Next.js application live on **Netlify** for free.

---

## 📋 Prerequisites
1. A free account on [Netlify](https://www.netlify.com/).
2. A free account & project on [Supabase](https://supabase.com/) (for cloud photo & event storage).
3. A GitHub, GitLab, or Bitbucket account.

---

## 🚀 Method 1: Deploy via GitHub & Netlify Web UI (Recommended)

### Step 1: Push your project to GitHub
If you haven't pushed the project to GitHub yet, run:
```bash
git init
git add .
git commit -m "Deploy to Netlify"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

### Step 2: Import into Netlify
1. Log in to [app.netlify.com](https://app.netlify.com/).
2. Click **"Add new site"** → **"Import an existing project"**.
3. Choose **GitHub** and authorize access to your repository.
4. Select your repository.

### Step 3: Configure Build Settings
Netlify will automatically detect Next.js with our provided `netlify.toml`:
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Functions directory:** (leave default)

### Step 4: Add Environment Variables
Under **Environment variables** (or go to **Site configuration** → **Environment variables**), add:

| Variable Name | Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase Cloud Database URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Public Anon Key |
| `SESSION_SECRET` | *(Optional, random 32+ char string)* | Secure HMAC session cookies |
| `ADMIN_PASSWORD` | *(Optional, e.g. custom password)* | Admin access protection |
| `STUDIO_PASSWORD` | *(Optional, e.g. custom password)* | Photographer Studio access |

### Step 5: Click "Deploy Site"
Netlify will build the project and assign a free live URL (e.g., `https://your-site.netlify.app`).

---

## ⚡ Method 2: Instant Deploy via Netlify CLI

If you prefer deploying directly from your terminal:

1. Install the Netlify CLI globally:
   ```bash
   npm install -g netlify-cli
   ```

2. Log in to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and link the site:
   ```bash
   netlify init
   ```

4. Deploy to production:
   ```bash
   netlify deploy --prod
   ```

---

## 🛠️ Key Technical Notes for Netlify

1. **Face Recognition Models:**
   - The face-api model weights are stored in `/public/models/`.
   - `next.config.mjs` includes long-term caching (`Cache-Control: public, max-age=31536000, immutable`) and proper CSP headers (`unsafe-eval` for WASM/WebGL face detection).
2. **Next.js App Router Support:**
   - Netlify natively supports Next.js 14 App Router, Server Actions, and Route Handlers via `@netlify/plugin-nextjs`.
