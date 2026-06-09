'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/db'
import type { Expense, ExpenseCategory } from '@/lib/schema'
import { formatRWF, formatDateShort, cn } from '@/lib/utils'
import { useIsEmployer, useSession, useCan } from '@/lib/permissions-context'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { DateRangeFilter, getPeriodRange, isInRange } from '@/components/ui/DateRangeFilter'
import type { Period } from '@/components/ui/DateRangeFilter'

// ─── constants ───────────────────────────────────────────────────────────────

const CATEGORIES: ExpenseCategory[] = ['Rent', 'Stock Purchase', 'Utilities', 'Salary', 'Other']

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string }> = {
  Rent:           { bg: '#EEEDFF', text: '#6C63FF' },
  'Stock Purchase': { bg: '#DFFBEF', text: '#007A50' },
  Utilities:      { bg: '#FFF4DB', text: '#C07A10' },
  Salary:         { bg: '#FFE8EC', text: '#CC1A2E' },
  Other:          { bg: '#F5F4FF', text: '#6B6889' },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString()
}

// ─── Add Expense Sheet ────────────────────────────────────────────────────────

function AddExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Other')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setAmount('')
    setCategory('Other')
    setDescription('')
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSave() {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount')
      return
    }
    setSaving(true)
    setError('')
    try {
      const id = crypto.randomUUID()
      await db.transact(
        db.tx.expenses[id].update({
          amount: amt,
          category,
          description: description.trim(),
          date: todayISO(),
        })
      )
      handleClose()
    } catch {
      setError('Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        aria-hidden
        className={cn('fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={handleClose}
      />
      <div
        className={cn('fixed bottom-0 z-[70] bg-white rounded-t-3xl transition-transform duration-300 ease-out', open ? 'translate-y-0' : 'translate-y-full')}
        style={{ left: 'max(0px, calc(50% - 240px))', right: 'max(0px, calc(50% - 240px))' }}
      >
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-[#E8E6F5]" />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <h2 className="text-[18px] font-bold text-[#1A1733]">Add Expense</h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center">
            <X size={15} className="text-[#6B6889]" />
          </button>
        </div>

        <div className="px-5 pb-10 flex flex-col gap-4">
          <Input
            label="Amount (RWF)"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="0"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError('') }}
            error={error}
          />

          {/* Category picker */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-[#1A1733] pl-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = cat === category
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95',
                      active ? 'text-white shadow-[0_3px_10px_rgba(108,99,255,0.25)]' : 'border border-[#E8E6F5] text-[#6B6889]'
                    )}
                    style={active ? { background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' } : { background: CATEGORY_COLORS[cat].bg }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Monthly rent payment"
          />

          <Button fullWidth loading={saving} onClick={handleSave}>
            Save Expense
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Expense Row ──────────────────────────────────────────────────────────────

const ExpenseRow = React.memo(function ExpenseRow({
  expense,
  isLast,
  canManage,
  onDelete,
}: {
  expense: Expense
  isLast: boolean
  canManage: boolean
  onDelete: () => void
}) {
  const colors = CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.Other

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', !isLast && 'border-b border-[#F5F4FF]')}>
      {/* Category chip */}
      <span
        className="shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-bold"
        style={{ background: colors.bg, color: colors.text }}
      >
        {expense.category}
      </span>

      <div className="flex-1 min-w-0">
        {expense.description ? (
          <p className="text-[13px] text-[#1A1733] truncate">{expense.description}</p>
        ) : null}
        <p className="text-[11px] text-[#6B6889] mt-0.5">{formatDateShort(expense.date)}</p>
      </div>

      <p className="text-[15px] font-bold text-[#FF3D5A] shrink-0">{formatRWF(expense.amount)}</p>

      {canManage && (
        <button
          onClick={onDelete}
          className="ml-1 w-7 h-7 rounded-full bg-[#FFE8EC] flex items-center justify-center active:scale-90 transition-all"
        >
          <Trash2 size={13} className="text-[#FF3D5A]" />
        </button>
      )}
    </div>
  )
})

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-widest">{label}</p>
      <p className="text-[22px] font-extrabold leading-tight" style={{ color }}>
        {value}
      </p>
    </Card>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const router = useRouter()
  const session = useSession()
  const isEmployer = useIsEmployer()
  const canManage = useCan('canManageExpenses')

  useEffect(() => {
    if (session && !isEmployer && !(session.canViewExpenses ?? true)) {
      router.replace('/dashboard')
    }
  }, [session, isEmployer, router])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'All'>('All')
  const [period, setPeriod] = useState<Period>('Month')

  const { data, isLoading } = db.useQuery({ expenses: {} })
  const allExpenses = useMemo(() => (data?.expenses ?? []) as Expense[], [data])

  const sorted = useMemo(() => {
    const range = getPeriodRange(period)
    return [...allExpenses]
      .filter((e) => isInRange(e.date, range))
      .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
  }, [allExpenses, period])

  const filtered = useMemo(
    () => categoryFilter === 'All' ? sorted : sorted.filter((e) => e.category === categoryFilter),
    [sorted, categoryFilter]
  )

  const totalSpent = useMemo(() => filtered.reduce((a, e) => a + e.amount, 0), [filtered])

  // Per-category breakdown for summary
  const byCategory = useMemo(() => {
    const map: Partial<Record<ExpenseCategory, number>> = {}
    for (const e of filtered) {
      map[e.category] = (map[e.category] ?? 0) + e.amount
    }
    return map
  }, [filtered])

  async function handleDelete() {
    if (!deleteTarget) return
    await db.transact(db.tx.expenses[deleteTarget.id].delete())
    setDeleteTarget(null)
  }

  const columns: Column<Expense>[] = [
    {
      key: 'category',
      header: 'Category',
      render: (e) => {
        const c = CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.Other
        return (
          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold" style={{ background: c.bg, color: c.text }}>
            {e.category}
          </span>
        )
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (e) => (
        <span style={{ color: e.description ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
          {e.description || '—'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (e) => <span style={{ color: 'var(--color-text-secondary)' }}>{formatDateShort(e.date)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (e) => <span className="font-bold" style={{ color: '#FF3D5A' }}>{formatRWF(e.amount)}</span>,
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (e: Expense) => (
              <button
                onClick={() => setDeleteTarget(e)}
                className="w-7 h-7 rounded-full bg-[#FFE8EC] inline-flex items-center justify-center active:scale-90 transition-all"
                aria-label="Delete expense"
              >
                <Trash2 size={13} className="text-[#FF3D5A]" />
              </button>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
        <PageHeader
          title="Expenses"
          action={
            canManage ? (
              <button
                onClick={() => setSheetOpen(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)', boxShadow: '0 4px 12px rgba(108,99,255,0.35)' }}
                aria-label="Add expense"
              >
                <Plus size={20} className="text-white" />
              </button>
            ) : undefined
          }
        />

        {/* Period filter */}
        <DateRangeFilter value={period} onChange={setPeriod} />

        {/* Category filter */}
        <div className="overflow-x-auto px-4 lg:px-8 pb-3">
          <div className="flex gap-2 w-max">
            {(['All', ...CATEGORIES] as (ExpenseCategory | 'All')[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'h-[36px] px-4 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all active:scale-95',
                  cat === categoryFilter
                    ? 'text-white shadow-[0_3px_10px_rgba(108,99,255,0.25)]'
                    : 'bg-white border border-[#E8E6F5] text-[#6B6889]'
                )}
                style={cat === categoryFilter ? { background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 lg:px-8 pb-4 flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-5 lg:items-start">
          {/* Rail: summary + category breakdown */}
          <div className="flex flex-col gap-4 order-1 lg:order-2 lg:col-span-1">
            {/* Summary */}
            {!isLoading && (
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard label="Total Spent" value={formatRWF(totalSpent)} color="#FF3D5A" />
                <SummaryCard label="Entries" value={String(filtered.length)} color="#6C63FF" />
              </div>
            )}

            {/* Category breakdown (only when All selected and data loaded) */}
            {!isLoading && categoryFilter === 'All' && Object.keys(byCategory).length > 0 && (
              <Card>
                <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-widest mb-3">By Category</p>
                <div className="flex flex-col gap-2">
                  {CATEGORIES.filter((c) => byCategory[c]).map((cat) => {
                    const colors = CATEGORY_COLORS[cat]
                    const pct = totalSpent > 0 ? ((byCategory[cat] ?? 0) / totalSpent) * 100 : 0
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[13px] font-semibold" style={{ color: colors.text }}>{cat}</span>
                          <span className="text-[13px] font-bold text-[#1A1733]">{formatRWF(byCategory[cat] ?? 0)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#E8E6F5] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6C63FF, #8B5CF6)' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Main: expense list */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <p className="text-center text-[15px] text-[#6B6889] py-8">
                  {categoryFilter !== 'All' ? 'No expenses in this category' : 'No expenses recorded yet'}
                </p>
              </Card>
            ) : (
              <>
                {/* Mobile: stacked rows */}
                <Card padding="none" className="lg:hidden">
                  {filtered.map((expense, idx) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      isLast={idx === filtered.length - 1}
                      canManage={canManage}
                      onDelete={() => setDeleteTarget(expense)}
                    />
                  ))}
                </Card>

                {/* Desktop: table */}
                <div className="hidden lg:block">
                  <DataTable columns={columns} rows={filtered} rowKey={(e) => e.id} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add expense sheet */}
      <AddExpenseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* Delete confirmation */}
      <div className={cn('fixed inset-0 z-[80] flex items-center justify-center px-10 transition-all duration-200', deleteTarget ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
        <div aria-hidden className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
        <div className={cn('relative w-full max-w-[270px] bg-white rounded-2xl overflow-hidden shadow-2xl transition-transform duration-200', deleteTarget ? 'scale-100' : 'scale-95')}>
          <div className="pt-5 pb-3 px-5 text-center">
            <p className="text-[17px] font-semibold text-[#1A1733]">Delete Expense</p>
            <p className="text-[13px] text-[#6B6889] mt-1">
              Remove this expense? This cannot be undone.
            </p>
          </div>
          <div className="border-t border-[#E8E6F5] flex">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 text-[16px] font-medium text-[#6C63FF] border-r border-[#E8E6F5]">Cancel</button>
            <button onClick={handleDelete} className="flex-1 py-3 text-[16px] font-semibold text-[#FF3D5A]">Delete</button>
          </div>
        </div>
      </div>
    </>
  )
}
