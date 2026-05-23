'use client'

import { useMemo, useState } from 'react'
import { id } from '@instantdb/react'
import { Package, Plus, Search, Trash2, X } from 'lucide-react'
import { db } from '@/lib/db'
import type { StockItem } from '@/lib/schema'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn, formatRWF } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterTab = 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'
const TABS: FilterTab[] = ['All', 'In Stock', 'Low Stock', 'Out of Stock']

interface FormState {
  brand: string
  color: string
  size: string
  buyPrice: string
  sellPrice: string
  qty: string
}

const BLANK: FormState = { brand: '', color: '', size: '', buyPrice: '', sellPrice: '', qty: '' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function QtyBadge({ qty }: { qty: number }) {
  if (qty === 0) return <Badge variant="red">Out</Badge>
  if (qty <= 2) return <Badge variant="orange">{qty} left</Badge>
  return <Badge variant="green">{qty} left</Badge>
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-card">
        <Package size={36} className="text-[#C7C7CC]" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[17px] font-semibold text-[#1C1C1E]">No stock yet</p>
        <p className="text-[15px] text-[#8E8E93]">Tap + to add your first shoe</p>
      </div>
      <Button onClick={onAdd}>Add your first shoe →</Button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StockPage() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<FilterTab>('All')

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<StockItem | null>(null)
  const [form, setForm] = useState<FormState>(BLANK)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Delete alert state
  const [deleteTarget, setDeleteTarget] = useState<StockItem | null>(null)

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data, isLoading } = db.useQuery({ stockItems: {} })
  const allItems = useMemo(() => (data?.stockItems ?? []) as StockItem[], [data?.stockItems])

  const visible = useMemo(() => {
    let items = allItems
    const q = search.trim().toLowerCase()
    if (q) items = items.filter((item) => item.brand.toLowerCase().includes(q))
    if (tab === 'In Stock') items = items.filter((item) => item.qty > 2)
    if (tab === 'Low Stock') items = items.filter((item) => item.qty > 0 && item.qty <= 2)
    if (tab === 'Out of Stock') items = items.filter((item) => item.qty === 0)
    return items
  }, [allItems, search, tab])

  // ── Sheet helpers ────────────────────────────────────────────────────────────
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
      color: item.color ?? '',
      size: item.size ?? '',
      buyPrice: String(item.buyPrice),
      sellPrice: String(item.sellPrice),
      qty: String(item.qty),
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

  async function handleSave() {
    if (!validate() || saving) return
    setSaving(true)
    try {
      const payload = {
        brand: form.brand.trim(),
        color: form.color.trim(),
        size: form.size.trim(),
        buyPrice: Number(form.buyPrice),
        sellPrice: Number(form.sellPrice),
        qty: Math.max(0, Number(form.qty) || 0),
        dateAdded: editItem?.dateAdded ?? new Date().toISOString(),
      }
      const txId = editItem ? editItem.id : id()
      await db.transact(db.tx.stockItems[txId].update(payload))
      closeSheet()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await db.transact(db.tx.stockItems[deleteTarget.id].delete())
    setDeleteTarget(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Save success toast ── */}
      <div
        className={cn(
          'fixed top-16 left-1/2 -translate-x-1/2 z-[90]',
          'flex items-center gap-2 px-4 py-2.5 rounded-full',
          'bg-[#1C1C1E] text-white text-[15px] font-semibold',
          'shadow-lg pointer-events-none',
          'transition-all duration-300',
          saved ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        Saved
      </div>

      {/* ── Header ── */}
      <PageHeader
        title="Stock"
        action={
          <button
            onClick={openAdd}
            aria-label="Add shoe"
            className="w-11 h-11 rounded-full bg-[#007AFF] flex items-center justify-center shadow-sm active:scale-90 transition-all duration-150"
          >
            <Plus size={22} className="text-white" strokeWidth={2.5} />
          </button>
        }
      />

      {/* ── iOS-style search bar ── */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-[#E5E5EA] rounded-[12px] px-3 h-9">
          <Search size={15} className="text-[#8E8E93] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-[15px] text-[#1C1C1E] placeholder:text-[#8E8E93] outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="shrink-0">
              <X size={14} className="text-[#8E8E93]" />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 px-4 h-[44px] rounded-full text-[13px] font-medium',
              'transition-all duration-150 active:scale-95',
              t === tab ? 'bg-[#007AFF] text-white' : 'bg-[#E5E5EA] text-[#3C3C3E]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Stock list ── */}
      <div className="px-4 pb-36 flex flex-col gap-2.5">
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
          <EmptyState onAdd={openAdd} />
        ) : visible.length === 0 ? (
          <p className="text-center py-16 text-[15px] text-[#8E8E93]">No items match</p>
        ) : (
          visible.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5">
              <Card className="flex-1 min-w-0" padding="sm" onClick={() => openEdit(item)}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#1C1C1E] leading-snug truncate">
                      {item.brand}
                      {item.color && (
                        <span className="font-normal text-[#8E8E93]"> ({item.color})</span>
                      )}
                    </p>
                    <p className="text-[13px] text-[#8E8E93] mt-0.5 truncate">
                      {[
                        item.size ? `Size ${item.size}` : null,
                        `Buy: ${formatRWF(item.buyPrice)}`,
                        `Sell: ${formatRWF(item.sellPrice)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <QtyBadge qty={item.qty} />
                </div>
              </Card>
              <button
                onClick={() => setDeleteTarget(item)}
                aria-label={`Delete ${item.brand}`}
                className="shrink-0 w-11 h-11 rounded-2xl bg-[#FFE9E8] text-[#D70015] flex items-center justify-center active:scale-90 transition-all duration-150"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ══════════════════ Bottom Sheet ══════════════════ */}

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
        aria-label={editItem ? 'Edit Shoe' : 'Add Shoe'}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[70]',
          'bg-white rounded-t-3xl',
          'transition-transform duration-300 ease-out',
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-[#D1D1D6]" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <h2 className="text-[20px] font-bold text-[#1C1C1E]">
            {editItem ? 'Edit Shoe' : 'Add Shoe'}
          </h2>
          <button
            onClick={closeSheet}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center active:scale-90 transition-all duration-150"
          >
            <X size={16} className="text-[#3C3C3E]" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="px-5 pb-10 flex flex-col gap-4 overflow-y-auto max-h-[72vh]">
          <Input
            label="Brand"
            placeholder="e.g. Nike"
            value={form.brand}
            onChange={(e) => setField('brand', e.target.value)}
            error={errors.brand}
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Color"
                placeholder="e.g. Black"
                value={form.color}
                onChange={(e) => setField('color', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Size"
                placeholder="e.g. 42"
                value={form.size}
                onChange={(e) => setField('size', e.target.value)}
              />
            </div>
          </div>

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
            label="Quantity"
            placeholder="0"
            type="number"
            inputMode="numeric"
            value={form.qty}
            onChange={(e) => setField('qty', e.target.value)}
          />

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
              className="text-[17px] font-medium text-[#8E8E93] py-2 text-center active:opacity-60 transition-opacity"
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
            'relative w-full max-w-[270px] bg-white rounded-[14px] overflow-hidden shadow-2xl',
            'transition-transform duration-200',
            deleteTarget ? 'scale-100' : 'scale-95'
          )}
        >
          <div className="pt-5 pb-3 px-5 text-center">
            <p className="text-[17px] font-semibold text-[#1C1C1E]">Delete Shoe</p>
            <p className="text-[13px] text-[#8E8E93] mt-1 leading-normal">
              Remove{' '}
              <span className="text-[#1C1C1E] font-medium">{deleteTarget?.brand}</span> from
              stock? This cannot be undone.
            </p>
          </div>
          <div className="border-t border-[#C6C6C8] flex">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-3 text-[17px] font-medium text-[#007AFF] border-r border-[#C6C6C8] active:bg-[#F2F2F7] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 text-[17px] font-semibold text-[#FF3B30] active:bg-[#FFE9E8] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
