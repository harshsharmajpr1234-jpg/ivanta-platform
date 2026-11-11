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
          className={cn('absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white/90 backdrop-blur transition-colors hover:bg-[#F4F4F4]',
            wished && 'border-danger/30 text-danger')}>
          <Heart className={cn('h-4 w-4', wished && 'fill-danger')} />
        </button>
      )}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-1.5">
          <Link href={`/products/${p.slug}`} className="min-w-0 flex-1">
            <h3 className="truncate text-[14px] font-bold text-[#000000] group-hover:text-[#0000FF] transition-colors sm:text-[15px]">{p.name}</h3>
          </Link>
          {p.stockStatus !== 'IN_STOCK' && <Badge tone={STOCK_STATUS_TONE[p.stockStatus]}>{p.stockStatus === 'LOW_STOCK' ? 'Low stock' : 'Sold out'}</Badge>}
        </div>
        
        <p className="mt-0.5 truncate text-[12px] font-medium text-[#717171]">
          {p.brand ?? 'Apple'}{p.releaseYear ? ` · ${p.releaseYear}` : ''}
        </p>

        {p.ratingCount > 0 && <Rating value={p.ratingAvg} count={p.ratingCount} className="mt-1.5" />}

        {/* Pricing Row */}
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-3">
          <span className="text-[16px] font-black text-[#000000] sm:text-[18px]">{inr(p.price)}</span>
          {p.mrp > p.price && <span className="text-[12px] text-[#8E8E93] line-through">{inr(p.mrp)}</span>}
          {p.discountPct > 0 && <span className="text-[11.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{p.discountPct}% off</span>}
        </div>

        {/* ControlZ Full Pill Button */}
        <div className="mt-4 pt-3 border-t border-[#E5E7EB]/80">
          <Link
            href={`/products/${p.slug}`}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#000000] text-[13px] font-bold text-white transition-all hover:bg-[#0000FF] active:scale-[0.98]"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Buy / View Options
          </Link>
        </div>
      </div>
    </div>
  );
}
