import { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-mp-orange hover:bg-mp-orange-dark text-white shadow-sm',
  secondary: 'bg-mp-blue hover:bg-mp-blue-dark text-white shadow-sm',
  ghost: 'bg-white hover:bg-gray-50 text-mp-blue border-2 border-mp-blue',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
}

export default function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
