'use client';

import Link from 'next/link';
import {
  Headset, Mail, Package, Phone, RotateCcw,
  ShieldCheck, Truck, CheckCircle2, AlertCircle,
  HelpCircle, ChevronRight, FileText, ArrowRight, MessageCircle, Sparkles
} from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BRAND, WARRANTY_POLICY } from '@/constants';

const POLICIES = [
  {
    id: 'warranty',
    icon: ShieldCheck,
    title: '6-Month Device Limited Warranty',
    badge: 'Standard on Refurbished Devices',
    summary: `Every refurbished smartphone and console purchased from ${BRAND.name} includes a 6-month limited warranty from invoice date.`,
    details: [
      'Refurbished Smartphones & Consoles: Six (06) months warranty commencing from the invoice date.',
      'Accessories Warranty: Three (03) months warranty on charging cord, power adaptor, and battery from invoice date.',
      'IMEI Validation: Valid device IMEI or serial number matching invoice required to establish warranty validity.',
      'Internal Seal Integrity: Internal security seal must remain intact. Tampered seal invalidates warranty coverage.',
      'Resolution: Repair or replacement with residual warranty coverage at company discretion.',
    ],
  },
  {
    id: 'open-box',
    icon: Truck,
    title: '24-Hour Damage Reporting & Open Box Inspection',
    badge: 'Mandatory Unboxing Video',
    summary: 'Inspect device condition at doorstep and report any physical discrepancies within 24 hours.',
    details: [
      'Report Window: Any physical condition or damage issues must be reported within 24 hours of delivery.',
      'Unboxing Video: Customer must record a continuous unboxing video of the parcel to support transit damage claims.',
      'Doorstep Check: Inspect device physical appearance before accepting the parcel from the courier partner.',
      'Packaging: Returning devices must be packed properly to prevent physical damage during reverse pickup.',
    ],
  },
  {
    id: 'replacement',
    icon: RotateCcw,
    title: 'Return & Replacement Verification',
    badge: 'Fair & Verified Returns',
    summary: 'Clear protocol for handling return pickups, grade mismatch claims, and technical issues.',
    details: [
      'Reason Verification: Return reason must match the reported technical defect or verified grade mismatch.',
      'Pre-Pickup Imaging: Customers must share clear front, side, and back photos of the device before pickup.',
      'Demonstration: May be requested to demonstrate software or hardware issues through short video recording.',
      'Fast Processing: Return requests can be tracked live in your Account → Orders portal.',
    ],
  },
  {
    id: 'qc-certification',
    icon: CheckCircle2,
    title: '3-Tier Condition Grading Standards',
    badge: 'A, B & C Grades',
    summary: 'Every device is functionally tested and graded transparently (Superb, Good, Fair).',
    details: [
      'Grade A (Superb): 100% functional, perfect display, minimal scratches barely visible on glass, few hairline body marks.',
      'Grade B (Good): 100% functional, minor pixel dot with no visibility issue, 4–5 scratches on glass, minor dents/scratches on body.',
      'Grade C (Fair): 100% functional, minor pixel dots/shade with no visibility issue, 7–8 glass scratches, 5–8 minor dents/scratches.',
      '100% Functional Guarantee: Zero functional defects across all grades — camera, mic, Face ID, Wi-Fi all tested.',
    ],
  },
];

const FAQS = [
  { id: 'f1', title: 'What warranty is included with refurbished smartphones?', content: 'Refurbished smartphones and consoles include a 6-month limited warranty commencing from the invoice date. Accessories provided in the box (charging cable, adapter, and battery) carry a 3-month warranty.' },
  { id: 'f2', title: 'What is required to report physical damage or condition issues?', content: 'Physical damage or condition discrepancies must be reported within 24 hours of delivery, accompanied by an uncut unboxing video of the parcel. Customers must also provide the IMEI/serial number and front/side/back images.' },
  { id: 'f3', title: 'What are the grading differences between Grade A, B, and C?', content: 'All grades are 100% functional with zero technical defects. Grade A is superb condition with minimal visible scratches. Grade B has minor 4-5 scratches and minor dents. Grade C offers highest value with noticeable cosmetic wear (7-8 scratches, minor dents).' },
  { id: 'f4', title: 'What is the internal seal integrity requirement?', content: 'The security seal inside the device must remain completely intact. If the seal is found tampered with or removed upon receiving the device, warranty resolution cannot be provided.' },
  { id: 'f5', title: 'What are the warranty exclusions?', content: 'The warranty does not cover: physical drops or cracked screens, liquid/water damage, accidental or intentional damage, normal cosmetic wear and tear, and issues due to software rooting/jailbreaking or unauthorized repairs.' },
  { id: 'f6', title: 'How do I contact customer support?', content: `You can reach us by phone at ${BRAND.supportPhone} or WhatsApp at ${BRAND.supportPhoneRaw} Monday to Saturday, 10:00 AM to 07:00 PM IST.` },
];

export default function SupportPage() {
  return (
    <div className="bg-surface py-8 sm:py-14">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunk px-3.5 py-1 text-[11px] font-semibold text-ink">
            <Headset className="h-3.5 w-3.5 text-accent" />
            Customer Care & Policies · {BRAND.name} (Powered by {BRAND.parentCompany})
          </span>
          <h1 className="mt-3.5 text-[28px] font-extrabold tracking-tight text-ink sm:text-[38px]">
            {BRAND.name} Care & Support Hub
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted sm:text-[15.5px]">
            Comprehensive information on our 6-Month Refurbished Device Warranty, 3-Month Accessories Warranty, 24-Hour Damage Reporting, and Transparent Grading Standards.
          </p>
        </div>

        {/* Quick Links Banner */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/condition-guide"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-semibold text-ink shadow-xs transition-colors hover:bg-surface-sunk"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Device Condition Guide (Grade A, B, C)
          </Link>
          <Link
            href="/warranty-policy"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-[12.5px] font-semibold text-ink shadow-xs transition-colors hover:bg-surface-sunk"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Full Warranty & Return Policy
          </Link>
        </div>

        {/* Quick Contact Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="border border-line shadow-xs">
            <CardHeader title="Customer Care & Helpline" />
            <CardContent className="space-y-3 text-[13.5px] text-ink-soft">
              <a href={`tel:${BRAND.supportPhoneRaw}`} className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
                <Phone className="h-4 w-4 text-accent" /> Calling Support: {BRAND.supportPhone}
              </a>
              <a
                href={`https://wa.me/${BRAND.supportPhoneRaw}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 font-medium text-ink hover:text-emerald-600"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp Support: {BRAND.supportPhone}
              </a>
              <a href={`mailto:${BRAND.supportEmail}`} className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
                <Mail className="h-4 w-4 text-accent" /> Email: {BRAND.supportEmail}
              </a>
              <p className="text-[12px] text-ink-muted">
                Working Hours: {BRAND.supportHours}
              </p>
              <div className="pt-2 border-t border-line/60">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint">Experience Center & Office</p>
                <p className="mt-0.5 text-[12.5px] text-ink leading-relaxed font-medium">{BRAND.address.full}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-line shadow-xs">
            <CardHeader title="Self-Serve Orders & Claims" />
            <CardContent className="space-y-2 text-[13.5px]">
              <Link href="/orders" className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
                <Package className="h-4 w-4 text-accent" /> Track active order or courier status
              </Link>
              <Link href="/account/returns" className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
                <RotateCcw className="h-4 w-4 text-accent" /> File a warranty claim or return
              </Link>
              <div className="pt-2">
                <Button size="sm" variant="secondary" onClick={() => window.location.assign('/orders')}>
                  Manage My Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Warranty & Policy Cards */}
        <div className="mt-12 space-y-6">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Warranty & Policy Coverage Details
            </h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              Complete transparency on how {BRAND.name} protects every refurbished device purchase.
            </p>
          </div>

          <div className="grid gap-6">
            {POLICIES.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  id={p.id}
                  className="scroll-mt-24 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-[17px] font-bold text-ink sm:text-lg">{p.title}</h3>
                        <p className="text-[12px] text-ink-muted">{p.summary}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                      {p.badge}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2.5 text-[13px] text-ink-soft">
                    {p.details.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-5 rounded-2xl border border-line bg-white p-2 sm:p-4">
            <Accordion items={FAQS} defaultOpen={0} />
          </div>
        </div>

        {/* Footer Disclosures */}
        <div className="mt-10 border-t border-line pt-6 text-[12px] text-ink-muted flex flex-wrap gap-x-4 gap-y-2">
          <span>Official Disclosures:</span>
          <Link href="/condition-guide" className="font-semibold text-accent hover:underline">Condition Guide</Link>
          <Link href="/warranty-policy" className="font-semibold text-accent hover:underline">Warranty Policy</Link>
          <Link href="/shipping-policy" className="font-semibold text-accent hover:underline">Shipping Policy</Link>
          <Link href="/refund-policy" className="font-semibold text-accent hover:underline">Refund Policy</Link>
          <Link href="/terms" className="font-semibold text-accent hover:underline">Terms of Service</Link>
          <Link href="/privacy" className="font-semibold text-accent hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
