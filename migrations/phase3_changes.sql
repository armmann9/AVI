-- ============================================================================
-- BPSCVS / EventLens AI — Phase 3 Database Migration Script
-- File: migrations/phase3_changes.sql
-- Description:
--   1. Creates missing tables: rsvps, event_analytics, committee_members, emergency_contacts
--   2. Adds performance indexes for fast query resolution
--   3. Hardens security definer function increment_event_photo_count
--   4. Configures hardened Row Level Security (RLS) policies
--
-- Note: Reversible. Run the "DOWN / REVERSE MIGRATION" section at the bottom to undo.
-- ============================================================================


-- ============================================================================
-- UP MIGRATION (APPLY CHANGES)
-- ============================================================================

-- 1. Ensure Core Tables Exist
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
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

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

-- 2. Create Missing Tables

-- 2a. RSVPs (Attendance, headcounts, dietary choices)
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

-- 2b. Event Analytics (Page views, downloads, face searches)
CREATE TABLE IF NOT EXISTS public.event_analytics (
  event_id        TEXT PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  page_views      INT DEFAULT 0,
  ai_searches     INT DEFAULT 0,
  photo_downloads INT DEFAULT 0,
  qr_scans        INT DEFAULT 0,
  last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- 2c. Committee Members (Executive leadership and wings)
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

-- 2d. Emergency Contacts (Helpline & security contacts)
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

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_photos_event_id    ON public.photos (event_id);
CREATE INDEX IF NOT EXISTS idx_photos_tags        ON public.photos USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_photos_faces       ON public.photos USING GIN (faces jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_events_slug        ON public.events (slug);
CREATE INDEX IF NOT EXISTS idx_events_status      ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id     ON public.rsvps (event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_bungalow     ON public.rsvps (bungalow_plot);
CREATE INDEX IF NOT EXISTS idx_committee_wing     ON public.committee_members (wing);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts ON public.emergency_contacts (display_order);

-- 4. Hardened Helper Function
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

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Clean up any prior legacy open policies
DROP POLICY IF EXISTS "Allow public read on events"    ON public.events;
DROP POLICY IF EXISTS "Allow public insert on events"  ON public.events;
DROP POLICY IF EXISTS "Allow public update on events"  ON public.events;
DROP POLICY IF EXISTS "Allow public read on photos"    ON public.photos;
DROP POLICY IF EXISTS "Allow public insert on photos"  ON public.photos;
DROP POLICY IF EXISTS "Allow public update on photos"  ON public.photos;

DROP POLICY IF EXISTS "events_public_select"           ON public.events;
DROP POLICY IF EXISTS "events_admin_insert"            ON public.events;
DROP POLICY IF EXISTS "events_admin_update"            ON public.events;
DROP POLICY IF EXISTS "events_admin_delete"            ON public.events;

DROP POLICY IF EXISTS "photos_public_select"           ON public.photos;
DROP POLICY IF EXISTS "photos_admin_insert"            ON public.photos;
DROP POLICY IF EXISTS "photos_admin_update"            ON public.photos;
DROP POLICY IF EXISTS "photos_admin_delete"            ON public.photos;

DROP POLICY IF EXISTS "rsvps_public_insert"            ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_admin_select"             ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_admin_delete"             ON public.rsvps;

DROP POLICY IF EXISTS "analytics_public_select"        ON public.event_analytics;
DROP POLICY IF EXISTS "analytics_public_insert"        ON public.event_analytics;
DROP POLICY IF EXISTS "analytics_public_update"        ON public.event_analytics;

DROP POLICY IF EXISTS "committee_public_select"        ON public.committee_members;
DROP POLICY IF EXISTS "committee_admin_insert"         ON public.committee_members;
DROP POLICY IF EXISTS "committee_admin_update"         ON public.committee_members;
DROP POLICY IF EXISTS "committee_admin_delete"         ON public.committee_members;

DROP POLICY IF EXISTS "emergency_public_select"        ON public.emergency_contacts;
DROP POLICY IF EXISTS "emergency_admin_insert"         ON public.emergency_contacts;
DROP POLICY IF EXISTS "emergency_admin_update"         ON public.emergency_contacts;
DROP POLICY IF EXISTS "emergency_admin_delete"         ON public.emergency_contacts;

-- Apply hardened policies
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

CREATE POLICY "rsvps_public_insert"
  ON public.rsvps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "rsvps_admin_select"
  ON public.rsvps FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "rsvps_admin_delete"
  ON public.rsvps FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "analytics_public_select"
  ON public.event_analytics FOR SELECT
  USING (true);

CREATE POLICY "analytics_public_insert"
  ON public.event_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "analytics_public_update"
  ON public.event_analytics FOR UPDATE
  USING (true);

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

-- 6. Storage Bucket & Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access for Event Photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads to Event Photos"  ON storage.objects;
DROP POLICY IF EXISTS "storage_event_photos_select"    ON storage.objects;
DROP POLICY IF EXISTS "storage_event_photos_insert"    ON storage.objects;
DROP POLICY IF EXISTS "storage_event_photos_delete"    ON storage.objects;

CREATE POLICY "storage_event_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos');

CREATE POLICY "storage_event_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

CREATE POLICY "storage_event_photos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-photos' AND auth.role() = 'authenticated');


-- ============================================================================
-- DOWN / REVERSE MIGRATION (ROLLBACK SCRIPT)
-- Run this section in Supabase SQL editor if you need to rollback Phase 3.
-- ============================================================================
/*
-- 1. Drop Storage Policies
DROP POLICY IF EXISTS "storage_event_photos_delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_event_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_event_photos_select" ON storage.objects;

-- 2. Drop Table RLS Policies
DROP POLICY IF EXISTS "emergency_admin_delete"  ON public.emergency_contacts;
DROP POLICY IF EXISTS "emergency_admin_update"  ON public.emergency_contacts;
DROP POLICY IF EXISTS "emergency_admin_insert"  ON public.emergency_contacts;
DROP POLICY IF EXISTS "emergency_public_select" ON public.emergency_contacts;

DROP POLICY IF EXISTS "committee_admin_delete"  ON public.committee_members;
DROP POLICY IF EXISTS "committee_admin_update"  ON public.committee_members;
DROP POLICY IF EXISTS "committee_admin_insert"  ON public.committee_members;
DROP POLICY IF EXISTS "committee_public_select" ON public.committee_members;

DROP POLICY IF EXISTS "analytics_public_update" ON public.event_analytics;
DROP POLICY IF EXISTS "analytics_public_insert" ON public.event_analytics;
DROP POLICY IF EXISTS "analytics_public_select" ON public.event_analytics;

DROP POLICY IF EXISTS "rsvps_admin_delete"      ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_admin_select"      ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_public_insert"     ON public.rsvps;

DROP POLICY IF EXISTS "photos_admin_delete"     ON public.photos;
DROP POLICY IF EXISTS "photos_admin_update"     ON public.photos;
DROP POLICY IF EXISTS "photos_admin_insert"     ON public.photos;
DROP POLICY IF EXISTS "photos_public_select"    ON public.photos;

DROP POLICY IF EXISTS "events_admin_delete"     ON public.events;
DROP POLICY IF EXISTS "events_admin_update"     ON public.events;
DROP POLICY IF EXISTS "events_admin_insert"     ON public.events;
DROP POLICY IF EXISTS "events_public_select"    ON public.events;

-- 3. Drop Indexes
DROP INDEX IF EXISTS public.idx_emergency_contacts;
DROP INDEX IF EXISTS public.idx_committee_wing;
DROP INDEX IF EXISTS public.idx_rsvps_bungalow;
DROP INDEX IF EXISTS public.idx_rsvps_event_id;
DROP INDEX IF EXISTS public.idx_events_status;
DROP INDEX IF EXISTS public.idx_events_slug;
DROP INDEX IF EXISTS public.idx_photos_faces;
DROP INDEX IF EXISTS public.idx_photos_tags;
DROP INDEX IF EXISTS public.idx_photos_event_id;

-- 4. Drop Newly Created Tables
DROP TABLE IF EXISTS public.emergency_contacts;
DROP TABLE IF EXISTS public.committee_members;
DROP TABLE IF EXISTS public.event_analytics;
DROP TABLE IF EXISTS public.rsvps;

-- 5. Restore Original Permissive Helper Function & Policies on core tables
CREATE OR REPLACE FUNCTION public.increment_event_photo_count(event_id_input TEXT, count_add INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.events
  SET photo_count = COALESCE(photo_count, 0) + count_add
  WHERE id = event_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Allow public read on events"   ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public insert on events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on events" ON public.events FOR UPDATE USING (true);

CREATE POLICY "Allow public read on photos"   ON public.photos FOR SELECT USING (true);
CREATE POLICY "Allow public insert on photos" ON public.photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on photos" ON public.photos FOR UPDATE USING (true);
*/
