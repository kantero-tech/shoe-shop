import type { UserRole } from './schema'

export interface Session {
  userId: string
  name: string
  role: UserRole
  canSell: boolean
  canViewStock: boolean
  canViewDebts: boolean
  canViewSales: boolean
  canViewExpenses: boolean
}

const SESSION_KEY = 'mpenzi_session'

export async function hashPin(pin: string): Promise<string> {
  const encoded = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
