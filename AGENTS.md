# 🤖 BPSCVS / EventLens AI — AI Agent Architecture & Fast-Reference Guide

> **FOR AI AGENTS (Antigravity, Cursor, Claude Code, GitHub Copilot, Gemini):**  
> Read this file **first** before making any edits. It provides the exact layout, file paths, responsibilities, data flow, and optimization rules for this codebase so you can jump directly to the right component without searching or scanning the whole project.

---

## ⚡ 1. Quick Tech Stack Overview

* **Framework:** Next.js 14.2.35 (App Router, React 18, TypeScript 5, TailwindCSS 3)
* **Backend / Database:** Supabase (`@supabase/supabase-js`) with transparent `localStorage` offline fallback
* **AI Engine:** `@vladmandic/face-api` (SSD MobileNet v1 + 68-Point Face Landmark Net + ResNet-34 128-d embeddings running 100% on client device via WebGL / WebAssembly — $0 cloud GPU cost)
* **Auth & Security:** Web Crypto HMAC-SHA256 session cookies (`bpscvs_session`) with role-based edge middleware
* **Image / Download Engine:** Direct `.jpg` file downloader with Web Share API (`navigator.share({ files })`) for native iOS/Android camera roll saving + JSZip archive fallback

---

## 🗺️ 2. Instant Feature-to-File Lookup Table

Use this table to find the exact file for any feature in 1 second:

| Feature / UI Component | Primary Implementation File | Helper / Data Layer |
| :--- | :--- | :--- |
| **Home Page & Hero Showcase** | [`src/app/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/page.tsx) | [`src/data/festivalEvents.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/data/festivalEvents.ts) |
| **AI Face Match Finder (Selfie & Camera)** | [`src/components/utsav/FaceMatchFinder.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/utsav/FaceMatchFinder.tsx) | [`src/lib/faceRecognition.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/faceRecognition.ts) |
| **Face Search Modal (Detailed Scans)** | [`src/components/FaceSearchModal.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/FaceSearchModal.tsx) | [`src/lib/faceRecognition.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/faceRecognition.ts) |
| **Gallery Grid & Batch JPG Downloads** | [`src/components/GalleryGrid.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/GalleryGrid.tsx) | [`src/lib/zipService.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/zipService.ts) |
| **Full Event Lightbox & Photo Viewer** | [`src/components/Lightbox.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/Lightbox.tsx) | [`src/lib/zipService.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/zipService.ts) |
| **Event Gallery Popup Modal** | [`src/components/utsav/EventGalleryModal.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/utsav/EventGalleryModal.tsx) | [`src/lib/zipService.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/zipService.ts) |
| **Festival Timetable & Panchang** | [`src/components/utsav/FestivalPanchangSchedule.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/utsav/FestivalPanchangSchedule.tsx) | [`src/data/festivalEvents.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/data/festivalEvents.ts) |
| **Events Timeline** | [`src/components/utsav/EventsTimeline.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/utsav/EventsTimeline.tsx) | [`src/data/festivalEvents.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/data/festivalEvents.ts) |
| **Events Listing Page** | [`src/app/events/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/events/page.tsx) | [`src/components/EventCard.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/EventCard.tsx) |
| **Single Event Details & RSVP** | [`src/app/event/[id]/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/event/%5Bid%5D/page.tsx) | [`src/lib/db.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/db.ts) |
| **Admin Panel (Events, Panchang, Settings)** | [`src/app/admin/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/admin/page.tsx) | [`src/lib/db.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/db.ts) |
| **Admin Batch Upload Page** | [`src/app/admin/upload/[id]/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/admin/upload/%5Bid%5D/page.tsx) | [`src/components/BulkUploader.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/BulkUploader.tsx) |
| **Photographer Studio Portal** | [`src/app/studio/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/studio/page.tsx) | [`src/components/BulkUploader.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/BulkUploader.tsx) |
| **Bulk Image Uploader & Face Indexer** | [`src/components/BulkUploader.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/BulkUploader.tsx) | [`src/lib/faceRecognition.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/faceRecognition.ts) |
| **Notice Board Printable Poster Modal** | [`src/components/utsav/NoticeBoardPosterModal.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/utsav/NoticeBoardPosterModal.tsx) | [`src/data/festivalEvents.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/data/festivalEvents.ts) |
| **WhatsApp Broadcast Generator** | [`src/components/utsav/WhatsAppBroadcastModal.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/utsav/WhatsAppBroadcastModal.tsx) | [`src/lib/shareUtils.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/shareUtils.ts) |
| **About Hub** | [`src/app/about/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/about/page.tsx) | [`src/data/bpscvsData.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/data/bpscvsData.ts) |
| **Founder Profile Page** | [`src/app/about/founder/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/about/founder/page.tsx) | [`src/data/bpscvsData.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/data/bpscvsData.ts) |
| **Executive Team & Committee** | [`src/app/about/team/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/about/team/page.tsx) | [`src/data/bpscvsData.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/data/bpscvsData.ts) |
| **Login Page & Auth Switcher** | [`src/app/login/page.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/login/page.tsx) | [`src/lib/authContext.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/authContext.tsx) |
| **Route Protection & Permissions** | [`src/middleware.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/middleware.ts) | [`src/lib/serverSession.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/serverSession.ts) |
| **Auth API Endpoints** | [`src/app/api/auth/login/route.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/app/api/auth/login/route.ts) | Rate limiting, timing-safe string comparison, HMAC cookies |

---

## 📂 3. Complete Source Tree Breakdown

```
src/
├── app/                      # Next.js 14 App Router
│   ├── layout.tsx            # Root layout with AuthProvider & metadata
│   ├── page.tsx              # Main Landing / Home Page
│   ├── about/                # Society information portal
│   │   ├── page.tsx          # About Hub
│   │   ├── founder/page.tsx  # Shri Neeraj Dialani Founder Profile
│   │   └── team/page.tsx     # Executive committee & advisors directory
│   ├── admin/                # Samiti Admin Dashboard
│   │   ├── page.tsx          # Admin management (events, RSVP, notices)
│   │   └── upload/[id]/      # Photographer photo upload for event
│   ├── studio/               # Dedicated Photographer Portal (/studio)
│   ├── events/               # Public Festival Events Catalog
│   ├── event/[id]/           # Single event page + gallery + RSVP
│   ├── login/                # Role switcher (Admin vs Photographer)
│   └── api/                  # Edge route handlers (auth, health)
│
├── components/               # Reusable React components
│   ├── BulkUploader.tsx      # Multi-file drag & drop + client face indexing
│   ├── EventCard.tsx         # Event summary card with QR & countdown
│   ├── FaceSearchModal.tsx   # Selfie camera/upload face scan modal
│   ├── GalleryGrid.tsx       # Photo gallery with multi-select & JPG download
│   ├── Lightbox.tsx          # High-resolution full screen photo lightbox
│   ├── QRCodeModal.tsx       # Shareable event QR code generator
│   └── utsav/                # Festive-specific components
│       ├── EventGalleryModal.tsx       # Popup event album modal
│       ├── EventsTimeline.tsx          # Interactive chronological timeline
│       ├── FaceMatchFinder.tsx         # In-page AI face matching widget
│       ├── FestivalPanchangSchedule.tsx# Festive timetable / schedule
│       ├── NoticeBoardPosterModal.tsx  # Printable A4 society notices
│       ├── WhatsAppBroadcastModal.tsx  # 1-tap WhatsApp message generator
│       └── index.ts                    # Clean barrel export of active components
│
├── data/                     # Authoritative Mock & Default Datasets
│   ├── bpscvsData.ts         # Committee members, advisors, emergency contacts
│   └── festivalEvents.ts     # Festival events, schedules, photo albums
│
├── lib/                      # Core Business Logic & Infrastructure
│   ├── authContext.tsx       # Client-side user auth state provider
│   ├── db.ts                 # Unified Supabase DB layer with localStorage fallback
│   ├── faceRecognition.ts    # TensorFlow SSD MobileNet + ResNet face engine
│   ├── sampleData.ts         # Initial event seeds
│   ├── serverSession.ts      # Web Crypto HMAC-SHA256 session token management
│   ├── shareUtils.ts         # Social & WhatsApp share link builders
│   ├── supabase.ts           # Supabase client singleton
│   ├── types.ts              # Core TypeScript interfaces (PhotoItem, EventItem)
│   └── zipService.ts         # Direct .jpg downloader & JSZip packager
│
├── styles/
│   └── globals.css           # Tailwind + Custom Festive CSS classes
├── types/
│   └── utsav.ts              # Festival, FaceScanResult, and RSVP types
└── utils/
    ├── audio.ts              # Web Audio API synthesizer (temple bell & sitar)
    └── dateUtils.ts          # Festival date & countdown formatters
```

---

## 🧠 4. Core System Architectures

### A. AI Face Recognition Pipeline
1. **Model Loading:** [`src/lib/faceRecognition.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/faceRecognition.ts) loads from `/models` (offline/local in `public/models`) with automatic CDN fallback.
2. **Indexing:** When photos are uploaded via [`BulkUploader.tsx`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/components/BulkUploader.tsx), each face descriptor is computed and saved into `photos.faces` in Supabase/localStorage.
3. **Matching:** Resident selfie is processed -> 128-d descriptor -> evaluated with `FACE_MATCH_DISTANCE_THRESHOLD <= 0.46` & `FACE_MATCH_COSINE_THRESHOLD >= 0.89`.
4. **Zero Cloud Cost:** No external paid API is used or needed; runs entirely inside the resident's browser via WebGL.

### B. Mobile-First Photo Downloads
* **Never force ZIP files on mobile users.**
* Always offer **Direct `.JPG` downloads** via [`downloadMultiplePhotosDirectJpg`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/zipService.ts).
* On mobile browsers supporting `navigator.share({ files })`, the app invokes the native share sheet so users can tap **"Save Images"** directly into their iOS/Android photo gallery.
* Stagger sequential downloads by 300ms to prevent browser pop-up blockers.

### C. Data Persistence Strategy
* **Cloud-First:** If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are provided in `.env.local`, all operations persist to Supabase PostgreSQL and Storage.
* **Offline Fallback:** If Supabase is unavailable or offline, [`src/lib/db.ts`](file:///c:/Users/sahill/OneDrive/Desktop/photouploader/src/lib/db.ts) transparently reads/writes to `localStorage` without crashing.

---

## 🛡️ 5. Rules for AI Agents Editing This Codebase

1. **Keep Imports Clean:** Only import from `src/components/utsav` (using barrel exports) or specific library files. Never resurrect deleted files.
2. **Canonical Logo:** The official society emblem is exclusively at `/bpscvs-logo.png`. Do not add duplicate logo files.
3. **Preserve Mobile Responsiveness:**
   * Always verify touch targets are $\ge 40\text{px}$.
   * Use responsive grid classes (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`).
   * When creating action bars, support sticky bottom floating bars on mobile.
4. **Zero Type Errors:** Always verify changes with `npx tsc --noEmit` before concluding.
