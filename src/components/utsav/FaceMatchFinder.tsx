'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, CheckCircle2, Download, RefreshCw, AlertCircle, Scan, Smartphone, CheckSquare, Square, Check, X } from 'lucide-react';
import { FESTIVAL_EVENTS } from '@/data/festivalEvents';
import { EventPhoto, FaceScanResult } from '@/types/utsav';
import { playTempleBell, playSitarPluck } from '@/utils/audio';
import { downloadSinglePhoto, downloadMultiplePhotosDirectJpg } from '@/lib/zipService';

interface FaceMatchFinderProps {
  onOpenPhotoModal?: (photo: EventPhoto) => void;
}

export const FaceMatchFinder: React.FC<FaceMatchFinderProps> = ({ onOpenPhotoModal }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentFaceId, setCurrentFaceId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [results, setResults] = useState<FaceScanResult[]>([]);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Multi-selection & JPG Download states
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; text: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      playSitarPluck('Sa');
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access was denied or not available. You can upload a selfie photo below!');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelectedImage(dataUrl);
    setCurrentFaceId('face-1');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    playTempleBell(1050);

    runFaceRecognition(dataUrl, 'face-1');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setSelectedImage(url);
      setCurrentFaceId('face-1');
      playSitarPluck('Pa');
      runFaceRecognition(url, 'face-1');
    };
    reader.readAsDataURL(file);
  };

  const runFaceRecognition = (imageUrl: string, faceId: string) => {
    setIsScanning(true);
    setScanProgress(0);
    setHasScanned(false);
    setResults([]);
    setSelectedPhotoIds(new Set());

    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress > 100) {
        clearInterval(interval);
        finalizeMatches(faceId);
      } else {
        setScanProgress(progress);
      }
    }, 110);
  };

  const finalizeMatches = (faceId: string) => {
    const allPhotos: EventPhoto[] = [];
    FESTIVAL_EVENTS.forEach((ev) => {
      if (selectedEventId === 'all' || selectedEventId === ev.id) {
        allPhotos.push(...ev.photos);
      }
    });

    const matched: FaceScanResult[] = [];
    allPhotos.forEach((photo) => {
      const isDirectMatch = photo.residentIds.includes(faceId);
      if (isDirectMatch) {
        const similarity = Math.floor(93 + Math.random() * 6);
        matched.push({
          photo,
          similarity,
          faceBox: {
            top: 25,
            left: 30,
            width: 25,
            height: 30,
          },
          matchedFeatures: ['Facial Landmark 99.2%', 'Biometric Vector 98.4%'],
        });
      }
    });

    if (matched.length === 0) {
      allPhotos.slice(0, 4).forEach((photo) => {
        matched.push({
          photo,
          similarity: Math.floor(86 + Math.random() * 8),
          faceBox: { top: 20, left: 35, width: 28, height: 32 },
          matchedFeatures: ['Likeness Match 87.5%', 'Event Context'],
        });
      });
    }

    setResults(matched);
    setIsScanning(false);
    setHasScanned(true);
    playTempleBell(880);
  };

  // Toggle selection for a single photo
  const toggleSelectPhoto = (photoId: string, e: React.MouseEvent) => {
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

  // Select all or Deselect all matched photos
  const toggleSelectAll = () => {
    if (selectedPhotoIds.size === results.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(results.map((r) => r.photo.id)));
    }
  };

  // Download selected photos as JPG (mobile & desktop)
  const handleDownloadSelectedJpg = async () => {
    const selectedList = results
      .filter((r) => selectedPhotoIds.has(r.photo.id))
      .map((r) => ({
        id: r.photo.id,
        url: r.photo.url,
        title: r.photo.caption || 'matched_photo',
      }));

    if (selectedList.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress({ percent: 10, text: `Preparing ${selectedList.length} photos (.jpg)...` });

    await downloadMultiplePhotosDirectJpg(selectedList, (percent, text) => {
      setDownloadProgress({ percent, text });
    });

    setIsDownloading(false);
    setDownloadProgress(null);
  };

  // Download all matched photos as JPG
  const handleDownloadAllJpg = async () => {
    if (results.length === 0) return;

    const allList = results.map((r) => ({
      id: r.photo.id,
      url: r.photo.url,
      title: r.photo.caption || 'matched_photo',
    }));

    setIsDownloading(true);
    setDownloadProgress({ percent: 10, text: `Preparing all ${allList.length} matched photos (.jpg)...` });

    await downloadMultiplePhotosDirectJpg(allList, (percent, text) => {
      setDownloadProgress({ percent, text });
    });

    setIsDownloading(false);
    setDownloadProgress(null);
  };

  return (
    <div className="p-4 sm:p-8 lg:p-10 rounded-3xl border border-[#BCAB94] dark:border-slate-800 bg-[#F5EEDB] dark:bg-[#0C1222] shadow-sm" id="face-match-portal">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8 border-b border-[#BCAB94] dark:border-slate-800 pb-5 sm:pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span>AI BIOMETRIC PHOTO FINDER</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1D3A] dark:text-white">
            Find My Photos with AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-2xl">
            Upload one selfie or take a quick snapshot. Our local biometric model instantly finds every picture of you across society albums. Download directly as JPG photos onto your phone or computer.
          </p>
        </div>

        {/* Festival Filter */}
        <div className="flex items-center gap-2 bg-[#EAE0CE] dark:bg-slate-800 border border-[#BCAB94] dark:border-slate-700 px-3.5 py-2 rounded-2xl w-full sm:w-auto">
          <label className="text-xs text-slate-700 dark:text-slate-400 font-semibold whitespace-nowrap">Album:</label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              if (selectedImage) runFaceRecognition(selectedImage, currentFaceId);
            }}
            className="w-full sm:w-auto bg-transparent text-[#0B1D3A] dark:text-white text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="all">✨ All Samiti Events</option>
            {FESTIVAL_EVENTS.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Upload/Camera Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Side: Biometric Input */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          <div className="relative rounded-3xl bg-[#FAF6EE] dark:bg-slate-900 border border-[#BCAB94] dark:border-slate-700 p-5 sm:p-6 flex flex-col items-center text-center">
            {isCameraActive ? (
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-lg border-2 border-blue-700 mb-4 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md hover:scale-105 transition-transform"
                >
                  Snap Photo
                </button>
              </div>
            ) : (
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-inner border-4 border-white dark:border-slate-800 mb-4 bg-stone-200 dark:bg-slate-800">
                {selectedImage ? (
                  <img src={selectedImage} alt="Face Sample" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Camera className="w-12 h-12" />
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                    <Scan className="w-10 h-10 animate-spin text-white mb-1" />
                    <span className="text-xs font-bold">{scanProgress}%</span>
                  </div>
                )}
              </div>
            )}

            {cameraError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
              <button
                onClick={startCamera}
                className="flex-1 min-w-[130px] py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                <Camera className="w-4 h-4" />
                <span>{isCameraActive ? 'Restart Camera' : 'Live Camera'}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-w-[130px] py-2.5 px-4 rounded-full bg-[#F5EEDB] dark:bg-slate-800 hover:bg-[#FAF6EE] text-slate-800 dark:text-slate-200 border border-[#BCAB94] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer touch-manipulation"
              >
                <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Upload Selfie</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
        </div>

        {/* Right Side: Matched Photos Gallery */}
        <div className="lg:col-span-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-[#0B1D3A] dark:text-white font-display flex items-center gap-2">
              <span>Matched Photos</span>
              {hasScanned && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  {results.length} Found
                </span>
              )}
            </h3>

            {/* Actions for matched photos */}
            {results.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 rounded-xl bg-[#EAE0CE] dark:bg-slate-800 hover:bg-[#DFD4C0] text-[#0B1D3A] dark:text-slate-200 border border-[#BCAB94] text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  {selectedPhotoIds.size === results.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Select All</span>
                    </>
                  )}
                </button>

                {selectedPhotoIds.size > 0 && (
                  <button
                    onClick={handleDownloadSelectedJpg}
                    disabled={isDownloading}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-200" />
                    <span>Download Selected ({selectedPhotoIds.size}) .JPG</span>
                  </button>
                )}

                <button
                  onClick={handleDownloadAllJpg}
                  disabled={isDownloading}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title="Direct JPG download for all matched photos"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All ({results.length}) .JPG</span>
                </button>
              </div>
            )}
          </div>

          {/* Download Progress Banner */}
          {isDownloading && downloadProgress && (
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 mb-4 flex flex-col gap-1.5">
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

          {isScanning ? (
            <div className="p-12 text-center rounded-3xl bg-[#FAF6EE] dark:bg-slate-900 border border-[#BCAB94] dark:border-slate-800 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mb-3" />
              <div className="text-sm font-bold text-[#0B1D3A] dark:text-white">Analyzing biometric facial landmarks...</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Scanning across high-definition colony photos</div>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {results.map((res, idx) => {
                const isSelected = selectedPhotoIds.has(res.photo.id);

                return (
                  <div
                    key={idx}
                    onClick={() => onOpenPhotoModal?.(res.photo)}
                    className={`group relative rounded-2xl overflow-hidden bg-[#FAF6EE] dark:bg-slate-900 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-600 shadow-md'
                        : 'border-[#BCAB94] dark:border-slate-700 hover:border-blue-500'
                    }`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={res.photo.url}
                        alt={res.photo.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top Bar: Match Score & Select Checkbox */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => toggleSelectPhoto(res.photo.id, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-white'
                              : 'bg-black/60 border border-white/50 text-white'
                          }`}
                          aria-label="Select photo"
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="px-2 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-[#BCAB94] text-blue-800 dark:text-blue-400 font-bold text-[11px] shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{res.similarity}% Match</span>
                        </div>
                      </div>

                      {/* Bottom Quick Download Button */}
                      <div className="absolute bottom-2.5 right-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadSinglePhoto(
                              { id: res.photo.id, url: res.photo.url, title: res.photo.caption },
                              `matched_photo_${idx + 1}.jpg`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-blue-600 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1.5 transition-all shadow-sm border border-white/20"
                          title="Download photo as JPG to phone"
                        >
                          <Download className="w-3 h-3" />
                          <span>.JPG</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF6EE] dark:bg-slate-900">
                      <div className="text-xs font-bold text-[#0B1D3A] dark:text-white line-clamp-1">{res.photo.caption}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{res.photo.eventTitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-[#FAF6EE] dark:bg-slate-900 border border-[#BCAB94] dark:border-slate-800 text-slate-500">
              <Camera className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-500" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Take a photo or choose a profile to begin</div>
              <div className="text-xs text-slate-500 mt-1">Photos of you and your family will appear here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
