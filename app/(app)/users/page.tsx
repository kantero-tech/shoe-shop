'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { id } from '@instantdb/react'
import {
  Trash2, Plus, X, ChevronRight, ShieldCheck,
  Tag, Package, ScrollText, CreditCard, Wallet, BarChart3,
  Boxes, PackagePlus, Pencil, HandCoins, Receipt, Eye,
  type LucideIcon,
} from 'lucide-react'
import { db } from '@/lib/db'
import type { AppUser } from '@/lib/schema'
import { hashPin, getSession } from '@/lib/auth'
import { useIsEmployer } from '@/lib/permissions-context'
import {
  PERMISSION_META, PERM_GROUPS, DEFAULT_PERMISSIONS, readPermissions,
  type PermKey, type PermGroup, type Permissions,
} from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'

// ─── permission definitions ───────────────────────────────────────────────────

interface PermDef {
  key: PermKey
  label: string
  description: string
  group: PermGroup
  Icon: LucideIcon
  color: string
  bg: string
}

const PERM_ICONS: Record<PermKey, LucideIcon> = {
  canSell: Tag,
  canViewStock: Package,
  canViewSales: ScrollText,
  canViewDebts: CreditCard,
  canViewExpenses: Wallet,
  canViewReports: BarChart3,
  canManageStock: Boxes,
  canReceiveStock: PackagePlus,
  canEditSales: Pencil,
  canRecordPayments: HandCoins,
  canManageExpenses: Receipt,
  canSeeCostPrices: Eye,
}

const GROUP_STYLE: Record<PermGroup, { color: string; bg: string }> = {
  Pages: { color: '#6C63FF', bg: '#EEEDFF' },
  Actions: { color: '#007A50', bg: '#DFFBEF' },
  Sensitive: { color: '#CC1234', bg: '#FFE5EB' },
}

const PERMISSIONS: PermDef[] = PERMISSION_META.map((m) => ({
  ...m,
  Icon: PERM_ICONS[m.key],
  color: GROUP_STYLE[m.group].color,
  bg: GROUP_STYLE[m.group].bg,
}))

// ─── helpers ──────────────────────────────────────────────────────────────────

function getPermValue(user: AppUser, key: PermKey): boolean {
  return user[key] ?? true
}

function activePermCount(user: AppUser): number {
  return PERMISSIONS.filter((p) => getPermValue(user, p.key)).length
}

// ─── PIN pad ──────────────────────────────────────────────────────────────────

function PinDot({ filled }: { filled: boolean }) {
  return (
    <span className={cn('w-3 h-3 rounded-full border-2 transition-all duration-150', filled ? 'bg-[#6C63FF] border-[#6C63FF]' : 'bg-transparent border-[#B0ADCA]')} />
  )
}

function PinPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  // Let desktop users type the PIN with the physical keyboard.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) {
        if (value.length < 4) onChange(value + e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        onChange(value.slice(0, -1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [value, onChange])

  return (
    <div className="w-full">
      <div className="flex justify-center gap-3.5 mb-5">
        {[0, 1, 2, 3].map((i) => <PinDot key={i} filled={i < value.length} />)}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {keys.map((k, idx) => {
          if (k === '') return <div key={idx} />
          const isDelete = k === '⌫'
          return (
            <button
              key={k}
              onClick={() => {
                if (isDelete) onChange(value.slice(0, -1))
                else if (value.length < 4) onChange(value + k)
              }}
              className={cn(
                'h-[52px] rounded-xl text-[20px] font-semibold select-none transition-all duration-150 active:scale-90',
                isDelete ? 'bg-transparent text-[#6B6889]' : 'bg-[#F5F4FF] border border-[#E8E6F5] text-[#1A1733]'
              )}
            >
              {k}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Permission card ──────────────────────────────────────────────────────────

function PermCard({
  def,
  enabled,
  onChange,
}: {
  def: PermDef
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.97]',
        enabled ? 'border-[#6C63FF]' : 'border-[#E8E6F5]'
      )}
      style={{ background: enabled ? '#FAFAFF' : 'var(--color-fill)' }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
        style={{ background: enabled ? def.bg : '#E8E6F5', color: enabled ? def.color : '#B0ADCA' }}
      >
        <def.Icon size={18} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-[14px] font-semibold transition-colors', enabled ? 'text-[#1A1733]' : 'text-[#6B6889]')}>
          {def.label}
        </p>
        <p className="text-[12px] text-[#6B6889] mt-0.5 leading-snug">{def.description}</p>
      </div>

      {/* Checkbox */}
      <div
        className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200', enabled ? 'bg-[#6C63FF] border-[#6C63FF]' : 'bg-transparent border-[#D0CEEC]')}
      >
        {enabled && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  )
}

// ─── Grouped permission list ──────────────────────────────────────────────────

function PermissionList({
  perms,
  onToggle,
}: {
  perms: Permissions
  onToggle: (key: PermKey, value: boolean) => void
}) {
  return (
    <>
      {PERM_GROUPS.map((group) => (
        <div key={group} className="flex flex-col gap-2">
          <p className="text-[11px] font-bold text-[#B0ADCA] uppercase tracking-widest pl-1">{group}</p>
          {PERMISSIONS.filter((d) => d.group === group).map((def) => (
            <PermCard
              key={def.key}
              def={def}
              enabled={perms[def.key]}
              onChange={(v) => onToggle(def.key, v)}
            />
          ))}
        </div>
      ))}
    </>
  )
}

// ─── Employee detail sheet ────────────────────────────────────────────────────

function EmployeeSheet({
  user,
  onClose,
  onDelete,
}: {
  user: AppUser | null
  onClose: () => void
  onDelete: (u: AppUser) => void
}) {
  const open = user !== null
  const [perms, setPerms] = useState<Permissions>(DEFAULT_PERMISSIONS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setPerms(readPermissions(user))
  }, [user])

  async function handleToggle(key: PermKey, value: boolean) {
    if (!user) return
    const next = { ...perms, [key]: value }
    setPerms(next)
    setSaving(true)
    try {
      await db.transact(db.tx.users[user.id].update({ [key]: value }))
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

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[17px] font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF6B3D, #FF9240)' }}
          >
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-bold text-[#1A1733] truncate">{user?.name}</p>
            <p className="text-[12px] text-[#6B6889]">Employee</p>
          </div>
          {saving && <p className="text-[12px] text-[#6C63FF] font-medium">Saving…</p>}
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center shrink-0">
            <X size={15} className="text-[#6B6889]" />
          </button>
        </div>

        {/* Permissions */}
        <div className="px-5 pb-6 overflow-y-auto max-h-[70vh] flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} className="text-[#6C63FF]" />
            <p className="text-[12px] font-bold text-[#6B6889] uppercase tracking-widest">Access Permissions</p>
          </div>

          <PermissionList perms={perms} onToggle={handleToggle} />

          {/* Danger zone */}
          <div className="mt-2 pt-4 border-t border-[#F5F4FF]">
            <button
              onClick={() => { onClose(); if (user) onDelete(user) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FFE5EB] text-[#CC1234] text-[15px] font-semibold active:scale-[0.97] transition-all"
            >
              <Trash2 size={16} /> Remove Employee
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Add employee sheet ───────────────────────────────────────────────────────

function AddEmployeeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'name' | 'pin' | 'confirm'>('name')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [perms, setPerms] = useState<Permissions>(DEFAULT_PERMISSIONS)

  function reset() {
    setStep('name'); setName(''); setPin(''); setConfirm(''); setError(''); setSaving(false)
    setPerms(DEFAULT_PERMISSIONS)
  }

  useEffect(() => { if (!open) reset() }, [open])
  useEffect(() => { if (step === 'pin' && pin.length === 4) setStep('confirm') }, [pin, step])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (step === 'confirm' && confirm.length === 4) handleSave() }, [confirm])

  async function handleSave() {
    if (pin !== confirm) {
      setError("PINs don't match"); setConfirm(''); setPin(''); setStep('pin'); return
    }
    setSaving(true)
    try {
      const hashed = await hashPin(pin)
      const newId = id()
      await db.transact(db.tx.users[newId].update({
        name: name.trim(), pin: hashed, role: 'employee', ...perms,
      }))
      onClose()
    } catch {
      setError('Failed to add employee')
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
          <h2 className="text-[18px] font-bold text-[#1A1733]">Add Employee</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F4FF] flex items-center justify-center">
            <X size={15} className="text-[#6B6889]" />
          </button>
        </div>

        <div className="px-5 pb-10 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
          {step === 'name' && (
            <>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Employee name"
                className="w-full px-4 py-3 rounded-[14px] bg-[#F5F4FF] border border-[#E8E6F5] text-[16px] text-[#1A1733] placeholder:text-[#B0ADCA] outline-none focus:border-[#6C63FF]"
              />

              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#6C63FF]" />
                <p className="text-[12px] font-bold text-[#6B6889] uppercase tracking-widest">Access Permissions</p>
              </div>

              <PermissionList
                perms={perms}
                onToggle={(key, v) => setPerms((p) => ({ ...p, [key]: v }))}
              />

              <Button fullWidth disabled={!name.trim()} onClick={() => setStep('pin')}>
                Set PIN →
              </Button>
            </>
          )}

          {step === 'pin' && (
            <>
              <p className="text-[14px] text-[#6B6889] text-center">Create a 4-digit PIN for <strong className="text-[#1A1733]">{name}</strong></p>
              <PinPad value={pin} onChange={setPin} />
            </>
          )}

          {step === 'confirm' && (
            <>
              <p className="text-[14px] text-[#6B6889] text-center">Confirm PIN</p>
              <PinPad value={confirm} onChange={setConfirm} />
            </>
          )}

          {error && <p className="text-[13px] text-[#FF3D5A] text-center">{error}</p>}
          {saving && <p className="text-[13px] text-[#6B6889] text-center">Saving…</p>}
        </div>
      </div>
    </>
  )
}

// ─── User card ────────────────────────────────────────────────────────────────

function UserCard({
  user,
  isSelf,
  onTap,
}: {
  user: AppUser
  isSelf: boolean
  onTap: () => void
}) {
  const isEmployer = user.role === 'employer'
  const count = isEmployer ? PERMISSIONS.length : activePermCount(user)

  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-[#F0EEFF] rounded-2xl shadow-[0_2px_8px_rgba(108,99,255,0.07)] text-left active:scale-[0.98] transition-all duration-150"
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[16px] font-bold shrink-0"
        style={{ background: isEmployer ? 'linear-gradient(135deg, #6C63FF, #8B5CF6)' : 'linear-gradient(135deg, #FF6B3D, #FF9240)' }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#1A1733] truncate">
          {user.name}
          {isSelf && <span className="text-[#6B6889] font-normal text-[12px]"> (you)</span>}
        </p>
        <p className="text-[12px] text-[#6B6889] capitalize mt-0.5">
          {isEmployer ? 'Full access' : `${count} of ${PERMISSIONS.length} permissions`}
        </p>
      </div>

      {/* Permission dots (employee only) */}
      {!isEmployer && (
        <div className="flex gap-1 shrink-0 mr-1">
          {PERMISSIONS.map((p) => (
            <span
              key={p.key}
              className="w-2 h-2 rounded-full"
              style={{ background: getPermValue(user, p.key) ? p.color : '#E8E6F5' }}
              title={p.label}
            />
          ))}
        </div>
      )}

      <ChevronRight size={16} className="text-[#B0ADCA] shrink-0" />
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const router = useRouter()
  const isEmployer = useIsEmployer()
  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null)

  const { data, isLoading } = db.useQuery({ users: {} })
  const users = (data?.users ?? []) as AppUser[]
  const session = getSession()

  useEffect(() => {
    if (!isEmployer) router.push('/dashboard')
  }, [isEmployer, router])

  async function handleDelete() {
    if (!deleteTarget) return
    await db.transact(db.tx.users[deleteTarget.id].delete())
    setDeleteTarget(null)
  }

  if (!isEmployer) return null

  const sorted = [...users].sort((a) => (a.role === 'employer' ? -1 : 1))

  return (
    <>
      <div className="min-h-screen page-content" style={{ background: 'var(--color-bg)' }}>
        <PageHeader
          title="Team"
          subtitle={`${users.length} member${users.length !== 1 ? 's' : ''}`}
          action={
            <button
              onClick={() => setAddOpen(true)}
              aria-label="Add employee"
              className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)', boxShadow: '0 4px 14px rgba(108,99,255,0.35)' }}
            >
              <Plus size={20} className="text-white" strokeWidth={2.5} />
            </button>
          }
        />

        <div className="px-4 lg:px-8 pb-4 flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:items-start">
          {isLoading ? (
            [1, 2].map((i) => <div key={i} className="h-[68px] rounded-2xl bg-[#E8E6F5] animate-pulse" />)
          ) : (
            sorted.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                isSelf={u.id === session?.userId}
                onTap={() => {
                  if (u.role === 'employer') return
                  setEditUser(u)
                }}
              />
            ))
          )}
        </div>
      </div>

      <AddEmployeeSheet open={addOpen} onClose={() => setAddOpen(false)} />

      <EmployeeSheet
        user={editUser}
        onClose={() => setEditUser(null)}
        onDelete={(u) => setDeleteTarget(u)}
      />

      {/* Delete confirmation */}
      <div className={cn('fixed inset-0 z-[80] flex items-center justify-center px-10 transition-all duration-200', deleteTarget ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
        <div aria-hidden className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
        <div className={cn('relative w-full max-w-[270px] bg-white rounded-2xl overflow-hidden shadow-2xl transition-transform duration-200', deleteTarget ? 'scale-100' : 'scale-95')}>
          <div className="pt-5 pb-3 px-5 text-center">
            <p className="text-[17px] font-semibold text-[#1A1733]">Remove Employee</p>
            <p className="text-[13px] text-[#6B6889] mt-1 leading-normal">
              Remove <strong className="text-[#1A1733]">{deleteTarget?.name}</strong> from the team?
            </p>
          </div>
          <div className="border-t border-[#E8E6F5] flex">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 text-[16px] font-medium text-[#6C63FF] border-r border-[#E8E6F5]">Cancel</button>
            <button onClick={handleDelete} className="flex-1 py-3 text-[16px] font-semibold text-[#FF3D5A]">Remove</button>
          </div>
        </div>
      </div>
    </>
  )
}
