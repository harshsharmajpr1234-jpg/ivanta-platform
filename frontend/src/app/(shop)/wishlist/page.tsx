'use client';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart } from 'lucide-react';
import { ProductImage } from '@/components/product/product-image';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RowsSkeleton } from '@/components/ui/skeleton';
import { cartService, wishlistService } from '@/services';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { STOCK_STATUS_TONE } from '@/constants';
import { inr } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function WishlistPage() {
  const { user } = useAuthStore();
  const toast = useUIStore((s) => s.toast);
  const qc = useQueryClient();
  const wish = useQuery({ queryKey: ['wishlist'], queryFn: () => wishlistService.get(), enabled: Boolean(user) });

  if (!user) {
    return (
      <div className="mx-auto max-w-[520px] px-4 py-20">
        <EmptyState icon={Heart} title="Sign in to see your wishlist"
          action={<Link href="/login?next=/wishlist"><Button>Sign in</Button></Link>} />
      </div>
    );
  }

  const items = wish.data?.items ?? [];

  const addToCart = async (productId: string) => {
    try {
      await cartService.addItem(productId, 1);
      void qc.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Added to cart', tone: 'success' });
    } catch (e) { toast({ title: e instanceof Error ? e.message : 'Could not add to cart', tone: 'error' }); }
  };

  const remove = async (productId: string) => {
    try {
      await wishlistService.toggle(productId, false);
      void qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast({ title: 'Removed from wishlist', tone: 'info' });
    } catch {
      toast({ title: 'Could not remove', tone: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Wishlist</h1>
      <p className="mt-1 text-[13px] text-ink-muted">Saved for later — prices refresh live from the catalog.</p>
      {wish.isError ? (
        <ErrorState className="mt-8" onRetry={() => void wish.refetch()} />
      ) : wish.isLoading || !wish.data ? (
        <RowsSkeleton rows={3} cols={3} />
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart on any product to save it here."
            action={<Link href="/products"><Button>Browse products</Button></Link>} />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((it) => (
            <li key={it.productId} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
              <Link href={`/products/${it.slug}`} className="shrink-0">
                <ProductImage imageKey={it.imageKey} name={it.name} className="h-16 w-16 rounded-xl" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${it.slug}`} className="text-[14px] font-semibold text-ink hover:text-accent">{it.name}</Link>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[14px] font-bold text-ink">{inr(it.price)}</span>
                  {it.mrp > it.price && <span className="text-[12px] text-ink-faint line-through">{inr(it.mrp)}</span>}
                  <Badge tone={STOCK_STATUS_TONE[it.stockStatus as keyof typeof STOCK_STATUS_TONE] ?? 'neutral'}>{it.stockStatus.replaceAll('_', ' ')}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={it.stockStatus === 'OUT_OF_STOCK'} onClick={() => void addToCart(it.productId)}>
                  <ShoppingCart className="h-3.5 w-3.5" /> Add to cart
                </Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => void remove(it.productId)}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
