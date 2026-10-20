'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuthStore } from '@/store/auth';
import { cn, timeAgo } from '@/lib/utils';

export function NotificationBell() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const { items, loading, markRead, markAllRead, unread } = useNotifications(Boolean(user) && open);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        className="relative rounded-full p-2 text-ink transition-colors hover:bg-ink/5">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
        )}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="right" title="Notifications"
        footer={
          <div className="space-y-2">
            {items.some((n) => !n.isRead) && (
              <button type="button" onClick={() => void markAllRead()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-[13px] font-semibold text-white">
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            )}
            <Link href="/account/notifications" onClick={() => setOpen(false)}
              className="block text-center text-[12.5px] font-semibold text-accent hover:underline">
              See all notifications
            </Link>
          </div>
        }>
        {loading && items.length === 0 && <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>}
        {!loading && items.length === 0 && (
          <p className="py-10 text-center text-[13px] text-ink-muted">No notifications yet. Order and delivery updates will appear here.</p>
        )}
        <ul className="space-y-1">
          {items.map((n) => (
            <li key={n.id}>
              {n.link ? (
                <Link href={n.link} onClick={() => { void markRead(n.id); setOpen(false); }} className={blockCls(n.isRead)}>
                  <Inner n={n} />
                </Link>
              ) : (
                <button type="button" onClick={() => void markRead(n.id)} className={cn(blockCls(n.isRead), 'w-full text-left')}>
                  <Inner n={n} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

const blockCls = (read: boolean) => cn('block rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-sunk', !read && 'bg-accent-soft/60');

function Inner({ n }: { n: { type: string; title?: string | null; body?: string | null; isRead: boolean; createdAt: string } }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', n.isRead ? 'bg-line-strong' : 'bg-accent')} />
        <p className="text-[13px] font-semibold text-ink">{n.title ?? n.type.replaceAll('_', ' ')}</p>
      </div>
      {n.body && <p className="mt-0.5 pl-3.5 text-[12px] leading-relaxed text-ink-muted">{n.body}</p>}
      <p className="mt-1 pl-3.5 text-[10px] text-ink-faint">{timeAgo(n.createdAt)}</p>
    </>
  );
}
