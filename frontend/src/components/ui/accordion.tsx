'use client';
import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Accordion({ items, defaultOpen = 0, className }: { items: { id: string; title: ReactNode; content: ReactNode; badge?: ReactNode }[]; defaultOpen?: number | null; className?: string }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className={cn('divide-y divide-line rounded-xl3 border border-line bg-white', className)}>
      {items.map((it, i) => (
        <div key={it.id}>
          <button
            type="button"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="flex items-center gap-3 text-[14px] font-semibold text-ink">{it.title}{it.badge}</span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-muted transition-transform', open === i && 'rotate-180')} />
          </button>
          {open === i && <div className="animate-fade-in px-5 pb-5 text-[13.5px] leading-relaxed text-ink-soft">{it.content}</div>}
        </div>
      ))}
    </div>
  );
}
