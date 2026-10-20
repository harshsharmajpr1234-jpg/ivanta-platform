'use client';
import { useState } from 'react';
import { Crosshair, MapPin, Search } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useLocationStore } from '@/store/location';
import { useGeolocate, useLocationSuggest } from '@/hooks/use-location';
import { cn } from '@/lib/utils';

const POPULAR = [
  { label: 'Jaipur, Rajasthan', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
  { label: 'New Delhi, Delhi', city: 'New Delhi', state: 'Delhi', pincode: '110024' },
  { label: 'Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
  { label: 'Bengaluru, Karnataka', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
  { label: 'Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana', pincode: '500081' },
];

export function LocationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const set = useLocationStore((s) => s.set);
  const recent = useLocationStore((s) => s.recent);
  const [q, setQ] = useState('');
  const { results, loading } = useLocationSuggest(q);
  const { detect, busy } = useGeolocate();

  const pick = (sel: Parameters<typeof set>[0]) => { set(sel); onClose(); setQ(''); };

  return (
    <Dialog open={open} onClose={onClose} title="Where should we deliver?"
      description="Search a locality, city or PIN code — suggestions start from 2 characters.">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Vaishali Nagar, 302021, Jaipur…" className="pl-9" autoFocus />
          {loading && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />}
        </div>

        <button type="button" onClick={async () => { const geo = await detect(); if (geo) pick(geo); }}
          className="flex w-full items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-ink/5 disabled:opacity-50"
          disabled={busy}>
          <Crosshair className={cn('h-4 w-4 text-accent', busy && 'animate-pulse')} />
          {busy ? 'Detecting your location…' : 'Use my current location'}
        </button>

        {q.trim().length >= 2 && results.length > 0 && (
          <ul className="max-h-56 space-y-0.5 overflow-y-auto">
            {results.map((r, i) => (
              <li key={`${r.type}-${r.id}-${i}`}>
                <button type="button"
                  onClick={() => pick({
                    label: r.sublabel ? `${r.label}, ${r.sublabel}` : r.label,
                    locality: r.type === 'locality' ? r.label : undefined,
                    city: r.city ?? (r.type === 'city' ? r.label : undefined),
                    state: r.state ?? undefined,
                    pincode: r.pincode ?? undefined,
                    source: 'manual',
                  })}
                  className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-ink/5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                  <span>
                    <span className="block text-[13px] font-medium text-ink">
                      {r.label} {r.pincode && <span className="text-ink-muted">· {r.pincode}</span>}
                    </span>
                    <span className="block text-[11px] text-ink-muted">{r.sublabel ?? r.type}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {q.trim().length >= 2 && !loading && results.length === 0 && (
          <p className="rounded-xl bg-surface-sunk px-3 py-2.5 text-[13px] text-ink-muted">
            No matches — try a PIN code like 302021 or a locality name.
          </p>
        )}

        {q.trim().length < 2 && (
          <div>
            {recent.length > 0 && (
              <>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Recent</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {recent.map((r) => (
                    <button key={r.label} type="button" onClick={() => pick(r)}
                      className="rounded-full border border-line px-3 py-1 text-[12px] text-ink hover:bg-ink/5">{r.label}</button>
                  ))}
                </div>
              </>
            )}
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Popular delivery cities</p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR.map((c) => (
                <button key={c.label} type="button" onClick={() => pick({ ...c, source: 'manual' })}
                  className="rounded-full border border-line px-3 py-1 text-[12px] text-ink hover:bg-ink/5">{c.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
