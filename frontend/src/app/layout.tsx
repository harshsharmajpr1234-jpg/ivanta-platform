import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/app/providers';
import { BRAND } from '@/constants';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.domain),
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description: 'FlyPhones — India\'s trusted platform for certified pre-owned Apple devices. Buy quality-checked iPhones, MacBooks, iPads, Apple Watches and AirPods with 1-month hardware warranty and doorstep open box inspection.',
  keywords: ['pre-owned iPhone', 'refurbished MacBook India', 'pre-owned Apple Watch', 'buy used iPad', 'FlyPhones India'],
  openGraph: { type: 'website', siteName: BRAND.name, title: `${BRAND.name} — ${BRAND.tagline}`, description: 'Shop certified pre-owned Apple devices on FlyPhones with 32-point inspection, 1-month warranty, and open box delivery.', url: BRAND.domain },
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
