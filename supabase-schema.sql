-- ==========================================================
-- BPSCVS / EventLens AI — Supabase Production Schema
-- Run each section in the Supabase SQL Editor.
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- ==========================================================


-- ──────────────────────────────────────────────────────────
-- SECTION 1 — CORE TABLES
-- ──────────────────────────────────────────────────────────

-- 1a. Events
CREATE TABLE IF NOT EXISTS public.events (
  id                  TEXT PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  date                TEXT NOT NULL,
  time                TEXT DEFAULT '10:00 AM',
  location            TEXT,
  cover_image         TEXT,
  category            TEXT DEFAULT 'Other',
  status              TEXT DEFAULT 'upcoming',
  map_url             TEXT,
  registration_open   BOOLEAN DEFAULT true,
  photo_count         INT DEFAULT 0,
  pin_code            TEXT,
  is_public           BOOLEAN DEFAULT true,
  photographer_name   TEXT,
  photographer_contact TEXT,
  drive_url           TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Photos (with 128-d face descriptor embeddings)
CREATE TABLE IF NOT EXISTS public.photos (
  id            TEXT PRIMARY KEY,
  event_id      TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  title         TEXT,
  width         INT,
  height        INT,
  size_bytes    BIGINT,
  tags          TEXT[]  DEFAULT '{}',
  faces         JSONB   DEFAULT '[]',
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 1c. RSVPs  (matches EventRsvpRecord interface in src/types/utsav.ts)
CREATE TABLE IF NOT EXISTS public.rsvps (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id          TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  resident_name     TEXT NOT NULL,
  bungalow_plot     TEXT NOT NULL,
  phone             TEXT,
  adults_count      INT NOT NULL DEFAULT 1,
  kids_count        INT NOT NULL DEFAULT 0,
  diet_preference   TEXT NOT NULL DEFAULT 'regular',
  is_attending      BOOLEAN NOT NULL DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Event Analytics  (matches AnalyticsData interface in src/lib/analytics.ts)
CREATE TABLE IF NOT EXISTS public.event_analytics (
  event_id        TEXT PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  page_views      INT DEFAULT 0,
  ai_searches     INT DEFAULT 0,
  photo_downloads INT DEFAULT 0,
  qr_scans        INT DEFAULT 0,
  last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- 1e. Committee Members (matches CommitteeMember interface in src/types/utsav.ts)
CREATE TABLE IF NOT EXISTS public.committee_members (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  hindi_name        TEXT,
  designation       TEXT NOT NULL,
  hindi_designation TEXT,
  role_type         TEXT,
  wing              TEXT NOT NULL DEFAULT 'executive',
  phone             TEXT,
  plot_no           TEXT,
  avatar            TEXT,
  short_intro       TEXT,
  hindi_short_intro TEXT,
  tenure            TEXT,
  display_order     INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 1f. Emergency Contacts (matches EmergencyContact interface in src/types/utsav.ts)
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  hindi_title   TEXT,
  role          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  availability  TEXT DEFAULT '24x7',
  icon_type     TEXT DEFAULT 'shield',
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ──────────────────────────────────────────────────────────
-- SECTION 2 — PERFORMANCE INDEXES
-- ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_photos_event_id    ON public.photos (event_id);
CREATE INDEX IF NOT EXISTS idx_photos_tags        ON public.photos USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_photos_faces       ON public.photos USING GIN (faces jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_events_slug        ON public.events (slug);
CREATE INDEX IF NOT EXISTS idx_events_status      ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id     ON public.rsvps (event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_bungalow     ON public.rsvps (bungalow_plot);
CREATE INDEX IF NOT EXISTS idx_committee_wing     ON public.committee_members (wing);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts ON public.emergency_contacts (display_order);


-- ──────────────────────────────────────────────────────────
-- SECTION 3 — HELPER FUNCTIONS
-- ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_event_photo_count(
  event_id_input TEXT,
  count_add      INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.events
  SET photo_count = COALESCE(photo_count, 0) + count_add
  WHERE id = event_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ──────────────────────────────────────────────────────────
-- SECTION 4 — ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts  ENABLE ROW LEVEL SECURITY;

-- Drop old over-permissive policies
DROP POLICY IF EXISTS "Allow public read on events"    ON public.events;
DROP POLICY IF EXISTS "Allow public insert on events"  ON public.events;
DROP POLICY IF EXISTS "Allow public update on events"  ON public.events;
DROP POLICY IF EXISTS "Allow public read on photos"    ON public.photos;
DROP POLICY IF EXISTS "Allow public insert on photos"  ON public.photos;
DROP POLICY IF EXISTS "Allow public update on photos"  ON public.photos;

-- ── events ──────────────────────────────────────────────
CREATE POLICY "events_public_select"
  ON public.events FOR SELECT
  USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "events_admin_insert"
  ON public.events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "events_admin_update"
  ON public.events FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "events_admin_delete"
  ON public.events FOR DELETE
  USING (auth.role() = 'authenticated');

-- ── photos ──────────────────────────────────────────────
CREATE POLICY "photos_public_select"
  ON public.photos FOR SELECT
  USING (true);

CREATE POLICY "photos_admin_insert"
  ON public.photos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "photos_admin_update"
  ON public.photos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "photos_admin_delete"
  ON public.photos FOR DELETE
  USING (auth.role() = 'authenticated');

-- ── rsvps ───────────────────────────────────────────────
CREATE POLICY "rsvps_public_insert"
  ON public.rsvps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "rsvps_admin_select"
  ON public.rsvps FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "rsvps_admin_delete"
  ON public.rsvps FOR DELETE
  USING (auth.role() = 'authenticated');

-- ── event_analytics ─────────────────────────────────────
CREATE POLICY "analytics_public_select"
  ON public.event_analytics FOR SELECT
  USING (true);

CREATE POLICY "analytics_public_insert"
  ON public.event_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "analytics_public_update"
  ON public.event_analytics FOR UPDATE
  USING (true);

-- ── committee_members ───────────────────────────────────
CREATE POLICY "committee_public_select"
  ON public.committee_members FOR SELECT
  USING (true);

CREATE POLICY "committee_admin_insert"
  ON public.committee_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "committee_admin_update"
  ON public.committee_members FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "committee_admin_delete"
  ON public.committee_members FOR DELETE
  USING (auth.role() = 'authenticated');

-- ── emergency_contacts ──────────────────────────────────
CREATE POLICY "emergency_public_select"
  ON public.emergency_contacts FOR SELECT
  USING (true);

CREATE POLICY "emergency_admin_insert"
  ON public.emergency_contacts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_admin_update"
  ON public.emergency_contacts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "emergency_admin_delete"
  ON public.emergency_contacts FOR DELETE
  USING (auth.role() = 'authenticated');


-- ──────────────────────────────────────────────────────────
-- SECTION 5 — SUPABASE STORAGE BUCKET
-- ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access for Event Photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads to Event Photos"  ON storage.objects;

CREATE POLICY "storage_event_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos');

CREATE POLICY "storage_event_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

CREATE POLICY "storage_event_photos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

-- Safe upgrade migration for existing databases:
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS drive_url TEXT;

