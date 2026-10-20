'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight, Download, MapPin, Package, Search } from 'lucide-react';
import { ProductImage } from '@/components/product/product-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { PageSkeleton, RowsSkeleton } from '@/components/ui/skeleton';
import { orderService } from '@/services';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from '@/constants';
import { formatDate, inr } from '@/lib/utils';

/** Statuses where a shipment exists and tracking is meaningful. */
const TRACKABLE = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const FILTER_STATUSES = [
  'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
  'DELIVERED', 'CANCEL_REQUESTED', 'CANCELLED', 'RETURN_REQUESTED', 'REFUND_INITIATED', 'REFUNDED',
];

/**
 * Customer order list (§24): id/date/image/name/variant/qty/amount/status/expected
 * delivery/payment status, with view · track · cancel · return · invoice actions.
 * Shared by /orders and /account/orders — everything comes from the backend.
 */
export function OrderListClient({ basePath }: { basePath: '/orders' | '/account/orders' }) {
  const router = useRouter();
  const toast = useUIStore((s) => s.toast);
  const { user } = useAuthStore();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  const orders = useQuery({
    queryKey: ['orders', 'list', q, status, page],
    queryFn: () => orderService.list({ q: q || undefined, status: status || undefined, page, size: 10 }),
    enabled: Boolean(user),
    placeholderData: keepPreviousData,
  });

  // Order history genuinely requires an account — guests are sent to login.
  useEffect(() => {
    if (!user) router.replace(`/login?next=${basePath}`);
  }, [user, router, basePath]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <PageSkeleton />
        <p className="mt-4 text-center text-[13px] text-ink-muted">Order history needs your account — taking you to sign in.</p>
      </div>
    );
  }

  const downloadInvoice = async (id: string, orderNumber?: string | null) => {
    try {
      await orderService.downloadInvoice(id);
      toast({ title: 'Invoice downloaded', description: orderNumber ?? id, tone: 'success' });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Invoice unavailable', tone: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-[860px] px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">My orders</h1>
      <p className="mt-1 text-[13px] text-ink-muted">Every order you have placed, with live status from the fulfilment pipeline.</p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Search by order number or product" className="pl-9" aria-label="Search orders" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Filter by status"
          className="h-11 rounded-xl border border-line-strong bg-white px-3 text-[13px] font-medium text-ink focus:border-accent focus:outline-none sm:w-52">
          <option value="">All statuses</option>
          {FILTER_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABEL[s as keyof typeof ORDER_STATUS_LABEL] ?? s}</option>
          ))}
        </select>
      </div>

      {orders.isError ? (
        <ErrorState className="mt-8" onRetry={() => void orders.refetch()} />
      ) : !orders.data ? (
        <RowsSkeleton rows={4} cols={3} />
      ) : orders.data.content.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Package} title="No orders found" description={q || status ? 'Nothing matches these filters yet.' : 'When you place an order it will show up here with live tracking.'}
            action={<Link href="/products"><Button>Start shopping <ArrowRight className="h-4 w-4" /></Button></Link>} />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.data.content.map((o) => (
            <li key={o.id} className="rounded-2xl border border-line bg-white p-4 transition-all hover:shadow-soft">
              <Link href={`${basePath}/${o.id}`} className="flex items-center gap-4">
                <ProductImage imageKey={o.primaryImage} name={o.primaryName ?? undefined} className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-bold text-ink">{o.orderNumber ?? o.id}</span>
                    <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    {o.paymentStatus && (
                      <Badge tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? 'neutral'}>
                        {PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-ink-soft">
                    {o.primaryName ?? 'Order'} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    Placed {formatDate(o.placedAt)} · {o.paymentMethod}
                    {TRACKABLE.includes(o.status) && o.expectedDelivery ? ` · expected ${formatDate(o.expectedDelivery)}` : ''}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[15px] font-bold text-ink">{inr(o.grandTotal)}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-accent">Details <ArrowRight className="h-3 w-3" /></span>
                </div>
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <p className="mr-auto text-[13px] font-bold text-ink sm:hidden">{inr(o.grandTotal)}</p>
                <Link href={`${basePath}/${o.id}`}>
                  <Button variant="ghost" size="sm">View details</Button>
                </Link>
                {TRACKABLE.includes(o.status) && (
                  <Link href={`${basePath}/${o.id}#tracking`}>
                    <Button variant="ghost" size="sm"><MapPin className="h-3.5 w-3.5" /> Track</Button>
                  </Link>
                )}
                {['DELIVERED', 'REFUNDED', 'REPLACEMENT_DELIVERED'].includes(o.status) && o.grandTotal > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => void downloadInvoice(o.id, o.orderNumber)}>
                    <Download className="h-3.5 w-3.5" /> Invoice
                  </Button>
                )}
                {['DELIVERED', 'RETURN_REQUESTED', 'RETURN_APPROVED'].includes(o.status) && (
                  <Link href={`${basePath}/${o.id}`}>
                    <Button variant="ghost" size="sm">Return / replace</Button>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {orders.data && orders.data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Newer</Button>
          <span className="text-[12.5px] text-ink-muted">Page {orders.data.page + 1} of {orders.data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page + 1 >= orders.data.totalPages} onClick={() => setPage((p) => p + 1)}>Older</Button>
        </div>
      )}
    </div>
  );
}
