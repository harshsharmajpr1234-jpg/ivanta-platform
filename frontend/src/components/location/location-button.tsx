'use client';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useLocationStore } from '@/store/location';
import { LocationDialog } from './location-dialog';

export function LocationButton() {
  const selection = useLocationStore((s) => s.selection);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-ink/5"
        aria-label="Set delivery location">
        <MapPin className="h-3.5 w-3.5 text-accent" />
        <span className="max-w-[110px] truncate">{selection ? selection.city : 'Set location'}</span>
      </button>
      <LocationDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
