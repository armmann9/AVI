'use client';

import React, { useState } from 'react';
import { MessageSquare, Copy, Check, Share2, X, Sparkles, Send } from 'lucide-react';
import { FestivalEvent } from '@/types/utsav';
import { playSitarPluck, playTempleBell } from '@/utils/audio';

interface WhatsAppBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: FestivalEvent[];
}

export const WhatsAppBroadcastModal: React.FC<WhatsAppBroadcastModalProps> = ({
  isOpen,
  onClose,
  events,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'diwali-2024');
  const [templateType, setTemplateType] = useState<'invite' | 'photos_ready'>('photos_ready');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Generate WhatsApp formatted messages with asterisks for bolding
  const getMessageContent = () => {
    const portalUrl = window.location.origin;

    if (templateType === 'photos_ready') {
      return `🪔 *BANI PARK SINDHI COLONY VIKAS SAMITI (BPSCVS)* 🪔\n\n📸 *${currentEvent.title.toUpperCase()} KI PHOTOS LIVE HAIN!*\n\nसभी कॉलोनी निवासियों को सूचित किया जाता है कि *${currentEvent.title}* (${currentEvent.hindiTitle}) की सभी हाई-डेफिनिशन तस्वीरें अब हमारी कॉलोनी पोर्टल पर लाइव अपलोड कर दी गई हैं।\n\n⚡ *AI Face Matcher फीचर:* \nहजारों तस्वीरों में खुद को ढूंढने की जरूरत नहीं! बस अपनी एक सेल्फी अपलोड करें और 2 सेकंड में अपनी सारी तस्वीरें एक साथ डाउनलोड करें:\n👉 *${portalUrl}#face-match-portal*\n\n📋 *Event Highlights:*\n• Date: ${currentEvent.date}\n• Location: ${currentEvent.location}\n• Total Photos: ${currentEvent.photoCount}+ Pictures\n\n_कृपया यह मैसेज अपने परिवार व ब्लॉक ग्रुप्स में शेयर करें।_\n- *सांस्कृतिक एवं तकनीकी विंग, BPSCVS जयपुर*`;
    }

    return `🪔 *BANI PARK SINDHI COLONY VIKAS SAMITI (BPSCVS)* 🪔\n\n💐 *भव्य आमंत्रण: ${currentEvent.title}* 💐\n\nबनी पार्क सिंधी कॉलोनी के सभी आदरणीय परिवारों को सप्रेम आमंत्रित किया जाता है। आइए, पूरे उल्लास व संस्कृति के साथ मिलकर यह पर्व मनाएं!\n\n📅 *दिनांक:* ${currentEvent.date}\n📍 *स्थान:* ${currentEvent.location}\n👥 *कार्यक्रम:* ${currentEvent.description}\n\n👉 *ऑनलाइन शेड्यूल व फोटो गैलरी लिंक:*\n${portalUrl}\n\nआप सभी की उपस्थिति प्रार्थनीय है।\n- *कार्यकारिणी समिति, BPSCVS जयपुर*`;
  };

  const messageText = getMessageContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    playSitarPluck('Sa');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    playTempleBell(960);
    window.open(`https://wa.me/?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-emerald-950 border border-amber-400/40 rounded-3xl shadow-2xl p-5 sm:p-7 text-amber-50 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-800">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Secretary Tool • वॉट्सऐप सूचना मेकर</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display text-white mt-0.5">
              Colony WhatsApp Broadcast Generator
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 border-b border-emerald-800/70">
          <div>
            <label className="block text-xs font-semibold text-emerald-300 mb-1">
              Select Festival Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-emerald-900 border border-emerald-700 text-amber-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-300 mb-1">
              Broadcast Message Type:
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setTemplateType('photos_ready')}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold text-center transition-all ${
                  templateType === 'photos_ready'
                    ? 'bg-amber-500 text-emerald-950 shadow-md'
                    : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
                }`}
              >
                📸 Photos Live
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('invite')}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold text-center transition-all ${
                  templateType === 'invite'
                    ? 'bg-amber-500 text-emerald-950 shadow-md'
                    : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
                }`}
              >
                💐 Invitation
              </button>
            </div>
          </div>
        </div>

        {/* Message Preview Box with authentic WhatsApp Chat Bubbling Look */}
        <div className="my-4">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1 font-semibold">
            <span>WhatsApp Message Preview (formatted with emojis & bolding):</span>
            <span className="text-[11px] font-mono text-emerald-500">Ready to Send</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b141a] border border-emerald-800 text-stone-200 text-xs font-sans whitespace-pre-wrap leading-relaxed shadow-inner max-h-64 overflow-y-auto custom-scrollbar border-l-4 border-l-emerald-500">
            {messageText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-200 font-bold text-xs flex items-center gap-2 border border-emerald-700 transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/50 transition-all active:scale-95"
          >
            <Send className="w-4 h-4 fill-current" />
            <span>Open in WhatsApp & Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
