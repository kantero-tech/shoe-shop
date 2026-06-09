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
  default: 'bg-[#E8E6F5] text-[#1A1733]',
  blue: 'bg-[#EEEDFF] text-[#6C63FF]',
  green: 'bg-[#DFFBEF] text-[#007A50]',
  red: 'bg-[#FFE5EB] text-[#CC1234]',
  orange: 'bg-[#FFF4DB] text-[#C07A10]',
  purple: 'bg-[#EDE9FF] text-[#7C3AED]',
  gray: 'bg-[#F5F4FF] text-[#6B6889]',
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
