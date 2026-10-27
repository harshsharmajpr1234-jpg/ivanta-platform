import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/app/providers';
import { BRAND } from '@/constants';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.domain),
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description: `${BRAND.name} (Powered by ${BRAND.parentCompany}) — India's trusted platform for quality-checked pre-owned and refurbished mobile devices. Buy tested iPhones, MacBooks, iPads, Apple Watches and AirPods with 6-month limited warranty and transparent condition grading.`,
  keywords: ['pre-owned iPhone', 'refurbished mobile devices India', 'pre-owned Apple Watch', 'buy used iPad', 'Flyphones India', 'Hansh Technologies'],
  openGraph: { type: 'website', siteName: BRAND.name, title: `${BRAND.name} — ${BRAND.tagline}`, description: 'Shop tested pre-owned and refurbished mobile devices on Flyphones with 6-month warranty, transparent grading, and doorstep open box inspection.', url: BRAND.domain },
  twitter: { card: 'summary_large_image', title: `${BRAND.name} — ${BRAND.tagline}` },
  icons: {
    icon: [
      { url: '/logo-icon.png', sizes: 'any' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
