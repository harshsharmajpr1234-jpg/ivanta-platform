'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BRAND } from '@/constants';

export function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-dismiss tooltip after 8 seconds if not interacted
    const timer = setTimeout(() => setShowTooltip(false), 9000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  const cleanPhone = BRAND.supportPhone.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${BRAND.name}, I want to know more about Certified Apple iPhones & warranty.`
  )}`;

  return (
    <aside
      aria-label="WhatsApp Support"
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2.5 sm:bottom-7 sm:right-7 group"
    >
      {/* Floating Chat Bubble Pill */}
      {showTooltip && (
        <div className="animate-fade-in relative hidden sm:flex items-center gap-2.5 rounded-full border border-white/20 bg-[#161616]/95 px-4 py-2 text-white shadow-2xl backdrop-blur-xl transition-all">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#25D366]" />
          </span>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold leading-tight text-white">Need help choosing?</span>
            <span className="text-[10px] text-neutral-400 leading-tight">Chat with Apple Specialist</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            aria-label="Dismiss message"
            className="ml-1 rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Floating Circle Button with Glow & Pulse Effect */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Flyphones on WhatsApp"
        className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,0.5)] transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_40px_rgba(37,211,102,0.7)] active:scale-95"
      >
        {/* Animated Green Pulse Rings */}
        <span className="pointer-events-none absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping opacity-60" />
        <span className="pointer-events-none absolute -inset-2 rounded-full border-2 border-[#25D366]/30 animate-pulse" />

        {/* WhatsApp Official Vector Icon */}
        <svg
          className="relative z-10 h-7 w-7 sm:h-8 sm:w-8 fill-white drop-shadow-md"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>

        {/* Online Indicator Badge */}
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-md">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      </a>
    </aside>
  );
}
