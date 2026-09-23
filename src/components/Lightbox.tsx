'use client';

import React, { useEffect, useCallback } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Share2, Sparkles, UserCheck } from 'lucide-react';
import { PhotoItem } from '@/lib/types';
import { downloadSinglePhoto } from '@/lib/zipService';

interface LightboxProps {
  photos: PhotoItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  matchScore?: number;
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  matchScore,
}: LightboxProps) {
  const photo = photos[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    },
    [currentIndex, photos.length, onClose, onNavigate]
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!photo) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 12, 0.95)',
      backdropFilter: 'blur(16px)',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px',
    }}>
      {/* Top Controls Bar */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '6px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {currentIndex + 1} / {photos.length}
          </span>
          {matchScore !== undefined && (
            <span className="badge badge-ai" style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '0.72rem' }}>
              <UserCheck size={12} /> {Math.round(matchScore * 100)}% Match
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => downloadSinglePhoto(photo, `event-photo-${currentIndex + 1}.jpg`)}
            className="btn-primary"
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <Download size={14} />
            <span>Download</span>
          </button>

          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div style={{
        position: 'relative',
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '10px',
      }}>
        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            style={{
              position: 'absolute',
              left: '16px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* High Resolution Image */}
        <img
          src={photo.url}
          alt={photo.title || 'Event Photo'}
          style={{
            maxWidth: '92vw',
            maxHeight: '78vh',
            objectFit: 'contain',
            borderRadius: '10px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          }}
        />

        {/* Next Button */}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            style={{
              position: 'absolute',
              right: '16px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s',
            }}
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Bottom Photo Details */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
      }}>
        <div>{photo.title || 'Event Photo'}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {photo.tags?.map((t, idx) => (
            <span key={idx} className="badge badge-count" style={{ fontSize: '0.7rem' }}>
              #{t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
