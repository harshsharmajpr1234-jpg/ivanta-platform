import Link from 'next/link';
import { BRAND } from '@/constants';
import { Award, ShieldCheck, Truck, RotateCcw, Star } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#222222] bg-[#0d0d0d] text-white">
      {/* 1. Value Assurance Strip (ControlZ Dark Style) */}
      <div className="border-b border-[#222222] bg-[#000000]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 divide-y divide-[#222222] sm:grid-cols-4 sm:divide-y-0 sm:divide-x sm:divide-[#222222]">
          <div className="flex items-center gap-3 p-3.5 sm:p-5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0000FF]/20 text-[#60a5fa]">
              <Award className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-[12.5px] sm:text-[13px] font-bold text-white">Certified Renewed</p>
              <p className="text-[10.5px] sm:text-[11px] text-neutral-400">Factory 300+ checks</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 sm:p-5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-[12.5px] sm:text-[13px] font-bold text-white">1-Year Warranty</p>
              <p className="text-[10.5px] sm:text-[11px] text-neutral-400">Doorstep repair & support</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 sm:p-5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
              <Truck className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-[12.5px] sm:text-[13px] font-bold text-white">Open Box Delivery</p>
              <p className="text-[10.5px] sm:text-[11px] text-neutral-400">Inspect before accept</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 sm:p-5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <RotateCcw className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-[12.5px] sm:text-[13px] font-bold text-white">Instant Replace</p>
              <p className="text-[10.5px] sm:text-[11px] text-neutral-400">Hassle-free 3-day window</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Body */}
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          
          {/* Left Column: Mission + Logo + Ratings */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Flyphones Brand Identity Lockup */}
              <Link href="/" className="inline-flex items-center gap-3 group" aria-label="Flyphones Home">
                <img
                  src="/logo-icon.png"
                  alt="Flyphones Mascot"
                  className="h-9 w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
                />
                <div className="flex flex-col">
                  <div className="flex items-baseline leading-none font-black tracking-tight text-[20px] sm:text-[22px]">
                    <span className="text-[#f59e0b]">Fly</span>
                    <span className="text-white">phones</span>
                    <span className="text-[#f59e0b]">.</span>
                  </div>
                  <span className="text-[7px] font-bold tracking-wider text-neutral-400 uppercase leading-none pt-0.5 sm:text-[7.5px] sm:pt-1">
                    — Powered by Hansh Technologies —
                  </span>
                </div>
              </Link>

              {/* ControlZ-style Electric Blue Mission Heading */}
              <h3 className="mt-5 text-[24px] sm:text-[36px] lg:text-[40px] font-black leading-[1.08] tracking-tight text-[#0000FF]">
                On a mission to make smartphones sustainable & affordable.
              </h3>
              <p className="mt-3 text-[14px] sm:text-[15px] leading-relaxed text-neutral-300 max-w-md font-light">
                We increase the lifecycle of flagship smartphones by renewing them to like-new condition with 100% verified battery health and component-level diagnostic precision.
              </p>
            </div>

            {/* Google Rating Badge */}
            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-3.5 py-2 backdrop-blur-md w-fit">
              <span className="text-[12px] font-bold text-white">Google Verified</span>
              <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11.5px] font-extrabold text-emerald-400">
                4.8 <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
              </span>
              <span className="text-[11px] text-neutral-400">(1,200+ Reviews)</span>
            </div>
          </div>

          {/* Right Column: 3 Clean Navigation Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
            {/* Column 1: Company */}
            <div>
              <h4 className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wider text-white">
                Company
              </h4>
              <ul className="mt-3.5 space-y-2 text-[12.5px] sm:text-[13px]">
                <li><Link href="/about" className="text-neutral-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/condition-guide" className="text-neutral-400 hover:text-white transition-colors">Renew Process</Link></li>
                <li><Link href="/warranty-policy" className="text-neutral-400 hover:text-white transition-colors">Warranty & Claim</Link></li>
                <li><Link href="/support#tracking" className="text-neutral-400 hover:text-white transition-colors">Track Order</Link></li>
                <li><Link href="/support" className="text-neutral-400 hover:text-white transition-colors">Contact Support</Link></li>
              </ul>
            </div>

            {/* Column 2: Info & Policies */}
            <div>
              <h4 className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wider text-white">
                Info & Legal
              </h4>
              <ul className="mt-3.5 space-y-2 text-[12.5px] sm:text-[13px]">
                <li><Link href="/products?cat=iphone" className="text-neutral-400 hover:text-white transition-colors">Renewed Store</Link></li>
                <li><Link href="/privacy" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund-policy" className="text-neutral-400 hover:text-white transition-colors">Refund & Returns</Link></li>
                <li><Link href="/shipping-policy" className="text-neutral-400 hover:text-white transition-colors">Shipping Policy</Link></li>
                <li><Link href="/terms" className="text-neutral-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Column 3: Reach Us */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wider text-white">
                Reach Us
              </h4>
              <div className="mt-3.5 space-y-1.5 text-[12px] sm:text-[12.5px] text-neutral-400 leading-relaxed">
                <p className="font-bold text-white">{BRAND.parentCompany}</p>
                <p>{BRAND.address.full}</p>
                <p className="pt-1"><strong className="text-neutral-200">Phone:</strong> {BRAND.supportPhone}</p>
                <p><strong className="text-neutral-200">Email:</strong> {BRAND.supportEmail}</p>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Bottom Disclaimer & Copyright */}
        <div className="mt-10 border-t border-[#222222] pt-6 space-y-3 sm:space-y-4">
          <p className="text-[10.5px] sm:text-[11px] leading-relaxed text-neutral-400 max-w-4xl">
            * All product names, logos, and brands are the property of their respective owners (Apple Inc.). All company, product, and service names used in this website are for identification purposes only. Use of these names, logos, and brands does not imply endorsement.
          </p>
          <div className="flex flex-col items-start justify-between gap-2 text-[11.5px] sm:text-[12px] text-neutral-400 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} {BRAND.name} (Powered by {BRAND.parentCompany}). All rights reserved.</p>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <span>•</span>
              <Link href="/warranty-policy" className="hover:text-white transition-colors">Warranty</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
