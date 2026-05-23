import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'default'
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'purple'
  | 'gray'

type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'
type PaymentStatus = 'Paid' | 'Partial' | 'Debt'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#E5E5EA] text-[#1C1C1E]',
  blue: 'bg-[#E3F0FF] text-[#007AFF]',
  green: 'bg-[#E3F9EA] text-[#248A3D]',
  red: 'bg-[#FFE9E8] text-[#D70015]',
  orange: 'bg-[#FFF4E3] text-[#C93400]',
  purple: 'bg-[#F4E8FF] text-[#8944AB]',
  gray: 'bg-[#F2F2F7] text-[#8E8E93]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-[12px] font-semibold leading-5',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StockBadge({ status }: { status: StockStatus }) {
  const map: Record<StockStatus, BadgeVariant> = {
    'In Stock': 'green',
    'Low Stock': 'orange',
    'Out of Stock': 'red',
  }
  return <Badge variant={map[status]}>{status}</Badge>
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, BadgeVariant> = {
    Paid: 'green',
    Partial: 'orange',
    Debt: 'red',
  }
  return <Badge variant={map[status]}>{status}</Badge>
}
