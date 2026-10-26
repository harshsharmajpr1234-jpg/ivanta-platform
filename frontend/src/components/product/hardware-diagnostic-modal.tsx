'use client';

import { useState } from 'react';
import {
  ShieldCheck, BatteryCharging, CheckCircle2,
  Sparkles, X, Smartphone, Camera, Volume2, Cpu,
  Fingerprint, Droplets, LockOpen, PackageCheck, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HardwareDiagnosticModalProps {
  productTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const QC_TESTS = [
  { id: 'battery', name: 'Battery Health & Cycle', icon: BatteryCharging, result: '88% Peak Capacity', detail: 'Original Apple Battery, 0 Unknown Part warnings' },
  { id: 'display', name: 'True Tone & OLED Panel', icon: Smartphone, result: 'Original OEM Glass', detail: 'True Tone calibrated, 0 dead pixels, 0 burn-in' },
  { id: 'biometrics', name: 'Face ID / Touch ID', icon: Fingerprint, result: 'Biometrics Passed', detail: 'TrueDepth sensor mapped and instantaneous' },
  { id: 'camera', name: 'Sensor-Shift OIS & Optics', icon: Camera, result: 'Studio Grade Optics', detail: 'Triple lenses, 4K 60fps video & LiDAR verified' },
  { id: 'audio', name: 'Stereo Audio & Mic Array', icon: Volume2, result: 'Crystal Clear Audio', detail: 'Dual noise cancellation microphones tested' },
  { id: 'liquid', name: 'Liquid Contact Check (LCI)', icon: Droplets, result: 'Zero Liquid Damage', detail: 'All moisture indicators 100% white and intact' },
  { id: 'network', name: 'Cellular, 5G & Dual SIM', icon: Cpu, result: 'All Bands Unlocked', detail: 'Airtel, Jio 5G, Vodafone & eSIM ready' },
  { id: 'cloud', name: 'IMEI & iCloud Status', icon: LockOpen, result: 'Clean & Unlocked', detail: 'Zero finance lock, clean GSMA IMEI report' },
];

export function HardwareDiagnosticModal({ productTitle, isOpen, onClose }: HardwareDiagnosticModalProps) {
  const [isRunningScan, setIsRunningScan] = useState(false);
  const [scannedCount, setScannedCount] = useState(QC_TESTS.length);

  if (!isOpen) return null;

  const handleRunScan = () => {
    setIsRunningScan(true);
    setScannedCount(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setScannedCount(current);
      if (current >= QC_TESTS.length) {
        clearInterval(interval);
        setIsRunningScan(false);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-line bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-surface-sunk/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-ink">32-Point Diagnostic QC Report</h3>
              <p className="text-[11px] text-ink-muted truncate max-w-[260px] sm:max-w-xs">{productTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunk text-ink-muted hover:bg-line hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* iOS Battery Health Simulator Card */}
          <div className="rounded-2xl border border-line bg-gradient-to-br from-slate-900 to-black p-4 text-white shadow-md">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span className="flex items-center gap-1.5 font-semibold">
                <BatteryCharging className="h-4 w-4 text-emerald-400" /> Battery Health & Charging
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Peak Performance Capable
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between border-b border-white/10 pb-3">
              <div>
                <div className="text-[11px] text-white/60">Maximum Capacity</div>
                <div className="text-[26px] font-extrabold tracking-tight text-white mt-0.5">88% – 100%</div>
              </div>
              <div className="text-right text-[11px] text-emerald-400 font-semibold">
                Original Apple Battery
              </div>
            </div>

            <p className="mt-2 text-[10.5px] leading-relaxed text-white/70">
              This device retains high battery capacity, supporting normal peak performance. Zero battery service warnings.
            </p>
          </div>

          {/* Diagnostic QC Checklist */}
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[12.5px] font-bold text-ink">
                Hardware Tests ({scannedCount}/{QC_TESTS.length} Verified)
              </div>
              <button
                type="button"
                disabled={isRunningScan}
                onClick={handleRunScan}
                className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[11px] font-bold text-accent transition-all hover:bg-accent hover:text-white disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-current" />
                {isRunningScan ? 'Scanning...' : 'Re-Run Diagnostic Scan'}
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {QC_TESTS.map((test, idx) => {
                const isPassed = idx < scannedCount;
                const Icon = test.icon;
                return (
                  <div
                    key={test.id}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-2.5 transition-all',
                      isPassed
                        ? 'border-emerald-200/80 bg-emerald-50/40 text-ink'
                        : 'border-line bg-surface-sunk/30 opacity-40'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-line text-ink">
                        <Icon className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold truncate text-ink">{test.name}</div>
                        <div className="text-[10px] text-ink-muted truncate">{test.detail}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isPassed ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {test.result}
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-ink-faint">Testing...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Open Box Guarantee Notice */}
          <div className="rounded-2xl border border-line bg-surface-sunk p-3.5 flex items-center gap-3">
            <PackageCheck className="h-5 w-5 text-accent shrink-0" />
            <p className="text-[11px] text-ink-muted leading-tight">
              <strong>Open Box Delivery Policy:</strong> You can physically power on and inspect these exact diagnostic checks in front of the delivery partner before accepting.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-line p-4 bg-surface-sunk/50 flex items-center justify-between">
          <span className="text-[11px] text-ink-faint font-semibold">1-Month Hardware Warranty Included</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-ink px-5 py-2 text-[12.5px] font-bold text-white shadow-soft transition-transform hover:scale-[1.02]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
