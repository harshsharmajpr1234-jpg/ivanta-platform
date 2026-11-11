import Link from 'next/link';
import { BRAND } from '@/constants';
import { ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';

const COLS = [
  {
    title: 'Flagship iPhones',
    links: [
      { label: 'iPhone 16 Series', href: '/products?q=iPhone+16' },
      { label: 'iPhone 15 Pro & Pro Max', href: '/products?q=iPhone+15+Pro' },
      { label: 'iPhone 14 Series', href: '/products?q=iPhone+14' },
      { label: 'iPhone 13 Series', href: '/products?q=iPhone+13' },
      { label: 'All Pre-Owned iPhones', href: '/products?cat=iphone' },
    ],
  },
  {
    title: 'Apple Ecosystem',
    links: [
      { label: 'Apple Watch Series & Ultra', href: '/products?cat=watch' },
      { label: 'MacBook Air & Pro', href: '/products?cat=mac' },
      { label: 'iPad & iPad Pro', href: '/products?cat=ipad' },
      { label: 'AirPods & Accessories', href: '/products?cat=airpods' },
    ],
  },
  {
    title: 'Why Flyphones',
    links: [
      { label: 'Component-Level Renewal', href: '/condition-guide' },
      { label: '32-Point Quality Checklist', href: '/condition-guide#checklist' },
      { label: '1-Year Limited Warranty', href: '/warranty-policy' },
      { label: 'Open-Box Delivery Verification', href: '/shipping-policy' },
      { label: 'About Us & Hansh Tech', href: '/about' },
    ],
  },
  {
    title: 'Support & Policies',
    links: [
      { label: 'Track Your Shipment', href: '/support#tracking' },
      { label: 'Refund & Returns Policy', href: '/refund-policy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Customer Help Desk', href: '/support' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line/70 bg-[#ffffff] text-[#111111]">
      {/* Top Value Assurance Ribbon (ControlZ style) */}
      <div className="border-b border-line/60 bg-surface-sunk/60">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 divide-y divide-line/60 sm:grid-cols-4 sm:divide-y-0 sm:divide-x sm:divide-line/60">
          <div className="flex items-center gap-3 p-4 sm:p-5">
            <Award className="h-5 w-5 text-accent shrink-0" />
            <div>
              <p className="text-[12.5px] font-bold text-ink">Certified Renewed</p>
              <p className="text-[11px] text-ink-muted">Factory grade inspection</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 sm:p-5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[12.5px] font-bold text-ink">Up to 1-Year Warranty</p>
              <p className="text-[11px] text-ink-muted">Pan-India doorstep support</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 sm:p-5">
            <Truck className="h-5 w-5 text-purple-600 shrink-0" />
            <div>
              <p className="text-[12.5px] font-bold text-ink">Open Box Delivery</p>
              <p className="text-[11px] text-ink-muted">Inspect before acceptance</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 sm:p-5">
            <RotateCcw className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-[12.5px] font-bold text-ink">Hassle-Free Returns</p>
              <p className="text-[11px] text-ink-muted">Instant return & replace</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 md:gap-10">
          
          {/* Brand Info Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Flyphones Home">
              <img
                src="/logo-icon.png"
                alt="Flyphones Mascot"
                className="h-8.5 w-auto object-contain shrink-0"
              />
              <div className="flex flex-col">
                <div className="flex items-baseline leading-none font-black tracking-tight text-[18px]">
                  <span className="text-[#f59e0b]">Fly</span>
                  <span className="text-ink">phones</span>
                  <span className="text-[#f59e0b]">.</span>
                </div>
                <span className="text-[6.5px] font-bold tracking-wider text-ink-muted uppercase leading-none pt-1">
                  Powered by Hansh Technologies
                </span>
              </div>
            </Link>

            <p className="mt-4 text-[12.5px] leading-relaxed text-ink-muted">
              India&apos;s trusted platform for component-renewed Apple flagship smartphones, MacBooks, and wearables. Like new, only smarter.
            </p>

            <div className="mt-5 space-y-1 text-[11.5px] text-ink-muted">
              <p><strong className="text-ink">Office:</strong> {BRAND.address.full}</p>
              <p><strong className="text-ink">Support:</strong> {BRAND.supportPhone}</p>
              <p><strong className="text-ink">Email:</strong> {BRAND.supportEmail}</p>
            </div>
          </div>

          {/* Links Columns */}
          {COLS.map((c) => (
            <div key={c.title}>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-ink">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-ink-muted transition-colors hover:text-ink hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line/70 pt-8 sm:flex-row text-[12px] text-ink-muted">
          <p>© {new Date().getFullYear()} {BRAND.name} (Powered by Hansh Technologies). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-ink">Terms of Use</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy Policy</Link>
            <Link href="/warranty-policy" className="hover:text-ink">Warranty & Repairs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
