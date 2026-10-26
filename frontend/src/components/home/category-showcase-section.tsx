'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ProductListItem } from '@/types';

interface FeaturePoint {
  title: string;
  desc: string;
}

interface CategoryShowcaseSectionProps {
  id: string;
  categoryName: string;
  badge: string;
  headline: string;
  description: string;
  startingPrice: string;
  bannerImage: string;
  bannerAlt: string;
  categorySlug: string;
  features: FeaturePoint[];
  products: ProductListItem[];
  loading?: boolean;
  reverseBanner?: boolean;
}

export function CategoryShowcaseSection({
  id,
  categoryName,
  badge,
  headline,
  description,
  startingPrice,
  bannerImage,
  bannerAlt,
  categorySlug,
  features,
  products,
  loading = false,
  reverseBanner = false,
}: CategoryShowcaseSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-line bg-surface py-10 sm:py-16">
      <div className="mx-auto max-w-[1240px] px-4 space-y-8">
        {/* ========================================================= */}
        {/* CATEGORY 3D HERO SPOTLIGHT BANNER                         */}
        {/* ========================================================= */}
        <div className="relative overflow-hidden rounded-[32px] border border-line bg-gradient-to-br from-white via-surface-sunk/30 to-white p-6 shadow-soft sm:p-8 md:p-10">
          {/* Subtle Ambient Background Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />

          <div
            className={cn(
              'grid items-center gap-8 md:grid-cols-12 md:gap-10',
              reverseBanner && 'md:flex-row-reverse'
            )}
          >
            {/* Banner Left Info */}
            <div className={cn('md:col-span-6 space-y-4', reverseBanner && 'md:order-2')}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-[11px] font-bold text-accent">
                  <Sparkles className="h-3 w-3" /> {badge}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  {startingPrice}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl md:text-4xl leading-tight">
                {headline}
              </h2>

              <p className="text-[13px] leading-relaxed text-ink-muted sm:text-[14.5px]">
                {description}
              </p>

              {/* 3 Trust Guarantees */}
              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.title} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <span className="text-[12px] font-bold text-ink">{f.title}: </span>
                      <span className="text-[11.5px] text-ink-muted">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Action Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Link
                  href={`/products?cat=${categorySlug}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[13.5px] font-bold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-[.98]"
                >
                  Explore All {categoryName}s <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-[11.5px] text-ink-faint">
                  Open Box Delivery · 1-Mo Warranty
                </span>
              </div>
            </div>

            {/* Banner Right 3D Visual Art */}
            <div
              className={cn(
                'relative md:col-span-6 flex items-center justify-center group',
                reverseBanner && 'md:order-1'
              )}
            >
              <div className="relative w-full overflow-hidden rounded-2xl border border-line bg-white shadow-md transition-transform duration-500 group-hover:scale-[1.01]">
                <Image
                  src={bannerImage}
                  alt={bannerAlt}
                  width={1200}
                  height={675}
                  priority={id === 'section-mac'}
                  className="w-full h-auto object-cover"
                />
                {/* Subtle Glass Sheen Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CATEGORY LIVE PRODUCTS GRID                               */}
        {/* ========================================================= */}
        <div>
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
                Available Certified {categoryName} Models
              </h3>
              <p className="text-[12px] text-ink-muted">
                Each unit tested across 32 hardware inspection points.
              </p>
            </div>

            <Link
              href={`/products?cat=${categorySlug}`}
              className="inline-flex items-center gap-1 text-[12.5px] font-bold text-accent hover:underline"
            >
              View all ({products.length}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={products.length || 3} />
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center text-[13.5px] text-ink-muted">
              More certified {categoryName} models arriving this week. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
