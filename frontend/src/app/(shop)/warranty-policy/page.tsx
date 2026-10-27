import Link from 'next/link';
import { ShieldCheck, Clock, Camera, FileCheck, AlertTriangle, PackageX, Headset, Phone, MessageCircle } from 'lucide-react';
import { BRAND, WARRANTY_POLICY } from '@/constants';

export const metadata = {
  title: 'Warranty & Return Policy — Flyphones',
  description: 'Official 6-month limited warranty on refurbished smartphones, 3-month accessories warranty, 24-hour damage reporting, and return guidelines for Flyphones.',
};

export default function WarrantyPolicyPage() {
  return (
    <div className="bg-surface py-8 sm:py-14">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="border-b border-line pb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunk px-3.5 py-1 text-[11px] font-semibold text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Official Policy · {BRAND.name} (Powered by {BRAND.parentCompany})
          </span>
          <h1 className="mt-3.5 text-[28px] font-extrabold tracking-tight text-ink sm:text-[38px]">
            Warranty & Return Policy
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted sm:text-[15px]">
            This official warranty and return policy governs all refurbished smartphones, consoles, and related accessories sold by {BRAND.name}.
          </p>
        </div>

        {/* Quick Highlights Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-ink">6 Months Device Warranty</h3>
                <p className="text-[12px] text-ink-muted">Refurbished smartphones & consoles from invoice date</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-ink">3 Months Accessories Warranty</h3>
                <p className="text-[12px] text-ink-muted">Adaptor, charging cable, and battery covered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="mt-10 space-y-8">
          {/* 1. Warranty Periods */}
          <section className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-soft">
            <h2 className="text-[18px] font-extrabold text-ink sm:text-[20px]">
              1. Limited Warranty Coverage
            </h2>
            <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-ink-soft">
              <p>
                <strong>Refurbished Smartphones & Consoles:</strong> The limited warranty period is <strong>six (06) months</strong>, commencing from the official invoice date.
              </p>
              <p>
                <strong>Accessories Coverage:</strong> Accessories provided with the product (including Adaptor, Data/Charging/Power Cord & Battery) hold a <strong>three (03) months</strong> warranty from the invoice date.
              </p>
              <p>
                <strong>Warranty Resolution:</strong> During the active warranty period, {BRAND.name} may repair or replace the device at its discretion. Any replaced device or component carries the residual warranty period of the original purchase.
              </p>
            </div>
          </section>

          {/* 2. Validation & Mandatory Claims Procedures */}
          <section className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-soft">
            <h2 className="text-[18px] font-extrabold text-ink sm:text-[20px]">
              2. Validation & Claims Requirements
            </h2>
            <div className="mt-4 space-y-4 text-[13.5px] leading-relaxed text-ink-soft">
              <div className="flex items-start gap-3">
                <FileCheck className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                <div>
                  <strong>IMEI / Serial Number Validation:</strong> Consumers must provide the valid device IMEI or serial number matching the invoice to establish warranty entitlement.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Camera className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                <div>
                  <strong>Mandatory Device Imaging:</strong> Before packing the device for return pickup, consumers must share clear front, side, and back images of the device. Consumers may also be required to demonstrate the reported issue via video recording.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                <div>
                  <strong>24-Hour Damage Reporting & Unboxing Video:</strong> For devices with physical damage or condition-related discrepancies, the customer must report the issue within <strong>24 hours of delivery</strong> accompanied by an un-cut unboxing video of the purchased package.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Internal Seal Integrity:</strong> The warranty seal inside the device must remain intact. If found tampered with, removed, or broken at the time of receiving the returned unit, no resolution or warranty service will be provided.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <PackageX className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                <div>
                  <strong>Return Packaging & Inspection:</strong> Proper protective packaging is strictly required to prevent transit damage during reverse shipping. {BRAND.name} reserves the right to deduct or recover costs for improper packaging resulting in physical transit damage.
                </div>
              </div>

              <div>
                <strong>Return Reason Verification:</strong> The reason specified for raising a return must match the verified issue or device grade mismatch; otherwise, the return request will be cancelled.
              </div>

              <div>
                <strong>Subcontracting of Services:</strong> {BRAND.name} may subcontract warranty and diagnostic repair services to certified third-party technical partners without prior notice to the customer.
              </div>
            </div>
          </section>

          {/* 3. Exclusions */}
          <section className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-soft">
            <h2 className="text-[18px] font-extrabold text-ink sm:text-[20px] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              3. Warranty Exclusions
            </h2>
            <p className="mt-2 text-[13px] text-ink-muted">
              The {BRAND.name} warranty strictly does not apply under any of the following circumstances:
            </p>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-ink-soft">
              {WARRANTY_POLICY.exclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Support Contact Card */}
          <section className="rounded-3xl border border-line bg-ink p-6 sm:p-8 text-white">
            <h3 className="text-[18px] font-bold">Have a Warranty Claim or Question?</h3>
            <p className="mt-1.5 text-[13px] text-white/70">
              Our support team is ready to assist you during business hours.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <a
                href={`tel:${BRAND.supportPhoneRaw}`}
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <Phone className="h-5 w-5 text-accent" />
                <div>
                  <span className="text-[11.5px] uppercase tracking-wider text-white/50">Calling Support</span>
                  <p className="text-[14px] font-bold text-white">{BRAND.supportPhone}</p>
                </div>
              </a>

              <a
                href={`https://wa.me/${BRAND.supportPhoneRaw}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                <div>
                  <span className="text-[11.5px] uppercase tracking-wider text-white/50">WhatsApp Support</span>
                  <p className="text-[14px] font-bold text-white">{BRAND.supportPhone}</p>
                </div>
              </a>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4 text-[12px] text-white/60">
              <p>Working Hours: {BRAND.supportHours}</p>
              <p className="mt-0.5">Email Support: <span className="text-white underline">{BRAND.supportEmail}</span></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
