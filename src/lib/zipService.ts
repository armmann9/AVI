import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PhotoItem } from './types';
import { FESTIVAL_EVENTS } from '@/data/festivalEvents';

/**
 * ============================================================================
 * EventLens AI / BPSCVS — Unified Zip Download Service (zipService.ts)
 * ============================================================================
 */

/**
 * Downloads multiple high-resolution photos bundled as a single clean .ZIP archive directly in browser.
 */
export async function downloadPhotosAsZip(
  photos: PhotoItem[],
  zipFilename = 'event-photos.zip',
  onProgress?: (progressPercent: number, currentFileName: string) => void
): Promise<void> {
  if (!photos || photos.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('photos') || zip;

  let completed = 0;
  const total = photos.length;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const fileName = `photo_${i + 1}_${photo.id.slice(-6)}.jpg`;

    if (onProgress) {
      onProgress(Math.round((completed / total) * 80), `Downloading ${i + 1}/${total}...`);
    }

    try {
      // Fetch the photo blob (from Supabase CDN or public image URL)
      const res = await fetch(photo.url);
      const blob = await res.blob();
      folder.file(fileName, blob);
    } catch (err) {
      console.warn(`Failed to fetch photo ${photo.url} for ZIP, retrying with thumbnail...`, err);
      try {
        const res = await fetch(photo.thumbnailUrl);
        const blob = await res.blob();
        folder.file(fileName, blob);
      } catch (innerErr) {
        console.error('Could not download image:', innerErr);
      }
    }

    completed++;
  }

  if (onProgress) {
    onProgress(90, 'Compressing ZIP package...');
  }

  const zipContent = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(90 + Math.round(metadata.percent * 0.1), 'Finalizing...');
    }
  });

  saveAs(zipContent, zipFilename);

  if (onProgress) {
    onProgress(100, 'Download complete!');
  }
}

/**
 * Direct JPG Downloader for Single Photo (Mobile & Desktop Friendly)
 */
export async function downloadSinglePhoto(
  photo: { url: string; id: string; title?: string; [key: string]: any },
  customName?: string
): Promise<void> {
  const fileName = customName || `bpscvs_photo_${photo.id.slice(-6)}.jpg`;
  try {
    const res = await fetch(photo.url);
    const blob = await res.blob();
    // Ensure JPEG blob type
    const jpgBlob = blob.type === 'image/jpeg' ? blob : new Blob([blob], { type: 'image/jpeg' });
    saveAs(jpgBlob, fileName);
  } catch (err) {
    // Direct link fallback
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Mobile-friendly Direct JPG Downloader for Multiple Photos.
 * - On Mobile (iOS / Android): Tries Web Share API so user can tap "Save Images" directly to Camera Roll.
 * - Fallback / Desktop: Downloads individual .jpg files sequentially with progress indication.
 */
export async function downloadMultiplePhotosDirectJpg(
  photos: { url: string; id: string; title?: string; [key: string]: any }[],
  onProgress?: (progressPercent: number, statusText: string) => void
): Promise<void> {
  if (!photos || photos.length === 0) return;

  const total = photos.length;

  // 1. Try Native Mobile Share Sheet if available (Allows 1-tap "Save 4 Images" into iOS/Android Gallery)
  if (typeof navigator !== 'undefined' && 'canShare' in navigator && 'share' in navigator) {
    try {
      if (onProgress) onProgress(10, `Preparing ${total} photos for your gallery...`);
      const filePromises = photos.map(async (p, idx) => {
        const res = await fetch(p.url);
        const blob = await res.blob();
        return new File([blob], `bpscvs_photo_${idx + 1}_${p.id.slice(-6)}.jpg`, { type: 'image/jpeg' });
      });

      const files = await Promise.all(filePromises);

      if (navigator.canShare({ files })) {
        if (onProgress) onProgress(80, 'Opening mobile photo save dialog...');
        await navigator.share({
          files,
          title: 'BPSCVS Festival Photos',
          text: `Saved ${total} photos from Bani Park Sindhi Colony Vikas Samiti`,
        });
        if (onProgress) onProgress(100, 'Saved to gallery!');
        return;
      }
    } catch (shareErr: any) {
      // If user dismissed share or it failed, smoothly fall back to sequential download
      if (shareErr.name === 'AbortError') {
        if (onProgress) onProgress(100, 'Cancelled');
        return;
      }
      console.warn('Native share failed or dismissed, falling back to direct downloads:', shareErr);
    }
  }

  // 2. Sequential Direct JPG Downloads (Staggered by 250ms to prevent browser pop-up blocking)
  for (let i = 0; i < total; i++) {
    const photo = photos[i];
    const fileName = `bpscvs_photo_${i + 1}_${photo.id.slice(-6)}.jpg`;

    if (onProgress) {
      const percent = Math.round(((i + 1) / total) * 100);
      onProgress(percent, `Downloading ${i + 1} of ${total} (.jpg)...`);
    }

    try {
      const res = await fetch(photo.url);
      const blob = await res.blob();
      const jpgBlob = blob.type === 'image/jpeg' ? blob : new Blob([blob], { type: 'image/jpeg' });
      saveAs(jpgBlob, fileName);
    } catch (err) {
      console.warn(`Failed direct download for ${fileName}:`, err);
      // Fallback anchor
      const a = document.createElement('a');
      a.href = photo.url;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // Small delay between triggers so mobile browsers don't suppress simultaneous downloads
    if (i < total - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  if (onProgress) {
    onProgress(100, 'All photos downloaded successfully!');
  }
}

/**
 * Packages project assets, festival panchang, and photo metadata into a downloadable .zip archive.
 */
export async function downloadProjectArchiveZip(onProgress?: (message: string) => void): Promise<void> {
  if (typeof window === 'undefined') return;

  const zip = new JSZip();

  if (onProgress) onProgress('Initializing Utsav Hub Archive...');

  // Add Project Documentation & Society Info
  zip.file(
    'README.md',
    `# Utsav Hub - Bani Park Sindhi Colony Vikas Samiti (BPSCVS)

Official Community Portal & AI Photo Hub.
- Deepotsav & Festival Celebrations
- AI Face Match Photo Search
- Live Mahaprasad RSVP & Meal Counter
- Committee Directory & 24/7 Helpline Desk

Built for community harmony and celebration preservation.
`
  );

  zip.file(
    'SOCIETY_PANCHANG_2025_2026.json',
    JSON.stringify(
      FESTIVAL_EVENTS.map((e) => ({
        festival: e.title,
        hindi: e.hindiTitle,
        date: e.date,
        location: e.location,
        attendees: e.attendeesCount,
        highlights: e.highlights,
      })),
      null,
      2
    )
  );

  if (onProgress) onProgress('Packaging festival archives & metadata...');

  // Include album metadata
  const photosFolder = zip.folder('festival_albums');
  if (photosFolder) {
    FESTIVAL_EVENTS.forEach((event) => {
      const eventFolder = photosFolder.folder(event.id);
      if (eventFolder) {
        eventFolder.file(
          'details.json',
          JSON.stringify(
            {
              title: event.title,
              hindiTitle: event.hindiTitle,
              date: event.date,
              description: event.description,
              photoCount: event.photoCount,
              highlights: event.highlights,
              photos: event.photos.map((p) => ({
                id: p.id,
                url: p.url,
                caption: p.caption,
                tags: p.tags,
              })),
            },
            null,
            2
          )
        );
      }
    });
  }

  if (onProgress) onProgress('Generating compressed ZIP package...');

  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(`Compressing: ${Math.round(metadata.percent)}%`);
    }
  });

  saveAs(content, 'utsav-hub-bpscvs-portal.zip');

  if (onProgress) onProgress('Download ready!');
}

/** Alias for backward compatibility */
export const downloadProjectZip = downloadProjectArchiveZip;
