'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Heart, Home, ShoppingBag, Package, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cartService, orderService } from '@/services';
import { guestCartCount, useGuestCart } from '@/store/guest-cart';
import { cn } from '@/lib/utils';

/** Orders that are still moving through fulfilment (badge on the Orders tab). */
const ACTIVE_ORDER_STATUSES = [
  'PENDING_PAYMENT', 'PAYMENT_FAILED', 'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED',
  'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'CANCEL_REQUESTED',
  'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_PICKUP_SCHEDULED', 'RETURN_PICKED_UP',
  'RETURN_RECEIVED', 'RETURN_INSPECTION', 'REFUND_INITIATED',
  'REPLACEMENT_REQUESTED', 'REPLACEMENT_PROCESSING', 'REPLACEMENT_SHIPPED',
];

const ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Shop', icon: ShoppingBag },
  { href: '/cart', label: 'Cart', icon: ShoppingBag, badge: true },
  { href: '/account/orders', label: 'Orders', icon: Package, orderBadge: true },
  { href: '/account', label: 'Account', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: () => cartService.get(), enabled: Boolean(user) });
  const guestCount = useGuestCart((s) => guestCartCount(s.items));
  const cartCount = user ? cart?.itemCount ?? 0 : guestCount;
  const { data: activeOrders } = useQuery({
    queryKey: ['orders', 'active-count'],
    queryFn: () => orderService.list({ page: 0, size: 50 }),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
  const orderCount = activeOrders?.content.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)).length ?? 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-xl md:hidden" aria-label="Bottom">
      <div className="grid grid-cols-5">
        {ITEMS.map((it) => {
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          return (
            <Link key={it.label} href={it.href}
              className={cn('relative flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium', active ? 'text-accent' : 'text-ink-muted')}>
              <it.icon className="h-5 w-5" />
              {it.label}
              {it.badge && cartCount > 0 && (
                <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">{cartCount}</span>
              )}
              {'orderBadge' in it && it.orderBadge && orderCount > 0 && (
                <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">{orderCount}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
