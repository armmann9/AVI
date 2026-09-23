# BPSCVS Project Architectural & Design Rules (Persistent Memory)

This document represents persistent institutional memory for all development on the BPSCVS (Bani Park Sindhi Colony Vikas Samiti) platform.

## 1. Non-Negotiable Visual & Theme Guidelines
- **Canonical Theme: Deepotsav Dark Emerald (`#021812`)**
  - All public, admin, studio, and upload pages MUST use the dark Deepotsav theme.
  - Background: `#021812` (deepest temple emerald night)
  - Card/Panels: `rgba(6, 44, 34, 0.7)` to `rgba(6, 44, 34, 0.95)` with backdrop blur.
  - Borders: `rgba(245, 158, 11, 0.25)` to `rgba(245, 158, 11, 0.4)` (gold filigree).
  - Accents: Golden marigold (`#F59E0B`, `#FBBF24`, `#D97706`).
  - Primary Text: Amber-50 (`#FFFBEB`, `#FEF3C7`), Heading text: Gold (`#FDE68A`).
  - Secondary Text: Emerald-200/300 (`#A7F3D0`, `#6EE7B7`).
  - **NEVER** let any page or component default to white, off-white (`#FBF7EE`), or light gray.

## 2. Event Synchronization Rules
- **No Siloed Static Events:**
  - The main page (`/`), public galleries (`/event/[id]`), admin panel (`/admin`), and studio (`/studio`) must share synchronized event data.
  - Any event added or modified in `/admin` MUST immediately appear on `/` and `/studio`.
  - The unified data layer in `src/lib/db.ts` provides single-source-of-truth access backed by Supabase and LocalStorage fallback with in-memory caching and cross-tab event broadcasting (`bpscvs_events_updated`).

## 3. Server-Side Rendering (SSR) & Module Isolation
- Third-party packages that use browser-only globals (such as canvas, face-api, confetti) must be loaded dynamically using `next/dynamic` with `{ ssr: false }` or guarded inside `typeof window !== 'undefined'` checks.
- Prevent broken vendor-chunk crashes during Next.js builds.

## 4. Documentation Standards
- Every feature flow, API detail, database table schema, and connection pattern must be documented comprehensively in `SYSTEM_ARCHITECTURE_AND_CODE_GUIDE.md`.
