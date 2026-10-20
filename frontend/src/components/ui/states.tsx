import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Inbox, RefreshCw, SearchX, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StateProps { icon?: LucideIcon; title?: string; description?: string; action?: React.ReactNode; className?: string }

function Shell({ icon: Icon = Inbox, title, description, action, className, tone }: StateProps & { tone: 'neutral' | 'danger' | 'success' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl3 border border-dashed border-line-strong bg-surface px-6 py-14 text-center', className)}>
      <div className={cn('flex h-14 w-14 items-center justify-center rounded-full', tone === 'danger' ? 'bg-danger-soft text-danger' : tone === 'success' ? 'bg-success-soft text-success' : 'bg-surface-sunk text-ink-muted')}>
        <Icon className="h-6 w-6" />
      </div>
      {title && <h3 className="mt-4 text-[15px] font-semibold text-ink">{title}</h3>}
      {description && <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const EmptyState = (p: StateProps) => <Shell tone="neutral" icon={p.icon ?? Inbox} {...p} />;
export const NoResultsState = (p: StateProps) => <Shell tone="neutral" icon={p.icon ?? SearchX} {...p} />;
export const SuccessState = (p: StateProps) => <Shell tone="success" icon={p.icon ?? CheckCircle2} {...p} />;

export function ErrorState({ title = 'Something went wrong', description = 'We could not complete this request. Please try again.', onRetry, className, icon }: StateProps & { onRetry?: () => void }) {
  return (
    <Shell
      tone="danger"
      icon={icon ?? AlertTriangle}
      title={title}
      description={description}
      className={className}
      action={onRetry ? <Button variant="secondary" size="md" onClick={onRetry}><RefreshCw className="h-4 w-4" /> Try again</Button> : undefined}
    />
  );
}

export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState icon={WifiOff} title="Network error" description="You appear to be offline. Check your connection and try again." onRetry={onRetry} />;
}
