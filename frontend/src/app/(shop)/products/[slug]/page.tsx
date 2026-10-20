'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CreditCard, Heart, MapPin, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck, Zap } from 'lucide-react';
import { ProductArt, ProductImage, artKindFor } from '@/components/product/product-image';
import { ProductCard } from '@/components/product/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rating } from '@/components/ui/rating';
import { Accordion } from '@/components/ui/accordion';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { PageSkeleton, ProductGridSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Textarea } from '@/components/ui/input';
import { cartService, catalogService, reviewService, wishlistService } from '@/services';
import { useServiceable } from '@/hooks/use-location';
import { isAuthError } from '@/hooks/use-guest-cart';
import { useAuthStore } from '@/store/auth';
import { useGuestCart } from '@/store/guest-cart';
import { useUIStore } from '@/store/ui';
import { Dialog } from '@/components/ui/dialog';
import { STOCK_STATUS_LABEL, STOCK_STATUS_TONE } from '@/constants';
import { cn, formatDate, inr } from '@/lib/utils';
import type { Variant } from '@/types';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const { user, setUser } = useAuthStore();
  const addGuestItem = useGuestCart((s) => s.addItem);
  const [wishLoginOpen, setWishLoginOpen] = useState(false);

  const product = useQuery({ queryKey: ['product', slug], queryFn: () => catalogService.product(slug) });
  const related = useQuery({
    queryKey: ['product', product.data?.id, 'related'],
    queryFn: () => catalogService.related(product.data!.id),
    enabled: Boolean(product.data),
  });
  const reviews = useQuery({
    queryKey: ['reviews', product.data?.id],
    queryFn: () => reviewService.forProduct(product.data!.id, 0, 20),
    enabled: Boolean(product.data),
  });
  const wishIds = useQuery({ queryKey: ['wishlist', 'ids'], queryFn: () => wishlistService.ids(), enabled: Boolean(user) });

  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState('');
  const { result: serviceability, checking } = useServiceable(pin);

  const p = product.data;
  const variant: Variant | undefined = useMemo(
    () => p?.variants.find((v) => v.id === variantId) ?? p?.variants.find((v) => v.stockStatus !== 'OUT_OF_STOCK') ?? p?.variants[0],
    [p, variantId],
  );

  useEffect(() => { if (p && !variantId && variant) setVariantId(variant.id); }, [p, variantId, variant]);
  useEffect(() => { setQty(1); }, [variantId]);

  // storage/color option pools derived from live variants
  const storages = useMemo(() => {
    const set = new Map<string, string>();
    p?.variants.forEach((v) => { if (v.storage) set.set(v.storage, v.storage); });
    if (set.size === 0) p?.storages.forEach((s) => set.set(s.storage, s.storage));
    return [...set.keys()];
  }, [p]);
  const colors = useMemo(() => {
    const set = new Map<string, { name: string; hex?: string | null; available: boolean }>();
    p?.variants.forEach((v) => {
      if (!v.color) return;
      const cur = set.get(v.color);
      set.set(v.color, { name: v.color, hex: p.colors.find((c) => c.name === v.color)?.hex, available: (cur?.available ?? false) || v.stockStatus !== 'OUT_OF_STOCK' });
    });
    if (set.size === 0) p?.colors.forEach((c) => set.set(c.name, { name: c.name, hex: c.hex, available: true }));
    return [...set.values()];
  }, [p]);

  const pickVariant = (storage?: string, color?: string) => {
    if (!p) return;
    const nextStorage = storage ?? variant?.storage ?? undefined;
    const nextColor = color ?? variant?.color ?? undefined;
    const match =
      p.variants.find((v) => (!nextStorage || v.storage === nextStorage) && (!nextColor || v.color === nextColor) && v.stockStatus !== 'OUT_OF_STOCK') ??
      p.variants.find((v) => (!nextStorage || v.storage === nextStorage) && (!nextColor || v.color === nextColor));
    if (match) setVariantId(match.id);
    else toast({ title: 'That combination is not available', tone: 'warning' });
  };

  const price = variant?.price ?? p?.price ?? 0;
  const mrp = variant?.mrp ?? p?.mrp ?? 0;
  const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const available = variant?.available ?? 0;
  const out = !variant || variant.stockStatus === 'OUT_OF_STOCK' || available <= 0;
  const wished = Boolean(p && wishIds.data?.includes(p.id));

  // Guests add to the locally persisted cart — no API call, no auth, one toast.
  const addGuest = (thenCheckout: boolean) => {
    if (!p || !variant) return;
    addGuestItem({
      productId: p.id,
      variantId: variant.id ?? null,
      sku: variant.sku ?? p.sku ?? null,
      name: p.name,
      variantName: variant.name ?? ([variant.storage, variant.color, variant.connectivity, variant.size].filter(Boolean).join(' · ') || null),
      imageKey: p.images.find((i) => i.isMain)?.storageKey ?? p.images[0]?.storageKey ?? null,
      slug: p.slug,
      quantity: qty,
      unitPrice: variant.price,
      mrp: variant.mrp,
      selectedStorage: variant.storage ?? null,
      selectedColor: variant.color ?? null,
    });
    toast({ title: 'Added to cart', description: `${p.name}${variant.name ? ` · ${variant.name}` : ''} × ${qty}`, tone: 'success' });
    if (thenCheckout) router.push('/checkout');
  };

  const addToCart = async (thenCheckout = false) => {
    if (!p || !variant) return;
    if (!user) { addGuest(thenCheckout); return; }
    try {
      await cartService.addItem(p.id, qty, variant.id);
      void qc.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Added to cart', description: `${p.name}${variant.name ? ` · ${variant.name}` : ''} × ${qty}`, tone: 'success' });
      if (thenCheckout) router.push('/checkout');
    } catch (e) {
      if (isAuthError(e)) {
        // Session expired — fall back to the guest cart instead of blocking the shopper.
        setUser(null);
        addGuest(thenCheckout);
        return;
      }
      toast({ title: e instanceof Error ? e.message : 'Could not add to cart', tone: 'error' });
    }
  };

  const toggleWish = async () => {
    if (!p) return;
    if (!user) { setWishLoginOpen(true); return; }
    try {
      await wishlistService.toggle(p.id, !wished);
      void qc.invalidateQueries({ queryKey: ['wishlist'] });
    } catch (e) {
      if (isAuthError(e)) { setUser(null); setWishLoginOpen(true); return; }
      toast({ title: 'Could not update wishlist', tone: 'error' });
    }
  };

  if (product.isError) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-16">
        <ErrorState title="Product not found" description="This product may have been archived or the link is wrong."
          action={<Link href="/products"><Button variant="secondary">Back to store</Button></Link>} />
      </div>
    );
  }
  if (!p) return <PageSkeleton />;

  const kind = artKindFor(p.name, p.category);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        ...(p.category ? [{ label: p.category, href: `/products?cat=${p.category.toLowerCase().replace(/\s+/g, '-')}` }] : []),
        { label: p.name },
      ]} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* ---------- gallery ---------- */}
        <div>
          <div className="overflow-hidden rounded-3xl border border-line bg-white">
            <ProductImage imageKey={p.images.find((i) => i.isMain)?.storageKey ?? p.images[0]?.storageKey}
              name={p.name} category={p.category} className="aspect-square w-full p-10" />
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {p.images.slice(0, 4).map((img) => (
                <div key={img.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                  <ProductImage imageKey={img.storageKey} name={p.name} category={p.category} className="aspect-square w-full p-3" />
                </div>
              ))}
            </div>
          )}
          {p.images.length === 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-surface-sunk px-4 py-3 text-[12px] text-ink-muted">
              <ProductArt kind={kind} className="h-8 w-8" /> Product photos coming soon — illustration shown.
            </div>
          )}
        </div>

        {/* ---------- buy box ---------- */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-accent">{p.brand ?? 'Apple'}{p.model ? ` · ${p.model}` : ''}</p>
              <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-ink md:text-[34px]">{p.name}</h1>
              {p.shortDescription && <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-soft">{p.shortDescription}</p>}
            </div>
            <button type="button" onClick={() => void toggleWish()} aria-label="Toggle wishlist"
              className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white transition-colors hover:bg-surface-sunk', wished && 'border-danger/30 text-danger')}>
              <Heart className={cn('h-5 w-5', wished && 'fill-danger')} />
            </button>
          </div>

          {p.ratingCount > 0 && (
            <a href="#reviews" className="mt-2 inline-block"><Rating value={p.ratingAvg} count={p.ratingCount} size="md" /></a>
          )}

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <span className="text-[32px] font-bold tracking-tight text-ink">{inr(price)}</span>
            {mrp > price && <span className="pb-1 text-[15px] text-ink-faint line-through">{inr(mrp)}</span>}
            {discountPct > 0 && <Badge tone="success">Save {discountPct}%</Badge>}
          </div>
          <p className="mt-1 text-[12px] text-ink-muted">Inclusive of all taxes{p.taxRate > 0 ? ` · GST ${Number(p.taxRate)}%` : ''}</p>

          {price >= 10000 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-sunk/60 px-3 py-2 text-[12.5px] text-ink-soft">
              <CreditCard className="h-4 w-4 text-accent shrink-0" />
              <span>
                No Cost EMI from <strong className="text-ink">{inr(Math.round(price / 6))}/month</strong> with standard plans
              </span>
            </div>
          )}

          {/* storage picker */}
          {storages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink">Storage</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {storages.map((s) => (
                  <button key={s} type="button" onClick={() => pickVariant(s)}
                    className={cn('rounded-xl border px-4 py-2 text-[13px] font-semibold transition-colors',
                      variant?.storage === s ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink hover:border-ink/40')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* color picker */}
          {colors.length > 0 && (
            <div className="mt-5">
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink">
                Colour {variant?.color && <span className="normal-case text-ink-muted">· {variant.color}</span>}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {colors.map((c) => (
                  <button key={c.name} type="button" onClick={() => pickVariant(undefined, c.name)} title={c.name}
                    aria-label={c.name} disabled={!c.available}
                    className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                      variant?.color === c.name ? 'border-accent scale-110' : 'border-line-strong hover:border-ink/40',
                      !c.available && 'opacity-35')}>
                    <span className="h-7 w-7 rounded-full border border-black/10" style={{ background: c.hex ?? '#d2d2d7' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* stock + sku */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone={out ? 'danger' : available <= 5 ? 'warning' : 'success'}>
              {out ? 'Out of stock' : available <= 5 ? `Only ${available} left` : STOCK_STATUS_LABEL[variant?.stockStatus ?? p.stockStatus]}
            </Badge>
            {variant?.sku && <span className="text-[12px] text-ink-faint">SKU {variant.sku}</span>}
            {p.warrantyMonths > 0 && <span className="flex items-center gap-1 text-[12px] text-ink-muted"><ShieldCheck className="h-3.5 w-3.5 text-success" /> {p.warrantyMonths}-month warranty</span>}
          </div>

          {/* qty + actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center rounded-full border border-line-strong bg-white">
              <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="flex h-full w-10 items-center justify-center rounded-l-full text-ink disabled:opacity-40"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center text-[14px] font-semibold text-ink">{qty}</span>
              <button type="button" aria-label="Increase quantity" disabled={qty >= Math.max(1, Math.min(available, 5))} onClick={() => setQty((n) => n + 1)}
                className="flex h-full w-10 items-center justify-center rounded-r-full text-ink disabled:opacity-40"><Plus className="h-4 w-4" /></button>
            </div>
            <Button size="lg" disabled={out} onClick={() => void addToCart(false)} className="flex-1 sm:flex-none">
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </Button>
            <Button size="lg" variant="accent" disabled={out} onClick={() => void addToCart(true)} className="flex-1 sm:flex-none">
              <Zap className="h-4 w-4" /> Buy now
            </Button>
          </div>

          {/* serviceability */}
          <div className="mt-7 rounded-2xl border border-line bg-white p-4">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink"><MapPin className="h-4 w-4 text-accent" /> Delivery & serviceability</h2>
            <div className="mt-2.5 flex gap-2">
              <Input value={pin} inputMode="numeric" maxLength={6} placeholder="Enter 6-digit PIN code"
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="h-10 max-w-[220px]" />
              {pin.length === 6 && (
                <span className="flex items-center text-[13px] text-ink-soft">{checking ? 'Checking…' : ''}</span>
              )}
            </div>
            {serviceability && pin.length === 6 && !checking && (
              <div className={cn('mt-3 rounded-xl px-3.5 py-2.5 text-[13px]', serviceability.serviceable ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')}>
                {serviceability.serviceable ? (
                  <>
                    <p className="font-semibold">{serviceability.message ?? 'Delivery available'}</p>
                    {serviceability.shippingMethods.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 text-[12px] opacity-90">
                        {serviceability.shippingMethods.slice(0, 3).map((m) => (
                          <li key={m.id} className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" /> {m.name} — {m.fee === 0 ? 'free' : inr(m.fee)}
                            {m.etaMinDays != null && m.etaMaxDays != null && ` · ${m.etaMinDays}–${m.etaMaxDays} days`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p>{serviceability.message ?? 'We do not deliver to this PIN code yet.'}</p>
                )}
              </div>
            )}
          </div>

          <ul className="mt-5 grid gap-2 text-[12.5px] text-ink-soft sm:grid-cols-2">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Certified Pre-Owned · 32-Pt QC Tested</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Open Box Delivery (Verify at Doorstep)</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> 1-Month Hardware Warranty Included</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> 3-Day Replacement Testing Window</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Pay Online (UPI/Cards) or Cash on Delivery</li>
          </ul>

          <div className="mt-4 rounded-xl border border-line bg-surface-sunk p-3 text-[12px] text-ink-muted">
            <p><strong className="text-ink">1-Month Warranty & Guarantee:</strong> Open Box Delivery allows inspection before accepting. You have a <strong>3-Day Testing Window</strong> for instant replacement if defective, backed by a <strong>1-Month iVanta Hardware Warranty</strong> for internal hardware faults. No warranty applies after 1 month.</p>
          </div>
        </div>
      </div>

      {/* ---------- description + specs ---------- */}
      <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="text-xl font-bold tracking-tight text-ink">About this product</h2>
          <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-soft">{p.description ?? p.shortDescription ?? 'No description provided yet.'}</p>
        </section>
        {p.specs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold tracking-tight text-ink">Specifications</h2>
            <dl className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {p.specs.map((s) => (
                <div key={s.specKey} className="grid grid-cols-[130px_1fr] gap-2 px-4 py-2.5 text-[13px]">
                  <dt className="text-ink-muted">{s.specKey}</dt>
                  <dd className="font-medium text-ink">{s.specValue}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {/* ---------- variants table ---------- */}
      {p.variants.length > 1 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-ink">All variants</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead className="border-b border-line bg-surface-sunk text-[11px] uppercase tracking-wider text-ink-muted">
                <tr><th className="px-4 py-2.5">Variant</th><th className="px-4 py-2.5">SKU</th><th className="px-4 py-2.5">Price</th><th className="px-4 py-2.5">Availability</th><th className="px-4 py-2.5" /></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {p.variants.map((v) => (
                  <tr key={v.id} className={cn(variant?.id === v.id && 'bg-accent-soft/40')}>
                    <td className="px-4 py-2.5 font-medium text-ink">{v.name ?? ([v.storage, v.color, v.connectivity, v.size].filter(Boolean).join(' · ') || p.name)}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{v.sku ?? '—'}</td>
                    <td className="px-4 py-2.5 font-semibold text-ink">{inr(v.price)}</td>
                    <td className="px-4 py-2.5"><Badge tone={STOCK_STATUS_TONE[v.stockStatus]}>{v.stockStatus === 'OUT_OF_STOCK' ? 'Sold out' : `${v.available} available`}</Badge></td>
                    <td className="px-4 py-2.5 text-right">
                      <Button variant={variant?.id === v.id ? 'primary' : 'secondary'} size="sm" disabled={v.stockStatus === 'OUT_OF_STOCK'}
                        onClick={() => setVariantId(v.id)}>
                        {variant?.id === v.id ? 'Selected' : 'Select'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------- reviews ---------- */}
      <section id="reviews" className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">Ratings & reviews</h2>
            {reviews.data && (
              <p className="mt-1 flex items-center gap-2 text-[13px] text-ink-muted">
                <Rating value={reviews.data.ratingAvg} count={reviews.data.ratingCount} size="md" />
                {reviews.data.ratingCount > 0 && `· ${reviews.data.ratingCount} verified rating${reviews.data.ratingCount === 1 ? '' : 's'}`}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {reviews.data?.content.length === 0 && (
              <p className="rounded-2xl border border-line bg-white px-4 py-8 text-center text-[13px] text-ink-muted">
                No reviews yet. Buy this product and share your experience — verified purchases are marked automatically.
              </p>
            )}
            {reviews.data?.content.map((r) => (
              <article key={r.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-0.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
                    <Star className="h-3 w-3 fill-white" /> {r.rating}
                  </span>
                  {r.verifiedPurchase && <Badge tone="success"><Check className="h-3 w-3" /> Verified purchase</Badge>}
                  <span className="text-[12px] font-medium text-ink">{r.userName ?? 'iVanta customer'}</span>
                  <span className="ml-auto text-[11px] text-ink-faint">{formatDate(r.createdAt)}</span>
                </div>
                {r.title && <h3 className="mt-2 text-[14px] font-semibold text-ink">{r.title}</h3>}
                {r.body && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{r.body}</p>}
              </article>
            ))}
          </div>
          <ReviewForm productId={p.id} onDone={() => { void reviews.refetch(); void qc.invalidateQueries({ queryKey: ['product', slug] }); }} />
        </div>
      </section>

      {/* ---------- related ---------- */}
      {related.data && related.data.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight text-ink">You may also like</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.data.slice(0, 4).map((rp) => <ProductCard key={rp.id} p={rp} />)}
          </div>
        </section>
      )}

      {/* ---------- wishlist login prompt (guests) ---------- */}
      <Dialog
        open={wishLoginOpen}
        onClose={() => setWishLoginOpen(false)}
        title="Sign in to save your wishlist"
        description="Please login to save products to your wishlist."
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setWishLoginOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}&register=1`)}>Register</Button>
            <Button onClick={() => router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}`)}>Login</Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Your wishlist is tied to your iVanta account so it syncs across devices. New here? An account
          is created automatically with your first OTP sign-in — no separate registration needed.
        </p>
      </Dialog>
    </div>
  );
}

function ReviewForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const toast = useUIStore((s) => s.toast);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setBusy(true);
    try {
      const r = await reviewService.create(productId, rating, title || undefined, body || undefined);
      toast({
        title: r.status === 'APPROVED' ? 'Review published' : 'Review submitted',
        description: r.status === 'APPROVED' ? 'Thanks for the verified feedback!' : 'It will appear after moderation.',
        tone: 'success',
      });
      setTitle(''); setBody(''); setRating(5);
      onDone();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Could not submit review', tone: 'error' });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="h-fit rounded-2xl border border-line bg-white p-5">
      <h3 className="text-[15px] font-bold text-ink">Write a review</h3>
      <p className="mt-1 text-[12px] text-ink-muted">
        {user ? 'Verified-purchase badge is computed automatically from your delivered orders.' : 'Sign in to review — purchases are verified server-side.'}
      </p>
      <div className="mt-4">
        <span className="text-[12px] font-medium text-ink-soft">Rating</span>
        <div className="mt-1.5 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}>
              <Star className={cn('h-6 w-6 transition-colors', n <= rating ? 'fill-warning text-warning' : 'text-line-strong')} />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" maxLength={140} className="h-10" />
      </div>
      <div className="mt-3">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you like or dislike?" maxLength={4000} className="min-h-[100px]" />
      </div>
      <Button type="submit" loading={busy} className="mt-4 w-full" disabled={!user ? false : rating < 1}>
        {user ? 'Submit review' : 'Sign in to review'}
      </Button>
    </form>
  );
}
