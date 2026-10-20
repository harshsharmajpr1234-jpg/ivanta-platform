'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductArt, artKindFor } from '@/components/product/product-image';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { catalogService } from '@/services';

const TRUST = [
  { icon: BadgeCheck, title: '100% Genuine Pre-Owned', body: 'Original Apple hardware, 32-point QC tested and fully functional with GST invoice.' },
  { icon: Truck, title: 'Open Box Delivery', body: 'Inspect physical condition at your doorstep in front of the courier before acceptance.' },
  { icon: RotateCcw, title: '1-Month Warranty', body: '3-day testing window for free replacement, backed by a 1-month hardware warranty.' },
  { icon: ShieldCheck, title: 'Pay Online or COD', body: 'Secure UPI, cards, net banking or Cash on Delivery — verified server-side.' },
];

export default function HomePage() {
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => catalogService.categories(), staleTime: 5 * 60_000 });
  const featured = useQuery({ queryKey: ['products', 'featured'], queryFn: () => catalogService.featured(8) });
  const newest = useQuery({ queryKey: ['products', 'newest'], queryFn: () => catalogService.products({ sort: 'newest', size: 4 }) });

  const cats = (categories.data?.[0]?.children ?? []).slice(0, 6);

  return (
    <div className="bg-surface">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-[12px] font-semibold text-accent">
              Certified Pre-Owned · 1-Month Warranty Included
            </span>
            <h1 className="mt-4 text-[34px] font-bold leading-[1.1] tracking-tight text-ink md:text-[52px]">
              Premium Pre-Owned Apple. <span className="text-accent">Tested. Verified. Affordable.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft md:text-base">
              Shop certified used iPhones, Macs, iPads, Watches and AirPods at up to 60% off —
              with Open Box Delivery, a 3-Day Testing Window with free replacement, a 1-Month Hardware Warranty, and flexible Online/COD payments.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/products" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-[15px] font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-[.98]">
                Shop Pre-Owned <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/products?cat=iphone" className="inline-flex h-12 items-center rounded-full border border-line-strong bg-white px-6 text-[15px] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-surface-sunk">
                Explore iPhones
              </Link>
            </div>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              <div><dt className="text-[11px] uppercase tracking-wider text-ink-faint">Warranty</dt><dd className="mt-0.5 text-lg font-bold text-ink">1 Month</dd></div>
              <div><dt className="text-[11px] uppercase tracking-wider text-ink-faint">Delivery</dt><dd className="mt-0.5 text-lg font-bold text-ink">Open Box</dd></div>
              <div><dt className="text-[11px] uppercase tracking-wider text-ink-faint">Replacement</dt><dd className="mt-0.5 text-lg font-bold text-ink">3 Days</dd></div>
            </dl>
          </div>
          <div className="relative hidden md:block" aria-hidden="true">
            <div className="absolute inset-0 rounded-[32px] bg-surface-sunk" />
            <div className="relative grid grid-cols-2 gap-4 p-8">
              <ProductArt kind="iphone" className="col-start-1 row-start-1 w-full" />
              <ProductArt kind="mac" className="col-start-2 row-start-1 mt-10 w-full" />
              <ProductArt kind="watch" className="col-start-1 row-start-2 -mt-4 w-2/3 justify-self-center" />
              <ProductArt kind="airpods" className="col-start-2 row-start-2 -mt-4 w-2/3 justify-self-center" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TRUST ROW ---------- */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><t.icon className="h-[18px] w-[18px]" /></span>
              <div>
                <h3 className="text-[13px] font-semibold text-ink">{t.title}</h3>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CATEGORIES ---------- */}
      <section className="mx-auto max-w-[1240px] px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Shop by category</h2>
            <p className="mt-1 text-[14px] text-ink-muted">Every Apple line-up, genuine and in stock.</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline">All products <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <Link key={c.id} href={`/products?cat=${c.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft">
              <ProductArt kind={artKindFor(c.name)} className="h-14 w-14 shrink-0" />
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-ink">{c.name}</h3>
                <p className="mt-0.5 truncate text-[12px] text-ink-muted">{c.description ?? 'Genuine Apple'}</p>
                <p className="mt-1 text-[12px] font-semibold text-accent">{c.productCount} product{c.productCount === 1 ? '' : 's'}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- FEATURED ---------- */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Featured products</h2>
              <p className="mt-1 text-[14px] text-ink-muted">Certified pre-owned Apple devices, inspected and tested by our experts.</p>
            </div>
          </div>
          {featured.isError ? (
            <ErrorState className="mt-7" description="Unable to load products right now. Please refresh or try again shortly." onRetry={() => void featured.refetch()} />
          ) : !featured.data ? (
            <ProductGridSkeleton count={4} />
          ) : featured.data.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-line bg-surface-sunk p-8 text-center text-[14px] text-ink-muted">
              Featured devices will be available shortly. Check back soon!
            </div>
          ) : (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.data.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ---------- NEW ARRIVALS ---------- */}
      {newest.data && newest.data.content.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 py-14">
          <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">New arrivals</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {newest.data.content.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ---------- FINAL CTA ---------- */}
      <section className="mx-auto max-w-[1240px] px-4 pb-16">
        <div className="overflow-hidden rounded-3xl bg-ink px-6 py-12 text-center md:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-4xl">Your next Apple product is one tap away.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-white/60">
            Free delivery above ₹999, server-verified secure payments and a 7-day return window on everything we sell.
          </p>
          <Link href="/products" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.02]">
            Browse the store <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
