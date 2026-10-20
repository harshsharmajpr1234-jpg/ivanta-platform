'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Heart, MapPin, Package, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/product/product-image';
import { orderService, returnService, userService, wishlistService } from '@/services';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/constants';
import { formatDate, inr } from '@/lib/utils';

export default function AccountPage() {
  const orders = useQuery({ queryKey: ['orders', 'recent'], queryFn: () => orderService.list({ page: 0, size: 3 }) });
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: () => userService.addresses() });
  const wishlist = useQuery({ queryKey: ['wishlist', 'ids'], queryFn: () => wishlistService.ids() });
  const returns = useQuery({ queryKey: ['returns'], queryFn: () => returnService.list() });

  const tiles = [
    { href: '/account/orders', icon: Package, label: 'Orders', value: orders.data?.totalElements ?? '—' },
    { href: '/wishlist', icon: Heart, label: 'Wishlist', value: wishlist.data?.length ?? '—' },
    { href: '/account/returns', icon: RotateCcw, label: 'Returns', value: returns.data?.length ?? '—' },
    { href: '/account/addresses', icon: MapPin, label: 'Addresses', value: addresses.data?.length ?? '—' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">Account overview</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.href + t.label} href={t.href} className="rounded-2xl border border-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <t.icon className="h-5 w-5 text-accent" />
            <p className="mt-2 text-[20px] font-bold text-ink">{t.value}</p>
            <p className="text-[12px] text-ink-muted">{t.label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">Recent orders</h2>
          <Link href="/orders" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:underline">All orders <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {!orders.data || orders.data.content.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink-muted">No orders yet — <Link href="/products" className="font-semibold text-accent hover:underline">start shopping</Link>.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {orders.data.content.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex items-center gap-3 py-3">
                  <ProductImage imageKey={o.primaryImage} name={o.primaryName ?? undefined} className="h-12 w-12 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{o.primaryName ?? o.id}</p>
                    <p className="text-[11.5px] text-ink-muted">{o.id} · {formatDate(o.placedAt)}</p>
                  </div>
                  <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                  <span className="text-[13px] font-bold text-ink">{inr(o.grandTotal)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold text-ink">Default address</h2>
        {addresses.data && addresses.data.length > 0 ? (
          (() => {
            const a = addresses.data.find((x) => x.isDefault) ?? addresses.data[0];
            return (
              <div className="mt-2 text-[13px] text-ink-soft">
                <p className="font-semibold text-ink">{a.name} · {a.phone}</p>
                <p className="mt-0.5">{a.addressLine1}, {a.city}, {a.state} — {a.pincode}</p>
                <Link href="/account/addresses" className="mt-2 inline-block text-[12.5px] font-semibold text-accent hover:underline">Manage addresses →</Link>
              </div>
            );
          })()
        ) : (
          <p className="mt-2 text-[13px] text-ink-muted">No addresses saved yet — <Link href="/account/addresses" className="font-semibold text-accent hover:underline">add one</Link>.</p>
        )}
      </section>
    </div>
  );
}
