'use client';

import { useState } from 'react';
import {
  Package, Sparkles, ShieldCheck, CheckCircle2,
  RotateCw, Eye, Award, Check, Layers, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ConditionGrade = 'grade-a-plus' | 'grade-a' | 'grade-b';

interface GradeInfo {
  label: string;
  badge: string;
  badgeTone: string;
  cosmetics: string;
  screenCondition: string;
  batteryFloor: string;
  discount: string;
}

const GRADES_DATA: Record<ConditionGrade, GradeInfo> = {
  'grade-a-plus': {
    label: 'Flawless (Grade A+)',
    badge: 'Like-New Condition',
    badgeTone: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    cosmetics: 'Zero visible scratches or dents on frame, back glass, and camera lenses.',
    screenCondition: '100% pristine OEM Retina OLED display with True Tone calibration.',
    batteryFloor: '88% to 100% original health guaranteed.',
    discount: 'Up to 45% off Apple MRP',
  },
  'grade-a': {
    label: 'Super Clean (Grade A)',
    badge: 'Light Use Only',
    badgeTone: 'bg-blue-100 text-blue-800 border-blue-300',
    cosmetics: 'Minimal hairline marks on titanium edge invisible from 20cm away.',
    screenCondition: 'Flawless touch latency, zero dead pixels or burn-in.',
    batteryFloor: '85% to 92% original health guaranteed.',
    discount: 'Up to 55% off Apple MRP',
  },
  'grade-b': {
    label: 'Value Buy (Grade B)',
    badge: 'Budget Friendly',
    badgeTone: 'bg-amber-100 text-amber-800 border-amber-300',
    cosmetics: 'Minor visible scuffs on outer corners, easily covered with a case.',
    screenCondition: '100% fully functional touch, pristine optics.',
    batteryFloor: '85%+ original health guaranteed.',
    discount: 'Up to 65% off Apple MRP',
  },
};

export function UnboxingShowcase() {
  const [isOpen, setIsOpen] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<ConditionGrade>('grade-a-plus');

  const grade = GRADES_DATA[selectedGrade];

  return (
    <section className="relative overflow-hidden border-b border-line bg-surface py-12 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-1 text-[11.5px] font-semibold text-ink shadow-soft">
            <Package className="h-3.5 w-3.5 text-accent" /> 100% Transparent Unboxing & Inspection
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl md:text-4xl">
            What's inside your certified box. <span className="text-accent">Zero surprises.</span>
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted sm:text-[15px]">
            Every iVanta certified order arrives sealed in eco-luxury packaging with tested accessories, verified QC certificate, and doorstep Open Box inspection.
          </p>
        </div>

        {/* Interactive Controls & Viewport */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Visual: 3D Box & Device Display */}
          <div className="relative rounded-3xl border border-line bg-gradient-to-b from-white via-surface-sunk/30 to-white p-6 shadow-soft lg:col-span-7">
            {/* Viewport Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition-all',
                    isOpen
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-white text-ink hover:border-ink/40'
                  )}
                >
                  <Package className="inline h-3.5 w-3.5 mr-1" />
                  {isOpen ? 'Box Opened (View Contents)' : 'Box Sealed (Tap to Open)'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="rounded-xl border border-line bg-white px-3 py-1.5 text-[11.5px] font-bold text-ink transition-all hover:border-ink/40"
                >
                  <RotateCw className="inline h-3.5 w-3.5 mr-1 text-accent" />
                  Flip Device ({isFlipped ? 'Back Camera' : 'Front Screen'})
                </button>
              </div>

              <span className={cn('rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold', grade.badgeTone)}>
                {grade.badge}
              </span>
            </div>

            {/* 3D Visual Stage */}
            <div className="relative my-6 flex min-h-[340px] items-center justify-center overflow-hidden py-4">
              {/* Soft Studio Floor Glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
              </div>

              {/* Box Animation Container */}
              <div
                className="relative flex flex-col items-center justify-center transition-all duration-700 ease-out"
                style={{
                  transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
                }}
              >
                {/* Device in 3D Card */}
                <div
                  className="relative z-20 flex h-[260px] w-[140px] flex-col items-center justify-between rounded-[26px] border-[3px] border-slate-300 bg-slate-900 p-2 shadow-2xl transition-transform duration-700"
                  style={{
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Front View */}
                  {!isFlipped ? (
                    <div className="flex h-full w-full flex-col justify-between rounded-[20px] bg-gradient-to-b from-indigo-950 via-slate-900 to-black p-2 text-white">
                      {/* Dynamic Island */}
                      <div className="mx-auto h-3.5 w-12 rounded-full bg-black border border-white/20" />

                      {/* Display graphic */}
                      <div className="my-auto text-center">
                        <div className="text-[10px] uppercase font-bold text-accent tracking-wider">iVanta QC</div>
                        <div className="text-[14px] font-extrabold tracking-tight mt-0.5">True Tone</div>
                        <div className="mt-1 text-[9px] text-white/60">32/32 Tests Passed</div>
                      </div>

                      {/* Bottom home indicator */}
                      <div className="mx-auto h-1 w-12 rounded-full bg-white/40" />
                    </div>
                  ) : (
                    /* Back View */
                    <div
                      className="flex h-full w-full flex-col justify-between rounded-[20px] bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 p-2 text-slate-900"
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {/* Camera Island */}
                      <div className="h-16 w-16 rounded-2xl bg-slate-300/80 p-1.5 shadow-inner border border-white/50">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="h-5 w-5 rounded-full bg-black border border-slate-400 shadow-sm" />
                          <div className="h-5 w-5 rounded-full bg-black border border-slate-400 shadow-sm" />
                          <div className="h-5 w-5 rounded-full bg-black border border-slate-400 shadow-sm" />
                          <div className="h-2 w-2 rounded-full bg-amber-200 self-center justify-self-center" />
                        </div>
                      </div>

                      {/* Apple Logo Placeholder */}
                      <div className="my-auto text-center font-bold text-slate-400 text-[10px]">
                         Certified
                      </div>

                      <div className="text-[8px] text-center text-slate-500 font-semibold">
                        {grade.label}
                      </div>
                    </div>
                  )}
                </div>

                {/* Unboxed Accessories Stack (Visible when Box is Open) */}
                <div
                  className={cn(
                    'mt-6 grid grid-cols-3 gap-2 w-full max-w-sm transition-all duration-500',
                    isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
                  )}
                >
                  <div className="flex flex-col items-center rounded-2xl border border-line bg-white/90 p-2.5 text-center shadow-soft">
                    <Zap className="h-4 w-4 text-accent" />
                    <span className="mt-1 text-[10.5px] font-bold text-ink">20W Fast Charger</span>
                    <span className="text-[9px] text-ink-muted">Included Free</span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl border border-line bg-white/90 p-2.5 text-center shadow-soft">
                    <Layers className="h-4 w-4 text-accent" />
                    <span className="mt-1 text-[10.5px] font-bold text-ink">Braided Cable</span>
                    <span className="text-[9px] text-ink-muted">Tested OEM</span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl border border-line bg-white/90 p-2.5 text-center shadow-soft">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    <span className="mt-1 text-[10.5px] font-bold text-ink">QC Certificate</span>
                    <span className="text-[9px] text-ink-muted">1-Mo Warranty</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footnote */}
            <div className="border-t border-line pt-3 text-center text-[11px] text-ink-faint">
              *All accessories are brand new and stress-tested before dispatch.
            </div>
          </div>

          {/* Right Column: Condition Grade Selector & Verification */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-accent">
                Hardware Transparency
              </span>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Choose Condition Grade
              </h3>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                We clearly disclose every device condition so you get exactly what you pay for.
              </p>

              {/* Grade Selector Tabs */}
              <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-surface-sunk p-1">
                {(['grade-a-plus', 'grade-a', 'grade-b'] as ConditionGrade[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGrade(g)}
                    className={cn(
                      'rounded-xl py-2 text-[11px] font-bold transition-all',
                      selectedGrade === g
                        ? 'bg-white text-ink shadow-sm'
                        : 'text-ink-muted hover:text-ink'
                    )}
                  >
                    {g === 'grade-a-plus' ? 'Grade A+' : g === 'grade-a' ? 'Grade A' : 'Grade B'}
                  </button>
                ))}
              </div>

              {/* Active Grade Details */}
              <div className="mt-5 space-y-3 rounded-2xl border border-line bg-surface-sunk/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-ink">{grade.label}</span>
                  <span className="text-[12px] font-bold text-accent">{grade.discount}</span>
                </div>

                <div className="space-y-2 text-[12px]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="text-ink-soft"><strong>Cosmetics:</strong> {grade.cosmetics}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="text-ink-soft"><strong>Display:</strong> {grade.screenCondition}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="text-ink-soft"><strong>Battery:</strong> {grade.batteryFloor}</span>
                  </div>
                </div>
              </div>

              {/* Open Box Delivery Feature Highlight */}
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[12.5px] font-bold text-emerald-950">Open Box Delivery Guaranteed</h4>
                  <p className="text-[11px] text-emerald-800">
                    Open the package and inspect cosmetic condition at your doorstep before paying or accepting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
