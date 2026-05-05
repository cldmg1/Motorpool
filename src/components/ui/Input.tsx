import { type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl outline-none focus:ring-2 focus:ring-mp-blue text-sm transition-all ${error ? 'ring-2 ring-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  )
}
