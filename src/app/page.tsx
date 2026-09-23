'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Camera,
  Calendar,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Moon,
  Sun,
  ChevronDown,
  Clock,
  ExternalLink,
  Users,
  Search,
  Award,
  Lock,
} from 'lucide-react';

import { FESTIVAL_EVENTS } from '@/data/festivalEvents';
import { FestivalEvent, EventPhoto } from '@/types/utsav';
import { getMergedFestivalEvents } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';

import {
  EventGalleryModal,
  FaceMatchFinder,
  FestivalPanchangSchedule,
  EventsTimeline,
} from '@/components/utsav';

import { playTempleBell, playSitarPluck } from '@/utils/audio';

export default function HomePage() {
  const [eventsList, setEventsList] = useState<FestivalEvent[]>(FESTIVAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<FestivalEvent | null>(null);
  const [activePhoto, setActivePhoto] = useState<EventPhoto | null>(null);
  const [isResidentMenuOpen, setIsResidentMenuOpen] = useState(false);
  const [isAboutMenuOpen, setIsAboutMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize and synchronize Dark Theme
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('bpscvs_theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bpscvs_theme', next ? 'dark' : 'light');
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch {}
      return next;
    });
  };

  // Dynamic Event Synchronization with Admin Panel, Supabase & DB in Real Time
  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        const merged = await getMergedFestivalEvents();
        if (isMounted && merged && merged.length > 0) {
          setEventsList(merged);
        }
      } catch (err) {
        console.warn('Failed to load merged festival events:', err);
      }
    };
    loadEvents();

    const handleUpdate = () => {
      loadEvents();
    };

    window.addEventListener('bpscvs_events_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleUpdate();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const pollInterval = setInterval(handleUpdate, 3500);

    const supabase = getSupabaseClient();
    let channel: any = null;
    if (supabase) {
      try {
        channel = supabase
          .channel('realtime_festival_events_homepage')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, handleUpdate)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, handleUpdate)
          .subscribe();
      } catch (e) {
        console.warn('Supabase realtime subscription failed:', e);
      }
    }

    return () => {
      isMounted = false;
      window.removeEventListener('bpscvs_events_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollInterval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleOpenPhoto = (photo: EventPhoto) => {
    setActivePhoto(photo);
    const parentEvent = eventsList.find((e) => e.id === photo.eventId) || null;
    setSelectedEvent(parentEvent);
    playSitarPluck('Sa');
  };

  const handleOpenEventModal = (event: FestivalEvent) => {
    setSelectedEvent(event);
    setActivePhoto(event.photos[0] || null);
    playTempleBell(840);
  };

  const scrollToSection = (sectionId: string) => {
    playSitarPluck('Re');
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter events based on search query
  const filteredEvents = eventsList.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  });

  // Featured event for Arch Notch Hero
  const featuredEvent =
    eventsList.find((e) => e.id === 'ev-independence-day' || e.title.includes('Independence')) ||
    eventsList[0];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#090E1A] text-slate-100' : 'bg-[#EAE0CE] text-[#0B1D3A]'} font-sans antialiased selection:bg-blue-700 selection:text-white transition-colors duration-300`}>
      {/* ─── TOP NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-40 w-full bg-[#EAE0CE]/95 dark:bg-[#090E1A]/95 backdrop-blur-md border-b border-[#BCAB94] dark:border-slate-800 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-12 h-12 rounded-full p-0.5 bg-white border border-[#BCAB94] dark:border-slate-700 shadow-xs group-hover:scale-105 transition-all shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src="/bpscvs-logo.png"
                alt="Bani Park Sindhi Colony Vikas Samiti"
                className="w-full h-full object-contain rounded-full scale-105"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#0B1D3A] dark:text-white leading-none">
                  BPSCVS
                </span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800">
                  New Vision, New Direction
                </span>
              </div>
              <div className="text-[11px] text-blue-900 dark:text-slate-300 font-semibold tracking-wide">
                Bani Park Sindhi Colony Vikas Samiti
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('hero-section')}
              className="px-3.5 py-2 rounded-lg text-blue-700 dark:text-white font-bold hover:bg-[#DFD4C0] dark:hover:bg-slate-800 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('events-section')}
              className="px-3.5 py-2 rounded-lg hover:text-blue-700 dark:hover:text-white hover:bg-[#DFD4C0] dark:hover:bg-slate-800 transition-colors"
            >
              All Events
            </button>
            <button
              onClick={() => scrollToSection('face-match-portal')}
              className="px-3.5 py-2 rounded-lg hover:text-blue-700 dark:hover:text-white hover:bg-[#DFD4C0] dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>Find My Photos</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                AI
              </span>
            </button>
            <button
              onClick={() => scrollToSection('timetable-section')}
              className="px-3.5 py-2 rounded-lg hover:text-blue-700 dark:hover:text-white hover:bg-[#DFD4C0] dark:hover:bg-slate-800 transition-colors"
            >
              Timetable
            </button>

            {/* About Us Dropdown on Hover & Click */}
            <div
              className="relative group"
              onMouseEnter={() => setIsAboutMenuOpen(true)}
              onMouseLeave={() => setIsAboutMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsAboutMenuOpen(!isAboutMenuOpen)}
                className="px-3.5 py-2 rounded-lg hover:text-blue-700 dark:hover:text-white hover:bg-[#DFD4C0] dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300"
              >
                <span>About Us</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                    isAboutMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isAboutMenuOpen && (
                <div className="absolute top-full left-0 pt-1.5 w-48 z-50 animate-fade-in">
                  <div className="bg-[#F5EEDB] dark:bg-[#0F172A] rounded-2xl shadow-xl border border-[#BCAB94] dark:border-slate-800 py-1.5 overflow-hidden">
                    <Link
                      href="/about/founder"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-[#E5DBC7] dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                    >
                      <Award className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <span>Founder</span>
                    </Link>
                    <Link
                      href="/about/team"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-[#E5DBC7] dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                    >
                      <Users className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>Team</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </nav>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Resident Dropdown Pill */}
            <div className="relative">
              <button
                onClick={() => setIsResidentMenuOpen(!isResidentMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F5EEDB] dark:bg-slate-900 border border-[#BCAB94] dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs hover:bg-[#FAF6EE] dark:hover:bg-slate-800 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Resident</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </button>

              {isResidentMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#F5EEDB] dark:bg-[#0F172A] rounded-2xl shadow-xl border border-[#BCAB94] dark:border-slate-800 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-[#BCAB94]/80 dark:border-slate-800">
                    <p className="text-xs font-bold text-[#0B1D3A] dark:text-white">Resident Portal</p>
                    <p className="text-[11px] text-blue-800 dark:text-slate-400 font-medium">Bani Park Sindhi Colony</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsResidentMenuOpen(false);
                      scrollToSection('face-match-portal');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-[#E5DBC7] dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-2"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    <span>Find My Photos (AI)</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsResidentMenuOpen(false);
                      scrollToSection('timetable-section');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-[#E5DBC7] dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    <span>Timetable &amp; Schedule</span>
                  </button>
                  <Link
                    href="/about/founder"
                    onClick={() => setIsResidentMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-[#E5DBC7] dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-2"
                  >
                    <Award className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    <span>Founder Profile</span>
                  </Link>
                  <Link
                    href="/about/team"
                    onClick={() => setIsResidentMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-[#E5DBC7] dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    <span>Executive Team</span>
                  </Link>
                  <div className="border-t border-[#BCAB94]/80 dark:border-slate-800 mt-1 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setIsResidentMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-[#E5DBC7] dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                        <span>Staff / Admin Login</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Icon Toggle */}
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2.5 rounded-full bg-[#F5EEDB] dark:bg-slate-900 border border-[#BCAB94] dark:border-slate-700 text-blue-700 dark:text-amber-400 hover:bg-[#FAF6EE] dark:hover:bg-slate-800 shadow-xs transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (Richer Ivory & Vivid Royal Blue with Arch Notch Hero Frame) ─── */}
      {/* ─── HERO SECTION (Richer Ivory & Vivid Royal Blue with Arch Notch Hero Frame) ─── */}
      <section
        id="hero-section"
        className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-[#EAE0CE] dark:bg-[#090E1A] transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Official Society Badge with Logo & Community Quote */}
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#F5EEDB] dark:bg-slate-900 border border-[#BCAB94] dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-blue-200 dark:border-blue-900/60 shrink-0 shadow-2xs overflow-hidden flex items-center justify-center">
                  <img
                    src="/bpscvs-logo.png"
                    alt="BPSCVS Official Seal"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-blue-950 dark:text-blue-200 tracking-wide uppercase">
                      Bani Park Sindhi Colony Vikas Samiti &amp; Matrishakti
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold text-amber-900 dark:text-amber-400">
                    &ldquo;New Vision, New Direction&rdquo; • Regd. No. 1183/2012 • Jaipur
                  </div>
                </div>
              </div>

              {/* Exact Mockup Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-[#0B1D3A] dark:text-white tracking-tight leading-[1.12]">
                Every colony gathering, and every photo you&apos;re in, in one place.
              </h1>

              {/* Exact Mockup Subtitle */}
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
                Browse upcoming samiti events, revisit past celebrations in full photo galleries, and let AI find the photos of you and your family — no more scrolling through hundreds of pictures.
              </p>

              {/* Exact Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  id="cta-find-my-photos"
                  onClick={() => scrollToSection('face-match-portal')}
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2.5 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Find My Photos (AI)</span>
                </button>

                <button
                  id="cta-explore-events"
                  onClick={() => scrollToSection('events-section')}
                  className="px-7 py-3.5 rounded-full bg-[#F5EEDB] dark:bg-slate-900 hover:bg-[#FAF6EE] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-[#BCAB94] dark:border-slate-700 shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span>Explore All Events</span>
                  <ArrowRight className="w-4 h-4 text-blue-700 dark:text-slate-400" />
                </button>
              </div>

              {/* Colony Trust Metrics */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#BCAB94] dark:border-slate-800 max-w-lg">
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-white">2012</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Established</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-white">1,200+</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Colony Residents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-white">50+</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Annual Celebrations</div>
                </div>
              </div>
            </div>

            {/* Right Arch Notch Frame Column — Official Emblem Showcase */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[380px]">
                {/* Arch Frame — Pure Logo Showcase, No Event */}
                <div className="w-full h-[480px] md:h-[520px] rounded-t-[190px] rounded-b-3xl relative shadow-2xl overflow-hidden"
                  style={{ background: 'linear-gradient(160deg, #0B1D3A 0%, #1a3a6e 45%, #0B1D3A 100%)' }}>

                  {/* Outer decorative border ring inside arch */}
                  <div className="absolute inset-3 rounded-t-[180px] rounded-b-2xl border border-white/10 pointer-events-none" />
                  <div className="absolute inset-6 rounded-t-[170px] rounded-b-xl border border-white/[0.06] pointer-events-none" />

                  {/* Subtle radial glow behind logo */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
                  </div>

                  {/* Centered Content — Logo + Name + Motto */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">

                    {/* Official Emblem with layered borders */}
                    <div className="relative flex items-center justify-center">
                      {/* Outermost decorative ring */}
                      <div className="absolute w-[215px] h-[215px] sm:w-[230px] sm:h-[230px] rounded-full border-2 border-blue-300/20 animate-[spin_18s_linear_infinite]" />
                      {/* Second ring */}
                      <div className="absolute w-[195px] h-[195px] sm:w-[210px] sm:h-[210px] rounded-full border border-blue-200/15" />
                      {/* Gold accent ring */}
                      <div className="absolute w-[178px] h-[178px] sm:w-[192px] sm:h-[192px] rounded-full border-2 border-amber-400/35" />
                      {/* White background container */}
                      <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-white p-1 sm:p-1.5 border-4 border-white/95 shadow-[0_0_45px_rgba(59,130,246,0.45),0_0_90px_rgba(59,130,246,0.2)] overflow-hidden flex items-center justify-center">
                        <img
                          src="/bpscvs-logo.png"
                          alt="Bani Park Sindhi Colony Vikas Samiti — Official Emblem"
                          className="w-full h-full object-contain rounded-full scale-105"
                        />
                      </div>
                    </div>

                    {/* Society Name */}
                    <div className="text-center space-y-1.5">
                      <div className="text-white font-bold text-sm sm:text-base tracking-wider drop-shadow-lg">
                        BPSCVS
                      </div>
                      <div className="text-blue-200 text-[11px] sm:text-xs font-semibold tracking-wide leading-snug">
                        Bani Park Sindhi Colony<br />Vikas Samiti &amp; Matrishakti
                      </div>
                      <div className="inline-block mt-1 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-semibold tracking-wide">
                        &ldquo;New Vision, New Direction&rdquo;
                      </div>
                      <div className="text-blue-300/60 text-[10px] font-medium tracking-wider">
                        REGD. NO. 1183 / 2012 • JAIPUR
                      </div>
                    </div>

                  </div>

                  {/* Bottom subtle star decoration */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 opacity-30">
                    <span className="text-amber-400 text-xs">★</span>
                    <span className="text-amber-400 text-xs">★</span>
                    <span className="text-amber-400 text-xs">★</span>
                  </div>
                </div>

                {/* Outer border frame around the entire arch */}
                <div className="absolute inset-0 rounded-t-[190px] rounded-b-3xl border-2 border-[#BCAB94]/50 dark:border-slate-700/80 pointer-events-none shadow-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMMUNITY QUOTE & HERITAGE SHOWCASE STRIP ("नई सोच, नई दिशा") ─── */}
      <section className="relative py-8 bg-[#F0E6D5] dark:bg-[#0B1220] border-y border-[#BCAB94] dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-[#F5EEDB] dark:bg-[#0F172A] border border-[#BCAB94] dark:border-slate-800 shadow-md">
            {/* Logo & Official Motto */}
            <div className="flex items-center gap-4 sm:gap-5 text-center sm:text-left">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-white border-2 border-[#BCAB94] dark:border-slate-700 shadow-md shrink-0 overflow-hidden flex items-center justify-center">
                <img
                  src="/bpscvs-logo.png"
                  alt="Bani Park Sindhi Colony Vikas Samiti & Matrishakti"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 text-xs font-extrabold border border-blue-200 dark:border-blue-800 mb-1">
                  <span>Community Motto</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#0B1D3A] dark:text-white tracking-tight">
                  &ldquo;New Vision, New Direction&rdquo;
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium mt-1">
                  Bani Park Sindhi Colony Vikas Samiti &amp; Matrishakti, Jaipur • Regd. No. 1183/2012
                </p>
              </div>
            </div>

            {/* 4 Community Core Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="p-3 rounded-2xl bg-[#EAE0CE] dark:bg-slate-900 border border-[#BCAB94]/80 dark:border-slate-800 text-center">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-300">Cultural Unity</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400">Sindhi Heritage</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#EAE0CE] dark:bg-slate-900 border border-[#BCAB94]/80 dark:border-slate-800 text-center">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-400">Women Empowerment</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400">Matrishakti Honor</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#EAE0CE] dark:bg-slate-900 border border-[#BCAB94]/80 dark:border-slate-800 text-center">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-300">Colony Welfare</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400">Resident Development</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#EAE0CE] dark:bg-slate-900 border border-[#BCAB94]/80 dark:border-slate-800 text-center">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Modern Technology</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400">AI Photo Discovery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ALL EVENTS & TIMELINE SECTION (Year-Based Accordion Timeline) ─── */}
      <section id="events-section" className="py-16 bg-[#F5EEDB] dark:bg-[#0C1222] border-t border-[#BCAB94] dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end mb-4">
            {/* Search Input */}
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-blue-700 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events across years..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#EAE0CE] dark:bg-slate-900 border border-[#BCAB94] dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              />
            </div>
          </div>

          <EventsTimeline
            events={filteredEvents}
            onOpenEvent={handleOpenEventModal}
          />
        </div>
      </section>

      {/* ─── AI FACE MATCH FINDER PORTAL ─── */}
      <section id="face-match-portal" className="py-16 bg-[#EAE0CE] dark:bg-[#090E1A] transition-colors border-t border-[#BCAB94] dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FaceMatchFinder onOpenPhotoModal={handleOpenPhoto} />
        </div>
      </section>

      {/* ─── TIMETABLE SECTION (No Hindi words, Strictly Timetable) ─── */}
      <section id="timetable-section" className="py-16 bg-[#F5EEDB] dark:bg-[#0C1222] border-t border-[#BCAB94] dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FestivalPanchangSchedule readOnly={true} />
        </div>
      </section>

      {/* ─── FOOTER (Clean Rich Ivory & Vivid Royal Blue) ─── */}
      <footer className="bg-[#F5EEDB] dark:bg-[#060A14] border-t border-[#BCAB94] dark:border-slate-800 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#BCAB94] dark:border-slate-800">
            {/* Logo in footer */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full p-0.5 bg-white border border-[#BCAB94] dark:border-slate-700 shrink-0 shadow-xs flex items-center justify-center overflow-hidden">
                <img
                  src="/bpscvs-logo.png"
                  alt="Bani Park Sindhi Colony Vikas Samiti"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#0B1D3A] dark:text-white">BPSCVS Portal</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                    New Vision, New Direction
                  </span>
                </div>
                <div className="text-[11px] text-blue-900 dark:text-slate-400 font-semibold">Bani Park Sindhi Colony Vikas Samiti &amp; Matrishakti, Jaipur</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  140, City Plaza, Space Cinema, Jhotwara Road, Jaipur
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <button onClick={() => scrollToSection('hero-section')} className="hover:text-blue-700 dark:hover:text-white transition-colors">Home</button>
              <button onClick={() => scrollToSection('events-section')} className="hover:text-blue-700 dark:hover:text-white transition-colors">Events</button>
              <button onClick={() => scrollToSection('face-match-portal')} className="hover:text-blue-700 dark:hover:text-white transition-colors">AI Photos</button>
              <button onClick={() => scrollToSection('timetable-section')} className="hover:text-blue-700 dark:hover:text-white transition-colors">Timetable</button>
              <Link href="/about/founder" className="hover:text-blue-700 dark:hover:text-white transition-colors">Founder</Link>
              <Link href="/about/team" className="hover:text-blue-700 dark:hover:text-white transition-colors">Team</Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <p className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} Bani Park Sindhi Colony Vikas Samiti (Regd. No. 1183/2012). All rights reserved.</span>
              <Link href="/login" title="Authorized Access" className="text-slate-400/60 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors inline-flex items-center">
                <Lock className="w-2.5 h-2.5" />
              </Link>
            </p>
            <p className="flex items-center gap-1 text-blue-900 dark:text-slate-300 font-semibold">
              &ldquo;New Vision, New Direction&rdquo; • Celebrating heritage &amp; community unity.
            </p>
          </div>
        </div>
      </footer>

      {/* ─── MODALS ─── */}
      {/* Photo Lightbox Modal */}
      <EventGalleryModal
        event={selectedEvent}
        activePhoto={activePhoto}
        onClose={() => {
          setSelectedEvent(null);
          setActivePhoto(null);
        }}
        onSelectPhoto={(photo) => setActivePhoto(photo)}
      />
    </div>
  );
}
