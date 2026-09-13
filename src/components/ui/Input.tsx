import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        className={[
          'w-full px-4 py-2.5 rounded-xl bg-paper-warm border text-ink',
          'placeholder:text-ink-muted/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper',
          error ? 'border-wine' : 'border-paper-deep',
          className,
        ].join(' ')}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-ink-muted">{hint}</p>
      )}
      {error && <p className="text-xs text-wine font-medium">{error}</p>}
    </div>
  );
}

/** Champ montant en euros avec suffixe € */
export function AmountInput({
  label,
  value,
  onChange,
  error,
  ...props
}: Omit<InputProps, 'type' | 'onChange'> & {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      label={label}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0,00"
      error={error}
      {...props}
    />
  );
}
