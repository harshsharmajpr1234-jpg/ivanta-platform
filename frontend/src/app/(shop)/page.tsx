'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductArt, artKindFor } from '@/components/product/product-image';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { Hero3DShowcase } from '@/components/home/hero-3d-showcase';
import { catalogService } from '@/services';

const TRUST = [
  { icon: BadgeCheck, title: '32-Point Inspected', body: 'Original hardware & battery tested', href: '/about' },
  { icon: Truck, title: 'Open Box Delivery', body: 'Doorstep inspection before accept', href: '/support#open-box' },
  { icon: RotateCcw, title: '1-Month Warranty', body: 'With 3-day replacement testing', href: '/support#warranty' },
  { icon: ShieldCheck, title: 'Safe Online & COD', body: 'UPI, EMI, cards & Cash on Delivery', href: '/support' },
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
      {/* 1. HERO SECTION (Clean, Minimal, Apple Aesthetics)        */}
      {/* ========================================================= */}
      <section className="relative border-b border-line bg-white overflow-hidden">
        <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-4 py-8 sm:py-12 md:grid-cols-2 md:gap-10 lg:py-16">
          <div className="w-full min-w-0 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunk/80 px-3 py-1 text-[11px] font-semibold text-ink">
              <svg className="h-3.5 w-3.5 fill-current text-ink shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.44-6.3-9.67-11.48-20.89-15.54-33.66-4.06-12.77-6.09-24.37-6.09-34.81 0-14.78 3.8-26.68 11.4-35.7 7.6-9.02 17.07-13.62 28.41-13.8 5.63.13 11.33 1.5 17.11 4.12 5.78 2.62 9.68 4.02 11.7 4.2 1.83-.2 5.86-1.63 12.08-4.3 6.22-2.67 11.69-3.95 16.42-3.84 9.17.43 17.19 3.44 24.06 9.04 6.87 5.6 11.53 12.72 13.98 21.36-8.24 4.97-12.28 11.83-12.11 20.57.17 7.9 3.37 14.74 9.6 20.52 6.23 5.78 13.78 9.08 22.65 9.9-1.97 6.07-4.27 12.35-6.9 18.84zM119.22 31.86c0-7.39 2.63-14.28 7.89-20.67 5.26-6.39 11.77-10.42 19.53-12.09.22 1.41.33 2.61.33 3.6 0 7.39-2.79 14.37-8.37 20.94-5.58 6.57-12.24 10.43-19.98 11.58-.1-.98-.4-2.1-.4-3.36z" />
              </svg>
              Pre-Owned Apple · iVanta Quality Checked
            </span>
            <h1 className="mt-3.5 text-[34px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[44px] lg:text-[52px]">
              Premium Made<br />
              <span className="text-accent">Affordable.</span>
            </h1>
            <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-muted sm:text-[15.5px]">
              Genuine pre-owned Apple devices inspected across our 32-point hardware checklist. Backed by iVanta 1-month warranty and doorstep open box inspection.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[14px] font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-[.98] sm:h-12 sm:px-7 sm:text-[14.5px]"
              >
                Shop All Products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong bg-white px-5 text-[14px] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-surface-sunk sm:h-12 sm:px-6 sm:text-[14px]"
              >
                About Us & Testing
              </Link>
            </div>
          </div>

          {/* Clean 3D Apple Studio Showcase */}
          <div className="relative w-full">
            <Hero3DShowcase />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SLEEK MINIMAL TRUST STRIP                              */}
      {/* ========================================================= */}
      <section className="border-b border-line bg-white py-3 sm:py-3.5">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-y-2 gap-x-6 px-4 text-[12px] sm:text-[12.5px] text-ink-soft">
          {TRUST.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className="inline-flex items-center gap-2 transition-colors hover:text-accent"
            >
              <t.icon className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="font-bold text-ink">{t.title}</span>
              <span className="hidden lg:inline text-ink-faint text-[11.5px]">· {t.body}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SHOP BY CATEGORY                                       */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 py-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Shop by Category</h2>
            <p className="mt-0.5 text-[13px] text-ink-muted">Tested pre-owned Apple devices in stock.</p>
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
            <p className="mt-0.5 text-[13px] text-ink-muted">Inspected, ready for dispatch with 1-month warranty.</p>
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
      {/* 5. MINIMAL CLEAN BOTTOM BANNER                            */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 pb-12 sm:pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-line bg-white p-6 shadow-soft sm:flex-row sm:p-8">
          <div>
            <h3 className="text-[17px] font-bold text-ink">Want to learn about our quality standards?</h3>
            <p className="mt-1 text-[13px] text-ink-muted">
              Read about our 32-point inspection, battery health verification, doorstep open box delivery, and warranty.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/about"
              className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-[13px] font-semibold text-white shadow-xs transition-transform hover:scale-[1.02]"
            >
              About iVanta Standards
            </Link>
            <Link
              href="/support"
              className="inline-flex h-10 items-center justify-center rounded-full border border-line-strong bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-sunk"
            >
              Support Hub
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
