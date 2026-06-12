'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2, X, CheckCircle2 } from 'lucide-react'
import { db } from '@/lib/db'
import type { Sale, StockItem, Delivery, ReturnRecord, Expense } from '@/lib/schema'
import { cn } from '@/lib/utils'
import { useIsEmployer, useSession } from '@/lib/permissions-context'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'

const CONFIRM_WORD = 'DELETE'

export default function SettingsPage() {
  const router = useRouter()
  const session = useSession()
  const isEmployer = useIsEmployer()

  useEffect(() => {
    if (session && !isEmployer) router.replace('/dashboard')
  }, [session, isEmployer, router])

  const { data } = db.useQuery({
    stockItems: {},
    sales: {},
    deliveries: {},
    returns: {},
    expenses: {},
  })

  const stockItems = useMemo(() => (data?.stockItems ?? []) as StockItem[], [data?.stockItems])
  const sales = useMemo(() => (data?.sales ?? []) as Sale[], [data?.sales])
  const deliveries = useMemo(() => (data?.deliveries ?? []) as Delivery[], [data?.deliveries])
  const returns = useMemo(() => (data?.returns ?? []) as ReturnRecord[], [data?.returns])
  const expenses = useMemo(() => (data?.expenses ?? []) as Expense[], [data?.expenses])

  const breakdown = [
    { label: 'Shoe types', count: stockItems.length },
    { label: 'Sales', count: sales.length },
    { label: 'Deliveries', count: deliveries.length },
    { label: 'Returns', count: returns.length },
    { label: 'Expenses', count: expenses.length },
  ]
  const totalRecords = breakdown.reduce((a, b) => a + b.count, 0)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [clearing, setClearing] = useState(false)
  const [done, setDone] = useState(false)

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD

  function openConfirm() {
    setConfirmText('')
    setConfirmOpen(true)
  }

  async function handleClear() {
    if (!canConfirm || clearing) return
    setClearing(true)
    try {
      const ops = [
        ...stockItems.map((x) => db.tx.stockItems[x.id].delete()),
        ...sales.map((x) => db.tx.sales[x.id].delete()),
        ...deliveries.map((x) => db.tx.deliveries[x.id].delete()),
        ...returns.map((x) => db.tx.returns[x.id].delete()),
        ...expenses.map((x) => db.tx.expenses[x.id].delete()),
      ]
      if (ops.length > 0) await db.transact(ops)
      setConfirmOpen(false)
      setDone(true)
      setTimeout(() => setDone(false), 2000)
    } finally {
      setClearing(false)
    }
  }

  if (!isEmployer) return null

  return (
    <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
      {/* Success toast */}
      <div
        className={cn(
          'fixed top-16 left-1/2 -translate-x-1/2 z-[90]',
          'flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-[15px] font-semibold',
          'shadow-lg pointer-events-none transition-all duration-300',
          done ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        )}
        style={{ background: '#1E1B4B' }}
      >
        <CheckCircle2 size={16} className="text-[#00C26F]" /> All data cleared
      </div>

      <PageHeader title="Settings" />

      <div className="px-4 lg:px-8 pb-4 flex flex-col gap-4 lg:max-w-2xl">
        {/* Danger zone */}
        <Card className="border border-[#FFD9E0]">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-[#FF3D5A]" />
            <p className="text-[12px] font-bold text-[#FF3D5A] uppercase tracking-widest">Danger zone</p>
          </div>
          <p className="text-[15px] font-semibold text-[#1A1733]">Clear all data</p>
          <p className="text-[13px] text-[#6B6889] mt-1 leading-relaxed">
            Permanently delete every shoe type, sale, delivery, return, and expense. Your team
            accounts and PINs are kept, so everyone can still log in. This cannot be undone.
          </p>

          {/* What will be removed */}
          <div className="mt-3 rounded-2xl bg-[#FAFAFF] border border-[#F0EEFF] divide-y divide-[#F0EEFF]">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[14px] text-[#6B6889]">{b.label}</span>
                <span className="text-[14px] font-semibold text-[#1A1733] tabular-nums">{b.count}</span>
              </div>
            ))}
          </div>

          <button
            onClick={openConfirm}
            disabled={totalRecords === 0}
            className={cn(
              'mt-4 w-full h-[50px] rounded-2xl text-[16px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
              totalRecords === 0
                ? 'bg-[#F3F2FB] text-[#B0ADCA]'
                : 'bg-[#FFE5EB] text-[#CC1234]'
            )}
          >
            <Trash2 size={17} />
            {totalRecords === 0 ? 'Nothing to clear' : `Clear all data (${totalRecords})`}
          </button>
        </Card>
      </div>

      {/* Confirmation modal */}
      <div
        className={cn(
          'fixed inset-0 z-[80] flex items-center justify-center px-6 transition-all duration-200',
          confirmOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div aria-hidden className="absolute inset-0 bg-black/50" onClick={() => !clearing && setConfirmOpen(false)} />
        <div
          className={cn(
            'relative w-full max-w-[340px] bg-white rounded-3xl overflow-hidden shadow-2xl transition-transform duration-200',
            confirmOpen ? 'scale-100' : 'scale-95'
          )}
        >
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE5EB] flex items-center justify-center">
                <AlertTriangle size={24} className="text-[#FF3D5A]" />
              </div>
              <button
                onClick={() => !clearing && setConfirmOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center active:scale-90 transition-all"
              >
                <X size={15} className="text-[#6B6889]" />
              </button>
            </div>

            <p className="text-[18px] font-bold text-[#1A1733] mt-3">Delete everything?</p>
            <p className="text-[13px] text-[#6B6889] mt-1 leading-relaxed">
              This will permanently remove <span className="font-semibold text-[#1A1733]">{totalRecords}</span>{' '}
              record{totalRecords !== 1 ? 's' : ''}. To confirm, type{' '}
              <span className="font-bold text-[#CC1234]">{CONFIRM_WORD}</span> below.
            </p>

            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="mt-3 w-full px-4 py-3 rounded-[14px] bg-[#F5F4FF] border border-[#E8E6F5] text-[16px] font-semibold tracking-wider text-[#1A1733] placeholder:text-[#B0ADCA] placeholder:font-normal outline-none focus:border-[#FF3D5A]"
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={clearing}
                className="flex-1 h-[48px] rounded-2xl bg-[#F5F4FF] text-[16px] font-semibold text-[#6B6889] active:scale-[0.97] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                disabled={!canConfirm || clearing}
                className={cn(
                  'flex-1 h-[48px] rounded-2xl text-[16px] font-semibold text-white transition-all active:scale-[0.97]',
                  canConfirm && !clearing ? 'bg-[#FF3D5A]' : 'bg-[#FBA9B7]'
                )}
              >
                {clearing ? 'Clearing…' : 'Delete all'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
