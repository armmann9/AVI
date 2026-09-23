'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { FESTIVAL_EVENTS } from '@/data/festivalEvents';
import { FestivalEvent } from '@/types/utsav';
import { getMergedFestivalEvents } from '@/lib/db';
import BulkUploader from '@/components/BulkUploader';
import {
  Camera, Upload, Grid, CheckSquare, LogOut, Eye, Menu,
  ChevronRight, Star, ArrowUpRight, Check, Square
} from 'lucide-react';

type StudioSection = 'upload' | 'catalog' | 'shotlist';

const NAV_ITEMS: { id: StudioSection; label: string; labelHindi: string; icon: React.ReactNode }[] = [
  { id: 'upload', label: 'Bulk Upload Studio', labelHindi: 'फोटो अपलोड स्टूडियो', icon: <Upload className="w-5 h-5" /> },
  { id: 'catalog', label: 'My Uploads Catalog', labelHindi: 'मेरी अपलोड सूची', icon: <Grid className="w-5 h-5" /> },
  { id: 'shotlist', label: 'Committee Shot List', labelHindi: 'शॉट सूची', icon: <CheckSquare className="w-5 h-5" /> },
];

// ─── Shot List data ────────────────────────────────────────────────────────────
const SHOT_LIST = [
  { id: 's1', category: 'Opening Ceremony', shots: ['Golden Hour Aerial / Drone Shot of venue', 'Deep Prajjwalan (दीप प्रज्वलन) close-up', 'Chief Guest arrival & garland welcome', 'Inaugural ribbon cutting / lamp lighting'] },
  { id: 's2', category: 'Aarti & Puja', shots: ['Maha Aarti Jyot rotation (slow pan)', 'Full crowd during Aarti with lifted diyas', 'Priest close-up with dhoop & flowers', 'Prasad distribution queue'] },
  { id: 's3', category: 'Cultural Programme', shots: ['Stage overview with full backdrop', 'Dance performance full frame', 'Dance performance close-up expressions', 'Children fancy dress competition', 'Rangoli competition & judge panel'] },
  { id: 's4', category: 'Cheti Chand Chhajj', shots: ['Sindhi folk parade procession', 'Lada singers group shot', 'Traditional Sindhi attire close-ups', 'Jhulelal idol decorated setup'] },
  { id: 's5', category: 'Family & Community', shots: ['Multi-generation family portrait', 'Senior residents group photo', 'Youth wing group photo', 'Colony president with committee members'] },
  { id: 's6', category: 'Mahaprasad Dinner', shots: ['Kitchen langar lines overview', 'Volunteer seva team portrait', 'Serving in progress wide shot', 'Children eating together table shot'] },
];

// ─── Demo catalog photos ───────────────────────────────────────────────────────
const CATALOG_PHOTOS = [
  { id: 'c1', url: 'https://images.unsplash.com/photo-1563397547-0107a7b79eb7?auto=format&fit=crop&w=400&q=80', event: 'Deepotsav 2024', tag: 'Maha Aarti', uploadedAt: '2024-11-15' },
  { id: 'c2', url: 'https://images.unsplash.com/photo-1574434312-6e0e2df23826?auto=format&fit=crop&w=400&q=80', event: 'Deepotsav 2024', tag: 'Kids', uploadedAt: '2024-11-15' },
  { id: 'c3', url: 'https://images.unsplash.com/photo-1585789575427-4e8b7edde2f9?auto=format&fit=crop&w=400&q=80', event: 'Cheti Chand', tag: 'Cheti Chand Chhajj', uploadedAt: '2025-04-01' },
  { id: 'c4', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80', event: 'Annual Function', tag: 'Stage & Cultural', uploadedAt: '2025-12-25' },
  { id: 'c5', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80', event: 'Sindhi Cultural Evening', tag: 'Family & Elders', uploadedAt: '2025-11-08' },
  { id: 'c6', url: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=400&q=80', event: 'Independence Day', tag: 'Stage & Cultural', uploadedAt: '2025-08-15' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
function StudioContent() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<StudioSection>('upload');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkedShots, setCheckedShots] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && user?.role !== 'photographer') {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#021812] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-200/70 text-sm">Loading Photographer Studio...</p>
      </div>
    );
  }

  if (user?.role !== 'photographer') {
    return (
      <div className="min-h-screen bg-[#021812] flex flex-col items-center justify-center px-4">
        <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_16px_64px_rgba(0,0,0,0.6)]">
          <div className="w-16 h-16 rounded-2xl bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-amber-300 mb-2">Photographer Access Required</h2>
          <p className="text-emerald-300/70 text-sm mb-6">
            Please log in with your Official Photographer credentials to access the bulk uploader and shot list studio.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-bold text-sm hover:from-emerald-500 hover:to-emerald-700 transition-all shadow-lg"
            >
              Sign In as Photographer
            </Link>
            <Link
              href="/"
              className="py-2.5 px-6 rounded-xl bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-sm hover:bg-emerald-900/70 transition-all"
            >
              Return to Community Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const toggleShot = (key: string) => {
    setCheckedShots(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const totalShots = SHOT_LIST.reduce((s, cat) => s + cat.shots.length, 0);
  const doneShots = checkedShots.size;

  return (
    <div className="min-h-screen bg-[#021812] text-amber-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-72 bg-emerald-950/95 border-r border-emerald-800/60 backdrop-blur-xl
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-emerald-800/60">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-300">Photographer Studio</div>
              <div className="text-xs text-emerald-400/70">आधिकारिक फोटोग्राफर</div>
            </div>
          </div>
          <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-900/50 border border-emerald-800/40">
            <div className="text-xs text-emerald-300/60">Logged in as</div>
            <div className="text-xs font-semibold text-emerald-300 truncate">{user.name}</div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                activeSection === item.id
                  ? 'bg-emerald-700/20 border border-emerald-500/30 text-emerald-300'
                  : 'text-emerald-300/70 hover:bg-emerald-900/60 hover:text-emerald-100 border border-transparent'
              }`}
            >
              <span className={activeSection === item.id ? 'text-emerald-400' : 'text-emerald-600 group-hover:text-emerald-400'}>
                {item.icon}
              </span>
              <div>
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-[10px] opacity-60">{item.labelHindi}</div>
              </div>
              {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400" />}
            </button>
          ))}

          {/* Shot list progress pill */}
          {activeSection !== 'shotlist' && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-900/30 border border-emerald-800/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-emerald-400/70 font-semibold">Shot List Progress</span>
                <span className="text-xs font-bold text-emerald-300">{doneShots}/{totalShots}</span>
              </div>
              <div className="w-full h-1.5 bg-emerald-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${(doneShots / totalShots) * 100}%` }}
                />
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-800/60 space-y-2">
          <Link href="/" className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-emerald-300/70 hover:bg-emerald-900/60 hover:text-emerald-100 transition-all text-sm">
            <Eye className="w-4 h-4" /> View Public Gallery
          </Link>
          <button onClick={() => { logout(); router.replace('/login'); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-red-400/70 hover:bg-red-900/20 hover:text-red-300 transition-all text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 bg-emerald-950/80 border-b border-emerald-800/60 backdrop-blur-md">
          <button className="md:hidden text-emerald-300 hover:text-emerald-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-emerald-200 font-display">
              {NAV_ITEMS.find(n => n.id === activeSection)?.label}
            </h1>
            <p className="text-xs text-emerald-400/60">
              {NAV_ITEMS.find(n => n.id === activeSection)?.labelHindi}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Photographer Studio
            </span>
          </div>
        </header>

        {/* Section Content */}
        <main className="flex-1 p-6 md:p-8">
          {activeSection === 'upload' && <UploadStudioSection />}
          {activeSection === 'catalog' && <CatalogSection />}
          {activeSection === 'shotlist' && (
            <ShotListSection
              checkedShots={checkedShots}
              onToggle={toggleShot}
              total={totalShots}
              done={doneShots}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Upload Studio ─────────────────────────────────────────────────────────────
function UploadStudioSection() {
  const [festivalEvents, setFestivalEvents] = useState<FestivalEvent[]>(FESTIVAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const TAG_OPTIONS = ['Maha Aarti', 'Stage & Cultural', 'Cheti Chand Chhajj', 'Family & Elders', 'Mahaprasad', 'Kids', 'General'];

  useEffect(() => {
    let isMounted = true;
    getMergedFestivalEvents().then((evts) => {
      if (isMounted && evts.length > 0) {
        setFestivalEvents(evts);
      }
    });
    const handleUpdate = () => {
      getMergedFestivalEvents().then((evts) => {
        if (isMounted && evts.length > 0) setFestivalEvents(evts);
      });
    };
    window.addEventListener('bpscvs_events_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('bpscvs_events_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-display text-emerald-300 mb-1">Bulk Upload Studio</h2>
        <p className="text-emerald-400/60 text-sm">Select the destination album and tag, then upload your festival photos in bulk.</p>
      </div>

      {/* Album & Tag Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-xs font-semibold text-emerald-300/70 mb-2">📁 Destination Festival Album</label>
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
            className="w-full bg-emerald-900/50 border border-emerald-700/60 rounded-xl px-4 py-3 text-amber-100 text-sm focus:outline-none focus:border-emerald-400/60 transition-all">
            <option value="">— Select Festival Album —</option>
            {festivalEvents.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-emerald-300/70 mb-2">🏷️ Photo Tag Category</label>
          <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)}
            className="w-full bg-emerald-900/50 border border-emerald-700/60 rounded-xl px-4 py-3 text-amber-100 text-sm focus:outline-none focus:border-emerald-400/60 transition-all">
            <option value="">— Select Category —</option>
            {TAG_OPTIONS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
      </div>

      {/* Info strip */}
      {(selectedEvent || selectedTag) && (
        <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-emerald-800/20 border border-emerald-700/30 text-sm">
          <Camera className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-300/80">
            Photos will be uploaded to: <strong className="text-emerald-200">{selectedEvent ? festivalEvents.find(e => e.id === selectedEvent)?.title : 'No album selected'}</strong>
            {selectedTag && <> · Tagged as <strong className="text-amber-300">{selectedTag}</strong></>}
          </span>
        </div>
      )}

      {/* Bulk Uploader Component */}
      <div className="rounded-2xl overflow-hidden border border-emerald-800/40">
        {selectedEvent ? (
          <BulkUploader
            eventId={selectedEvent}
            onUploadComplete={(count) => {
              console.log(`[Studio] Upload complete: ${count} photos added to event ${selectedEvent}`);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-emerald-400/60">
            <Camera className="w-10 h-10 opacity-40" />
            <p className="text-sm font-semibold">Select an event album above to start uploading</p>
          </div>
        )}
      </div>


      {/* AI Compression Info */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '~95% Bandwidth Saved', desc: 'Client-side compression pipeline', icon: '⚡' },
          { label: 'AI Face Indexing', desc: 'Auto-tag faces for resident search', icon: '🤖' },
          { label: 'Instant Publish', desc: 'Photos go live immediately after upload', icon: '🚀' },
        ].map(info => (
          <div key={info.label} className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/30">
            <span className="text-xl">{info.icon}</span>
            <div>
              <div className="text-xs font-bold text-emerald-200">{info.label}</div>
              <div className="text-xs text-emerald-400/60 mt-0.5">{info.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Catalog ─────────────────────────────────────────────────────────────────
function CatalogSection() {
  const [filterEvent, setFilterEvent] = useState('all');
  const filtered = filterEvent === 'all' ? CATALOG_PHOTOS : CATALOG_PHOTOS.filter(p => p.event === filterEvent);
  const uniqueEvents = [...new Set(CATALOG_PHOTOS.map(p => p.event))];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display text-emerald-300 mb-1">My Uploads Catalog</h2>
          <p className="text-emerald-400/60 text-sm">All photos you have uploaded, filterable by event album.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-300">{CATALOG_PHOTOS.length} Photos</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterEvent('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterEvent === 'all' ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/40' : 'text-emerald-400/60 hover:text-emerald-200 border border-transparent'}`}
        >
          All Events
        </button>
        {uniqueEvents.map(ev => (
          <button
            key={ev}
            onClick={() => setFilterEvent(ev)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterEvent === ev ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/40' : 'text-emerald-400/60 hover:text-emerald-200 border border-transparent'}`}
          >
            {ev}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(photo => (
          <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-emerald-800/40 hover:border-emerald-600/60 transition-all">
            <img src={photo.url} alt={photo.tag} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <span className="text-xs font-bold text-amber-300">{photo.tag}</span>
              <span className="text-[10px] text-emerald-300/70">{photo.event}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shot List ────────────────────────────────────────────────────────────────
function ShotListSection({ checkedShots, onToggle, total, done }: {
  checkedShots: Set<string>; onToggle: (k: string) => void; total: number; done: number;
}) {
  const pct = Math.round((done / total) * 100);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-display text-emerald-300 mb-1">Committee Shot List</h2>
        <p className="text-emerald-400/60 text-sm">Mandatory festival moments assigned by the samiti committee. Check off each shot as you capture it.</p>
      </div>

      {/* Progress bar */}
      <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-800/50 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-emerald-200">Overall Progress</span>
          <span className="text-lg font-bold font-display text-amber-300">{done}/{total} shots</span>
        </div>
        <div className="w-full h-3 bg-emerald-900 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? 'linear-gradient(90deg, #10b981, #fbbf24)' : 'linear-gradient(90deg, #10b981, #059669)',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-emerald-500">
          <span>{pct}% complete</span>
          {pct === 100 && <span className="text-amber-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> All shots captured! 🎉</span>}
        </div>
      </div>

      {/* Shot categories */}
      <div className="space-y-5">
        {SHOT_LIST.map(category => {
          const catDone = category.shots.filter(s => checkedShots.has(`${category.id}:${s}`)).length;
          return (
            <div key={category.id} className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-amber-200">{category.category}</h3>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  catDone === category.shots.length
                    ? 'bg-emerald-700/40 text-emerald-300'
                    : 'bg-emerald-900/40 text-emerald-500'
                }`}>
                  {catDone}/{category.shots.length}
                </span>
              </div>
              <div className="space-y-2">
                {category.shots.map(shot => {
                  const key = `${category.id}:${shot}`;
                  const checked = checkedShots.has(key);
                  return (
                    <button
                      key={shot}
                      onClick={() => onToggle(key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        checked
                          ? 'bg-emerald-800/30 border border-emerald-600/30'
                          : 'bg-emerald-950/30 border border-emerald-800/20 hover:border-emerald-700/40'
                      }`}
                    >
                      {checked
                        ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        : <Square className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      }
                      <span className={`text-sm ${checked ? 'text-emerald-300 line-through opacity-60' : 'text-amber-100/80'}`}>
                        {shot}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#021812] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StudioContent />
    </Suspense>
  );
}
