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
    <div className={cn('overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] w-full', className)}>
      <div className="flex flex-row flex-nowrap gap-2 px-4 pb-3 w-max select-none">
        {PERIODS.map((p) => {
          const active = p === value
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                'h-[36px] px-4 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 border border-transparent',
                active
                  ? 'bg-ios-blue text-white shadow-sm'
                  : 'bg-ios-fill-secondary dark:bg-[#2C2C2E] text-ios-label-secondary hover:text-ios-label border-ios-separator/5 dark:border-white/[0.04]'
              )}
              style={active ? { background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' } : {}}
            >
              {p}
            </button>
          )
        })}
      </div>
    </div>
  )
}
