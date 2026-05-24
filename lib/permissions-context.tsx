'use client'

import { createContext, useContext } from 'react'
import type { Session } from './auth'

const PermissionsContext = createContext<Session | null>(null)

export function PermissionsProvider({
  session,
  children,
}: {
  session: Session | null
  children: React.ReactNode
}) {
  return (
    <PermissionsContext.Provider value={session}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function useSession(): Session | null {
  return useContext(PermissionsContext)
}

export function useIsEmployer(): boolean {
  const s = useContext(PermissionsContext)
  return s?.role === 'employer'
}
