'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Search, X, Trash2, Edit2, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/db'
import type { Sale, PaymentMethod, StockItem } from '@/lib/schema'
import { formatRWF, formatDateShort, cn } from '@/lib/utils'
import { useIsEmployer, useSession } from '@/lib/permissions-context'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { DateRangeFilter, getPeriodRange, isInRange } from '@/components/ui/DateRangeFilter'
import type { Period } from '@/components/ui/DateRangeFilter'

// ─── types ───────────────────────────────────────────────────────────────────

type StatusFilter = 'All' | 'Paid' | 'Debt'
const STATUS_TABS: StatusFilter[] = ['All', 'Paid', 'Debt']

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Bank', 'Phone (MoMo)']

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatFullDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Sale row ────────────────────────────────────────────────────────────────

const SaleRow = React.memo(function SaleRow({
  sale,
  onTap,
}: {
  sale: Sale
  onTap: () => void
}) {
  const debt = (sale.totalAmount ?? 0) - (sale.amountPaid ?? 0)
  const isPaid = sale.isPaid ?? false

  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[#F5F4FF] transition-colors"
    >
      {/* Status dot */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
        style={{ background: isPaid ? '#00C26F' : '#FF3D5A' }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#1A1733] truncate">
          {[sale.brand, sale.color ? `(${sale.color})` : null].filter(Boolean).join(' ')}
          {sale.size ? ` · Sz ${sale.size}` : ''}
        </p>
        <p className="text-[12px] text-[#6B6889] mt-0.5">
          {sale.paymentMethod ?? 'Cash'}
          {sale.customerName ? ` · ${sale.customerName}` : ''}
          {' · '}
          {formatDateShort(sale.date)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="text-[14px] font-bold text-[#1A1733]">{formatRWF(sale.totalAmount ?? 0)}</p>
        {!isPaid && debt > 0 && (
          <span className="text-[11px] font-semibold text-[#FF3D5A]">-{formatRWF(debt)}</span>
        )}
      </div>
    </button>
  )
})

// ─── Edit sheet ──────────────────────────────────────────────────────────────

function EditSheet({
  sale,
  stockItemsById,
  onClose,
}: {
  sale: Sale | null
  stockItemsById: Record<string, StockItem>
  onClose: () => void
}) {
  const open = sale !== null
  const [brand, setBrand] = useState(sale?.brand ?? '')
  const [color, setColor] = useState(sale?.color ?? '')
  const [size, setSize] = useState(sale?.size ?? '')
  const [sellPrice, setSellPrice] = useState(String(sale?.sellPrice ?? ''))
  const [qty, setQty] = useState(String(sale?.qty ?? 1))
  const [amountPaid, setAmountPaid] = useState(String(sale?.amountPaid ?? ''))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale?.paymentMethod ?? 'Cash')
  const [customerName, setCustomerName] = useState(sale?.customerName ?? '')
  const [note, setNote] = useState(sale?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Re-sync form when sale changes
  React.useEffect(() => {
    if (sale) {
      setBrand(sale.brand ?? '')
      setColor(sale.color ?? '')
      setSize(sale.size ?? '')
      setSellPrice(String(sale.sellPrice ?? ''))
      setQty(String(sale.qty ?? 1))
      setAmountPaid(String(sale.amountPaid ?? ''))
      setPaymentMethod(sale.paymentMethod ?? 'Cash')
      setCustomerName(sale.customerName ?? '')
      setNote(sale.note ?? '')
      setError('')
    }
  }, [sale])

  const totalAmount = (parseFloat(sellPrice) || 0) * (parseInt(qty) || 1)
  const amountPaidNum = parseFloat(amountPaid) || 0
  const isPaid = amountPaidNum >= totalAmount && totalAmount > 0

  async function handleSave() {
    if (!brand.trim()) { setError('Brand is required'); return }
    if (!sellPrice || parseFloat(sellPrice) <= 0) { setError('Sell price must be > 0'); return }
    if (!sale) return
    setSaving(true)
    setError('')
    try {
      const newQty = parseInt(qty) || 1
      // Keep stock in sync: a smaller sale returns pairs to stock, a larger one takes more.
      const stock = sale.stockItemId ? stockItemsById[sale.stockItemId] : undefined
      const delta = (sale.qty ?? 1) - newQty
      await db.transact([
        db.tx.sales[sale.id].update({
          brand: brand.trim(),
          color: color.trim(),
          size: size.trim(),
          sellPrice: parseFloat(sellPrice),
          qty: newQty,
          totalAmount,
          amountPaid: amountPaidNum,
          isPaid,
          paymentMethod,
          customerName: customerName.trim(),
          note: note.trim(),
        }),
        ...(stock && delta !== 0
          ? [db.tx.stockItems[stock.id].update({ qty: Math.max(0, stock.qty + delta) })]
          : []),
      ])
      onClose()
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

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
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <h2 className="text-[18px] font-bold text-[#1A1733]">Edit Sale</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center">
            <X size={15} className="text-[#6B6889]" />
          </button>
        </div>

        <div className="px-5 pb-10 flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
          <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Nike…" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black" />
            <Input label="Size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="42" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sell Price" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} type="number" inputMode="numeric" helper="RWF" />
            <Input label="Qty" value={qty} onChange={(e) => setQty(e.target.value)} type="number" inputMode="numeric" />
          </div>

          {/* Total */}
          {totalAmount > 0 && (
            <div className="flex justify-between px-1">
              <span className="text-[13px] text-[#6B6889]">Total</span>
              <span className="text-[13px] font-bold text-[#1A1733]">{formatRWF(totalAmount)}</span>
            </div>
          )}

          <Input label="Amount Paid" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} type="number" inputMode="numeric" helper="RWF" />

          {/* Payment method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#1A1733] pl-1">Payment Method</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={cn('flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-95', paymentMethod === m ? 'text-white' : 'bg-[#F5F4FF] border border-[#E8E6F5] text-[#6B6889]')}
                  style={paymentMethod === m ? { background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' } : {}}
                >
                  {m === 'Phone (MoMo)' ? 'MoMo' : m}
                </button>
              ))}
            </div>
          </div>

          <Input label="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" />
          <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />

          {/* Debt/paid status indicator */}
          {totalAmount > 0 && (
            <div className={cn('rounded-xl px-3 py-2', isPaid ? 'bg-[#DFFBEF]' : 'bg-[#FFF4DB]')}>
              <p className={cn('text-[13px] font-semibold', isPaid ? 'text-[#007A50]' : 'text-[#C07A10]')}>
                {isPaid ? 'Fully paid' : `Debt remaining: ${formatRWF(totalAmount - amountPaidNum)}`}
              </p>
            </div>
          )}

          {error && <p className="text-[13px] text-[#FF3D5A]">{error}</p>}
          <Button fullWidth loading={saving} onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </>
  )
}

// ─── Detail sheet ─────────────────────────────────────────────────────────────

function DetailSheet({
  sale,
  isEmployer,
  onEdit,
  onDelete,
  onClose,
}: {
  sale: Sale | null
  isEmployer: boolean
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const open = sale !== null
  if (!sale) return null

  const totalAmount = sale.totalAmount ?? 0
  const amountPaid = sale.amountPaid ?? 0
  const debt = totalAmount - amountPaid
  const isPaid = sale.isPaid ?? false

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex justify-between items-start gap-3 py-2 border-b border-[#F5F4FF] last:border-0">
        <span className="text-[13px] text-[#6B6889] shrink-0">{label}</span>
        <span className="text-[13px] font-medium text-[#1A1733] text-right">{value}</span>
      </div>
    )
  }

  return (
    <>
      <div aria-hidden className={cn('fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0 pointer-events-none')} onClick={onClose} />
      <div
        className={cn('fixed bottom-0 z-[70] bg-white rounded-t-3xl transition-transform duration-300 ease-out', open ? 'translate-y-0' : 'translate-y-full')}
        style={{ left: 'max(0px, calc(50% - 240px))', right: 'max(0px, calc(50% - 240px))' }}
      >
        <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full bg-[#E8E6F5]" /></div>
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="text-[18px] font-bold text-[#1A1733]">Sale Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center">
            <X size={15} className="text-[#6B6889]" />
          </button>
        </div>

        <div className="px-5 pb-10 overflow-y-auto max-h-[75vh]">
          {/* Status badge */}
          <div className="mb-4">
            <Badge variant={isPaid ? 'green' : 'red'}>{isPaid ? 'Paid' : 'Debt'}</Badge>
          </div>

          <div className="flex flex-col">
            <Row label="Shoe" value={[sale.brand, sale.color ? `(${sale.color})` : null, sale.size ? `Size ${sale.size}` : null].filter(Boolean).join(' ') || '—'} />
            <Row label="Qty" value={String(sale.qty ?? 1)} />
            <Row label="Sell Price" value={formatRWF(sale.sellPrice ?? 0)} />
            <Row label="Total" value={formatRWF(totalAmount)} />
            <Row label="Amount Paid" value={formatRWF(amountPaid)} />
            {!isPaid && <Row label="Debt" value={formatRWF(debt)} />}
            <Row label="Payment" value={sale.paymentMethod ?? 'Cash'} />
            {sale.customerName && <Row label="Customer" value={sale.customerName} />}
            {sale.note && <Row label="Note" value={sale.note} />}
            <Row label="Date" value={formatFullDate(sale.date)} />
          </div>

          {/* WhatsApp share */}
          <button
            onClick={() => {
              const lines = [
                `*Mpenzi Shoes — Receipt*`,
                `Shoe: ${[sale.brand, sale.color ? `(${sale.color})` : null, sale.size ? `Size ${sale.size}` : null].filter(Boolean).join(' ')}`,
                `Qty: ${sale.qty ?? 1}`,
                `Total: ${formatRWF(sale.totalAmount ?? 0)}`,
                `Paid: ${formatRWF(sale.amountPaid ?? 0)}`,
                sale.isPaid ? 'Status: ✅ Paid' : `Debt: ${formatRWF((sale.totalAmount ?? 0) - (sale.amountPaid ?? 0))}`,
                `Payment: ${sale.paymentMethod ?? 'Cash'}`,
                sale.customerName ? `Customer: ${sale.customerName}` : null,
                sale.note ? `Note: ${sale.note}` : null,
                `Date: ${formatFullDate(sale.date)}`,
              ].filter(Boolean).join('\n')
              window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank')
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-[14px] font-semibold active:scale-95 transition-all"
          >
            <Share2 size={16} /> Share via WhatsApp
          </button>

          {/* Actions — employer only */}
          {isEmployer && (
            <div className="flex gap-3 mt-3">
              <Button variant="secondary" fullWidth onClick={onEdit} className="rounded-xl">
                <Edit2 size={15} className="mr-1" /> Edit
              </Button>
              <Button variant="danger" fullWidth onClick={onDelete} className="rounded-xl">
                <Trash2 size={15} className="mr-1" /> Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const router = useRouter()
  const session = useSession()
  const isEmployer = useIsEmployer()

  useEffect(() => {
    if (session && !isEmployer && !(session.canViewSales ?? true)) {
      router.replace('/dashboard')
    }
  }, [session, isEmployer, router])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [period, setPeriod] = useState<Period>('Month')
  const [detailSale, setDetailSale] = useState<Sale | null>(null)
  const [editSale, setEditSale] = useState<Sale | null>(null)
  const [deleteSale, setDeleteSale] = useState<Sale | null>(null)

  const { data, isLoading } = db.useQuery({ sales: {}, stockItems: {} })
  const allSales = useMemo(() => (data?.sales ?? []) as Sale[], [data])
  const stockById = useMemo(() => {
    const items = (data?.stockItems ?? []) as StockItem[]
    return Object.fromEntries(items.map((s) => [s.id, s])) as Record<string, StockItem>
  }, [data])

  const filtered = useMemo(() => {
    const range = getPeriodRange(period)
    let items = allSales
      .filter((s) => isInRange(s.date, range))
      .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
    if (statusFilter === 'Paid') items = items.filter((s) => s.isPaid)
    if (statusFilter === 'Debt') items = items.filter((s) => !s.isPaid)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((s) =>
        s.brand?.toLowerCase().includes(q) ||
        s.customerName?.toLowerCase().includes(q) ||
        s.color?.toLowerCase().includes(q) ||
        s.paymentMethod?.toLowerCase().includes(q) ||
        s.note?.toLowerCase().includes(q)
      )
    }
    return items
  }, [allSales, statusFilter, search, period])

  const totalRevenue = useMemo(() => filtered.reduce((a, s) => a + (s.totalAmount ?? 0), 0), [filtered])
  const totalCollected = useMemo(() => filtered.reduce((a, s) => a + (s.amountPaid ?? 0), 0), [filtered])

  const columns: Column<Sale>[] = [
    {
      key: 'item',
      header: 'Item',
      cellClassName: 'font-semibold',
      render: (s) =>
        `${[s.brand, s.color ? `(${s.color})` : null].filter(Boolean).join(' ')}${s.size ? ` · Sz ${s.size}` : ''}` || '—',
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (s) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>{s.customerName || '—'}</span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (s) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>{s.paymentMethod ?? 'Cash'}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (s) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>{formatFullDate(s.date)}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cellClassName: 'font-bold',
      render: (s) => formatRWF(s.totalAmount ?? 0),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (s) => {
        const debt = (s.totalAmount ?? 0) - (s.amountPaid ?? 0)
        const unpaid = !s.isPaid && debt > 0
        return <Badge variant={unpaid ? 'red' : 'green'}>{unpaid ? 'Debt' : 'Paid'}</Badge>
      },
    },
  ]

  async function handleDelete() {
    if (!deleteSale) return
    // Deleting a sale puts the pairs back into stock (handles returns/corrections).
    const stock = deleteSale.stockItemId ? stockById[deleteSale.stockItemId] : undefined
    await db.transact([
      db.tx.sales[deleteSale.id].delete(),
      ...(stock
        ? [db.tx.stockItems[stock.id].update({ qty: stock.qty + (deleteSale.qty ?? 1) })]
        : []),
    ])
    setDeleteSale(null)
    setDetailSale(null)
  }

  return (
    <>
      <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
        <PageHeader title="Sales History" />

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-white border border-[#E8E6F5] rounded-[12px] px-3 h-10 shadow-[0_1px_4px_rgba(108,99,255,0.06)]">
            <Search size={15} className="text-[#6B6889] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand, customer, note…"
              className="flex-1 bg-transparent text-[15px] text-[#1A1733] placeholder:text-[#B0ADCA] outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}><X size={14} className="text-[#6B6889]" /></button>
            )}
          </div>
        </div>

        {/* Period filter */}
        <DateRangeFilter value={period} onChange={setPeriod} />

        {/* Status filter */}
        <div className="flex gap-2 px-4 pb-3">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setStatusFilter(t)}
              className={cn('px-4 h-[36px] rounded-full text-[13px] font-semibold transition-all active:scale-95', t === statusFilter ? 'text-white' : 'bg-white border border-[#E8E6F5] text-[#6B6889]')}
              style={t === statusFilter ? { background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)', boxShadow: '0 3px 10px rgba(108,99,255,0.25)' } : {}}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-4 lg:px-8 flex flex-col gap-4 pb-4">
          {/* Summary strip */}
          {!isLoading && (
            <div className="grid grid-cols-2 gap-3 lg:max-w-2xl">
              <Card className="flex flex-col gap-0.5 bg-[#DFFBEF]">
                <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-wider">Revenue</p>
                <p className="text-[20px] font-extrabold text-[#00C26F]">{formatRWF(totalRevenue)}</p>
              </Card>
              <Card className="flex flex-col gap-0.5 bg-[#EEEDFF]">
                <p className="text-[11px] font-bold text-[#6B6889] uppercase tracking-wider">Collected</p>
                <p className="text-[20px] font-extrabold text-[#6C63FF]">{formatRWF(totalCollected)}</p>
              </Card>
            </div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <p className="text-center text-[15px] text-[#6B6889] py-8">
                {search || statusFilter !== 'All' ? 'No sales match' : 'No sales yet'}
              </p>
            </Card>
          ) : (
            <>
              {/* Mobile: stacked rows */}
              <Card padding="none" className="lg:hidden">
                {filtered.map((sale, idx) => (
                  <div key={sale.id} className={cn(idx < filtered.length - 1 && 'border-b border-[#F5F4FF]')}>
                    <SaleRow sale={sale} onTap={() => setDetailSale(sale)} />
                  </div>
                ))}
              </Card>

              {/* Desktop: table */}
              <div className="hidden lg:block">
                <DataTable
                  columns={columns}
                  rows={filtered}
                  rowKey={(s) => s.id}
                  onRowClick={(s) => setDetailSale(s)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail sheet */}
      <DetailSheet
        sale={detailSale}
        isEmployer={isEmployer}
        onEdit={() => { setEditSale(detailSale); setDetailSale(null) }}
        onDelete={() => { setDeleteSale(detailSale); setDetailSale(null) }}
        onClose={() => setDetailSale(null)}
      />

      {/* Edit sheet */}
      <EditSheet sale={editSale} stockItemsById={stockById} onClose={() => setEditSale(null)} />

      {/* Delete confirmation */}
      <div className={cn('fixed inset-0 z-[80] flex items-center justify-center px-10 transition-all duration-200', deleteSale ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
        <div aria-hidden className="absolute inset-0 bg-black/40" onClick={() => setDeleteSale(null)} />
        <div className={cn('relative w-full max-w-[270px] bg-white rounded-2xl overflow-hidden shadow-2xl transition-transform duration-200', deleteSale ? 'scale-100' : 'scale-95')}>
          <div className="pt-5 pb-3 px-5 text-center">
            <p className="text-[17px] font-semibold text-[#1A1733]">Delete Sale</p>
            <p className="text-[13px] text-[#6B6889] mt-1">
              Remove this sale record? This cannot be undone.
            </p>
          </div>
          <div className="border-t border-[#E8E6F5] flex">
            <button onClick={() => setDeleteSale(null)} className="flex-1 py-3 text-[16px] font-medium text-[#6C63FF] border-r border-[#E8E6F5]">Cancel</button>
            <button onClick={handleDelete} className="flex-1 py-3 text-[16px] font-semibold text-[#FF3D5A]">Delete</button>
          </div>
        </div>
      </div>
    </>
  )
}
