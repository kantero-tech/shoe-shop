'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { LogOut, ChevronRight, Users, Settings, AlertTriangle, Moon, Sun } from 'lucide-react'
import { db } from '@/lib/db'
import type { Sale, StockItem, Expense } from '@/lib/schema'
import { DAILY_TARGET_SETTING_ID } from '@/lib/schema'
import { filterByPeriod, formatRWF, formatDateShort, formatCount } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { clearSession } from '@/lib/auth'
import { useSession, useIsEmployer } from '@/lib/permissions-context'
import { useTheme } from '@/lib/theme-context'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

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
  return <div className={cn('animate-pulse bg-[#E8E6F5] rounded-2xl', className)} />
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
        !isLast && 'border-b border-[#F5F4FF]'
      )}
    >
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
        <p className="text-[15px] font-semibold text-[#1A1733] truncate">
          {[sale.brand, sale.color].filter(Boolean).join(' · ')}
        </p>
        <p className="text-[13px] text-[#6B6889]">
          {sale.paymentMethod ?? 'Cash'} · {formatDateShort(sale.date)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="text-[15px] font-bold text-[#1A1733]">{formatRWF(sale.totalAmount ?? 0)}</p>
        {!sale.isPaid && debt > 0 && <Badge variant="red">Debt</Badge>}
      </div>
    </div>
  )
})

// ─── page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const session = useSession()
  const isEmployer = useIsEmployer()
  const { theme, toggle: toggleTheme } = useTheme()
  const [period, setPeriod] = useState<Period>('This Month')
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState('')
  const [savingTarget, setSavingTarget] = useState(false)

  function handleLogout() {
    clearSession()
    router.replace('/login')
  }

  const { data, isLoading } = db.useQuery({ stockItems: {}, sales: {}, settings: {}, expenses: {} })

  const sales = useMemo(() => (data?.sales ?? []) as Sale[], [data])
  const stockItems = useMemo(() => (data?.stockItems ?? []) as StockItem[], [data])
  const expenses = useMemo(() => (data?.expenses ?? []) as Expense[], [data])

  const filteredSales = useMemo(
    () => filterByPeriod(sales, period, 'date'),
    [sales, period]
  )

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

  const filteredExpenses = useMemo(
    () => filterByPeriod(expenses, period, 'date'),
    [expenses, period]
  )

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((acc, e) => acc + e.amount, 0),
    [filteredExpenses]
  )

  const netProfit = grossProfit - totalExpenses

  const lowStockItems = useMemo(
    () => stockItems.filter((s) => s.qty <= (s.lowStockThreshold ?? 2)),
    [stockItems]
  )

  const collected = useMemo(
    () => filteredSales.reduce((acc, s) => acc + (s.amountPaid ?? 0), 0),
    [filteredSales]
  )

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

  const chartData = useMemo(() => {
    const days = getLast7Days()
    return days.map(({ date, label }) => ({
      label,
      total: sales
        .filter((s) => (s.date ?? '').startsWith(date))
        .reduce((acc, s) => acc + (s.totalAmount ?? 0), 0),
    }))
  }, [sales])

  const recentSales = useMemo(
    () =>
      [...sales]
        .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
        .slice(0, 20),
    [sales]
  )

  // Daily target
  const settings = useMemo(() => (data?.settings ?? []) as { id: string; key: string; value: string }[], [data])
  const dailyTargetRaw = settings.find((s) => s.id === DAILY_TARGET_SETTING_ID)?.value
  const dailyTarget = dailyTargetRaw ? parseFloat(dailyTargetRaw) : 0

  const todayRevenue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return sales
      .filter((s) => (s.date ?? '').startsWith(today))
      .reduce((a, s) => a + (s.totalAmount ?? 0), 0)
  }, [sales])

  const targetPct = dailyTarget > 0 ? Math.min(100, (todayRevenue / dailyTarget) * 100) : 0

  async function handleSaveTarget() {
    const val = parseFloat(targetInput)
    if (isNaN(val) || val <= 0) return
    setSavingTarget(true)
    try {
      await db.transact(
        db.tx.settings[DAILY_TARGET_SETTING_ID].update({ key: 'dailyTarget', value: String(val) })
      )
      setEditingTarget(false)
      setTargetInput('')
    } finally {
      setSavingTarget(false)
    }
  }

  return (
    <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <PageHeader
        title="My Shop"
        subtitle={session ? `${session.name} · ${todaySubtitle()}` : todaySubtitle()}
        action={
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition-all"
              style={{ background: 'var(--color-fill)', borderColor: 'var(--color-border)' }}
            >
              {theme === 'dark'
                ? <Sun size={17} style={{ color: 'var(--color-text-secondary)' }} />
                : <Moon size={17} style={{ color: 'var(--color-text-secondary)' }} />
              }
            </button>
            {isEmployer && (
              <Link
                href="/users"
                aria-label="Manage team"
                className="w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition-all"
                style={{ background: 'var(--color-fill)', borderColor: 'var(--color-border)' }}
              >
                <Users size={17} style={{ color: 'var(--color-text-secondary)' }} />
              </Link>
            )}
            {isEmployer && (
              <Link
                href="/settings"
                aria-label="Settings"
                className="w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition-all"
                style={{ background: 'var(--color-fill)', borderColor: 'var(--color-border)' }}
              >
                <Settings size={17} style={{ color: 'var(--color-text-secondary)' }} />
              </Link>
            )}
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition-all"
              style={{ background: 'var(--color-fill)', borderColor: 'var(--color-border)' }}
            >
              <LogOut size={17} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        }
      />

      {/* Period selector */}
      <div className="overflow-x-auto px-4 lg:px-8 pb-3 pt-1">
        <div className="flex gap-2 w-max">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'h-[40px] px-4 rounded-full text-[14px] font-semibold whitespace-nowrap',
                'transition-all duration-200 active:scale-95',
                p === period
                  ? 'text-white shadow-[0_4px_12px_rgba(108,99,255,0.30)]'
                  : 'bg-white border border-[#E8E6F5] text-[#6B6889]'
              )}
              style={p === period ? {
                background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)',
              } : {}}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-8 flex flex-col gap-4 lg:gap-5">
        {/* Low stock alert */}
        {!isLoading && lowStockItems.length > 0 && (
          <Link href="/stock">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#FFF4DB] border border-[#FFB020]/20">
              <AlertTriangle size={18} className="text-[#C07A10] shrink-0" />
              <p className="text-[13px] font-semibold text-[#C07A10] flex-1">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low or out of stock
              </p>
              <ChevronRight size={15} className="text-[#C07A10]" />
            </div>
          </Link>
        )}

        {/* Stats grid */}
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatCard label="Revenue" value={formatRWF(revenue)} color="green" />
            <StatCard label="Expenses" value={formatRWF(totalExpenses)} color="orange" />
            <StatCard label="Collected" value={formatRWF(collected)} color="blue" />
            {isEmployer && (
              <StatCard
                label="Net Profit"
                value={formatRWF(netProfit)}
                color={netProfit >= 0 ? 'green' : 'red'}
              />
            )}
          </div>
        )}

        {/* Analytics: chart (2 cols) + right rail (target, stock overview) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 lg:items-start">
          {/* 7-day bar chart */}
          {isLoading ? (
            <Skeleton className="h-36 lg:col-span-2 lg:h-[300px]" />
          ) : (
            <Card className="lg:col-span-2">
              <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-widest mb-3">
                Last 7 Days
              </p>
              <div className="h-[120px] lg:h-[252px]">
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
                      tick={{ fontSize: 11, fill: '#6B6889', fontWeight: 600 }}
                    />
                    <Bar dataKey="total" fill="#6C63FF" radius={[5, 5, 2, 2]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Right rail */}
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Daily Target card */}
            {!isLoading && (dailyTarget > 0 || isEmployer) && (
              <Card>
                <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-widest">Today&apos;s Target</p>
              {isEmployer && (
                <button
                  onClick={() => { setEditingTarget(!editingTarget); setTargetInput(dailyTarget > 0 ? String(dailyTarget) : '') }}
                  className="text-[12px] font-semibold text-[#6C63FF]"
                >
                  {editingTarget ? 'Cancel' : dailyTarget > 0 ? 'Edit' : 'Set Target'}
                </button>
              )}
            </div>

            {editingTarget ? (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label=""
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 500000"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleSaveTarget}
                  disabled={savingTarget}
                  className="h-11 px-4 rounded-xl text-white text-[14px] font-semibold mb-0.5 active:scale-95 transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
                >
                  Save
                </button>
              </div>
            ) : dailyTarget > 0 ? (
              <>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[22px] font-extrabold text-[#1A1733]">{formatRWF(todayRevenue)}</p>
                    <p className="text-[12px] text-[#6B6889]">of {formatRWF(dailyTarget)} target</p>
                  </div>
                  <p className="text-[24px] font-extrabold" style={{ color: targetPct >= 100 ? '#00C26F' : '#6C63FF' }}>
                    {Math.round(targetPct)}%
                  </p>
                </div>
                <div className="h-2 w-full rounded-full bg-[#E8E6F5] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${targetPct}%`,
                      background: targetPct >= 100
                        ? 'linear-gradient(90deg, #00C26F, #00E080)'
                        : 'linear-gradient(90deg, #6C63FF, #8B5CF6)',
                    }}
                  />
                </div>
                {targetPct >= 100 && (
                  <p className="text-[12px] font-semibold text-[#00C26F] mt-1.5">Target reached!</p>
                )}
              </>
            ) : (
              <p className="text-[14px] text-[#6B6889]">No target set yet.</p>
            )}
              </Card>
            )}

            {/* Stock overview card */}
            {isLoading ? (
              <Skeleton className="h-28" />
            ) : (
              <Card>
                <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-widest mb-3">
                  Stock Overview
                </p>
                <div className="grid grid-cols-3 divide-x divide-[#F5F4FF]">
                  <StockMetric label="Sell Value" value={formatRWF(sellValue)} />
                  <StockMetric label="Cost Value" value={formatRWF(costValue)} className="px-3" />
                  <StockMetric
                    label="Pairs Left"
                    value={formatCount(pairsLeft)}
                    valueColor="#6C63FF"
                    className="pl-3"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Recent sales */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-[20px] font-bold text-[#1A1733]">Recent Sales</p>
              {!isLoading && (
                <Badge variant="blue">{formatCount(filteredSales.length)}</Badge>
              )}
            </div>
            <Link
              href="/sales"
              className="flex items-center gap-0.5 text-[13px] font-semibold text-[#6C63FF] active:opacity-60"
            >
              See all <ChevronRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <Card padding="none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={cn(i < 4 && 'border-b border-[#F5F4FF]')}>
                  <SaleRowSkeleton />
                </div>
              ))}
            </Card>
          ) : recentSales.length === 0 ? (
            <Card>
              <p className="text-center text-[15px] text-[#6B6889] py-8">No sales yet</p>
            </Card>
          ) : (
            <>
              {/* Mobile: stacked rows */}
              <Card padding="none" className="lg:hidden">
                {recentSales.map((sale, idx) => (
                  <SaleRow key={sale.id} sale={sale} isLast={idx === recentSales.length - 1} />
                ))}
              </Card>

              {/* Desktop: table */}
              <Card padding="none" className="hidden lg:block overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <Th>Item</Th>
                      <Th>Payment</Th>
                      <Th>Date</Th>
                      <Th className="text-right">Amount</Th>
                      <Th className="text-right">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale, idx) => {
                      const debt = (sale.totalAmount ?? 0) - (sale.amountPaid ?? 0)
                      const unpaid = !sale.isPaid && debt > 0
                      return (
                        <tr
                          key={sale.id}
                          className={cn(idx < recentSales.length - 1 && 'border-b')}
                          style={{ borderColor: 'var(--color-separator)' }}
                        >
                          <td className="px-5 py-3.5 text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>
                            {[sale.brand, sale.color].filter(Boolean).join(' · ') || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                            {sale.paymentMethod ?? 'Cash'}
                          </td>
                          <td className="px-5 py-3.5 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                            {formatDateShort(sale.date)}
                          </td>
                          <td className="px-5 py-3.5 text-[14px] font-bold text-right" style={{ color: 'var(--color-text)' }}>
                            {formatRWF(sale.totalAmount ?? 0)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Badge variant={unpaid ? 'red' : 'green'}>{unpaid ? 'Debt' : 'Paid'}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn('px-5 py-3 text-[11px] font-bold uppercase tracking-wider', className)}
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {children}
    </th>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface StockMetricProps {
  label: string
  value: string
  valueColor?: string
  className?: string
}

function StockMetric({ label, value, valueColor = '#1A1733', className }: StockMetricProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-wide">{label}</p>
      <p className="text-[16px] font-bold leading-tight" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  )
}
