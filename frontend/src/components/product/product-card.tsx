'use client';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { ProductImage } from './product-image';
import { cn, inr } from '@/lib/utils';
import { STOCK_STATUS_TONE } from '@/constants';
import type { ProductListItem } from '@/types';

export function ProductCard({ p, wished, onToggleWish, className }: {
  p: ProductListItem; wished?: boolean; onToggleWish?: (id: string) => void; className?: string;
}) {
  return (
    <div className={cn('group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-card', className)}>
      <Link href={`/products/${p.slug}`} className="block" aria-label={p.name}>
        <ProductImage imageKey={p.imageKey} name={p.name} category={p.category}
          className="aspect-[4/3] w-full" />
      </Link>
      {onToggleWish && (
        <button type="button" aria-label="Toggle wishlist" onClick={() => onToggleWish(p.id)}
          className={cn('absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/90 backdrop-blur transition-colors hover:bg-surface-sunk',
            wished && 'border-danger/30 text-danger')}>
          <Heart className={cn('h-4 w-4', wished && 'fill-danger')} />
        </button>
      )}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-1.5">
          <Link href={`/products/${p.slug}`} className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-semibold text-ink group-hover:text-accent sm:text-[14px]">{p.name}</h3>
          </Link>
          {p.stockStatus !== 'IN_STOCK' && <Badge tone={STOCK_STATUS_TONE[p.stockStatus]}>{p.stockStatus === 'LOW_STOCK' ? 'Low stock' : 'Sold out'}</Badge>}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-ink-muted sm:text-[12px]">{p.brand ?? 'Apple'}{p.releaseYear ? ` · ${p.releaseYear}` : ''}</p>
        {p.ratingCount > 0 && <Rating value={p.ratingAvg} count={p.ratingCount} className="mt-1 sm:mt-1.5" />}
        <div className="mt-auto flex flex-wrap items-baseline gap-1.5 pt-2 sm:pt-3">
          <span className="text-[14px] font-bold text-ink sm:text-[16px]">{inr(p.price)}</span>
          {p.mrp > p.price && <span className="text-[11px] text-ink-faint line-through sm:text-[12px]">{inr(p.mrp)}</span>}
          {p.discountPct > 0 && <span className="text-[10.5px] font-semibold text-success sm:text-[12px]">{p.discountPct}% off</span>}
        </div>

        <div className="mt-3 pt-2.5 border-t border-line/60">
          <Link
            href={`/products/${p.slug}`}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-ink text-[12.5px] font-semibold text-white transition-all hover:bg-ink/90 active:scale-[0.98] sm:h-10 sm:text-[13px]"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Buy / View Options
          </Link>
        </div>
      </div>
    </div>
  );
}
