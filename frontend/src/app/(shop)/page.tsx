'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { ProductArt, artKindFor } from '@/components/product/product-image';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { InspectionAndGrading } from '@/components/home/inspection-and-grading';
import { Hero3DShowcase } from '@/components/home/hero-3d-showcase';
import { TradeInCalculator } from '@/components/home/trade-in-calculator';
import { UnboxingShowcase } from '@/components/home/unboxing-showcase';
import { CategoryShowcaseSection } from '@/components/home/category-showcase-section';
import { catalogService } from '@/services';

const TRUST = [
  { icon: BadgeCheck, title: '32-Point QC Certified', body: 'Original Apple hardware & battery', href: '/support#qc-certification' },
  { icon: Truck, title: 'Open Box Delivery', body: 'Doorstep inspection before accept', href: '/support#open-box' },
  { icon: RotateCcw, title: '1-Month Warranty', body: 'With 3-day free replacement', href: '/support#warranty' },
  { icon: ShieldCheck, title: 'Safe Online & COD', body: 'UPI, EMI, cards & Cash on Delivery', href: '/support' },
];

export default function HomePage() {
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => catalogService.categories(), staleTime: 5 * 60_000 });
  const iphones = useQuery({ queryKey: ['products', 'cat-iphone'], queryFn: () => catalogService.products({ category: 'iphone', size: 4 }) });
  const macs = useQuery({ queryKey: ['products', 'cat-mac'], queryFn: () => catalogService.products({ category: 'mac', size: 4 }) });
  const watches = useQuery({ queryKey: ['products', 'cat-watch'], queryFn: () => catalogService.products({ category: 'watch', size: 4 }) });
  const airpods = useQuery({ queryKey: ['products', 'cat-airpods'], queryFn: () => catalogService.products({ category: 'airpods', size: 4 }) });
  const newest = useQuery({ queryKey: ['products', 'newest'], queryFn: () => catalogService.products({ sort: 'newest', size: 4 }) });

  const cats = (categories.data?.[0]?.children ?? []).slice(0, 6);

  return (
    <div className="bg-surface">
      {/* ---------- HERO ---------- */}
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
                href="/support"
                className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong bg-white px-5 text-[14px] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-surface-sunk sm:h-12 sm:px-6 sm:text-[14px]"
              >
                Care & Warranty Hub
              </Link>
            </div>
          </div>

          {/* Clean 3D Apple Studio Showcase */}
          <div className="relative w-full">
            <Hero3DShowcase />
          </div>
        </div>
      </section>

      {/* ---------- SLEEK MINIMAL TRUST STRIP ---------- */}
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

      {/* ---------- CATEGORY QUICK JUMP BAR ---------- */}
      <nav className="sticky top-16 z-30 border-y border-line bg-white/95 backdrop-blur-md py-3 shadow-xs" aria-label="Category Navigation">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-2 px-4 overflow-x-auto no-scrollbar">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-faint hidden sm:inline">
            Browse Lineups:
          </span>
          <div className="flex items-center gap-2">
            {[
              { id: 'section-iphones', label: 'iPhones', count: iphones.data?.totalElements || 3, icon: '📱' },
              { id: 'section-mac', label: 'MacBooks', count: macs.data?.totalElements || 2, icon: '💻' },
              { id: 'section-watch', label: 'Apple Watch', count: watches.data?.totalElements || 2, icon: '⌚' },
              { id: 'section-airpods', label: 'AirPods', count: airpods.data?.totalElements || 1, icon: '🎧' },
            ].map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-sunk/80 px-4 py-1.5 text-[12.5px] font-bold text-ink transition-all hover:border-ink hover:bg-white hover:shadow-xs active:scale-95"
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="rounded-full bg-accent-soft px-1.5 py-0.2 text-[10px] font-extrabold text-accent">
                  {tab.count}
                </span>
              </a>
            ))}
          </div>
          <Link
            href="/products"
            className="shrink-0 text-[12px] font-bold text-accent hover:underline hidden md:inline"
          >
            All Apple Catalog →
          </Link>
        </div>
      </nav>

      {/* ---------- 1. iPHONES SHOWCASE SECTION ---------- */}
      <CategoryShowcaseSection
        id="section-iphones"
        categoryName="iPhone"
        badge="A-Series Bionic & Pro · OLED Retina"
        headline="Pre-Owned iPhones · 32-Point Inspected."
        description="Every iPhone undergoes comprehensive diagnostic testing for True Tone, 85%+ original battery health, OIS cameras, and clean IMEI. Includes 1-month hardware warranty and Open Box doorstep inspection."
        startingPrice="Starting ₹42,999 (Save Up to 45%)"
        bannerImage="/hero-3d-apple-studio-white.jpg"
        bannerAlt="Certified Pre-Owned iPhone 15 Pro Max 3D Showcase"
        categorySlug="iphone"
        features={[
          { title: 'True Tone OLED', desc: 'Original OEM display with factory calibration' },
          { title: '85%+ Battery Health', desc: 'Peak performance certified without service alerts' },
          { title: '48MP OIS Cameras', desc: 'Sensor-shift stabilization & 4K video passed' },
          { title: 'Instant Biometrics', desc: 'Face ID / Touch ID hardware mapped' },
        ]}
        products={iphones.data?.content || []}
        totalCount={iphones.data?.totalElements}
        loading={iphones.isLoading}
      />

      {/* ---------- 2. MACBOOKS SHOWCASE SECTION ---------- */}
      <CategoryShowcaseSection
        id="section-mac"
        categoryName="MacBook"
        badge="Liquid Retina XDR · M-Series Apple Silicon"
        headline="Pre-Owned MacBooks · High Performance Tested."
        description="Benchmark-tested M2 and M3 Apple Silicon processors, color-calibrated Liquid Retina XDR displays, silent thermal cooling, and verified 100% white Liquid Contact Indicators (zero moisture damage)."
        startingPrice="Starting ₹69,999 (Save Up to 35%)"
        bannerImage="/banner-macbook-anatomy.jpg"
        bannerAlt="Certified Pre-Owned MacBook Pro 3D Hardware Anatomy"
        categorySlug="mac"
        reverseBanner={true}
        features={[
          { title: 'Apple Silicon Benchmarked', desc: '100% peak clock speed & multi-core performance' },
          { title: 'Up to 18-Hr Battery Life', desc: 'Original health verified with full day autonomy' },
          { title: 'Zero Liquid Damage', desc: 'LCI indicators 100% white and untouched' },
          { title: 'Magic Keyboard & Ports', desc: 'Backlit scissors, MagSafe 3 & Thunderbolt tested' },
        ]}
        products={macs.data?.content || []}
        totalCount={macs.data?.totalElements}
        loading={macs.isLoading}
      />

      {/* ---------- 3. APPLE WATCH SHOWCASE SECTION ---------- */}
      <CategoryShowcaseSection
        id="section-watch"
        categoryName="Apple Watch"
        badge="Aerospace Titanium & Genuine Straps"
        headline="iVanta Watch Studio. Health & Performance on Wrist."
        description="From the rugged 49mm Titanium Watch Ultra 2 to the sleek Series 9 with Double Tap gestures. Blood Oxygen, ECG, optical heart sensors, and water-resistance seals fully validated."
        startingPrice="Starting ₹29,999 (Save Up to 33%)"
        bannerImage="/banner-watch-studio.jpg"
        bannerAlt="iVanta Apple Watch Studio 3D Customizer"
        categorySlug="watch"
        features={[
          { title: 'ECG & Blood Oxygen', desc: 'Advanced biometric health tracking calibrated' },
          { title: '100% Genuine Straps', desc: 'Alpine, Ocean & Trail bands thoroughly tested' },
          { title: '3000 Nits Brightness', desc: 'Crystal sapphire glass with high daylight visibility' },
          { title: 'Water Resistance Sealed', desc: 'Acoustic speaker moisture ejection verified' },
        ]}
        products={watches.data?.content || []}
        totalCount={watches.data?.totalElements}
        loading={watches.isLoading}
      />

      {/* ---------- 4. AIRPODS SHOWCASE SECTION ---------- */}
      <CategoryShowcaseSection
        id="section-airpods"
        categoryName="AirPods"
        badge="Personalized Spatial Audio · Dynamic Tracking"
        headline="Pre-Owned AirPods Pro · Pure Acoustic Immersion."
        description="Experience up to 2x more Active Noise Cancellation, Adaptive Audio, and crystal-clear call quality. Cleaned and acoustically certified with fresh silicone ear tips and USB-C MagSafe case."
        startingPrice="Starting ₹16,999 (Save 32% Off MRP)"
        bannerImage="/banner-airpods-spatial.jpg"
        bannerAlt="Certified Pre-Owned AirPods Pro 3D Spatial Audio Showcase"
        categorySlug="airpods"
        reverseBanner={true}
        features={[
          { title: '2x Active Noise Cancellation', desc: 'Acoustic micro-vents tested for silence' },
          { title: 'Dual Beamforming Mics', desc: 'Studio vocal isolation for voice calls' },
          { title: '30-Hour MagSafe Battery', desc: 'Fast USB-C & wireless charging verified' },
          { title: 'Hygienically Sanitized', desc: 'Ultrasound cleaned with fresh ear-tips' },
        ]}
        products={airpods.data?.content || []}
        totalCount={airpods.data?.totalElements}
        loading={airpods.isLoading}
      />

      {/* ---------- 3D UNBOXING & WHAT'S IN THE BOX ---------- */}
      <UnboxingShowcase />

      {/* ---------- 32-POINT QC & GRADING STANDARDS ---------- */}
      <InspectionAndGrading />

      {/* ---------- APPLE TRADE-IN & VALUE CALCULATOR ---------- */}
      <TradeInCalculator />

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
