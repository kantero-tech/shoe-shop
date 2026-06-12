import {
  LayoutGrid,
  Package,
  PackagePlus,
  Tag,
  ScrollText,
  CreditCard,
  Wallet,
  BarChart3,
  Calculator,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { Session } from './auth'
import type { PermKey } from './permissions'

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
  { href: '/receive', label: 'Receive Stock', Icon: PackagePlus, permKey: 'canReceiveStock' },
  { href: '/sell', label: 'Sell', Icon: Tag, permKey: 'canSell' },
  { href: '/sales', label: 'Sales', Icon: ScrollText, permKey: 'canViewSales' },
  { href: '/debts', label: 'Debts', Icon: CreditCard, permKey: 'canViewDebts' },
  { href: '/expenses', label: 'Expenses', Icon: Wallet, permKey: 'canViewExpenses' },
  { href: '/closeout', label: 'End of Day', Icon: Calculator, permKey: 'canViewSales' },
  { href: '/reports', label: 'Reports', Icon: BarChart3, permKey: 'canViewReports' },
]

/** Secondary destinations pinned to the sidebar footer. */
export const FOOTER_NAV: NavItem[] = [
  { href: '/users', label: 'Team', Icon: Users, employerOnly: true },
  { href: '/settings', label: 'Settings', Icon: Settings, employerOnly: true },
]

export function isNavItemVisible(item: NavItem, isEmployer: boolean, session: Session | null): boolean {
  if (item.employerOnly) return isEmployer
  if (isEmployer) return true
  // Stock is reachable by anyone who can view stock or receive deliveries.
  if (item.href === '/stock') {
    return (session?.canViewStock ?? true) || (session?.canReceiveStock ?? true)
  }
  if (item.permKey) return session?.[item.permKey] ?? true
  return true
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}
