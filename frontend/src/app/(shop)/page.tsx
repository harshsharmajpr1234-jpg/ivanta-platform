'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowRight, 
  BatteryCharging, 
  ShieldCheck, 
  Cpu, 
  RotateCcw, 
  CheckCircle2, 
  Truck, 
  Sparkles,
  Smartphone,
  Award,
  ChevronRight,
  Zap,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { catalogService } from '@/services';
import { BRAND } from '@/constants';

// ControlZ-style Tier Pillars
const CONTROLZ_PILLARS = [
  {
    icon: BatteryCharging,
    badge: '100% Health Guarantee',
    title: 'Battery you can count on.',
    description: 'Every Flyphones device is delivered with high-capacity tested battery performance or certified replacement.',
    accent: 'from-amber-500/10 to-transparent',
    border: 'border-amber-200/80',
    iconColor: 'text-amber-600',
    link: '/condition-guide#battery'
  },
  {
    icon: Cpu,
    badge: '300+ Test Diagnostics',
    title: 'Component-level precision.',
    description: 'FaceID, cameras, OLED retina display, logic board, and True Tone tested with advanced diagnostic automation.',
    accent: 'from-blue-500/10 to-transparent',
    border: 'border-blue-200/80',
    iconColor: 'text-accent',
    link: '/condition-guide'
  },
  {
    icon: ShieldCheck,
    badge: 'Comprehensive Protection',
    title: 'Covered for a full year.',
    description: 'Hassle-free coverage with doorstep pickup, genuine repairs, and swift turnaround service across India.',
    accent: 'from-emerald-500/10 to-transparent',
    border: 'border-emerald-200/80',
    iconColor: 'text-emerald-600',
    link: '/warranty-policy'
  },
  {
    icon: Truck,
    badge: 'Doorstep Peace of Mind',
    title: 'Open box delivery verified.',
    description: 'Inspect physical beauty and authenticity right at your doorstep before final acceptance. 100% risk-free.',
    accent: 'from-purple-500/10 to-transparent',
    border: 'border-purple-200/80',
    iconColor: 'text-purple-600',
    link: '/shipping-policy'
  },
];

// iPhone Series Quick Switcher
const IPHONE_SERIES = [
  { id: 'all', label: 'All Flagships', filter: '' },
  { id: '16', label: 'iPhone 16 Series', filter: 'iPhone 16' },
  { id: '15', label: 'iPhone 15 Series', filter: 'iPhone 15' },
  { id: '14', label: 'iPhone 14 Series', filter: 'iPhone 14' },
  { id: '13', label: 'iPhone 13 Series', filter: 'iPhone 13' },
  { id: 'pro', label: 'Pro & Pro Max', filter: 'Pro' },
];

export default function HomePage() {
  const [selectedSeries, setSelectedSeries] = useState('all');

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogService.categories(),
    staleTime: 5 * 60_000,
  });

  const featured = useQuery({
    queryKey: ['products', 'featured-home', selectedSeries],
    queryFn: () => catalogService.products({ 
      sort: 'popular', 
      size: 8,
      q: selectedSeries === 'all' ? undefined : IPHONE_SERIES.find(s => s.id === selectedSeries)?.filter 
    }),
  });

  const cats = (categories.data?.[0]?.children ?? []).slice(0, 6);

  return (
    <div className="bg-[#fafafa] text-[#111111] selection:bg-accent selection:text-white">
      {/* ========================================================= */}
      {/* 1. CONTROLZ-STYLE MINIMAL LUXURY HERO                     */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden border-b border-line/60 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7">
              {/* Top Trust Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-sunk px-3.5 py-1.5 text-[12px] font-semibold text-ink">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="tracking-wide uppercase text-[10.5px] font-bold text-ink-muted">From New to Renewed</span>
                <span className="text-line-strong">|</span>
                <span className="text-ink">Like New. Only Smarter.</span>
              </div>

              {/* ControlZ Big Title */}
              <h1 className="mt-5 text-[40px] font-extrabold tracking-tight text-[#111111] sm:text-[56px] lg:text-[66px] leading-[1.05]">
                Premium<br />
                <span className="bg-gradient-to-r from-accent via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Renewed.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] sm:text-[17px] leading-relaxed text-ink-muted font-normal">
                Flagship smartphones meticulously renewed at component level. 
                Enjoy pristine cosmetics, 100% verified battery health, and factory diagnostics with complete warranty assurance.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/products?cat=iphone"
                  className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-[#111111] px-7 text-[14.5px] font-semibold text-white shadow-soft transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.98]"
                >
                  Pick Your iPhone <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/condition-guide"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong bg-white px-6 text-[14.5px] font-semibold text-ink transition-all hover:bg-surface-sunk hover:border-ink/40"
                >
                  See How We Renew
                </Link>
              </div>

              {/* Micro Trust Stats */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-line/70 pt-6">
                <div>
                  <p className="text-[22px] font-extrabold text-[#111111] tracking-tight sm:text-[26px]">100%</p>
                  <p className="text-[11.5px] font-medium text-ink-muted">Battery Performance</p>
                </div>
                <div>
                  <p className="text-[22px] font-extrabold text-[#111111] tracking-tight sm:text-[26px]">300+</p>
                  <p className="text-[11.5px] font-medium text-ink-muted">Diagnostic Checkpoints</p>
                </div>
                <div>
                  <p className="text-[22px] font-extrabold text-[#111111] tracking-tight sm:text-[26px]">Up to 1-Yr</p>
                  <p className="text-[11.5px] font-medium text-ink-muted">Comprehensive Warranty</p>
                </div>
              </div>
            </div>

            {/* Right Showcase Column (ControlZ Style Device Teardown / Like-New Visual) */}
            <div className="relative flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-[440px] rounded-3xl border border-line bg-gradient-to-b from-white to-surface-sunk p-4 shadow-card">
                {/* Floating Inspection Card */}
                <div className="absolute -top-3 -left-3 z-20 flex items-center gap-2 rounded-2xl border border-line bg-white/95 px-3.5 py-2 shadow-pop backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[11.5px] font-bold text-ink">Zero Scratches on Display</p>
                    <p className="text-[10px] text-ink-muted">Component-Level Polished</p>
                  </div>
                </div>

                <div className="absolute -bottom-3 -right-3 z-20 flex items-center gap-2 rounded-2xl border border-line bg-white/95 px-3.5 py-2 shadow-pop backdrop-blur">
                  <BatteryCharging className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[11.5px] font-bold text-ink">Original Battery Verified</p>
                    <p className="text-[10px] text-ink-muted">Tested Peak Efficiency</p>
                  </div>
                </div>

                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white flex items-center justify-center p-2">
                  <Image
                    src="/hero-3d-apple-studio-white.jpg"
                    alt="Flyphones Premium Renewed iPhone Flagship"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 440px"
                    className="object-contain p-2 transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. THE 4 PILLARS OF CONTROLZ RENEWAL (Interactive Cards) */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-accent">The Flyphones Guarantee</span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
            Every device earns the Flyphones name.
          </h2>
          <p className="mt-2 text-[14px] text-ink-muted">
            We don&apos;t just wipe and resell. We renew smartphones with engineering precision to deliver a true unboxing experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTROLZ_PILLARS.map((p) => (
            <Link
              key={p.title}
              href={p.link}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border ${p.border} bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-card`}
            >
              <div className={`absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-gradient-to-bl ${p.accent} pointer-events-none transition-transform duration-500 group-hover:scale-110`} />
              
              <div>
                <div className="flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-sunk ${p.iconColor}`}>
                    <p.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-surface-sunk px-2.5 py-0.5 text-[10px] font-semibold text-ink-muted">
                    {p.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-[16.5px] font-bold text-[#111111] tracking-tight group-hover:text-accent transition-colors">
                  {p.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  {p.description}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-1.5 text-[12px] font-bold text-accent group-hover:translate-x-1 transition-transform">
                <span>Learn more</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. PICK YOUR IPHONE (ControlZ Series Selector & Grid)      */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-accent">Curated Inventory</span>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
              Pick your iPhone.
            </h2>
            <p className="mt-1 text-[13.5px] text-ink-muted">
              Pristine pre-owned Apple smartphones in stock with same-day dispatch.
            </p>
          </div>

          <Link href="/products" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-accent hover:underline">
            View full catalogue ({categories.data?.[0]?.productCount || 'All'} devices) <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Series Filter Tabs (ControlZ pill bar) */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {IPHONE_SERIES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeries(s.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                selectedSeries === s.id
                  ? 'bg-[#111111] text-white shadow-soft'
                  : 'border border-line bg-white text-ink hover:bg-surface-sunk'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="mt-6">
          {featured.isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : !featured.data || featured.data.content.length === 0 ? (
            <div className="rounded-3xl border border-line bg-white p-12 text-center">
              <p className="text-[15px] font-semibold text-ink">New renewed stock arriving today.</p>
              <p className="mt-1 text-[13px] text-ink-muted">Explore our other categories or check all available iPhones.</p>
              <Link
                href="/products?cat=iphone"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-[13px] font-semibold text-white"
              >
                Browse All iPhones
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {featured.data.content.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. COMPONENT ANATOMY & RENEWAL SHOWCASE (ControlZ-style)  */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-3xl border border-line bg-white p-8 sm:p-12 shadow-soft">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold text-accent uppercase tracking-wider">
                Precision Craftsmanship
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl lg:text-4xl">
                Loved like new.<br />
                Engineered to perfection.
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">
                Unlike local marketplaces that wipe dust off used devices, Flyphones operates precision testing on micro-components before anything leaves our facility.
              </p>

              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-ink">Original OLED & True Tone Calibration</p>
                    <p className="text-[12px] text-ink-muted">No non-genuine display warnings. 100% responsive 120Hz ProMotion.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-ink">Bionic / Apple Silicon Thermal Health</p>
                    <p className="text-[12px] text-ink-muted">Stress-tested under intensive GPU benchmarks without throttling.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-ink">Camera Sensors & OIS Stabilization</p>
                    <p className="text-[12px] text-ink-muted">4K 60FPS Dolby Vision, LiDAR sensor, and optical zoom verified.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Link
                  href="/condition-guide"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#111111] px-6 text-[13.5px] font-semibold text-white shadow-soft hover:bg-black transition-all"
                >
                  Read Condition Standards
                </Link>
                <Link
                  href="/warranty-policy"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong bg-white px-5 text-[13.5px] font-semibold text-ink hover:bg-surface-sunk transition-all"
                >
                  Warranty Coverage
                </Link>
              </div>
            </div>

            {/* Visual Teardown Element */}
            <div className="relative flex items-center justify-center">
              <div className="relative aspect-square w-full max-w-[420px] rounded-3xl bg-surface-sunk/80 p-6 flex flex-col items-center justify-center border border-line">
                <div className="text-center">
                  <Award className="mx-auto h-12 w-12 text-accent" />
                  <p className="mt-3 text-lg font-black text-ink">32-POINT DIAGNOSTIC SEAL</p>
                  <p className="mt-1 text-xs text-ink-muted max-w-xs">
                    Each device passes motherboard integrity, water-damage detection, and IMEI carrier whitelist validation.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="rounded-xl border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-ink">
                    FaceID OK
                  </span>
                  <span className="rounded-xl border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-ink">
                    Battery 90%+
                  </span>
                  <span className="rounded-xl border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-ink">
                    Clean Carrier IMEI
                  </span>
                  <span className="rounded-xl border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-ink">
                    Microphone & Stereo OK
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. SHOP BY CATEGORY (Apple Ecosystem)                     */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-accent">Entire Lineup</span>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
              Explore Apple Ecosystem
            </h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline">
            All devices <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/products?cat=${c.slug}`}
              className="group flex flex-col items-center rounded-3xl border border-line bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-ink/20 hover:shadow-card"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunk text-ink transition-transform group-hover:scale-110">
                <Smartphone className="h-7 w-7 text-ink" />
              </div>
              <h3 className="mt-3.5 text-[14.5px] font-bold text-[#111111]">{c.name}</h3>
              <p className="mt-0.5 text-[12px] font-semibold text-accent">{c.productCount} models available</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CONTROLZ-STYLE ASSURANCE CALLOUT BANNER               */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#111111] px-6 py-10 sm:px-12 sm:py-16 text-white shadow-pop">
          {/* Subtle glow circle */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              <Zap className="h-3 w-3 text-amber-400" /> Doorstep Trust Guarantee
            </span>
            <h3 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-white">
              Love it or return it on the spot.<br />
              Zero questions asked.
            </h3>
            <p className="mt-3 text-[14.5px] text-white/70 leading-relaxed">
              Every Flyphones package comes with Open-Box doorstep verification. Unbox the phone in front of the courier executive, verify cosmetic perfection and IMEI, then sign with 100% peace of mind.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/products?cat=iphone"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-[13.5px] font-semibold text-ink shadow-soft hover:bg-white/90 transition-all"
              >
                Shop Certified Devices <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 text-[13.5px] font-semibold text-white hover:bg-white/10 transition-all"
              >
                Need Help? Talk to Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
