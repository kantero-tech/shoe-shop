import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn('sticky top-0 z-40', className)}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: 'color-mix(in srgb, var(--color-bg) 92%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-8 pt-3 pb-3 lg:pt-5 lg:pb-5 gap-3">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <h1 className="text-[22px] lg:text-[28px] font-extrabold leading-tight tracking-tight truncate" style={{ color: 'var(--color-text)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] lg:text-[13px] font-normal leading-snug truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
