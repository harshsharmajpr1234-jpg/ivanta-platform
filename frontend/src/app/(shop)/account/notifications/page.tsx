'use client';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/states';
import { useNotifications } from '@/hooks/use-notifications';
import { cn, timeAgo } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = {
  order: 'Order', payment: 'Payment', shipment: 'Delivery', return: 'Return',
  refund: 'Refund', replacement: 'Replacement', review: 'Review', coupon: 'Offer',
  account: 'Account', system: 'iVanta',
};

export default function NotificationsPage() {
  const { items, loading, markRead, markAllRead, unread } = useNotifications(true);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">Notifications</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Order, delivery, return and refund updates — {unread} unread.
          </p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={() => void markAllRead()}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Bell} title="No notifications yet"
            description="Updates about your orders, deliveries, returns and refunds will appear here." />
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((n) => {
            const inner = (
              <>
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-line-strong' : 'bg-accent')} />
                  <p className="text-[13.5px] font-semibold text-ink">{n.title ?? 'Update'}</p>
                  <span className="ml-auto shrink-0 text-[11px] text-ink-faint">{timeAgo(n.createdAt)}</span>
                </div>
                {n.body && <p className="mt-1 pl-4 text-[12.5px] leading-relaxed text-ink-soft">{n.body}</p>}
                <p className="mt-1 pl-4 text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
                  {TYPE_LABEL[n.type] ?? n.type}
                </p>
              </>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} onClick={() => void markRead(n.id)}
                    className={cn('block rounded-2xl border border-line bg-white px-4 py-3 transition-colors hover:bg-surface-sunk', !n.isRead && 'border-accent/30 bg-accent-soft/40')}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={() => void markRead(n.id)}
                    className={cn('block w-full rounded-2xl border border-line bg-white px-4 py-3 text-left transition-colors hover:bg-surface-sunk', !n.isRead && 'border-accent/30 bg-accent-soft/40')}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
