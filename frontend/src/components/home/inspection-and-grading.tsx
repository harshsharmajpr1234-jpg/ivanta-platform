'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, BatteryCharging, Smartphone, Camera,
  Volume2, Sparkles, CheckCircle2, ArrowRight, Award,
  Cpu, Zap, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const QC_TABS = [
  {
    id: 'battery',
    label: 'Battery & Power',
    icon: BatteryCharging,
    badge: 'Min 85% Health Guaranteed',
    headline: 'Original Apple Battery Health Tested & Verified',
    description: 'Every pre-owned device undergoes comprehensive battery diagnostic cycling. No duplicate batteries, zero "Unknown Part" system warnings.',
    points: [
      '85% to 100% original battery health verified',
      'Diagnostic cycle count check via Apple System Profiler',
      'MagSafe & fast wireless charging stress-tested',
      'Thermal check under continuous 4K video playback',
    ],
    stat: '85%+',
    statLabel: 'Battery Health Floor',
  },
  {
    id: 'display',
    label: 'Display & Touch',
    icon: Smartphone,
    badge: '100% Genuine Retina',
    headline: 'Original OLED Displays with TrueTone Intact',
    description: 'Screens are inspected under polarized optical light to confirm original OEM glass, zero aftermarket copy screens, and flawless touch latency.',
    points: [
      'TrueTone calibration verified and active',
      '120Hz ProMotion high-refresh rate tested on Pro models',
      'Multi-touch digitizer 32-point grid mapping',
      'Zero dead pixels, burn-in, or backlight bleeding',
    ],
    stat: '100%',
    statLabel: 'TrueTone & OEM Glass',
  },
  {
    id: 'camera',
    label: 'Camera & Face ID',
    icon: Camera,
    badge: 'Studio Quality Capture',
    headline: 'Optics, Telephoto & TrueDepth Face ID Tested',
    description: 'High-speed studio camera testing across all focal lengths: 0.5x Ultra Wide, 1x Main, 3x/5x Telephoto, plus LiDAR sensor verification.',
    points: [
      'TrueDepth Face ID / Touch ID biometric authentication',
      'Sensor-shift Optical Image Stabilization (OIS) verified',
      'Cinematic 4K 60fps HDR video recording checked',
      'LiDAR depth scanner & night mode sensors mapped',
    ],
    stat: '32-Pt',
    statLabel: 'Biometric & Optical QC',
  },
  {
    id: 'hardware',
    label: 'Motherboard & Audio',
    icon: Cpu,
    badge: 'Zero Liquid Damage',
    headline: 'Bionic / Apple Silicon Performance Benchmarked',
    description: 'A-series & M-series chips benchmarked under peak load. Dual stereo speakers, active noise-cancelling mics, and Liquid Contact Indicators (LCI) inspected.',
    points: [
      'Zero liquid contact — LCI indicators 100% white/intact',
      'Dual stereo speakers & studio microphones clarity test',
      '5G / 4G LTE Dual SIM & eSIM network band testing',
      'Wi-Fi 6E, Bluetooth 5.3, and GPS accuracy validated',
    ],
    stat: '0%',
    statLabel: 'Liquid Damage Tolerance',
  },
];

const GRADES = [
  {
    tag: 'Grade A+ · Flawless',
    title: 'Like-New Condition',
    desc: 'Indistinguishable from a brand new sealed device at arm’s length. Perfect for gifting or flagship experience.',
    features: [
      'Flawless screen with zero scratches',
      'Body & frame in pristine like-new shape',
      '90%–100% peak battery health',
      'Includes MFi cable + 1-month warranty',
    ],
    bestFor: 'Looks & feels 100% brand new',
    popular: true,
  },
  {
    tag: 'Grade A · Superb Value',
    title: 'Minimal Signs of Love',
    desc: 'Tiny, faint micro-marks on the outer metal housing only. The screen is 100% spotless and functionality is identical.',
    features: [
      'Clean scratch-free display screen',
      'Faint hairline marks on aluminum edge only',
      '85%–94% healthy original battery',
      'Save up to 60% compared to new retail',
    ],
    bestFor: 'Maximum savings & performance',
    popular: false,
  },
];

export function InspectionAndGrading() {
  const [activeTab, setActiveTab] = useState('battery');
  const currentQC = QC_TABS.find((t) => t.id === activeTab) ?? QC_TABS[0];

  return (
    <section className="border-b border-line bg-surface py-12 sm:py-20 overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-4">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent sm:text-[12px]">
            <Award className="h-3.5 w-3.5" /> 32-Point Apple Certified QC Process
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl md:text-4xl">
            How Every Pre-Owned Device is Certified.
          </h2>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-muted sm:text-[15px]">
            We don’t just wipe the screen. Every used Apple device undergoes rigorous hardware testing, 
            battery profiling, and 100% original parts verification before reaching your doorstep.
          </p>
        </div>

        {/* Interactive QC Tabs */}
        <div className="mt-8 sm:mt-12">
          {/* Tabs Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar sm:justify-center">
            {QC_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all sm:text-[13.5px]',
                    isActive
                      ? 'bg-ink text-white shadow-soft scale-[1.02]'
                      : 'border border-line bg-white text-ink-soft hover:bg-surface-sunk hover:text-ink'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-accent' : 'text-ink-faint')} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Card Content */}
          <div className="mt-6 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              
              {/* Left Column: Details */}
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> {currentQC.badge}
                </span>
                <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  {currentQC.headline}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-ink-soft sm:text-[14.5px]">
                  {currentQC.description}
                </p>

                <div className="grid gap-2.5 pt-2 sm:grid-cols-2">
                  {currentQC.points.map((pt) => (
                    <div key={pt} className="flex items-start gap-2.5 rounded-xl bg-surface-sunk/60 p-3 text-[12px] font-medium text-ink sm:text-[12.5px]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Visual Metric Stat Box */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-surface to-surface-sunk p-8 text-center border border-line/80">
                <currentQC.icon className="h-12 w-12 text-accent" />
                <span className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-5xl">
                  {currentQC.stat}
                </span>
                <span className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-ink-muted">
                  {currentQC.statLabel}
                </span>
                <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint max-w-xs">
                  Backed by our 3-Day Doorstep Replacement Guarantee and 1-Month Hardware Warranty.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Section 2: Cosmetic Condition Grading Guide */}
        <div className="mt-16 sm:mt-24">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              Transparent Refurbished Standards
            </span>
            <h3 className="mt-1.5 text-xl font-bold tracking-tight text-ink sm:text-3xl">
              Honest Cosmetic Grading. No Surprises.
            </h3>
            <p className="mt-2 text-[13px] text-ink-muted sm:text-[14px]">
              Every device is graded fairly and priced accordingly. Both grades are 100% fully functional inside.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {GRADES.map((g) => (
              <div
                key={g.tag}
                className={cn(
                  'relative flex flex-col justify-between rounded-3xl border bg-white p-6 transition-all hover:shadow-soft sm:p-8',
                  g.popular ? 'border-accent ring-1 ring-accent/20' : 'border-line'
                )}
              >
                {g.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-[10.5px] font-bold text-white uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-accent">{g.tag}</span>
                    <span className="rounded-lg bg-surface-sunk px-2.5 py-1 text-[11px] font-semibold text-ink-soft">{g.bestFor}</span>
                  </div>
                  <h4 className="mt-2 text-xl font-bold text-ink">{g.title}</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{g.desc}</p>

                  <ul className="mt-5 space-y-2.5 border-t border-line/60 pt-5">
                    {g.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-[12.5px] font-medium text-ink-soft">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7 pt-4 border-t border-line/60">
                  <Link
                    href="/products"
                    className={cn(
                      'flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13.5px] font-semibold transition-transform active:scale-[.98]',
                      g.popular
                        ? 'bg-ink text-white hover:bg-black'
                        : 'border border-line bg-surface-sunk text-ink hover:bg-white'
                    )}
                  >
                    Browse {g.title} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
