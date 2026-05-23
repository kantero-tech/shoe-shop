'use client'

import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { db } from '@/lib/db'
import type { Sale, StockItem } from '@/lib/schema'
import { filterByPeriod, formatRWF, formatDateShort, formatCount } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'

// ─── types ───────────────────────────────────────────────────────────────────

type Period = 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time'

const PERIODS: Period[] = ['Today', 'This Week', 'This Month', 'This Year', 'All Time']

// ─── helpers ─────────────────────────────────────────────────────────────────

function todaySubtitle(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// legacy: use formatDateShort from utils for display

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
  return <div className={cn('animate-pulse bg-[#E5E5EA] rounded-2xl', className)} />
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
        !isLast && 'border-b border-[#F2F2F7]'
      )}
    >
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
        <p className="text-[15px] font-semibold text-[#1C1C1E] truncate">
          {[sale.brand, sale.color].filter(Boolean).join(' · ')}
        </p>
        <p className="text-[13px] text-[#8E8E93]">
          {sale.paymentMethod ?? 'Cash'} · {formatDateShort(sale.date)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="text-[15px] font-bold text-[#1C1C1E]">{formatRWF(sale.totalAmount ?? 0)}</p>
        {!sale.isPaid && debt > 0 && <Badge variant="red">Debt</Badge>}
      </div>
    </div>
  )
})

// ─── page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('This Month')

  const { data, isLoading } = db.useQuery({ stockItems: {}, sales: {} })

  const sales = useMemo(() => (data?.sales ?? []) as Sale[], [data])
  const stockItems = useMemo(() => (data?.stockItems ?? []) as StockItem[], [data])

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

  const profit = useMemo(
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

  // ── 7-day chart ──
  const chartData = useMemo(() => {
    const days = getLast7Days()
    return days.map(({ date, label }) => ({
      label,
      total: sales
        .filter((s) => (s.date ?? '').startsWith(date))
        .reduce((acc, s) => acc + (s.totalAmount ?? 0), 0),
    }))
  }, [sales])

  // ── recent sales (newest first, max 20) ──
  const recentSales = useMemo(
    () =>
      [...sales]
        .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
        .slice(0, 20),
    [sales]
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
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
                  ? 'bg-[#007AFF] text-white shadow-sm'
                  : 'bg-[#E5E5EA] text-[#1C1C1E]'
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
            <StatCard label="Revenue" value={formatRWF(revenue)} color="green" />
            <StatCard
              label="Profit"
              value={formatRWF(profit)}
              color={profit >= 0 ? 'green' : 'red'}
            />
            <StatCard label="Collected" value={formatRWF(collected)} color="blue" />
            <StatCard
              label="Outstanding"
              value={formatRWF(outstanding)}
              subLabel="All time"
              color="orange"
            />
          </div>
        )}

        {/* Stock value card */}
        {isLoading ? (
          <Skeleton className="h-28" />
        ) : (
          <Card>
            <p className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-3">
              Stock Overview
            </p>
            <div className="grid grid-cols-3 divide-x divide-[#F2F2F7]">
                <StockMetric label="Sell Value" value={formatRWF(sellValue)} />
              <StockMetric label="Cost Value" value={formatRWF(costValue)} className="px-3" />
              <StockMetric
                label="Pairs Left"
                value={formatCount(pairsLeft)}
                valueColor="#007AFF"
                className="pl-3"
              />
            </div>
          </Card>
        )}

        {/* 7-day bar chart */}
        {isLoading ? (
          <Skeleton className="h-36" />
        ) : (
          <Card>
            <p className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-3">
              Last 7 Days
            </p>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  barSize={24}
                  margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#8E8E93', fontWeight: 500 }}
                  />
                  <Bar dataKey="total" fill="#007AFF" radius={[5, 5, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Recent sales */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[22px] font-bold text-[#1C1C1E]">Recent Sales</p>
            {!isLoading && (
              <Badge variant="gray">{formatCount(filteredSales.length)}</Badge>
            )}
          </div>

          {isLoading ? (
            <Card padding="none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={cn(i < 4 && 'border-b border-[#F2F2F7]')}>
                  <SaleRowSkeleton />
                </div>
              ))}
            </Card>
          ) : recentSales.length === 0 ? (
            <Card>
              <p className="text-center text-[15px] text-[#8E8E93] py-8">No sales yet</p>
            </Card>
          ) : (
            <Card padding="none">
              {recentSales.map((sale, idx) => (
                <SaleRow key={sale.id} sale={sale} isLast={idx === recentSales.length - 1} />
              ))}
            </Card>
          )}
        </div>

        {/* Bottom breathing room */}
        <div className="h-4" />
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

function StockMetric({ label, value, valueColor = '#1C1C1E', className }: StockMetricProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <p className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wide">{label}</p>
      <p className="text-[17px] font-bold leading-tight" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  )
}
