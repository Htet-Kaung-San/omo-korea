import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-pnu-text">
        {label}
      </label>
      <input
        id={inputId}
        className={[
          'w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-pnu-text outline-none transition',
          'placeholder:text-pnu-muted/70 focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20',
          error ? 'border-red-400' : 'border-pnu-border',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
