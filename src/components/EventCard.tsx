'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Image as ImageIcon, QrCode, ArrowRight, UploadCloud, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { EventItem } from '@/lib/types';
import { formatFestiveDate } from '@/utils/dateUtils';
import QRCodeModal from './QRCodeModal';

interface EventCardProps {
  event: EventItem;
  isAdminView?: boolean;
  onEdit?: (event: EventItem) => void;
  onDelete?: (id: string) => void;
}

export default function EventCard({ event, isAdminView = false, onEdit, onDelete }: EventCardProps) {
  const [showQR, setShowQR] = useState(false);

  const isUpcoming = event.status === 'upcoming' || (!event.status && new Date(event.date) >= new Date());

  return (
    <>
      <div className="rounded-3xl bg-emerald-950/70 border border-emerald-800/60 hover:border-amber-400/60 overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between transition-all duration-300 group">
        {/* Cover Image */}
        <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-[#021812]">
          <img
            src={event.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#021812] via-black/20 to-black/40 pointer-events-none" />

          {/* Top Left: Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-sm backdrop-blur-md">
              {event.category || 'Festival'}
            </span>
          </div>

          {/* Top Right: QR Code button */}
          <button
            onClick={() => setShowQR(true)}
            className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/60 hover:bg-amber-500 hover:text-emerald-950 border border-white/20 text-white flex items-center justify-center transition-all shadow-md backdrop-blur-md"
            title="View Event QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Bottom Left: Photo count + Status */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-black/70 border border-emerald-700/50 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md">
              <ImageIcon className="w-3 h-3 text-amber-400" />
              <span>{event.photoCount || 0} Photos</span>
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-md ${
                isUpcoming
                  ? 'bg-emerald-500/80 text-emerald-950'
                  : 'bg-yellow-600/80 text-white'
              }`}
            >
              {isUpcoming ? '🟢 Upcoming' : '⚪ Completed'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-1 justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-amber-100 group-hover:text-amber-300 transition-colors line-clamp-1">
              {event.title}
            </h3>

            {event.description && (
              <p className="text-xs text-emerald-300/70 line-clamp-2 mt-1.5 leading-relaxed">
                {event.description}
              </p>
            )}

            <div className="flex flex-col gap-1.5 text-xs text-emerald-400/80 mt-3 pt-3 border-t border-emerald-800/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{formatFestiveDate(event.date)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center gap-2 pt-3 border-t border-emerald-800/40">
            <Link
              href={`/event/${event.slug || event.id}`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-emerald-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>View Gallery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {isAdminView ? (
              <>
                {onEdit && (
                  <button
                    onClick={() => onEdit(event)}
                    className="p-2.5 rounded-xl bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 text-amber-300 transition-all"
                    title="Edit Event"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}

                <Link
                  href={`/admin/upload/${event.id}`}
                  className="p-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 transition-all"
                  title="Upload Photos"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                </Link>

                {onDelete && (
                  <button
                    onClick={() => onDelete(event.id)}
                    className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 transition-all"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => setShowQR(true)}
                className="p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-700/50 text-emerald-300 transition-all"
                title="View QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showQR && <QRCodeModal event={event} onClose={() => setShowQR(false)} />}
    </>
  );
}
