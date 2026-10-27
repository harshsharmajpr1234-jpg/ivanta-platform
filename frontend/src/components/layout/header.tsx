'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User as UserIcon } from 'lucide-react';
import { ProductImage } from '@/components/product/product-image';
import { Sheet } from '@/components/ui/sheet';
import { NotificationBell } from '@/components/notifications/notification-center';
import { useAuthStore } from '@/store/auth';
import { guestCartCount, useGuestCart } from '@/store/guest-cart';
import { cartService, catalogService } from '@/services';
import { cn, inr } from '@/lib/utils';

const NAV = [
  { label: 'Store', href: '/products' },
  { label: 'iPhone', href: '/products?cat=iphone' },
  { label: 'iPad', href: '/products?cat=ipad' },
  { label: 'Mac', href: '/products?cat=mac' },
  { label: 'Watch', href: '/products?cat=watch' },
  { label: 'Condition Guide', href: '/condition-guide' },
  { label: 'Warranty', href: '/warranty-policy' },
  { label: 'Support', href: '/support' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, admin, refreshUser, logoutUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => { setMenuOpen(false); setAccountOpen(false); }, [pathname]);
  useEffect(() => { if (!user) void refreshUser(); }, [user, refreshUser]);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.get(),
    enabled: Boolean(user),
    staleTime: 15_000,
  });
  const guestCount = useGuestCart((s) => guestCartCount(s.items));
  const cartCount = user ? cart?.itemCount ?? 0 : guestCount;

  const [searchFocused, setSearchFocused] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 200);
    return () => clearTimeout(timer);
  }, [q]);

  const searchResults = useQuery({
    queryKey: ['products', 'live-search', debouncedQ],
    queryFn: () => catalogService.products({ q: debouncedQ, size: 5 }),
    enabled: debouncedQ.length >= 2,
    staleTime: 30_000,
  });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products');
  };

  const navLinks = (
    <>
      {NAV.map((n) => (
        <Link key={n.href + n.label} href={n.href}
          className={cn('rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
            pathname === '/products' && n.href === pathname + (n.href.includes('?') ? '?' + n.href.split('?')[1] : '')
              ? 'bg-ink text-white'
              : 'text-ink/70 hover:bg-ink/5 hover:text-ink')}>
          {n.label}
        </Link>
      ))}
    </>
  );

  const showSuggestions = searchFocused && debouncedQ.length >= 2;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-2 px-3 sm:h-[58px] sm:gap-3 sm:px-4">
          <button type="button" className="rounded-full p-2 text-ink md:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="group flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label="Flyphones — Powered by Hansh Technologies">
            <img
              src="/logo-icon.png"
              alt="Flyphones — Powered by Hansh Technologies"
              className="h-8 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 sm:h-[34px]"
            />
            <div className="flex flex-col justify-center">
              <span className="text-[17px] font-bold tracking-tight text-ink leading-none sm:text-[18.5px]">
                Flyphones
              </span>
              <span className="text-[7px] font-semibold tracking-wider text-ink-muted uppercase leading-none pt-1 sm:text-[7.5px]">
                Powered by Hansh Technologies
              </span>
            </div>
          </Link>

          <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Main">{navLinks}</nav>

          <div className="relative ml-auto hidden max-w-[320px] flex-1 md:block">
            <form onSubmit={submitSearch} className="flex items-center">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
                  placeholder="Search iPhone, Mac, AirPods…"
                  className="h-9 w-full rounded-full border border-line bg-surface-sunk pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-pop animate-fade-down">
                {searchResults.isFetching ? (
                  <div className="flex items-center justify-center py-6 text-[12px] text-ink-muted">
                    <span className="inline-block animate-spin mr-2">◌</span> Searching products…
                  </div>
                ) : searchResults.data?.content && searchResults.data.content.length > 0 ? (
                  <div className="divide-y divide-line/60">
                    <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                      Products
                    </div>
                    {searchResults.data.content.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.slug}`}
                        onClick={() => { setSearchFocused(false); setQ(''); }}
                        className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-sunk"
                      >
                        <ProductImage imageKey={p.imageKey} name={p.name} className="h-10 w-10 shrink-0 rounded-lg bg-surface" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">{p.name}</p>
                          <p className="text-[11.5px] text-ink-muted">{p.category || 'Apple'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[12.5px] font-bold text-ink">{inr(p.price)}</p>
                          {p.discountPct > 0 && (
                            <span className="text-[10.5px] font-semibold text-accent">{p.discountPct}% off</span>
                          )}
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/products?q=${encodeURIComponent(debouncedQ)}`}
                      onClick={() => setSearchFocused(false)}
                      className="block px-2.5 py-2 text-center text-[12px] font-semibold text-accent hover:underline"
                    >
                      View all results for &ldquo;{debouncedQ}&rdquo; →
                    </Link>
                  </div>
                ) : (
                  <div className="py-6 text-center text-[12px] text-ink-muted">
                    No Apple products match &ldquo;{debouncedQ}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <button
              type="button"
              className="rounded-full p-2 text-ink transition-colors hover:bg-ink/5 md:hidden"
              aria-label="Search"
              onClick={() => setMenuOpen(true)}
            >
              <Search className="h-5 w-5" />
            </button>
            {user && <NotificationBell />}
            <Link href="/cart" className="relative rounded-full p-2 text-ink transition-colors hover:bg-ink/5" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{cartCount}</span>
              )}
            </Link>
            <div className="relative hidden md:block">
              <button type="button" onClick={() => setAccountOpen((o) => !o)} aria-haspopup="menu" aria-expanded={accountOpen}
                className={cn('flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-ink/5', accountOpen && 'bg-ink/5')}>
                <UserIcon className="h-4 w-4" />
                {user ? user.name.split(' ')[0] : 'Account'}
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', accountOpen && 'rotate-180')} />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-pop" role="menu">
                  {user ? (
                    <>
                      <MenuItem href="/account" icon={UserIcon} label="My account" onClick={() => setAccountOpen(false)} />
                      <MenuItem href="/orders" icon={Package} label="My orders" onClick={() => setAccountOpen(false)} />
                      <button type="button" className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-ink hover:bg-surface-sunk"
                        onClick={async () => { setAccountOpen(false); await logoutUser(); router.push('/'); }}>
                        <LogOut className="h-4 w-4 text-ink-muted" /> Sign out
                      </button>
                    </>
                  ) : (
                    <MenuItem href="/login" icon={UserIcon} label="Sign in / Register" onClick={() => setAccountOpen(false)} />
                  )}
                  {admin && <MenuItem href="/admin" icon={LayoutDashboard} label="Admin console" onClick={() => setAccountOpen(false)} />}
                </div>
              )}
            </div>
            <Link href="/login" className="rounded-full bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-white md:hidden shrink-0">{user ? 'Account' : 'Sign In'}</Link>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title="Menu">
        <div className="flex flex-col gap-1">
          <form
            onSubmit={(e) => {
              submitSearch(e);
              setMenuOpen(false);
            }}
            className="relative mb-3"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Apple products…"
              className="h-10 w-full rounded-full border border-line bg-surface-sunk pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-accent focus:bg-white focus:outline-none"
            />
          </form>
          {NAV.map((n) => (
            <Link key={n.href + n.label} href={n.href} className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink hover:bg-surface-sunk">{n.label}</Link>
          ))}
          <div className="my-2 border-t border-line" />
          {user ? (
            <>
              <Link href="/account" className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink hover:bg-surface-sunk">My account</Link>
              <Link href="/orders" className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink hover:bg-surface-sunk">My orders</Link>
              <Link href="/wishlist" className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink hover:bg-surface-sunk">Wishlist</Link>
              <button type="button" className="rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-danger hover:bg-danger-soft"
                onClick={async () => { setMenuOpen(false); await logoutUser(); router.push('/'); }}>Sign out</button>
            </>
          ) : (
            <Link href="/login" className="rounded-xl bg-ink px-3 py-2.5 text-center text-[14px] font-semibold text-white">Sign in / Register</Link>
          )}
          {admin && <Link href="/admin" className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink hover:bg-surface-sunk">Admin console</Link>}
        </div>
      </Sheet>
    </>
  );
}

function MenuItem({ href, icon: Icon, label, onClick }: { href: string; icon: typeof UserIcon; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} role="menuitem"
      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ink hover:bg-surface-sunk">
      <Icon className="h-4 w-4 text-ink-muted" /> {label}
    </Link>
  );
}
