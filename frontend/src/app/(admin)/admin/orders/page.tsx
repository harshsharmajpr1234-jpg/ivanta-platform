'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, RotateCw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RowsSkeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/admin/section-header';
import { adminService } from '@/services';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import {
  ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE,
  REPLACEMENT_NEXT, REPLACEMENT_STATUS_LABEL, REPLACEMENT_STATUS_TONE,
  RETURN_NEXT, RETURN_STATUS_LABEL, RETURN_STATUS_TONE,
} from '@/constants';
import { cn, formatDate, formatDateTime, inr } from '@/lib/utils';

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'PENDING_PAYMENT', label: 'Awaiting payment' },
  { key: 'PLACED', label: 'New' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'IN_TRANSIT', label: 'In transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCEL_REQUESTED', label: 'Cancel requests' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'returns', label: 'Returns' },
  { key: 'refunds', label: 'Refunds' },
  { key: 'replacements', label: 'Replacements' },
];

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
      <AdminOrders />
    </Suspense>
  );
}

function AdminOrders() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const toast = useUIStore((s) => s.toast);
  const admin = useAuthStore((s) => s.admin);
  const canUpdate = (admin?.permissions ?? []).includes('ORDER_UPDATE');

  const tab = params.get('tab') ?? '';
  const [q, setQ] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const setTab = (t: string) => router.push(t ? `/admin/orders?tab=${t}` : '/admin/orders');
  const isOrdersTab = !['returns', 'refunds', 'replacements'].includes(tab);

  const orders = useQuery({
    queryKey: ['admin', 'orders', tab, q, paymentStatus, from, to, page],
    queryFn: () => adminService.orders({
      q: q || undefined,
      status: isOrdersTab ? tab || undefined : undefined,
      paymentStatus: paymentStatus || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      size: 20,
    }),
    enabled: isOrdersTab,
    placeholderData: keepPreviousData,
  });

  const returns = useQuery({
    queryKey: ['admin', 'returns'],
    queryFn: () => adminService.returns({ limit: 100 }),
    enabled: tab === 'returns',
  });
  const refunds = useQuery({
    queryKey: ['admin', 'refunds'],
    queryFn: () => adminService.refunds({ limit: 100 }),
    enabled: tab === 'refunds',
  });
  const replacements = useQuery({
    queryKey: ['admin', 'replacements'],
    queryFn: () => adminService.replacements({ limit: 100 }),
    enabled: tab === 'replacements',
  });

  const returnMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.setReturnStatus(id, status),
    onSuccess: () => {
      toast({ title: 'Return updated', tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['admin', 'returns'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (e) => toast({ title: e instanceof Error ? e.message : 'Update failed', tone: 'error' }),
  });
  const replacementMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.setReplacementStatus(id, status),
    onSuccess: () => {
      toast({ title: 'Replacement updated', tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['admin', 'replacements'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (e) => toast({ title: e instanceof Error ? e.message : 'Update failed', tone: 'error' }),
  });

  return (
    <div className="space-y-5">
      <SectionHeader title="Orders" subtitle="Search, filter and drive every order through its lifecycle." />

      {/* tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => { setPage(0); setTab(t.key); }}
            className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
              tab === t.key ? 'bg-ink text-white' : 'border border-line bg-white text-ink-muted hover:text-ink')}>
            {t.label}
          </button>
        ))}
      </div>

      {isOrdersTab && (
        <div className="grid gap-2 md:grid-cols-[1fr_170px_150px_150px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
              placeholder="Order #, customer, phone, email, product, SKU or tracking #" className="pl-9" aria-label="Search orders" />
          </div>
          <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(0); }} aria-label="Payment status"
            className="h-11 rounded-xl border border-line-strong bg-white px-3 text-[13px] text-ink focus:border-accent focus:outline-none">
            <option value="">Any payment</option>
            {['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'].map((p) => (
              <option key={p} value={p}>{PAYMENT_STATUS_LABEL[p] ?? p}</option>
            ))}
          </select>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} aria-label="Placed from" className="h-11" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} aria-label="Placed to" className="h-11" />
        </div>
      )}

      {/* orders table */}
      {isOrdersTab && (
        orders.isError ? <ErrorState onRetry={() => void orders.refetch()} />
          : !orders.data ? <RowsSkeleton rows={8} cols={6} />
            : orders.data.content.length === 0 ? (
              <EmptyState icon={Search} title="No orders match" description="Adjust the search or filters and try again." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-line bg-white">
                <table className="w-full min-w-[900px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-surface-sunk/60 text-[11px] uppercase tracking-wide text-ink-faint">
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Placed</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.data.content.map((o) => (
                      <tr key={o.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-sunk/40">
                        <td className="px-4 py-3">
                          <p className="font-bold text-ink">{o.orderNumber ?? o.id}</p>
                          <p className="font-mono text-[11px] text-ink-faint">{o.id}</p>
                          <p className="mt-0.5 max-w-[220px] truncate text-[12px] text-ink-muted">
                            {o.primaryName ?? ''}{o.itemCount > 1 ? ` +${o.itemCount - 1}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-ink-soft">{o.customerName ?? '—'}</td>
                        <td className="px-4 py-3 text-ink-muted">{formatDate(o.placedAt)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                          {o.expectedDelivery && <p className="mt-1 text-[11px] text-ink-faint">ETA {formatDate(o.expectedDelivery)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {o.paymentStatus && (
                            <Badge tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? 'neutral'}>
                              {PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}
                            </Badge>
                          )}
                          <p className="mt-1 text-[11px] text-ink-faint">{o.paymentMethod}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-ink">{inr(o.grandTotal)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:underline">
                            Open <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.data.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-line px-4 py-3">
                    <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <span className="text-[12.5px] text-ink-muted">
                      Page {orders.data.page + 1} / {orders.data.totalPages} · {orders.data.totalElements} orders
                    </span>
                    <Button variant="secondary" size="sm" disabled={page + 1 >= orders.data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                )}
              </div>
            )
      )}

      {/* returns tab */}
      {tab === 'returns' && (
        returns.isLoading ? <RowsSkeleton rows={5} cols={5} />
          : returns.isError ? <ErrorState onRetry={() => void returns.refetch()} />
            : (returns.data ?? []).length === 0 ? <EmptyState icon={RotateCw} title="No returns" description="Return requests will appear here." /> : (
              <div className="overflow-x-auto rounded-2xl border border-line bg-white">
                <table className="w-full min-w-[860px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-surface-sunk/60 text-[11px] uppercase tracking-wide text-ink-faint">
                      <th className="px-4 py-3">Return</th><th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Reason</th><th className="px-4 py-3">Requested</th>
                      <th className="px-4 py-3">Status</th>{canUpdate && <th className="px-4 py-3">Advance</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(returns.data ?? []).map((r) => (
                      <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-surface-sunk/40">
                        <td className="px-4 py-3 font-mono text-[12px] font-bold text-ink">{r.id}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${r.orderId}`} className="font-semibold text-accent hover:underline">{r.orderId}</Link>
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-ink-soft">{r.reason}</td>
                        <td className="px-4 py-3 text-ink-muted">{formatDateTime(r.requestedAt)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={RETURN_STATUS_TONE[r.status]}>{RETURN_STATUS_LABEL[r.status] ?? r.status}</Badge>
                        </td>
                        {canUpdate && (
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {(RETURN_NEXT[r.status] ?? []).map((next) => (
                                <Button key={next} variant="secondary" size="sm" disabled={returnMut.isPending}
                                  onClick={() => returnMut.mutate({ id: r.id, status: next })}>
                                  {RETURN_STATUS_LABEL[next] ?? next}
                                </Button>
                              ))}
                              {(RETURN_NEXT[r.status] ?? []).length === 0 && <span className="text-[12px] text-ink-faint">Closed</span>}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
      )}

      {/* refunds tab */}
      {tab === 'refunds' && (
        refunds.isLoading ? <RowsSkeleton rows={5} cols={5} />
          : refunds.isError ? <ErrorState onRetry={() => void refunds.refetch()} />
            : (refunds.data ?? []).length === 0 ? <EmptyState icon={RotateCw} title="No refunds" description="Refunds appear here as soon as they are created." /> : (
              <div className="overflow-x-auto rounded-2xl border border-line bg-white">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-surface-sunk/60 text-[11px] uppercase tracking-wide text-ink-faint">
                      <th className="px-4 py-3">Refund</th><th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(refunds.data ?? []).map((r) => (
                      <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-surface-sunk/40">
                        <td className="px-4 py-3 font-mono text-[12px] font-bold text-ink">{r.id}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${r.orderId}`} className="font-semibold text-accent hover:underline">{r.orderId}</Link>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-ink">{inr(r.amount)}</td>
                        <td className="px-4 py-3 text-ink-soft">{r.method} · {r.provider}</td>
                        <td className="px-4 py-3">
                          <Badge tone={r.status === 'SUCCESS' ? 'success' : r.status === 'FAILED' ? 'danger' : 'warning'}>{r.status}</Badge>
                          {r.providerTransactionId && <p className="mt-0.5 font-mono text-[10.5px] text-ink-faint">{r.providerTransactionId}</p>}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{formatDateTime(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
      )}

      {/* replacements tab */}
      {tab === 'replacements' && (
        replacements.isLoading ? <RowsSkeleton rows={5} cols={5} />
          : replacements.isError ? <ErrorState onRetry={() => void replacements.refetch()} />
            : (replacements.data ?? []).length === 0 ? <EmptyState icon={RotateCw} title="No replacements" description="Replacement requests will appear here." /> : (
              <div className="overflow-x-auto rounded-2xl border border-line bg-white">
                <table className="w-full min-w-[900px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-surface-sunk/60 text-[11px] uppercase tracking-wide text-ink-faint">
                      <th className="px-4 py-3">Replacement</th><th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Item</th><th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>{canUpdate && <th className="px-4 py-3">Advance</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(replacements.data ?? []).map((r) => (
                      <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-surface-sunk/40">
                        <td className="px-4 py-3 font-mono text-[12px] font-bold text-ink">{r.id}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${r.orderId}`} className="font-semibold text-accent hover:underline">{r.orderNumber ?? r.orderId}</Link>
                          {r.replacementOrderNumber && (
                            <p className="mt-0.5 text-[11px] text-ink-faint">→ new order {r.replacementOrderNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">{r.productName} × {r.quantity}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-ink-soft">{r.reason}</td>
                        <td className="px-4 py-3">
                          <Badge tone={REPLACEMENT_STATUS_TONE[r.status] ?? 'neutral'}>{REPLACEMENT_STATUS_LABEL[r.status] ?? r.status}</Badge>
                        </td>
                        {canUpdate && (
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {(REPLACEMENT_NEXT[r.status] ?? []).map((next) => (
                                <Button key={next} variant={next === 'REJECTED' ? 'danger' : 'secondary'} size="sm" disabled={replacementMut.isPending}
                                  onClick={() => replacementMut.mutate({ id: r.id, status: next })}>
                                  {next === 'APPROVED' ? 'Approve & create order' : REPLACEMENT_STATUS_LABEL[next] ?? next}
                                </Button>
                              ))}
                              {(REPLACEMENT_NEXT[r.status] ?? []).length === 0 && <span className="text-[12px] text-ink-faint">Closed</span>}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
      )}
    </div>
  );
}
