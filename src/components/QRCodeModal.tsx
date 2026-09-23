'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Copy, Check, ExternalLink, QrCode, Sparkles } from 'lucide-react';
import { EventItem } from '@/lib/types';

interface QRCodeModalProps {
  event: EventItem;
  onClose: () => void;
}

export default function QRCodeModal({ event, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = React.useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${event.slug || event.id}`
    : `https://eventlens.live/event/${event.slug || event.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 600;
    canvas.height = 600;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 50, 50, 500, 500);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${event.slug || 'event'}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        padding: '32px 28px',
        position: 'relative',
        textAlign: 'center',
        background: '#0d1322',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
        color: '#ffffff',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: '#94a3b8',
            padding: '6px',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <X size={20} />
        </button>

        {/* Top QR Icon Badge */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
          boxShadow: '0 8px 24px rgba(168, 85, 247, 0.4)',
        }}>
          <QrCode size={28} color="#fff" />
        </div>

        {/* Event Title & Subtitle */}
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: '#ffffff', lineHeight: '1.3' }}>
          {event.title}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '22px', lineHeight: '1.5', maxWidth: '340px', margin: '0 auto 22px' }}>
          Print or display this QR code at the event venue. Guests scan to view photos and use the AI selfie search!
        </p>

        {/* QR Code Container */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '22px',
          display: 'inline-block',
          marginBottom: '22px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
        }}>
          <QRCodeSVG
            ref={qrRef}
            value={eventUrl}
            size={220}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd"/></svg>',
              x: undefined,
              y: undefined,
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>

        {/* Event Link Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '8px 12px',
          marginBottom: '20px',
        }}>
          <input
            type="text"
            readOnly
            value={eventUrl}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.82rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              outline: 'none',
            }}
          />
          <button
            onClick={handleCopyLink}
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              color: copied ? '#34d399' : '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadQR}
            style={{
              flex: 1,
              padding: '13px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(236, 72, 153, 0.35)',
              transition: 'transform 0.2s, opacity 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.92')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Download size={16} />
            <span>Download PNG Card</span>
          </button>

          <a
            href={eventUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <ExternalLink size={17} />
          </a>
        </div>
      </div>
    </div>
  );
}
