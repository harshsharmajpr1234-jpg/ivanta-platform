'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RowsSkeleton } from '@/components/ui/skeleton';
import { returnService } from '@/services';
import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE } from '@/constants';
import { formatDate, inr } from '@/lib/utils';

export default function ReturnsPage() {
  const returns = useQuery({ queryKey: ['returns'], queryFn: () => returnService.list() });

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-ink">Returns & refunds</h1>
      <p className="mt-1 text-[13px] text-ink-muted">Every return request you have made, with live status and refund details.</p>
      {returns.isError ? <ErrorState className="mt-6" onRetry={() => void returns.refetch()} /> :
        !returns.data ? <RowsSkeleton rows={3} cols={3} /> :
        returns.data.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={RotateCcw} title="No return requests"
              description="Returns can be requested from the order detail page within the return window."
              action={<Link href="/orders" className="font-semibold text-accent hover:underline">Browse orders →</Link>} />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
            {returns.data.map((r) => {
              const refundTotal = r.items.reduce((sum, it) => sum + it.refundAmount, 0);
              return (
                <li key={r.id}>
                  <Link href={`/returns/${r.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-sunk/50">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><RotateCcw className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">
                        {r.items[0]?.productName ?? 'Return'}{r.items.length > 1 ? ` +${r.items.length - 1} more` : ''}
                      </p>
                      <p className="text-[11.5px] text-ink-muted">{r.id} · order {r.orderId} · {formatDate(r.requestedAt)} · {r.reason}</p>
                    </div>
                    {refundTotal > 0 && <span className="text-[13px] font-bold text-ink">{inr(refundTotal)}</span>}
                    <Badge tone={RETURN_STATUS_TONE[r.status]}>{RETURN_STATUS_LABEL[r.status]}</Badge>
                    <ArrowRight className="h-4 w-4 text-ink-faint" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
}
