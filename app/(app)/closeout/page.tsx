'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Banknote, Building2, Smartphone, Share2 } from 'lucide-react'
import { db } from '@/lib/db'
import type { Sale, Expense, PaymentMethod } from '@/lib/schema'
import { formatRWF, cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession, useCan } from '@/lib/permissions-context'

// ─── helpers ───────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isSameDay(dateStr: string | undefined, day: Date): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  )
}

function isToday(day: Date): boolean {
  return isSameDay(day.toISOString(), new Date())
}

function formatDayLabel(day: Date): string {
  if (isToday(day)) return 'Today'
  return day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatFullDay(day: Date): string {
  return day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const METHODS: { value: PaymentMethod; label: string; Icon: typeof Banknote; color: string; bg: string }[] = [
  { value: 'Cash', label: 'Cash', Icon: Banknote, color: '#00A862', bg: '#DFFBEF' },
  { value: 'Bank', label: 'Bank', Icon: Building2, color: '#0369A1', bg: '#E0F2FE' },
  { value: 'Phone (MoMo)', label: 'MoMo', Icon: Smartphone, color: '#C026D3', bg: '#FAE8FF' },
]

// ─── page ──────────────────────────────────────────────────────────────────────

export default function CloseoutPage() {
  const router = useRouter()
  const session = useSession()
  const canView = useCan('canViewSales')

  useEffect(() => {
    if (session && !canView) router.replace('/dashboard')
  }, [session, canView, router])

  const [day, setDay] = useState<Date>(() => startOfDay(new Date()))

  const { data, isLoading } = db.useQuery({ sales: {}, expenses: {} })
  const allSales = useMemo(() => (data?.sales ?? []) as Sale[], [data?.sales])
  const allExpenses = useMemo(() => (data?.expenses ?? []) as Expense[], [data?.expenses])

  const summary = useMemo(() => {
    const daySales = allSales.filter((s) => isSameDay(s.date, day))
    const dayExpenses = allExpenses.filter((e) => isSameDay(e.date, day))

    const revenue = daySales.reduce((a, s) => a + (s.totalAmount ?? 0), 0)
    const collected = daySales.reduce((a, s) => a + (s.amountPaid ?? 0), 0)
    const newDebt = Math.max(0, revenue - collected)
    const expenses = dayExpenses.reduce((a, e) => a + e.amount, 0)

    // Collected money split by how it was taken in.
    const byMethod: Record<PaymentMethod, number> = { Cash: 0, Bank: 0, 'Phone (MoMo)': 0 }
    for (const s of daySales) {
      const method = (s.paymentMethod ?? 'Cash') as PaymentMethod
      byMethod[method] = (byMethod[method] ?? 0) + (s.amountPaid ?? 0)
    }

    const cashIn = byMethod['Cash']
    const expectedTill = cashIn - expenses

    return { count: daySales.length, revenue, collected, newDebt, expenses, byMethod, expectedTill }
  }, [allSales, allExpenses, day])

  function shiftDay(deltaDays: number) {
    setDay((prev) => {
      const next = new Date(prev)
      next.setDate(next.getDate() + deltaDays)
      return startOfDay(next)
    })
  }

  function shareSummary() {
    const lines = [
      `*End of Day — ${formatFullDay(day)}*`,
      ``,
      `Sales: ${summary.count}`,
      `Revenue: ${formatRWF(summary.revenue)}`,
      `Collected: ${formatRWF(summary.collected)}`,
      `New debt: ${formatRWF(summary.newDebt)}`,
      `Expenses: ${formatRWF(summary.expenses)}`,
      ``,
      `Cash: ${formatRWF(summary.byMethod['Cash'])}`,
      `Bank: ${formatRWF(summary.byMethod['Bank'])}`,
      `MoMo: ${formatRWF(summary.byMethod['Phone (MoMo)'])}`,
      ``,
      `Expected cash in till: ${formatRWF(summary.expectedTill)}`,
    ]
    const text = encodeURIComponent(lines.join('\n'))
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const atToday = isToday(day)

  return (
    <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
      <PageHeader title="End of Day" />

      {/* Day selector */}
      <div className="px-4 lg:px-8 pb-3">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-[#F0EEFF] shadow-[0_2px_8px_rgba(108,99,255,0.07)] px-2 h-12 lg:max-w-md">
          <button
            onClick={() => shiftDay(-1)}
            aria-label="Previous day"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6C63FF] bg-[#EEEDFF] active:scale-90 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[15px] font-bold text-[#1A1733]">{formatDayLabel(day)}</p>
            {!atToday && <p className="text-[11px] text-[#6B6889] -mt-0.5">{formatFullDay(day)}</p>}
          </div>
          <button
            onClick={() => shiftDay(1)}
            aria-label="Next day"
            disabled={atToday}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
              atToday ? 'text-[#C9C6E4] bg-[#F3F2FB]' : 'text-[#6C63FF] bg-[#EEEDFF] active:scale-90'
            )}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-8 pb-4 flex flex-col gap-4 lg:max-w-3xl">
        {isLoading ? (
          <>
            <Skeleton className="h-28" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          </>
        ) : (
          <>
            {/* Expected cash in till — hero */}
            <div
              className="rounded-3xl px-5 py-6"
              style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)' }}
            >
              <p className="text-[13px] font-semibold text-white/75 uppercase tracking-wider">
                Expected cash in till
              </p>
              <p className="text-[36px] font-extrabold text-white tabular-nums leading-tight mt-1">
                {formatRWF(summary.expectedTill)}
              </p>
              <p className="text-[12px] text-white/70 mt-1">
                Cash sales {formatRWF(summary.byMethod['Cash'])} − expenses {formatRWF(summary.expenses)}
              </p>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Sales" value={String(summary.count)} color="blue" />
              <StatCard label="Revenue" value={formatRWF(summary.revenue)} color="green" />
              <StatCard label="Collected" value={formatRWF(summary.collected)} color="green" />
              <StatCard label="New Debt" value={formatRWF(summary.newDebt)} color="orange" />
            </div>

            {/* Payment breakdown */}
            <Card>
              <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-widest mb-3">
                Money collected by method
              </p>
              <div className="flex flex-col gap-2.5">
                {METHODS.map(({ value, label, Icon, color, bg }) => (
                  <div key={value} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: bg, color }}
                    >
                      <Icon size={17} />
                    </div>
                    <span className="flex-1 text-[15px] font-medium text-[#1A1733]">{label}</span>
                    <span className="text-[15px] font-bold text-[#1A1733] tabular-nums">
                      {formatRWF(summary.byMethod[value])}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Expenses note */}
            <div className="flex items-center justify-between bg-[#FFF4DB] border border-[#FFB020]/20 rounded-2xl px-4 py-3">
              <span className="text-[14px] font-semibold text-[#C07A10]">Expenses paid (cash out)</span>
              <span className="text-[15px] font-bold text-[#C07A10] tabular-nums">
                {formatRWF(summary.expenses)}
              </span>
            </div>

            {/* Share */}
            <button
              onClick={shareSummary}
              className="w-full h-[52px] rounded-2xl border-2 border-[#6C63FF] text-[#6C63FF] text-[16px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] active:bg-[#EEEDFF] transition-all"
            >
              <Share2 size={17} /> Share summary on WhatsApp
            </button>
          </>
        )}
      </div>
    </div>
  )
}
