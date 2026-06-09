'use client'

import { cn } from '@/lib/utils'

export type Period = 'Today' | 'Week' | 'Month' | 'Year' | 'All'
export const PERIODS: Period[] = ['Today', 'Week', 'Month', 'Year', 'All']

export function getPeriodRange(period: Period): { from: Date; to: Date } | null {
  if (period === 'All') return null
  const now = new Date()
  const to = new Date(now)
  to.setHours(23, 59, 59, 999)
  const from = new Date(now)
  from.setHours(0, 0, 0, 0)

  if (period === 'Today') return { from, to }
  if (period === 'Week') {
    from.setDate(now.getDate() - now.getDay())
    return { from, to }
  }
  if (period === 'Month') {
    from.setDate(1)
    return { from, to }
  }
  if (period === 'Year') {
    from.setMonth(0, 1)
    return { from, to }
  }
  return null
}

export function isInRange(dateStr: string | undefined, range: { from: Date; to: Date } | null): boolean {
  if (!range) return true
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d >= range.from && d <= range.to
}

interface DateRangeFilterProps {
  value: Period
  onChange: (p: Period) => void
  className?: string
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  return (
    <div className={cn('overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]', className)}>
      <div className="flex gap-2 px-4 pb-3 w-max">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'h-[36px] px-4 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all active:scale-95',
              p === value
                ? 'text-white shadow-[0_3px_10px_rgba(108,99,255,0.25)]'
                : 'bg-white border border-[#E8E6F5] text-[#6B6889]'
            )}
            style={p === value ? { background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' } : {}}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
