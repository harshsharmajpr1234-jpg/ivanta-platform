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
  Truck, 
  CheckCircle2, 
  Smartphone,
  ChevronRight,
  Zap,
  Sparkles,
  Layers,
  Award,
  RefreshCw,
  Check
} from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { catalogService } from '@/services';
import { BRAND } from '@/constants';

// ControlZ Exact Trust Pillars
const CONTROLZ_PILLARS = [
  {
    icon: BatteryCharging,
    badge: '100% Health Guarantee',
    title: 'Battery you can count on.',
    description: 'Every Flyphones device is delivered with high-capacity tested battery performance or certified replacement.',
    accent: 'bg-[#D8E5FF]',
    iconColor: 'text-[#0000FF]',
    link: '/condition-guide#battery'
  },
  {
    icon: Cpu,
    badge: '300+ Test Diagnostics',
    title: 'Component-level precision.',
    description: 'FaceID, cameras, OLED retina display, logic board, and True Tone tested with advanced diagnostic automation.',
    accent: 'bg-[#F4F4F4]',
    iconColor: 'text-[#000000]',
    link: '/condition-guide'
  },
  {
    icon: ShieldCheck,
    badge: 'Comprehensive Protection',
    title: 'Covered for a full year.',
    description: 'Hassle-free coverage with doorstep pickup, genuine repairs, and swift turnaround service across India.',
    accent: 'bg-[#D8E5FF]',
    iconColor: 'text-[#0000FF]',
    link: '/warranty-policy'
  },
  {
    icon: Truck,
    badge: 'Doorstep Peace of Mind',
    title: 'Open box delivery verified.',
    description: 'Inspect physical beauty and authenticity right at your doorstep before final acceptance. 100% risk-free.',
    accent: 'bg-[#F4F4F4]',
    iconColor: 'text-[#000000]',
    link: '/shipping-policy'
  },
];

// iPhone Series Quick Switcher (ControlZ style chips)
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
    <div className="bg-[#FFFFFF] text-[#000000] selection:bg-[#0000FF] selection:text-white">
      
      {/* ========================================================= */}
      {/* 1. CONTROLZ SIGNATURE HERO (Pure White + Electric Blue)   */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden border-b border-[#E5E7EB] bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1240px] px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7">
              {/* ControlZ Micro Pill */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#E5E7EB] bg-[#F4F4F4] px-4 py-1.5 text-[12px] font-semibold text-[#000000]">
                <span className="flex h-2 w-2 rounded-full bg-[#0000FF] animate-pulse" />
                <span className="tracking-wider uppercase text-[10.5px] font-black text-[#717171]">From New to Renewed</span>
                <span className="text-[#D1D5DB]">|</span>
                <span className="font-bold text-[#000000]">Like New. Only Smarter.</span>
              </div>

              {/* ControlZ Signature Huge Typography */}
              <h1 className="mt-6 text-[44px] font-black tracking-tight text-[#000000] sm:text-[62px] lg:text-[72px] leading-[1.02]">
                Premium<br />
                <span className="text-[#0000FF]">
                  Renewed.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[16px] sm:text-[17.5px] leading-relaxed text-[#717171] font-normal">
                Flagship Apple devices precision-renewed at component level. 
                Experience pristine cosmetics, 100% verified battery health, and factory diagnostics backed by comprehensive warranty.
              </p>

              {/* ControlZ CTAs */}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/products?cat=iphone"
                  className="inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-[#000000] px-8 text-[15px] font-bold text-white shadow-soft transition-all hover:bg-[#0000FF] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Pick Your iPhone <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/condition-guide"
                  className="inline-flex h-13 items-center justify-center rounded-full border-2 border-[#E5E7EB] bg-[#FFFFFF] px-7 text-[15px] font-bold text-[#000000] transition-all hover:border-[#000000] hover:bg-[#F4F4F4]"
                >
                  See How We Renew
                </Link>
              </div>

              {/* Micro Trust Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-[#E5E7EB] pt-8">
                <div>
                  <p className="text-[26px] font-black text-[#000000] tracking-tight sm:text-[30px]">100%</p>
                  <p className="text-[12px] font-semibold text-[#717171]">Battery Performance</p>
                </div>
                <div>
                  <p className="text-[26px] font-black text-[#000000] tracking-tight sm:text-[30px]">300+</p>
                  <p className="text-[12px] font-semibold text-[#717171]">Diagnostic Checkpoints</p>
                </div>
                <div>
                  <p className="text-[26px] font-black text-[#000000] tracking-tight sm:text-[30px]">Up to 1-Yr</p>
                  <p className="text-[12px] font-semibold text-[#717171]">Comprehensive Warranty</p>
                </div>
              </div>
            </div>

            {/* Right Showcase Column (ControlZ Floating Showcase Card) */}
            <div className="relative flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-[450px] rounded-[22px] border border-[#E5E7EB] bg-gradient-to-b from-[#FFFFFF] to-[#F4F4F4] p-5 shadow-card">
                
                {/* Floating Inspection Card Top Left */}
                <div className="absolute -top-3.5 -left-3.5 z-20 flex items-center gap-2.5 rounded-2xl border border-[#E5E7EB] bg-white/95 px-4 py-2.5 shadow-pop backdrop-blur">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D8E5FF] text-[#0000FF]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#000000]">Zero Scratches on Display</p>
                    <p className="text-[10.5px] text-[#717171]">Component-Level Polished</p>
                  </div>
                </div>

                {/* Floating Inspection Card Bottom Right */}
                <div className="absolute -bottom-3.5 -right-3.5 z-20 flex items-center gap-2.5 rounded-2xl border border-[#E5E7EB] bg-white/95 px-4 py-2.5 shadow-pop backdrop-blur">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <BatteryCharging className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#000000]">Original Battery Verified</p>
                    <p className="text-[10.5px] text-[#717171]">Peak Efficiency Tested</p>
                  </div>
                </div>

                {/* Device Studio Graphic */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-white flex items-center justify-center p-3">
                  <Image
                    src="/hero-3d-apple-studio-white.jpg"
                    alt="Flyphones Premium Renewed iPhone Flagship"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 450px"
                    className="object-contain p-2 transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. THE 4 PILLARS OF CONTROLZ RENEWAL (Grid Section)       */}
      {/* ========================================================= */}
      <section className="bg-[#F4F4F4] py-16 sm:py-20 border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="rounded-full bg-[#D8E5FF] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#0000FF]">
              The Flyphones Guarantee
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#000000] sm:text-4xl">
              Every device earns the Flyphones name.
            </h2>
            <p className="mt-2.5 text-[14.5px] text-[#717171]">
              We don&apos;t just wipe and resell. We renew smartphones with engineering precision to deliver a true unboxing experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CONTROLZ_PILLARS.map((p) => (
              <Link
                key={p.title}
                href={p.link}
                className="group flex flex-col justify-between rounded-[22px] border border-[#E5E7EB] bg-[#FFFFFF] p-7 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${p.accent} ${p.iconColor}`}>
                      <p.icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-[#F4F4F4] px-2.5 py-1 text-[10.5px] font-bold text-[#717171]">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="mt-6 text-[17.5px] font-black text-[#000000] tracking-tight group-hover:text-[#0000FF] transition-colors">
                    {p.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#717171]">
                    {p.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-[12.5px] font-bold text-[#0000FF] group-hover:translate-x-1 transition-transform">
                  <span>Learn more</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. PICK YOUR IPHONE (ControlZ Signature Series Bar)       */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <span className="text-[11.5px] font-black uppercase tracking-wider text-[#0000FF]">Curated Inventory</span>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#000000] sm:text-4xl">
              Pick your iPhone.
            </h2>
            <p className="mt-1 text-[14px] text-[#717171]">
              Pristine pre-owned Apple smartphones in stock with same-day dispatch.
            </p>
          </div>

          <Link href="/products" className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#0000FF] hover:underline">
            View full catalogue ({categories.data?.[0]?.productCount || 'All'} devices) <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Series Filter Chips */}
        <div className="mt-8 flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {IPHONE_SERIES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeries(s.id)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-[13.5px] font-bold transition-all ${
                selectedSeries === s.id
                  ? 'bg-[#000000] text-white shadow-soft'
                  : 'border border-[#E5E7EB] bg-[#FFFFFF] text-[#000000] hover:bg-[#F4F4F4]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="mt-8">
          {featured.isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : !featured.data || featured.data.content.length === 0 ? (
            <div className="rounded-[22px] border border-[#E5E7EB] bg-[#FFFFFF] p-12 text-center">
              <p className="text-[16px] font-bold text-[#000000]">New renewed stock arriving today.</p>
              <p className="mt-1 text-[13.5px] text-[#717171]">Explore our other categories or check all available iPhones.</p>
              <Link
                href="/products?cat=iphone"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#000000] px-6 text-[13.5px] font-bold text-white hover:bg-[#0000FF] transition-colors"
              >
                Browse All iPhones
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featured.data.content.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. COMPONENT ANATOMY & RENEWAL SHOWCASE (High Tech)       */}
      {/* ========================================================= */}
      <section className="bg-[#000000] text-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            
            <div className="lg:col-span-7">
              <span className="rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#D8E5FF]">
                Precision Craftsmanship
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                Loved like new.<br />
                <span className="text-[#D8E5FF]">Engineered to perfection.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                Unlike informal second-hand markets, Flyphones subjects every device to micro-component testing before earning the renewed certificate.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0000FF] text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-white">Original OLED & 120Hz True Tone</p>
                    <p className="text-[12.5px] text-white/60">No generic display swap warnings. Factory responsive touch.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0000FF] text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-white">Bionic & Thermal Stress Tested</p>
                    <p className="text-[12.5px] text-white/60">GPU stress benchmarks verified without thermal throttling.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0000FF] text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-white">Camera Sensor & OIS Stabilization</p>
                    <p className="text-[12.5px] text-white/60">4K 60FPS Dolby Vision, LiDAR sensor, and optical zoom verified.</p>
                  </div>
                </div>
              </div>

              <div className="mt-9 flex items-center gap-4">
                <Link
                  href="/condition-guide"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-[14px] font-bold text-[#000000] shadow-soft hover:bg-[#D8E5FF] transition-all"
                >
                  Read Condition Standards
                </Link>
                <Link
                  href="/warranty-policy"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-[14px] font-bold text-white hover:bg-white/10 transition-all"
                >
                  Warranty Coverage
                </Link>
              </div>
            </div>

            {/* Right Badge Seal Graphic */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative aspect-square w-full max-w-[380px] rounded-[22px] border border-white/15 bg-white/5 p-8 flex flex-col items-center justify-center text-center">
                <Award className="h-16 w-16 text-[#D8E5FF]" />
                <p className="mt-4 text-xl font-black text-white tracking-wider">32-POINT DIAGNOSTIC SEAL</p>
                <p className="mt-2 text-[12.5px] text-white/60">
                  Motherboard integrity, water-damage detection, and clean IMEI carrier whitelist validation.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white">FaceID 100% OK</span>
                  <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white">Battery 90%+</span>
                  <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white">Clean Carrier IMEI</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. SHOP BY CATEGORY (Apple Ecosystem)                     */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E5E7EB] pb-6">
          <div>
            <span className="text-[11.5px] font-black uppercase tracking-wider text-[#0000FF]">Entire Lineup</span>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#000000] sm:text-4xl">
              Explore Apple Ecosystem
            </h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-1 text-[13.5px] font-bold text-[#0000FF] hover:underline">
            All devices <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/products?cat=${c.slug}`}
              className="group flex flex-col items-center rounded-[22px] border border-[#E5E7EB] bg-[#FFFFFF] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#000000] hover:shadow-card"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4F4F4] text-[#000000] transition-transform group-hover:scale-110">
                <Smartphone className="h-8 w-8 text-[#000000]" />
              </div>
              <h3 className="mt-4 text-[15px] font-black text-[#000000]">{c.name}</h3>
              <p className="mt-1 text-[12px] font-bold text-[#0000FF]">{c.productCount} models in stock</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CONTROLZ ASSURANCE CALLOUT BANNER                      */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="relative overflow-hidden rounded-[22px] bg-[#0000FF] px-8 py-12 sm:px-14 sm:py-16 text-white shadow-blue">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
              <Zap className="h-3.5 w-3.5 text-amber-300" /> Doorstep Trust Guarantee
            </span>
            <h3 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-white leading-tight">
              Love it or return it on the spot.<br />
              Zero questions asked.
            </h3>
            <p className="mt-4 text-[15px] text-white/85 leading-relaxed">
              Every Flyphones package comes with Open-Box doorstep verification. Unbox the phone in front of the delivery executive, verify cosmetic perfection and IMEI, then sign with 100% peace of mind.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/products?cat=iphone"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[14px] font-bold text-[#000000] shadow-soft hover:bg-[#F4F4F4] transition-all"
              >
                Shop Certified Devices <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex h-12 items-center justify-center rounded-full border-2 border-white/30 bg-transparent px-6 text-[14px] font-bold text-white hover:bg-white/10 transition-all"
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
