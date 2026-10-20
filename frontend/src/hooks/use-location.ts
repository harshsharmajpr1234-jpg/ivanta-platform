'use client';
import { useEffect, useState } from 'react';
import { locationService } from '@/services';
import type { LocationSuggestion, Serviceability } from '@/types';

/** Location suggest — fires from 2 characters (backend minimum), debounced 250ms. */
export function useLocationSuggest(query: string) {
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(() => {
      locationService.search(q)
        .then((r) => setResults(r.suggestions))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);
  return { results, loading };
}

/** PIN serviceability — debounced, only for valid 6-digit PINs. */
export function useServiceable(pin: string | null | undefined) {
  const [result, setResult] = useState<Serviceability | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (!pin || !/^\d{6}$/.test(pin)) { setResult(null); return; }
    setChecking(true);
    const t = setTimeout(() => {
      locationService.serviceability(pin)
        .then(setResult)
        .catch(() => setResult(null))
        .finally(() => setChecking(false));
    }, 300);
    return () => clearTimeout(t);
  }, [pin]);
  return { result, checking };
}

export function useGeolocate() {
  const [busy, setBusy] = useState(false);
  const detect = async (): Promise<{ label: string; locality?: string; city?: string; state?: string; pincode?: string; source: 'gps' } | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
    setBusy(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, maximumAge: 300000 }));
      const r = await locationService.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (!r.city && !r.pincode) return null;
      return {
        label: [r.locality, r.city].filter(Boolean).join(', ') || r.pincode || 'Current location',
        locality: r.locality ?? undefined, city: r.city ?? undefined,
        state: r.state ?? undefined, pincode: r.pincode ?? undefined, source: 'gps',
      };
    } catch { return null; } finally { setBusy(false); }
  };
  return { detect, busy };
}
