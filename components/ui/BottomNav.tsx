'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSession, useIsEmployer } from '@/lib/permissions-context'

// ─── tab definitions ──────────────────────────────────────────────────────────

interface Tab {
  href: string
  label: string
  employerOnly?: boolean
  permKey?: 'canSell' | 'canViewStock' | 'canViewDebts' | 'canReceiveStock'
  icon: (active: boolean) => React.ReactNode
}

const MAIN_TABS: Tab[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#A5A0FF' : 'none'} stroke={active ? '#A5A0FF' : '#8B89B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 12 15 12 15 21" />
      </svg>
    ),
  },
  {
    href: '/stock',
    label: 'Stock',
    permKey: 'canViewStock',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#A5A0FF' : '#8B89B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: '/receive',
    label: 'Receive',
    permKey: 'canReceiveStock',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#A5A0FF' : '#8B89B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16h6M19 13v6" />
        <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: '/sell',
    label: 'Sell',
    permKey: 'canSell',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#A5A0FF' : '#8B89B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    href: '/debts',
    label: 'Debts',
    permKey: 'canViewDebts',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#A5A0FF' : '#8B89B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
]

interface MoreItem {
  href: string
  label: string
  description: string
  employerOnly?: boolean
  permKey?: 'canViewSales' | 'canViewExpenses'
  icon: React.ReactNode
  color: string
  bg: string
}

const MORE_ITEMS: MoreItem[] = [
  {
    href: '/sales',
    label: 'Sales History',
    description: 'Browse, edit and search all past sales',
    permKey: 'canViewSales',
    color: '#6C63FF',
    bg: '#EEEDFF',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/closeout',
    label: 'End of Day',
    description: "Today's takings and cash in the till",
    permKey: 'canViewSales',
    color: '#0369A1',
    bg: '#E0F2FE',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="8" y2="10" />
        <line x1="12" y1="10" x2="12" y2="10" />
        <line x1="16" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="8" y2="14" />
        <line x1="12" y1="14" x2="12" y2="14" />
        <line x1="16" y1="14" x2="16" y2="18" />
        <line x1="8" y1="18" x2="12" y2="18" />
      </svg>
    ),
  },
  {
    href: '/expenses',
    label: 'Expenses',
    description: 'View and add business expenses',
    permKey: 'canViewExpenses',
    color: '#CC1234',
    bg: '#FFE5EB',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Reports',
    description: 'Revenue, profit, and analytics',
    employerOnly: true,
    color: '#007A50',
    bg: '#DFFBEF',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: '/users',
    label: 'Team',
    description: 'Manage employees and permissions',
    color: '#8B5CF6',
    bg: '#F3F0FF',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

// ─── More drawer ──────────────────────────────────────────────────────────────

function MoreDrawer({ open, onClose, isEmployer, session }: { open: boolean; onClose: () => void; isEmployer: boolean; session: ReturnType<typeof useSession> }) {
  const router = useRouter()

  const visibleItems = MORE_ITEMS.filter((item) => {
    if (item.employerOnly && !isEmployer) return false
    if (!isEmployer && item.permKey) return session?.[item.permKey] ?? true
    return true
  })

  function navigate(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className={cn(
          'fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 z-[70] rounded-t-3xl transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          left: 'max(0px, calc(50% - 240px))',
          right: 'max(0px, calc(50% - 240px))',
          background: 'var(--color-surface)',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#E8E6F5]" />
        </div>

        {/* Title */}
        <div className="px-5 pt-2 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
            More
          </p>
        </div>

        {/* Items */}
        <div className="px-4 flex flex-col gap-2.5 pb-2">
          {visibleItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border active:scale-[0.97] transition-all duration-150 text-left"
              style={{
                background: 'var(--color-fill)',
                borderColor: 'var(--color-border)',
              }}
            >
              {/* Icon bubble */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: item.bg, color: item.color }}
              >
                {item.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>
                  {item.label}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.description}
                </p>
              </div>

              {/* Chevron */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname()
  const session = useSession()
  const isEmployer = useIsEmployer()
  const [moreOpen, setMoreOpen] = useState(false)

  // Check if current page is one of the "More" items so we can highlight the More tab
  const moreHrefs = MORE_ITEMS.map((i) => i.href)
  const moreActive = moreHrefs.some((href) => pathname.startsWith(href))

  const visibleTabs = MAIN_TABS.filter((tab) => {
    if (!tab.permKey) return true
    if (isEmployer) return true
    return session?.[tab.permKey] ?? true
  })

  return (
    <>
      <nav
        className="fixed bottom-0 z-50 flex items-stretch rounded-t-[24px] lg:hidden"
        style={{
          left: 'max(0px, calc(50% - 240px))',
          right: 'max(0px, calc(50% - 240px))',
          background: '#1E1B4B',
          boxShadow: '0 -8px 32px rgba(30, 27, 75, 0.22)',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Main tabs */}
        {visibleTabs.map((tab) => {
          const isActive = !moreActive && (
            tab.href === '/dashboard'
              ? pathname === '/dashboard' || pathname === '/'
              : pathname.startsWith(tab.href)
          )

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 pt-3 pb-1',
                'min-h-[58px] transition-all duration-200 active:opacity-60 active:scale-95 select-none relative'
              )}
            >
              {isActive && (
                <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[#6C63FF]" />
              )}
              <span className={cn('flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200', isActive && 'bg-[rgba(108,99,255,0.18)]')}>
                {tab.icon(isActive)}
              </span>
              <span className={cn('text-[10px] font-semibold leading-none', isActive ? 'text-[#A5A0FF]' : 'text-[#8B89B8]')}>
                {tab.label}
              </span>
            </Link>
          )
        })}

        {/* More tab */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-1 pt-3 pb-1',
            'min-h-[58px] transition-all duration-200 active:opacity-60 active:scale-95 select-none relative'
          )}
        >
          {moreActive && (
            <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[#6C63FF]" />
          )}
          <span className={cn('flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200', moreActive && 'bg-[rgba(108,99,255,0.18)]')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={moreActive ? '#A5A0FF' : '#8B89B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="12" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
            </svg>
          </span>
          <span className={cn('text-[10px] font-semibold leading-none', moreActive ? 'text-[#A5A0FF]' : 'text-[#8B89B8]')}>
            More
          </span>
        </button>
      </nav>

      <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} isEmployer={isEmployer} session={session} />
    </>
  )
}
