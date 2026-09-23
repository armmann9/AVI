'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Calendar, 
  MapPin, 
  Users, 
  Camera, 
  ChevronLeft, 
  ChevronRight, 
  Tag, 
  Sparkles,
  CheckSquare,
  Square,
  Check,
  Archive,
  Loader2
} from 'lucide-react';
import { FestivalEvent, EventPhoto } from '@/types/utsav';
import FaceSearchModal from '@/components/FaceSearchModal';
import { PhotoItem, FaceMatchResult } from '@/lib/types';
import { downloadPhotosAsZip, downloadSinglePhoto, downloadMultiplePhotosDirectJpg } from '@/lib/zipService';

interface EventGalleryModalProps {
  event: FestivalEvent | null;
  activePhoto: EventPhoto | null;
  onClose: () => void;
  onSelectPhoto: (photo: EventPhoto) => void;
}

export const EventGalleryModal: React.FC<EventGalleryModalProps> = ({
  event,
  activePhoto,
  onClose,
  onSelectPhoto,
}) => {
  if (!event && !activePhoto) return null;

  const currentEvent = event || (activePhoto ? {
    id: activePhoto.eventId,
    title: activePhoto.eventTitle,
    hindiTitle: '',
    date: 'Celebration Event',
    year: 2025,
    location: 'Society Grounds',
    attendeesCount: 450,
    photoCount: 1,
    coverImage: activePhoto.url,
    colorAccent: '#1e3a8a',
    description: activePhoto.caption,
    highlights: [],
    photos: [activePhoto]
  } as FestivalEvent : null);

  if (!currentEvent) return null;

  const [selectedTag, setSelectedTag] = useState<string>('all');

  // AI Face Search state
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [matchedResults, setMatchedResults] = useState<FaceMatchResult[] | null>(null);
  const [userSelfieUrl, setUserSelfieUrl] = useState<string | null>(null);

  // Multi-select & Batch Download state
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; text: string } | null>(null);

  // Convert EventPhoto[] → PhotoItem[] so FaceSearchModal can process them
  const photosAsPhotoItems = useMemo<PhotoItem[]>(() =>
    currentEvent.photos.map((p) => ({
      id: p.id,
      eventId: p.eventId,
      url: p.url,
      thumbnailUrl: p.highResUrl || p.url,
      title: p.caption,
      uploadedAt: p.takenAt,
      tags: p.tags,
      faces: [],
    })),
    [currentEvent.photos]
  );

  const handleFaceResults = (results: FaceMatchResult[], selfieUrl: string) => {
    setMatchedResults(results);
    setUserSelfieUrl(selfieUrl);
    setShowFaceModal(false);
  };

  const clearAIResults = () => {
    setMatchedResults(null);
    setUserSelfieUrl(null);
  };

  const allTags = Array.from(
    new Set(currentEvent.photos.flatMap(p => p.tags))
  ).filter(Boolean);

  // Filter photos by AI matched results OR tag
  const basePhotos = useMemo(() => {
    if (!matchedResults) return currentEvent.photos;
    const matchedIds = new Set(matchedResults.map(r => r.photo.id));
    return currentEvent.photos.filter(p => matchedIds.has(p.id));
  }, [currentEvent.photos, matchedResults]);

  const filteredPhotos = useMemo(() => {
    if (selectedTag === 'all') return basePhotos;
    return basePhotos.filter(p => p.tags.includes(selectedTag));
  }, [basePhotos, selectedTag]);

  // Navigate lightbox
  const currentIndex = activePhoto
    ? filteredPhotos.findIndex(p => p.id === activePhoto.id)
    : -1;

  const handlePrev = () => {
    if (filteredPhotos.length === 0) return;
    const prevIdx = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    onSelectPhoto(filteredPhotos[prevIdx]);
  };

  const handleNext = () => {
    if (filteredPhotos.length === 0) return;
    const nextIdx = (currentIndex + 1) % filteredPhotos.length;
    onSelectPhoto(filteredPhotos[nextIdx]);
  };

  // Toggle selection for batch download
  const toggleSelectPhoto = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPhotoIds.size === filteredPhotos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(filteredPhotos.map(p => p.id)));
    }
  };

  // Direct JPG Download for ALL filtered photos (Mobile & Desktop friendly)
  const handleDownloadAllJpg = async () => {
    if (filteredPhotos.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress({ percent: 5, text: `Preparing all ${filteredPhotos.length} photos (.jpg)...` });

    try {
      await downloadMultiplePhotosDirectJpg(
        filteredPhotos.map((p, i) => ({ id: p.id, url: p.url, title: p.caption || `photo_${i + 1}` })),
        (percent, text) => {
          setDownloadProgress({ percent, text });
        }
      );
    } catch (err) {
      console.error('Download all JPG error:', err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Direct JPG Download for Selected Photos
  const handleDownloadSelectedJpg = async () => {
    const selectedList = filteredPhotos.filter(p => selectedPhotoIds.has(p.id));
    if (selectedList.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress({ percent: 5, text: `Preparing ${selectedList.length} photos (.jpg)...` });

    try {
      await downloadMultiplePhotosDirectJpg(
        selectedList.map((p, i) => ({ id: p.id, url: p.url, title: p.caption || `photo_${i + 1}` })),
        (percent, text) => {
          setDownloadProgress({ percent, text });
        }
      );
    } catch (err) {
      console.error('Download selected JPG error:', err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Batch ZIP Download for ALL filtered photos
  const handleDownloadAllZip = async () => {
    if (filteredPhotos.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress({ percent: 5, text: `Packaging all ${filteredPhotos.length} photos...` });

    try {
      const photoItems: PhotoItem[] = filteredPhotos.map(p => ({
        id: p.id,
        eventId: p.eventId,
        url: p.url,
        thumbnailUrl: p.url,
        title: p.caption,
        uploadedAt: p.takenAt,
        tags: p.tags,
        faces: [],
      }));

      const safeName = (currentEvent.title || 'event')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      
      await downloadPhotosAsZip(
        photoItems,
        `bpscvs_${safeName}_all_${photoItems.length}_photos.zip`,
        (percent, text) => {
          setDownloadProgress({ percent, text });
        }
      );
    } catch (err) {
      console.error('Download all ZIP error:', err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Batch ZIP Download for Selected Photos
  const handleDownloadSelectedZip = async () => {
    const selectedList = filteredPhotos.filter(p => selectedPhotoIds.has(p.id));
    if (selectedList.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress({ percent: 5, text: `Packaging ${selectedList.length} selected photos...` });

    try {
      const photoItems: PhotoItem[] = selectedList.map(p => ({
        id: p.id,
        eventId: p.eventId,
        url: p.url,
        thumbnailUrl: p.url,
        title: p.caption,
        uploadedAt: p.takenAt,
        tags: p.tags,
        faces: [],
      }));

      const safeName = (currentEvent.title || 'event')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');

      await downloadPhotosAsZip(
        photoItems,
        `bpscvs_${safeName}_selected_${photoItems.length}_photos.zip`,
        (percent, text) => {
          setDownloadProgress({ percent, text });
        }
      );
    } catch (err) {
      console.error('Download selected ZIP error:', err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      setIsSelectMode(false);
      setSelectedPhotoIds(new Set());
    }
  };

  // Single Photo Direct File Download (no new tab opened)
  const handleDownloadSingle = async (photo: EventPhoto) => {
    const safeTitle = (currentEvent.title || 'event').toLowerCase().replace(/[^a-z0-9]/g, '_');
    await downloadSinglePhoto(
      {
        id: photo.id,
        eventId: photo.eventId,
        url: photo.url,
        thumbnailUrl: photo.url,
        title: photo.caption,
        uploadedAt: photo.takenAt,
        tags: photo.tags,
        faces: [],
      },
      `bpscvs_${safeTitle}_${photo.id}.jpg`
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      id="event-gallery-modal"
    >
      <div className="relative w-full max-w-6xl rounded-3xl bg-[#0F172A] border border-slate-700/80 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto min-h-[80vh] max-h-[92vh] text-white">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 bg-[#0B132B] border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <img 
                src="/bpscvs-logo.png" 
                alt="BPSCVS Logo" 
                className="w-8 h-8 rounded-full border border-slate-700 shadow shrink-0 object-contain bg-white/5 p-0.5"
              />
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
                {currentEvent.title}
              </h2>
              {currentEvent.hindiTitle && !currentEvent.hindiTitle.includes('उत्सव') && (
                <span className="text-xs text-blue-300 font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30">
                  {currentEvent.hindiTitle}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400 mt-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> {currentEvent.date}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> {currentEvent.location}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentEvent.photos && currentEvent.photos.length > 0 ? currentEvent.photos.length : (currentEvent.photoCount || 0)} Photos Total</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" title="Live gallery" />
              </span>
              {currentEvent.driveUrl && (
                <a
                  href={currentEvent.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.71 3.5L1.15 15l3.43 6l6.55-11.5L7.71 3.5zm1.72 12l3.43 6h13.14l-3.43-6H9.43zm6.86-12l-3.43 6l6.56 11.5l3.43-6l-6.56-11.5z"/>
                  </svg>
                  <span>Google Drive RAW Album</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ✨ AI Find My Photos Button */}
            <button
              id="ai-face-finder-btn"
              onClick={() => setShowFaceModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Find My Photos (AI)</span>
              <span className="sm:hidden">AI Match</span>
            </button>

            <button
              id="close-gallery-modal-btn"
              onClick={() => {
                clearAIResults();
                onClose();
              }}
              className="p-2 sm:p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Action Controls Sub-bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#0B132B]/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Tag Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-400" /> Filter:
            </span>
            <button
              id="tag-all-btn"
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedTag === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              All ({basePhotos.length})
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                id={`tag-filter-${tag}`}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Batch Actions: "Select Photos" toggle + "Download All as ZIP" */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              id="toggle-select-mode-btn"
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedPhotoIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 border ${
                isSelectMode
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isSelectMode ? 'Cancel Select' : 'Select Photos'}</span>
            </button>

            <button
              id="download-all-jpg-btn"
              disabled={isDownloading || filteredPhotos.length === 0}
              onClick={handleDownloadAllJpg}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Download photos directly as JPG files"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All (.JPG)</span>
            </button>

            <button
              id="download-all-zip-btn"
              disabled={isDownloading || filteredPhotos.length === 0}
              onClick={handleDownloadAllZip}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all items-center gap-1.5 border border-slate-700 disabled:opacity-50 text-xs"
              title="Download full album as ZIP archive"
            >
              <Archive className="w-3.5 h-3.5 text-blue-300" />
              <span>ZIP</span>
            </button>
          </div>
        </div>

        {/* Multi-Select Floating Action Bar (Shown when Select Mode is active) */}
        {isSelectMode && (
          <div className="bg-blue-950/80 border-b border-blue-800 px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-200">
                Selected: {selectedPhotoIds.size} of {filteredPhotos.length}
              </span>
              <button
                onClick={toggleSelectAll}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold"
              >
                {selectedPhotoIds.size === filteredPhotos.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={selectedPhotoIds.size === 0 || isDownloading}
                onClick={handleDownloadSelectedJpg}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Selected (.JPG) ({selectedPhotoIds.size})</span>
              </button>

              <button
                disabled={selectedPhotoIds.size === 0 || isDownloading}
                onClick={handleDownloadSelectedZip}
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-all items-center gap-1 disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>ZIP</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-6 bg-[#0B132B]/40">

          {/* AI Match Results Banner */}
          {matchedResults && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-950/60 border border-blue-800">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-blue-200 font-semibold">
                  {matchedResults.length > 0
                    ? `Found ${matchedResults.length} photo${matchedResults.length === 1 ? '' : 's'} with your face!`
                    : 'No matching photos found. Try a clearer selfie.'}
                </span>
              </div>
              <button
                onClick={clearAIResults}
                className="text-xs font-bold text-slate-200 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                ✕ Show All
              </button>
            </div>
          )}

          {/* Active Photo Lightbox Spotlight */}
          {activePhoto && (
            <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center">
              <div className="relative flex-1 w-full flex items-center justify-center min-h-[320px] max-h-[520px] bg-black">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.caption}
                  className="max-h-[500px] w-auto max-w-full object-contain"
                />

                {/* Society Seal Watermark Overlay on Preview */}
                <div className="absolute bottom-3 right-3 pointer-events-none flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700">
                  <img src="/bpscvs-logo.png" alt="BPSCVS Seal" className="w-4 h-4 rounded-full object-contain" />
                  <span className="text-[10px] font-bold text-slate-300">BPSCVS Jaipur</span>
                </div>

                {/* Left/Right Nav Arrows */}
                {filteredPhotos.length > 1 && (
                  <>
                    <button
                      id="lightbox-prev-btn"
                      onClick={handlePrev}
                      className="absolute left-3 p-2.5 rounded-full bg-black/70 hover:bg-slate-900 text-white border border-slate-700 transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      id="lightbox-next-btn"
                      onClick={handleNext}
                      className="absolute right-3 p-2.5 rounded-full bg-black/70 hover:bg-slate-900 text-white border border-slate-700 transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Photo Details Sidebar */}
              <div className="w-full md:w-80 p-5 bg-[#0B132B] border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between self-stretch">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                    Captured Moment
                  </span>
                  <p className="text-sm font-semibold text-white mb-3">
                    {activePhoto.caption}
                  </p>

                  <div className="space-y-2 text-xs text-slate-400 mb-4">
                    {activePhoto.photographer && (
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-400" />
                        <span>Shot by: {activePhoto.photographer}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>Time: {activePhoto.takenAt}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {activePhoto.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-800">
                  {/* Clean Direct HD File Download via Blob (No new page opened!) */}
                  <button
                    id="download-lightbox-photo"
                    onClick={() => handleDownloadSingle(activePhoto)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>

                  <button
                    id="share-lightbox-photo"
                    onClick={() => {
                      const text = encodeURIComponent(`Photo from BPSCVS "${currentEvent.title}": ${activePhoto.caption} ${activePhoto.url}`);
                      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Photo Gallery Grid */}
          {filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-4">
                <Camera className="w-9 h-9 text-slate-500" />
              </div>
              <p className="text-base font-semibold text-slate-300 mb-1">No photos yet</p>
              <p className="text-xs text-slate-500 max-w-xs">
                {matchedResults
                  ? 'No matching faces found. Try uploading a clearer selfie.'
                  : 'Photos from this event will appear here once uploaded by the photographer.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredPhotos.map((photo) => {
                const isSelected = activePhoto?.id === photo.id;
                const isChecked = selectedPhotoIds.has(photo.id);

                return (
                  <div
                    key={photo.id}
                    id={`gallery-thumb-${photo.id}`}
                    onClick={(e) => {
                      if (isSelectMode) {
                        toggleSelectPhoto(photo.id, e);
                      } else {
                        onSelectPhoto(photo);
                      }
                    }}
                    className={`group relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                      isChecked
                        ? 'border-blue-400 ring-2 ring-blue-400/80 scale-[0.98]'
                        : isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/50 scale-[0.98]'
                        : 'border-slate-800 hover:border-blue-500/80 hover:scale-[1.02]'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Multi-Select Checkbox Badge */}
                    {isSelectMode && (
                      <div 
                        onClick={(e) => toggleSelectPhoto(photo.id, e)}
                        className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-black/70 backdrop-blur-sm border border-slate-600 transition-transform active:scale-90"
                      >
                        {isChecked ? (
                          <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border border-white/60 bg-black/40" />
                        )}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                      <p className="text-[11px] font-medium text-slate-200 truncate">
                        {photo.caption}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Progress Modal for ZIP packaging */}
        {isDownloading && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-2xl bg-[#0F172A] border border-slate-700 p-6 text-center shadow-2xl">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Creating ZIP Archive</h3>
              <p className="text-xs text-slate-400 mb-4">{downloadProgress?.text || 'Downloading images...'}</p>
              
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700 mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
                  style={{ width: `${downloadProgress?.percent || 15}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-blue-400">{downloadProgress?.percent || 15}%</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Face Search Modal */}
      {showFaceModal && (
        <FaceSearchModal
          photos={photosAsPhotoItems}
          onClose={() => setShowFaceModal(false)}
          onResultsFound={handleFaceResults}
        />
      )}
    </div>
  );
};
