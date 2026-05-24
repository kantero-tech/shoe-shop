import { cn } from '@/lib/utils'
import { Card } from './Card'

type StatCardColor = 'default' | 'blue' | 'green' | 'red' | 'orange' | 'purple'

interface StatCardProps {
  label: string
  value: string
  subLabel?: string
  trend?: number
  color?: StatCardColor
  className?: string
  onClick?: () => void
  active?: boolean
}

const colorMap: Record<StatCardColor, { value: string; bg: string; dot: string }> = {
  default: { value: 'text-ios-label', bg: '', dot: 'bg-ios-label-secondary' },
  blue: { value: 'text-ios-blue', bg: 'bg-ios-blue-light', dot: 'bg-ios-blue' },
  green: { value: 'text-ios-green dark:text-[#30D158]', bg: 'bg-ios-green-light', dot: 'bg-ios-green' },
  red: { value: 'text-ios-red dark:text-[#FF453A]', bg: 'bg-ios-red-light', dot: 'bg-ios-red' },
  orange: { value: 'text-ios-orange dark:text-[#FF9F0A]', bg: 'bg-ios-orange-light', dot: 'bg-ios-orange' },
  purple: { value: 'text-ios-purple dark:text-[#BF5AF2]', bg: 'bg-ios-purple-light', dot: 'bg-ios-purple' },
}

export function StatCard({
  label,
  value,
  subLabel,
  trend,
  color = 'default',
  className,
  onClick,
  active,
}: StatCardProps) {
  const styles = colorMap[color]
  const trendPositive = trend !== undefined && trend >= 0

  return (
    <Card
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 transition-all duration-300',
        active && 'ring-2 ring-ios-blue shadow-lg scale-[1.02] bg-ios-blue-light/10',
        className
      )}
    >
      <p className="text-[13px] font-medium text-ios-label-secondary uppercase tracking-wide leading-none">
        {label}
      </p>
      <p className={cn('text-[28px] font-bold leading-tight', styles.value)}>{value}</p>
      <div className="flex items-center gap-2 mt-0.5">
        {trend !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[13px] font-semibold',
              trendPositive ? 'text-ios-green' : 'text-ios-red'
            )}
          >
            {trendPositive ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
        {subLabel && (
          <span className="text-[13px] text-ios-label-secondary">{subLabel}</span>
        )}
      </div>
    </Card>
  )
}

