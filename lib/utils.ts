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



import type { Expense } from './schema'

export function calcExpenseForPeriod(
  expense: Expense,
  period: Period
): number {
  const expenseDate = new Date(expense.date)
  const now = new Date()

  // helper to get start date of period
  const getPeriodStart = (): Date => {
    const d = new Date(now)
    if (period === 'Today') {
      d.setHours(0, 0, 0, 0)
    } else if (period === 'This Week') {
      const day = d.getDay()
      d.setDate(d.getDate() - day)
      d.setHours(0, 0, 0, 0)
    } else if (period === 'This Month') {
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
    } else if (period === 'This Year') {
      d.setMonth(0, 1)
      d.setHours(0, 0, 0, 0)
    } else {
      return new Date(0) // All time
    }
    return d
  }

  const periodStart = getPeriodStart()

  // If the expense starts in the future relative to now, return 0
  if (expenseDate > now) return 0

  if (!expense.isRecurring || expense.frequency === 'one-time') {
    // One-time expense applies fully if it occurred in the period
    return expenseDate >= periodStart ? expense.amount : 0
  }

  // Recurring expenses:
  // 1. Daily expense:
  if (expense.frequency === 'daily') {
    const startDate = expenseDate > periodStart ? expenseDate : periodStart
    const msDiff = now.getTime() - startDate.getTime()
    const days = Math.max(1, Math.floor(msDiff / (1000 * 60 * 60 * 24)) + 1)
    return days * expense.amount
  }

  // 2. Weekly expense:
  if (expense.frequency === 'weekly') {
    if (period === 'Today') {
      return expense.amount / 7
    }
    const startDate = expenseDate > periodStart ? expenseDate : periodStart
    const msDiff = now.getTime() - startDate.getTime()
    const weeks = Math.max(1, Math.floor(msDiff / (1000 * 60 * 60 * 24 * 7)) + 1)
    return weeks * expense.amount
  }

  // 3. Monthly expense (e.g. Rent):
  if (expense.frequency === 'monthly') {
    if (period === 'Today') {
      return expense.amount / 30
    }
    if (period === 'This Week') {
      return (expense.amount / 30) * 7
    }

    const startDate = expenseDate > periodStart ? expenseDate : periodStart
    const yearsDiff = now.getFullYear() - startDate.getFullYear()
    const monthsDiff = now.getMonth() - startDate.getMonth()
    const totalMonths = Math.max(1, yearsDiff * 12 + monthsDiff + 1)
    return totalMonths * expense.amount
  }

  return 0
}

