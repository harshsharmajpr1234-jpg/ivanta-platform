import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const tones = {
  neutral: 'bg-surface-sunk text-ink-soft border-line',
  accent: 'bg-accent-soft text-accent border-accent-border',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  dark: 'bg-ink text-white border-ink',
  outline: 'bg-white text-ink-soft border-line-strong',
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = 'neutral', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide', tones[tone], className)}>{children}</span>;
}
