import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-pnu-blue to-pnu-blue-light text-white shadow-md hover:opacity-95',
  secondary: 'bg-white text-pnu-text border border-pnu-border hover:bg-pnu-surface',
  ghost: 'bg-transparent text-pnu-muted hover:bg-pnu-surface hover:text-pnu-text',
  danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
}

export function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
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
  )
}
