'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession, useIsEmployer } from '@/lib/permissions-context'
import { useTheme } from '@/lib/theme-context'
import { clearSession } from '@/lib/auth'
import { NAV_ITEMS, FOOTER_NAV, isNavItemVisible, isNavActive, type NavItem } from '@/lib/nav'

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, Icon } = item
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 px-3 h-11 rounded-xl text-[14px] transition-colors duration-150',
        active ? 'text-white font-semibold' : 'text-[#8B89B8] font-medium hover:text-white hover:bg-white/5'
      )}
      style={active ? { background: 'var(--color-primary)' } : undefined}
    >
      <Icon size={19} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

/**
 * Desktop-only left navigation rail. Hidden below the `lg` breakpoint, where the
 * mobile BottomNav takes over. Reuses the shared NAV source and permission rules.
 */
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const session = useSession()
  const isEmployer = useIsEmployer()
  const { theme, toggle } = useTheme()

  function handleLogout() {
    clearSession()
    router.replace('/login')
  }

  const items = NAV_ITEMS.filter((i) => isNavItemVisible(i, isEmployer, session))
  const footerItems = FOOTER_NAV.filter((i) => isNavItemVisible(i, isEmployer, session))

  return (
    <aside
      className="hidden lg:flex fixed inset-y-0 left-0 w-64 z-50 flex-col"
      style={{ background: 'var(--color-nav-bg)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <div
          className="w-9 h-9 rounded-xl shrink-0"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
        />
        <span className="text-white font-extrabold text-[18px] tracking-tight">Mpenzi</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
        {items.map((item) => (
          <NavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} />
        ))}
      </nav>

      {/* Footer: secondary nav + account controls */}
      <div className="px-3 py-4 mt-auto border-t border-white/10 flex flex-col gap-1">
        {footerItems.map((item) => (
          <NavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} />
        ))}

        <div className="flex items-center gap-2 px-2 pt-3">
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-semibold truncate">{session?.name ?? 'Account'}</p>
            <p className="text-[#8B89B8] text-[11px] capitalize">{session?.role ?? ''}</p>
          </div>
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8B89B8] hover:text-white hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8B89B8] hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  )
}
