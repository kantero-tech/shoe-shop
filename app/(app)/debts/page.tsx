'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Search, X, Share2, BookOpen } from 'lucide-react'
import { db } from '@/lib/db'
import type { Sale } from '@/lib/schema'
import { formatRWF, cn, formatCount } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSession, useIsEmployer, useCan } from '@/lib/permissions-context'

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
  canRecord: boolean
  onToggleExpand: () => void
  onConfirm: (saleId: string, amount: number) => Promise<void>
  onViewLedger: (customerName: string) => void
}

const DebtCard = /*#__PURE__*/ React.memo(function DebtCard({ sale, exitPhase, expanded, canRecord, onToggleExpand, onConfirm, onViewLedger }: DebtCardProps) {
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
          exitPhase === 'flash' && 'bg-[#DFFBEF]'
        )}
      >
        {/* Customer name + ledger button */}
        <div className="flex items-center justify-between gap-2 mb-0">
          <p className="text-[19px] font-bold text-[#1A1733] leading-tight">
            {sale.customerName?.trim() || 'Unknown Customer'}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onViewLedger(sale.customerName?.trim() || 'Unknown Customer')}
              className="w-8 h-8 rounded-lg bg-[#EEEDFF] flex items-center justify-center active:scale-90 transition-all"
              title="View all transactions"
            >
              <BookOpen size={14} className="text-[#6C63FF]" />
            </button>
            <button
              onClick={() => {
                const msg = `Hello ${sale.customerName?.trim() || ''}, this is a reminder from Mpenzi Shoes. You owe ${formatRWF(owes)} for ${[sale.brand, sale.color ? `(${sale.color})` : null].filter(Boolean).join(' ')}. Kindly arrange payment. Thank you!`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              className="w-8 h-8 rounded-lg bg-[#E6FFF0] flex items-center justify-center active:scale-90 transition-all"
              title="Send WhatsApp reminder"
            >
              <Share2 size={14} className="text-[#25D366]" />
            </button>
          </div>
        </div>

        {/* Shoe info line */}
        <p className="text-[13px] text-[#6B6889] mt-1 mb-3 leading-snug">
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
          <div className="h-1.5 w-full rounded-full bg-[#E8E6F5] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #6C63FF, #8B5CF6)',
              }}
            />
          </div>
          <p className="text-[11px] text-[#6B6889] mt-1">{Math.round(pct)}% paid</p>
        </div>

        {/* Paid / Owes amounts */}
        <div className="flex gap-6 mb-4">
          <div>
            <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-wide mb-0.5">
              Paid
            </p>
            <p className="text-[16px] font-semibold text-[#00C26F]">{formatRWF(amountPaid)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-wide mb-0.5">
              Owes
            </p>
            <p className="text-[16px] font-bold text-[#FFB020]">{formatRWF(owes)}</p>
          </div>
        </div>

        {/* Record Payment button (collapsed state) */}
        {!expanded && canRecord && (
          <button
            onClick={onToggleExpand}
            className={cn(
              'w-full h-[44px] rounded-xl',
              'border-2 border-[#6C63FF] text-[#6C63FF]',
              'text-[15px] font-semibold',
              'transition-all duration-200',
              'active:scale-[0.97] active:bg-[#EEEDFF]',
              'select-none'
            )}
          >
            Record Payment
          </button>
        )}

        {/* Inline payment form */}
        <div
          className="overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateRows: expanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div className="min-h-0">
            <div className="pt-4 border-t border-[#F5F4FF] flex flex-col gap-3">
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
                  'text-[14px] font-semibold text-[#00C26F]',
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
                  className="shrink-0 text-[15px] font-medium text-[#6B6889] px-1"
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
  return <div className={cn('animate-pulse bg-[#E8E6F5] rounded-2xl', className)} />
}

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-[#DFFBEF] flex items-center justify-center mb-5">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00C26F"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="text-[22px] font-bold text-[#1A1733] mb-1">No outstanding debts!</p>
      <p className="text-[15px] text-[#6B6889]">Great job — you&apos;re all clear.</p>
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
      <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-widest">{label}</p>
      <p className="text-[24px] font-extrabold leading-tight" style={{ color: valueColor }}>
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
      stroke="#00C26F"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── CustomerLedgerSheet ──────────────────────────────────────────────────────

function CustomerLedgerSheet({
  customerName,
  allSales,
  onClose,
}: {
  customerName: string | null
  allSales: Sale[]
  onClose: () => void
}) {
  const open = customerName !== null
  const customerSales = useMemo(() => {
    if (!customerName) return []
    return allSales
      .filter((s) => (s.customerName?.trim() || 'Unknown Customer') === customerName)
      .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
  }, [customerName, allSales])

  const totalOwed = useMemo(() =>
    customerSales.reduce((acc, s) => acc + Math.max(0, (s.totalAmount ?? 0) - (s.amountPaid ?? 0)), 0),
    [customerSales]
  )
  const totalPaid = useMemo(() =>
    customerSales.reduce((acc, s) => acc + (s.amountPaid ?? 0), 0),
    [customerSales]
  )

  return (
    <>
      <div
        aria-hidden
        className={cn('fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
      />
      <div
        className={cn('fixed bottom-0 z-[70] bg-white rounded-t-3xl transition-transform duration-300 ease-out', open ? 'translate-y-0' : 'translate-y-full')}
        style={{ left: 'max(0px, calc(50% - 240px))', right: 'max(0px, calc(50% - 240px))' }}
      >
        <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full bg-[#E8E6F5]" /></div>
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <div>
            <h2 className="text-[18px] font-bold text-[#1A1733]">{customerName ?? ''}</h2>
            <p className="text-[12px] text-[#6B6889]">{customerSales.length} transaction{customerSales.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center">
            <X size={15} className="text-[#6B6889]" />
          </button>
        </div>

        {/* Summary strip */}
        <div className="flex gap-3 px-5 pb-3">
          <div className="flex-1 bg-[#DFFBEF] rounded-xl px-3 py-2">
            <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-wide">Total Paid</p>
            <p className="text-[16px] font-bold text-[#00C26F]">{formatRWF(totalPaid)}</p>
          </div>
          <div className="flex-1 bg-[#FFF4DB] rounded-xl px-3 py-2">
            <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-wide">Still Owes</p>
            <p className="text-[16px] font-bold text-[#FFB020]">{formatRWF(totalOwed)}</p>
          </div>
        </div>

        {/* WhatsApp reminder */}
        {totalOwed > 0 && (
          <div className="px-5 pb-3">
            <button
              onClick={() => {
                const msg = `Hello ${customerName ?? 'Customer'}, this is a reminder from Mpenzi Shoes. You have an outstanding balance of ${formatRWF(totalOwed)}. Kindly arrange payment at your earliest convenience. Thank you!`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white text-[14px] font-semibold active:scale-95 transition-all"
            >
              <Share2 size={15} /> Send WhatsApp Reminder
            </button>
          </div>
        )}

        {/* Sales list */}
        <div className="overflow-y-auto max-h-[45vh] px-5 pb-10 flex flex-col gap-2">
          {customerSales.map((s) => {
            const owes = Math.max(0, (s.totalAmount ?? 0) - (s.amountPaid ?? 0))
            return (
              <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-[#F5F4FF] last:border-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.isPaid ? '#00C26F' : '#FF3D5A' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1A1733] truncate">
                    {[s.brand, s.color ? `(${s.color})` : null].filter(Boolean).join(' ')}
                    {s.size ? ` · Sz ${s.size}` : ''}
                  </p>
                  <p className="text-[11px] text-[#6B6889]">{formatSaleDate(s.date)}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <p className="text-[13px] font-bold text-[#1A1733]">{formatRWF(s.totalAmount ?? 0)}</p>
                  {!s.isPaid && owes > 0 && <p className="text-[11px] text-[#FF3D5A]">-{formatRWF(owes)}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function DebtsPage() {
  const router = useRouter()
  const session = useSession()
  const isEmployer = useIsEmployer()
  const canRecord = useCan('canRecordPayments')

  useEffect(() => {
    if (session && !isEmployer && !session.canViewDebts) {
      router.replace('/dashboard')
    }
  }, [session, isEmployer, router])

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [exitItems, setExitItems] = useState<Map<string, ExitItem>>(new Map())
  const [search, setSearch] = useState('')
  const [ledgerCustomer, setLedgerCustomer] = useState<string | null>(null)

  const { data, isLoading } = db.useQuery({ sales: {} })

  const allSalesForLedger = useMemo(() => (data?.sales ?? []) as Sale[], [data?.sales])

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

  const displaySales = useMemo(() => {
    const allMap = new Map<string, Sale>()
    for (const s of debtSales) allMap.set(s.id, s)
    for (const [id, { sale }] of exitItems) {
      if (!allMap.has(id)) allMap.set(id, sale)
    }
    let result = [...allMap.values()].sort(
      (a, b) =>
        new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime()
    )
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.customerName?.toLowerCase().includes(q) ||
          s.brand?.toLowerCase().includes(q) ||
          s.color?.toLowerCase().includes(q)
      )
    }
    return result
  }, [debtSales, exitItems, search])

  const totalOutstanding = useMemo(
    () =>
      debtSales.reduce(
        (acc, s) => acc + Math.max(0, (s.totalAmount ?? 0) - (s.amountPaid ?? 0)),
        0
      ),
    [debtSales]
  )

  const triggerExit = useCallback((sale: Sale) => {
    setExitItems((prev) => new Map(prev).set(sale.id, { sale, phase: 'flash' }))

    setTimeout(() => {
      setExitItems((prev) => {
        const next = new Map(prev)
        const item = next.get(sale.id)
        if (item) next.set(sale.id, { ...item, phase: 'collapse' })
        return next
      })
    }, 450)

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
    <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
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

      {/* Search */}
      <div className="px-4 lg:px-8 pb-3">
        <div className="flex items-center gap-2 bg-white border border-[#E8E6F5] rounded-[12px] px-3 h-10 shadow-[0_1px_4px_rgba(108,99,255,0.06)] lg:max-w-md">
          <Search size={15} className="text-[#6B6889] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or brand…"
            className="flex-1 bg-transparent text-[15px] text-[#1A1733] placeholder:text-[#B0ADCA] outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')}><X size={14} className="text-[#6B6889]" /></button>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-8 flex flex-col gap-4">
        {/* Summary stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:max-w-2xl">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:max-w-2xl">
            <SummaryCard
              label="Outstanding"
              value={formatRWF(totalOutstanding)}
              valueColor="#FFB020"
            />
            <SummaryCard
              label="Debtors"
              value={formatCount(debtSales.length)}
              valueColor="#6C63FF"
            />
          </div>
        )}

        {/* Debt cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : displaySales.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 items-start">
            {displaySales.map((sale) => (
              <DebtCard
                key={sale.id}
                sale={sale}
                exitPhase={exitItems.get(sale.id)?.phase}
                expanded={expandedId === sale.id}
                canRecord={canRecord}
                onToggleExpand={() => toggleExpand(sale.id)}
                onConfirm={handleConfirm}
                onViewLedger={setLedgerCustomer}
              />
            ))}
          </div>
        )}

      </div>

      <CustomerLedgerSheet
        customerName={ledgerCustomer}
        allSales={allSalesForLedger}
        onClose={() => setLedgerCustomer(null)}
      />
    </div>
  )
}
