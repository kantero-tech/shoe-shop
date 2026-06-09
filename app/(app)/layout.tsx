'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { BottomNav } from '@/components/ui/BottomNav'
import { Sidebar } from '@/components/Sidebar'
import { PermissionsProvider } from '@/lib/permissions-context'
import { ThemeProvider } from '@/lib/theme-context'
import { getSession, type Session } from '@/lib/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.replace('/login')
    } else {
      setSession(s)
      setChecked(true)
    }
  }, [router, pathname])

  if (!checked || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#6C63FF] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <ThemeProvider>
      <PermissionsProvider session={session}>
        <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
          <Sidebar />
          <div className="lg:pl-64">
            <div className="max-w-[480px] mx-auto lg:max-w-[1400px] min-h-screen relative">
              {children}
            </div>
          </div>
          <BottomNav />
        </div>
      </PermissionsProvider>
    </ThemeProvider>
  )
}
