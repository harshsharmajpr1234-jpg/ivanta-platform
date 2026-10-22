'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductArt, artKindFor } from '@/components/product/product-image';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { InspectionAndGrading } from '@/components/home/inspection-and-grading';
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
      <section className="relative border-b border-line bg-white">
        <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-4 py-8 sm:py-12 md:grid-cols-2 md:gap-10 md:py-20">
          <div className="w-full min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent sm:text-[12px]">
              Certified Pre-Owned · 1-Month Warranty Included
            </span>
            <h1 className="mt-3.5 text-[26px] font-extrabold leading-[1.14] tracking-tight text-ink sm:text-[38px] md:text-[50px]">
              Premium Pre-Owned Apple. <span className="text-accent">Tested. Verified. Affordable.</span>
            </h1>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-ink-soft sm:mt-4 sm:text-[15px] md:text-base">
              Shop certified used iPhones, Macs, iPads, Watches and AirPods at up to 60% off —
              with Open Box Delivery, 3-Day Free Replacement, 1-Month Hardware Warranty, and Online/COD payments.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
              <Link href="/products" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[14px] font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-[.98] sm:h-12 sm:px-7 sm:text-[15px]">
                Shop Pre-Owned <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/products?cat=iphone" className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong bg-white px-5 text-[14px] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-surface-sunk sm:h-12 sm:px-6 sm:text-[15px]">
                Explore iPhones
              </Link>
            </div>

            {/* Quick Mobile Category Badges */}
            <div className="mt-4 flex w-full max-w-full items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:hidden">
              {[
                { label: 'iPhones', href: '/products?cat=iphone' },
                { label: 'MacBooks', href: '/products?cat=mac' },
                { label: 'iPads', href: '/products?cat=ipad' },
                { label: 'Watches', href: '/products?cat=apple-watch' },
                { label: 'AirPods', href: '/products?cat=airpods' },
              ].map((pill) => (
                <Link key={pill.label} href={pill.href} className="shrink-0 rounded-full border border-line bg-surface-sunk px-3 py-1 text-[11.5px] font-semibold text-ink hover:bg-white">
                  {pill.label}
                </Link>
              ))}
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-4 sm:mt-9 sm:max-w-md sm:gap-4 sm:pt-6">
              <div className="min-w-0"><dt className="truncate text-[10px] uppercase tracking-wider text-ink-faint sm:text-[11px]">Warranty</dt><dd className="mt-0.5 text-[14px] font-bold text-ink sm:text-lg">1 Month</dd></div>
              <div className="min-w-0"><dt className="truncate text-[10px] uppercase tracking-wider text-ink-faint sm:text-[11px]">Delivery</dt><dd className="mt-0.5 text-[14px] font-bold text-ink sm:text-lg">Open Box</dd></div>
              <div className="min-w-0"><dt className="truncate text-[10px] uppercase tracking-wider text-ink-faint sm:text-[11px]">Replacement</dt><dd className="mt-0.5 text-[14px] font-bold text-ink sm:text-lg">3 Days</dd></div>
            </dl>
          </div>

          {/* Desktop Visual Illustration */}
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
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-2.5 px-3 py-6 sm:gap-6 sm:px-4 sm:py-10 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex min-w-0 flex-col gap-2 rounded-2xl bg-surface-sunk/60 p-3 sm:flex-row sm:bg-transparent sm:p-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent sm:h-9 sm:w-9">
                <t.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <div>
                <h3 className="text-[12.5px] font-semibold text-ink sm:text-[13px]">{t.title}</h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted sm:text-[12px]">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CATEGORIES ---------- */}
      <section className="mx-auto max-w-[1240px] px-4 py-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-3xl">Shop by category</h2>
            <p className="mt-0.5 text-[13px] text-ink-muted sm:text-[14px]">Every Apple line-up, genuine and in stock.</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:underline sm:text-[13px]">
            All products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-4 lg:grid-cols-3">
          {cats.map((c) => (
            <Link key={c.id} href={`/products?cat=${c.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft sm:gap-4 sm:p-5">
              <ProductArt kind={artKindFor(c.name)} className="h-10 w-10 shrink-0 sm:h-14 sm:w-14" />
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-semibold text-ink sm:text-[15px]">{c.name}</h3>
                <p className="mt-0.5 truncate text-[11px] text-ink-muted sm:text-[12px]">{c.description ?? 'Genuine Apple'}</p>
                <p className="mt-1 text-[11px] font-semibold text-accent sm:text-[12px]">{c.productCount} product{c.productCount === 1 ? '' : 's'}</p>
              </div>
              <ArrowRight className="ml-auto hidden h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink sm:block" />
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- FEATURED PRODUCTS ---------- */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-8 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-3xl">Featured products</h2>
              <p className="mt-0.5 text-[13px] text-ink-muted sm:text-[14px]">Certified pre-owned Apple devices, inspected and tested by our experts.</p>
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
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-4 lg:grid-cols-4">
              {featured.data.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ---------- 32-POINT QC & GRADING STANDARDS ---------- */}
      <InspectionAndGrading />

      {/* ---------- NEW ARRIVALS ---------- */}
      {newest.data && newest.data.content.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 py-8 sm:py-14">
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-3xl">New arrivals</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-4 lg:grid-cols-4">
            {newest.data.content.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ---------- FINAL CTA ---------- */}
      <section className="mx-auto max-w-[1240px] px-4 pb-12 sm:pb-16">
        <div className="overflow-hidden rounded-3xl bg-ink px-5 py-8 text-center sm:px-8 sm:py-12 md:px-12">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-4xl">Your next Apple product is one tap away.</h2>
          <p className="mx-auto mt-2.5 max-w-xl text-[13px] leading-relaxed text-white/60 sm:mt-3 sm:text-[14px]">
            Free delivery above ₹999, server-verified secure payments and a 3-day replacement window on everything we sell.
          </p>
          <Link href="/products" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-7 text-[14px] font-semibold text-ink transition-transform hover:scale-[1.02] sm:mt-7 sm:h-12 sm:px-8 sm:text-[15px]">
            Browse the store <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
