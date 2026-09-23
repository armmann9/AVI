'use client';

import React, { useState, useMemo } from 'react';
import { Camera, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { FestivalEvent } from '@/types/utsav';

interface EventsTimelineProps {
  events: FestivalEvent[];
  onOpenEvent: (event: FestivalEvent) => void;
}

// Extract year from event object
const extractYear = (event: FestivalEvent): number => {
  if (event.year && typeof event.year === 'number') return event.year;
  const match = (event.date || '').match(/\b(20\d\d)\b/);
  if (match) return parseInt(match[1], 10);
  const parsed = new Date(event.date);
  if (!isNaN(parsed.getFullYear()) && parsed.getFullYear() > 2000) return parsed.getFullYear();
  return 2024;
};

export const EventsTimeline: React.FC<EventsTimelineProps> = ({ events, onOpenEvent }) => {
  // Group events by year
  const { years, eventsByYear } = useMemo(() => {
    const map = new Map<number, FestivalEvent[]>();
    // Default prominent years
    const yearSet = new Set<number>([2026, 2025, 2024]);

    events.forEach((ev) => {
      const y = extractYear(ev);
      yearSet.add(y);
      const existing = map.get(y) || [];
      existing.push(ev);
      map.set(y, existing);
    });

    const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
    return { years: sortedYears, eventsByYear: map };
  }, [events]);

  // First year open by default (accordion behavior)
  const [openYear, setOpenYear] = useState<number | null>(years[0] || 2026);

  const toggleYear = (year: number) => {
    setOpenYear((prev) => (prev === year ? null : year));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      {/* Header matching reference mockup */}
      <div className="mb-10">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">
          Colony Festival Archive
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#0B1D3A] dark:text-white tracking-tight mb-3">
          Events, by year
        </h2>
        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
          Tap a year to see everything that happened. Cards open the same way they do across the rest of the portal.
        </p>
      </div>

      {/* Timeline with vertical connecting line */}
      <div className="relative before:content-[''] before:absolute before:left-[27px] before:top-2 before:bottom-2 before:w-[2px] before:bg-stone-400 dark:before:bg-slate-700">
        {years.map((year) => {
          const yearEvents = eventsByYear.get(year) || [];
          const isOpen = openYear === year;

          return (
            <div key={year} className="relative mb-2">
              {/* Year Button Row */}
              <button
                type="button"
                onClick={() => toggleYear(year)}
                className="w-full flex items-center gap-5 py-3.5 bg-transparent border-none cursor-pointer text-left group focus:outline-none"
                aria-expanded={isOpen}
              >
                {/* 56px circular node on the timeline */}
                <span
                  className={`relative z-10 shrink-0 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isOpen
                      ? 'bg-blue-700 border-blue-700 text-white shadow-md shadow-blue-700/30 dark:bg-blue-600 dark:border-blue-500'
                      : 'bg-[#F5EEDB] dark:bg-slate-800 border-stone-400 dark:border-slate-700 text-slate-800 dark:text-slate-200 group-hover:border-blue-700'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-45 stroke-white' : 'stroke-slate-800 dark:stroke-slate-200'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>

                {/* Year display and count */}
                <div className="flex-1 flex items-baseline justify-between min-w-0 pr-2">
                  <span className="text-3xl sm:text-4xl font-display font-medium text-[#0B1D3A] dark:text-white leading-none">
                    {year}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>

              {/* Accordion expandable panel */}
              <div
                className={`grid transition-[grid-template-rows] duration-380 ease-[cubic-bezier(0.4,0,0.2,1)] ml-0 sm:ml-[76px] motion-reduce:transition-none ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  {yearEvents.length === 0 ? (
                    <div className="text-sm text-slate-600 dark:text-slate-400 italic py-3 pb-8 pl-4 sm:pl-0">
                      No events recorded for {year} yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 pb-8 pl-4 sm:pl-0">
                      {yearEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => onOpenEvent(event)}
                          className="group/card cursor-pointer rounded-2xl bg-[#FAF6EE] dark:bg-[#131D33] border border-stone-400 dark:border-slate-700/80 overflow-hidden hover:shadow-xl hover:border-blue-600 dark:hover:border-blue-500 transition-all duration-200 flex flex-col justify-between motion-reduce:transition-none"
                        >
                          {/* Event Cover Photo */}
                          <div className="relative h-48 w-full overflow-hidden bg-stone-200 dark:bg-slate-800">
                            <img
                              src={event.coverImage}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 motion-reduce:transition-none"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                            {/* Photo count badge */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              {event.driveUrl && (
                                <span
                                  title="Google Drive RAW Album Available"
                                  className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/30"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/30">
                                <Camera className="w-3.5 h-3.5" />
                                <span>{event.photos?.length || event.photoCount || 0} Photos</span>
                              </div>
                            </div>
                          </div>

                          {/* Event Content */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <h4 className="text-base sm:text-lg font-bold text-[#0B1D3A] dark:text-white group-hover/card:text-blue-700 dark:group-hover/card:text-blue-400 transition-colors line-clamp-1">
                                {event.title}
                              </h4>
                              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed font-normal">
                                {event.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-stone-300 dark:border-slate-700/60 flex items-center justify-between">
                              <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                                {event.date}
                              </span>

                              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 group-hover/card:underline flex items-center gap-1">
                                View Gallery <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
