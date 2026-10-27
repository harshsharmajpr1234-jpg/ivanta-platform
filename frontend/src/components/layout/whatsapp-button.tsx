'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { BRAND } from '@/constants';

export function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const cleanPhone = BRAND.supportPhone.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${BRAND.name}, I have an inquiry regarding mobile devices.`)}`;

  return (
    <div className="fixed bottom-16 right-3.5 z-40 flex items-center gap-3 sm:bottom-6 sm:right-6">
      {/* Tooltip badge */}
      {showTooltip && (
        <div className="hidden animate-fade-in items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2 shadow-pop sm:flex">
          <p className="text-[12.5px] font-semibold text-ink">Need assistance? Chat on WhatsApp</p>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            aria-label="Dismiss tooltip"
            className="rounded-full p-0.5 text-ink-muted hover:bg-surface-sunk"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Floating button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
        className="group relative flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition-all duration-200 hover:scale-105 hover:shadow-pop"
      >
        <MessageCircle className="h-6 w-6 fill-white" />
        <span className="sr-only">Chat on WhatsApp</span>
      </a>
    </div>
  );
}
