'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface IconProps {
  active: boolean
}

function DashboardIcon({ active }: IconProps) {
  const fill = active ? 'var(--color-blue)' : 'var(--color-label-tertiary)'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill={fill} />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill={fill} />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill={fill} />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill={fill} />
    </svg>
  )
}

function StockIcon({ active }: IconProps) {
  const stroke = active ? 'var(--color-blue)' : 'var(--color-label-tertiary)'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 8H3M21 8v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8M21 8l-3-5H6L3 8M9 13h6" />
    </svg>
  )
}

function SellIcon({ active }: IconProps) {
  const stroke = active ? 'var(--color-blue)' : 'var(--color-label-tertiary)'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2H3v3l9 9 3-3-9-9z" />
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L3 13V3h10l7.59 7.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1" fill={stroke} stroke="none" />
    </svg>
  )
}

function DebtsIcon({ active }: IconProps) {
  const stroke = active ? 'var(--color-blue)' : 'var(--color-label-tertiary)'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  )
}

const TABS = [
  { href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { href: '/stock', label: 'Stock', Icon: StockIcon },
  { href: '/sell', label: 'Sell', Icon: SellIcon },
  { href: '/debts', label: 'Debts', Icon: DebtsIcon },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl"
      style={{ boxShadow: 'var(--shadow-nav)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-14">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 pt-1"
              aria-current={active ? 'page' : undefined}
            >
              <Icon active={active} />
              <span
                className="text-caption font-medium"
                style={{ color: active ? 'var(--color-blue)' : 'var(--color-label-secondary)' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
