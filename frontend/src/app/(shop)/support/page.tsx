'use client';
import Link from 'next/link';
import { Headset, Mail, Package, Phone, RotateCcw } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/constants';

const FAQS = [
  { id: 'f1', title: 'How do I track my order?', content: 'Open Account → My orders (or the Orders link in the header) and select your order. You will see a live timeline — confirmed, packed, shipped, out for delivery, delivered — with timestamps for every shipment event.' },
  { id: 'f2', title: 'Are the products genuine and covered by warranty?', content: 'Yes. iVanta sells only sealed-box units sourced through authorised distribution channels, each covered by Apple India warranty from the date of activation.' },
  { id: 'f3', title: 'What payment methods can I use?', content: 'UPI, credit/debit cards, netbanking and wallets through our payment partner, plus Cash on Delivery where available. All online payments are verified server-side before your order is confirmed.' },
  { id: 'f4', title: 'Is delivery free?', content: 'Standard delivery is free on orders above ₹999. Express and same-day options (where serviceable) carry a published fee shown at checkout before you pay.' },
  { id: 'f5', title: 'How do returns and refunds work?', content: 'Request a return from your order detail page within the return window. Once the item is picked up, received and inspected, the refund is issued to your original payment method — or via bank transfer for COD orders. Track every step under Account → Returns & refunds.' },
  { id: 'f6', title: 'My PIN code is not serviceable. What now?', content: 'Serviceability depends on courier coverage, which keeps expanding. You can still browse and wishlist products; the checkout will show available options as soon as your PIN code is covered.' },
  { id: 'f7', title: 'Can I cancel my order?', content: 'Yes — orders can be cancelled from the order detail page until they ship. Prepaid orders are refunded in full to the original payment method after cancellation.' },
  { id: 'f8', title: 'How do coupons work?', content: 'Apply a coupon code at checkout — the discount is validated and computed on our servers against your actual cart (minimum order value, per-user limits and product/category restrictions all apply). Invalid codes never charge you.' },
];

export default function SupportPage() {
  return (
    <div className="container-x max-w-3xl py-8 lg:py-12">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"><Headset className="h-6 w-6" /></span>
      <h1 className="mt-4 text-[28px] font-bold tracking-tight text-ink sm:text-[34px]">Help & support</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
        Answers to the questions we hear most. For anything about a specific order — cancellation,
        return or refund — start from your <Link href="/orders" className="font-semibold text-accent hover:underline">order page</Link>;
        every action there is tracked and audited.
      </p>

      <div className="mt-8">
        <Accordion items={FAQS} defaultOpen={0} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Talk to us" />
          <CardContent className="space-y-3 text-[13.5px] text-ink-soft">
            <a href={`mailto:${BRAND.supportEmail}`} className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
              <Mail className="h-4 w-4 text-accent" /> {BRAND.supportEmail}
            </a>
            <a href={`tel:${BRAND.supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
              <Phone className="h-4 w-4 text-accent" /> {BRAND.supportPhone}
            </a>
            <p className="text-[12px] text-ink-muted">Mon–Sat, 10:00–19:00 IST</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Self-serve" />
          <CardContent className="space-y-2 text-[13.5px]">
            <Link href="/orders" className="flex items-center gap-2.5 font-medium text-ink hover:text-accent"><Package className="h-4 w-4 text-accent" /> Track or cancel an order</Link>
            <Link href="/account/returns" className="flex items-center gap-2.5 font-medium text-ink hover:text-accent"><RotateCcw className="h-4 w-4 text-accent" /> Returns & refund status</Link>
            <div className="pt-1"><Button size="sm" variant="secondary" onClick={() => window.location.assign('/orders')}>Go to my orders</Button></div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-[12px] text-ink-muted">
        Also see: <Link href="/shipping-policy" className="font-semibold hover:underline">Shipping policy</Link> ·{' '}
        <Link href="/refund-policy" className="font-semibold hover:underline">Refund policy</Link> ·{' '}
        <Link href="/terms" className="font-semibold hover:underline">Terms</Link> ·{' '}
        <Link href="/privacy" className="font-semibold hover:underline">Privacy</Link>
      </p>
    </div>
  );
}
