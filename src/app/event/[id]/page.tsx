'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Sparkles,
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Users,
  ExternalLink,
  MessageCircle,
  Clock,
  Tag,
  Share2,
  Flame,
  Award
} from 'lucide-react';
import { getEventById, getPhotosByEventId, saveRsvpRecord } from '@/lib/db';
import { INITIAL_EVENTS, INITIAL_PHOTOS } from '@/lib/sampleData';
import { EventItem, PhotoItem, FaceMatchResult } from '@/lib/types';
import { EventRsvpRecord } from '@/types/utsav';
import GalleryGrid from '@/components/GalleryGrid';
import FaceSearchModal from '@/components/FaceSearchModal';
import QRCodeModal from '@/components/QRCodeModal';
import { shareViaWhatsApp } from '@/lib/shareUtils';

export default function SingleEventPage({ params: propParams }: { params?: { id: string } }) {
  const router = useRouter();
  const hookParams = useParams();
  const eventIdOrSlug = (propParams?.id || hookParams?.id || '') as string;

  const fallbackEvent = INITIAL_EVENTS.find(e => e.id === eventIdOrSlug || e.slug === eventIdOrSlug) || INITIAL_EVENTS[0];
  const fallbackPhotos = fallbackEvent
    ? INITIAL_PHOTOS.filter(p => p.eventId === fallbackEvent.id || p.eventId === fallbackEvent.slug)
    : [];

  const [event, setEvent] = useState<EventItem | null>(fallbackEvent);
  const [photos, setPhotos] = useState<PhotoItem[]>(fallbackPhotos);
  const [loading, setLoading] = useState(false);

  // RSVP state
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'tentative' | 'not_attending' | null>(null);
  const [residentName, setResidentName] = useState('');
  const [bungalowPlot, setBungalowPlot] = useState('');
  const [phone, setPhone] = useState('');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [dietPref, setDietPref] = useState<'regular' | 'jain' | 'falahar'>('regular');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // AI & Modals
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [matchedResults, setMatchedResults] = useState<FaceMatchResult[] | null>(null);
  const [userSelfieUrl, setUserSelfieUrl] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!eventIdOrSlug) return;
      const evt = await getEventById(eventIdOrSlug);
      if (evt) {
        setEvent(evt);
        const photoList = await getPhotosByEventId(evt.id);
        setPhotos(photoList.length > 0 ? photoList : fallbackPhotos);
      }
      setLoading(false);
    }
    loadData();
  }, [eventIdOrSlug]);

  const handleFaceResultsFound = (results: FaceMatchResult[], selfieDataUrl: string) => {
    setMatchedResults(results);
    setUserSelfieUrl(selfieDataUrl);
    setShowFaceModal(false);
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpStatus || !event) return;
    if (!residentName.trim() || !bungalowPlot.trim()) {
      setRsvpError('Please enter your family name and bungalow / plot number.');
      return;
    }
    setRsvpError(null);
    setIsSubmittingRsvp(true);

    try {
      const record: EventRsvpRecord = {
        id: `rsvp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        eventId: event.id,
        residentName: residentName.trim(),
        bungalowPlot: bungalowPlot.trim(),
        phone: phone.trim() || '+91 98290 XXXXX',
        adultsCount: guestCount,
        kidsCount: 0,
        dietPreference: dietPref,
        isAttending: rsvpStatus === 'attending',
        notes: rsvpStatus === 'tentative' ? 'Tentative participation' : '',
        createdAt: new Date().toISOString(),
      };

      await saveRsvpRecord(record);
      setRsvpSubmitted(true);
    } catch (err) {
      console.error('RSVP submission error:', err);
      setRsvpError('Failed to save RSVP. Please try again.');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const currentPhotos = matchedResults
    ? matchedResults.map((r) => r.photo)
    : photos;

  if (!event) {
    return (
      <div className="min-h-screen bg-[#021812] text-amber-50 flex flex-col items-center justify-center px-4">
        <div className="bg-emerald-950/80 border border-emerald-700/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-amber-300 mb-2">Festival Not Found</h2>
          <p className="text-emerald-300/70 text-sm mb-6">This celebration album does not exist or has been archived.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-emerald-950 font-bold text-sm shadow-lg hover:from-amber-400 hover:to-yellow-400 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Community Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const isUpcoming = event.status === 'upcoming' || (!event.status && new Date(event.date) >= new Date());

  return (
    <div className="min-h-screen bg-[#021812] text-amber-50 selection:bg-amber-500 selection:text-emerald-950 font-sans relative overflow-x-hidden">
      {/* Background Lighting & Atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[650px] h-[650px] rounded-full bg-amber-500/[0.06] blur-[120px]" />
        <div className="absolute top-1/3 right-[-10%] w-[650px] h-[650px] rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-1/3 w-[800px] h-[800px] rounded-full bg-amber-400/[0.03] blur-[140px]" />
      </div>

      {/* Top Navbar Header */}
      <header className="relative z-20 px-6 sm:px-12 py-4 flex items-center justify-between border-b border-amber-500/10 backdrop-blur-md bg-emerald-950/30">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4 text-[#021812] fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-amber-300 tracking-wider">BPSCVS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-400/30">GALLERY</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-300/80 hover:text-amber-300 px-4 py-2 rounded-xl bg-emerald-900/40 border border-emerald-700/40 hover:border-amber-400/50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Community Portal</span>
          </Link>
        </div>
      </header>

      {/* Event Hero Banner Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-emerald-900/40 to-[#021812]/90 border border-amber-500/30 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Details & Action Buttons */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div>
                {/* Badges & Status */}
                <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold shadow-sm">
                    {event.category || 'Festival Utsav'}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                      isUpcoming
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40'
                    }`}
                  >
                    {isUpcoming ? '🟢 Upcoming Celebration' : '⚪ Completed Archive'}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 font-semibold">
                    📸 {photos.length} Photos in Vault
                  </span>
                </div>

                {/* Festival Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-amber-100 leading-tight mb-4">
                  {event.title}
                </h1>

                {/* Date & Location Pill Row */}
                <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-emerald-200/90 mb-5">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-900/50 border border-emerald-700/50">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-900/50 border border-emerald-700/50">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{event.time} IST</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-900/50 border border-emerald-700/50">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <p className="text-emerald-300/80 text-sm sm:text-base leading-relaxed mb-8">
                    {event.description}
                  </p>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-3 flex-wrap pt-4 border-t border-emerald-800/40">
                {/* ⚡ AI Face Finder Button */}
                <button
                  onClick={() => setShowFaceModal(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-emerald-950 font-bold text-sm shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Find My Photos (AI Matcher)</span>
                </button>

                {/* QR Code Poster */}
                <button
                  onClick={() => setShowQRModal(true)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/60 text-emerald-200 font-semibold text-sm transition-all active:scale-95"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>QR Code</span>
                </button>

                {/* WhatsApp Share */}
                <button
                  onClick={() => shareViaWhatsApp(event)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#4ade80] font-semibold text-sm transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp Share</span>
                </button>

                {/* Google Drive Album Link */}
                {event.driveUrl && (
                  <a
                    href={event.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 font-semibold text-sm transition-all active:scale-95 shadow-sm"
                  >
                    <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.71 3.5L1.15 15l3.43 6l6.55-11.5L7.71 3.5zm1.72 12l3.43 6h13.14l-3.43-6H9.43zm6.86-12l-3.43 6l6.56 11.5l3.43-6l-6.56-11.5z"/>
                    </svg>
                    <span>Google Drive Album</span>
                  </a>
                )}

                {/* Google Maps Link */}
                {event.mapUrl && (
                  <a
                    href={event.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-emerald-300 text-sm transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Venue Map</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Event Cover & RSVP / Organizer Card */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Cover Image */}
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl aspect-[16/10] bg-[#021812]">
                <img
                  src={event.coverImage || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 text-xs text-amber-200/90 font-medium">
                  📍 {event.location}
                </div>
              </div>

              {/* RSVP Card or Samiti Info */}
              <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 shadow-lg">
                {event.registrationOpen ? (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-300 mb-3">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>RSVP for this Celebration</span>
                    </div>

                    {rsvpSubmitted ? (
                      <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center text-emerald-300">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                        <div className="font-bold text-sm">RSVP Confirmed!</div>
                        <p className="text-xs text-emerald-400/70 mt-1">
                          We look forward to welcoming your family at the Samiti Hall.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleRsvpSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRsvpStatus('attending')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              rsvpStatus === 'attending'
                                ? 'bg-emerald-500 text-emerald-950 border-emerald-400'
                                : 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300'
                            }`}
                          >
                            ✓ Attending
                          </button>
                          <button
                            type="button"
                            onClick={() => setRsvpStatus('tentative')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              rsvpStatus === 'tentative'
                                ? 'bg-amber-500 text-emerald-950 border-amber-400'
                                : 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300'
                            }`}
                          >
                            Tentative
                          </button>
                        </div>

                        {rsvpError && (
                          <p className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-lg px-2.5 py-1.5">
                            {rsvpError}
                          </p>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold text-emerald-300/80 mb-1">
                            Resident / Family Name <span className="text-amber-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={residentName}
                            onChange={(e) => setResidentName(e.target.value)}
                            placeholder="e.g. Ramesh Wadhwani & Family"
                            className="w-full bg-[#021812]/90 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs text-amber-100 placeholder:text-emerald-400/30 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-emerald-300/80 mb-1">
                              Bungalow / Plot <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={bungalowPlot}
                              onChange={(e) => setBungalowPlot(e.target.value)}
                              placeholder="e.g. Plot 14-B"
                              className="w-full bg-[#021812]/90 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs text-amber-100 placeholder:text-emerald-400/30 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-emerald-300/80 mb-1">
                              Phone (Optional)
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+91 98290 XXXXX"
                              className="w-full bg-[#021812]/90 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs text-amber-100 placeholder:text-emerald-400/30 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-emerald-300/80 mb-1">Diet Preference</label>
                          <select
                            value={dietPref}
                            onChange={(e) => setDietPref(e.target.value as 'regular' | 'jain' | 'falahar')}
                            className="w-full bg-[#021812]/90 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                          >
                            <option value="regular">Satvik Regular Mahaprasad</option>
                            <option value="jain">Pure Jain (No root vegetables)</option>
                            <option value="falahar">Vrat Falahari</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-emerald-300/80 mb-1">Family Members Count</label>
                          <select
                            value={guestCount}
                            onChange={(e) => setGuestCount(Number(e.target.value))}
                            className="w-full bg-[#021812]/90 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                          >
                            <option value={1}>1 person</option>
                            <option value={2}>2 persons</option>
                            <option value={3}>3 persons</option>
                            <option value={4}>4 persons</option>
                            <option value={5}>5+ persons</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={!rsvpStatus || isSubmittingRsvp}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-emerald-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isSubmittingRsvp ? 'Submitting...' : 'Submit RSVP'}
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-emerald-300/70">
                    <Award className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                    <div>Organized by <strong className="text-amber-300">{event.photographerName || 'BPSCVS Samiti'}</strong></div>
                    <p className="text-[11px] text-emerald-400/50 mt-1">Bani Park Sindhi Colony Vikas Samiti</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Photo Gallery Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-20">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-amber-200">
              Celebration Photo Gallery
            </h2>
            <p className="text-xs sm:text-sm text-emerald-300/70 mt-1">
              {matchedResults
                ? `Showing ${matchedResults.length} photos matched with your facial selfie`
                : `High-resolution photographs from this festival (${photos.length} photos)`}
            </p>
          </div>

          {matchedResults && (
            <button
              onClick={() => { setMatchedResults(null); setUserSelfieUrl(null); }}
              className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700 text-amber-300 text-xs font-bold transition-all"
            >
              ✕ Clear AI Match & Show All Photos
            </button>
          )}
        </div>

        {/* Google Drive RAW Archive Banner */}
        {event.driveUrl && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-950/80 border border-amber-500/30 flex items-center justify-between flex-wrap gap-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.71 3.5L1.15 15l3.43 6l6.55-11.5L7.71 3.5zm1.72 12l3.43 6h13.14l-3.43-6H9.43zm6.86-12l-3.43 6l6.56 11.5l3.43-6l-6.56-11.5z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-amber-100">
                  Looking for uncompressed original 4K / RAW photos?
                </h4>
                <p className="text-xs text-emerald-300/75 mt-0.5">
                  Access the official BPSCVS Google Drive album for full-resolution downloads.
                </p>
              </div>
            </div>
            <a
              href={event.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-emerald-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <span>Open Google Drive Album →</span>
            </a>
          </div>
        )}

        {/* Gallery Grid */}
        <GalleryGrid
          photos={currentPhotos}
          matchedResults={matchedResults || undefined}
          eventTitle={event.title}
        />
      </section>

      {/* Face Search Modal */}
      {showFaceModal && (
        <FaceSearchModal
          photos={photos}
          onClose={() => setShowFaceModal(false)}
          onResultsFound={handleFaceResultsFound}
        />
      )}

      {/* QR Modal */}
      {showQRModal && (
        <QRCodeModal
          event={event}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}
