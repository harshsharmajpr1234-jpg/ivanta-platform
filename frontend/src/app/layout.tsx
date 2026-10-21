import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/app/providers';
import { BRAND } from '@/constants';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.domain),
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description: 'iVanta buys used Apple devices directly from you — iPhone, iPad, Mac, Apple Watch and AirPods. Instant estimate, free doorstep pickup, 16-point inspection and payout within 24 hours via UPI or bank transfer.',
  keywords: ['sell old iPhone', 'sell used MacBook India', 'Apple buyback', 'sell iPad for cash', 'used Apple device buyer Jaipur'],
  openGraph: { type: 'website', siteName: BRAND.name, title: `${BRAND.name} — ${BRAND.tagline}`, description: 'Sell your used Apple device to iVanta — fair formula-based valuation, certified inspection, next-day payout.', url: BRAND.domain },
  twitter: { card: 'summary_large_image', title: `${BRAND.name} — ${BRAND.tagline}` },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
