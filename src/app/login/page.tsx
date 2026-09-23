'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import {
  Eye,
  EyeOff,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  Award,
} from 'lucide-react';

type RoleTab = 'admin' | 'photographer';

export default function ModernLoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<RoleTab>('admin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tab change handler
  const handleTabChange = (tab: RoleTab) => {
    setActiveTab(tab);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setSubmitting(true);
    setError('');
    try {
      const res = await login(activeTab, email, password);
      if (res.ok) {
        router.replace(activeTab === 'admin' ? '/admin' : '/studio');
      } else {
        setError(res.error || 'Invalid credentials. Please verify your email and password.');
        setSubmitting(false);
      }
    } catch {
      setError('An unexpected login error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-700 text-sm font-semibold">Securing encrypted session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAE0CE] text-[#0B1D3A] flex flex-col justify-between relative overflow-x-hidden selection:bg-blue-700 selection:text-white font-sans">
      {/* Background Soft Subtle Gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[650px] h-[650px] rounded-full bg-blue-600/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-amber-500/[0.06] blur-[120px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 px-6 sm:px-12 py-5 flex items-center justify-between border-b border-[#BCAB94] bg-[#EAE0CE]/95 backdrop-blur-md shadow-xs">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-full p-0.5 bg-white border border-[#BCAB94] shadow-xs group-hover:scale-105 transition-transform shrink-0 overflow-hidden flex items-center justify-center">
            <img
              src="/bpscvs-logo.png"
              alt="बनीपार्क सिन्धी कॉलोनी विकास समिति"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#0B1D3A] tracking-wider">BPSCVS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold border border-blue-200">
                New Vision, New Direction
              </span>
            </div>
            <p className="text-[11px] text-blue-900 font-semibold">Bani Park Sindhi Colony Vikas Samiti</p>
          </div>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-800 px-4 py-2 rounded-xl bg-[#F5EEDB] border border-[#BCAB94] hover:bg-[#FAF6EE] hover:border-blue-700 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Community Gallery</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* LEFT COLUMN: Security & Governance Information */}
          <div className="lg:col-span-6 flex flex-col justify-between p-8 sm:p-10 rounded-3xl bg-[#F5EEDB] border border-[#BCAB94] shadow-sm relative overflow-hidden">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold mb-6">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Authorized Personnel Gateway</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1D3A] leading-tight mb-4">
                Committee Administration &amp;<br />
                <span className="text-blue-800">Official Media Studio</span>
              </h1>

              <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-8">
                This secure portal is strictly reserved for appointed executive committee members and authorized media staff of Bani Park Sindhi Colony Vikas Samiti.
              </p>

              {/* Pillars */}
              <div className="space-y-3.5">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FAF6EE] border border-[#BCAB94]">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 text-blue-800">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#0B1D3A]">Executive Samiti Administration</h2>
                    <p className="text-xs text-slate-600 mt-0.5">Manage festival calendars, community announcements, official notices, and photo moderation.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FAF6EE] border border-[#BCAB94]">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-800">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#0B1D3A]">Official Photographer Studio</h2>
                    <p className="text-xs text-slate-600 mt-0.5">High-speed bulk photo uploads, event tagger, and festival photo documentation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Colony Seal */}
            <div className="mt-8 pt-6 border-t border-[#BCAB94] flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <div className="w-6 h-6 rounded-full bg-white p-0.5 border border-[#BCAB94] shrink-0 overflow-hidden flex items-center justify-center">
                  <img src="/bpscvs-logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span>140, City Plaza, Space Cinema, Jhotwara Road, Jaipur</span>
              </div>
              <span className="font-semibold text-blue-900 text-[11px] shrink-0 ml-2">&ldquo;New Vision, New Direction&rdquo;</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Modern Auth Interactive Card */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="p-8 sm:p-10 rounded-3xl bg-[#F5EEDB] border border-[#BCAB94] shadow-md relative">
              
              {/* Segmented Top Tabs */}
              <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#EAE0CE] border border-[#BCAB94] mb-8">
                <button
                  type="button"
                  onClick={() => handleTabChange('admin')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
                      : 'text-slate-700 hover:text-blue-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Samiti Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('photographer')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === 'photographer'
                      ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
                      : 'text-slate-700 hover:text-blue-800'
                  }`}
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>Studio Staff</span>
                </button>
              </div>

              {/* Login Form */}
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#0B1D3A] tracking-tight">
                    {activeTab === 'admin' ? 'Executive Admin Login' : 'Photographer Studio Login'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {activeTab === 'admin'
                      ? 'Enter your verified committee credentials to access management controls'
                      : 'Sign in to access bulk photo uploads and event management'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@bpscvs.org"
                        className="w-full bg-white border border-[#BCAB94] rounded-xl pl-10 pr-4 py-3 text-sm text-[#0B1D3A] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-[#BCAB94] rounded-xl pl-10 pr-11 py-3 text-sm text-[#0B1D3A] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !email || !password}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        <span>Verifying credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to {activeTab === 'admin' ? 'Executive Admin' : 'Media Studio'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Bottom Security Footer */}
              <div className="mt-8 pt-5 border-t border-[#BCAB94] flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> HMAC-SHA256 Encrypted Session
                </span>
                <span>Protected against unauthorized access</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-600 border-t border-[#BCAB94] bg-[#EAE0CE]">
        © 2026 Bani Park Sindhi Colony Vikas Samiti (Regd. No. 1183/2012) • 140, City Plaza, Space Cinema, Jhotwara Road, Jaipur
      </footer>
    </div>
  );
}
