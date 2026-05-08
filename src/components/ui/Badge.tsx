type Variant = 'blue' | 'orange' | 'green' | 'gray' | 'red' | 'amber'

const variants: Record<Variant, string> = {
  blue: 'bg-mp-blue text-white',
  orange: 'bg-mp-orange text-white',
  green: 'bg-green-500 text-white',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-100 text-red-600',
  amber: 'bg-amber-100 text-amber-700',
}

export default function Badge({
  children,
  variant = 'blue',
}: {
  children: React.ReactNode
  variant?: Variant
}) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  )
}
