'use client';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Steps({ steps, current, basePath }: { steps: readonly { href: string; label: string }[]; current: number; basePath?: string }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const inner = (
          <>
            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', done ? 'bg-success text-white' : active ? 'bg-ink text-white' : 'bg-surface-sunk text-ink-faint')}>
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn('whitespace-nowrap text-[12.5px] font-medium', active ? 'text-ink' : done ? 'text-ink-soft' : 'text-ink-faint')}>{s.label}</span>
          </>
        );
        return (
          <li key={s.href} className="flex items-center gap-1">
            {done && basePath ? <Link href={s.href} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-surface-sunk">{inner}</Link> : <span className="flex items-center gap-2 py-1 pl-1 pr-3">{inner}</span>}
            {i < steps.length - 1 && <span className={cn('h-px w-4 shrink-0 sm:w-8', done ? 'bg-success/50' : 'bg-line-strong')} />}
          </li>
        );
      })}
    </ol>
  );
}
