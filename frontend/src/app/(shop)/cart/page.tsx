'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Tag, Trash2 } from 'lucide-react';
import { ProductImage } from '@/components/product/product-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/states';
import { PageSkeleton } from '@/components/ui/skeleton';
import { cartService, couponService } from '@/services';
import { isAuthError } from '@/hooks/use-guest-cart';
import { useAuthStore } from '@/store/auth';
import { guestCartCount, guestCartSubtotal, useGuestCart } from '@/store/guest-cart';
import { useUIStore } from '@/store/ui';
import { cn, inr } from '@/lib/utils';
import type { CouponValidation } from '@/types';

/** Guest cart — fully local (persisted Zustand store), no API or auth needed. */
function GuestCart() {
  const router = useRouter();
  const items = useGuestCart((s) => s.items);
  const setQuantity = useGuestCart((s) => s.setQuantity);
  const removeItem = useGuestCart((s) => s.removeItem);
  const subtotal = guestCartSubtotal(items);
  const count = guestCartCount(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[520px] px-4 py-20 text-center">
        <EmptyState icon={ShoppingBag} title="Your cart is empty"
          description="Browse the store and add products — no account needed. You will be asked to sign in at checkout."
          action={<Link href="/products"><Button>Browse products</Button></Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Your cart</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Shopping as a guest — your cart is saved on this device. Prices, stock, taxes and discounts
        are re-verified by the server at checkout.
      </p>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.key} className="flex gap-4 rounded-2xl border border-line bg-white p-4">
              <Link href={`/products/${it.slug}`} className="shrink-0">
                <ProductImage imageKey={it.imageKey} name={it.name} className="h-20 w-20 rounded-xl" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${it.slug}`} className="text-[14px] font-semibold text-ink hover:text-accent">{it.name}</Link>
                {(it.variantName || it.selectedStorage || it.selectedColor) && (
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    {it.variantName ?? [it.selectedStorage, it.selectedColor].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="mt-1 text-[14px] font-bold text-ink">{inr(it.unitPrice)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 items-center rounded-full border border-line-strong">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(it.key, it.quantity - 1)}
                      className="flex h-full w-9 items-center justify-center rounded-l-full text-ink hover:bg-surface-sunk"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-[13px] font-semibold text-ink">{it.quantity}</span>
                    <button type="button" aria-label="Increase quantity" disabled={it.quantity >= 10}
                      onClick={() => setQuantity(it.key, it.quantity + 1)}
                      className="flex h-full w-9 items-center justify-center rounded-r-full text-ink hover:bg-surface-sunk disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button type="button" onClick={() => removeItem(it.key)}
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-muted hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
              <span className="hidden shrink-0 self-center text-[14px] font-bold text-ink sm:block">{inr(it.unitPrice * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold text-ink">Order summary</h2>
          <div className="mt-3 flex items-center justify-between text-[13.5px]">
            <span className="text-ink-muted">Subtotal ({count} item{count === 1 ? '' : 's'})</span>
            <span className="font-bold text-ink">{inr(subtotal)}</span>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-muted">
            Taxes, shipping and coupon discounts are calculated by the server at checkout — the amount
            shown here is indicative only and is never used to charge you.
          </p>
          <Button size="lg" className="mt-4 w-full" onClick={() => router.push('/checkout')}>
            Proceed to checkout <ArrowRight className="h-4 w-4" />
          </Button>
          <Link href="/login?next=/cart" className="mt-3 block text-center text-[12.5px] font-medium text-ink-muted hover:text-accent">
            Sign in to sync your cart across devices
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const { user, setUser } = useAuthStore();

  const cart = useQuery({ queryKey: ['cart'], queryFn: () => cartService.get(), enabled: Boolean(user) });
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // Stale persisted session (cookie expired / backend restarted): drop to guest mode silently.
  useEffect(() => {
    if (user && cart.isError && isAuthError(cart.error)) setUser(null);
  }, [user, cart.isError, cart.error, setUser]);

  if (!user) return <GuestCart />;
  if (!cart.data) return <PageSkeleton />;

  const items = cart.data.items;
  const discount = coupon?.valid ? coupon.discount : 0;
  const estimated = Math.max(0, cart.data.subtotal - discount);

  const updateQty = async (id: string, quantity: number) => {
    try {
      await cartService.updateItem(id, quantity);
      void qc.invalidateQueries({ queryKey: ['cart'] });
    } catch (e) {
      if (isAuthError(e)) { setUser(null); return; }
      toast({ title: e instanceof Error ? e.message : 'Could not update item', tone: 'error' });
    }
  };
  const remove = async (id: string) => {
    try {
      await cartService.removeItem(id);
      void qc.invalidateQueries({ queryKey: ['cart'] });
      setCoupon(null);
    } catch (e) {
      if (isAuthError(e)) { setUser(null); return; }
      toast({ title: 'Could not remove item', tone: 'error' });
    }
  };
  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCheckingCoupon(true);
    try {
      const r = await couponService.validate(code, cart.data!.subtotal);
      setCoupon(r);
      if (!r.valid) toast({ title: 'Coupon not applicable', description: r.reason ?? undefined, tone: 'warning' });
    } catch (e) {
      setCoupon({ valid: false, code, discount: 0, reason: e instanceof Error ? e.message : 'Invalid coupon' });
    } finally { setCheckingCoupon(false); }
  };

  const anyStockIssue = items.some((i) => !i.stockOk);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Your cart</h1>
      <p className="mt-1 text-[13px] text-ink-muted">Prices and stock are re-verified by the server at every step — what you see is what you pay.</p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={ShoppingBag} title="Your cart is empty"
            description="Browse genuine Apple products — iPhones, Macs, iPads, Watches and AirPods."
            action={<Link href="/products"><Button>Start shopping <ArrowRight className="h-4 w-4" /></Button></Link>} />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex gap-4 rounded-2xl border border-line bg-white p-4">
                <Link href={`/products/${i.productSlug}`} className="shrink-0">
                  <ProductImage imageKey={i.imageKey} name={i.productName} className="h-24 w-24 rounded-xl" imgClassName="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/products/${i.productSlug}`} className="text-[14px] font-semibold text-ink hover:text-accent">{i.productName}</Link>
                      {i.variantName && <p className="mt-0.5 text-[12px] text-ink-muted">{i.variantName}</p>}
                      <p className="mt-0.5 text-[11px] text-ink-faint">SKU {i.sku ?? '—'}</p>
                    </div>
                    <button type="button" onClick={() => void remove(i.id)} aria-label="Remove item"
                      className="rounded-full p-2 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {!i.stockOk && (
                    <Badge tone="danger" className="mt-1.5 w-fit">Only {i.available} left — reduce quantity</Badge>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex h-9 items-center rounded-full border border-line-strong bg-white">
                      <button type="button" aria-label="Decrease" disabled={i.quantity <= 1} onClick={() => void updateQty(i.id, i.quantity - 1)}
                        className="flex h-full w-8 items-center justify-center rounded-l-full disabled:opacity-40"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center text-[13px] font-semibold">{i.quantity}</span>
                      <button type="button" aria-label="Increase" disabled={i.quantity >= Math.min(i.available, 10)} onClick={() => void updateQty(i.id, i.quantity + 1)}
                        className="flex h-full w-8 items-center justify-center rounded-r-full disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-bold text-ink">{inr(i.lineTotal)}</p>
                      {i.mrp > i.unitPrice && <p className="text-[11px] text-ink-faint line-through">{inr(i.mrp * i.quantity)}</p>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit space-y-4 lg:sticky lg:top-20">
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-[15px] font-bold text-ink">Order summary</h2>
              <div className="mt-3 flex items-center gap-2">
                <Tag className="h-4 w-4 shrink-0 text-ink-faint" />
                <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Coupon code (try IVANTA10)" className="h-10" />
                <Button variant="secondary" size="md" loading={checkingCoupon} onClick={() => void applyCoupon()}>Apply</Button>
              </div>
              {coupon && (
                <p className={cn('mt-2 text-[12px] font-medium', coupon.valid ? 'text-success' : 'text-danger')}>
                  {coupon.valid ? `✓ ${coupon.code} applied — you save ${inr(coupon.discount)}${coupon.description ? ` (${coupon.description})` : ''}` : `✕ ${coupon.reason ?? 'Coupon not applicable'}`}
                </p>
              )}
              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
                <div className="flex justify-between"><dt className="text-ink-muted">Subtotal ({cart.data.itemCount} items)</dt><dd className="font-medium text-ink">{inr(cart.data.subtotal)}</dd></div>
                {cart.data.savings > 0 && (
                  <div className="flex justify-between"><dt className="text-ink-muted">MRP savings</dt><dd className="font-medium text-success">− {inr(cart.data.savings)}</dd></div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between"><dt className="text-ink-muted">Coupon {coupon?.code}</dt><dd className="font-medium text-success">− {inr(discount)}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-ink-muted">Delivery</dt><dd className="text-ink-muted">Calculated at checkout</dd></div>
                <div className="flex justify-between border-t border-line pt-2 text-[15px]"><dt className="font-bold text-ink">Estimated total</dt><dd className="font-bold text-ink">{inr(estimated)}</dd></div>
              </dl>
              <Button size="lg" className="mt-4 w-full" disabled={anyStockIssue}
                onClick={() => router.push(`/checkout${coupon?.valid ? `?coupon=${encodeURIComponent(coupon.code)}` : ''}`)}>
                Proceed to checkout <ArrowRight className="h-4 w-4" />
              </Button>
              {anyStockIssue && <p className="mt-2 text-center text-[12px] text-danger">Some items exceed available stock — adjust quantities to continue.</p>}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-ink-faint">
                <ShieldCheck className="h-3.5 w-3.5" /> Stock is reserved for 15 minutes once you place the order
              </p>
            </div>
            <Link href="/products" className="block rounded-2xl border border-line bg-white px-5 py-3.5 text-center text-[13px] font-semibold text-ink hover:bg-surface-sunk">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
