import type { Metadata } from 'next';
import { ShieldCheck, Truck, RotateCcw, BadgeIndianRupee } from 'lucide-react';

export const metadata: Metadata = { title: 'About iVanta — Premium Apple Products, Delivered' };

const PILLARS = [
  { icon: ShieldCheck, title: 'Genuine, always', body: 'Every iPhone, Mac, iPad, Watch and AirPod we ship is a sealed-box, India-warranty unit sourced through authorised distribution. No grey market, no refurbishment passed off as new.' },
  { icon: BadgeIndianRupee, title: 'Fair, transparent pricing', body: 'Prices are recalculated by our servers on every order — the price you see at checkout is the price you pay. Coupons and discounts apply automatically, with every rupee itemised.' },
  { icon: Truck, title: 'Delivery across India', body: 'From metros to tier-3 towns, our serviceability engine checks your PIN code before you pay, shows real ETAs and tracks every shipment event until it reaches your door.' },
  { icon: RotateCcw, title: 'Returns without drama', body: 'Changed your mind or received a defective unit? Request a return from your order page within the return window. Refunds are issued to your original payment method.' },
];

export default function AboutPage() {
  return (
    <div className="bg-surface-sunk/40">
      <section className="mx-auto max-w-[1240px] px-4 py-16 text-center lg:py-24">
        <p className="text-[13px] font-bold uppercase tracking-widest text-accent">About iVanta</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-[32px] font-bold leading-tight tracking-tight text-ink md:text-[44px]">
          The most trustworthy way to buy Apple products in India.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          iVanta is a specialist Apple retail platform. We sell iPhones, Macs, MacBooks, iPads,
          Apple Watches, AirPods and genuine accessories — with server-verified pricing, live stock,
          insured delivery and a return process that actually refunds you.
        </p>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-3xl border border-line bg-white p-7 shadow-soft">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent"><p.icon className="h-5 w-5" /></span>
              <h2 className="mt-4 text-[17px] font-bold text-ink">{p.title}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-20">
        <div className="rounded-3xl border border-line bg-ink p-10 text-white lg:p-14">
          <h2 className="text-[24px] font-bold tracking-tight lg:text-[30px]">How we work</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              { n: '01', t: 'Curated catalog', d: 'Our product team lists only current-generation Apple hardware with complete variant matrices — storage, colour, connectivity — and full specifications, maintained in our own database.' },
              { n: '02', t: 'Engineered checkout', d: 'Stock is reserved the moment you check out, prices are computed server-side, payments are verified with signed proofs, and every order state transition is recorded in an immutable history.' },
              { n: '03', t: 'Accountable after-sales', d: 'Shipments are tracked event-by-event, returns follow a published status flow, refunds are issued provider-confirmed, and every action on your order is audit-logged.' },
            ].map((s) => (
              <div key={s.n}>
                <span className="text-[13px] font-bold text-white/50">{s.n}</span>
                <h3 className="mt-2 text-[16px] font-bold">{s.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
