import Link from 'next/link';
import { BRAND } from '@/constants';
import { Award, ShieldCheck, Truck, RotateCcw, Star } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#e5e7eb] bg-[#f8f9fa] text-[#111111]">
      {/* 1. Value Assurance Strip (ControlZ Style) */}
      <div className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 divide-y divide-[#e5e7eb] sm:grid-cols-4 sm:divide-y-0 sm:divide-x sm:divide-[#e5e7eb]">
          <div className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-accent">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111111]">Certified Renewed</p>
              <p className="text-[11px] text-ink-muted">Factory grade 300+ checks</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111111]">1-Year Warranty</p>
              <p className="text-[11px] text-ink-muted">Doorstep repair & support</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111111]">Open Box Delivery</p>
              <p className="text-[11px] text-ink-muted">Inspect before acceptance</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111111]">Instant Replacement</p>
              <p className="text-[11px] text-ink-muted">Hassle-free 3-day window</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Body (Exact ControlZ 2-Column Grid Layout) */}
      <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          
          {/* Left Column: Mission + Logo + Ratings */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Flyphones Brand Identity Lockup */}
              <Link href="/" className="inline-flex items-center gap-3 group" aria-label="Flyphones Home">
                <img
                  src="/logo-icon.png"
                  alt="Flyphones Mascot"
                  className="h-10 w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
                />
                <div className="flex flex-col">
                  <div className="flex items-baseline leading-none font-black tracking-tight text-[22px]">
                    <span className="text-[#f59e0b]">Fly</span>
                    <span className="text-[#111111]">phones</span>
                    <span className="text-[#f59e0b]">.</span>
                  </div>
                  <span className="text-[7.5px] font-bold tracking-wider text-ink-muted uppercase leading-none pt-1">
                    — Powered by Hansh Technologies —
                  </span>
                </div>
              </Link>

              {/* ControlZ-style Electric Blue Mission Heading */}
              <h3 className="mt-6 text-[28px] sm:text-[36px] lg:text-[40px] font-black leading-[1.08] tracking-tight text-[#0000FF]">
                On a mission to make smartphones sustainable & affordable.
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-[#111111] max-w-md font-normal">
                We increase the lifecycle of flagship smartphones by renewing them to like-new condition with 100% verified battery health and component-level diagnostic precision.
              </p>
            </div>

            {/* Google Rating Badge */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-2.5 shadow-xs w-fit">
              <span className="text-[12.5px] font-bold text-[#111111]">Google Verified</span>
              <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[12px] font-extrabold text-emerald-700">
                4.8 <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
              </span>
              <span className="text-[11.5px] text-ink-muted">(1,200+ Happy Reviews)</span>
            </div>
          </div>

          {/* Right Column: 3 Clean ControlZ Navigation Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-8 sm:grid-cols-3">
            {/* Column 1: Company */}
            <div>
              <h4 className="text-[13px] font-extrabold uppercase tracking-wider text-[#111111]">
                Company
              </h4>
              <ul className="mt-4 space-y-2.5 text-[13px]">
                <li><Link href="/about" className="text-ink-muted hover:text-ink transition-colors">About Us</Link></li>
                <li><Link href="/condition-guide" className="text-ink-muted hover:text-ink transition-colors">Renew Process</Link></li>
                <li><Link href="/warranty-policy" className="text-ink-muted hover:text-ink transition-colors">Warranty & Claim</Link></li>
                <li><Link href="/support#tracking" className="text-ink-muted hover:text-ink transition-colors">Track Order</Link></li>
                <li><Link href="/support" className="text-ink-muted hover:text-ink transition-colors">Contact Support</Link></li>
              </ul>
            </div>

            {/* Column 2: Info & Policies */}
            <div>
              <h4 className="text-[13px] font-extrabold uppercase tracking-wider text-[#111111]">
                Info & Legal
              </h4>
              <ul className="mt-4 space-y-2.5 text-[13px]">
                <li><Link href="/products?cat=iphone" className="text-ink-muted hover:text-ink transition-colors">Renewed Store</Link></li>
                <li><Link href="/privacy" className="text-ink-muted hover:text-ink transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund-policy" className="text-ink-muted hover:text-ink transition-colors">Refund & Returns</Link></li>
                <li><Link href="/shipping-policy" className="text-ink-muted hover:text-ink transition-colors">Shipping Policy</Link></li>
                <li><Link href="/terms" className="text-ink-muted hover:text-ink transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Column 3: Reach Us */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-[13px] font-extrabold uppercase tracking-wider text-[#111111]">
                Reach Us
              </h4>
              <div className="mt-4 space-y-2 text-[12.5px] text-ink-muted leading-relaxed">
                <p className="font-bold text-[#111111]">{BRAND.parentCompany}</p>
                <p>{BRAND.address.full}</p>
                <p className="pt-1"><strong className="text-ink">Phone:</strong> {BRAND.supportPhone}</p>
                <p><strong className="text-ink">Email:</strong> {BRAND.supportEmail}</p>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Bottom Disclaimer & Copyright (Exact ControlZ Text) */}
        <div className="mt-12 border-t border-[#e5e7eb] pt-8 space-y-4">
          <p className="text-[11px] leading-relaxed text-ink-muted max-w-4xl">
            * All product names, logos, and brands are the property of their respective owners (Apple Inc.). All company, product, and service names used in this website are for identification purposes only. Use of these names, logos, and brands does not imply endorsement.
          </p>
          <div className="flex flex-col items-start justify-between gap-2 text-[12px] text-ink-muted sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} {BRAND.name} (Powered by {BRAND.parentCompany}). All rights reserved.</p>
            <div className="flex items-center gap-4 text-[12px]">
              <Link href="/terms" className="hover:text-ink">Terms</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-ink">Privacy</Link>
              <span>•</span>
              <Link href="/warranty-policy" className="hover:text-ink">Warranty</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
