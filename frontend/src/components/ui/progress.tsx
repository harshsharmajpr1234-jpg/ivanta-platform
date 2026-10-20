import { cn } from '@/lib/utils';

export function Progress({ value, className, tone = 'accent' }: { value: number; className?: string; tone?: 'accent' | 'success' | 'warning' }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all duration-500', tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-accent')} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function BatteryMeter({ health }: { health: number }) {
  const tone = health >= 90 ? 'success' : health >= 80 ? 'warning' : 'danger';
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Battery health ${health}%`}>
      <span className={cn('relative h-3.5 w-7 rounded-[4px] border', tone === 'success' ? 'border-success/50' : tone === 'warning' ? 'border-warning/50' : 'border-danger/50')}>
        <span className={cn('absolute inset-y-0.5 left-0.5 rounded-[2px]', tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-danger')} style={{ width: `${health * 0.86}%` }} />
        <span className={cn('absolute -right-[3px] top-1/2 h-1.5 w-[2px] -translate-y-1/2 rounded-r', tone === 'success' ? 'bg-success/50' : tone === 'warning' ? 'bg-warning/50' : 'bg-danger/50')} />
      </span>
      <span className={cn('text-[12px] font-semibold', tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-danger')}>{health}%</span>
    </span>
  );
}
