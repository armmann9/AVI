'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Users, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AboutHubPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] font-sans antialiased selection:bg-blue-900 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border-2 border-[#0F172A] flex items-center justify-center bg-white shadow-xs group-hover:bg-slate-50 transition-colors">
              <div className="w-5 h-6 border-2 border-[#0F172A] border-b-0 rounded-t-full flex items-end justify-center pb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0F172A]" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-[#0F172A] leading-none">
                BPSCVS
              </div>
              <div className="text-[11px] text-slate-600 font-medium tracking-wide">
                Bani Park Sindhi Colony Vikas Samiti
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-slate-700 hover:text-[#0F172A] hover:bg-stone-100 transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* Main Hub */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold uppercase tracking-wider text-blue-900 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
          <span>About Bani Park Sindhi Colony</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-black text-[#0F172A] tracking-tight mb-4">
          About Our Society
        </h1>
        <p className="text-base text-slate-600 max-w-xl mx-auto mb-12">
          Explore the founder’s vision and meet the executive leadership committee guiding our colony.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          {/* Founder Link Card */}
          <Link
            href="/about/founder"
            className="group rounded-3xl bg-white border border-stone-200 p-8 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-display text-[#0F172A] group-hover:text-blue-900 transition-colors mb-2">
                Founder Profile
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Learn about Shri Neeraj Dialani, the foundational vision behind the Samiti, and our community heritage since 2012.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-blue-900">
              <span>View Founder Profile</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Team Link Card */}
          <Link
            href="/about/team"
            className="group rounded-3xl bg-white border border-stone-200 p-8 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-display text-[#0F172A] group-hover:text-blue-900 transition-colors mb-2">
                Executive Team
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Meet the active committee members, office bearers, and patrons serving Bani Park Sindhi Colony families.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-blue-900">
              <span>View Executive Committee</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-stone-200 py-8 text-center text-xs text-slate-600">
        <p>© {new Date().getFullYear()} Bani Park Sindhi Colony Vikas Samiti. All rights reserved.</p>
      </footer>
    </div>
  );
}
