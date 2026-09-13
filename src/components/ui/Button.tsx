import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-copper text-white hover:bg-copper-deep shadow-sm shadow-copper/20',
  secondary:
    'bg-paper-warm text-ink hover:bg-paper-deep border border-paper-deep',
  ghost: 'text-ink-muted hover:text-ink hover:bg-paper-warm',
  danger: 'bg-wine text-white hover:bg-wine/90',
};

export function Button({
  variant = 'primary',
  children,
  fullWidth,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={[
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
        'text-sm font-semibold transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        variants[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
