'use client';
import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RowsSkeleton } from '@/components/ui/skeleton';
import { paymentService } from '@/services';
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from '@/constants';
import { formatDateTime, inr } from '@/lib/utils';

export default function PaymentsPage() {
  const payments = useQuery({ queryKey: ['payments'], queryFn: () => paymentService.list() });

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-ink">Payments</h1>
      <p className="mt-1 text-[13px] text-ink-muted">Your complete payment history — captures, refunds and COD settlements.</p>
      {payments.isError ? <ErrorState className="mt-6" onRetry={() => void payments.refetch()} /> :
        !payments.data ? <RowsSkeleton rows={4} cols={4} /> :
        payments.data.length === 0 ? (
          <div className="mt-6"><EmptyState icon={Wallet} title="No payments yet" description="Payments appear here once you place an order." /></div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-surface-sunk text-[11.5px] uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.data.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-ink">{p.id}</td>
                    <td className="px-4 py-3 text-ink-soft">{p.orderId}</td>
                    <td className="px-4 py-3 text-ink-soft">{p.method}</td>
                    <td className="px-4 py-3 font-bold text-ink">{inr(p.amount)}</td>
                    <td className="px-4 py-3"><Badge tone={PAYMENT_STATUS_TONE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge></td>
                    <td className="px-4 py-3 text-[12px] text-ink-muted">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
