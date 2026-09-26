'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, ShieldCheck, Award, Phone } from 'lucide-react';
import {
  BPSCVS_COMMITTEE_MEMBERS,
  BPSCVS_ADVISORS,
  BPSCVS_EXECUTIVE_MEMBERS,
} from '@/data/bpscvsData';

// Clean English designations without Hindi or Devanagari parentheticals
const cleanDesignation = (desig: string): string => {
  return desig
    .replace(/\s*\([^)]*[\u0900-\u097F][^)]*\)/g, '')
    .replace(/[\u0900-\u097F]+/g, '')
    .replace(/\(\s*\)/g, '')
    .trim();
};

export default function TeamPage() {
  const founder =
    BPSCVS_COMMITTEE_MEMBERS.find((m) => m.roleType === 'founder') ||
    BPSCVS_COMMITTEE_MEMBERS[0];

  // Office Bearers (excluding the Founder who has his own dedicated page)
  const officeBearers = BPSCVS_COMMITTEE_MEMBERS.filter((m) => m.id !== founder.id);

  // Advisory Board (including Founder)
  const advisoryBoard = [...BPSCVS_ADVISORS];

  const getInitials = (name: string) => {
    const clean = name.replace(/^(Shri|Smt\.|Dr\.|Mr\.|Mrs\.)\s+/i, '');
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

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
              <span>Back to Home</span>
            </Link>
            <Link
              href="/about/founder"
              className="px-3.5 py-2 rounded-lg text-blue-800 hover:text-blue-900 hover:bg-[#DFD4C0] transition-colors font-bold"
            >
              Founder Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Main Team Content ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* Page Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-xs font-bold uppercase tracking-wider text-blue-800 mb-3">
            <Users className="w-3.5 h-3.5 text-blue-700" />
            <span>Society Leadership &amp; Committee</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#0B1D3A] tracking-tight">
            Samiti Team &amp; Members
          </h1>
          <p className="text-sm sm:text-base text-slate-700 mt-2">
            Dedicated office bearers, advisors, and executive members working together for Bani Park Sindhi Colony.
          </p>
        </div>

        {/* ─── SECTION 0: Founder Showcase ─── */}
        <section className="mb-12 border-b border-[#BCAB94] pb-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-xl border-4 border-[#F5EEDB] bg-slate-100 relative shrink-0">
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
            
            <div className="max-w-xl">
              <h2 className="text-3xl font-display font-bold text-[#0B1D3A]">
                {founder.name}
              </h2>
              <div className="text-lg font-bold text-blue-800 mt-1">Founder & Visionary</div>
              <p className="text-sm text-slate-700 mt-4 leading-relaxed font-medium">
                In 2012, Shri Neeraj Dialani recognized the need for an organized community body to preserve Sindhi cultural heritage, coordinate civic infrastructure, and bring families together for annual festivals in Bani Park Sindhi Colony, Jaipur.
              </p>
              <div className="mt-6">
                <Link
                  href="/about/founder"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold shadow-md transition-colors"
                >
                  Read Full Founder Profile
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 1: Office Bearers & Key Posts ─── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#BCAB94] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1D3A]">
                Office Bearers
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {officeBearers.length} Officers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {officeBearers.map((member) => {
              const desig = cleanDesignation(member.designation);
              return (
                <div
                  key={member.id}
                  className="rounded-2xl bg-[#F5EEDB] border border-[#BCAB94] p-5 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-blue-600 hover:bg-[#FAF6EE] transition-all"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#FAF6EE] border-2 border-[#BCAB94] shadow-xs shrink-0 flex items-center justify-center text-slate-700 font-bold text-xs">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-800 font-bold text-sm">
                        {getInitials(member.name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#0B1D3A] truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-blue-800 truncate mt-0.5">
                      {desig}
                    </p>
                    {member.phone && (
                      <a
                        href={`tel:${member.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-700 font-mono font-medium mt-1.5 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-blue-700" />
                        <span>{member.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION 2: Senior Advisory Board ─── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#BCAB94] pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-700" />
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1D3A]">
                Senior Advisory Board
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {advisoryBoard.length} Advisors
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {advisoryBoard.map((advisor, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#F5EEDB] border border-[#BCAB94] p-5 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-blue-600 hover:bg-[#FAF6EE] transition-all"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 border-2 border-blue-300 shadow-xs shrink-0 flex items-center justify-center text-blue-800 font-bold text-xs">
                  {getInitials(advisor.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#0B1D3A] truncate">
                    {advisor.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-700 truncate mt-0.5">
                    Senior Advisor
                  </p>
                  {advisor.phone && (
                    <a
                      href={`tel:${advisor.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-700 font-mono font-medium mt-1.5 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-blue-700" />
                      <span>{advisor.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION 3: Executive Committee Members ─── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#BCAB94] pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1D3A]">
                Executive Committee Members
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {BPSCVS_EXECUTIVE_MEMBERS.length} Members
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {BPSCVS_EXECUTIVE_MEMBERS.map((memberName, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#F5EEDB] border border-[#BCAB94] p-4 flex items-center gap-3.5 shadow-xs hover:shadow-md hover:border-blue-600 hover:bg-[#FAF6EE] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-[#FAF6EE] border border-[#BCAB94] shrink-0 flex items-center justify-center text-xs font-bold text-blue-800">
                  {getInitials(memberName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-[#0B1D3A] truncate">
                    {memberName}
                  </h4>
                  <p className="text-xs font-medium text-slate-600 truncate mt-0.5">
                    Executive Member
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-[#F5EEDB] border-t border-[#BCAB94] py-8 text-center text-xs text-slate-600">
        <p>© {new Date().getFullYear()} Bani Park Sindhi Colony Vikas Samiti (Regd. No. 1183/2012) • 140, City Plaza, Space Cinema, Jhotwara Road, Jaipur</p>
        <p className="mt-1 font-semibold text-blue-900">&ldquo;New Vision, New Direction&rdquo; • BPSCVS Official Community Portal</p>
      </footer>
    </div>
  );
}
