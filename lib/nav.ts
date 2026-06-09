import {
  LayoutGrid,
  Package,
  Tag,
  ScrollText,
  CreditCard,
  Wallet,
  BarChart3,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Session } from './auth'

export type PermKey = 'canSell' | 'canViewStock' | 'canViewDebts' | 'canViewSales' | 'canViewExpenses'

export interface NavItem {
  href: string
  label: string
  Icon: LucideIcon
  permKey?: PermKey
  employerOnly?: boolean
}

/** Primary destinations shown in the desktop sidebar (and, first four, the mobile bottom nav). */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/stock', label: 'Stock', Icon: Package, permKey: 'canViewStock' },
  { href: '/sell', label: 'Sell', Icon: Tag, permKey: 'canSell' },
  { href: '/sales', label: 'Sales', Icon: ScrollText, permKey: 'canViewSales' },
  { href: '/debts', label: 'Debts', Icon: CreditCard, permKey: 'canViewDebts' },
  { href: '/expenses', label: 'Expenses', Icon: Wallet, permKey: 'canViewExpenses' },
  { href: '/reports', label: 'Reports', Icon: BarChart3, employerOnly: true },
]

/** Secondary destinations pinned to the sidebar footer. */
export const FOOTER_NAV: NavItem[] = [
  { href: '/users', label: 'Team', Icon: Users, employerOnly: true },
]

export function isNavItemVisible(item: NavItem, isEmployer: boolean, session: Session | null): boolean {
  if (item.employerOnly) return isEmployer
  if (isEmployer) return true
  // Sellers can reach Stock to receive deliveries, even without full stock view.
  if (item.href === '/stock') return (session?.canViewStock ?? true) || (session?.canSell ?? true)
  if (item.permKey) return session?.[item.permKey] ?? true
  return true
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}
