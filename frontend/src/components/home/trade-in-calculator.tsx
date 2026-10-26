'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Sparkles, RefreshCw, CheckCircle2,
  ShieldCheck, Truck, Zap, Smartphone, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceModel {
  name: string;
  baseValue: number;
  chip: string;
  storageOptions: { size: string; multiplier: number }[];
}

const MODELS: Record<string, DeviceModel> = {
  'iPhone 11': {
    name: 'iPhone 11',
    baseValue: 14000,
    chip: 'A13 Bionic',
    storageOptions: [
      { size: '64GB', multiplier: 1.0 },
      { size: '128GB', multiplier: 1.15 },
      { size: '256GB', multiplier: 1.3 },
    ],
  },
  'iPhone 12': {
    name: 'iPhone 12',
    baseValue: 20000,
    chip: 'A14 Bionic · 5G',
    storageOptions: [
      { size: '64GB', multiplier: 1.0 },
      { size: '128GB', multiplier: 1.14 },
      { size: '256GB', multiplier: 1.28 },
    ],
  },
  'iPhone 13': {
    name: 'iPhone 13',
    baseValue: 28000,
    chip: 'A15 Bionic · Cinematic Mode',
    storageOptions: [
      { size: '128GB', multiplier: 1.0 },
      { size: '256GB', multiplier: 1.16 },
      { size: '512GB', multiplier: 1.35 },
    ],
  },
  'iPhone 14': {
    name: 'iPhone 14',
    baseValue: 36000,
    chip: 'A15 Bionic · Action Mode',
    storageOptions: [
      { size: '128GB', multiplier: 1.0 },
      { size: '256GB', multiplier: 1.15 },
      { size: '512GB', multiplier: 1.32 },
    ],
  },
  'iPhone 15': {
    name: 'iPhone 15',
    baseValue: 46000,
    chip: 'A16 Bionic · Dynamic Island',
    storageOptions: [
      { size: '128GB', multiplier: 1.0 },
      { size: '256GB', multiplier: 1.14 },
      { size: '512GB', multiplier: 1.3 },
    ],
  },
};

const CONDITIONS = [
  { id: 'flawless', label: 'Flawless', mult: 1.0, desc: 'Zero scratches, 85%+ battery, everything works like new' },
  { id: 'good', label: 'Good', mult: 0.88, desc: 'Minor hairline marks on frame, flawless display & cameras' },
  { id: 'fair', label: 'Fair', mult: 0.74, desc: 'Visible body wear/scratches, fully functional hardware' },
];

const UPGRADE_TARGETS = [
  { name: 'iPhone 14 Pro Max', price: 68999, tag: 'Most Popular' },
  { name: 'iPhone 15 Pro', price: 79999, tag: 'Titanium Flagship' },
  { name: 'iPhone 13', price: 34999, tag: 'Best Value' },
];

export function TradeInCalculator() {
  const [selectedModel, setSelectedModel] = useState<string>('iPhone 12');
  const [selectedStorage, setSelectedStorage] = useState<string>('128GB');
  const [selectedCondition, setSelectedCondition] = useState<string>('flawless');
  const [targetPhone, setTargetPhone] = useState<number>(0);

  const modelData = MODELS[selectedModel];

  // Recalculate exchange value
  const estimatedValue = useMemo(() => {
    if (!modelData) return 0;
    const storageObj = modelData.storageOptions.find((s) => s.size === selectedStorage) || modelData.storageOptions[0];
    const conditionObj = CONDITIONS.find((c) => c.id === selectedCondition) || CONDITIONS[0];
    const val = Math.round(modelData.baseValue * storageObj.multiplier * conditionObj.mult);
    return Math.round(val / 100) * 100; // round to nearest 100
  }, [modelData, selectedStorage, selectedCondition]);

  const target = UPGRADE_TARGETS[targetPhone];
  const netUpgradePrice = Math.max(0, target.price - estimatedValue);

  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white via-surface-sunk/40 to-white py-12 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-soft px-3.5 py-1 text-[11.5px] font-semibold text-accent">
            <RefreshCw className="h-3.5 w-3.5" /> Instant Apple Trade-In Value
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl md:text-4xl">
            Upgrade your old phone. <span className="text-accent">Save up to ₹46,000.</span>
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted sm:text-[15px]">
            Exchange any pre-owned iPhone for instant discount on certified pre-owned Apple devices. Free doorstep pickup & diagnostic evaluation across India.
          </p>
        </div>

        {/* Main Interactive Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Left Column: Interactive Selector */}
          <div className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-white font-bold text-[13px]">
                  1
                </span>
                <span className="text-[14px] font-bold text-ink">Select your current device</span>
              </div>
              <span className="text-[11.5px] text-ink-faint">Instant UPI / Voucher Credit</span>
            </div>

            {/* Model Pills */}
            <div className="mt-5">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint">Model</label>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {Object.keys(MODELS).map((m) => {
                  const active = selectedModel === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m);
                        const firstStorage = MODELS[m].storageOptions[0].size;
                        if (!MODELS[m].storageOptions.some((s) => s.size === selectedStorage)) {
                          setSelectedStorage(firstStorage);
                        }
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-2xl border py-2.5 px-2 text-center transition-all',
                        active
                          ? 'border-ink bg-ink text-white shadow-sm'
                          : 'border-line bg-surface-sunk/50 text-ink hover:border-ink/30 hover:bg-white'
                      )}
                    >
                      <Smartphone className={cn('h-4 w-4 mb-1', active ? 'text-white' : 'text-ink-muted')} />
                      <span className="text-[12px] font-bold leading-tight">{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Storage Options */}
            <div className="mt-5">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint">Storage Capacity</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {modelData.storageOptions.map((s) => {
                  const active = selectedStorage === s.size;
                  return (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => setSelectedStorage(s.size)}
                      className={cn(
                        'rounded-xl border px-4 py-2 text-[12.5px] font-bold transition-all',
                        active
                          ? 'border-accent bg-accent text-white shadow-sm'
                          : 'border-line bg-white text-ink hover:border-ink/30'
                      )}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Condition Options */}
            <div className="mt-5">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint">Physical Condition</label>
              <div className="mt-2 space-y-2">
                {CONDITIONS.map((c) => {
                  const active = selectedCondition === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCondition(c.id)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all',
                        active
                          ? 'border-ink bg-ink/5 shadow-soft'
                          : 'border-line bg-surface-sunk/30 hover:border-ink/20 hover:bg-white'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all',
                          active ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white'
                        )}
                      >
                        {active && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-ink">{c.label}</span>
                          {c.id === 'flawless' && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Highest Payout
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-ink-muted leading-tight">{c.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Guarantees */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
              <div className="flex flex-col items-center">
                <Truck className="h-4 w-4 text-accent" />
                <span className="mt-1 text-[11px] font-semibold text-ink">Free Doorstep Pickup</span>
              </div>
              <div className="flex flex-col items-center">
                <Zap className="h-4 w-4 text-accent" />
                <span className="mt-1 text-[11px] font-semibold text-ink">Instant UPI Transfer</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span className="mt-1 text-[11px] font-semibold text-ink">Zero Data Leak Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Calculation Card */}
          <div className="rounded-3xl border border-line bg-gradient-to-b from-white to-surface-sunk p-5 shadow-soft sm:p-7 lg:col-span-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white font-bold text-[13px]">
                  2
                </span>
                <span className="text-[14px] font-bold text-ink">Your Instant Trade-In Value</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Quote
              </span>
            </div>

            {/* Calculated Credit Card */}
            <div className="mt-5 rounded-2xl bg-ink p-5 text-white shadow-soft">
              <div className="flex items-center justify-between text-white/70 text-[11.5px]">
                <span>Exchange Value for:</span>
                <span className="font-semibold text-white">{selectedModel} · {selectedStorage}</span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[34px] font-extrabold tracking-tight sm:text-[40px]">
                  ₹{estimatedValue.toLocaleString('en-IN')}
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  Instant Discount
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-white/60">
                *Estimated based on current market value. Final amount credited upon doorstep inspection or applied directly as checkout voucher.
              </p>
            </div>

            {/* Upgrade Simulator */}
            <div className="mt-5 rounded-2xl border border-line bg-white p-4">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint">
                Upgrade Towards:
              </span>

              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {UPGRADE_TARGETS.map((t, idx) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTargetPhone(idx)}
                    className={cn(
                      'rounded-xl border p-2 text-left transition-all',
                      targetPhone === idx
                        ? 'border-ink bg-surface-sunk shadow-sm'
                        : 'border-line hover:border-ink/20'
                    )}
                  >
                    <div className="text-[11px] font-bold truncate text-ink">{t.name}</div>
                    <div className="text-[10px] text-ink-muted">₹{t.price.toLocaleString('en-IN')}</div>
                  </button>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-[12px]">
                <div className="flex justify-between text-ink-muted">
                  <span>Pre-Owned {target.name}:</span>
                  <span className="font-semibold text-ink">₹{target.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Your Trade-in Credit:</span>
                  <span>- ₹{estimatedValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-[13px] font-bold text-ink">
                  <span>Net Payable Amount:</span>
                  <span className="text-accent text-[15px]">₹{netUpgradePrice.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-5 space-y-2">
              <Link
                href="/products?cat=iphone"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-[13.5px] font-bold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-[.98]"
              >
                Apply Trade-In & Browse iPhones <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-center text-[10.5px] text-ink-faint">
                Open Box Delivery · 3-Day Free Replacement · 1-Month Hardware Warranty
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
