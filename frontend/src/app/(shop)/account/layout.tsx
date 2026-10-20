'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bell, Heart, MapPin, Package, RotateCcw, ShieldCheck, User as UserIcon, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/account', label: 'Overview', icon: UserIcon, exact: true },
  { href: '/account/orders', label: 'My orders', icon: Package },
  { href: '/account/returns', label: 'Returns & refunds', icon: RotateCcw },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/payments', label: 'Payments', icon: Wallet },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/profile', label: 'Profile', icon: UserIcon },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();

  useEffect(() => { if (!user) void refreshUser(); }, [user, refreshUser]);

  // Account area genuinely requires login — redirect guests (cart stays open to them).
  useEffect(() => {
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [user, router, pathname]);

  if (!user) {
    return (
      <div className="container-x flex max-w-md flex-col items-center py-20 text-center">
        <ShieldCheck className="h-12 w-12 text-accent" />
        <h1 className="mt-4 text-[22px] font-bold text-ink">Sign in to your account</h1>
        <p className="mt-2 text-[13.5px] text-ink-muted">Track orders, manage addresses, returns and payments. Taking you to sign in…</p>
        <Button size="lg" className="mt-6" onClick={() => router.push('/login?next=' + encodeURIComponent(pathname))}>Sign in</Button>
      </div>
    );
  }
  return (
    <div className="container-x py-6 lg:py-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[15px] font-bold text-ink">{user.name}</p>
            <p className="truncate text-[12px] text-ink-muted">{user.email ?? user.phone}</p>
            <span className="mt-2 inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-[10.5px] font-bold text-accent">Customer account</span>
          </div>
          <nav className="mt-4 space-y-1" aria-label="Account">
            {LINKS.map((l) => {
              const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
              return (
                <Link key={l.href + l.label} href={l.href}
                  className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                    active ? 'bg-ink text-white' : 'text-ink/70 hover:bg-surface-sunk hover:text-ink')}>
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
