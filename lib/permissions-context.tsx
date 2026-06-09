'use client'

import { createContext, useContext } from 'react'
import type { Session } from './auth'
import type { PermKey } from './permissions'

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

/**
 * Whether the current user may perform an action. Employers can always do
 * everything. For employees, a missing flag defaults to granted so accounts
 * created before a permission existed keep working.
 */
export function useCan(key: PermKey): boolean {
  const s = useContext(PermissionsContext)
  if (!s) return true
  if (s.role === 'employer') return true
  return s[key] ?? true
}

/** Whether the user may perform at least one of the given actions. */
export function useCanAny(keys: PermKey[]): boolean {
  const s = useContext(PermissionsContext)
  if (!s) return true
  if (s.role === 'employer') return true
  return keys.some((k) => s[k] ?? true)
}
