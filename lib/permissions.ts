// Single source of truth for employee permissions.
//
// Every action an employee can take maps to one key here. Add a key, wire it
// into the relevant page with `useCan`, and it automatically shows up as a
// toggle on the Team screen and travels through the login session.

export const PERMISSION_KEYS = [
  // Pages (open the screen)
  'canSell',
  'canViewStock',
  'canViewSales',
  'canViewDebts',
  'canViewExpenses',
  'canViewReports',
  // Actions (do things)
  'canManageStock',
  'canReceiveStock',
  'canEditSales',
  'canRecordPayments',
  'canManageExpenses',
  // Sensitive
  'canSeeCostPrices',
] as const

export type PermKey = (typeof PERMISSION_KEYS)[number]

export type Permissions = Record<PermKey, boolean>

export type PermGroup = 'Pages' | 'Actions' | 'Sensitive'

export interface PermMeta {
  key: PermKey
  label: string
  description: string
  group: PermGroup
}

export const PERMISSION_META: PermMeta[] = [
  { key: 'canSell', label: 'Sell', description: 'Open the Sell screen and record sales', group: 'Pages' },
  { key: 'canViewStock', label: 'Stock', description: 'Open the Stock screen and see inventory', group: 'Pages' },
  { key: 'canViewSales', label: 'Sales History', description: 'Browse and search past sales', group: 'Pages' },
  { key: 'canViewDebts', label: 'Debts', description: 'See outstanding customer debts', group: 'Pages' },
  { key: 'canViewExpenses', label: 'Expenses', description: 'See business expense records', group: 'Pages' },
  { key: 'canViewReports', label: 'Reports', description: 'Open the Reports & analytics screen', group: 'Pages' },
  { key: 'canManageStock', label: 'Manage shoe types', description: 'Register, edit, or delete shoe types', group: 'Actions' },
  { key: 'canReceiveStock', label: 'Receive deliveries', description: 'Record pairs that arrive in the shop', group: 'Actions' },
  { key: 'canEditSales', label: 'Edit / delete sales', description: 'Change or remove a recorded sale', group: 'Actions' },
  { key: 'canRecordPayments', label: 'Record debt payments', description: 'Collect and record repayments on debts', group: 'Actions' },
  { key: 'canManageExpenses', label: 'Add / delete expenses', description: 'Record or remove business expenses', group: 'Actions' },
  { key: 'canSeeCostPrices', label: 'See cost & profit', description: 'View wholesale buy prices and profit figures', group: 'Sensitive' },
]

export const PERM_GROUPS: PermGroup[] = ['Pages', 'Actions', 'Sensitive']

/** All permissions granted — used for employer accounts and as the default for new employees. */
export const DEFAULT_PERMISSIONS: Permissions = PERMISSION_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: true }),
  {} as Permissions
)

/**
 * Read a full permission set from any partial source (a stored user or session).
 * Missing flags default to granted, matching existing employees created before a
 * permission was introduced.
 */
export function readPermissions(
  source: Partial<Record<PermKey, boolean | undefined>> | null | undefined
): Permissions {
  return PERMISSION_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: source?.[key] ?? true }),
    {} as Permissions
  )
}
