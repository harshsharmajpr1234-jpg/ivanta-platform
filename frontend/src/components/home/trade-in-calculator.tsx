'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { inr } from '@/lib/utils';

const TRADE_IN_DEVICES = [
  { id: 'ip11', name: 'iPhone 11 (64GB/128GB)', baseVal: 14000 },
  { id: 'ip12', name: 'iPhone 12 (128GB)', baseVal: 21000 },
  { id: 'ip13', name: 'iPhone 13 (128GB)', baseVal: 31000 },
  { id: 'ip14', name: 'iPhone 14 (128GB)', baseVal: 40000 },
  { id: 'ipxr', name: 'iPhone XR (64GB)', baseVal: 10500 },
  { id: 'android', name: 'Android Premium (OnePlus/Samsung S-series)', baseVal: 16000 },
];

const CONDITIONS = [
  { id: 'mint', label: 'Flawless', desc: 'No scratches, 85%+ battery', multiplier: 1.0 },
  { id: 'good', label: 'Good', desc: 'Light signs of usage, fully working', multiplier: 0.88 },
  { id: 'fair', label: 'Fair', desc: 'Visible marks/dents, working screen', multiplier: 0.72 },
];

export function TradeInCalculator() {
  const [selectedDevice, setSelectedDevice] = useState(TRADE_IN_DEVICES[1].id);
  const [condition, setCondition] = useState(CONDITIONS[0].id);

  const device = TRADE_IN_DEVICES.find((d) => d.id === selectedDevice) ?? TRADE_IN_DEVICES[0];
  const cond = CONDITIONS.find((c) => c.id === condition) ?? CONDITIONS[0];
  const estimatedValue = Math.round(device.baseVal * cond.multiplier / 100) * 100;

  return (
    <section className="border-b border-line bg-surface-sunk/40 py-12 sm:py-16">
      <div className="mx-auto max-w-[1240px] px-4">
        <div className="rounded-3xl border border-line bg-gradient-to-br from-white to-surface p-6 sm:p-12 shadow-soft">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            
            {/* Left Column: Heading & Controls */}
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent">
                  <RefreshCw className="h-3 w-3" /> Instant Trade-in Estimator
                </span>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  Exchange Your Old Phone & Save Big.
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted sm:text-[14.5px]">
                  Upgrade to certified pre-owned Apple. Get doorstep evaluation, instant payout, and exchange bonus.
                </p>
              </div>

              {/* Selector 1: Device */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold uppercase tracking-wider text-ink-faint">
                  1. Select your current phone:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TRADE_IN_DEVICES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDevice(d.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-[12px] font-medium transition-all ${
                        selectedDevice === d.id
                          ? 'border-accent bg-accent-soft text-accent ring-1 ring-accent'
                          : 'border-line bg-white text-ink hover:bg-surface-sunk'
                      }`}
                    >
                      <Smartphone className="h-4 w-4 shrink-0 text-ink-faint" />
                      <span className="truncate">{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector 2: Condition */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold uppercase tracking-wider text-ink-faint">
                  2. Device Physical Condition:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCondition(c.id)}
                      className={`rounded-xl border p-2.5 text-center text-[12px] transition-all ${
                        condition === c.id
                          ? 'border-accent bg-accent-soft text-accent font-bold ring-1 ring-accent'
                          : 'border-line bg-white text-ink font-medium hover:bg-surface-sunk'
                      }`}
                    >
                      <p>{c.label}</p>
                      <p className="text-[10px] text-ink-muted truncate mt-0.5">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Estimated Payout Card */}
            <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-white p-8 text-center shadow-soft">
              <span className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5" /> Guaranteed Buyback Value
              </span>
              <p className="mt-4 text-3xl font-black text-ink sm:text-5xl">
                Up to {inr(estimatedValue)}
              </p>
              <p className="mt-2 text-[12.5px] text-ink-soft max-w-xs">
                Estimated exchange discount towards any Certified Pre-Owned Apple purchase on iVanta.
              </p>

              <div className="mt-6 w-full space-y-2 border-t border-line/60 pt-4 text-left text-[12px] text-ink-muted">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Free doorstep physical verification
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Instant adjustment at delivery time
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Zero paperwork — verified in 5 minutes
                </p>
              </div>

              <div className="mt-6 w-full">
                <Link
                  href="/products"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-white font-semibold text-[13.5px] shadow-soft hover:bg-black transition-transform active:scale-[.98]"
                >
                  Shop Upgrades with Exchange <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
