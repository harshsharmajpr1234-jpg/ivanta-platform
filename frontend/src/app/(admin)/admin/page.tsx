'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Ban, Banknote, Boxes, CheckCircle2, Package, PackageSearch,
  RotateCcw, Timer, Truck, Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ErrorState } from '@/components/ui/states';
import { AreaChart, PieChart } from '@/components/charts';
import { SectionHeader } from '@/components/admin/section-header';
import { adminService } from '@/services';
import { useAuthStore } from '@/store/auth';
import { ROLE_LABEL } from '@/constants';
import { inr } from '@/lib/utils';

export default function AdminDashboard() {
  const admin = useAuthStore((s) => s.admin);
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => adminService.stats() });
  const d = stats.data;

  const cards = d ? [
    { label: 'Revenue today', value: inr(d.currency.revenueToday ?? 0), icon: Banknote, href: '/admin/orders' },
    { label: 'Revenue this week', value: inr(d.currency.revenueWeek ?? 0), icon: Wallet, href: '/admin/orders' },
    { label: 'Revenue this month', value: inr(d.currency.revenueMonth ?? 0), icon: Wallet, href: '/admin/orders' },
    { label: 'Orders today', value: d.counts.todayOrders ?? 0, icon: Package, href: '/admin/orders' },
    { label: 'Awaiting payment', value: d.counts.pendingPaymentOrders ?? 0, icon: Timer, href: '/admin/orders?tab=PENDING_PAYMENT', warn: true },
    { label: 'To confirm', value: d.counts.pendingOrders ?? 0, icon: CheckCircle2, href: '/admin/orders?tab=PLACED' },
    { label: 'Processing / packed', value: (d.counts.processingOrders ?? 0) + (d.counts.packedOrders ?? 0), icon: Boxes, href: '/admin/orders?tab=PROCESSING' },
    { label: 'Shipped / in transit', value: d.counts.shippedOrders ?? 0, icon: Truck, href: '/admin/orders?tab=SHIPPED' },
    { label: 'Out for delivery', value: d.counts.outForDeliveryOrders ?? 0, icon: Truck, href: '/admin/orders?tab=OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: d.counts.deliveredOrders ?? 0, icon: CheckCircle2, href: '/admin/orders?tab=DELIVERED' },
    { label: 'Cancel requests', value: d.counts.cancelRequests ?? 0, icon: AlertTriangle, href: '/admin/orders?tab=CANCEL_REQUESTED', warn: true },
    { label: 'Cancelled', value: d.counts.cancelledOrders ?? 0, icon: Ban, href: '/admin/orders?tab=CANCELLED' },
    { label: 'Open returns', value: d.counts.openReturns ?? 0, icon: RotateCcw, href: '/admin/orders?tab=returns', warn: true },
    { label: 'Open refunds', value: d.counts.openRefunds ?? 0, icon: Wallet, href: '/admin/orders?tab=refunds', warn: true },
    { label: 'Open replacements', value: d.counts.openReplacements ?? 0, icon: PackageSearch, href: '/admin/orders?tab=replacements', warn: true },
    { label: 'Low / out of stock', value: `${d.counts.lowStockProducts ?? 0} / ${d.counts.outOfStockProducts ?? 0}`, icon: AlertTriangle, href: '/admin/orders' },
  ] : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${admin?.name.split(' ')[0] ?? ''}`}
        subtitle={`${admin ? ROLE_LABEL[admin.role] : ''} · commerce pipeline at a glance`}
      />

      {stats.isLoading && <div className="flex justify-center py-20"><Spinner /></div>}
      {stats.isError && <ErrorState onRetry={() => void stats.refetch()} />}

      {d && (
        <>
          {d.counts.totalOrders === 0 && d.counts.products === 0 && (
            <div className="rounded-2xl border border-accent/20 bg-accent-soft p-5 text-[13.5px] text-ink flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold text-accent">No data yet</p>
                <p className="mt-0.5 text-ink-muted">The production database is empty and clean. Start by creating products and adding inventory in Product Management.</p>
              </div>
              <Link href="/admin/products" className="inline-flex h-9 items-center rounded-xl bg-ink px-4 text-[13px] font-semibold text-white transition-all hover:bg-black">
                Go to Products
              </Link>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => (
              <Link key={c.label} href={c.href}>
                <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="flex items-start justify-between">
                    <p className="text-[12px] font-semibold text-ink-muted">{c.label}</p>
                    <c.icon className={`h-4 w-4 ${'warn' in c && c.warn ? 'text-amber-600' : 'text-accent'}`} />
                  </div>
                  <p className="mt-2 text-[22px] font-bold tracking-tight text-ink">{c.value}</p>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-[14px] font-bold text-ink">Revenue · last 14 days</h2>
              <p className="text-[12px] text-ink-muted">Excludes cancelled, failed and refunded orders.</p>
              <div className="mt-3">
                <AreaChart data={d.revenueByDay as unknown as Record<string, unknown>[]} xKey="day" yKey="revenue" label="Revenue" money />
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-[14px] font-bold text-ink">Orders by status</h2>
              <p className="text-[12px] text-ink-muted">All-time counts across the fulfilment lifecycle.</p>
              <div className="mt-3 max-h-64 overflow-y-auto pr-1">
                <ul className="space-y-1.5">
                  {Object.entries(d.ordersByStatus).filter(([, v]) => v > 0).map(([k, v]) => (
                    <li key={k} className="flex items-center gap-2 text-[12.5px]">
                      <span className="w-52 shrink-0 font-medium text-ink-soft">{k.replaceAll('_', ' ')}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunk">
                        <span className="block h-full rounded-full bg-accent"
                          style={{ width: `${Math.min(100, (v / Math.max(...Object.values(d.ordersByStatus), 1)) * 100)}%` }} />
                      </span>
                      <span className="w-8 text-right font-bold text-ink">{v}</span>
                    </li>
                  ))}
                  {Object.values(d.ordersByStatus).every((v) => v === 0) && (
                    <li className="py-6 text-center text-[12.5px] text-ink-muted">No orders yet.</li>
                  )}
                </ul>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-[14px] font-bold text-ink">Catalogue by category</h2>
              <div className="mt-3">
                <PieChart data={d.categoryDistribution} />
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-[14px] font-bold text-ink">Payment methods</h2>
              <div className="mt-3">
                <PieChart data={d.paymentMethods} />
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-[14px] font-bold text-ink">Top products by units sold</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                    <th className="py-2 pr-4">Product</th><th className="py-2 pr-4">Units</th><th className="py-2">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {d.topProducts.map((t) => (
                    <tr key={t.productId} className="border-b border-line/60 last:border-0">
                      <td className="py-2.5 pr-4 font-semibold text-ink">{t.name}</td>
                      <td className="py-2.5 pr-4 text-ink-soft">{t.unitsSold}</td>
                      <td className="py-2.5 font-mono text-[11.5px] text-ink-faint">{t.productId}</td>
                    </tr>
                  ))}
                  {d.topProducts.length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-ink-muted">No sales recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
