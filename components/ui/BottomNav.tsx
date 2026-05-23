'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={active ? '#007AFF' : 'none'}
        stroke={active ? '#007AFF' : '#8E8E93'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 12 15 12 15 21" />
      </svg>
    ),
  },
  {
    href: '/stock',
    label: 'Stock',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#007AFF' : '#8E8E93'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: '/sell',
    label: 'Sell',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#007AFF' : '#8E8E93'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    href: '/debts',
    label: 'Debts',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#007AFF' : '#8E8E93'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'flex items-stretch',
        'bg-white/80 backdrop-blur-[20px] backdrop-saturate-150',
        'border-t border-black/[0.06]',
        'shadow-[0_-1px_0_rgba(0,0,0,0.06)]',
        'pb-safe'
      )}
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2',
              'min-h-[56px] transition-all duration-200',
              'active:opacity-60 active:scale-95',
              'select-none'
            )}
          >
            {tab.icon(isActive)}
            <span
              className={cn(
                'text-[10px] font-medium leading-none mt-0.5',
                isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'
              )}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
