'use client';

import Link from 'next/link';
import { ShieldCheck, Truck, RotateCcw, BadgeIndianRupee, ArrowRight, MapPin } from 'lucide-react';
import { BRAND } from '@/constants';
import { InspectionAndGrading } from '@/components/home/inspection-and-grading';
import { UnboxingShowcase } from '@/components/home/unboxing-showcase';
import { TradeInCalculator } from '@/components/home/trade-in-calculator';

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Independently Inspected & Verified',
    body: 'Every iPhone, Mac, Watch, and AirPod undergoes a rigorous 32-point hardware and diagnostic inspection by specialized technicians before dispatch.',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Fair, Transparent Pricing',
    body: 'Save up to 40% compared to brand new retail prices. Prices are computed server-side with zero hidden fees and full tax invoicing.',
  },
  {
    icon: Truck,
    title: 'Open Box Doorstep Delivery',
    body: 'Inspect your device physical condition right at your doorstep in front of the courier partner before accepting delivery.',
  },
  {
    icon: RotateCcw,
    title: '1-Month Warranty & 3-Day Testing',
    body: 'Includes a 3-day replacement window for real-world testing and a 1-month FlyPhones hardware warranty for complete peace of mind.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-surface">
      {/* ---------- HEADER HERO ---------- */}
      <section className="mx-auto max-w-[1240px] px-4 py-12 text-center sm:py-16 lg:py-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunk px-3.5 py-1 text-[11px] font-semibold text-ink">
          About FlyPhones
        </span>
        <h1 className="mx-auto mt-4 max-w-3xl text-[30px] font-extrabold leading-tight tracking-tight text-ink sm:text-[42px] lg:text-[48px]">
          The most trustworthy way to buy pre-owned Apple in India.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-muted sm:text-[16px]">
          FlyPhones is an independent platform dedicated to delivering certified pre-owned Apple devices.
          We test every device across 32 quality points, back every order with a 1-month hardware warranty,
          and offer doorstep open-box inspection across India.
        </p>
      </section>

      {/* ---------- 4 PILLARS ---------- */}
      <section className="mx-auto max-w-[1240px] px-4 pb-12 sm:pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-line bg-white p-6 shadow-soft transition-transform hover:-translate-y-0.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <p.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3.5 text-[15px] font-bold text-ink">{p.title}</h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 32-POINT QC & GRADING STANDARDS ---------- */}
      <div className="border-t border-line">
        <InspectionAndGrading />
      </div>

      {/* ---------- 3D UNBOXING & WHAT'S IN THE BOX ---------- */}
      <div className="border-t border-line">
        <UnboxingShowcase />
      </div>

      {/* ---------- TRADE-IN & VALUE CALCULATOR ---------- */}
      <div className="border-t border-line">
        <TradeInCalculator />
      </div>

      {/* ---------- HOW WE WORK ---------- */}
      <section className="mx-auto max-w-[1240px] px-4 py-16">
        <div className="rounded-3xl border border-line bg-ink p-8 text-white sm:p-12 lg:p-14">
          <h2 className="text-[22px] font-bold tracking-tight sm:text-[28px]">Our Commitments to You</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Authentic Hardware',
                d: 'We inspect for genuine displays, minimum 85% battery health, and verified Apple internal components without generic warning popups.',
              },
              {
                n: '02',
                t: 'Engineered Checkout & Stock',
                d: 'Real inventory counts in real time. Prices are verified by backend servers, payments are cryptographically confirmed, and stock is reserved.',
              },
              {
                n: '03',
                t: 'Open Box Delivery & Warranty',
                d: 'Doorstep inspection before courier acceptance, 3 days of testing with free reverse pickup, and 1-month comprehensive hardware warranty.',
              },
            ].map((s) => (
              <div key={s.n} className="space-y-2">
                <span className="text-[13px] font-bold text-accent">{s.n}</span>
                <h3 className="text-[16px] font-bold text-white">{s.t}</h3>
                <p className="text-[13px] leading-relaxed text-white/70">{s.d}</p>
              </div>
            ))}
          </div>

          {/* Office & Experience Center */}
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-[15px] font-bold text-white">Experience Center & Registered Office</h4>
                  <p className="mt-1 text-[13px] text-white/80">{BRAND.address.full}</p>
                  <p className="mt-1 text-[12px] text-white/60">Support: {BRAND.supportPhone} · {BRAND.supportEmail}</p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BRAND.address.full)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-white/20"
              >
                Get Directions
              </a>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-7 text-[14px] font-semibold text-ink transition-transform hover:scale-[1.02]"
            >
              Explore All Devices <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-transparent px-6 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Warranty & Policy Hub
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
