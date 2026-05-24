'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { db } from '@/lib/db'
import type { Sale, StockItem, Expense } from '@/lib/schema'
import { filterByPeriod, formatRWF, formatDateShort, formatCount, calcExpenseForPeriod } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'

// ─── types ───────────────────────────────────────────────────────────────────

type Period = 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time'

const PERIODS: Period[] = ['Today', 'This Week', 'This Month', 'This Year', 'All Time']

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30']

// ─── helpers ─────────────────────────────────────────────────────────────────

function todaySubtitle(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getLast7Days(): { date: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    }
  })
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-ios-fill-secondary dark:bg-[#2C2C2E] rounded-2xl', className)} />
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  )
}

function SaleRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex flex-col gap-2 flex-1 mr-4">
        <Skeleton className="h-3.5 w-32 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
      <Skeleton className="h-4 w-20 rounded-md" />
    </div>
  )
}

const SaleRow = /*#__PURE__*/ React.memo(function SaleRow({ sale, isLast }: { sale: Sale; isLast: boolean }) {
  const debt = (sale.totalAmount ?? 0) - (sale.amountPaid ?? 0)
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3',
        !isLast && 'border-b border-ios-separator/10'
      )}
    >
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
        <p className="text-[15px] font-semibold text-ios-label truncate">
          {[sale.brand, sale.color].filter(Boolean).join(' · ')}
        </p>
        <p className="text-[13px] text-ios-label-secondary">
          {sale.paymentMethod ?? 'Cash'} · {formatDateShort(sale.date)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="text-[15px] font-bold text-ios-label">{formatRWF(sale.totalAmount ?? 0)}</p>
        {!sale.isPaid && debt > 0 && <Badge variant="red">Debt</Badge>}
      </div>
    </div>
  )
})

// ─── page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('This Month')
  const [chartMetric, setChartMetric] = useState<'revenue' | 'profit' | 'collected'>('revenue')

  const { data, isLoading } = db.useQuery({ stockItems: {}, sales: {}, expenses: {} })

  const sales = useMemo(() => (data?.sales ?? []) as Sale[], [data])
  const stockItems = useMemo(() => (data?.stockItems ?? []) as StockItem[], [data])
  const expenses = useMemo(() => (data?.expenses ?? []) as Expense[], [data])

  // ── filtered sales for period ──
  const filteredSales = useMemo(
    () => filterByPeriod(sales, period, 'date'),
    [sales, period]
  )

  // ── stats ──
  const revenue = useMemo(
    () => filteredSales.reduce((acc, s) => acc + (s.totalAmount ?? 0), 0),
    [filteredSales]
  )

  const grossProfit = useMemo(
    () =>
      filteredSales.reduce(
        (acc, s) => acc + ((s.totalAmount ?? 0) - (s.buyPrice ?? 0) * (s.qty ?? 0)),
        0
      ),
    [filteredSales]
  )

  const collected = useMemo(
    () => filteredSales.reduce((acc, s) => acc + (s.amountPaid ?? 0), 0),
    [filteredSales]
  )

  // Total expenses in selected period (including recurring logic)
  const periodExpenses = useMemo(
    () => expenses.reduce((acc, exp) => acc + calcExpenseForPeriod(exp, period), 0),
    [expenses, period]
  )

  // Net Profit = Gross Profit - Total Expenses
  const netProfit = useMemo(() => grossProfit - periodExpenses, [grossProfit, periodExpenses])

  // outstanding debts are always across ALL time
  const outstanding = useMemo(
    () =>
      sales.reduce(
        (acc, s) => (!s.isPaid ? acc + (s.totalAmount ?? 0) - (s.amountPaid ?? 0) : acc),
        0
      ),
    [sales]
  )

  // ── stock values ──
  const sellValue = useMemo(
    () => stockItems.reduce((acc, s) => acc + s.sellPrice * s.qty, 0),
    [stockItems]
  )
  const costValue = useMemo(
    () => stockItems.reduce((acc, s) => acc + s.buyPrice * s.qty, 0),
    [stockItems]
  )
  const pairsLeft = useMemo(
    () => stockItems.reduce((acc, s) => acc + s.qty, 0),
    [stockItems]
  )

  // Helper to compute cash expenses for a specific day string (YYYY-MM-DD)
  const getExpensesForDay = useCallback((dateStr: string) => {
    return expenses.reduce((acc, exp) => {
      const expDate = new Date(exp.date)
      const targetDate = new Date(dateStr)

      // If future start, does not apply
      if (expDate > targetDate) return acc

      // Cash basis for one-time
      if (!exp.isRecurring || exp.frequency === 'one-time') {
        const isSameDay = expDate.toDateString() === targetDate.toDateString()
        return acc + (isSameDay ? exp.amount : 0)
      }

      // Prorated daily rates for recurring
      if (exp.frequency === 'daily') return acc + exp.amount
      if (exp.frequency === 'weekly') return acc + (exp.amount / 7)
      if (exp.frequency === 'monthly') return acc + (exp.amount / 30)

      return acc
    }, 0)
  }, [expenses])

  // ── 7-day chart data calculation (deducts dynamic expenses for profit) ──
  const chartData = useMemo(() => {
    const days = getLast7Days()
    return days.map(({ date, label }) => {
      const daySales = sales.filter((s) => (s.date ?? '').startsWith(date))
      const dayRevenue = daySales.reduce((acc, s) => acc + (s.totalAmount ?? 0), 0)
      const dayCollected = daySales.reduce((acc, s) => acc + (s.amountPaid ?? 0), 0)
      const dayGrossProfit = daySales.reduce(
        (acc, s) => acc + ((s.totalAmount ?? 0) - (s.buyPrice ?? 0) * (s.qty ?? 0)),
        0
      )
      const dayExpenses = getExpensesForDay(date)

      return {
        label,
        revenue: dayRevenue,
        collected: dayCollected,
        profit: dayGrossProfit - dayExpenses,
      }
    })
  }, [sales, getExpensesForDay])

  // Donut chart: top brand sales distribution
  const brandData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredSales.forEach((s) => {
      const b = s.brand || 'Unknown'
      counts[b] = (counts[b] || 0) + (s.totalAmount ?? 0)
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [filteredSales])

  // Collection efficiency rate
  const collectionRate = useMemo(() => {
    return revenue > 0 ? Math.min(100, Math.round((collected / revenue) * 100)) : 0
  }, [revenue, collected])

  // Active color mapping for graph
  const activeColor = useMemo(() => {
    if (chartMetric === 'revenue') return '#34C759'
    if (chartMetric === 'profit') return netProfit >= 0 ? '#30D158' : '#FF453A'
    return '#007AFF'
  }, [chartMetric, netProfit])

  // ── recent sales (newest first, max 20) ──
  const recentSales = useMemo(
    () =>
      [...sales]
        .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
        .slice(0, 20),
    [sales]
  )

  return (
    <div className="min-h-screen bg-ios-bg pb-36">
      {/* Header */}
      <PageHeader title="My Shop" subtitle={todaySubtitle()} />

      {/* Period selector */}
      <div className="overflow-x-auto px-4 pb-3">
        <div className="flex gap-2 w-max">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'h-[44px] px-4 rounded-full text-[15px] font-medium whitespace-nowrap',
                'transition-all duration-200 active:scale-95',
                p === period
                  ? 'bg-ios-blue text-white shadow-sm'
                  : 'bg-ios-fill-secondary text-ios-label dark:bg-[#2C2C2E]'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Stats grid */}
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Revenue"
              value={formatRWF(revenue)}
              color="green"
              onClick={() => setChartMetric('revenue')}
              active={chartMetric === 'revenue'}
              className="cursor-pointer"
            />
            <StatCard
              label="Net Profit"
              value={formatRWF(netProfit)}
              color={netProfit >= 0 ? 'green' : 'red'}
              onClick={() => setChartMetric('profit')}
              active={chartMetric === 'profit'}
              className="cursor-pointer"
              subLabel={`Exp: ${formatRWF(periodExpenses)}`}
            />
            <StatCard
              label="Collected"
              value={formatRWF(collected)}
              color="blue"
              onClick={() => setChartMetric('collected')}
              active={chartMetric === 'collected'}
              className="cursor-pointer"
            />
            <StatCard
              label="Outstanding"
              value={formatRWF(outstanding)}
              subLabel="All time"
              color="orange"
            />
          </div>
        )}

        {/* 7-day Area chart with smooth visual style */}
        {isLoading ? (
          <Skeleton className="h-36" />
        ) : (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-ios-label-secondary uppercase tracking-wider">
                Last 7 Days ({chartMetric.toUpperCase()})
              </p>
              <div className="flex gap-2 text-[11px] font-semibold text-ios-label-secondary">
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={cn(chartMetric === 'revenue' && 'text-ios-green')}
                >
                  Revenue
                </button>
                <span>·</span>
                <button
                  onClick={() => setChartMetric('profit')}
                  className={cn(chartMetric === 'profit' && 'text-ios-green')}
                >
                  Net Profit
                </button>
                <span>·</span>
                <button
                  onClick={() => setChartMetric('collected')}
                  className={cn(chartMetric === 'collected' && 'text-ios-blue')}
                >
                  Collected
                </button>
              </div>
            </div>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={activeColor} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#8E8E93', fontWeight: 500 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-separator)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-card)',
                      color: 'var(--color-label)',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderWidth: '1px',
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [formatRWF(Number(value) || 0), chartMetric.toUpperCase()]}
                    labelStyle={{ color: '#8E8E93', fontWeight: 'normal' }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={activeColor}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMetric)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Collection rate progress card */}
        {!isLoading && (
          <Card>
            <p className="text-[12px] font-semibold text-ios-label-secondary uppercase tracking-wider mb-2">
              Collection Efficiency
            </p>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                {/* SVG circular progress indicator */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className="stroke-ios-fill dark:stroke-[#2C2C2E]"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className="stroke-ios-blue transition-all duration-700 ease-out"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - collectionRate / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[13px] font-bold text-ios-label tabular-nums">
                  {collectionRate}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-ios-label">
                  {collectionRate >= 80 ? 'Excellent collection!' : 'Payments pending'}
                </p>
                <p className="text-[13px] text-ios-label-secondary mt-0.5 leading-snug">
                  You have collected {formatRWF(collected)} out of {formatRWF(revenue)} total revenue this period.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Brand distribution pie chart */}
        {!isLoading && (
          <Card>
            <p className="text-[12px] font-semibold text-ios-label-secondary uppercase tracking-wider mb-3">
              Sales by Brand ({period})
            </p>
            {brandData.length === 0 ? (
              <p className="text-center text-[13px] text-ios-label-secondary py-6">No brand sales data</p>
            ) : (
              <div className="flex items-center gap-6">
                <div style={{ width: 100, height: 100 }} className="shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={brandData}
                        innerRadius={28}
                        outerRadius={45}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {brandData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  {brandData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-semibold text-ios-label truncate">{item.name}</span>
                      </div>
                      <span className="text-ios-label-secondary shrink-0 tabular-nums font-medium">
                        {formatRWF(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Stock value card */}
        {isLoading ? (
          <Skeleton className="h-28" />
        ) : (
          <Card>
            <p className="text-[12px] font-semibold text-ios-label-secondary uppercase tracking-wider mb-3">
              Stock Overview
            </p>
            <div className="grid grid-cols-3 divide-x divide-ios-separator/10">
              <StockMetric label="Sell Value" value={formatRWF(sellValue)} />
              <StockMetric label="Cost Value" value={formatRWF(costValue)} className="px-3" />
              <StockMetric
                label="Pairs Left"
                value={formatCount(pairsLeft)}
                valueColor="var(--color-blue)"
                className="pl-3"
              />
            </div>
          </Card>
        )}

        {/* Recent sales */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[22px] font-bold text-ios-label">Recent Sales</p>
            {!isLoading && (
              <Badge variant="gray">{formatCount(filteredSales.length)}</Badge>
            )}
          </div>

          {isLoading ? (
            <Card padding="none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={cn(i < 4 && 'border-b border-ios-separator/10')}>
                  <SaleRowSkeleton />
                </div>
              ))}
            </Card>
          ) : recentSales.length === 0 ? (
            <Card>
              <p className="text-center text-[15px] text-ios-label-secondary py-8">No sales yet</p>
            </Card>
          ) : (
            <Card padding="none">
              {recentSales.map((sale, idx) => (
                <SaleRow key={sale.id} sale={sale} isLast={idx === recentSales.length - 1} />
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface StockMetricProps {
  label: string
  value: string
  valueColor?: string
  className?: string
}

function StockMetric({ label, value, valueColor = 'var(--color-label)', className }: StockMetricProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <p className="text-[11px] font-medium text-ios-label-secondary uppercase tracking-wide">{label}</p>
      <p className="text-[17px] font-bold leading-tight" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  )
}
