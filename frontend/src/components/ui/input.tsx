import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-xl border border-line-strong bg-white px-3.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:bg-surface-sunk disabled:text-ink-faint',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('min-h-[92px] w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export function Label({ children, htmlFor, required, className }: { children: React.ReactNode; htmlFor?: string; required?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 block text-[13px] font-medium text-ink-soft', className)}>
      {children} {required && <span className="text-danger">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] font-medium text-danger" role="alert">{message}</p>;
}

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn('h-10 w-full appearance-none rounded-xl border border-line-strong bg-white px-3.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export function Checkbox({ label, checked, onChange, id }: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft select-none">
      <span
        id={id}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked); } }}
        onClick={() => onChange(!checked)}
        className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors', checked ? 'border-accent bg-accent text-white' : 'border-line-strong bg-white')}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </span>
      <span onClick={() => onChange(!checked)}>{label}</span>
    </label>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-success' : 'bg-line-strong')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export function RadioPill<T extends string>({ options, value, onChange, name }: { options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
            value === o.value ? 'border-ink bg-ink text-white shadow-soft' : 'border-line-strong bg-white text-ink-soft hover:border-ink/40',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
