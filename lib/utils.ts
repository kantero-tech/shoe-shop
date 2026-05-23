import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatRWF(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} RWF`
}

export function formatDateShort(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

type Period = 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time'

export function filterByPeriod<T>(
  items: T[],
  period: Period,
  dateKey: keyof T
): T[] {
  if (period === 'All Time') return items

  const now = new Date()
  const startOf = (unit: 'day' | 'week' | 'month' | 'year'): Date => {
    const d = new Date(now)
    if (unit === 'day') {
      d.setHours(0, 0, 0, 0)
    } else if (unit === 'week') {
      const day = d.getDay()
      d.setDate(d.getDate() - day)
      d.setHours(0, 0, 0, 0)
    } else if (unit === 'month') {
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
    } else {
      d.setMonth(0, 1)
      d.setHours(0, 0, 0, 0)
    }
    return d
  }

  const cutoffs: Record<Exclude<Period, 'All Time'>, Date> = {
    Today: startOf('day'),
    'This Week': startOf('week'),
    'This Month': startOf('month'),
    'This Year': startOf('year'),
  }

  const cutoff = cutoffs[period as Exclude<Period, 'All Time'>]

  return items.filter((item) => {
    const raw = item[dateKey]
    const date = raw instanceof Date ? raw : new Date(raw as string)
    return date >= cutoff
  })
}

interface SaleItem {
  totalAmount: number
  buyPrice: number
  qty: number
}

export function calcProfit(sales: SaleItem[]): number {
  return sales.reduce((acc, sale) => acc + (sale.totalAmount - sale.buyPrice * sale.qty), 0)
}
