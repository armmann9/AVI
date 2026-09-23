'use client';

import React, { useState, useMemo } from 'react';
import { Download, Sparkles, ImageOff, CheckSquare, Square, Check, SearchX, Smartphone, Share2, Archive } from 'lucide-react';
import { PhotoItem, FaceMatchResult } from '@/lib/types';
import Lightbox from './Lightbox';
import { downloadPhotosAsZip, downloadSinglePhoto, downloadMultiplePhotosDirectJpg } from '@/lib/zipService';

interface GalleryGridProps {
  photos: PhotoItem[];
  matchedResults?: FaceMatchResult[];
  eventTitle?: string;
}

export default function GalleryGrid({ photos, matchedResults, eventTitle = 'Event' }: GalleryGridProps) {
  const [activeTag, setActiveTag] = useState<string>('All');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Multi-select & Batch Download state
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; text: string } | null>(null);

  // Extract unique tags across photos
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    photos.forEach((p) => {
      p.tags?.forEach((t) => tags.add(t));
    });
    return Array.from(tags);
  }, [photos]);

  // If AI matchedResults provided, filter/prioritize photos
  const displayedPhotos = useMemo(() => {
    let list = photos;

    if (matchedResults && matchedResults.length > 0) {
      const matchedIds = new Set(matchedResults.map((r) => r.photo.id));
      list = list.filter((p) => matchedIds.has(p.id));
    }

    if (activeTag !== 'All') {
      list = list.filter((p) => p.tags?.includes(activeTag));
    }

    return list;
  }, [photos, matchedResults, activeTag]);

  // Helper to get similarity score for a given photo
  const getMatchScoreForPhoto = (photoId: string): number | undefined => {
    if (!matchedResults) return undefined;
    return matchedResults.find((r) => r.photo.id === photoId)?.similarity;
  };

  // Toggle selection for a single photo
  const togglePhotoSelection = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  // Select all or Deselect all displayed photos
  const toggleSelectAll = () => {
    if (selectedPhotoIds.size === displayedPhotos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(displayedPhotos.map((p) => p.id)));
    }
  };

  // Direct JPG download for selected photos (Mobile & Desktop friendly)
  const handleDownloadSelectedJpg = async () => {
    const selectedList = displayedPhotos.filter((p) => selectedPhotoIds.has(p.id));
    if (selectedList.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress({ percent: 10, text: `Preparing ${selectedList.length} photos (.jpg)...` });

    await downloadMultiplePhotosDirectJpg(
      selectedList.map((p, i) => ({ id: p.id, url: p.url, title: p.title || `photo_${i + 1}` })),
      (percent, text) => {
        setDownloadProgress({ percent, text });
      }
    );

    setIsDownloading(false);
    setDownloadProgress(null);
  };

  // Direct JPG download for ALL displayed photos
  const handleDownloadAllJpg = async () => {
    if (displayedPhotos.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress({ percent: 5, text: `Preparing all ${displayedPhotos.length} photos (.jpg)...` });

    await downloadMultiplePhotosDirectJpg(
      displayedPhotos.map((p, i) => ({ id: p.id, url: p.url, title: p.title || `photo_${i + 1}` })),
      (percent, text) => {
        setDownloadProgress({ percent, text });
      }
    );

    setIsDownloading(false);
    setDownloadProgress(null);
  };

  // Secondary Desktop Option: Download selected as ZIP
  const handleDownloadSelectedZip = async () => {
    const selectedList = displayedPhotos.filter((p) => selectedPhotoIds.has(p.id));
    if (selectedList.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress({ percent: 10, text: 'Preparing ZIP package...' });

    const safeTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await downloadPhotosAsZip(
      selectedList,
      `bpscvs_${safeTitle}_${selectedList.length}_photos.zip`,
      (percent, text) => {
        setDownloadProgress({ percent, text });
      }
    );

    setIsDownloading(false);
    setDownloadProgress(null);
  };

  return (
    <div className="relative">
      {/* Top Filter and Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
        {/* Category / Tags Filter */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap overflow-x-auto py-1">
          <button
            onClick={() => setActiveTag('All')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTag === 'All'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-stone-200 border border-stone-200 dark:border-slate-700'
            }`}
          >
            All Photos ({photos.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTag === tag
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-stone-200 border border-stone-200 dark:border-slate-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Action Buttons: Batch Select / JPG Download */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedPhotoIds(new Set());
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
              isSelectionMode
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-300 font-bold'
                : 'bg-stone-100 dark:bg-slate-800 border-stone-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-stone-200'
            }`}
          >
            {isSelectionMode ? <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> : <Square className="w-3.5 h-3.5" />}
            <span>{isSelectionMode ? 'Cancel Selection' : 'Select Photos'}</span>
          </button>

          {isSelectionMode && (
            <button
              onClick={toggleSelectAll}
              className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-slate-700 dark:text-slate-300 border border-stone-300 dark:border-slate-700 text-xs font-semibold transition-all"
            >
              {selectedPhotoIds.size === displayedPhotos.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

          {/* Primary Action: Direct JPG Download All */}
          <button
            onClick={handleDownloadAllJpg}
            disabled={isDownloading || displayedPhotos.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-xs"
            title="Download photos directly as JPG files (saved to phone gallery or downloads)"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-200" />
            <span>Download All (.JPG)</span>
          </button>
        </div>
      </div>

      {/* Progress Banner */}
      {isDownloading && downloadProgress && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 mb-6 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
            <span>{downloadProgress.text}</span>
            <span>{downloadProgress.percent}%</span>
          </div>
          <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
              style={{ width: `${downloadProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {displayedPhotos.length === 0 && (
        <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center my-6">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            {matchedResults !== undefined ? <SearchX className="w-7 h-7 text-blue-600" /> : <ImageOff className="w-7 h-7 text-slate-400" />}
          </div>
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">
            {matchedResults !== undefined ? 'No Matching Photos Found' : 'No Photos in this Category'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {matchedResults !== undefined
              ? 'We scanned the event photos, but could not detect a confident match with this selfie. Try capturing a clearer front-facing selfie.'
              : 'Try selecting "All Photos" to see the full event album.'}
          </p>
        </div>
      )}

      {/* Responsive Gallery Grid (1 col on tiny mobile, 2 col on standard mobile, 3 on tablet, 4 on desktop) */}
      {displayedPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayedPhotos.map((photo, idx) => {
            const isSelected = selectedPhotoIds.has(photo.id);
            const matchScore = getMatchScoreForPhoto(photo.id);

            return (
              <div
                key={photo.id}
                onClick={() => {
                  if (isSelectionMode) {
                    togglePhotoSelection(photo.id, { stopPropagation: () => {} } as any);
                  } else {
                    setActiveLightboxIndex(idx);
                  }
                }}
                className={`relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3] bg-slate-100 dark:bg-slate-800 border transition-all duration-300 group touch-manipulation ${
                  isSelected
                    ? 'border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-2 ring-blue-600'
                    : 'border-stone-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                {/* Photo Image */}
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.title || `Event photo ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Always visible mobile-friendly action overlay on tap / hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 sm:p-3 pointer-events-none">
                  {/* Top Corner: AI Match Score & Selection Checkbox */}
                  <div className="flex justify-between items-center pointer-events-auto">
                    {matchScore !== undefined ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-md">
                        <Sparkles className="w-3 h-3" /> {Math.round(matchScore * 100)}% Match
                      </span>
                    ) : (
                      <div />
                    )}

                    {isSelectionMode ? (
                      <button
                        type="button"
                        onClick={(e) => togglePhotoSelection(photo.id, e)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-white'
                            : 'bg-black/60 border border-white/50 text-white'
                        }`}
                        aria-label="Select photo"
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadSinglePhoto(photo, `bpscvs_photo_${idx + 1}.jpg`);
                        }}
                        className="w-7 h-7 rounded-lg bg-black/60 hover:bg-blue-600 border border-white/30 text-white flex items-center justify-center transition-all"
                        title="Download JPG to phone"
                        aria-label="Download JPG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Bottom Corner: Title and Direct Download Button */}
                  <div className="flex justify-between items-center pointer-events-auto gap-2">
                    <span className="text-[11px] text-white/90 font-medium truncate">
                      {photo.title || `Photo #${idx + 1}`}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSinglePhoto(photo, `bpscvs_photo_${idx + 1}.jpg`);
                      }}
                      className="px-2 py-1 rounded-md bg-white/20 hover:bg-blue-600 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3 h-3" />
                      <span>.JPG</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Action Bar for Mobile & Desktop when photos are selected */}
      {isSelectionMode && selectedPhotoIds.size > 0 && (
        <aside 
          aria-label="Selected photos actions"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg p-3 sm:p-4 rounded-2xl bg-[#0F172A]/95 text-white backdrop-blur-md border border-slate-700 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
              {selectedPhotoIds.size}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary: Direct JPG Download */}
            <button
              onClick={handleDownloadSelectedJpg}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-200" />
              <span>Download (.JPG)</span>
            </button>

            {/* Optional ZIP Archive */}
            <button
              onClick={handleDownloadSelectedZip}
              disabled={isDownloading}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700"
              title="Download as ZIP package"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>ZIP</span>
            </button>
          </div>
        </aside>
      )}

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && displayedPhotos.length > 0 && (
        <Lightbox
          photos={displayedPhotos}
          currentIndex={activeLightboxIndex}
          onClose={() => setActiveLightboxIndex(null)}
          onNavigate={(newIdx) => setActiveLightboxIndex(newIdx)}
          matchScore={getMatchScoreForPhoto(displayedPhotos[activeLightboxIndex]?.id)}
        />
      )}
    </div>
  );
}
