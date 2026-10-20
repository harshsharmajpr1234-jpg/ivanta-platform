import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98] select-none',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-white hover:bg-black shadow-soft',
        accent: 'bg-accent text-white hover:bg-accent-hover shadow-soft',
        secondary: 'bg-white text-ink border border-line-strong hover:border-ink/40 hover:bg-surface-sunk',
        ghost: 'text-ink-soft hover:bg-surface-sunk hover:text-ink',
        subtle: 'bg-surface-sunk text-ink hover:bg-line/60',
        danger: 'bg-danger text-white hover:brightness-95',
        link: 'text-accent hover:underline px-0',
      },
      size: {
        sm: 'h-8 rounded-lg px-3 text-[13px]',
        md: 'h-10 rounded-xl px-4 text-sm',
        lg: 'h-12 rounded-full px-6 text-[15px]',
        pill: 'h-11 rounded-full px-6 text-sm',
        icon: 'h-10 w-10 rounded-full',
        iconSm: 'h-8 w-8 rounded-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, loading, children, disabled, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
    {loading && <Spinner className="h-4 w-4" />}
    {children}
  </button>
));
Button.displayName = 'Button';
export { buttonVariants };
