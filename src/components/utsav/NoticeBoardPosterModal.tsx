'use client';

import React, { useRef, useState } from 'react';
import { Printer, X, Download, QrCode, Sparkles, Check, Share2, Eye } from 'lucide-react';
import { FestivalEvent } from '@/types/utsav';
import { playTempleBell } from '@/utils/audio';

interface NoticeBoardPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: FestivalEvent[];
}

export const NoticeBoardPosterModal: React.FC<NoticeBoardPosterModalProps> = ({
  isOpen,
  onClose,
  events,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'diwali-2024');
  const [customPosterTitle, setCustomPosterTitle] = useState('स्कैन करें और अपनी तस्वीरें पाएं');
  const [showPrintToast, setShowPrintToast] = useState(false);

  if (!isOpen) return null;

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handlePrint = () => {
    playTempleBell(980);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-emerald-950 border border-amber-400/40 rounded-3xl shadow-2xl p-4 sm:p-6 my-auto text-amber-50">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-800">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Printable Notice Board Poster • लिफ्ट व गेट पोस्टर</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display text-white mt-0.5">
              Printable AI Photo QR Code Poster (A4 Ready)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap items-center gap-3 py-3 border-b border-emerald-800/80 text-xs">
          <span className="text-emerald-300 font-semibold">Select Event:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-emerald-900 text-amber-200 border border-emerald-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.date})
              </option>
            ))}
          </select>

          <span className="text-emerald-400 text-[11px] ml-auto italic">
            Tip: Stick this poster in Colony Lifts, Clubhouse Entrance, and Mandir Board.
          </span>
        </div>

        {/* The Authentic A4 Printable Canvas / Preview Container */}
        <div className="py-6 flex justify-center overflow-x-auto">
          <div 
            id="printable-society-poster"
            className="w-full max-w-[440px] bg-[#fffdfa] text-stone-900 border-4 border-amber-600/80 rounded-2xl p-6 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-center relative overflow-hidden"
          >
            {/* Traditional Marigold Corner Motifs */}
            <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-amber-600 rounded-tl-xl" />
            <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-amber-600 rounded-tr-xl" />
            <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-amber-600 rounded-bl-xl" />
            <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-amber-600 rounded-br-xl" />

            {/* BPSCVS Top Emblem & Official Header */}
            <div className="border-b-2 border-amber-800 pb-3 mb-4">
              <div className="text-[11px] font-bold tracking-widest uppercase text-amber-900">
                Bani Park Sindhi Colony Vikas Samiti (Regd.)
              </div>
              <div className="text-xs font-serif text-amber-800 font-bold">
                बनी पार्क सिंधी कॉलोनी विकास समिति, जयपुर
              </div>
            </div>

            {/* Event Name */}
            <div className="mb-3">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider inline-block mb-1 border border-amber-300">
                Official Festival Gallery
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-amber-950 font-serif leading-tight">
                {currentEvent.title}
              </h1>
              <div className="text-sm font-bold text-amber-800 font-serif">
                {currentEvent.hindiTitle}
              </div>
              <p className="text-[11px] text-stone-600 mt-1 font-medium">
                📅 {currentEvent.date} • 📍 {currentEvent.location}
              </p>
            </div>

            {/* Highlight Box: AI Face Search Instructions */}
            <div className="bg-amber-50 border-2 border-dashed border-amber-500 rounded-2xl p-4 mb-4">
              <h2 className="text-base sm:text-lg font-black text-amber-900 leading-snug">
                स्कैन करें और 2 सेकंड में अपनी फोटो पाएं!
              </h2>
              <p className="text-xs text-stone-700 mt-0.5 font-medium">
                Scan with phone camera & find your photos instantly using AI
              </p>

              {/* Large High Contrast QR Code */}
              <div className="my-3 flex flex-col items-center justify-center">
                <div className="p-3 bg-white border-2 border-stone-800 rounded-xl shadow-md inline-block">
                  <svg viewBox="0 0 140 140" className="w-36 h-36">
                    {/* Corner Position Detection Squares */}
                    {/* Top-Left */}
                    <rect x="10" y="10" width="36" height="36" fill="#1c1917" rx="4" />
                    <rect x="18" y="18" width="20" height="20" fill="#ffffff" rx="2" />
                    <rect x="23" y="23" width="10" height="10" fill="#1c1917" rx="1" />

                    {/* Top-Right */}
                    <rect x="94" y="10" width="36" height="36" fill="#1c1917" rx="4" />
                    <rect x="102" y="18" width="20" height="20" fill="#ffffff" rx="2" />
                    <rect x="107" y="23" width="10" height="10" fill="#1c1917" rx="1" />

                    {/* Bottom-Left */}
                    <rect x="10" y="94" width="36" height="36" fill="#1c1917" rx="4" />
                    <rect x="18" y="102" width="20" height="20" fill="#ffffff" rx="2" />
                    <rect x="23" y="107" width="10" height="10" fill="#1c1917" rx="1" />

                    {/* QR Pixel Matrix Pattern */}
                    <rect x="52" y="12" width="8" height="8" fill="#1c1917" />
                    <rect x="68" y="12" width="12" height="8" fill="#1c1917" />
                    <rect x="52" y="28" width="16" height="8" fill="#1c1917" />
                    <rect x="76" y="28" width="8" height="8" fill="#1c1917" />
                    <rect x="14" y="54" width="10" height="10" fill="#1c1917" />
                    <rect x="32" y="54" width="8" height="8" fill="#1c1917" />
                    <rect x="52" y="48" width="12" height="12" fill="#1c1917" />
                    <rect x="72" y="48" width="16" height="8" fill="#1c1917" />
                    <rect x="96" y="52" width="8" height="14" fill="#1c1917" />
                    <rect x="112" y="52" width="12" height="8" fill="#1c1917" />

                    {/* Center Logo Marker */}
                    <rect x="56" y="56" width="28" height="28" fill="#f59e0b" rx="4" />
                    <text x="70" y="74" textAnchor="middle" fill="#000" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                      AI
                    </text>

                    <rect x="24" y="74" width="12" height="8" fill="#1c1917" />
                    <rect x="42" y="74" width="8" height="12" fill="#1c1917" />
                    <rect x="92" y="74" width="14" height="8" fill="#1c1917" />
                    <rect x="114" y="74" width="10" height="12" fill="#1c1917" />
                    <rect x="52" y="94" width="14" height="8" fill="#1c1917" />
                    <rect x="74" y="94" width="10" height="12" fill="#1c1917" />
                    <rect x="92" y="94" width="12" height="8" fill="#1c1917" />
                    <rect x="112" y="94" width="14" height="12" fill="#1c1917" />
                    <rect x="52" y="112" width="24" height="10" fill="#1c1917" />
                    <rect x="84" y="112" width="12" height="8" fill="#1c1917" />
                    <rect x="104" y="112" width="18" height="12" fill="#1c1917" />
                  </svg>
                </div>
                <span className="text-[10px] font-mono text-stone-500 mt-1">
                  portal.bpscvs.org/photo-search
                </span>
              </div>

              {/* 3 Step Visual Guide for Residents */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-amber-200 text-[10px]">
                <div>
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold inline-flex items-center justify-center mb-0.5">1</span>
                  <p className="font-bold text-stone-800">Scan QR</p>
                  <p className="text-[9px] text-stone-500">Open Camera</p>
                </div>
                <div>
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold inline-flex items-center justify-center mb-0.5">2</span>
                  <p className="font-bold text-stone-800">Click Selfie</p>
                  <p className="text-[9px] text-stone-500">100% Private</p>
                </div>
                <div>
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold inline-flex items-center justify-center mb-0.5">3</span>
                  <p className="font-bold text-stone-800">Download</p>
                  <p className="text-[9px] text-stone-500">All Your Photos</p>
                </div>
              </div>
            </div>

            {/* Footer Committee Contacts */}
            <div className="text-[9px] text-stone-500 pt-2 border-t border-stone-200">
              <p className="font-semibold text-stone-700">
                Issued in public resident interest by BPSCVS Executive Committee
              </p>
              <p className="mt-0.5">
                Helpline & WhatsApp Support: +91 98290 12345 / +91 94140 56789
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
