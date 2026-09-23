'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2, Eye, QrCode, Image as ImageIcon, RefreshCw, Calendar, MapPin, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getEventById, getPhotosByEventId } from '@/lib/db';
import { EventItem, PhotoItem } from '@/lib/types';
import { formatFestiveDate } from '@/utils/dateUtils';
import BulkUploader from '@/components/BulkUploader';
import QRCodeModal from '@/components/QRCodeModal';

export default function EventBulkUploadPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadSuccessCount, setUploadSuccessCount] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Security gate: strictly require admin role
  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.replace('/login?from=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [eventId, user]);

  const loadData = async () => {
    if (!eventId) return;
    setLoading(true);
    const evt = await getEventById(eventId);
    if (evt) {
      setEvent(evt);
      const photoList = await getPhotosByEventId(evt.id);
      setPhotos(photoList);
    }
    setLoading(false);
  };

  const handleUploadComplete = async (uploadedCount: number) => {
    setUploadSuccessCount(uploadedCount);
    await loadData();
  };

  if (authLoading || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
        <p className="text-slate-700 text-sm font-semibold">Verifying secure administrator session...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
        <p className="text-slate-700 text-sm font-semibold">Loading Event Upload Manager...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-white border border-stone-200 rounded-3xl p-8 max-w-md w-full shadow-lg">
          <h2 className="text-2xl font-display font-bold text-[#0F172A] mb-3">Event Not Found</h2>
          <p className="text-slate-600 text-sm mb-6">The requested event ID could not be located in the database.</p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-sm shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb & Top Bar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-slate-700 text-xs font-semibold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Back to Admin Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            {event.driveUrl && (
              <a
                href={event.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-semibold transition-all shadow-xs"
              >
                <svg className="w-4 h-4 text-blue-700 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.71 3.5L1.15 15l3.43 6l6.55-11.5L7.71 3.5zm1.72 12l3.43 6h13.14l-3.43-6H9.43zm6.86-12l-3.43 6l6.56 11.5l3.43-6l-6.56-11.5z"/>
                </svg>
                <span>Drive Album</span>
              </a>
            )}

            <button
              onClick={() => setShowQR(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span>Get Event QR Code</span>
            </button>

            <Link
              href={`/event/${event.slug || event.id}`}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>View Public Gallery</span>
            </Link>
          </div>
        </div>

        {/* Event Header Banner */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm flex items-center justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-900 uppercase tracking-wider">
                {event.category || 'Event Gallery'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 border border-stone-200 text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" /> AI Indexing Enabled
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-[#0F172A] mb-2">
              {event.title}
            </h1>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-700" /> {event.location || 'Bani Park, Jaipur'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-700" /> {formatFestiveDate(event.date)}
              </span>
              <span>•</span>
              <span className="text-blue-900 font-semibold">{photos.length} Photos in Gallery</span>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 text-center min-w-[140px] shadow-xs">
            <div className="text-3xl sm:text-4xl font-black text-blue-900 font-display">
              {photos.length}
            </div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-600 mt-1">
              Photos Indexed
            </div>
          </div>
        </div>

        {/* Upload Success Alert */}
        {uploadSuccessCount !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 mb-8 flex items-center justify-between flex-wrap gap-4 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3 text-blue-900">
              <CheckCircle2 className="w-6 h-6 text-blue-700 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base text-blue-950">
                Successfully uploaded and indexed {uploadSuccessCount} photo{uploadSuccessCount === 1 ? '' : 's'}!
              </span>
            </div>

            <Link
              href={`/event/${event.slug || event.id}`}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs"
            >
              <span>Test AI Search in Live Gallery →</span>
            </Link>
          </div>
        )}

        {/* Bulk Uploader Module */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-12">
          <BulkUploader eventId={event.id} onUploadComplete={handleUploadComplete} />
        </div>

        {/* Currently Uploaded Photos Grid */}
        {photos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold text-[#0F172A]">
                Existing Event Photos ({photos.length})
              </h3>
              <span className="text-xs text-slate-500">Synced with Community Gallery</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {photos.map((p, idx) => (
                <div
                  key={p.id}
                  className="relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-stone-200 group shadow-xs hover:border-blue-400 transition-all"
                >
                  <img
                    src={p.thumbnailUrl || p.url}
                    alt={p.title || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {p.faces && p.faces.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-0.5 text-[10px] text-white border border-white/20 flex items-center gap-1 font-semibold">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" /> {p.faces.length} {p.faces.length === 1 ? 'face' : 'faces'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showQR && <QRCodeModal event={event} onClose={() => setShowQR(false)} />}
    </div>
  );
}
