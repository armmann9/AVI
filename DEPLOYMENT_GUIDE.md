# 🚀 EventLens AI — Live Production Deployment Guide

This guide walks you through deploying your Event Photo Distribution & AI Face Search platform **live on the internet for $0/month** in under 5 minutes.

---

## 🏗️ Architecture Overview

- **Web Application & Global CDN**: Hosted on **Vercel** (Free Tier)
- **Cloud Database & Cloud Storage**: Hosted on **Supabase** (Free Tier)
- **AI Face Recognition**: Runs on **Client WebGL/TensorFlow** ($0 Server Costs)

---

## ⚡ Step 1: Create Free Supabase Cloud Backend (2 Mins)

1. Go to **[supabase.com](https://supabase.com)** and sign in / sign up (Free).
2. Click **"New Project"**, enter a name (e.g., `eventlens-cloud`) and a database password.
3. Once the project is created, open the **SQL Editor** on the left menu.
4. Click **"New Query"**, copy and paste the entire contents of `supabase-schema.sql` (found in the root of this project), and click **Run**.
   - *This creates your `events` table, `photos` table, and public storage bucket `event-photos` automatically.*
5. Go to **Project Settings** (gear icon) → **API**.
6. Copy:
   - **Project URL** (e.g. `https://xyzabcde.supabase.co`)
   - **anon / public key** (e.g. `eyJhbGciOi...`)

---

## 🌐 Step 2: Deploy to Vercel (2 Mins)

### Option A: Using Vercel Dashboard (Recommended)
1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial EventLens AI Platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/photouploader.git
   git push -u origin main
   ```
2. Open **[vercel.com](https://vercel.com)** and click **"Add New Project"**.
3. Import your `photouploader` GitHub repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Your Supabase Project URL from Step 1)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Your Supabase Anon Key from Step 1)
5. Click **"Deploy"**!

🎉 Your website is now **100% LIVE** at `https://photouploader.vercel.app` (or your custom domain)!

---

## 📱 Step 3: How to Use at Real-Life Events

1. **Before the Event / After Shooting**:
   - Go to `/admin` on your live website.
   - Click **"New Event"** (e.g., "Rohit & Ananya Wedding 2026").
   - Click **"Bulk Upload"** and drag & drop **200+ raw high-res photos**.
   - The AI will automatically index face feature embeddings into the cloud.

2. **At the Event Venue**:
   - Click **"Event QR Code"** in the admin dashboard.
   - Print or display the QR code on table stands, reception desks, or badges.

3. **For Guests & Attendees**:
   - Guests scan the QR code with their mobile phone camera.
   - They click **"⚡ Find My Photos"** and take a 1-second selfie.
   - The AI instantly presents all photos they appear in.
   - Guests can download single photos or **"Download All as ZIP"** in high resolution with zero WhatsApp quality loss.

---

## 💰 Scaling & Monthly Costs

| Volume | Cost | Provider |
|---|---|---|
| **0 – 15 Events / Month** | **$0 / month** | Vercel Hobby + Supabase Free |
| **15 – 50 Events / Month** | **~$1.50 – $10 / month** | Cloudflare R2 / Supabase Storage |
| **50+ Events / Month** | **~$25 / month** | Supabase Pro |

---

## 🛠️ Testing Locally Before Deploying

To test on your computer right now:
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.
