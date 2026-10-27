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
    title: 'Help & policies',
    links: [
      { label: 'Support', href: '/support' },
      { label: 'Shipping policy', href: '/shipping-policy' },
      { label: 'Refund & returns policy', href: '/refund-policy' },
      { label: 'Terms of service', href: '/terms' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'About iVanta', href: '/about' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src="/logo-icon.png" alt="iVanta" className="h-8 w-auto object-contain" />
              <span className="text-[18px] font-extrabold tracking-tight text-ink">{BRAND.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-muted">
              {BRAND.tagline}. Genuine Apple products with warranty, transparent pricing
              and fast, insured delivery across India.
            </p>
            <p className="mt-4 text-[12.5px] text-ink-muted">
              {BRAND.supportEmail} · {BRAND.supportPhone}
            </p>
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
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p className="max-w-2xl text-center md:text-right">
            iVanta is an independent provider of quality-checked pre-owned electronics. Apple, iPhone, iPad, Mac, Apple Watch, and AirPods are trademarks of Apple Inc. Products sold by iVanta are pre-owned, independently inspected by iVanta, and are not affiliated with, certified by, or warranted by Apple Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
