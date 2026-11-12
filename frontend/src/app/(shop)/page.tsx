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
  Check,
  ArrowUpRight
} from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { catalogService } from '@/services';
import { BRAND } from '@/constants';

// ControlZ Exact Trust Pillars (Glassmorphic cards)
const CONTROLZ_PILLARS = [
  {
    value: '100%',
    title: 'Battery health you can count on.',
    subtitle: 'Tested high-capacity battery health on every device with certified peak performance.',
    link: '/condition-guide#battery'
  },
  {
    value: '300+',
    title: 'Every device, checked 300+ ways.',
    subtitle: 'Component-level diagnostics on display, logic board, cameras, sensors, and biometrics.',
    link: '/condition-guide'
  },
  {
    value: '1-Year',
    title: 'Covered for a full year.',
    subtitle: 'Doorstep warranty support, genuine repair service, and free pickup across India.',
    link: '/warranty-policy'
  },
  {
    value: 'Open Box',
    title: 'Help is never far away.',
    subtitle: 'Doorstep inspection before delivery acceptance. 100% verified and zero risk.',
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
    <div className="bg-[#000000] text-white selection:bg-[#0000FF] selection:text-white min-h-screen">
      
      {/* ========================================================= */}
      {/* 1. CONTROLZ PRODUCT LINKS BAR (cz-product-links-bar)       */}
      {/* ========================================================= */}
      <section className="bg-[#000000] pt-6 pb-2">
        <div className="mx-auto max-w-[1240px] px-4">
          <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-[#161616] border border-[#3A3A3A] p-1.5 scrollbar-none">
            <Link
              href="/products?cat=iphone"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-white hover:text-black shrink-0"
            >
              <span>iPhone</span>
            </Link>
            <div className="h-4 w-px bg-[#3A3A3A] shrink-0" />
            <Link
              href="/products?cat=ipad"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white/80 transition-all hover:bg-white hover:text-black shrink-0"
            >
              <span>iPad</span>
            </Link>
            <div className="h-4 w-px bg-[#3A3A3A] shrink-0" />
            <Link
              href="/products?cat=mac"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white/80 transition-all hover:bg-white hover:text-black shrink-0"
            >
              <span>MacBook</span>
            </Link>
            <div className="h-4 w-px bg-[#3A3A3A] shrink-0" />
            <Link
              href="/products?cat=watch"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white/80 transition-all hover:bg-white hover:text-black shrink-0"
            >
              <span>Apple Watch</span>
            </Link>
            <div className="h-4 w-px bg-[#3A3A3A] shrink-0" />
            <Link
              href="/products?cat=airpods"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white/80 transition-all hover:bg-white hover:text-black shrink-0"
            >
              <span>AirPods</span>
            </Link>
            <div className="h-4 w-px bg-[#3A3A3A] shrink-0" />
            <Link
              href="/condition-guide"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-[#D8E5FF] transition-all hover:bg-white hover:text-black shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#0000FF]" />
              <span>Renewed Standards</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. CONTROLZ EXACT HERO (czp_hero)                         */}
      {/* ========================================================= */}
      <section className="bg-[#000000] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] border-2 border-white/30 bg-[#000000] p-8 sm:p-14 lg:p-16 min-h-[580px] sm:min-h-[660px] flex flex-col justify-between">
            
            {/* Ambient Background Gradient Mesh */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full bg-[#0000FF]/25 blur-[120px]" />
            <div className="pointer-events-none absolute -left-24 -bottom-24 h-[400px] w-[400px] rounded-full bg-[#0000FF]/15 blur-[100px]" />

            {/* Top Micro Trust Pill */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold text-white uppercase tracking-widest backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-[#0000FF] animate-pulse" />
                <span>From New to Renewed</span>
                <span className="text-white/40">|</span>
                <span className="text-neutral-300">Like New. Only Smarter.</span>
              </div>
            </div>

            {/* Middle Main Content */}
            <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12 lg:gap-12 my-auto pt-6 pb-6">
              
              <div className="lg:col-span-7">
                <h1 className="text-[52px] sm:text-[78px] lg:text-[96px] font-black tracking-tight leading-[0.93] text-white">
                  Premium<br />
                  <span className="text-[#0000FF]">Renewed.</span>
                </h1>

                <p className="mt-6 max-w-xl text-[16px] sm:text-[18px] leading-relaxed text-neutral-300 font-light">
                  Flagship Apple smartphones precision-renewed at component level. 
                  Experience factory diagnostics, 100% verified battery health, and zero-compromise cosmetics with doorstep warranty.
                </p>

                {/* ControlZ Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/products?cat=iphone"
                    className="inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-white px-8 text-[15px] font-black text-black transition-all hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  >
                    Pick Your iPhone <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/condition-guide"
                    className="inline-flex h-14 items-center justify-center rounded-full border-2 border-white/40 bg-white/5 px-8 text-[15px] font-bold text-white transition-all hover:bg-white/15 hover:border-white"
                  >
                    See How We Renew
                  </Link>
                </div>
              </div>

              {/* Right Visual (Studio iPhone Showcase) */}
              <div className="lg:col-span-5 flex justify-center relative">
                <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-[32px] border-2 border-white/20 bg-white/5 p-4 backdrop-blur-xl flex items-center justify-center overflow-hidden">
                  
                  {/* Diagnostic Badges */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-2xl border border-white/20 bg-black/80 px-3.5 py-2 backdrop-blur-md">
                    <CheckCircle2 className="h-4 w-4 text-[#0000FF]" />
                    <span className="text-[11.5px] font-bold text-white">100% Original Retina</span>
                  </div>

                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-2xl border border-white/20 bg-black/80 px-3.5 py-2 backdrop-blur-md">
                    <BatteryCharging className="h-4 w-4 text-emerald-400" />
                    <span className="text-[11.5px] font-bold text-white">Peak Battery Health</span>
                  </div>

                  <Image
                    src="/hero-3d-apple-studio-white.jpg"
                    alt="Flyphones Certified Renewed Flagship"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-contain p-4 transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>

            </div>

            {/* Bottom 3 Numbers Bar */}
            <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/20 pt-6">
              <div>
                <p className="text-[28px] sm:text-[36px] font-black text-white tracking-tight">100%</p>
                <p className="text-[12px] font-medium text-neutral-400">Battery Performance</p>
              </div>
              <div>
                <p className="text-[28px] sm:text-[36px] font-black text-white tracking-tight">300+</p>
                <p className="text-[12px] font-medium text-neutral-400">Diagnostic Checkpoints</p>
              </div>
              <div>
                <p className="text-[28px] sm:text-[36px] font-black text-white tracking-tight">1-Year</p>
                <p className="text-[12px] font-medium text-neutral-400">Doorstep Warranty</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. CONTROLZ TRUST PILLARS (czp_trust 4 Glass Cards)       */}
      {/* ========================================================= */}
      <section className="bg-[#000000] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CONTROLZ_PILLARS.map((p) => (
              <Link
                key={p.title}
                href={p.link}
                className="group relative flex flex-col justify-between rounded-[32px] sm:rounded-[36px] border-2 border-white/25 bg-white/[0.07] p-8 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/[0.12] hover:border-white/40 min-h-[220px]"
              >
                {/* Arrow Top Right */}
                <div className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/70 transition-transform group-hover:rotate-45 group-hover:border-white group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </div>

                {/* Big Stat Value */}
                <div>
                  <p className="text-[44px] font-black tracking-tight leading-none text-white">
                    {p.value}
                  </p>
                  <h3 className="mt-3 text-[17px] font-bold text-white tracking-tight leading-snug">
                    {p.title}
                  </h3>
                </div>

                <p className="mt-4 text-[13px] leading-relaxed text-neutral-300 font-light">
                  {p.subtitle}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. PICK YOUR IPHONE (czp_lineup on Pure Black)            */}
      {/* ========================================================= */}
      <section className="bg-[#000000] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-[1240px]">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/20 pb-8">
            <div>
              <span className="text-[12px] font-black uppercase tracking-wider text-[#0000FF]">Curated Inventory</span>
              <h2 className="mt-2 text-[38px] sm:text-[56px] font-black tracking-tight text-white leading-none">
                Pick your iPhone.
              </h2>
              <p className="mt-3 text-[15px] text-neutral-400 font-light">
                Pristine pre-owned Apple smartphones in stock with same-day dispatch and 1-year warranty.
              </p>
            </div>

            <Link href="/products" className="inline-flex items-center gap-2 text-[14px] font-bold text-[#60a5fa] hover:text-white transition-colors">
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
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'border border-white/20 bg-[#161616] text-white hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="mt-10">
            {featured.isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : !featured.data || featured.data.content.length === 0 ? (
              <div className="rounded-[32px] border border-white/20 bg-[#161616] p-14 text-center">
                <p className="text-[18px] font-bold text-white">New renewed stock arriving today.</p>
                <p className="mt-2 text-[14px] text-neutral-400">Explore our other categories or check all available iPhones.</p>
                <Link
                  href="/products?cat=iphone"
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-[14px] font-bold text-black hover:bg-neutral-200 transition-colors"
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

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. INSIDE RENEW HUB (Engineering & Teardown Showcase)      */}
      {/* ========================================================= */}
      <section className="bg-[#000000] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-[1240px]">
          <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] border-2 border-white/20 bg-[#0d0d0d] p-8 sm:p-14 lg:p-16">
            
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <span className="rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#D8E5FF]">
                  Component-Level Engineering
                </span>
                <h2 className="mt-4 text-[34px] sm:text-[48px] font-black tracking-tight text-white leading-tight">
                  Inside Renew Hub.<br />
                  <span className="text-[#0000FF]">Engineered to perfection.</span>
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-300 font-light">
                  Unlike informal second-hand markets, Flyphones subjects every device to micro-component testing before earning the renewed certificate.
                </p>

                <div className="mt-8 space-y-3.5">
                  <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0000FF] text-white">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-white">Original OLED & 120Hz True Tone</p>
                      <p className="text-[12.5px] text-neutral-400">No generic display swap warnings. Factory responsive touch.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0000FF] text-white">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-white">Bionic & Thermal Stress Tested</p>
                      <p className="text-[12.5px] text-neutral-400">GPU stress benchmarks verified without thermal throttling.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0000FF] text-white">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-white">Camera Sensor & OIS Stabilization</p>
                      <p className="text-[12.5px] text-neutral-400">4K 60FPS Dolby Vision, LiDAR sensor, and optical zoom verified.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <Link
                    href="/condition-guide"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-[14px] font-bold text-black hover:bg-neutral-200 transition-all"
                  >
                    Read Condition Standards
                  </Link>
                  <Link
                    href="/warranty-policy"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 bg-white/5 px-6 text-[14px] font-bold text-white hover:bg-white/10 transition-all"
                  >
                    Warranty Coverage
                  </Link>
                </div>
              </div>

              {/* Right Diagnostic Seal */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative aspect-square w-full max-w-[380px] rounded-[32px] border-2 border-white/20 bg-white/5 p-8 flex flex-col items-center justify-center text-center backdrop-blur-xl">
                  <Award className="h-16 w-16 text-[#0000FF]" />
                  <p className="mt-4 text-xl font-black text-white tracking-wider">32-POINT DIAGNOSTIC SEAL</p>
                  <p className="mt-2 text-[12.5px] text-neutral-300">
                    Motherboard integrity, water-damage detection, and clean IMEI carrier whitelist validation.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white">FaceID 100% OK</span>
                    <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white">Battery 90%+</span>
                    <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white">Clean Carrier IMEI</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CONTROLZ ELECTRIC BLUE ASSURANCE BANNER                */}
      {/* ========================================================= */}
      <section className="bg-[#000000] px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-[1240px]">
          <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-[#0000FF] px-8 py-12 sm:px-14 sm:py-16 text-white shadow-blue">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                <Zap className="h-3.5 w-3.5 text-amber-300" /> Doorstep Trust Guarantee
              </span>
              <h3 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-white leading-tight">
                Love it or return it on the spot.<br />
                Zero questions asked.
              </h3>
              <p className="mt-4 text-[15px] text-white/90 leading-relaxed font-light">
                Every Flyphones package comes with Open-Box doorstep verification. Unbox the phone in front of the delivery executive, verify cosmetic perfection and IMEI, then sign with 100% peace of mind.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/products?cat=iphone"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[14px] font-bold text-black shadow-lg hover:bg-neutral-100 transition-all"
                >
                  Shop Certified Devices <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/support"
                  className="inline-flex h-12 items-center justify-center rounded-full border-2 border-white/40 bg-transparent px-6 text-[14px] font-bold text-white hover:bg-white/10 transition-all"
                >
                  Need Help? Talk to Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
