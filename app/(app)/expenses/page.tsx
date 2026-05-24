'use client'

import { useMemo, useState } from 'react'
import { id } from '@instantdb/react'
import { Landmark, Plus, Trash2, X, RotateCw, Calendar } from 'lucide-react'
import { db } from '@/lib/db'
import type { Expense } from '@/lib/schema'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn, formatRWF, calcExpenseForPeriod } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

type Period = 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time'
const PERIODS: Period[] = ['Today', 'This Week', 'This Month', 'This Year', 'All Time']

interface FormState {
  description: string
  amount: string
  date: string
  isRecurring: boolean
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time'
}

const BLANK: FormState = {
  description: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  isRecurring: false,
  frequency: 'one-time',
}

function formatDateDisplay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ExpensesPage() {
  const [period, setPeriod] = useState<Period>('This Month')

  // Sheet states
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState<FormState>(BLANK)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  // Query expenses
  const { data, isLoading } = db.useQuery({ expenses: {} })
  const allExpenses = useMemo(() => (data?.expenses ?? []) as Expense[], [data?.expenses])

  // Filter expenses list by active state in this period
  const activeExpenses = useMemo(() => {
    return allExpenses
      .filter((exp) => calcExpenseForPeriod(exp, period) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [allExpenses, period])

  // Total expenses in selected period
  const totalExpenses = useMemo(() => {
    return allExpenses.reduce((acc, exp) => acc + calcExpenseForPeriod(exp, period), 0)
  }, [allExpenses, period])

  // Drawer helpers
  function openAdd() {
    setForm({
      ...BLANK,
      date: new Date().toISOString().slice(0, 10),
    })
    setErrors({})
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  function validate() {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.description.trim()) errs.description = 'Required'
    if (!form.amount.trim() || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = 'Enter a valid amount'
    }
    if (!form.date) errs.date = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate() || saving) return
    setSaving(true)
    try {
      const payload = {
        description: form.description.trim(),
        amount: Number(form.amount),
        date: form.date,
        isRecurring: form.isRecurring,
        frequency: form.isRecurring ? form.frequency : 'one-time',
      }
      await db.transact(db.tx.expenses[id()].update(payload))
      closeSheet()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await db.transact(db.tx.expenses[deleteTarget.id].delete())
    setDeleteTarget(null)
  }

  return (
    <div className="min-h-screen bg-ios-bg pb-36">
      {/* Save Success Toast */}
      <div
        className={cn(
          'fixed top-16 left-1/2 -translate-x-1/2 z-[90]',
          'flex items-center gap-2 px-4 py-2.5 rounded-full',
          'bg-[#1C1C1E] dark:bg-[#2C2C2E] text-white text-[15px] font-semibold',
          'shadow-lg pointer-events-none border border-white/[0.04]',
          'transition-all duration-300',
          saved ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Expense Recorded
      </div>

      {/* Header */}
      <PageHeader
        title="Expenses"
        action={
          <button
            onClick={openAdd}
            aria-label="Add Expense"
            className="w-11 h-11 rounded-full bg-ios-blue flex items-center justify-center shadow-sm active:scale-90 transition-all duration-150"
          >
            <Plus size={22} className="text-white" strokeWidth={2.5} />
          </button>
        }
      />

      {/* Period Filter Tabs */}
      <div className="overflow-x-auto px-4 pb-4">
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
        {/* Total Card */}
        {isLoading ? (
          <Skeleton className="h-28" />
        ) : (
          <Card className="bg-ios-surface dark:border dark:border-[#2C2C2E] flex flex-col gap-1.5 p-5">
            <p className="text-[12px] font-semibold text-ios-label-secondary uppercase tracking-wider">
              Total Expenses ({period})
            </p>
            <p className="text-[34px] font-bold text-ios-red dark:text-[#FF453A] leading-none tabular-nums">
              {formatRWF(totalExpenses)}
            </p>
            <p className="text-[13px] text-ios-label-secondary mt-1">
              Includes prorated fractions of active recurring bills.
            </p>
          </Card>
        )}

        {/* Expenses List */}
        <div className="flex flex-col gap-3">
          <p className="text-[22px] font-bold text-ios-label px-1">Expense Log</p>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : activeExpenses.length === 0 ? (
            <Card className="py-12 text-center">
              <Landmark size={48} className="text-ios-label-tertiary mx-auto mb-3" />
              <p className="text-ios-label font-semibold">No expenses recorded</p>
              <p className="text-ios-label-secondary text-[14px] mt-1">Tap + to add shop expenses or rent.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {activeExpenses.map((exp) => {
                const currentPeriodCost = calcExpenseForPeriod(exp, period)
                return (
                  <div key={exp.id} className="flex items-center gap-2.5 animate-fadeIn">
                    <Card className="flex-1 min-w-0" padding="sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-ios-label truncate leading-tight">
                            {exp.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {exp.isRecurring ? (
                              <Badge variant="blue" className="gap-1">
                                <RotateCw size={10} className="animate-spin-slow" />
                                {exp.frequency.charAt(0).toUpperCase() + exp.frequency.slice(1)}
                              </Badge>
                            ) : (
                              <Badge variant="gray" className="gap-1">
                                <Calendar size={10} />
                                One-time
                              </Badge>
                            )}
                            <span className="text-[12px] text-ios-label-secondary">
                              Started: {formatDateDisplay(exp.date)}
                            </span>
                          </div>
                          {exp.isRecurring && (
                            <p className="text-[11px] text-ios-label-secondary mt-1">
                              Base Rate: {formatRWF(exp.amount)} / {exp.frequency === 'monthly' ? 'month' : exp.frequency === 'weekly' ? 'week' : 'day'}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[15px] font-bold text-ios-red dark:text-[#FF453A] tabular-nums">
                            {formatRWF(currentPeriodCost)}
                          </p>
                          {exp.isRecurring && (
                            <span className="text-[10px] text-ios-label-secondary font-medium">
                              {period} cost
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                    <button
                      onClick={() => setDeleteTarget(exp)}
                      aria-label={`Delete ${exp.description}`}
                      className="shrink-0 w-11 h-11 rounded-2xl bg-ios-red-light text-ios-red flex items-center justify-center active:scale-90 transition-all duration-150"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════ Add Expense Drawer Sheet ══════════════════ */}

      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300',
          sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeSheet}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add Expense"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[70]',
          'bg-ios-surface rounded-t-3xl border-t border-ios-separator/10 shadow-2xl',
          'transition-transform duration-300 ease-out',
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-ios-fill-tertiary" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <h2 className="text-[20px] font-bold text-ios-label">Log Expense</h2>
          <button
            onClick={closeSheet}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-ios-fill-secondary dark:bg-[#2C2C2E] flex items-center justify-center active:scale-90 transition-all"
          >
            <X size={16} className="text-ios-label-secondary" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="px-5 pb-10 flex flex-col gap-4 overflow-y-auto max-h-[72vh]">
          <Input
            label="Description"
            placeholder="e.g. Shop Rent, Electricity Bill..."
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            error={errors.description}
          />

          <Input
            label="Amount (RWF)"
            placeholder="0"
            type="number"
            inputMode="numeric"
            value={form.amount}
            onChange={(e) => setField('amount', e.target.value)}
            error={errors.amount}
          />

          <Input
            label="Start/Transaction Date"
            type="date"
            value={form.date}
            onChange={(e) => setField('date', e.target.value)}
            error={errors.date}
          />

          {/* Is Recurring Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-ios-separator/10">
            <div>
              <p className="text-[15px] font-semibold text-ios-label">Recurring Expense</p>
              <p className="text-[12px] text-ios-label-secondary">Automatically repeat this bill</p>
            </div>
            <button
              onClick={() => setField('isRecurring', !form.isRecurring)}
              aria-label="Toggle recurring state"
              className={cn(
                'w-[51px] h-[31px] rounded-full p-0.5 transition-colors duration-200 ease-in-out outline-none select-none',
                form.isRecurring ? 'bg-ios-green' : 'bg-ios-fill-tertiary dark:bg-[#3A3A3C]'
              )}
            >
              <div
                className={cn(
                  'w-[27px] h-[27px] rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out',
                  form.isRecurring ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Recurring Frequency Select */}
          {form.isRecurring && (
            <div className="animate-fadeIn">
              <Select
                label="Frequency"
                value={form.frequency}
                onChange={(e) => setField('frequency', e.target.value as FormState['frequency'])}
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'daily', label: 'Daily' },
                ]}
              />
            </div>
          )}

          {/* Actions */}
          <div
            className="flex flex-col gap-2 pt-2"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
          >
            <Button onClick={handleSave} loading={saving} fullWidth>
              Save Expense
            </Button>
            <button
              onClick={closeSheet}
              className="text-[17px] font-semibold text-ios-label-secondary py-2 text-center active:opacity-60 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════ Delete Confirmation Alert ══════════════════ */}
      <div
        className={cn(
          'fixed inset-0 z-[80] flex items-center justify-center px-10',
          'transition-all duration-200',
          deleteTarget ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/40"
          onClick={() => setDeleteTarget(null)}
        />
        <div
          className={cn(
            'relative w-full max-w-[270px] bg-ios-surface rounded-[14px] overflow-hidden shadow-2xl dark:border dark:border-[#2C2C2E]',
            'transition-transform duration-200',
            deleteTarget ? 'scale-100' : 'scale-95'
          )}
        >
          <div className="pt-5 pb-3 px-5 text-center">
            <p className="text-[17px] font-semibold text-ios-label">Delete Expense</p>
            <p className="text-[13px] text-ios-label-secondary mt-1 leading-normal">
              Remove <span className="text-ios-label font-bold">{deleteTarget?.description}</span>? 
              This cannot be undone.
            </p>
          </div>
          <div className="border-t border-ios-separator/20 flex">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-3 text-[17px] font-medium text-ios-blue border-r border-ios-separator/20 active:bg-ios-fill dark:active:bg-[#2C2C2E] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 text-[17px] font-semibold text-ios-red active:bg-ios-red-light/50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
