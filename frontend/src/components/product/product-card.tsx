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
    <div className={cn('group relative flex flex-col overflow-hidden rounded-[22px] border border-[#E5E7EB] bg-[#FFFFFF] transition-all hover:-translate-y-1 hover:border-[#000000] hover:shadow-card', className)}>
      <Link href={`/products/${p.slug}`} className="block relative bg-[#F4F4F4]/50 p-2" aria-label={p.name}>
        <ProductImage imageKey={p.imageKey} name={p.name} category={p.category}
          className="aspect-[4/3] w-full object-contain mix-blend-multiply" />
      </Link>
      {onToggleWish && (
        <button type="button" aria-label="Toggle wishlist" onClick={() => onToggleWish(p.id)}
          className={cn('absolute right-2 top-2 sm:right-3.5 sm:top-3.5 flex h-7.5 w-7.5 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white/90 backdrop-blur transition-colors hover:bg-[#F4F4F4]',
            wished && 'border-danger/30 text-danger')}>
          <Heart className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', wished && 'fill-danger')} />
        </button>
      )}
      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <div className="flex items-start justify-between gap-1">
          <Link href={`/products/${p.slug}`} className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-bold text-[#000000] group-hover:text-[#0000FF] transition-colors sm:text-[15px]">{p.name}</h3>
          </Link>
          {p.stockStatus !== 'IN_STOCK' && (
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 sm:text-[11px]">
              {p.stockStatus === 'LOW_STOCK' ? 'Low' : 'Out'}
            </span>
          )}
        </div>
        
        <p className="mt-0.5 truncate text-[11px] font-medium text-[#717171] sm:text-[12px]">
          {p.brand ?? 'Apple'}{p.releaseYear ? ` · ${p.releaseYear}` : ''}
        </p>

        {p.ratingCount > 0 && <Rating value={p.ratingAvg} count={p.ratingCount} className="mt-1 sm:mt-1.5" />}

        {/* Pricing Row */}
        <div className="mt-auto flex flex-wrap items-baseline gap-1.5 pt-2 sm:gap-2 sm:pt-3">
          <span className="text-[14px] font-black text-[#000000] sm:text-[18px]">{inr(p.price)}</span>
          {p.mrp > p.price && <span className="text-[10.5px] text-[#8E8E93] line-through sm:text-[12px]">{inr(p.mrp)}</span>}
          {p.discountPct > 0 && (
            <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full sm:text-[11.5px] sm:px-2">
              {p.discountPct}% off
            </span>
          )}
        </div>

        {/* ControlZ Full Pill Button */}
        <div className="mt-2.5 pt-2.5 sm:mt-4 sm:pt-3 border-t border-[#E5E7EB]/80">
          <Link
            href={`/products/${p.slug}`}
            className="flex h-8 sm:h-10 w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-[#000000] text-[11.5px] sm:text-[13px] font-bold text-white transition-all hover:bg-[#0000FF] active:scale-[0.98]"
          >
            <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="sm:hidden">Buy Options</span>
            <span className="hidden sm:inline">Buy / View Options</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
