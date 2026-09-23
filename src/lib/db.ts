/**
 * ============================================================================
 * EventLens AI — Unified Data Access Layer (db.ts)
 * ============================================================================
 */

import { EventItem, PhotoItem } from './types';
import { INITIAL_EVENTS, INITIAL_PHOTOS } from './sampleData';
import { getSupabaseClient } from './supabase';
import { FESTIVAL_EVENTS } from '@/data/festivalEvents';
import { FestivalEvent, EventPhoto, EventRsvpRecord, CommitteeMember, EmergencyContact } from '@/types/utsav';
import { formatFestiveDate } from '@/utils/dateUtils';
import { BPSCVS_COMMITTEE_MEMBERS, BPSCVS_EMERGENCY_CONTACTS, INITIAL_RSVP_RECORDS } from '@/data/bpscvsData';

/** localStorage key for persisting event data between sessions */
const EVENTS_STORAGE_KEY = 'bpscvs_events_v4';
/** localStorage key for persisting photo data between sessions */
const PHOTOS_STORAGE_KEY = 'bpscvs_photos_v4';
/** localStorage key for persisting RSVP records */
const RSVP_STORAGE_KEY = 'bpscvs_rsvp_records';

/**
 * Safe localStorage.setItem wrapper.
 * Catches QuotaExceededError and any other storage errors so a full
 * browser storage quota never crashes the application at runtime.
 */
export function safeLocalStorageSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      console.warn(
        `[db] localStorage quota exceeded — could not persist key "${key}". ` +
        'Data is still available in memory for this session.'
      );
    } else {
      console.warn(`[db] localStorage.setItem failed for key "${key}":`, err);
    }
  }
}

/**
 * In-memory cache layer for instant UI responsiveness.
 * Prevents redundant localStorage JSON.parse calls on rapid state updates.
 * Invalidated on new writes (createEvent, savePhotos).
 */
let memoryEvents: EventItem[] | null = null;
let memoryPhotos: PhotoItem[] | null = null;

function getLocalStorage(): Storage | null {
  if (typeof window !== 'undefined') {
    // Clear old legacy EventLens keys to avoid stale demo data collision
    try {
      if (window.localStorage.getItem('eventlens_events_data')) {
        window.localStorage.removeItem('eventlens_events_data');
      }
      if (window.localStorage.getItem('eventlens_photos_data')) {
        window.localStorage.removeItem('eventlens_photos_data');
      }
    } catch {}
    return window.localStorage;
  }
  return null;
}

/**
 * Get all events (from Supabase if connected, else LocalStorage/Initial dataset)
 */
export async function getAllEvents(): Promise<EventItem[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          slug: row.slug || row.id,
          title: row.title,
          description: row.description,
          date: row.date,
          time: row.time || '10:00 AM',
          location: row.location,
          coverImage: row.cover_image,
          category: row.category || 'Other',
          status: row.status || (new Date(row.date) < new Date() ? 'completed' : 'upcoming'),
          mapUrl: row.map_url || '',
          registrationOpen: row.registration_open ?? true,
          photoCount: row.photo_count || 0,
          pinCode: row.pin_code,
          isPublic: row.is_public ?? true,
          createdAt: row.created_at,
          photographerName: row.photographer_name,
          photographerContact: row.photographer_contact,
          driveUrl: row.drive_url || '',
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch events fallback:', e);
    }
  }

  const cleanEvent = (e: EventItem): EventItem => {
    let cat = e.category;
    if (!cat || cat === 'Wedding' || cat === 'Corporate' || cat === 'Birthday' || cat === 'Fashion' || cat === 'Gala' || cat === 'Concert') {
      cat = 'Cultural';
    } else if (cat === 'Other') {
      cat = 'Festival';
    }
    return { ...e, category: cat };
  };

  // Fallback to local storage / memory
  const ls = getLocalStorage();
  if (ls) {
    const raw = ls.getItem(EVENTS_STORAGE_KEY);
    if (raw) {
      try {
        memoryEvents = (JSON.parse(raw) as EventItem[]).map(cleanEvent);
        return memoryEvents || INITIAL_EVENTS.map(cleanEvent);
      } catch (e) {
        console.error('Failed to parse local events:', e);
      }
    }
  }

  if (!memoryEvents) {
    memoryEvents = INITIAL_EVENTS.map(cleanEvent);
    if (ls) {
      safeLocalStorageSet(ls, EVENTS_STORAGE_KEY, JSON.stringify(memoryEvents));
    }
  }
  return memoryEvents.map(cleanEvent);
}

/**
 * Get event by ID or Slug
 */
export async function getEventById(idOrSlug: string): Promise<EventItem | null> {
  const events = await getAllEvents();
  return events.find((e) => e.id === idOrSlug || e.slug === idOrSlug) || null;
}

/**
 * Create a new event
 */
export async function createEvent(newEvent: Omit<EventItem, 'id' | 'createdAt' | 'photoCount'>): Promise<EventItem> {
  const eventItem: EventItem = {
    ...newEvent,
    id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
    photoCount: 0,
    status: newEvent.status || 'upcoming',
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('events').insert([
        {
          id: eventItem.id,
          slug: eventItem.slug,
          title: eventItem.title,
          description: eventItem.description,
          date: eventItem.date,
          time: eventItem.time,
          location: eventItem.location,
          cover_image: eventItem.coverImage,
          category: eventItem.category,
          status: eventItem.status,
          map_url: eventItem.mapUrl,
          registration_open: eventItem.registrationOpen,
          photo_count: 0,
          pin_code: eventItem.pinCode,
          is_public: eventItem.isPublic,
          photographer_name: eventItem.photographerName,
          photographer_contact: eventItem.photographerContact, // FIX: was camelCase
          drive_url: eventItem.driveUrl || '',
        }
      ]);
    } catch (e) {
      console.warn('Supabase event insert fallback:', e);
    }
  }

  const events = await getAllEvents();
  const updated = [eventItem, ...events];
  memoryEvents = updated;
  const ls = getLocalStorage();
  if (ls) {
    safeLocalStorageSet(ls, EVENTS_STORAGE_KEY, JSON.stringify(updated));
  }

  notifyEventsUpdated(eventItem);
  return eventItem;
}

/**
 * Update an existing event
 */
export async function updateEvent(id: string, updates: Partial<EventItem>): Promise<EventItem | null> {
  const events = await getAllEvents();
  const index = events.findIndex(e => e.id === id || e.slug === id);
  if (index === -1) return null;

  const updated: EventItem = {
    ...events[index],
    ...updates,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('events').update({
        title: updated.title,
        slug: updated.slug,
        description: updated.description,
        date: updated.date,
        time: updated.time,
        location: updated.location,
        cover_image: updated.coverImage,
        category: updated.category,
        status: updated.status,
        map_url: updated.mapUrl,
        registration_open: updated.registrationOpen,
        pin_code: updated.pinCode,
        is_public: updated.isPublic,
        photographer_name: updated.photographerName,
        photographer_contact: updated.photographerContact, // FIX: was camelCase
        drive_url: updated.driveUrl || '',
      }).eq('id', events[index].id);
    } catch (e) {
      console.warn('Supabase event update fallback:', e);
    }
  }

  events[index] = updated;
  memoryEvents = [...events];
  const ls = getLocalStorage();
  if (ls) {
    safeLocalStorageSet(ls, EVENTS_STORAGE_KEY, JSON.stringify(events));
  }

  notifyEventsUpdated(updated);
  return updated;
}

/**
 * Upsert an event (create or update)
 */
export async function upsertEvent(event: Partial<EventItem> & { title: string; date: string }): Promise<EventItem> {
  if (event.id) {
    const existing = await getEventById(event.id);
    if (existing) {
      const updated = await updateEvent(existing.id, event);
      if (updated) return updated;
    }
  }
  return createEvent(event as any);
}

/**
 * Delete an event by ID
 */
export async function deleteEvent(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('events').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase event delete fallback:', e);
    }
  }

  const events = await getAllEvents();
  const filtered = events.filter(e => e.id !== id && e.slug !== id);
  memoryEvents = filtered;
  const ls = getLocalStorage();
  if (ls) {
    safeLocalStorageSet(ls, EVENTS_STORAGE_KEY, JSON.stringify(filtered));
  }
  notifyEventsUpdated({ id, deleted: true });
  return true;
}

/**
 * Reset all event data back to initial seed data
 */
export async function resetToSeed(): Promise<void> {
  memoryEvents = [...INITIAL_EVENTS];
  memoryPhotos = [...INITIAL_PHOTOS];
  const ls = getLocalStorage();
  if (ls) {
    safeLocalStorageSet(ls, EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
    safeLocalStorageSet(ls, PHOTOS_STORAGE_KEY, JSON.stringify(INITIAL_PHOTOS));
  }
}

/**
 * Get all photos for an event (resolves both event ID and slug)
 */
export async function getPhotosByEventId(eventIdOrSlug: string): Promise<PhotoItem[]> {
  const events = await getAllEvents();
  const matchedEvent = events.find(e => e.id === eventIdOrSlug || e.slug === eventIdOrSlug);
  const targetId = matchedEvent ? matchedEvent.id : eventIdOrSlug;
  const targetSlug = matchedEvent ? matchedEvent.slug : eventIdOrSlug;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .or(`event_id.eq.${targetId},event_id.eq.${targetSlug}`)
        .order('uploaded_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          eventId: row.event_id,
          url: row.url,
          thumbnailUrl: row.thumbnail_url || row.url,
          title: row.title,
          width: row.width,
          height: row.height,
          sizeBytes: row.size_bytes,
          uploadedAt: row.uploaded_at,
          tags: row.tags || [],
          faces: row.faces || [],
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch photos fallback:', e);
    }
  }

  const ls = getLocalStorage();
  if (ls) {
    const raw = ls.getItem(PHOTOS_STORAGE_KEY);
    if (raw) {
      try {
        const allPhotos: PhotoItem[] = JSON.parse(raw);
        const filtered = allPhotos.filter((p) => p.eventId === targetId || p.eventId === targetSlug || p.eventId === eventIdOrSlug);
        if (filtered.length > 0) return filtered;
      } catch (e) {}
    }
  }

  // Check initial photos
  return INITIAL_PHOTOS.filter((p) => p.eventId === targetId || p.eventId === targetSlug || p.eventId === eventIdOrSlug);
}

/**
 * Save new photos in bulk to the database
 */
export async function savePhotos(newPhotos: PhotoItem[]): Promise<void> {
  if (newPhotos.length === 0) return;

  const eventId = newPhotos[0].eventId;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbRows = newPhotos.map((p) => ({
        id: p.id,
        event_id: p.eventId,
        url: p.url,
        thumbnail_url: p.thumbnailUrl,
        title: p.title,
        width: p.width,
        height: p.height,
        size_bytes: p.sizeBytes,
        uploaded_at: p.uploadedAt,
        tags: p.tags,
        faces: p.faces,
      }));

      await supabase.from('photos').upsert(dbRows);

      // Increment photo count on the event
      await supabase.rpc('increment_event_photo_count', {
        event_id_input: eventId,
        count_add: newPhotos.length,
      });
    } catch (e) {
      console.warn('Supabase save photos fallback:', e);
    }
  }

  // Update local storage
  const ls = getLocalStorage();
  let allPhotos: PhotoItem[] = [...INITIAL_PHOTOS];
  if (ls) {
    const raw = ls.getItem(PHOTOS_STORAGE_KEY);
    if (raw) {
      try {
        allPhotos = JSON.parse(raw);
      } catch (e) {}
    }
  }

  // Append new photos
  const merged = [...newPhotos, ...allPhotos.filter(p => !newPhotos.some(np => np.id === p.id))];
  if (ls) {
    safeLocalStorageSet(ls, PHOTOS_STORAGE_KEY, JSON.stringify(merged));
  }

  // Update event photo count locally
  const events = await getAllEvents();
  const targetEvent = events.find(e => e.id === eventId);
  if (targetEvent) {
    targetEvent.photoCount = (targetEvent.photoCount || 0) + newPhotos.length;
    if (ls) {
      safeLocalStorageSet(ls, EVENTS_STORAGE_KEY, JSON.stringify(events));
    }
  }
  notifyEventsUpdated({ eventId, photoCountAdd: newPhotos.length });
}

/**
 * Update face embeddings for a photo after AI background indexing
 */
export async function updatePhotoFaces(photoId: string, faces: PhotoItem['faces']): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('photos').update({ faces }).eq('id', photoId);
    } catch (e) {
      console.warn('Supabase update faces fallback:', e);
    }
  }

  const ls = getLocalStorage();
  if (ls) {
    const raw = ls.getItem(PHOTOS_STORAGE_KEY);
    if (raw) {
      try {
        const allPhotos: PhotoItem[] = JSON.parse(raw);
        const idx = allPhotos.findIndex(p => p.id === photoId);
        if (idx !== -1) {
          allPhotos[idx].faces = faces;
          safeLocalStorageSet(ls, PHOTOS_STORAGE_KEY, JSON.stringify(allPhotos));
        }
      } catch (e) {}
    }
  }
}

/**
 * Broadcast event updates across components and tabs
 */
export function notifyEventsUpdated(detail?: any): void {
  memoryEvents = null;
  memoryPhotos = null;
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('bpscvs_events_updated', { detail }));
      const ls = getLocalStorage();
      if (ls) {
        ls.setItem('bpscvs_last_updated_at', Date.now().toString());
      }
    } catch {}
  }
}

/**
 * Convert standard EventItem to rich FestivalEvent format for main page display
 */
export function convertEventItemToFestivalEvent(item: EventItem, photos: PhotoItem[] = []): FestivalEvent {
  const convertedPhotos: EventPhoto[] = photos.map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.title || item.title,
    takenAt: p.uploadedAt ? new Date(p.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Event Day',
    eventId: item.id,
    eventTitle: item.title,
    residentIds: [],
    tags: p.tags && p.tags.length > 0 ? p.tags : ['Community', item.category || 'Festival'],
    photographer: item.photographerName || 'BPSCVS Media Team',
    highResUrl: p.url,
  }));

  return {
    id: item.id,
    title: item.title,
    hindiTitle: item.category ? `${item.category} Event` : 'Community Event',
    date: formatFestiveDate(item.date),
    year: (() => {
      // Handle formatted dates like "1 Nov 2024" or ISO "2026-11-01"
      const yearMatch = String(item.date).match(/\b(\d{4})\b/);
      if (yearMatch) return parseInt(yearMatch[1], 10);
      const d = new Date(item.date);
      return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    })(),
    location: item.location || 'Bani Park Community Hall, Jaipur',
    attendeesCount: 250,
    photoCount: Math.max(item.photoCount || 0, convertedPhotos.length),
    coverImage: item.coverImage || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    colorAccent: '#f59e0b',
    description: item.description || 'Bani Park Sindhi Colony Vikas Samiti official festival event.',
    highlights: ['Community Gathering', 'Mahaprasad & Aarti', 'Sindhi Cultural Program'],
    photos: convertedPhotos,
    driveUrl: item.driveUrl || '',
  };
}

/**
 * Get merged list of all festival events (seed festival events + admin created/modified events).
 * Admin-created events appear first (most recent first), then seed events.
 * Guaranteed single source of truth for public landing page and widgets with real-time photo counts.
 */
export async function getMergedFestivalEvents(): Promise<FestivalEvent[]> {
  const dbEvents = await getAllEvents();
  const ls = getLocalStorage();
  const photosByEvent = new Map<string, PhotoItem[]>();

  // 1. Fetch from Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('uploaded_at', { ascending: false });
      if (!error && data && data.length > 0) {
        for (const row of data) {
          const item: PhotoItem = {
            id: row.id,
            eventId: row.event_id,
            url: row.url,
            thumbnailUrl: row.thumbnail_url || row.url,
            title: row.title,
            width: row.width,
            height: row.height,
            sizeBytes: row.size_bytes,
            uploadedAt: row.uploaded_at,
            tags: row.tags || [],
            faces: row.faces || [],
          };
          const list = photosByEvent.get(item.eventId) || [];
          if (!list.some(existing => existing.id === item.id)) {
            list.push(item);
            photosByEvent.set(item.eventId, list);
          }
        }
      }
    } catch (e) {
      console.warn('Supabase fetch all photos fallback:', e);
    }
  }

  // 2. Fetch from localStorage PHOTOS_STORAGE_KEY
  if (ls) {
    try {
      const raw = ls.getItem(PHOTOS_STORAGE_KEY);
      if (raw) {
        const storedPhotos: PhotoItem[] = JSON.parse(raw);
        for (const p of storedPhotos) {
          const list = photosByEvent.get(p.eventId) || [];
          if (!list.some(existing => existing.id === p.id)) {
            list.push(p);
            photosByEvent.set(p.eventId, list);
          }
        }
      }
    } catch (e) {}
  }

  // 3. Include INITIAL_PHOTOS for standard demo events if not already added
  for (const p of INITIAL_PHOTOS) {
    const list = photosByEvent.get(p.eventId) || [];
    if (!list.some(existing => existing.id === p.id)) {
      list.push(p);
      photosByEvent.set(p.eventId, list);
    }
  }

  // Build a map of seed events keyed by ID for O(1) lookups
  const baseMap = new Map<string, FestivalEvent>();

  // 1. Seed base festival events
  FESTIVAL_EVENTS.forEach((ev) => {
    const stored = photosByEvent.get(ev.id) || [];
    const convertedStored: EventPhoto[] = stored.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.title || ev.title,
      takenAt: p.uploadedAt ? new Date(p.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Event Day',
      eventId: ev.id,
      eventTitle: ev.title,
      residentIds: [],
      tags: p.tags && p.tags.length > 0 ? p.tags : ['Community', 'Festival'],
      photographer: 'BPSCVS Member',
      highResUrl: p.url,
    }));

    // Merge base photos with newly uploaded photos
    const allPhotos = [...(ev.photos || [])];
    for (const sp of convertedStored) {
      if (!allPhotos.some(p => p.id === sp.id || p.url === sp.url)) {
        allPhotos.push(sp);
      }
    }

    baseMap.set(ev.id, { 
      ...ev, 
      date: formatFestiveDate(ev.date),
      photos: allPhotos,
      photoCount: Math.max(ev.photoCount || 0, allPhotos.length),
    });
  });

  // 2. Merge DB events: update seed events or add new admin-created ones
  const adminCreated: FestivalEvent[] = [];
  for (const item of dbEvents) {
    const stored = photosByEvent.get(item.id) || [];
    const convertedStored: EventPhoto[] = stored.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.title || item.title,
      takenAt: p.uploadedAt ? new Date(p.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Event Day',
      eventId: item.id,
      eventTitle: item.title,
      residentIds: [],
      tags: p.tags && p.tags.length > 0 ? p.tags : ['Community', item.category || 'Festival'],
      photographer: item.photographerName || 'BPSCVS Member',
      highResUrl: p.url,
    }));

    if (baseMap.has(item.id)) {
      const existing = baseMap.get(item.id)!;
      const allPhotos = [...existing.photos];
      for (const sp of convertedStored) {
        if (!allPhotos.some(p => p.id === sp.id || p.url === sp.url)) {
          allPhotos.push(sp);
        }
      }
      baseMap.set(item.id, {
        ...existing,
        title: item.title || existing.title,
        location: item.location || existing.location,
        date: formatFestiveDate(item.date) || existing.date,
        coverImage: item.coverImage || existing.coverImage,
        description: item.description || existing.description,
        photos: allPhotos,
        photoCount: Math.max(item.photoCount || 0, allPhotos.length),
        attendeesCount: existing.attendeesCount,
        driveUrl: item.driveUrl || existing.driveUrl || '',
      });
    } else {
      const converted = convertEventItemToFestivalEvent(item, stored);
      converted.photos = convertedStored;
      converted.photoCount = Math.max(item.photoCount || 0, convertedStored.length);
      adminCreated.push(converted);
    }
  }

  // Admin-created events appear first (most recent first), then seed events
  const seedEvents = Array.from(baseMap.values());
  return [...adminCreated, ...seedEvents];
}

/**
 * ============================================================================
 * RSVP & Attendance Data Access
 * ============================================================================
 */

export async function getAllRsvps(): Promise<EventRsvpRecord[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          eventId: row.event_id,
          residentName: row.resident_name,
          bungalowPlot: row.bungalow_plot,
          phone: row.phone || '',
          adultsCount: Number(row.adults_count) || 1,
          kidsCount: Number(row.kids_count) || 0,
          dietPreference: row.diet_preference || 'regular',
          isAttending: Boolean(row.is_attending),
          notes: row.notes || '',
          createdAt: row.created_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch rsvps fallback:', e);
    }
  }

  // Fallback to localStorage / initial records
  const ls = getLocalStorage();
  if (ls) {
    const raw = ls.getItem(RSVP_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse local rsvps:', e);
      }
    }
  }

  return [...INITIAL_RSVP_RECORDS];
}

export async function getRsvpsByEventId(eventId: string): Promise<EventRsvpRecord[]> {
  const all = await getAllRsvps();
  return all.filter((r) => r.eventId === eventId);
}

export async function saveRsvpRecord(record: EventRsvpRecord): Promise<boolean> {
  let savedToCloud = false;
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await supabase.from('rsvps').insert([
        {
          id: record.id,
          event_id: record.eventId,
          resident_name: record.residentName,
          bungalow_plot: record.bungalowPlot,
          phone: record.phone,
          adults_count: record.adultsCount,
          kids_count: record.kidsCount,
          diet_preference: record.dietPreference,
          is_attending: record.isAttending,
          notes: record.notes || null,
          created_at: record.createdAt,
        },
      ]);
      if (!error) {
        savedToCloud = true;
      } else {
        console.warn('Supabase insert rsvp error:', error);
      }
    } catch (e) {
      console.warn('Supabase save rsvp fallback:', e);
    }
  }

  // Update local storage
  const ls = getLocalStorage();
  if (ls) {
    try {
      const current = await getAllRsvps();
      const updated = [record, ...current.filter((r) => r.id !== record.id)];
      safeLocalStorageSet(ls, RSVP_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local storage RSVP save notice:', e);
    }
  }

  // Notify active components of RSVP list update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bpscvs_rsvp_updated'));
    window.dispatchEvent(new Event('storage'));
  }

  return true;
}

/**
 * ============================================================================
 * Committee Members & Emergency Contacts Data Access
 * ============================================================================
 */

export async function getCommitteeMembers(): Promise<CommitteeMember[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          name: row.name,
          hindiName: row.hindi_name,
          designation: row.designation,
          hindiDesignation: row.hindi_designation,
          roleType: row.role_type,
          wing: row.wing,
          phone: row.phone,
          plotNo: row.plot_no,
          avatar: row.avatar,
          shortIntro: row.short_intro,
          hindiShortIntro: row.hindi_short_intro,
          tenure: row.tenure,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch committee_members fallback:', e);
    }
  }

  return [...BPSCVS_COMMITTEE_MEMBERS];
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          title: row.title,
          hindiTitle: row.hindi_title,
          role: row.role,
          phone: row.phone,
          availability: row.availability,
          iconType: row.icon_type,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch emergency_contacts fallback:', e);
    }
  }

  return [...BPSCVS_EMERGENCY_CONTACTS];
}
