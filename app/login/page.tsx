'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { id } from '@instantdb/react'
import { db } from '@/lib/db'
import type { AppUser, UserRole } from '@/lib/schema'
import { hashPin, setSession } from '@/lib/auth'
import { readPermissions, DEFAULT_PERMISSIONS } from '@/lib/permissions'
import { cn } from '@/lib/utils'

// ── PIN pad ───────────────────────────────────────────────────────────────────

function PinDot({ filled }: { filled: boolean }) {
  return (
    <span
      className={cn(
        'w-3.5 h-3.5 rounded-full border-2 transition-all duration-150',
        filled
          ? 'bg-[#6C63FF] border-[#6C63FF]'
          : 'bg-transparent border-[#B0ADCA]'
      )}
    />
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
    <div className="w-full max-w-[280px] mx-auto">
      {/* Dots */}
      <div className="flex justify-center gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <PinDot key={i} filled={i < value.length} />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k, idx) => {
          if (k === '') return <div key={idx} />

          const isDelete = k === '⌫'
          return (
            <button
              key={k}
              onClick={() => {
                if (isDelete) {
                  onChange(value.slice(0, -1))
                } else if (value.length < 4) {
                  onChange(value + k)
                }
              }}
              className={cn(
                'h-[60px] rounded-2xl text-[22px] font-semibold select-none',
                'transition-all duration-150 active:scale-90',
                isDelete
                  ? 'bg-transparent text-[#6B6889] text-[24px]'
                  : 'bg-white border border-[#E8E6F5] text-[#1A1733] shadow-[0_2px_6px_rgba(108,99,255,0.06)]'
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

// ── Setup screen (first launch) ───────────────────────────────────────────────

function SetupScreen({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'name' | 'pin' | 'confirm'>('name')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (pin !== confirm) {
      setError("PINs don't match")
      setConfirm('')
      setStep('pin')
      setPin('')
      return
    }
    setSaving(true)
    try {
      const hashed = await hashPin(pin)
      const newId = id()
      await db.transact(
        db.tx.users[newId].update({
          name: name.trim(),
          pin: hashed,
          role: 'employer' as UserRole,
          ...DEFAULT_PERMISSIONS,
        })
      )
      onCreated()
    } catch {
      setError('Failed to create account')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (step === 'confirm' && confirm.length === 4) {
      handleCreate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm])

  useEffect(() => {
    if (step === 'pin' && pin.length === 4) {
      setStep('confirm')
    }
  }, [pin, step])

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Brand */}
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[32px]"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
        >
          👟
        </div>
        <h1 className="text-[26px] font-extrabold text-[#1A1733]">Welcome to Mpenzi</h1>
        <p className="text-[14px] text-[#6B6889] mt-1">Set up your employer account</p>
      </div>

      {step === 'name' && (
        <div className="w-full max-w-[280px] flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-[14px] bg-white border border-[#E8E6F5] text-[16px] text-[#1A1733] placeholder:text-[#B0ADCA] outline-none focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20"
          />
          <button
            onClick={() => name.trim() && setStep('pin')}
            disabled={!name.trim()}
            className="w-full h-12 rounded-2xl text-white text-[16px] font-semibold disabled:opacity-40 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)', boxShadow: '0 4px 14px rgba(108,99,255,0.35)' }}
          >
            Continue
          </button>
        </div>
      )}

      {step === 'pin' && (
        <>
          <p className="text-[16px] font-semibold text-[#1A1733]">Create a 4-digit PIN</p>
          <PinPad value={pin} onChange={setPin} />
        </>
      )}

      {step === 'confirm' && (
        <>
          <p className="text-[16px] font-semibold text-[#1A1733]">Confirm your PIN</p>
          <PinPad value={confirm} onChange={setConfirm} />
        </>
      )}

      {error && <p className="text-[14px] text-[#FF3D5A] font-medium">{error}</p>}
      {saving && <p className="text-[14px] text-[#6B6889]">Creating account…</p>}
    </div>
  )
}

// ── Login screen ──────────────────────────────────────────────────────────────

function LoginScreen({
  users,
  onLoggedIn,
}: {
  users: AppUser[]
  onLoggedIn: () => void
}) {
  const [selected, setSelected] = useState<AppUser | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (selected && pin.length === 4) {
      verifyPin()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  async function verifyPin() {
    if (!selected) return
    setChecking(true)
    setError('')
    try {
      const hashed = await hashPin(pin)
      if (hashed === selected.pin) {
        setSession({
          userId: selected.id,
          name: selected.name,
          role: selected.role,
          ...(selected.role === 'employer' ? DEFAULT_PERMISSIONS : readPermissions(selected)),
        })
        onLoggedIn()
      } else {
        setError('Wrong PIN')
        setPin('')
      }
    } finally {
      setChecking(false)
    }
  }

  if (!selected) {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Brand */}
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[32px]"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
          >
            👟
          </div>
          <h1 className="text-[26px] font-extrabold text-[#1A1733]">Mpenzi Shoes</h1>
          <p className="text-[14px] text-[#6B6889] mt-1">Who is working today?</p>
        </div>

        <div className="w-full max-w-[320px] flex flex-col gap-2">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white border border-[#E8E6F5] shadow-[0_2px_8px_rgba(108,99,255,0.07)] text-left active:scale-[0.98] transition-all"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[16px] font-bold shrink-0"
                style={{ background: u.role === 'employer' ? 'linear-gradient(135deg, #6C63FF, #8B5CF6)' : 'linear-gradient(135deg, #FF6B3D, #FF9240)' }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1A1733]">{u.name}</p>
                <p className="text-[12px] text-[#6B6889] capitalize">{u.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[28px] font-bold"
          style={{ background: selected.role === 'employer' ? 'linear-gradient(135deg, #6C63FF, #8B5CF6)' : 'linear-gradient(135deg, #FF6B3D, #FF9240)' }}
        >
          {selected.name.charAt(0).toUpperCase()}
        </div>
        <p className="text-[18px] font-bold text-[#1A1733]">{selected.name}</p>
        <button
          onClick={() => { setSelected(null); setPin(''); setError('') }}
          className="text-[13px] text-[#6C63FF] font-medium"
        >
          Not you? Switch user
        </button>
      </div>

      <p className="text-[14px] text-[#6B6889]">Enter your 4-digit PIN</p>

      <PinPad value={pin} onChange={(v) => { setPin(v); setError('') }} />

      {error && <p className="text-[14px] text-[#FF3D5A] font-medium">{error}</p>}
      {checking && <p className="text-[14px] text-[#6B6889]">Checking…</p>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const { data, isLoading } = db.useQuery({ users: {} })
  const users = (data?.users ?? []) as AppUser[]

  function handleSuccess() {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#6C63FF] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--color-bg)' }}
    >
      {users.length === 0 ? (
        <SetupScreen onCreated={handleSuccess} />
      ) : (
        <LoginScreen users={users} onLoggedIn={handleSuccess} />
      )}
    </div>
  )
}
