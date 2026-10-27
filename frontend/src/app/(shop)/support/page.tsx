'use client';

import Link from 'next/link';
import {
  Headset, Mail, Package, Phone, RotateCcw,
  ShieldCheck, Truck, CheckCircle2, AlertCircle,
  HelpCircle, ChevronRight, FileText, ArrowRight
} from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/constants';

const POLICIES = [
  {
    id: 'warranty',
    icon: ShieldCheck,
    title: '1-Month Hardware Warranty',
    badge: 'Standard on All Devices',
    summary: 'Every pre-owned Apple product purchased from iVanta includes a 1-month comprehensive hardware warranty from the date of delivery.',
    details: [
      'Covered: Internal hardware failure, motherboard defects, logic board, and sudden component failure.',
      'Covered: Touchscreen digitizer failure, camera sensor/OIS failure, and speaker/mic malfunction.',
      'Battery Health: Minimum 85% original Apple battery capacity guaranteed during the warranty period.',
      'Not Covered: Accidental drops, physical smash/cracks, and deep liquid/water submersion damage.',
      'Claim Process: Contact support with your Order ID. We arrange free courier pickup or direct service center inspection.',
    ],
  },
  {
    id: 'open-box',
    icon: Truck,
    title: 'Open Box Delivery Policy',
    badge: '100% Risk-Free Doorstep Inspection',
    summary: 'Inspect physical condition at your doorstep in front of the delivery partner before acceptance or payment.',
    details: [
      'The delivery executive will open the outer sealed box in front of you.',
      'You are permitted to physically inspect the phone/laptop/watch for any scratches, dents, or cosmetic defects.',
      'Power on the device to verify the display turns on cleanly.',
      'If you notice any physical damage not matching the listed condition grade, you can reject the parcel on the spot with zero cancellation fee.',
      'Prepaid orders rejected during Open Box delivery are refunded 100% within 24-48 hours.',
    ],
  },
  {
    id: 'replacement',
    icon: RotateCcw,
    title: '3-Day Free Replacement Window',
    badge: 'Hassle-Free Exchange',
    summary: 'Test your device thoroughly for 3 full days in real-world everyday usage.',
    details: [
      '3 full days (72 hours) starting from the exact delivery timestamp.',
      'If you notice any hardware issue (Face ID, True Tone, Wi-Fi, audio, battery drain), request a replacement directly from your Account → Orders page.',
      'Our team schedules a free doorstep reverse pickup within 24 hours.',
      'Once verified, a replacement device of identical model & grade is dispatched immediately, or 100% refund is initiated.',
    ],
  },
  {
    id: 'qc-certification',
    icon: CheckCircle2,
    title: '32-Point Quality Inspection',
    badge: 'Apple Specialist Certified',
    summary: 'How every pre-owned Apple device is graded, tested, and certified before dispatch.',
    details: [
      'Original Displays: Polarized light testing confirms OEM Retina glass with factory True Tone calibration intact.',
      'Original Battery: Minimum 85% battery floor verified via Apple system profiler with zero generic warning popups.',
      'Optics & Biometrics: 4K 60fps video, LiDAR, Sensor-Shift OIS, and TrueDepth Face ID authentication verified.',
      'Motherboard Integrity: Liquid Contact Indicators (LCI) 100% white — zero liquid contact tolerance.',
      'IMEI & Cloud: Clean GSMA database check, zero financing balance, zero iCloud lock, factory unlocked.',
    ],
  },
];

const FAQS = [
  { id: 'f1', title: 'How do I claim my 1-Month Hardware Warranty?', content: 'Simply email support@ivanta.in or call our helpline with your 6-digit Order ID. Our technical team will review the issue and schedule a free courier pickup for testing and repair or replacement.' },
  { id: 'f2', title: 'How does Open Box Delivery work?', content: 'When the courier arrives, they will unbox the package in your presence. You can inspect the device cosmetics and power it on. Only accept and share the delivery OTP once you are completely satisfied with the device condition.' },
  { id: 'f3', title: 'What is the return/replacement window?', content: 'You have a 3-day testing window from delivery. If you encounter any technical defect, open your Account → Orders page and click "Request Replacement". Return pickup is 100% free.' },
  { id: 'f4', title: 'Are all devices original Apple hardware?', content: 'Yes, 100%. We never use cheap aftermarket screens, duplicate batteries, or modified motherboards. Every unit undergoes a rigorous 32-point inspection by Apple-certified technicians.' },
  { id: 'f5', title: 'What payment methods can I use?', content: 'We accept UPI (Google Pay, PhonePe, Paytm), Net Banking, Debit/Credit Cards with No-Cost EMI options, and Cash on Delivery (COD) across serviceable pin codes.' },
  { id: 'f6', title: 'How do I track my order?', content: 'Open Account → My Orders to see a live status timeline from dispatch to delivery with the courier tracking ID.' },
];

export default function SupportPage() {
  return (
    <div className="bg-surface py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center sm:text-left">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Headset className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-[28px] font-extrabold tracking-tight text-ink sm:text-[36px]">
            iVanta Care & Support Hub
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted sm:text-[15px]">
            Comprehensive information on our 1-Month Hardware Warranty, Doorstep Open Box Delivery, 3-Day Replacement Window, and 32-Point Quality Certification.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="border border-line shadow-xs">
            <CardHeader title="Customer Care & Claims" />
            <CardContent className="space-y-3 text-[13.5px] text-ink-soft">
              <a href={`mailto:${BRAND.supportEmail}`} className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
                <Mail className="h-4 w-4 text-accent" /> {BRAND.supportEmail}
              </a>
              <a href={`tel:${BRAND.supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
                <Phone className="h-4 w-4 text-accent" /> {BRAND.supportPhone}
              </a>
              <p className="text-[12px] text-ink-muted">Mon–Sat, 10:00–19:00 IST · Instant WhatsApp & Call Support</p>
            </CardContent>
          </Card>
          <Card className="border border-line shadow-xs">
            <CardHeader title="Self-Serve Orders & Claims" />
            <CardContent className="space-y-2 text-[13.5px]">
              <Link href="/orders" className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
                <Package className="h-4 w-4 text-accent" /> Track active order or courier status
              </Link>
              <Link href="/account/returns" className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
                <RotateCcw className="h-4 w-4 text-accent" /> File a 3-day replacement or return
              </Link>
              <div className="pt-1">
                <Button size="sm" variant="secondary" onClick={() => window.location.assign('/orders')}>
                  Manage My Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================= */}
        {/* DETAILED WARRANTY & POLICY CARDS (MOVED FROM HERO)         */}
        {/* ========================================================= */}
        <div className="mt-12 space-y-6">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Warranty & Delivery Coverage Details
            </h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              Complete transparency on how we protect every pre-owned Apple purchase.
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

        {/* Footer Policies */}
        <div className="mt-10 border-t border-line pt-6 text-[12px] text-ink-muted">
          Also see our legal disclosures:{' '}
          <Link href="/shipping-policy" className="font-semibold text-accent hover:underline">Shipping Policy</Link> ·{' '}
          <Link href="/refund-policy" className="font-semibold text-accent hover:underline">Refund & Replacement Policy</Link> ·{' '}
          <Link href="/terms" className="font-semibold text-accent hover:underline">Terms of Service</Link> ·{' '}
          <Link href="/privacy" className="font-semibold text-accent hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
