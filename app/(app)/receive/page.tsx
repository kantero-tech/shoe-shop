'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { id } from '@instantdb/react'
import { Search, X, PackagePlus, CheckCircle2 } from 'lucide-react'
import { db } from '@/lib/db'
import type { StockItem, Delivery } from '@/lib/schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatRWF, formatCount, formatDateShort } from '@/lib/utils'
import { useSession, useCan } from '@/lib/permissions-context'

// ─── Type row ──────────────────────────────────────────────────────────────────

const TypeRow = /*#__PURE__*/ React.memo(function TypeRow({
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
          ? 'bg-[#EEEDFF] border border-[#6C63FF]/30'
          : 'bg-white border border-[#F0EEFF] shadow-[0_2px_8px_rgba(108,99,255,0.07)]'
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-semibold text-[#1A1733] truncate">{item.brand}</p>
        <p className="text-[14px] text-[#6B6889] mt-0.5">{formatCount(item.qty)} in stock</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[15px] font-bold text-[#6C63FF]">{formatRWF(item.sellPrice)}</p>
        <p className="text-[12px] text-[#B0ADCA]">sell price</p>
      </div>
    </button>
  )
})

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReceivePage() {
  const router = useRouter()
  const session = useSession()
  const canReceive = useCan('canReceiveStock')

  useEffect(() => {
    if (session && !canReceive) router.replace('/dashboard')
  }, [session, canReceive, router])

  const { data, isLoading } = db.useQuery({ stockItems: {}, deliveries: {} })
  const allItems = useMemo(() => (data?.stockItems ?? []) as StockItem[], [data?.stockItems])
  const allDeliveries = useMemo(() => (data?.deliveries ?? []) as Delivery[], [data?.deliveries])

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<StockItem | null>(null)
  const [qty, setQty] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Keep the selected type's live quantity in sync as deliveries land.
  const selectedLive = useMemo(
    () => (selected ? allItems.find((i) => i.id === selected.id) ?? selected : null),
    [selected, allItems]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter((item) => item.brand.toLowerCase().includes(q))
  }, [allItems, search])

  const recentDeliveries = useMemo(() => {
    if (!selected) return []
    return allDeliveries
      .filter((d) => d.stockItemId === selected.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
  }, [allDeliveries, selected])

  function selectType(item: StockItem) {
    setSelected(item)
    setQty('')
    setColor('')
    setSize('')
    setError('')
  }

  function clearSelection() {
    setSelected(null)
    setError('')
  }

  const received = Number(qty)
  const validQty = qty.trim() !== '' && !isNaN(received) && received > 0
  const pairs = validQty ? Math.floor(received) : 0

  async function handleReceive() {
    if (!selectedLive || saving) return
    if (!validQty) {
      setError('Enter how many pairs arrived')
      return
    }
    setSaving(true)
    try {
      await db.transact([
        db.tx.stockItems[selectedLive.id].update({ qty: selectedLive.qty + pairs }),
        db.tx.deliveries[id()].update({
          stockItemId: selectedLive.id,
          brand: selectedLive.brand,
          qty: pairs,
          color: color.trim(),
          size: size.trim(),
          date: new Date().toISOString(),
        }),
      ])
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        clearSelection()
      }, 1400)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
      {/* Success overlay */}
      {success && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(26,23,51,0.6)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex flex-col items-center gap-4 bg-white rounded-3xl px-12 py-10 mx-6 shadow-2xl">
            <div className="w-24 h-24 rounded-full bg-[#DFFBEF] flex items-center justify-center">
              <CheckCircle2 size={48} className="text-[#00C26F]" />
            </div>
            <p className="text-[22px] font-bold text-[#1A1733]">Stock Added!</p>
          </div>
        </div>
      )}

      <PageHeader title="Receive Stock" subtitle="Pick a shoe and enter how many arrived" />

      <div className="px-4 lg:px-8 pb-4 flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
        {/* Left: type picker */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-[#E8E6F5] rounded-[12px] px-3 h-10 shadow-[0_1px_4px_rgba(108,99,255,0.06)]">
            <Search size={15} className="text-[#6B6889] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the shoes the owner registered…"
              className="flex-1 bg-transparent text-[15px] text-[#1A1733] placeholder:text-[#B0ADCA] outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="shrink-0 active:opacity-60">
                <X size={14} className="text-[#6B6889]" />
              </button>
            )}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : allItems.length === 0 ? (
            <p className="text-center py-12 text-[15px] text-[#6B6889]">
              No shoe types yet. Ask the owner to register shoes first.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-[15px] text-[#6B6889]">No shoes match your search</p>
          ) : (
            <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2">
              {filtered.map((item) => (
                <TypeRow
                  key={item.id}
                  item={item}
                  selected={selectedLive?.id === item.id}
                  onSelect={() => selectType(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: receive form */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 flex flex-col gap-4">
          {selectedLive ? (
            <div className="flex flex-col gap-4 bg-white rounded-3xl border border-[#F0EEFF] shadow-[0_2px_8px_rgba(108,99,255,0.07)] p-4">
              {/* Selected header */}
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[17px] font-bold text-[#1A1733] truncate">{selectedLive.brand}</p>
                  <p className="text-[13px] text-[#6B6889]">{formatCount(selectedLive.qty)} in stock now</p>
                </div>
                <button
                  onClick={clearSelection}
                  aria-label="Clear selection"
                  className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center active:scale-90 transition-all shrink-0"
                >
                  <X size={15} className="text-[#6B6889]" />
                </button>
              </div>

              <Input
                label="Pairs received"
                placeholder="0"
                type="number"
                inputMode="numeric"
                value={qty}
                onChange={(e) => { setQty(e.target.value); setError('') }}
                error={error}
                helper="how many arrived in the shop"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Color (optional)"
                  placeholder="Black"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <Input
                  label="Size (optional)"
                  placeholder="42"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
              </div>

              {validQty && (
                <div className="bg-[#EEEDFF] rounded-2xl px-4 py-3 text-[14px] text-[#1A1733]">
                  New total:{' '}
                  <span className="font-bold text-[#6C63FF]">{selectedLive.qty + pairs} pairs</span>
                </div>
              )}

              <Button onClick={handleReceive} loading={saving} fullWidth className="h-[52px] rounded-2xl text-[17px]">
                <PackagePlus size={18} className="mr-1" /> Add to stock
              </Button>

              {recentDeliveries.length > 0 && (
                <div className="flex flex-col gap-2 pt-1">
                  <p className="text-[12px] font-bold text-[#6B6889] uppercase tracking-wider">Recent deliveries</p>
                  <div className="flex flex-col gap-1.5">
                    {recentDeliveries.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between bg-[#F7F6FF] rounded-xl px-3 py-2 text-[13px]"
                      >
                        <span className="text-[#1A1733] font-medium">
                          +{d.qty}
                          {[d.color, d.size ? `Sz ${d.size}` : null].filter(Boolean).length > 0 && (
                            <span className="text-[#6B6889] font-normal">
                              {' · '}
                              {[d.color, d.size ? `Sz ${d.size}` : null].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </span>
                        <span className="text-[#B0ADCA]">{formatDateShort(d.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:block bg-white rounded-3xl border border-[#F0EEFF] p-8">
              <p className="text-center text-[15px] text-[#6B6889]">
                Select a shoe on the left to record what arrived.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
