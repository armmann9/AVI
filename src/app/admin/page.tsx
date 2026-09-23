'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { getAllEvents, createEvent, updateEvent, deleteEvent, resetToSeed, getAllRsvps, safeLocalStorageSet } from '@/lib/db';
import { INITIAL_EVENTS } from '@/lib/sampleData';
import { EventItem } from '@/lib/types';
import { FESTIVAL_EVENTS } from '@/data/festivalEvents';
import { formatFestiveDate } from '@/utils/dateUtils';
import { EventRsvpRecord, FestivalEvent } from '@/types/utsav';
import {
  Calendar, Clock, Users, Wrench,
  LogOut, Eye, Plus, Minus, Pencil, Trash2, Check, X as XIcon,
  ChevronRight, ShieldCheck, Download, Search,
  Printer, Bell, Menu, ArrowUpRight, Camera, QrCode, Sparkles, MapPin, RefreshCw,
  Sliders, Settings, SunDim, Palette, Lightbulb, Save, CheckCircle2, Globe, Database, Radio, Flame,
  UserCheck, Phone, ToggleLeft, ToggleRight, Share2, Link2, Copy
} from 'lucide-react';
import QRCodeModal from '@/components/QRCodeModal';
import {
  NoticeBoardPosterModal,
  WhatsAppBroadcastModal,
  FestivalPanchangSchedule,
} from '@/components/utsav';
import { playSitarPluck, playTempleBell } from '@/utils/audio';

type AdminSection = 'events' | 'panchang' | 'tools' | 'settings';

// ─── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV_ITEMS: { id: AdminSection; label: string; labelHindi: string; icon: React.ReactNode }[] = [
  { id: 'events', label: 'Event Management', labelHindi: 'Festival Archives', icon: <Calendar className="w-4 h-4" /> },
  { id: 'panchang', label: 'Timetable & Schedule', labelHindi: 'Event Timetable', icon: <Clock className="w-4 h-4" /> },
  { id: 'tools', label: 'Quick Tools & Notices', labelHindi: 'Printable Notices & Broadcast', icon: <Wrench className="w-4 h-4" /> },
  { id: 'settings', label: 'Society & System Settings', labelHindi: 'Colony & System Setup', icon: <Sliders className="w-4 h-4" /> },
];

// ─── Main component ───────────────────────────────────────────────────────────
function AdminPanelContent() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('events');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNoticePosterOpen, setIsNoticePosterOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#021812] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-amber-300 font-semibold text-sm">Loading Admin Panel...</p>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#021812] flex flex-col items-center justify-center px-4">
        <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-3xl p-8 max-w-md w-full text-center shadow-lg backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-amber-100 mb-2">Admin Access Required</h2>
          <p className="text-emerald-200/80 text-sm mb-6">
            Please log in with your Executive Committee credentials to access this dashboard.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-emerald-950 font-bold text-sm transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
            >
              Sign In as Admin
            </Link>
            <Link
              href="/"
              className="py-2.5 px-6 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 text-amber-200 text-sm font-semibold transition-all"
            >
              Return to Community Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] flex font-sans">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-50 w-64 bg-[#0F1E36] text-white border-r border-slate-800
        flex flex-col transition-transform duration-300 shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-white">BPSCVS Admin</div>
              <div className="text-[11px] text-slate-400">Executive Management</div>
            </div>
          </div>
          <div className="mt-3 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Logged in as</div>
            <div className="text-xs font-semibold text-blue-300 truncate">{user.email}</div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 ${
                activeSection === item.id
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <span className={activeSection === item.id ? 'text-white' : 'text-slate-400'}>
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">{item.label}</div>
              </div>
              {activeSection === item.id && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-1.5">
          <Link
            href="/"
            className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-xs font-semibold"
          >
            <Eye className="w-4 h-4 text-blue-400" />
            <span>View Public Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl text-red-400 hover:bg-red-950/30 transition-all text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/95 border-b border-stone-200 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-[#1B365D] hover:text-[#0F1E36] p-1"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#0F172A] font-display">
                {NAV_ITEMS.find(n => n.id === activeSection)?.label}
              </h1>
              <p className="text-xs text-slate-500">
                {NAV_ITEMS.find(n => n.id === activeSection)?.labelHindi}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1B365D] border border-blue-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#1B365D] animate-pulse" />
              Admin Panel Active
            </span>
          </div>
        </header>

        {/* Section Content */}
        <main className="flex-1 p-6 md:p-8">
          {activeSection === 'events' && (
            <EventManagementSection showToast={showToast} />
          )}
          {activeSection === 'panchang' && (
            <div>
              <SectionHeader title="Colony Timetable" subtitle="Manage celebration timings, programme schedule, and feast hours." />
              <div className="mt-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                <FestivalPanchangSchedule readOnly={false} />
              </div>
            </div>
          )}
          {activeSection === 'tools' && (
            <QuickToolsSection
              onOpenPoster={() => setIsNoticePosterOpen(true)}
              onOpenBroadcast={() => setIsBroadcastModalOpen(true)}
            />
          )}
          {activeSection === 'settings' && (
            <FestivalSettingsSection showToast={showToast} />
          )}
        </main>
      </div>

      {/* Modals */}
      <NoticeBoardPosterModal isOpen={isNoticePosterOpen} onClose={() => setIsNoticePosterOpen(false)} events={FESTIVAL_EVENTS} />
      <WhatsAppBroadcastModal isOpen={isBroadcastModalOpen} onClose={() => setIsBroadcastModalOpen(false)} events={FESTIVAL_EVENTS} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-emerald-950 font-bold text-sm shadow-[0_4px_20px_rgba(245,158,11,0.4)] flex items-center gap-2 animate-bounce">
          <Bell className="w-4 h-4 text-emerald-950" />
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0F172A]">{title}</h2>
      <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
    </div>
  );
}

// ─── 1. Event Management (Side-by-Side Clean Layout with Pill Buttons) ───────────
function EventManagementSection({ showToast }: { showToast: (m: string) => void }) {
  // Start empty — loadEvents() fills from localStorage/DB immediately
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedQrEvent, setSelectedQrEvent] = useState<EventItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Deepotsav');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'completed'>('upcoming');

  const refreshEvents = async () => {
    setLoadingEvents(true);
    const data = await getAllEvents();
    setEvents(data);
    setLoadingEvents(false);
  };

  useEffect(() => {
    refreshEvents();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('Deepotsav');
    setDate('');
    setTime('18:00');
    setVenue('');
    setDescription('');
    setCover('');
    setDriveUrl('');
    setStatus('upcoming');
  };

  const loadIntoForm = (ev: EventItem) => {
    setEditingId(ev.id);
    setName(ev.title);
    setCategory(ev.category || 'Deepotsav');
    setDate(ev.date);
    setTime(ev.time || '18:00');
    setVenue(ev.location);
    setDescription(ev.description || '');
    setCover(ev.coverImage);
    setDriveUrl(ev.driveUrl || '');
    setStatus(ev.status || 'upcoming');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const coverPhoto = cover.trim() || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80';

    if (editingId) {
      await updateEvent(editingId, {
        title: name.trim(),
        category,
        slug,
        date,
        time,
        location: venue.trim(),
        description: description.trim(),
        coverImage: coverPhoto,
        driveUrl: driveUrl.trim(),
        status,
      });
      showToast('✅ Event updated successfully.');
    } else {
      await createEvent({
        title: name.trim(),
        category,
        slug,
        date,
        time,
        location: venue.trim(),
        description: description.trim(),
        coverImage: coverPhoto,
        driveUrl: driveUrl.trim(),
        status,
        isPublic: true,
      });
      showToast('✅ Event created successfully.');
    }
    resetForm();
    await refreshEvents();
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      await deleteEvent(id);
      showToast('🗑️ Event deleted.');
      await refreshEvents();
    }
  };

  const handleResetToSample = async () => {
    if (confirm('Reset events back to initial seed/sample data? This cannot be undone.')) {
      await resetToSeed();
      await refreshEvents();
      showToast('🔄 Reset to sample data.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Description Banner */}
      <div>
        <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400">Admin Panel</h1>
        <p className="text-emerald-200/70 text-sm mt-1">
          Create and manage events. Changes save to this browser (via localStorage) — wire this up to the real backend when it's ready.
        </p>
      </div>

      {/* Two-Column Side-by-Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Create / Edit Event Form */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-stone-100">
            <h2 className="text-lg font-display font-bold text-[#0F172A]">
              {editingId ? 'Edit Event' : 'Create New Event'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-red-500 hover:text-red-700 font-semibold"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Annual Function 2027"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1B365D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1B365D]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1B365D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Venue</label>
              <input
                required
                type="text"
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="e.g. Community Hall, Bani Park"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1B365D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Short Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What's happening at this event?"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1B365D] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cover Photo URL</label>
              <input
                type="text"
                value={cover}
                onChange={e => setCover(e.target.value)}
                placeholder="https://..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1B365D]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Google Drive Album / Folder Link</label>
                <span className="text-[10px] text-blue-600 font-semibold">Optional • Public Archive</span>
              </div>
              <input
                type="url"
                value={driveUrl}
                onChange={e => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1B365D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1B365D]"
                >
                  <option value="Deepotsav">Deepotsav</option>
                  <option value="Cheti Chand">Cheti Chand</option>
                  <option value="Cultural">Cultural</option>
                  <option value="National">National</option>
                  <option value="Community">Community</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'upcoming' | 'completed')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1B365D]"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#1B365D] hover:bg-[#0F1E36] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              {editingId ? 'Save Changes' : 'Create Event'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: All Events Table */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
            <h2 className="text-xl font-display font-bold text-[#0F172A]">
              {loadingEvents ? 'Loading events...' : `All Events (${events.length})`}
            </h2>
            <button
              onClick={handleResetToSample}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Reset to canonical events
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold border-b border-stone-100">
                  <th className="pb-3 pl-1 font-medium">Cover</th>
                  <th className="pb-3 px-3 font-medium">Event</th>
                  <th className="pb-3 px-3 font-medium">Date</th>
                  <th className="pb-3 px-3 font-medium">Status</th>
                  <th className="pb-3 pr-1 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {events.map((ev) => {
                  const isUpcoming = ev.status === 'upcoming' || (!ev.status && new Date(ev.date) >= new Date());
                  return (
                    <tr key={ev.id} className="hover:bg-stone-50 transition-colors">
                      {/* Cover Thumbnail */}
                      <td className="py-3.5 pl-1">
                        <img
                          src={ev.coverImage}
                          alt={ev.title}
                          className="w-12 h-10 rounded-lg object-cover border border-stone-200"
                        />
                      </td>

                      {/* Title & Venue */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#0F172A] text-sm leading-tight">{ev.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{ev.location}</div>
                        {ev.driveUrl && (
                          <a
                            href={ev.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-blue-600 hover:underline"
                            title="Open Google Drive Album"
                          >
                            <span>Drive Album</span>
                          </a>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatFestiveDate(ev.date)}
                      </td>

                      {/* Status Pill */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isUpcoming
                            ? 'bg-blue-50 text-[#1B365D] border border-blue-200'
                            : 'bg-stone-100 text-slate-600 border border-stone-200'
                        }`}>
                          {isUpcoming ? 'Upcoming' : 'Completed'}
                        </span>
                      </td>

                      {/* Action Pill Buttons */}
                      <td className="py-3.5 pr-1 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View */}
                          <Link
                            href={`/event/${ev.slug || ev.id}`}
                            className="px-3 py-1 rounded-xl border border-stone-200 text-slate-700 hover:bg-stone-100 font-semibold text-xs transition-all"
                          >
                            View
                          </Link>

                          {/* Edit */}
                          <button
                            onClick={() => loadIntoForm(ev)}
                            className="px-3 py-1 rounded-xl border border-stone-200 text-slate-700 hover:bg-stone-100 font-semibold text-xs transition-all"
                          >
                            Edit
                          </button>

                          {/* Upload */}
                          <Link
                            href={`/admin/upload/${ev.id}`}
                            className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-[#1B365D] hover:bg-blue-100 font-semibold text-xs transition-all"
                          >
                            Upload
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(ev.id, ev.title)}
                            className="px-3 py-1 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs transition-all"
                          >
                            Delete
                          </button>

                          {/* QR */}
                          <button
                            onClick={() => setSelectedQrEvent(ev)}
                            className="px-2.5 py-1 rounded-xl border border-stone-200 text-slate-600 hover:bg-stone-100 text-xs font-semibold transition-all"
                            title="QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedQrEvent && (
        <QRCodeModal
          event={selectedQrEvent}
          onClose={() => setSelectedQrEvent(null)}
        />
      )}
    </div>
  );
}

// ─── 3. Quick Tools ───────────────────────────────────────────────────────────
function QuickToolsSection({ onOpenPoster, onOpenBroadcast }: { onOpenPoster: () => void; onOpenBroadcast: () => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Executive Quick Tools" subtitle="Generate printable notices, broadcast messages, and manage communications." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1B365D] mb-4 border border-blue-100">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-display font-bold text-[#0F172A] mb-1">Notice Board QR Poster</h3>
            <p className="text-xs text-slate-500 mb-6">Generate ready-to-print official colony notice board posters with event QR codes.</p>
          </div>
          <button
            onClick={onOpenPoster}
            className="w-full py-2.5 rounded-xl bg-[#1B365D] hover:bg-[#0F1E36] text-white text-xs font-bold transition-all shadow-sm"
          >
            Open Poster Generator
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-display font-bold text-[#0F172A] mb-1">WhatsApp Broadcast Composer</h3>
            <p className="text-xs text-slate-500 mb-6">Compose formatted invitation broadcasts with event links ready to forward to colony WhatsApp groups.</p>
          </div>
          <button
            onClick={onOpenBroadcast}
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            Open WhatsApp Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 4. Society Profile & System Settings ────────────────────────────────────
function FestivalSettingsSection({ showToast }: { showToast: (m: string) => void }) {
  // Society Metadata
  const [societyName, setSocietyName] = useState('Bani Park Sindhi Colony Vikas Samiti');
  const [colonyAddress, setColonyAddress] = useState('140, City Plaza, Space Cinema, Jhotwara Road, Jaipur');
  const [helplinePhone, setHelplinePhone] = useState('+91 97822 12099');
  const [allowPublicUploads, setAllowPublicUploads] = useState(true);

  // Cloud Sync
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [cloudStatus, setCloudStatus] = useState<'configured' | 'offline'>('offline');

  // Load initial settings
  useEffect(() => {
    try {
      const sName = localStorage.getItem('bpscvs_society_name');
      if (sName) setSocietyName(sName);

      const sAddr = localStorage.getItem('bpscvs_society_address');
      if (sAddr) setColonyAddress(sAddr);

      const sPhone = localStorage.getItem('bpscvs_helpline_phone');
      if (sPhone) setHelplinePhone(sPhone);

      const customUrl = localStorage.getItem('eventlens_supabase_url') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const customKey = localStorage.getItem('eventlens_supabase_key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      setSupabaseUrl(customUrl);
      setSupabaseKey(customKey);
      if (customUrl && customUrl.startsWith('http')) {
        setCloudStatus('configured');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveSocietyInfo = () => {
    try {
      localStorage.setItem('bpscvs_society_name', societyName);
      localStorage.setItem('bpscvs_society_address', colonyAddress);
      localStorage.setItem('bpscvs_helpline_phone', helplinePhone);
      playSitarPluck('Re');
      showToast('🏛️ Samiti profile details updated successfully!');
    } catch (e) {
      showToast('⚠️ Failed to save society profile');
    }
  };

  const handleSaveCloudSettings = () => {
    try {
      if (supabaseUrl.trim()) {
        localStorage.setItem('eventlens_supabase_url', supabaseUrl.trim());
      } else {
        localStorage.removeItem('eventlens_supabase_url');
      }
      if (supabaseKey.trim()) {
        localStorage.setItem('eventlens_supabase_key', supabaseKey.trim());
      } else {
        localStorage.removeItem('eventlens_supabase_key');
      }

      if (supabaseUrl.trim().startsWith('http')) {
        setCloudStatus('configured');
        showToast('☁️ Supabase Cloud credentials saved!');
      } else {
        setCloudStatus('offline');
        showToast('💾 Reverted to local storage offline mode.');
      }
    } catch {
      showToast('⚠️ Error updating cloud configuration');
    }
  };

  const handleResetSeedData = async () => {
    if (confirm('Are you sure you want to reset festival events back to the canonical seed data?')) {
      await resetToSeed();
      window.dispatchEvent(new Event('bpscvs_events_updated'));
      showToast('🔄 Database reset to official BPSCVS Festival seed data!');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <SectionHeader
        title="Society & System Settings"
        subtitle="Manage official samiti profile, emergency contacts, cloud synchronization, and system maintenance."
      />

      {/* ── 1. SAMITI & COLONY PROFILE CONFIGURATION ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1B365D]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-[#0F172A]">Samiti & Colony Information</h3>
              <p className="text-xs text-slate-500">Displayed in portal footers, invitation posters, and notice board broadcasts.</p>
            </div>
          </div>
          <button
            onClick={handleSaveSocietyInfo}
            className="px-4 py-2 rounded-xl bg-[#1B365D] hover:bg-[#0F1E36] text-white text-xs font-bold transition-all"
          >
            Save Info
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Society / Samiti Title
            </label>
            <input
              type="text"
              value={societyName}
              onChange={(e) => setSocietyName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#1B365D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Emergency Samiti Helpline
            </label>
            <input
              type="text"
              value={helplinePhone}
              onChange={(e) => setHelplinePhone(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#1B365D]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Colony Address & Jurisdiction
            </label>
            <input
              type="text"
              value={colonyAddress}
              onChange={(e) => setColonyAddress(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#1B365D]"
            />
          </div>
        </div>

        {/* Feature Toggle */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Public Photo Drop</div>
              <div className="text-[11px] text-slate-500">Allow colony residents to submit celebration photos</div>
            </div>
            <button
              onClick={() => setAllowPublicUploads(!allowPublicUploads)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                allowPublicUploads
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-stone-200 text-slate-600'
              }`}
            >
              {allowPublicUploads ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. SUPABASE CLOUD SYNC & STORAGE ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1B365D]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-[#0F172A]">Supabase Cloud Database & Storage</h3>
              <p className="text-xs text-slate-500">Connect cloud backend for multi-device sync and high-res media storage.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              cloudStatus === 'configured'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${cloudStatus === 'configured' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {cloudStatus === 'configured' ? 'Cloud Connected' : 'Local Offline Mode'}
            </span>
            <button
              onClick={handleSaveCloudSettings}
              className="px-4 py-2 rounded-xl bg-[#1B365D] hover:bg-[#0F1E36] text-white text-xs font-bold transition-all shadow-sm"
            >
              Save Credentials
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1B365D] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Supabase Anon Public API Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1B365D] font-mono"
            />
          </div>
        </div>
      </div>

      {/* ── 3. SYSTEM MAINTENANCE & RECOVERY ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-blue-600" /> Reset to Canonical Seed Data
          </h4>
          <p className="text-xs text-slate-500">
            Restore all official BPSCVS 2026 festival events, panchang details, and default gallery images.
          </p>
        </div>

        <button
          onClick={handleResetSeedData}
          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all shrink-0"
        >
          Reset All Events
        </button>
      </div>
    </div>
  );
}



export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#021812] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminPanelContent />
    </Suspense>
  );
}

