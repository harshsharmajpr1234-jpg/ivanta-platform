'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductArt, artKindFor } from '@/components/product/product-image';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { catalogService } from '@/services';
import { BRAND } from '@/constants';

const TRUST = [
  { icon: ShieldCheck, title: '6-Month Warranty', body: 'Refurbished devices from invoice date', href: '/warranty-policy' },
  { icon: Sparkles, title: 'A/B/C Condition Grading', body: 'Transparent cosmetic standards', href: '/condition-guide' },
  { icon: Truck, title: 'Open Box Delivery', body: '24h damage reporting & unboxing video', href: '/warranty-policy' },
  { icon: BadgeCheck, title: '100% Functional Quality', body: 'Camera, display, Face ID & battery tested', href: '/condition-guide' },
];

export default function HomePage() {
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogService.categories(),
    staleTime: 5 * 60_000,
  });

  const featured = useQuery({
    queryKey: ['products', 'featured-home'],
    queryFn: () => catalogService.products({ sort: 'popular', size: 8 }),
  });

  const cats = (categories.data?.[0]?.children ?? []).slice(0, 6);

  return (
    <div className="bg-surface">
      {/* ========================================================= */}
      {/* 1. OFFICIAL FLYPHONES HERO BANNER (Apple iPhone Updated) */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-3 pt-4 sm:px-4 sm:pt-6">
        <div className="group relative overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition-all hover:shadow-card">
          <Link href="/products" className="relative block w-full aspect-[16/9] sm:aspect-[2.1/1]" aria-label="Explore latest mobile devices">
            <Image
              src="/flyphones-hero-banner.jpg"
              alt="Flyphones — Empowering you with the latest Mobile Devices"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1240px"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SLEEK TRUST STRIP                                      */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-3 pt-4 sm:px-4 sm:pt-5">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 rounded-2xl border border-line bg-white px-4 py-3 text-[12px] sm:text-[12.5px] text-ink-soft shadow-xs">
          {TRUST.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className="inline-flex items-center gap-2 transition-colors hover:text-accent"
            >
              <t.icon className="h-4 w-4 text-accent shrink-0" />
              <span className="font-bold text-ink">{t.title}</span>
              <span className="hidden lg:inline text-ink-faint text-[11.5px]">· {t.body}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SHOP BY CATEGORY                                       */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Shop by Category</h2>
            <p className="mt-0.5 text-[13px] text-ink-muted">Tested pre-owned and refurbished devices in stock.</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:underline">
            All products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 lg:grid-cols-5">
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/products?cat=${c.slug}`}
              className="group flex flex-col items-center rounded-2xl border border-line bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft"
            >
              <ProductArt kind={artKindFor(c.name)} className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" />
              <h3 className="mt-3 text-[14px] font-bold text-ink">{c.name}</h3>
              <p className="mt-0.5 text-[11.5px] font-semibold text-accent">{c.productCount} models</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. FEATURED PRE-OWNED COLLECTION                          */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 pb-12 sm:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Featured Devices</h2>
            <p className="mt-0.5 text-[13px] text-ink-muted">Inspected, ready for dispatch with 6-month limited warranty.</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-accent hover:underline">
            View full store <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6">
          {featured.isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : !featured.data || featured.data.content.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center text-[13.5px] text-ink-muted">
              Products are being updated. Check back shortly!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {featured.data.content.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. CONDITION & WARRANTY GUIDES BANNER                     */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 pb-12 sm:pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-line bg-white p-6 shadow-soft sm:flex-row sm:p-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunk px-3 py-0.5 text-[11px] font-semibold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              {BRAND.name} Standards
            </div>
            <h3 className="mt-2 text-[17px] font-bold text-ink">Transparent Grading & 6-Month Limited Warranty</h3>
            <p className="mt-1 max-w-xl text-[13px] text-ink-muted leading-relaxed">
              Every device is functionally tested and graded into Grade A (Superb), Grade B (Good), and Grade C (Fair). Read our exact criteria before purchasing.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/condition-guide"
              className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-[13px] font-semibold text-white shadow-xs transition-transform hover:scale-[1.02]"
            >
              Condition Guide (A/B/C)
            </Link>
            <Link
              href="/warranty-policy"
              className="inline-flex h-10 items-center justify-center rounded-full border border-line-strong bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-sunk"
            >
              Warranty Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
