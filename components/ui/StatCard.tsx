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
}

const colorMap: Record<StatCardColor, { value: string; bg: string; dot: string }> = {
  default: { value: 'text-[#1C1C1E]', bg: '', dot: 'bg-[#8E8E93]' },
  blue: { value: 'text-[#007AFF]', bg: 'bg-[#E3F0FF]', dot: 'bg-[#007AFF]' },
  green: { value: 'text-[#34C759]', bg: 'bg-[#E3F9EA]', dot: 'bg-[#34C759]' },
  red: { value: 'text-[#FF3B30]', bg: 'bg-[#FFE9E8]', dot: 'bg-[#FF3B30]' },
  orange: { value: 'text-[#FF9500]', bg: 'bg-[#FFF4E3]', dot: 'bg-[#FF9500]' },
  purple: { value: 'text-[#AF52DE]', bg: 'bg-[#F4E8FF]', dot: 'bg-[#AF52DE]' },
}

export function StatCard({
  label,
  value,
  subLabel,
  trend,
  color = 'default',
  className,
}: StatCardProps) {
  const styles = colorMap[color]
  const trendPositive = trend !== undefined && trend >= 0

  return (
    <Card className={cn('flex flex-col gap-1', className)}>
      <p className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide leading-none">
        {label}
      </p>
      <p className={cn('text-[28px] font-bold leading-tight', styles.value)}>{value}</p>
      <div className="flex items-center gap-2 mt-0.5">
        {trend !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[13px] font-semibold',
              trendPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'
            )}
          >
            {trendPositive ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
        {subLabel && (
          <span className="text-[13px] text-[#8E8E93]">{subLabel}</span>
        )}
      </div>
    </Card>
  )
}
