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
  default: 'bg-ios-fill-secondary text-ios-label',
  blue: 'bg-ios-blue-light text-ios-blue',
  green: 'bg-ios-green-light text-ios-green dark:text-[#30D158]',
  red: 'bg-ios-red-light text-ios-red dark:text-[#FF453A]',
  orange: 'bg-ios-orange-light text-ios-orange dark:text-[#FF9F0A]',
  purple: 'bg-ios-purple-light text-ios-purple dark:text-[#BF5AF2]',
  gray: 'bg-ios-fill text-ios-label-secondary dark:bg-[#2C2C2E]',
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
