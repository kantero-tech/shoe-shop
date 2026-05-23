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
      className={cn(
        'flex items-end justify-between',
        'px-4 pt-14 pb-4',
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <h1
          className="text-[34px] font-bold text-[#1C1C1E] leading-tight tracking-tight"
          style={{ letterSpacing: '0.37px' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] text-[#8E8E93] font-normal">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </header>
  )
}
