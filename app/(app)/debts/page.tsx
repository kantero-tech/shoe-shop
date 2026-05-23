'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { db } from '@/lib/db'
import type { Sale } from '@/lib/schema'
import { formatRWF, cn, formatCount } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ─── types ───────────────────────────────────────────────────────────────────

type ExitPhase = 'flash' | 'collapse'

interface ExitItem {
  sale: Sale
  phase: ExitPhase
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatSaleDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── DebtCard ────────────────────────────────────────────────────────────────

interface DebtCardProps {
  sale: Sale
  exitPhase?: ExitPhase
  expanded: boolean
  onToggleExpand: () => void
  onConfirm: (saleId: string, amount: number) => Promise<void>
}

const DebtCard = /*#__PURE__*/ React.memo(function DebtCard({ sale, exitPhase, expanded, onToggleExpand, onConfirm }: DebtCardProps) {
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const totalAmount = sale.totalAmount ?? 0
  const amountPaid = sale.amountPaid ?? 0
  const owes = Math.max(0, totalAmount - amountPaid)
  const pct = totalAmount > 0 ? Math.min(100, (amountPaid / totalAmount) * 100) : 0

  const isExiting = exitPhase !== undefined
  const isCollapsing = exitPhase === 'collapse'

  const doConfirm = async (markFull = false) => {
    const amount = markFull ? owes : parseFloat(inputValue)
    if (!markFull) {
      if (isNaN(amount) || amount <= 0) {
        setError('Enter a valid amount')
        return
      }
      if (amount > owes + 0.01) {
        setError(`Max is ${formatRWF(owes)}`)
        return
      }
    }
    setError(undefined)
    setSubmitting(true)
    try {
      await onConfirm(sale.id, amount)
      setInputValue('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    // Outer wrapper handles the exit slide-out animation
    <div
      style={{
        maxHeight: isCollapsing ? 0 : isExiting ? 1200 : undefined,
        opacity: isCollapsing ? 0 : 1,
        overflow: isExiting ? 'hidden' : undefined,
        transition: isExiting
          ? 'max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease'
          : undefined,
      }}
    >
      <Card
        padding="md"
        className={cn(
          'transition-colors duration-500',
          exitPhase === 'flash' && 'bg-[#E3F9EA]'
        )}
      >
        {/* Customer name */}
        <p className="text-[20px] font-bold text-[#1C1C1E] leading-tight">
          {sale.customerName?.trim() || 'Unknown Customer'}
        </p>

        {/* Shoe info line */}
        <p className="text-[13px] text-[#8E8E93] mt-1 mb-3 leading-snug">
          {[sale.brand, sale.color ? `(${sale.color})` : null].filter(Boolean).join(' ')}
          {sale.size ? ` · Size ${sale.size}` : ''}
          {sale.date ? ` · ${formatSaleDate(sale.date)}` : ''}
        </p>

        {/* Payment method badge */}
        {sale.paymentMethod && (
          <div className="mb-3">
            <Badge variant="blue">{sale.paymentMethod}</Badge>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-1.5 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#007AFF] transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-[#8E8E93] mt-1">{Math.round(pct)}% paid</p>
        </div>

        {/* Paid / Owes amounts */}
        <div className="flex gap-6 mb-4">
          <div>
            <p className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-0.5">
              Paid
            </p>
            <p className="text-[16px] font-semibold text-[#34C759]">{formatRWF(amountPaid)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-0.5">
              Owes
            </p>
            <p className="text-[16px] font-bold text-[#FF9500]">{formatRWF(owes)}</p>
          </div>
        </div>

        {/* Record Payment button (collapsed state) */}
        {!expanded && (
          <button
            onClick={onToggleExpand}
            className={cn(
              'w-full h-[44px] rounded-xl',
              'border-2 border-[#007AFF] text-[#007AFF]',
              'text-[15px] font-semibold',
              'transition-all duration-200',
              'active:scale-[0.97] active:bg-[#E3F0FF]',
              'select-none'
            )}
          >
            Record Payment
          </button>
        )}

        {/* Inline payment form — grid-rows trick for smooth expand */}
        <div
          className="overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateRows: expanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div className="min-h-0">
            <div className="pt-4 border-t border-[#F2F2F7] flex flex-col gap-3">
              <Input
                label="Amount received (RWF)"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={inputValue}
                error={error}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setError(undefined)
                }}
              />

              {/* Mark as Fully Paid shortcut */}
              <button
                onClick={() => doConfirm(true)}
                disabled={submitting}
                className={cn(
                  'flex items-center gap-1.5 text-left',
                  'text-[14px] font-semibold text-[#34C759]',
                  'transition-opacity active:opacity-60',
                  submitting && 'opacity-40 pointer-events-none'
                )}
              >
                <CheckIcon />
                Mark as Fully Paid&nbsp;({formatRWF(owes)})
              </button>

              {/* Confirm + Cancel row */}
              <div className="flex items-center gap-3 pb-1">
                <Button
                  variant="primary"
                  loading={submitting}
                  fullWidth
                  onClick={() => doConfirm(false)}
                  className="rounded-xl text-[15px]"
                >
                  Confirm Payment
                </Button>
                <button
                  onClick={() => {
                    setInputValue('')
                    setError(undefined)
                    onToggleExpand()
                  }}
                  disabled={submitting}
                  className="shrink-0 text-[15px] font-medium text-[#8E8E93] px-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
})

// ─── skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-[#E5E5EA] rounded-2xl', className)} />
}

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-[#E3F9EA] flex items-center justify-center mb-5">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#34C759"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="text-[22px] font-bold text-[#1C1C1E] mb-1">No outstanding debts!</p>
      <p className="text-[15px] text-[#8E8E93]">Great job!</p>
    </div>
  )
}

// ─── summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor: string
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <p className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">{label}</p>
      <p className="text-[26px] font-bold leading-tight" style={{ color: valueColor }}>
        {value}
      </p>
    </Card>
  )
}

// ─── icon ────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#34C759"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function DebtsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [exitItems, setExitItems] = useState<Map<string, ExitItem>>(new Map())

  const { data, isLoading } = db.useQuery({ sales: {} })

  const debtSales = useMemo(
    () =>
      ((data?.sales ?? []) as Sale[])
        .filter((s) => !s.isPaid)
        .sort(
          (a, b) =>
            new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime()
        ),
    [data?.sales]
  )

  // Merge live debts + items currently animating out (sorted newest first)
  const displaySales = useMemo(() => {
    const allMap = new Map<string, Sale>()
    for (const s of debtSales) allMap.set(s.id, s)
    for (const [id, { sale }] of exitItems) {
      if (!allMap.has(id)) allMap.set(id, sale)
    }
    return [...allMap.values()].sort(
      (a, b) =>
        new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime()
    )
  }, [debtSales, exitItems])

  const totalOutstanding = useMemo(
    () =>
      debtSales.reduce(
        (acc, s) => acc + Math.max(0, (s.totalAmount ?? 0) - (s.amountPaid ?? 0)),
        0
      ),
    [debtSales]
  )

  // Kick off green-flash → collapse → remove animation sequence
  const triggerExit = useCallback((sale: Sale) => {
    setExitItems((prev) => new Map(prev).set(sale.id, { sale, phase: 'flash' }))

    // Switch to collapse after flash settles
    setTimeout(() => {
      setExitItems((prev) => {
        const next = new Map(prev)
        const item = next.get(sale.id)
        if (item) next.set(sale.id, { ...item, phase: 'collapse' })
        return next
      })
    }, 450)

    // Remove from DOM after collapse finishes
    setTimeout(() => {
      setExitItems((prev) => {
        const next = new Map(prev)
        next.delete(sale.id)
        return next
      })
    }, 950)
  }, [])

  const handleConfirm = useCallback(
    async (saleId: string, amount: number) => {
      const sale = ((data?.sales ?? []) as Sale[]).find((s) => s.id === saleId)
      if (!sale) return

      const newAmountPaid = Math.min(
        (sale.amountPaid ?? 0) + amount,
        sale.totalAmount ?? Infinity
      )
      const willBePaid = newAmountPaid >= (sale.totalAmount ?? 0)

      if (willBePaid) {
        // Start exit animation before transact so it's visible even with optimistic update
        triggerExit({ ...sale, amountPaid: newAmountPaid, isPaid: true })
        setExpandedId(null)
      }

      await db.transact(
        db.tx.sales[saleId].update({
          amountPaid: newAmountPaid,
          isPaid: willBePaid,
        })
      )

      if (!willBePaid) setExpandedId(null)
    },
    [data?.sales, triggerExit]
  )

  const toggleExpand = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    []
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Debts"
        action={
          !isLoading && totalOutstanding > 0 ? (
            <Badge variant="orange" className="text-[13px] px-3 py-1">
              {formatRWF(totalOutstanding)}
            </Badge>
          ) : undefined
        }
      />

      <div className="px-4 flex flex-col gap-4">
        {/* Summary stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label="Outstanding"
              value={formatRWF(totalOutstanding)}
              valueColor="#FF9500"
            />
            <SummaryCard
              label="Debtors"
              value={formatCount(debtSales.length)}
              valueColor="#007AFF"
            />
          </div>
        )}

        {/* Debt cards */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : displaySales.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {displaySales.map((sale) => (
              <DebtCard
                key={sale.id}
                sale={sale}
                exitPhase={exitItems.get(sale.id)?.phase}
                expanded={expandedId === sale.id}
                onToggleExpand={() => toggleExpand(sale.id)}
                onConfirm={handleConfirm}
              />
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
