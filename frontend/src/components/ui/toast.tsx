'use client';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';

const icons = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const tones = { success: 'text-success', error: 'text-danger', info: 'text-accent', warning: 'text-warning' };

export function ToastViewport() {
  const { toasts, dismiss } = useUIStore();
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[95] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:translate-x-0" aria-live="polite">
      {toasts.map((t) => {
        const Icon = icons[t.tone];
        return (
          <div key={t.id} className="pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl3 border border-line bg-white/95 px-4 py-3 shadow-pop backdrop-blur">
            <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', tones[t.tone])} />
            <div className="flex-1">
              <p className="text-[13.5px] font-semibold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[12.5px] leading-snug text-ink-muted">{t.description}</p>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="rounded p-0.5 text-ink-faint hover:text-ink"><X className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}
