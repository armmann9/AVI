'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  ShieldCheck,
  Quote,
  Calendar,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Phone,
} from 'lucide-react';
import { BPSCVS_COMMITTEE_MEMBERS } from '@/data/bpscvsData';

export default function FounderPage() {
  const founder =
    BPSCVS_COMMITTEE_MEMBERS.find((m) => m.roleType === 'founder') ||
    BPSCVS_COMMITTEE_MEMBERS[0];

  return (
    <div className="min-h-screen bg-[#EAE0CE] text-[#0B1D3A] font-sans antialiased selection:bg-blue-700 selection:text-white">
      {/* ─── Top Navigation Bar ─── */}
      <header className="sticky top-0 z-40 w-full bg-[#EAE0CE]/95 backdrop-blur-md border-b border-[#BCAB94] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-full p-0.5 bg-white border border-[#BCAB94] shadow-xs group-hover:scale-105 transition-all shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src="/bpscvs-logo.png"
                alt="बनीपार्क सिन्धी कॉलोनी विकास समिति"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#0B1D3A] leading-none">
                  BPSCVS
                </span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold border border-blue-200">
                  New Vision, New Direction
                </span>
              </div>
              <div className="text-[11px] text-blue-900 font-semibold tracking-wide">
                Bani Park Sindhi Colony Vikas Samiti
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3 text-sm font-semibold">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-[#DFD4C0] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/about/team"
              className="px-3.5 py-2 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-[#DFD4C0] transition-colors"
            >
              Executive Team
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Main Founder Showcase ─── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumb / Top label */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-xs font-bold uppercase tracking-wider text-blue-800 mb-3">
            <Award className="w-3.5 h-3.5 text-blue-700" />
            <span>Dedicated Founder Profile</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#0B1D3A] tracking-tight">
            Founder &amp; Visionary
          </h1>
          <p className="text-sm sm:text-base text-slate-700 mt-2 max-w-2xl">
            The story, foundational vision, and stewardship behind Bani Park Sindhi Colony Vikas Samiti since 2012.
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-3xl bg-[#F5EEDB] border border-[#BCAB94] shadow-md p-6 sm:p-10 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
            {/* Left Column: Prominent Portrait Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-xl border-4 border-[#F5EEDB] bg-slate-100 relative">
                <div className="aspect-[3/4] w-full relative overflow-hidden">
                  <img
                    src={founder.avatar || '/neeraj-dialani-founder.jpg'}
                    alt={founder.name}
                    className="w-full h-full object-cover object-top"
                    style={{ maxHeight: '460px', width: '100%' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-[#F5EEDB]/95 backdrop-blur-md rounded-2xl p-4 border border-[#BCAB94] shadow-sm">
                  <div className="text-base font-bold text-[#0B1D3A]">{founder.name}</div>
                  <div className="text-xs text-blue-800 font-bold mt-0.5">
                    Founder
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Bani Park Sindhi Colony Vikas Samiti • Established 2012
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    140, City Plaza, Space Cinema, Jhotwara Road, Jaipur
                  </div>
                </div>
              </div>

              {/* Quick Navigation to Team */}
              <div className="w-full max-w-sm mt-5">
                <Link
                  href="/about/team"
                  className="w-full py-3 px-4 rounded-2xl bg-[#FAF6EE] hover:bg-[#EAE0CE] border border-[#BCAB94] text-xs font-bold text-slate-800 hover:text-blue-800 transition-colors flex items-center justify-between shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-700" />
                    Meet the Executive Committee
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Bio & Vision Details */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1D3A]">
                  {founder.name}
                </h2>
                <div className="text-base font-bold text-blue-800 mt-1">
                  Founder
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Founding Year 2012 • Founder
                </div>
                {founder.phone && (
                  <div className="mt-3">
                    <a
                      href={`tel:${founder.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-800 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-700" />
                      <span>{founder.phone}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Founder's Vision Quote */}
              <div className="p-6 rounded-2xl bg-[#FAF6EE] border border-[#BCAB94] relative">
                <Quote className="w-8 h-8 text-blue-900/15 absolute top-4 right-4" />
                <p className="text-sm sm:text-base italic text-slate-800 leading-relaxed font-medium">
                  &ldquo;Our colony is more than a residential neighborhood — it is an extended family bonded by deep cultural roots, mutual respect, and festive joy. Every celebration we share strengthens the ties of our community for generations to come.&rdquo;
                </p>
                <div className="mt-4 text-xs font-bold uppercase tracking-wider text-blue-800">
                  — Message from the Founder
                </div>
              </div>

              {/* Detailed Narrative */}
              <div className="space-y-4 text-sm text-slate-700 leading-relaxed font-normal">
                <p>
                  In 2012, <strong>Shri Neeraj Dialani</strong> recognized the need for an organized community body to preserve Sindhi cultural heritage, coordinate civic infrastructure, and bring families together for annual festivals in Bani Park Sindhi Colony, Jaipur.
                </p>
                <p>
                  Under his visionary initiative, the Samiti was registered under the Societies Registration Act (Regd. No. 1183/2012). Since its founding, the organization has coordinated grand festivals, welfare drives, civic development, and youth cultural activities.
                </p>
                <p>
                  Today, serving more than 1,200 colony residents, Shri Neeraj Dialani continues to provide active guidance and guidance to the executive committee and young colony volunteers.
                </p>
              </div>

              {/* Milestone Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#BCAB94]">
                <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#BCAB94] text-center">
                  <div className="text-2xl font-bold text-[#0B1D3A]">2012</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Founded Year</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#BCAB94] text-center">
                  <div className="text-2xl font-bold text-[#0B1D3A]">1,200+</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Residents</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#BCAB94] text-center">
                  <div className="text-2xl font-bold text-[#0B1D3A]">50+</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Celebrations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-[#F5EEDB] border-t border-[#BCAB94] py-8 text-center text-xs text-slate-600">
        <p>© {new Date().getFullYear()} Bani Park Sindhi Colony Vikas Samiti (Regd. No. 1183/2012) • 140, City Plaza, Space Cinema, Jhotwara Road, Jaipur</p>
        <p className="mt-1 font-semibold text-blue-900">&ldquo;New Vision, New Direction&rdquo; • BPSCVS Official Community Portal</p>
      </footer>
    </div>
  );
}
