'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { id } from '@instantdb/react'
import { Package, Plus, Search, Trash2, X, PackagePlus } from 'lucide-react'
import { db } from '@/lib/db'
import type { StockItem } from '@/lib/schema'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { cn, formatRWF } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession, useIsEmployer } from '@/lib/permissions-context'

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterTab = 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'
const TABS: FilterTab[] = ['All', 'In Stock', 'Low Stock', 'Out of Stock']

interface FormState {
  brand: string
  buyPrice: string
  sellPrice: string
  supplier: string
  lowStockThreshold: string
  count: string
}

const BLANK: FormState = { brand: '', buyPrice: '', sellPrice: '', supplier: '', lowStockThreshold: '', count: '' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function QtyBadge({ qty }: { qty: number }) {
  if (qty === 0) return <Badge variant="red">Out</Badge>
  if (qty <= 2) return <Badge variant="orange">{qty} left</Badge>
  return <Badge variant="green">{qty} left</Badge>
}

function EmptyState({ canAdd, onAdd }: { canAdd: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(108,99,255,0.1)]">
        <Package size={36} className="text-[#B0ADCA]" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[17px] font-semibold text-[#1A1733]">No shoe types yet</p>
        <p className="text-[15px] text-[#6B6889]">
          {canAdd ? 'Tap + to register your first type' : 'Ask the owner to register shoe types'}
        </p>
      </div>
      {canAdd && <Button onClick={onAdd}>Add your first type →</Button>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StockPage() {
  const router = useRouter()
  const session = useSession()
  const isEmployer = useIsEmployer()

  useEffect(() => {
    // Sellers can reach this page to receive deliveries, even without full stock view.
    if (session && !isEmployer && !session.canViewStock && !session.canSell) {
      router.replace('/dashboard')
    }
  }, [session, isEmployer, router])

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<FilterTab>('All')

  // Type sheet state (owner registers a type)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<StockItem | null>(null)
  const [form, setForm] = useState<FormState>(BLANK)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Receive sheet state (employee records pairs that arrived)
  const [receiveTarget, setReceiveTarget] = useState<StockItem | null>(null)
  const [receiveQty, setReceiveQty] = useState('')
  const [receiveError, setReceiveError] = useState('')
  const [receiving, setReceiving] = useState(false)

  // Delete alert state
  const [deleteTarget, setDeleteTarget] = useState<StockItem | null>(null)

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data, isLoading } = db.useQuery({ stockItems: {} })
  const allItems = useMemo(() => (data?.stockItems ?? []) as StockItem[], [data?.stockItems])

  const visible = useMemo(() => {
    let items = allItems
    const q = search.trim().toLowerCase()
    if (q) items = items.filter((item) => item.brand.toLowerCase().includes(q))
    if (tab === 'In Stock') items = items.filter((item) => item.qty > (item.lowStockThreshold ?? 2))
    if (tab === 'Low Stock') items = items.filter((item) => item.qty > 0 && item.qty <= (item.lowStockThreshold ?? 2))
    if (tab === 'Out of Stock') items = items.filter((item) => item.qty === 0)
    return items
  }, [allItems, search, tab])

  // ── Type sheet helpers ───────────────────────────────────────────────────────
  function openAdd() {
    setEditItem(null)
    setForm(BLANK)
    setErrors({})
    setSheetOpen(true)
  }

  function openEdit(item: StockItem) {
    setEditItem(item)
    setForm({
      brand: item.brand,
      buyPrice: String(item.buyPrice),
      sellPrice: String(item.sellPrice),
      supplier: item.supplier ?? '',
      lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : '',
      count: String(item.qty),
    })
    setErrors({})
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
  }

  function setField(key: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.brand.trim()) errs.brand = 'Required'
    if (!form.buyPrice.trim() || isNaN(Number(form.buyPrice))) errs.buyPrice = 'Enter a number'
    if (!form.sellPrice.trim() || isNaN(Number(form.sellPrice))) errs.sellPrice = 'Enter a number'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSave() {
    if (!validate() || saving) return
    setSaving(true)
    try {
      const payload = {
        brand: form.brand.trim(),
        buyPrice: Number(form.buyPrice),
        sellPrice: Number(form.sellPrice),
        // New types start empty (staff receive stock). When editing, the owner can
        // correct the count here if a miscount happened.
        qty: editItem ? Math.max(0, Math.floor(Number(form.count) || 0)) : 0,
        dateAdded: editItem?.dateAdded ?? new Date().toISOString(),
        supplier: form.supplier.trim(),
        lowStockThreshold: form.lowStockThreshold ? Math.max(1, Number(form.lowStockThreshold)) : 2,
      }
      const txId = editItem ? editItem.id : id()
      await db.transact(db.tx.stockItems[txId].update(payload))
      closeSheet()
      flashSaved()
    } finally {
      setSaving(false)
    }
  }

  // ── Receive sheet helpers ─────────────────────────────────────────────────────
  function openReceive(item: StockItem) {
    setReceiveTarget(item)
    setReceiveQty('')
    setReceiveError('')
  }

  function closeReceive() {
    setReceiveTarget(null)
  }

  async function handleReceive() {
    if (!receiveTarget || receiving) return
    const received = Number(receiveQty)
    if (!receiveQty.trim() || isNaN(received) || received <= 0) {
      setReceiveError('Enter how many pairs arrived')
      return
    }
    setReceiving(true)
    try {
      await db.transact(
        db.tx.stockItems[receiveTarget.id].update({ qty: receiveTarget.qty + Math.floor(received) })
      )
      closeReceive()
      flashSaved()
    } finally {
      setReceiving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await db.transact(db.tx.stockItems[deleteTarget.id].delete())
    setDeleteTarget(null)
  }

  // Tapping a row: owner edits the type, employee records a delivery.
  function onRowTap(item: StockItem) {
    if (isEmployer) openEdit(item)
    else openReceive(item)
  }

  const columns: Column<StockItem>[] = [
    {
      key: 'item',
      header: 'Name',
      cellClassName: 'font-semibold',
      render: (s) => s.brand,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (s) => <span style={{ color: 'var(--color-text-secondary)' }}>{s.supplier || '—'}</span>,
    },
    {
      key: 'buy',
      header: 'Buy',
      align: 'right',
      render: (s) => <span style={{ color: 'var(--color-text-secondary)' }}>{formatRWF(s.buyPrice)}</span>,
    },
    {
      key: 'sell',
      header: 'Sell',
      align: 'right',
      cellClassName: 'font-semibold',
      render: (s) => formatRWF(s.sellPrice),
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      render: (s) => <QtyBadge qty={s.qty} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <div className="inline-flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openReceive(s) }}
            aria-label={`Receive ${s.brand}`}
            className="h-8 px-3 rounded-lg bg-[#EEEDFF] text-[#6C63FF] text-[13px] font-semibold inline-flex items-center gap-1 active:scale-95 transition-all"
          >
            <PackagePlus size={14} /> Receive
          </button>
          {isEmployer && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(s) }}
              aria-label={`Delete ${s.brand}`}
              className="w-8 h-8 rounded-lg bg-[#FFE5EB] text-[#CC1234] inline-flex items-center justify-center active:scale-90 transition-all"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
      {/* ── Save success toast ── */}
      <div
        className={cn(
          'fixed top-16 left-1/2 -translate-x-1/2 z-[90]',
          'flex items-center gap-2 px-4 py-2.5 rounded-full',
          'text-white text-[15px] font-semibold',
          'shadow-lg pointer-events-none',
          'transition-all duration-300',
          saved ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        )}
        style={{ background: '#1E1B4B' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C26F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        Saved
      </div>

      {/* ── Header ── */}
      <PageHeader
        title="Stock"
        action={
          isEmployer ? (
            <button
              onClick={openAdd}
              aria-label="Add shoe type"
              className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all duration-150"
              style={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)',
                boxShadow: '0 4px 14px rgba(108, 99, 255, 0.35)',
              }}
            >
              <Plus size={22} className="text-white" strokeWidth={2.5} />
            </button>
          ) : undefined
        }
      />

      {/* ── Search bar ── */}
      <div className="px-4 lg:px-8 pb-3">
        <div className="flex items-center gap-2 bg-white border border-[#E8E6F5] rounded-[12px] px-3 h-10 shadow-[0_1px_4px_rgba(108,99,255,0.06)] lg:max-w-md">
          <Search size={15} className="text-[#6B6889] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-[15px] text-[#1A1733] placeholder:text-[#B0ADCA] outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="shrink-0">
              <X size={14} className="text-[#6B6889]" />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex gap-2 px-4 lg:px-8 pb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 px-4 h-[38px] rounded-full text-[13px] font-semibold',
              'transition-all duration-150 active:scale-95',
              t === tab ? 'text-white' : 'bg-white border border-[#E8E6F5] text-[#6B6889]'
            )}
            style={t === tab ? {
              background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)',
              boxShadow: '0 3px 10px rgba(108, 99, 255, 0.28)',
            } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Stock list ── */}
      <div className="px-4 lg:px-8 pb-4 flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="h-14 flex-1" />
                <Skeleton className="h-10 w-10" />
              </div>
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <EmptyState canAdd={isEmployer} onAdd={openAdd} />
        ) : visible.length === 0 ? (
          <p className="text-center py-16 text-[15px] text-[#6B6889]">No items match</p>
        ) : (
          <>
          {/* Desktop: inventory table */}
          <div className="hidden lg:block">
            <DataTable
              columns={isEmployer ? columns : columns.filter((c) => c.key !== 'buy')}
              rows={visible}
              rowKey={(s) => s.id}
              onRowClick={(s) => onRowTap(s)}
            />
          </div>

          {/* Mobile: stacked cards */}
          <div className="lg:hidden flex flex-col gap-2.5">
          {visible.map((item) => {
            const threshold = item.lowStockThreshold ?? 2
            const isLow = item.qty > 0 && item.qty <= threshold
            const isOut = item.qty === 0
            return (
              <div key={item.id} className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'flex-1 min-w-0 bg-white border rounded-2xl shadow-[0_2px_8px_rgba(108,99,255,0.07)] overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-150',
                    isOut ? 'border-l-4 border-l-[#FF3D5A] border-[#FFE5EB]' : isLow ? 'border-l-4 border-l-[#F59E0B] border-[#FFF4DB]' : 'border-[#F0EEFF]'
                  )}
                  onClick={() => onRowTap(item)}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#1A1733] leading-snug truncate">
                        {item.brand}
                      </p>
                      <p className="text-[13px] text-[#6B6889] mt-0.5 truncate">
                        {[
                          isEmployer ? `Buy: ${formatRWF(item.buyPrice)}` : null,
                          `Sell: ${formatRWF(item.sellPrice)}`,
                          item.supplier ? `From: ${item.supplier}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <QtyBadge qty={item.qty} />
                  </div>
                  <div className="border-t border-[#F0EEFF] px-4 py-2 flex items-center justify-between">
                    <span className={cn('text-[12px] font-medium', isOut ? 'text-[#FF3D5A]' : 'text-[#6B6889]')}>
                      {isOut ? 'Out of stock' : `${item.qty} in stock`}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openReceive(item) }}
                      className="text-[12px] font-semibold text-[#6C63FF] bg-[#EEEDFF] rounded-lg px-3 py-1 inline-flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <PackagePlus size={13} /> Receive
                    </button>
                  </div>
                </div>
                {isEmployer && (
                  <button
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`Delete ${item.brand}`}
                    className="shrink-0 w-11 h-11 rounded-2xl bg-[#FFE5EB] text-[#CC1234] flex items-center justify-center active:scale-90 transition-all duration-150"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            )
          })}
          </div>
          </>
        )}
      </div>

      </div>{/* end page-content wrapper */}

      {/* ══════════════════ Type Bottom Sheet ══════════════════ */}

      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-[60] bg-black/40',
          'transition-opacity duration-300',
          sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeSheet}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editItem ? 'Edit Type' : 'Add Type'}
        className={cn(
          'fixed bottom-0 z-[70]',
          'bg-white rounded-t-3xl',
          'transition-transform duration-300 ease-out',
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          left: 'max(0px, calc(50% - 240px))',
          right: 'max(0px, calc(50% - 240px))',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-[#E8E6F5]" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <h2 className="text-[20px] font-bold text-[#1A1733]">
            {editItem ? 'Edit Type' : 'Add Type'}
          </h2>
          <button
            onClick={closeSheet}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center active:scale-90 transition-all duration-150"
          >
            <X size={16} className="text-[#6B6889]" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="px-5 pb-10 flex flex-col gap-4 overflow-y-auto max-h-[72vh]">
          <Input
            label="Name"
            placeholder="e.g. Nike Air sneakers"
            value={form.brand}
            onChange={(e) => setField('brand', e.target.value)}
            error={errors.brand}
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Buy Price"
                placeholder="0"
                type="number"
                inputMode="numeric"
                value={form.buyPrice}
                onChange={(e) => setField('buyPrice', e.target.value)}
                error={errors.buyPrice}
                helper="RWF"
              />
            </div>
            <div className="flex-1">
              <Input
                label="Sell Price"
                placeholder="0"
                type="number"
                inputMode="numeric"
                value={form.sellPrice}
                onChange={(e) => setField('sellPrice', e.target.value)}
                error={errors.sellPrice}
                helper="RWF"
              />
            </div>
          </div>

          <Input
            label="Supplier (optional)"
            placeholder="e.g. Kimura Wholesale"
            value={form.supplier}
            onChange={(e) => setField('supplier', e.target.value)}
          />

          <Input
            label="Low Stock Alert At"
            placeholder="2"
            type="number"
            inputMode="numeric"
            value={form.lowStockThreshold}
            onChange={(e) => setField('lowStockThreshold', e.target.value)}
            helper="pairs left (default 2)"
          />

          {editItem ? (
            <Input
              label="Stock count (correction)"
              placeholder="0"
              type="number"
              inputMode="numeric"
              value={form.count}
              onChange={(e) => setField('count', e.target.value)}
              helper="only change this to fix a wrong count"
            />
          ) : (
            <p className="text-[13px] text-[#6B6889] -mt-1">
              Quantity is added by staff using <span className="font-semibold text-[#6C63FF]">Receive</span> when shoes arrive.
            </p>
          )}

          {/* Actions */}
          <div
            className="flex flex-col gap-2 pt-2"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
          >
            <Button onClick={handleSave} loading={saving} fullWidth>
              Save
            </Button>
            <button
              onClick={closeSheet}
              className="text-[16px] font-medium text-[#6B6889] py-2 text-center active:opacity-60 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════ Receive Bottom Sheet ══════════════════ */}

      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-[60] bg-black/40',
          'transition-opacity duration-300',
          receiveTarget ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeReceive}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Receive Stock"
        className={cn(
          'fixed bottom-0 z-[70]',
          'bg-white rounded-t-3xl',
          'transition-transform duration-300 ease-out',
          receiveTarget ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          left: 'max(0px, calc(50% - 240px))',
          right: 'max(0px, calc(50% - 240px))',
        }}
      >
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-[#E8E6F5]" />
        </div>

        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <h2 className="text-[20px] font-bold text-[#1A1733]">Receive Stock</h2>
          <button
            onClick={closeReceive}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center active:scale-90 transition-all duration-150"
          >
            <X size={16} className="text-[#6B6889]" />
          </button>
        </div>

        <div className="px-5 pb-10 flex flex-col gap-4 overflow-y-auto max-h-[72vh]">
          <p className="text-[14px] text-[#6B6889]">
            <span className="font-semibold text-[#1A1733]">{receiveTarget?.brand}</span>
            {' · '}currently {receiveTarget?.qty ?? 0} in stock
          </p>

          <Input
            label="Pairs received"
            placeholder="0"
            type="number"
            inputMode="numeric"
            value={receiveQty}
            onChange={(e) => { setReceiveQty(e.target.value); setReceiveError('') }}
            error={receiveError}
            helper="how many arrived in the shop"
          />

          {receiveQty && !isNaN(Number(receiveQty)) && Number(receiveQty) > 0 && (
            <div className="bg-[#EEEDFF] rounded-2xl px-4 py-3 text-[14px] text-[#1A1733]">
              New total:{' '}
              <span className="font-bold text-[#6C63FF]">
                {(receiveTarget?.qty ?? 0) + Math.floor(Number(receiveQty))} pairs
              </span>
            </div>
          )}

          <div
            className="flex flex-col gap-2 pt-2"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
          >
            <Button onClick={handleReceive} loading={receiving} fullWidth>
              Add to stock
            </Button>
            <button
              onClick={closeReceive}
              className="text-[16px] font-medium text-[#6B6889] py-2 text-center active:opacity-60 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════ Delete Alert ══════════════════ */}
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
            'relative w-full max-w-[270px] bg-white rounded-2xl overflow-hidden shadow-2xl',
            'transition-transform duration-200',
            deleteTarget ? 'scale-100' : 'scale-95'
          )}
        >
          <div className="pt-5 pb-3 px-5 text-center">
            <p className="text-[17px] font-semibold text-[#1A1733]">Delete Type</p>
            <p className="text-[13px] text-[#6B6889] mt-1 leading-normal">
              Remove{' '}
              <span className="text-[#1A1733] font-medium">{deleteTarget?.brand}</span> from
              stock? This cannot be undone.
            </p>
          </div>
          <div className="border-t border-[#E8E6F5] flex">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-3 text-[17px] font-medium text-[#6C63FF] border-r border-[#E8E6F5] active:bg-[#F5F4FF] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 text-[17px] font-semibold text-[#FF3D5A] active:bg-[#FFE5EB] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
