'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/db'
import { useSession, useCan } from '@/lib/permissions-context'
import type { Sale, Expense } from '@/lib/schema'
import { formatRWF } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Period } from '@/components/ui/DateRangeFilter'
import { DateRangeFilter, getPeriodRange, isInRange } from '@/components/ui/DateRangeFilter'

// ─── helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

// ─── mini bar chart ───────────────────────────────────────────────────────────

function BarChart({
  data,
  colorRevenue,
  colorExpenses,
}: {
  data: { label: string; revenue: number; expenses: number }[]
  colorRevenue: string
  colorExpenses: string
}) {
  const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.expenses]), 1)
  return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-end gap-0.5 h-20 w-full">
            <div
              className="flex-1 rounded-t-md transition-all duration-700"
              style={{ height: `${(d.revenue / maxVal) * 100}%`, background: colorRevenue }}
            />
            <div
              className="flex-1 rounded-t-md transition-all duration-700"
              style={{ height: `${(d.expenses / maxVal) * 100}%`, background: colorExpenses }}
            />
          </div>
          <span className="text-[9px] text-[#6B6889] font-medium truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── stat row ─────────────────────────────────────────────────────────────────

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F5F4FF] last:border-0">
      <span className="text-[13px] text-[#6B6889]">{label}</span>
      <span className="text-[14px] font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── horizontal bar ───────────────────────────────────────────────────────────

function HBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[13px] font-semibold text-[#1A1733] truncate max-w-[60%]">{label}</span>
        <span className="text-[13px] font-bold text-[#1A1733]">{formatRWF(value)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#E8E6F5] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter()
  const session = useSession()
  const canView = useCan('canViewReports')
  const [period, setPeriod] = useState<Period>('Month')

  useEffect(() => {
    if (session && !canView) router.replace('/dashboard')
  }, [session, canView, router])

  const { data, isLoading } = db.useQuery({ sales: {}, expenses: {} })

  const allSales = useMemo(() => (data?.sales ?? []) as Sale[], [data])
  const allExpenses = useMemo(() => (data?.expenses ?? []) as Expense[], [data])

  const range = useMemo(() => getPeriodRange(period), [period])

  const sales = useMemo(() => allSales.filter((s) => isInRange(s.date, range)), [allSales, range])
  const expenses = useMemo(() => allExpenses.filter((e) => isInRange(e.date, range)), [allExpenses, range])

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalRevenue = useMemo(() => sales.reduce((a, s) => a + (s.totalAmount ?? 0), 0), [sales])
  const totalCollected = useMemo(() => sales.reduce((a, s) => a + (s.amountPaid ?? 0), 0), [sales])
  const totalExpenses = useMemo(() => expenses.reduce((a, e) => a + e.amount, 0), [expenses])
  const grossProfit = useMemo(() => sales.reduce((a, s) => a + ((s.sellPrice ?? 0) - (s.buyPrice ?? 0)) * (s.qty ?? 1), 0), [sales])
  const netProfit = grossProfit - totalExpenses
  const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0
  const debtOutstanding = totalRevenue - totalCollected

  // ── Monthly trend (last 6 months) ───────────────────────────────────────────
  const monthlyTrend = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number }> = {}
    for (const s of allSales) {
      if (!s.date) continue
      const key = getMonthLabel(s.date)
      if (!map[key]) map[key] = { revenue: 0, expenses: 0 }
      map[key].revenue += s.totalAmount ?? 0
    }
    for (const e of allExpenses) {
      if (!e.date) continue
      const key = getMonthLabel(e.date)
      if (!map[key]) map[key] = { revenue: 0, expenses: 0 }
      map[key].expenses += e.amount
    }
    const sorted = Object.entries(map)
      .sort(([a], [b]) => {
        const parse = (s: string) => { const [m, y] = s.split(' '); return Number(y) * 12 + MONTH_NAMES.indexOf(m) }
        return parse(a) - parse(b)
      })
      .slice(-6)
    return sorted.map(([label, v]) => ({ label: label.split(' ')[0], ...v }))
  }, [allSales, allExpenses])

  // ── Top brands ───────────────────────────────────────────────────────────────
  const topBrands = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of sales) {
      const key = s.brand ?? 'Unknown'
      map[key] = (map[key] ?? 0) + (s.totalAmount ?? 0)
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [sales])

  // ── Payment methods ──────────────────────────────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of sales) {
      const key = s.paymentMethod ?? 'Cash'
      map[key] = (map[key] ?? 0) + (s.totalAmount ?? 0)
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [sales])

  // ── Expense by category ──────────────────────────────────────────────────────
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of expenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [expenses])

  return (
    <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
      <PageHeader title="Reports" />

      <DateRangeFilter value={period} onChange={setPeriod} />

      <div className="px-4 lg:px-8 flex flex-col gap-4 pb-4">

        {/* KPI grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: 'Revenue', value: formatRWF(totalRevenue), color: '#00C26F' },
              { label: 'Collected', value: formatRWF(totalCollected), color: '#6C63FF' },
              { label: 'Gross Profit', value: formatRWF(grossProfit), color: '#007A50' },
              { label: 'Expenses', value: formatRWF(totalExpenses), color: '#FF3D5A' },
              { label: 'Net Profit', value: formatRWF(netProfit), color: netProfit >= 0 ? '#00C26F' : '#FF3D5A' },
              { label: 'Outstanding', value: formatRWF(debtOutstanding), color: '#FFB020' },
            ].map(({ label, value, color }) => (
              <Card key={label} className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-widest">{label}</p>
                <p className="text-[18px] font-extrabold leading-tight" style={{ color }}>{value}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Monthly trend */}
        {!isLoading && monthlyTrend.length > 0 && (
          <Card>
            <p className="text-[12px] font-bold text-[#6B6889] uppercase tracking-widest mb-3">Revenue vs Expenses (6 months)</p>
            <BarChart data={monthlyTrend} colorRevenue="#6C63FF" colorExpenses="#FF3D5A" />
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[11px] text-[#6B6889]"><span className="w-2.5 h-2.5 rounded-sm bg-[#6C63FF]" />Revenue</span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#6B6889]"><span className="w-2.5 h-2.5 rounded-sm bg-[#FF3D5A]" />Expenses</span>
            </div>
          </Card>
        )}

        {/* Analysis grid (2-col on desktop) */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
        {/* Extra KPIs */}
        {!isLoading && (
          <Card>
            <p className="text-[12px] font-bold text-[#6B6889] uppercase tracking-widest mb-2">Summary</p>
            <StatRow label="Total Sales" value={String(sales.length)} color="#1A1733" />
            <StatRow label="Avg Sale Value" value={formatRWF(avgSale)} color="#6C63FF" />
            <StatRow label="Paid Sales" value={String(sales.filter((s) => s.isPaid).length)} color="#00C26F" />
            <StatRow label="Unpaid Sales" value={String(sales.filter((s) => !s.isPaid).length)} color="#FF3D5A" />
          </Card>
        )}

        {/* Top brands */}
        {!isLoading && topBrands.length > 0 && (
          <Card>
            <p className="text-[12px] font-bold text-[#6B6889] uppercase tracking-widest mb-3">Top Brands</p>
            <div className="flex flex-col gap-3">
              {topBrands.map(([brand, amount]) => (
                <HBar key={brand} label={brand} value={amount} total={totalRevenue} color="linear-gradient(90deg, #6C63FF, #8B5CF6)" />
              ))}
            </div>
          </Card>
        )}

        {/* Payment method breakdown */}
        {!isLoading && paymentBreakdown.length > 0 && (
          <Card>
            <p className="text-[12px] font-bold text-[#6B6889] uppercase tracking-widest mb-3">Payment Methods</p>
            <div className="flex flex-col gap-3">
              {paymentBreakdown.map(([method, amount]) => (
                <HBar key={method} label={method} value={amount} total={totalRevenue} color="linear-gradient(90deg, #00C26F, #00A85A)" />
              ))}
            </div>
          </Card>
        )}

        {/* Expense breakdown */}
        {!isLoading && expenseByCategory.length > 0 && (
          <Card>
            <p className="text-[12px] font-bold text-[#6B6889] uppercase tracking-widest mb-3">Expenses by Category</p>
            <div className="flex flex-col gap-3">
              {expenseByCategory.map(([cat, amount]) => (
                <HBar key={cat} label={cat} value={amount} total={totalExpenses} color="linear-gradient(90deg, #FF6B3D, #FF9240)" />
              ))}
            </div>
          </Card>
        )}

        </div>{/* end analysis grid */}

        {!isLoading && sales.length === 0 && expenses.length === 0 && (
          <Card>
            <p className="text-center text-[15px] text-[#6B6889] py-8">No data for this period</p>
          </Card>
        )}
      </div>
    </div>
  )
}
