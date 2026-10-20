'use client';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useLockScroll } from '@/hooks/use-lock-scroll';

interface SheetProps { open: boolean; onClose: () => void; side?: 'right' | 'bottom' | 'left'; title?: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }

export function Sheet({ open, onClose, side = 'right', title, children, footer, width = 'sm:max-w-[420px]' }: SheetProps) {
  useLockScroll(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'absolute flex flex-col bg-white shadow-pop',
          side === 'right' && cn('inset-y-0 right-0 w-full animate-slide-in-right', width),
          side === 'left' && cn('inset-y-0 left-0 w-full animate-slide-in-right', width),
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] animate-slide-up rounded-t-xl4',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          {side === 'bottom' && <div className="mx-auto absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line-strong" />}
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close panel" className="rounded-full p-1.5 text-ink-muted hover:bg-surface-sunk hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line bg-surface px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}
