import { cn } from '@/lib/utils'

export interface Column<T> {
  /** Stable identifier for the column. */
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  /** Cell renderer. Receives the row and its index. */
  render: (row: T, index: number) => React.ReactNode
  /** Extra classes applied to the <td>. */
  cellClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  className?: string
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

/**
 * Token-aware data table used for the desktop (`lg:`) presentation of list pages.
 * Render it inside a `hidden lg:block` wrapper alongside the existing mobile list.
 */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, className }: DataTableProps<T>) {
  return (
    <div
      className={cn('rounded-2xl border overflow-hidden shadow-[var(--shadow-card)]', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap',
                  alignClass[col.align ?? 'left']
                )}
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                idx < rows.length - 1 && 'border-b',
                onRowClick && 'cursor-pointer hover:bg-[var(--color-fill)] transition-colors'
              )}
              style={{ borderColor: 'var(--color-separator)' }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-5 py-3.5 text-[14px] align-middle',
                    alignClass[col.align ?? 'left'],
                    col.cellClassName
                  )}
                  style={{ color: 'var(--color-text)' }}
                >
                  {col.render(row, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
