'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, PackageCheck, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { PageSkeleton } from '@/components/ui/skeleton';
import { returnService } from '@/services';
import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE } from '@/constants';
import { formatDateTime, inr } from '@/lib/utils';

const FLOW = ['REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED', 'INSPECTION', 'APPROVED_FOR_REFUND', 'REFUND_PROCESSING', 'REFUNDED'] as const;

export default function ReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ret = useQuery({ queryKey: ['return', id], queryFn: () => returnService.get(id) });

  if (!ret.data) return <div className="mx-auto max-w-3xl px-4 py-8"><PageSkeleton /></div>;
  const r = ret.data;
  const refundTotal = r.items.reduce((sum, it) => sum + it.refundAmount, 0);
  const currentStage = (FLOW as readonly string[]).indexOf(r.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-ink-muted" onClick={() => window.history.back()}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{r.id}</h1>
        <Badge tone={RETURN_STATUS_TONE[r.status]}>{RETURN_STATUS_LABEL[r.status]}</Badge>
      </div>
      <p className="mt-1 text-[13px] text-ink-muted">
        Requested {formatDateTime(r.requestedAt)} · Order{' '}
        <Link href={`/orders/${r.orderId}`} className="font-semibold text-accent hover:underline">{r.orderId}</Link>
        {r.resolvedAt && <> · Resolved {formatDateTime(r.resolvedAt)}</>}
      </p>

      <Card className="mt-5">
        <CardHeader title="Items in this return" />
        <CardContent className="divide-y divide-line">
          {r.items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-sunk text-ink-muted"><PackageCheck className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">{it.productName}</p>
                <p className="text-[12px] text-ink-muted">{it.variantName ?? 'Standard'} · Qty {it.quantity}</p>
              </div>
              <span className="text-[13.5px] font-bold text-ink">{inr(it.refundAmount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 text-[14px]">
            <span className="font-semibold text-ink">Total refund</span>
            <span className="font-bold text-success">{inr(refundTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Return details" />
          <CardContent className="space-y-2 text-[13px]">
            <div className="flex justify-between gap-4"><span className="text-ink-muted">Reason</span><span className="text-right font-medium text-ink">{r.reason}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Requested</span><span className="font-medium text-ink">{formatDateTime(r.requestedAt)}</span></div>
            {r.customerNotes && <p className="rounded-lg bg-surface-sunk p-2.5 text-ink-soft">Your note: “{r.customerNotes}”</p>}
            {r.inspectionNotes && <p className="rounded-lg bg-surface-sunk p-2.5 text-ink-soft">Inspection: {r.inspectionNotes}</p>}
            {r.status === 'REJECTED' && (
              <p className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft p-2.5 text-danger">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> This return was rejected{r.inspectionNotes ? ` — ${r.inspectionNotes}` : '.'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Refunds" />
          <CardContent className="space-y-3 text-[13px]">
            {r.refunds.length === 0 ? (
              <p className="text-ink-muted">No refund issued yet — it appears here once the return is approved for refund.</p>
            ) : r.refunds.map((rf) => (
              <div key={rf.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{inr(rf.amount)}</span>
                  <Badge tone={rf.status === 'SUCCESS' ? 'success' : rf.status === 'FAILED' ? 'danger' : 'warning'}>{rf.status.replaceAll('_', ' ')}</Badge>
                </div>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {rf.method} · {rf.provider} · {rf.id}
                  {rf.providerTransactionId && <> · ref {rf.providerTransactionId}</>}
                </p>
                <p className="text-[11.5px] text-ink-faint">
                  Created {formatDateTime(rf.createdAt)}{rf.processedAt && <> · processed {formatDateTime(rf.processedAt)}</>}
                </p>
                {rf.failureReason && <p className="mt-1 text-[12px] font-medium text-danger">{rf.failureReason}</p>}
              </div>
            ))}
            <p className="text-[11.5px] text-ink-muted">Refunds go to the original payment method; COD orders are refunded via bank transfer.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Status timeline" />
        <CardContent className="py-2">
          {r.status === 'REJECTED' || r.status === 'CLOSED' ? (
            <div className="flex items-center gap-2 text-[13px] font-medium text-danger">
              <AlertTriangle className="h-4 w-4" /> {RETURN_STATUS_LABEL[r.status]}{r.resolvedAt && ` — ${formatDateTime(r.resolvedAt)}`}
            </div>
          ) : (
            <ol className="space-y-3">
              {FLOW.slice(0, Math.max(currentStage + 1, 1)).map((stage) => (
                <li key={stage} className="flex items-center gap-3 text-[13px]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-soft text-success">
                    {stage === 'REFUNDED' ? <RotateCcw className="h-3 w-3" /> : <PackageCheck className="h-3 w-3" />}
                  </span>
                  <span className="font-medium text-ink">{RETURN_STATUS_LABEL[stage]}</span>
                  {stage === r.status && <Badge tone="accent" className="ml-auto">Current</Badge>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
