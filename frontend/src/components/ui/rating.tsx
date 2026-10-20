import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Rating({ value, count, className, size = 'sm' }: { value: number; count?: number; className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} aria-label={`Rated ${value} out of 5${count ? ` from ${count} reviews` : ''}`}>
      <span className="inline-flex items-center gap-0.5 rounded-md bg-success px-1.5 py-0.5 text-[11px] font-bold text-white">
        {value.toFixed(1)} <Star className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} fill="currentColor" />
      </span>
      {count != null && <span className="text-[12px] text-ink-muted">({count})</span>}
    </span>
  );
}
