'use client';
import { useState } from 'react';
import { mediaUrl } from '@/lib/api/client';
import { cn } from '@/lib/utils';

/**
 * Product imagery with graceful fallback: tries the backend media endpoint for the
 * stored key; if the asset is missing (seed data ships without photo files) renders
 * an original iVanta vector illustration derived from the product name/category.
 * Never hotlinks Apple assets — this is original branding (§ constraints).
 */
export type ArtKind = 'iphone' | 'ipad' | 'mac' | 'watch' | 'airpods' | 'accessory';

export function artKindFor(name?: string | null, category?: string | null): ArtKind {
  const s = `${name ?? ''} ${category ?? ''}`.toLowerCase();
  if (s.includes('iphone')) return 'iphone';
  if (s.includes('ipad')) return 'ipad';
  if (s.includes('mac') || s.includes('imac')) return 'mac';
  if (s.includes('watch')) return 'watch';
  if (s.includes('airpod') || s.includes('pod')) return 'airpods';
  return 'accessory';
}

export function ProductArt({ kind, className }: { kind: ArtKind; className?: string }) {
  const common = 'drop-shadow-sm';
  switch (kind) {
    case 'iphone':
      return (
        <svg viewBox="0 0 120 160" className={cn(common, className)} role="img" aria-label="iPhone illustration">
          <rect x="30" y="8" width="60" height="144" rx="12" fill="#1d1d1f" />
          <rect x="34" y="12" width="52" height="136" rx="9" fill="#3a3a3c" />
          <rect x="37" y="15" width="46" height="130" rx="7" fill="url(#scr)" />
          <rect x="52" y="18" width="16" height="4" rx="2" fill="#1d1d1f" />
          <rect x="36" y="26" width="18" height="18" rx="5" fill="#2c2c2e" opacity=".9" />
          <circle cx="42" cy="32" r="3.4" fill="#48484a" /><circle cx="48" cy="38" r="3.4" fill="#48484a" />
          <defs><linearGradient id="scr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0b5cff" stopOpacity=".55" /><stop offset="1" stopColor="#1d1d1f" stopOpacity=".85" /></linearGradient></defs>
        </svg>
      );
    case 'ipad':
      return (
        <svg viewBox="0 0 160 130" className={cn(common, className)} role="img" aria-label="iPad illustration">
          <rect x="14" y="10" width="132" height="110" rx="10" fill="#1d1d1f" />
          <rect x="19" y="15" width="122" height="100" rx="7" fill="url(#scr2)" />
          <circle cx="80" cy="10" r="0" />
          <defs><linearGradient id="scr2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#424245" /><stop offset="1" stopColor="#0b5cff" stopOpacity=".4" /></linearGradient></defs>
        </svg>
      );
    case 'mac':
      return (
        <svg viewBox="0 0 170 120" className={cn(common, className)} role="img" aria-label="Mac illustration">
          <rect x="25" y="12" width="120" height="78" rx="8" fill="#1d1d1f" />
          <rect x="30" y="17" width="110" height="68" rx="5" fill="url(#scr3)" />
          <path d="M12 94h146l8 12a4 4 0 0 1-4 6H8a4 4 0 0 1-4-6z" fill="#48484a" />
          <rect x="66" y="94" width="38" height="5" rx="2.5" fill="#3a3a3c" />
          <defs><linearGradient id="scr3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0b5cff" stopOpacity=".45" /><stop offset="1" stopColor="#3a3a3c" /></linearGradient></defs>
        </svg>
      );
    case 'watch':
      return (
        <svg viewBox="0 0 110 160" className={cn(common, className)} role="img" aria-label="Apple Watch illustration">
          <rect x="42" y="6" width="26" height="44" rx="10" fill="#48484a" />
          <rect x="42" y="110" width="26" height="44" rx="10" fill="#48484a" />
          <rect x="28" y="42" width="54" height="76" rx="18" fill="#1d1d1f" />
          <rect x="33" y="47" width="44" height="66" rx="14" fill="url(#scr4)" />
          <rect x="82" y="64" width="5" height="16" rx="2.5" fill="#3a3a3c" />
          <defs><linearGradient id="scr4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0b5cff" stopOpacity=".6" /><stop offset="1" stopColor="#1d1d1f" /></linearGradient></defs>
        </svg>
      );
    case 'airpods':
      return (
        <svg viewBox="0 0 150 130" className={cn(common, className)} role="img" aria-label="AirPods illustration">
          <rect x="40" y="46" width="70" height="66" rx="20" fill="#f5f5f7" stroke="#d2d2d7" strokeWidth="2" />
          <path d="M40 70h70" stroke="#d2d2d7" strokeWidth="2" />
          <circle cx="75" cy="94" r="3" fill="#1a7f37" />
          <rect x="30" y="14" width="14" height="34" rx="7" fill="#fbfbfd" stroke="#d2d2d7" strokeWidth="2" />
          <rect x="106" y="14" width="14" height="34" rx="7" fill="#fbfbfd" stroke="#d2d2d7" strokeWidth="2" />
          <circle cx="37" cy="22" r="4" fill="#e4e4e7" /><circle cx="113" cy="22" r="4" fill="#e4e4e7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 140 130" className={cn(common, className)} role="img" aria-label="Accessory illustration">
          <circle cx="70" cy="62" r="42" fill="none" stroke="#1d1d1f" strokeWidth="7" />
          <circle cx="70" cy="62" r="24" fill="none" stroke="#0b5cff" strokeWidth="5" opacity=".7" />
          <rect x="64" y="104" width="12" height="16" rx="4" fill="#48484a" />
        </svg>
      );
  }
}

export function ProductImage({ imageKey, name, category, className, imgClassName }: {
  imageKey?: string | null; name?: string | null; category?: string | null;
  className?: string; imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(imageKey);
  const kind = artKindFor(name, category);
  return (
    <div className={cn('flex items-center justify-center overflow-hidden bg-surface-sunk', className)}>
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? 'Product'} loading="lazy" onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)} />
      ) : (
        <ProductArt kind={kind} className="h-3/4 w-auto max-w-[70%]" />
      )}
    </div>
  );
}
