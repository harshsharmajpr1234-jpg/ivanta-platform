import Link from 'next/link';
import { BRAND } from '@/constants';

const COLS = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', href: '/products' },
      { label: 'iPhone', href: '/products?cat=iphone' },
      { label: 'Mac & MacBook', href: '/products?cat=mac' },
      { label: 'iPad', href: '/products?cat=ipad' },
      { label: 'Apple Watch', href: '/products?cat=watch' },
      { label: 'AirPods', href: '/products?cat=airpods' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'My orders', href: '/orders' },
      { label: 'Wishlist', href: '/wishlist' },
      { label: 'Addresses', href: '/account/addresses' },
      { label: 'Returns & refunds', href: '/account/returns' },
    ],
  },
  {
    title: 'Standards & Policies',
    links: [
      { label: 'Device Condition Guide', href: '/condition-guide' },
      { label: 'Warranty & Return Policy', href: '/warranty-policy' },
      { label: 'Shipping Policy', href: '/shipping-policy' },
      { label: 'Refund & Returns Policy', href: '/refund-policy' },
      { label: 'Customer Support', href: '/support' },
      { label: 'About Flyphones', href: '/about' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Flyphones — Powered by Hansh Technologies">
              <img src="/logo-icon.png" alt="Flyphones — Powered by Hansh Technologies" className="h-9 w-auto object-contain" />
              <div>
                <span className="text-[19px] font-extrabold tracking-tight text-ink">{BRAND.name}</span>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-ink-faint">
                  Powered by {BRAND.parentCompany}
                </span>
              </div>
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-muted">
              {BRAND.tagline}. High-quality pre-owned and refurbished devices with transparent grading, 6-month limited warranty, and fast insured delivery across India.
            </p>
            <div className="mt-4 space-y-1 text-[12.5px] text-ink-soft">
              <p className="font-semibold text-ink">
                <a href={`tel:${BRAND.supportPhoneRaw}`} className="hover:text-accent">{BRAND.supportPhone}</a>
                {' · '}
                <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-accent">{BRAND.supportEmail}</a>
              </p>
              <p className="text-[12px] text-ink-muted">
                Support Hours: {BRAND.supportHours}
              </p>
              <p className="text-[12px] text-ink-muted leading-snug pt-1">
                Experience Center & Office: {BRAND.address.full}
              </p>
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title} className="col-span-1">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-ink">{c.title}</h3>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-[13px] text-ink-muted transition-colors hover:text-accent">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-[12px] text-ink-faint md:flex-row">
          <p>© {new Date().getFullYear()} {BRAND.name} (Powered by {BRAND.parentCompany}). All rights reserved.</p>
          <p className="max-w-2xl text-center md:text-right">
            Flyphones is an independent provider of quality-checked pre-owned electronics. Apple, iPhone, iPad, Mac, Apple Watch, and AirPods are trademarks of Apple Inc. Products sold by Flyphones are pre-owned, independently inspected by Flyphones, and are not affiliated with, certified by, or warranted by Apple Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
