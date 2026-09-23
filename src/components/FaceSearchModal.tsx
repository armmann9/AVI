'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, AlertCircle, Scan } from 'lucide-react';
import { PhotoItem, FaceMatchResult } from '@/lib/types';
import {
  extractSelfieDescriptor,
  detectFacesAndExtractEmbeddings,
  evaluateFaceMatch,
  loadFaceApiModels,
} from '@/lib/faceRecognition';

interface FaceSearchModalProps {
  photos: PhotoItem[];
  onClose: () => void;
  onResultsFound: (results: FaceMatchResult[], selfieDataUrl: string) => void;
}

export default function FaceSearchModal({ photos, onClose, onResultsFound }: FaceSearchModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanningProgress, setScanningProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Position your face in the frame');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Preload face models when modal mounts
  useEffect(() => {
    loadFaceApiModels();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        setActiveTab('upload');
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setActiveTab('upload');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror snapshot for selfie feel
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
      runFaceSearch(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      runFaceSearch(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const runFaceSearch = async (selfieUrl: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Analyzing facial geometry & landmarks...');
    setScanningProgress(10);

    try {
      // Create image element from selfie URL
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = selfieUrl;
      });

      // Extract descriptor vector from user's selfie
      const selfieFace = await extractSelfieDescriptor(img);
      if (!selfieFace) {
        throw new Error('No clear face detected in the photo. Please try taking a brighter, front-facing selfie.');
      }

      setStatusMessage(`Scanning ${photos.length} event photos with biometric matching...`);
      setScanningProgress(25);

      const matchedResults: FaceMatchResult[] = [];
      const totalPhotos = photos.length;

      // Scan through all photos in the event
      for (let i = 0; i < totalPhotos; i++) {
        const photo = photos[i];
        setScanningProgress(25 + Math.round(((i + 1) / totalPhotos) * 70));

        // 1. If photo already has indexed face descriptors from upload
        if (photo.faces && photo.faces.length > 0) {
          let highestScore = 0;
          let bestFaceBox = undefined;
          let isMatch = false;

          for (const face of photo.faces) {
            const evaluation = evaluateFaceMatch(selfieFace.descriptor, face.descriptor);
            if (evaluation.isMatch && evaluation.similarityScore > highestScore) {
              highestScore = evaluation.similarityScore;
              bestFaceBox = face.box;
              isMatch = true;
            }
          }

          if (isMatch) {
            matchedResults.push({
              photo,
              similarity: highestScore,
              matchedFaceBox: bestFaceBox,
            });
          }
        } else {
          // 2. Dynamic in-browser face matching for unindexed photo
          try {
            const targetImg = new Image();
            targetImg.crossOrigin = 'anonymous';
            await new Promise((res) => {
              targetImg.onload = res;
              targetImg.onerror = () => res(null);
              targetImg.src = photo.url || photo.thumbnailUrl;
            });

            const detectedFaces = await detectFacesAndExtractEmbeddings(targetImg);
            let highestScore = 0;
            let bestFaceBox = undefined;
            let isMatch = false;

            for (const face of detectedFaces) {
              const evaluation = evaluateFaceMatch(selfieFace.descriptor, face.descriptor);
              if (evaluation.isMatch && evaluation.similarityScore > highestScore) {
                highestScore = evaluation.similarityScore;
                bestFaceBox = face.box;
                isMatch = true;
              }
            }

            if (isMatch) {
              matchedResults.push({
                photo,
                similarity: highestScore,
                matchedFaceBox: bestFaceBox,
              });
            }
          } catch (e) {
            // Ignore single photo processing error
          }
        }
      }

      // Sort matches descending by highest similarity score
      matchedResults.sort((a, b) => b.similarity - a.similarity);

      setScanningProgress(100);
      setStatusMessage(
        matchedResults.length > 0
          ? `Found ${matchedResults.length} photo${matchedResults.length === 1 ? '' : 's'} containing you!`
          : 'Face scan complete. 0 matching photos found.'
      );

      // Trigger celebratory confetti only when real matches exist
      if (matchedResults.length > 0 && typeof window !== 'undefined') {
        try {
          const confettiModule = (await import('canvas-confetti')).default;
          confettiModule({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6D1F2B', '#E29A34', '#F8F1E4'],
          });
        } catch (e) {}
      }

      setTimeout(() => {
        onResultsFound(matchedResults, selfieUrl);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Face detection failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIsProcessing(false);
    setErrorMessage(null);
    setStatusMessage('Position your face in the frame');
    setScanningProgress(0);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 250,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '28px',
        position: 'relative',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
        border: '1px solid rgba(6, 182, 212, 0.4)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            color: 'var(--text-muted)',
            padding: '6px',
            borderRadius: '50%',
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(6, 182, 212, 0.4)',
          }}>
            <Scan size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              AI <span className="gradient-cyan-text">Face Matcher</span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Take a selfie or upload a photo to find every picture you are in.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        {!capturedImage && (
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '10px',
            margin: '16px 0',
          }}>
            <button
              onClick={() => { setActiveTab('camera'); startCamera(); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: activeTab === 'camera' ? 'var(--accent-gradient)' : 'transparent',
                color: '#fff',
                transition: 'all 0.2s',
              }}
            >
              <Camera size={15} />
              <span>Snap Selfie</span>
            </button>
            <button
              onClick={() => { setActiveTab('upload'); stopCamera(); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: activeTab === 'upload' ? 'var(--accent-gradient)' : 'transparent',
                color: '#fff',
                transition: 'all 0.2s',
              }}
            >
              <Upload size={15} />
              <span>Upload Photo</span>
            </button>
          </div>
        )}

        {/* Camera / Image Viewport */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '320px',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#04060a',
          border: '2px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Selfie preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : activeTab === 'camera' ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror effect for natural selfie
                }}
              />
              {/* Face Guide Oval */}
              <div style={{
                position: 'absolute',
                width: '180px',
                height: '240px',
                borderRadius: '50%',
                border: '2px dashed rgba(6, 182, 212, 0.7)',
                boxShadow: '0 0 25px rgba(6, 182, 212, 0.25)',
                pointerEvents: 'none',
              }} />
            </>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}>
                <Upload size={24} />
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Click to choose a photo / selfie</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports JPG, PNG, WEBP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Laser Scanner animation during processing */}
          {isProcessing && <div className="scanner-line" />}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Processing Progress Bar */}
        {isProcessing && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>{statusMessage}</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{scanningProgress}%</span>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${scanningProgress}%`,
                background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {capturedImage ? (
            <button
              onClick={handleRetake}
              disabled={isProcessing}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              <RefreshCw size={16} />
              <span>Retake Photo</span>
            </button>
          ) : activeTab === 'camera' ? (
            <button
              onClick={handleCaptureSnapshot}
              className="btn-ai"
              style={{ flex: 1, padding: '14px' }}
            >
              <Camera size={18} />
              <span>Snap & Find My Photos</span>
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
              style={{ flex: 1, padding: '14px' }}
            >
              <Upload size={18} />
              <span>Choose Photo from Device</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
