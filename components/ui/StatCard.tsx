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
  default: { value: 'text-[#1A1733]', bg: '', dot: 'bg-[#6B6889]' },
  blue: { value: 'text-[#6C63FF]', bg: 'bg-[#EEEDFF]', dot: 'bg-[#6C63FF]' },
  green: { value: 'text-[#00C26F]', bg: 'bg-[#DFFBEF]', dot: 'bg-[#00C26F]' },
  red: { value: 'text-[#FF3D5A]', bg: 'bg-[#FFE5EB]', dot: 'bg-[#FF3D5A]' },
  orange: { value: 'text-[#FFB020]', bg: 'bg-[#FFF4DB]', dot: 'bg-[#FFB020]' },
  purple: { value: 'text-[#7C3AED]', bg: 'bg-[#EDE9FF]', dot: 'bg-[#7C3AED]' },
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
    <Card className={cn('flex flex-col gap-1', styles.bg, className)}>
      <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-widest leading-none">
        {label}
      </p>
      <p className={cn('text-[26px] font-extrabold leading-tight', styles.value)}>{value}</p>
      <div className="flex items-center gap-2 mt-0.5">
        {trend !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[12px] font-bold',
              trendPositive ? 'text-[#00C26F]' : 'text-[#FF3D5A]'
            )}
          >
            {trendPositive ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
        {subLabel && (
          <span className="text-[12px] text-[#6B6889]">{subLabel}</span>
        )}
      </div>
    </Card>
  )
}
