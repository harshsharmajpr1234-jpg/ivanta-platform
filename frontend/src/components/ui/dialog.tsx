'use client';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useLockScroll } from '@/hooks/use-lock-scroll';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  useLockScroll(open);
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Handle escape key and initial focus ONLY when dialog opens
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);

    // Only set focus to container if activeElement is not already an input/element inside this dialog
    const activeEl = document.activeElement;
    const isFocusAlreadyInside = ref.current && activeEl && ref.current.contains(activeEl);
    if (!isFocusAlreadyInside) {
      ref.current?.focus();
    }

    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Dialog'}
    >
      <div className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl4 bg-white shadow-pop outline-none sm:animate-fade-up sm:rounded-xl4',
          size === 'sm' ? 'sm:max-w-md' : size === 'md' ? 'sm:max-w-lg' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-4xl',
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              {title && <h2 className="text-[16px] font-semibold text-ink">{title}</h2>}
              {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-line bg-surface px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}
