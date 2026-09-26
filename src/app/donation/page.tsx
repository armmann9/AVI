'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, CheckCircle, Receipt, Download, Smartphone } from 'lucide-react';

export default function DonationPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    amount: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.amount) {
      setReceiptNo(`BPSCVS-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSubmitted(true);
    }
  };

  const handlePrint = () => {
    window.print();
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
          </nav>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {!isSubmitted ? (
          <div className="bg-[#F5EEDB] border border-[#BCAB94] rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-[#0B1D3A] p-6 sm:p-8 text-center text-white">
              <Heart className="w-10 h-10 mx-auto text-amber-400 mb-3" />
              <h1 className="text-3xl font-display font-bold">Benevolent Contribution</h1>
              <p className="mt-2 text-blue-200">Support the community and our festive celebrations</p>
            </div>
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-[#0B1D3A] mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-700" />
                    Scan to Pay
                  </h3>
                  <div className="border-2 border-dashed border-[#BCAB94] bg-[#EAE0CE] rounded-xl p-8 flex flex-col items-center justify-center text-center h-64">
                    <div className="w-40 h-40 bg-white border border-[#BCAB94] rounded-xl flex items-center justify-center mb-3 shadow-inner">
                      {/* Placeholder for the scanner image */}
                      <span className="text-sm font-medium text-slate-400">Scanner Image Here</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">Scan using any UPI App</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#0B1D3A] mb-4">Donation Details</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#BCAB94] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow text-sm"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#BCAB94] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow text-sm"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label htmlFor="amount" className="block text-sm font-semibold text-slate-700 mb-1">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        required
                        min="1"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#BCAB94] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow text-sm font-bold text-blue-800"
                        placeholder="e.g. 1100"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1">
                        Message (Optional)
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={2}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#BCAB94] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow text-sm resize-none"
                        placeholder="Any special occasion?"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      <Receipt className="w-4 h-4" />
                      Generate Receipt
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#BCAB94] rounded-2xl shadow-2xl overflow-hidden max-w-lg mx-auto print:shadow-none print:border-none">
            <div className="bg-green-600 p-6 text-center text-white print:bg-white print:text-green-700 print:border-b-2 print:border-green-600">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-2xl font-bold">Donation Successful</h2>
              <p className="text-green-100 print:text-green-800 mt-1">Thank you for your generous sahyog!</p>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-bold text-[#0B1D3A] text-lg">BPSCVS</h3>
                  <p className="text-xs text-slate-500">Regd. No. 1183/2012</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt No</p>
                  <p className="font-mono font-bold text-[#0B1D3A]">{receiptNo}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm mb-8">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Date</span>
                  <span className="font-semibold text-slate-800">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Donor Name</span>
                  <span className="font-bold text-[#0B1D3A]">{formData.name}</span>
                </div>
                {formData.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Phone Number</span>
                    <span className="font-semibold text-slate-800">{formData.phone}</span>
                  </div>
                )}
                {formData.message && (
                  <div className="flex justify-between border-t border-slate-100 pt-3 mt-3">
                    <span className="text-slate-500 font-medium">Message</span>
                    <span className="font-medium text-slate-700 italic text-right max-w-[60%]">{formData.message}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-dashed border-slate-200 pt-4 mt-4 items-center">
                  <span className="text-base font-bold text-slate-800">Donation Amount</span>
                  <span className="text-2xl font-black text-green-600">₹{formData.amount}</span>
                </div>
              </div>

              <div className="flex gap-3 print:hidden mt-8">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Make Another
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
