'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { id } from '@instantdb/react'
import {
  Minus,
  Plus,
  Search,
  X,
  Banknote,
  Building2,
  Smartphone,
  CheckCircle2,
} from 'lucide-react'
import { db } from '@/lib/db'
import type { StockItem, PaymentMethod } from '@/lib/schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn, formatRWF, formatCount } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'stock' | 'manual'

const PAYMENT_METHODS: {
  value: PaymentMethod
  label: string
  Icon: React.FC<{ size?: number | string; className?: string }>
}[] = [
  { value: 'Cash', label: 'Cash', Icon: Banknote },
  { value: 'Bank', label: 'Bank', Icon: Building2 },
  { value: 'Phone (MoMo)', label: 'MoMo', Icon: Smartphone },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex bg-ios-fill-secondary dark:bg-[#2C2C2E] rounded-[14px] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-2 rounded-[10px] text-[15px] font-semibold select-none',
            'transition-all duration-200 active:scale-[0.98]',
            value === opt.value
              ? 'bg-ios-surface text-ios-label shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
              : 'text-ios-label-secondary'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function QtyStep({
  value,
  onChange,
  max,
}: {
  value: number
  onChange: (v: number) => void
  max?: number
}) {
  const atMin = value <= 1
  const atMax = max !== undefined && value >= max

  return (
    <div className="flex items-center justify-between bg-ios-surface dark:border dark:border-[#2C2C2E] rounded-2xl px-4 h-[56px] shadow-card">
      <span className="text-[17px] font-medium text-ios-label">Quantity</span>
      <div className="flex items-center gap-4">
        <button
          onClick={() => !atMin && onChange(value - 1)}
          disabled={atMin}
          aria-label="Decrease quantity"
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150',
            atMin
              ? 'bg-ios-fill dark:bg-[#2C2C2E] text-ios-label-tertiary'
              : 'bg-ios-blue-light text-ios-blue active:scale-90'
          )}
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <span className="text-[22px] font-bold text-ios-label w-7 text-center tabular-nums">
          {value}
        </span>
        <button
          onClick={() => !atMax && onChange(value + 1)}
          disabled={atMax}
          aria-label="Increase quantity"
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150',
            atMax
              ? 'bg-ios-fill dark:bg-[#2C2C2E] text-ios-label-tertiary'
              : 'bg-ios-blue-light text-ios-blue active:scale-90'
          )}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethod
  onChange: (v: PaymentMethod) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[15px] font-medium text-ios-label pl-1">Payment Method</label>
      <div className="flex gap-2">
        {PAYMENT_METHODS.map(({ value: v, label, Icon }) => {
          const active = value === v
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl',
                'text-[13px] font-semibold select-none',
                'transition-all duration-200 active:scale-[0.96]',
                active
                  ? 'bg-ios-blue text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                  : 'bg-ios-fill dark:bg-[#2C2C2E] text-ios-label-secondary'
              )}
            >
              <Icon size={20} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const StockRow = /*#__PURE__*/ React.memo(function StockRow({
  item,
  selected,
  onSelect,
}: {
  item: StockItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left',
        'transition-all duration-200 active:scale-[0.98] select-none',
        selected
          ? 'bg-ios-blue-light ring-1 ring-ios-blue/30 dark:bg-ios-blue/20'
          : 'bg-ios-surface shadow-card dark:border dark:border-[#2C2C2E]'
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-semibold text-ios-label truncate">{item.brand}</p>
        <p className="text-[15px] text-ios-label-secondary mt-0.5">
          {[item.color, item.size ? `Size ${item.size}` : null].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right">
          <p className="text-[17px] font-bold text-ios-blue">{formatRWF(item.sellPrice)}</p>
          <p className="text-[12px] text-ios-label-tertiary">×{formatCount(item.qty)}</p>
        </div>
        {selected && (
          <div className="w-6 h-6 rounded-full bg-ios-blue flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
})

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[15px] text-ios-label-secondary shrink-0">{label}</span>
      <span className="text-[15px] text-ios-label text-right">{value || '—'}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SellPage() {
  const router = useRouter()

  const { data, isLoading } = db.useQuery({ stockItems: {} })
  const allItems = (data?.stockItems ?? []) as StockItem[]
  const inStockItems = allItems.filter((item) => item.qty > 0)

  // Mode
  const [mode, setMode] = useState<Mode>('stock')

  // Stock search & selection
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  // Fields (manual entry populates brand/color/size/buyPrice; stock selection pre-fills all)
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [qty, setQty] = useState(1)
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note, setNote] = useState('')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // ── Derived values ────────────────────────────────────────────────────────
  const sellPriceNum = parseFloat(sellPrice) || 0
  const totalAmount = sellPriceNum * qty
  const amountPaidNum = parseFloat(amountPaid) || 0
  const debt = totalAmount > 0 ? Math.max(0, totalAmount - amountPaidNum) : 0
  const hasDebt = debt > 0
  const formReady = mode === 'manual' || selectedItem !== null
  const maxQty = mode === 'stock' && selectedItem ? selectedItem.qty : undefined

  const filteredItems = inStockItems.filter((item) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      item.brand.toLowerCase().includes(q) ||
      (item.color?.toLowerCase().includes(q) ?? false) ||
      (item.size?.toLowerCase().includes(q) ?? false)
    )
  })

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSelectItem(item: StockItem) {
    setSelectedItem(item)
    setBrand(item.brand)
    setColor(item.color ?? '')
    setSize(item.size ?? '')
    setBuyPrice(String(item.buyPrice))
    setSellPrice(String(item.sellPrice))
    setQty(1)
    setAmountPaid('')
    setError('')
  }

  function resetForm() {
    setSelectedItem(null)
    setBrand('')
    setColor('')
    setSize('')
    setBuyPrice('')
    setSellPrice('')
    setQty(1)
    setAmountPaid('')
    setPaymentMethod('Cash')
    setCustomerName('')
    setCustomerPhone('')
    setNote('')
    setSearch('')
    setError('')
  }

  function switchMode(m: string) {
    setMode(m as Mode)
    resetForm()
  }

  async function handleSubmit() {
    if (!brand.trim()) { setError('Brand is required'); return }
    if (sellPriceNum <= 0) { setError('Sell price must be greater than 0'); return }
    if (mode === 'stock' && selectedItem && qty > selectedItem.qty) {
      setError(`Only ${selectedItem.qty} pair(s) in stock`)
      return
    }
    if (hasDebt && !customerName.trim()) {
      setError('Customer name is required when there is a debt')
      return
    }

    const capturedHasDebt = hasDebt
    setSubmitting(true)
    setError('')

    try {
      const newSaleId = id()
      const saleData = {
        brand,
        color,
        size,
        sellPrice: sellPriceNum,
        buyPrice: parseFloat(buyPrice) || 0,
        qty,
        totalAmount,
        amountPaid: amountPaidNum,
        isPaid: !capturedHasDebt,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        date: new Date().toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      }

      const baseOps = [db.tx.sales[newSaleId].update(saleData)]
      const linkOps = selectedItem
        ? [
            db.tx.sales[newSaleId].link({ stockItem: selectedItem.id }),
            db.tx.stockItems[selectedItem.id].update({ qty: selectedItem.qty - qty }),
          ]
        : []

      await db.transact([...baseOps, ...linkOps])

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        resetForm()
        if (capturedHasDebt) router.push('/debts')
      }, 1500)
    } catch {
      setError('Failed to record sale. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-ios-bg pb-36">
      {/* ── Success overlay ── */}
      {success && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex flex-col items-center gap-4 bg-ios-surface rounded-3xl px-12 py-10 mx-6 shadow-2xl dark:border dark:border-[#2C2C2E]">
            <div className="w-24 h-24 rounded-full bg-ios-green-light flex items-center justify-center animate-bounce">
              <CheckCircle2 size={48} className="text-ios-green" />
            </div>
            <p className="text-[22px] font-bold text-ios-label">Sale Recorded!</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <PageHeader title="Sell" />

      <div className="px-4 flex flex-col gap-4">
        {/* ── Mode selector ── */}
        <SegmentedControl
          options={[
            { value: 'stock', label: 'From Stock' },
            { value: 'manual', label: 'Manual Entry' },
          ]}
          value={mode}
          onChange={switchMode}
        />

        {/* ── From Stock ── */}
        {mode === 'stock' && (
          <div className="flex flex-col gap-3">
            {/* Search bar */}
            <div className="flex items-center gap-2 bg-ios-fill-secondary dark:bg-[#2C2C2E] rounded-[12px] px-3 h-9">
              <Search size={15} className="text-ios-label-secondary shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brand, color, size…"
                className="flex-1 bg-transparent text-[15px] text-ios-label placeholder:text-ios-label-secondary outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="shrink-0 active:opacity-60">
                  <X size={14} className="text-ios-label-secondary" />
                </button>
              )}
            </div>

            {/* Stock list */}
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="text-center py-10 text-[15px] text-ios-label-secondary">
                {search ? 'No items match your search' : 'No items in stock'}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredItems.map((item) => (
                  <StockRow
                    key={item.id}
                    item={item}
                    selected={selectedItem?.id === item.id}
                    onSelect={() => handleSelectItem(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Manual Entry ── */}
        {mode === 'manual' && (
          <div className="flex flex-col gap-3">
            <Input
              label="Brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Nike, Adidas, Timberland…"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Black"
              />
              <Input
                label="Size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="42"
              />
            </div>
            <Input
              label="Buy Price (RWF) — optional"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              type="number"
              inputMode="numeric"
              placeholder="0"
            />
          </div>
        )}

        {/* ── Shared form (shown after stock selection or always in manual mode) ── */}
        {formReady && (
          <>
            {/* Section divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-ios-separator/10" />
              <span className="text-[12px] font-semibold text-ios-label-secondary uppercase tracking-wider">
                Sale Details
              </span>
              <div className="flex-1 h-px bg-ios-separator/10" />
            </div>

            {/* Sell Price */}
            <Input
              label="Sell Price (RWF)"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              type="number"
              inputMode="numeric"
              placeholder="0"
            />

            {/* Qty stepper */}
            <QtyStep value={qty} onChange={setQty} max={maxQty} />

            {/* Total amount */}
            <div className="bg-ios-blue-light dark:bg-ios-blue/10 rounded-2xl px-4 py-4 flex items-center justify-between">
              <span className="text-[17px] font-semibold text-ios-blue">Total Amount</span>
              <span className="text-[26px] font-bold text-ios-blue tabular-nums">
                {formatRWF(totalAmount)}
              </span>
            </div>

            {/* Amount paid + full payment shortcut */}
            <div className="bg-ios-surface dark:border dark:border-[#2C2C2E] rounded-2xl px-4 pt-3 pb-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[15px] font-medium text-ios-label">Amount Paid</label>
                <button
                  className="text-[15px] font-semibold text-ios-blue active:opacity-50 transition-opacity"
                  onClick={() => setAmountPaid(String(totalAmount))}
                >
                  Full payment
                </button>
              </div>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                inputMode="numeric"
                placeholder="0"
                className="w-full bg-transparent text-[20px] font-semibold text-ios-label placeholder:text-ios-label-tertiary outline-none tabular-nums"
              />
            </div>

            {/* Debt banner */}
            {hasDebt && (
              <div className="bg-ios-orange-light rounded-2xl px-4 py-3.5">
                <p className="text-[17px] font-bold text-ios-orange dark:text-[#FF9F0A]">Debt: {formatRWF(debt)}</p>
                <p className="text-[13px] text-ios-orange dark:text-[#FF9F0A] mt-0.5">
                  Customer will owe this amount
                </p>
              </div>
            )}

            {/* Payment method */}
            <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />

            {/* Customer details — only required when there is a debt */}
            {hasDebt && (
              <div className="flex flex-col gap-3">
                <Input
                  label="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
                <Input
                  label="Customer Phone (for payment reminders)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 0788123456 or +250..."
                  type="tel"
                />
              </div>
            )}

            {/* Note */}
            <Input
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
            />

            {/* ── Sale summary preview ── */}
            <Card className="bg-ios-fill/50 dark:bg-[#1E1E24] border border-ios-separator/10">
              <p className="text-[11px] font-semibold text-ios-label-secondary uppercase tracking-wider mb-3">
                Sale Summary
              </p>
              <div className="flex flex-col gap-2.5">
                <SummaryRow
                  label="Shoe"
                  value={
                    [brand, color ? `(${color})` : null, size ? `· Size ${size}` : null]
                      .filter(Boolean)
                      .join(' ') || '—'
                  }
                />
                <SummaryRow
                  label="Qty"
                  value={
                    sellPriceNum > 0
                      ? `${qty} × ${formatRWF(sellPriceNum)} = ${formatRWF(totalAmount)}`
                      : '—'
                  }
                />
                <SummaryRow
                  label="Paid"
                  value={
                    amountPaidNum > 0 ? `${formatRWF(amountPaidNum)} · ${paymentMethod}` : '—'
                  }
                />
                {hasDebt && (
                  <div className="flex justify-between pt-0.5 border-t border-ios-separator/10 mt-0.5">
                    <span className="text-[15px] font-semibold text-ios-orange dark:text-[#FF9F0A]">Debt</span>
                    <span className="text-[15px] font-bold text-ios-orange dark:text-[#FF9F0A]">{formatRWF(debt)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Validation error */}
            {error && (
              <p className="text-[15px] text-ios-red text-center font-medium">{error}</p>
            )}

            {/* Record Sale */}
            <Button
              fullWidth
              loading={submitting}
              disabled={submitting}
              className="h-[52px] rounded-2xl text-[17px]"
              onClick={handleSubmit}
            >
              Record Sale
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
