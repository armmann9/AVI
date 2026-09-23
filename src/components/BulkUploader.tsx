'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Check,
  RotateCcw,
  Link2,
  BookOpen,
  Cpu
} from 'lucide-react';
import { PhotoItem } from '@/lib/types';
import { savePhotos } from '@/lib/db';
import { uploadPhotoToCloud, isCloudConfigured } from '@/lib/supabase';
import { detectFacesAndExtractEmbeddings, createImageElementFromBlob } from '@/lib/faceRecognition';

interface BulkUploaderProps {
  eventId: string;
  onUploadComplete: (uploadedCount: number) => void;
}

interface UploadQueueItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  previewUrl: string;
  progress: number; // 0 to 100
  status: 'pending' | 'uploading' | 'indexing_faces' | 'completed' | 'error' | 'skipped';
  errorMessage?: string;
  facesCount?: number;
  isDriveSource?: boolean;
}

export default function BulkUploader({ eventId, onUploadComplete }: BulkUploaderProps) {
  // Tabs: 'local' (device files) or 'drive' (Google Drive link import)
  const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');

  // Queue state
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTag, setCurrentTag] = useState('Highlights');
  const [sessionOnlyWarning, setSessionOnlyWarning] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // Granular progress states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'uploading' | 'indexing' | 'persisting' | 'done'>('idle');
  const [completedCount, setCompletedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Google Drive import state
  const [driveLinksInput, setDriveLinksInput] = useState('');
  const [isParsingDrive, setIsParsingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── File selection handler ─────────────────────────────────────────────────
  const handleFileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const existingNames = new Set(queue.map(q => q.name));
    const newItems: UploadQueueItem[] = [];

    Array.from(files).forEach((file, idx) => {
      // Check for duplicate in current queue
      if (existingNames.has(file.name)) {
        return; // skip duplicate in same batch
      }
      existingNames.add(file.name);

      newItems.push({
        id: `upload-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'pending',
      });
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  const calculateTotalSizeMB = () => {
    const totalBytes = queue.reduce((sum, item) => sum + item.size, 0);
    return (totalBytes / (1024 * 1024)).toFixed(1);
  };

  // ─── Main Crash-Resistant Upload & AI Processing Engine ─────────────────────
  const handleStartUpload = async (onlyFailed = false) => {
    const itemsToProcess = queue.filter(item => 
      onlyFailed ? item.status === 'error' : item.status === 'pending'
    );

    if (itemsToProcess.length === 0 || isUploading) return;

    setIsUploading(true);
    setCurrentPhase('uploading');

    const isCloud = isCloudConfigured();
    const batchSize = 2; // Controlled parallelism prevents WebGL / browser memory crash
    const newPhotosToSave: PhotoItem[] = [];
    
    let localCompleted = 0;
    let localFailed = 0;

    for (let i = 0; i < itemsToProcess.length; i += batchSize) {
      const currentBatch = itemsToProcess.slice(i, i + batchSize);

      await Promise.all(
        currentBatch.map(async (item, batchIdx) => {
          const overallIndex = i + batchIdx + 1;
          setCurrentIndex(overallIndex);
          setCurrentFileName(item.name);

          try {
            // STEP 1: Uploading Photo
            updateQueueItemStatus(item.id, 'uploading', 30);
            setCurrentPhase('uploading');

            let photoUrl = item.previewUrl;
            let thumbnailUrl = item.previewUrl;

            if (item.file) {
              if (isCloud) {
                const uploadRes = await uploadPhotoToCloud(item.file, item.file.name, eventId);
                if (uploadRes.publicUrl) {
                  photoUrl = uploadRes.publicUrl;
                  thumbnailUrl = uploadRes.publicUrl;
                } else {
                  setSessionOnlyWarning(true);
                }
              } else {
                setSessionOnlyWarning(true);
              }
            } else if (item.isDriveSource) {
              // Drive direct CDN source
              photoUrl = item.previewUrl;
              thumbnailUrl = item.previewUrl;
            }

            // STEP 2: AI Facial Vector Indexing (SSD-MobileNet)
            updateQueueItemStatus(item.id, 'indexing_faces', 65);
            setCurrentPhase('indexing');

            let faceDescriptors: PhotoItem['faces'] = [];
            try {
              let imgElement: HTMLImageElement | null = null;
              if (item.file) {
                imgElement = await createImageElementFromBlob(item.file);
              } else if (item.previewUrl) {
                imgElement = new Image();
                imgElement.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                  imgElement!.onload = resolve;
                  imgElement!.onerror = reject;
                  imgElement!.src = item.previewUrl;
                });
              }

              if (imgElement) {
                const detections = await detectFacesAndExtractEmbeddings(imgElement);
                faceDescriptors = detections.map((d) => ({
                  box: d.box,
                  descriptor: d.descriptor,
                  confidence: d.confidence,
                }));
              }
            } catch (aiErr) {
              // Non-fatal: AI detection warning should not halt upload
              console.warn(`[AI Indexing] Face detection non-fatal warning for ${item.name}:`, aiErr);
            }

            // STEP 3: Complete Item
            updateQueueItemStatus(item.id, 'completed', 100, faceDescriptors?.length);
            localCompleted++;
            setCompletedCount(prev => prev + 1);

            const newPhoto: PhotoItem = {
              id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              eventId,
              url: photoUrl,
              thumbnailUrl,
              title: item.name.replace(/\.[^/.]+$/, ''),
              sizeBytes: item.size,
              uploadedAt: new Date().toISOString(),
              tags: currentTag ? [currentTag] : ['Event'],
              faces: faceDescriptors,
            };

            newPhotosToSave.push(newPhoto);

          } catch (itemErr: any) {
            // ISOLATE ERROR: never allow one failing photo to crash the whole batch
            console.error(`[BulkUploader] Error processing photo ${item.name}:`, itemErr);
            localFailed++;
            setFailedCount(prev => prev + 1);
            updateQueueItemStatus(
              item.id,
              'error',
              0,
              undefined,
              itemErr?.message || 'Network or decoding error'
            );
          }
        })
      );
    }

    // STEP 4: Persist batch safely to DB / LocalStorage
    if (newPhotosToSave.length > 0) {
      setCurrentPhase('persisting');
      try {
        await savePhotos(newPhotosToSave);
      } catch (saveErr) {
        console.error('[BulkUploader] Failed to save photo metadata batch:', saveErr);
      }
    }

    setIsUploading(false);
    setCurrentPhase('done');
    onUploadComplete(newPhotosToSave.length);
  };

  // ─── Queue item status helper ───────────────────────────────────────────────
  const updateQueueItemStatus = (
    id: string,
    status: UploadQueueItem['status'],
    progress: number,
    facesCount?: number,
    errorMessage?: string
  ) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              progress,
              facesCount: facesCount !== undefined ? facesCount : item.facesCount,
              errorMessage: errorMessage || item.errorMessage
            }
          : item
      )
    );
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearQueue = () => {
    setQueue([]);
    setCompletedCount(0);
    setFailedCount(0);
    setCurrentIndex(0);
    setCurrentPhase('idle');
  };

  // ─── Google Drive Link Parser ──────────────────────────────────────────────
  const extractDriveFileId = (url: string): string | null => {
    // Pattern 1: /file/d/FILE_ID/view
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) return match1[1];
    // Pattern 2: id=FILE_ID
    const match2 = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match2) return match2[1];
    // Pattern 3: direct raw ID
    if (/^[a-zA-Z0-9_-]{25,}$/.test(url.trim())) return url.trim();
    return null;
  };

  const handleParseDriveLinks = () => {
    setDriveError(null);
    const rawLines = driveLinksInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (rawLines.length === 0) {
      setDriveError('Please paste at least one Google Drive link or file ID.');
      return;
    }

    setIsParsingDrive(true);
    const addedItems: UploadQueueItem[] = [];

    rawLines.forEach((line, idx) => {
      const fileId = extractDriveFileId(line);
      if (fileId) {
        // Construct Google Drive public thumbnail URL (bypass CORS for browser display)
        const directUrl = `https://lh3.googleusercontent.com/d/${fileId}=s1600`;
        addedItems.push({
          id: `drive-${fileId}-${Date.now()}-${idx}`,
          name: `Drive_Photo_${fileId.substring(0, 8)}.jpg`,
          size: 1024 * 1024 * 2, // Estimated 2MB
          previewUrl: directUrl,
          progress: 0,
          status: 'pending',
          isDriveSource: true,
        });
      }
    });

    if (addedItems.length === 0) {
      setDriveError('Could not extract valid Google Drive file IDs. Make sure links are in format: https://drive.google.com/file/d/FILE_ID/view');
    } else {
      setQueue(prev => [...prev, ...addedItems]);
      setDriveLinksInput('');
      setActiveTab('local'); // Switch to queue view to inspect and upload
    }
    setIsParsingDrive(false);
  };

  const totalInQueue = queue.length;
  const pendingInQueue = queue.filter(q => q.status === 'pending').length;
  const completedInQueue = queue.filter(q => q.status === 'completed').length;
  const errorInQueue = queue.filter(q => q.status === 'error').length;
  const overallPercentage = totalInQueue > 0 ? Math.round((completedInQueue / totalInQueue) * 100) : 0;

  return (
    <div className="space-y-6 text-[#0F172A]">
      {/* ── Header & Tag selector ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-display font-bold text-[#0F172A]">
              Bulk Photo Uploader
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
              High-Capacity Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Safe high-speed photo ingestion with background AI face embeddings &amp; duplicate protection.
          </p>
        </div>

        {/* Tag selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Category Tag:</span>
          <input
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            placeholder="e.g. Aarti, Sangeet, Mahaprasad"
            className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-300 text-[#0F172A] text-xs focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── Admin Safety Precautions & Tutorial Accordion ───────────────── */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden shadow-xs transition-all">
        <button
          type="button"
          onClick={() => setShowTutorial(!showTutorial)}
          className="w-full px-5 py-3.5 flex items-center justify-between bg-stone-100/70 hover:bg-stone-100 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
              Admin Upload Safety Rules &amp; Best Practices
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>{showTutorial ? 'Hide Rules' : 'View Safety Rules'}</span>
            {showTutorial ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
          </div>
        </button>

        {showTutorial && (
          <div className="p-5 text-xs text-slate-700 space-y-3 border-t border-stone-200 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-blue-700" />
                  <span>1. Safe Batch Sizing (50–150 Photos)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Uploading in batches of <strong>50 to 150 photos</strong> prevents browser memory exhaustion and keeps AI face extraction swift and responsive.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-700" />
                  <span>2. Recommended Dimensions (1080p – 2K)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Use web-optimized JPG/PNG/WebP photos (1 to 5 MB each). Avoid uploading 50MB uncompressed DSLR RAW files directly; use the <strong>Google Drive RAW Album link</strong> for full RAW archives.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
                  <span>3. Keep This Tab Active During Upload</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  AI facial recognition runs client-side using WebAssembly. Browsers throttle inactive background tabs. Keep this tab in focus until the progress bar reaches 100%.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                  <span>4. Crash-Proof Error Isolation</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  If one image fails due to corrupt bytes or a network drop, the uploader logs the failed item and allows you to retry just the failed photos with 1 click.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Storage Warning Banner (Quota safety) ────────────────────────── */}
      {sessionOnlyWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed space-y-1">
            <p className="font-bold text-amber-950">
              Cloud Storage Not Configured — Session-Only Mode Active
            </p>
            <p>
              Photos are stored in memory for this browser session. To protect against the browser&apos;s 5MB local storage quota limit, full image data is not saved to localStorage.
            </p>
            <p className="text-amber-800">
              To persist photos across refreshes and devices, configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab Switcher: Local Files vs Google Drive Link ──────────────── */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('local')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
            activeTab === 'local'
              ? 'bg-white border-stone-200 text-blue-900 shadow-xs'
              : 'border-transparent text-slate-600 hover:text-[#0F172A] hover:bg-stone-50'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload from Computer / Device</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('drive')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
            activeTab === 'drive'
              ? 'bg-white border-stone-200 text-blue-900 shadow-xs'
              : 'border-transparent text-slate-600 hover:text-[#0F172A] hover:bg-stone-50'
          }`}
        >
          <Link2 className="w-3.5 h-3.5 text-blue-700" />
          <span>Import from Google Drive</span>
        </button>
      </div>

      {/* ── TAB 1: Local File Drag & Drop ────────────────────────────────── */}
      {activeTab === 'local' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileSelection(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-stone-300 hover:border-blue-600 rounded-3xl p-8 sm:p-12 text-center bg-stone-50/70 hover:bg-blue-50/40 transition-all cursor-pointer shadow-inner group"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4 text-blue-700 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-[#0F172A] mb-1">
            Drag &amp; Drop event photos here, or click to browse
          </h4>
          <p className="text-xs text-slate-500">
            Supports 200+ images • JPG, PNG, WEBP, HEIC • Auto face embedding
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelection(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* ── TAB 2: Google Drive Ingestion Tool ───────────────────────────── */}
      {activeTab === 'drive' && (
        <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#0F172A]">
                Bulk Ingest Photos from Google Drive
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Paste public Google Drive photo links (e.g. <code className="bg-stone-200 px-1 py-0.5 rounded text-blue-950 font-mono">https://drive.google.com/file/d/FILE_ID/view</code>) or file IDs. Our engine will convert them to direct image streams and run AI facial recognition on each photo!
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Google Drive Photo URLs or File IDs (One per line or comma-separated)
            </label>
            <textarea
              rows={4}
              value={driveLinksInput}
              onChange={(e) => setDriveLinksInput(e.target.value)}
              placeholder="https://drive.google.com/file/d/1A2b3C4d5E...&#10;https://drive.google.com/file/d/6F7g8H9i0J...&#10;or 1A2b3C4d5E6F7g8H9i0J..."
              className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>

          {driveError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{driveError}</span>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <p className="text-[11px] text-slate-500">
              💡 Tip: Make sure your Drive files are set to <strong>&ldquo;Anyone with the link can view&rdquo;</strong> in Google Drive sharing settings.
            </p>
            <button
              type="button"
              onClick={handleParseDriveLinks}
              disabled={isParsingDrive || !driveLinksInput.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              {isParsingDrive ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing Drive Links...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Add Drive Photos to Upload Queue</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Active Queue & Granular Progress Section ────────────────────── */}
      {queue.length > 0 && (
        <div className="space-y-4">
          {/* Status summary banner */}
          <div className="flex items-center justify-between bg-stone-50 border border-stone-200 px-4 py-3 rounded-2xl flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-blue-700" />
              <span className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                {queue.length} Photos Selected ({calculateTotalSizeMB()} MB)
              </span>
              {completedInQueue > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 font-bold border border-blue-200">
                  {completedInQueue} Uploaded
                </span>
              )}
              {errorInQueue > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
                  {errorInQueue} Failed
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleClearQueue}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-slate-700 text-xs font-semibold transition-all"
                >
                  Clear Queue
                </button>
              )}

              {errorInQueue > 0 && !isUploading && (
                <button
                  type="button"
                  onClick={() => handleStartUpload(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Retry Failed ({errorInQueue})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleStartUpload(false)}
                disabled={isUploading || pendingInQueue === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing ({completedInQueue} / {totalInQueue})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                    <span>Start Bulk Upload &amp; AI Indexing ({pendingInQueue})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Granular "Photo 1 of 150" Live Progress Bar ───────────────── */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-700 animate-spin" />
                  <span>
                    Uploading Photo {Math.min(currentIndex, totalInQueue)} of {totalInQueue}
                    {currentFileName ? ` — ${currentFileName}` : ''}
                  </span>
                </div>
                <span className="text-blue-900 text-sm font-black font-display">
                  {overallPercentage}%
                </span>
              </div>

              {/* Progress track */}
              <div className="h-3 bg-stone-200 rounded-full overflow-hidden border border-stone-300 relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 transition-all duration-300"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>

              {/* Dynamic sub-status indicator */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                <span>
                  {currentPhase === 'uploading' && '⬆️ Direct Stream Uploading to Cloud Vault...'}
                  {currentPhase === 'indexing' && '🧠 AI Biometric Facial Extraction (128-d vector)...'}
                  {currentPhase === 'persisting' && '💾 Committing Gallery Record to Database...'}
                  {currentPhase === 'done' && '✅ Batch Complete!'}
                </span>
                <span className="font-semibold text-blue-900">
                  {completedInQueue} of {totalInQueue} Completed
                </span>
              </div>
            </div>
          )}

          {/* ── Post-Upload Completion Summary ────────────────────────────── */}
          {currentPhase === 'done' && !isUploading && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-blue-950">
                  Batch finished: {completedInQueue} photo{completedInQueue === 1 ? '' : 's'} successfully uploaded &amp; AI indexed!
                  {errorInQueue > 0 ? ` (${errorInQueue} failed — click Retry above)` : ''}
                </span>
              </div>
            </div>
          )}

          {/* ── Thumbnails Preview Strip ──────────────────────────────────── */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-80 overflow-y-auto p-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className={`relative rounded-xl overflow-hidden aspect-square bg-stone-100 border transition-all ${
                  item.status === 'completed'
                    ? 'border-blue-600'
                    : item.status === 'error'
                    ? 'border-red-500'
                    : 'border-stone-300'
                }`}
              >
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />

                {/* Status Overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-1 text-center">
                  {item.status === 'completed' && (
                    <div>
                      <CheckCircle2 className="w-5 h-5 text-blue-400 mx-auto" />
                      {item.facesCount !== undefined && (
                        <div className="text-[10px] text-white mt-0.5 font-bold">
                          {item.facesCount} {item.facesCount === 1 ? 'face' : 'faces'}
                        </div>
                      )}
                    </div>
                  )}

                  {item.status === 'uploading' && (
                    <div className="text-center">
                      <RefreshCw className="w-5 h-5 text-white animate-spin mx-auto" />
                      <div className="text-[9px] text-white mt-0.5">Uploading</div>
                    </div>
                  )}

                  {item.status === 'indexing_faces' && (
                    <div className="text-center">
                      <Sparkles className="w-5 h-5 text-blue-300 animate-pulse mx-auto" />
                      <div className="text-[9px] text-blue-200 mt-0.5">AI Faces</div>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className="text-center">
                      <AlertCircle className="w-5 h-5 text-red-400 mx-auto" />
                      <div className="text-[9px] text-red-200 mt-0.5" title={item.errorMessage}>
                        Failed
                      </div>
                    </div>
                  )}

                  {item.status === 'pending' && !isUploading && (
                    <button
                      type="button"
                      onClick={() => removeQueueItem(item.id)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 transition-all"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
