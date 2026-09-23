import type { SupabaseClient } from '@supabase/supabase-js';

// Environment variables (provided when deployed to Vercel or locally via .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  // Check if credentials exist in localStorage (allows setting credentials directly from the web UI without rebuilding)
  let url = SUPABASE_URL;
  let key = SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined') {
    try {
      const customUrl = localStorage.getItem('eventlens_supabase_url');
      const customKey = localStorage.getItem('eventlens_supabase_key');
      if (customUrl && customKey) {
        url = customUrl;
        key = customKey;
      }
    } catch {
      // ignore
    }
  }

  if (url && key && url.startsWith('http')) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

export function isCloudConfigured(): boolean {
  return getSupabaseClient() !== null;
}

export const STORAGE_BUCKET_NAME = 'event-photos';

/**
 * Upload a high-resolution photo file to Supabase Cloud Storage
 */
export async function uploadPhotoToCloud(
  file: File | Blob,
  fileName: string,
  eventId: string
): Promise<{ publicUrl: string; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { publicUrl: '', error: 'Cloud storage is not configured.' };
  }

  const path = `${eventId}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { publicUrl: '', error: error.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET_NAME)
    .getPublicUrl(path);

  return { publicUrl };
}
