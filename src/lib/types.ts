/**
 * ============================================================================
 * EventLens AI — Core TypeScript Type Definitions
 * ============================================================================
 *
 * This file defines all the shared data models used throughout the EventLens
 * platform. Every component, API route, and utility function references these
 * types to ensure end-to-end type safety from the database layer to the UI.
 *
 * DATA FLOW OVERVIEW:
 *   Supabase Cloud DB  ──►  db.ts (queries)  ──►  Types below  ──►  React Components
 *   LocalStorage cache  ──►  db.ts (fallback) ──►  Types below  ──►  React Components
 *
 * CONNECTIONS:
 *   - Used by: db.ts, supabase.ts, faceRecognition.ts, zipDownload.ts
 *   - Used by all components: EventCard, GalleryGrid, FaceSearchModal, BulkUploader, Lightbox, QRCodeModal
 *   - Used by all pages: /, /event/[id], /admin, /admin/upload/[id]
 * ============================================================================
 */

/**
 * EventItem represents a single community event gallery (e.g. cultural festival, annual gathering, national celebration).
 *
 * LIFECYCLE:
 *   1. Created by samiti admin via the Admin Dashboard (/admin)
 *   2. Stored in Supabase `events` table (or localStorage fallback)
 *   3. Displayed as cards on the landing page and admin dashboard
 *   4. Each event has its own public gallery page at /event/{slug}
 *
 * CONNECTIONS:
 *   - Created by: admin/page.tsx → createEvent() in db.ts
 *   - Queried by: page.tsx (home) → getAllEvents() in db.ts
 *   - Viewed at: event/[id]/page.tsx → getEventById() in db.ts
 *   - Photos linked via: PhotoItem.eventId → EventItem.id
 */
export interface EventItem {
  /** Unique identifier (e.g. "evt-1726123456789-a3bc7"). Auto-generated on creation. */
  id: string;

  /** URL-friendly slug for clean shareable links (e.g. "sindhi-cultural-evening").
   *  Used in the public gallery route: /event/{slug} */
  slug: string;

  /** Display title shown on cards, gallery headers, and QR codes (e.g. "Sindhi Cultural Evening") */
  title: string;

  /** Optional longer description shown below the title on the gallery page */
  description?: string;

  /** Event date in ISO format (e.g. "2026-08-24"). Used for sorting and display formatting. */
  date: string;

  /** Event start time (e.g. "18:30" or "6:30 PM") */
  time?: string;

  /** Venue / location text (e.g. "Community Hall, Bani Park") */
  location: string;

  /** URL to cover banner image displayed on event cards and gallery hero section.
   *  Can be a Supabase CDN URL or any public image URL. */
  coverImage: string;

  /** Event category for filtering and badge display */
  category: 'Community' | 'Cultural' | 'Festival' | 'National' | 'Spiritual' | 'Youth' | string;

  /** Event status: upcoming or completed */
  status?: 'upcoming' | 'completed';

  /** Optional Google Maps venue URL */
  mapUrl?: string;

  /** Whether guest registration / RSVP is open */
  registrationOpen?: boolean;

  /** Total number of photos uploaded to this event. Updated on each bulk upload batch. */
  photoCount: number;

  /** Optional 4-digit security PIN to restrict gallery access to authorized guests only.
   *  When set, guests must enter the PIN before viewing photos or using AI face search. */
  pinCode?: string;

  /** Whether the event gallery is publicly accessible or requires PIN authentication */
  isPublic: boolean;

  /** ISO timestamp of when this event was created */
  createdAt: string;

  /** Name of the photographer / studio who captured the event */
  photographerName?: string;

  /** Contact info for the photographer (phone, email, or website) */
  photographerContact?: string;

  /** Optional Google Drive folder / album URL for full high-res uncompressed photo archives */
  driveUrl?: string;
}

/**
 * PhotoItem represents a single high-resolution photo within an event gallery.
 *
 * LIFECYCLE:
 *   1. Uploaded by photographer via BulkUploader component (/admin/upload/[id])
 *   2. File sent to Supabase Storage CDN bucket "event-photos" (or kept as local blob URL)
 *   3. AI face-api.js neural net extracts face bounding boxes + 128-d descriptor vectors
 *   4. Photo metadata + face embeddings saved to Supabase `photos` table (or localStorage)
 *   5. Displayed in GalleryGrid on the guest event page (/event/[id])
 *   6. Face descriptors matched against guest selfies in FaceSearchModal
 *
 * CONNECTIONS:
 *   - Created by: BulkUploader.tsx → savePhotos() in db.ts
 *   - Face vectors extracted by: faceRecognition.ts → detectFacesAndExtractEmbeddings()
 *   - Queried by: event/[id]/page.tsx → getPhotosByEventId() in db.ts
 *   - Downloaded by: zipDownload.ts → downloadPhotosAsZip() / downloadSinglePhoto()
 *   - Matched by: FaceSearchModal.tsx → calculateCosineSimilarity() in faceRecognition.ts
 */
export interface PhotoItem {
  /** Unique photo identifier (e.g. "photo-1726123456789-x7f2k") */
  id: string;

  /** Foreign key linking this photo to its parent event (EventItem.id) */
  eventId: string;

  /** Full high-resolution original photo URL (Supabase CDN or local blob URL).
   *  This is the URL used for downloads — never compressed or quality-reduced. */
  url: string;

  /** Optimized lower-resolution preview URL for fast gallery grid loading.
   *  Typically the same CDN URL with smaller dimensions, or a generated thumbnail. */
  thumbnailUrl: string;

  /** Optional display title (derived from original filename or set by photographer) */
  title?: string;

  /** Original image width in pixels */
  width?: number;

  /** Original image height in pixels */
  height?: number;

  /** File size in bytes (used for upload progress calculations and size display) */
  sizeBytes?: number;

  /** ISO timestamp of when this photo was uploaded */
  uploadedAt: string;

  /** Category tags for filtering (e.g. ["Ceremony", "Bride", "Group"]) */
  tags?: string[];

  /**
   * AI-extracted face recognition data for this photo.
   * Each entry represents one detected face in the image.
   *
   * FACE DESCRIPTOR PIPELINE:
   *   1. SSD-MobileNet v1 detects face bounding boxes (x, y, width, height)
   *   2. 68-point Facial Landmark detector maps key facial geometry points
   *   3. Face Recognition Net generates a 128-dimensional Float32 feature vector
   *   4. This vector is compared with guest selfie vectors using Cosine Similarity
   *
   * A biometric Euclidean distance <= 0.55 (Cosine similarity >= 0.85) is considered a face match.
   */
  faces?: {
    /** Bounding box coordinates of the detected face within the image (in pixels) */
    box: { x: number; y: number; width: number; height: number };
    /** 128-dimensional normalized Float32 facial feature vector.
     *  Encodes unique facial geometry (eye spacing, jaw shape, nose bridge, etc.) */
    descriptor: number[];
    /** Detection confidence score from SSD-MobileNet (0.0 to 1.0) */
    confidence: number;
  }[];
}

/**
 * FaceMatchResult represents the output of the AI face matching pipeline.
 * One result per photo that contains a face matching the guest's selfie.
 *
 * WORKFLOW:
 *   1. Guest uploads selfie → extractSelfieDescriptor() returns 128-d vector
 *   2. For each event photo, evaluateFaceMatch(selfie, photo.face) is computed
 *   3. Photos with distance <= 0.55 (similarity >= 0.85) are collected as FaceMatchResult[]
 *   4. Results are sorted by descending similarity and displayed in GalleryGrid
 *
 * CONNECTIONS:
 *   - Produced by: FaceSearchModal.tsx → runFaceSearch()
 *   - Consumed by: event/[id]/page.tsx → passed to GalleryGrid as matchedResults
 *   - Displayed by: GalleryGrid.tsx → shows "XX% Match" badge on each photo
 */
export interface FaceMatchResult {
  /** The event photo that contains a matching face */
  photo: PhotoItem;

  /** Calibrated confidence score between 0.80 and 0.99 for true biometric matches */
  similarity: number;

  /** Bounding box of the matched face within the photo (for optional face highlighting) */
  matchedFaceBox?: { x: number; y: number; width: number; height: number };
}

/**
 * CloudStorageConfig holds the Supabase connection credentials.
 *
 * SOURCES (in priority order):
 *   1. Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   2. localStorage overrides: eventlens_supabase_url, eventlens_supabase_key
 *   3. If neither is available → app runs in demo/local mode with localStorage fallback
 *
 * CONNECTIONS:
 *   - Configured by: CloudConfigModal.tsx → saves to localStorage
 *   - Read by: supabase.ts → getSupabaseClient()
 *   - Status shown by: Navbar.tsx → "Cloud Live" / "Demo / Local Mode" pill
 */
export interface CloudStorageConfig {
  /** Supabase project URL (e.g. "https://xyzabcde.supabase.co") */
  supabaseUrl: string;

  /** Supabase anonymous/public API key for client-side auth */
  supabaseAnonKey: string;

  /** Storage bucket name (default: "event-photos") */
  storageBucket: string;

  /** Whether valid cloud credentials are currently configured */
  isConfigured: boolean;
}

/**
 * UploadProgress tracks the state of an individual file during bulk upload.
 *
 * LIFECYCLE:
 *   pending → uploading → indexing_faces → completed
 *                                        → error (on failure)
 *
 * CONNECTIONS:
 *   - Used by: BulkUploader.tsx (internal UploadQueueItem state)
 */
export type UploadStatus = 'pending' | 'uploading' | 'indexing_faces' | 'completed' | 'error';

/**
 * EventAnalytics provides summary statistics for the admin dashboard.
 * Can be extended to track QR scans, downloads, and AI searches per event.
 */
export interface EventAnalytics {
  /** Total number of events created */
  totalEvents: number;
  /** Total photos across all events */
  totalPhotos: number;
  /** Total AI face searches performed */
  totalAISearches: number;
  /** Total photo downloads (single + ZIP) */
  totalDownloads: number;
  /** Total QR code scans */
  totalQRScans: number;
}
