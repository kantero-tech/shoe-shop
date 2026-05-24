import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  showThemeToggle?: boolean
  className?: string
}

export function PageHeader({ title, subtitle, action, showThemeToggle = true, className }: PageHeaderProps) {
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
          className="text-[34px] font-bold text-[#1C1C1E] dark:text-white leading-tight tracking-tight"
          style={{ letterSpacing: '0.37px' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] text-[#8E8E93] dark:text-[#8E8E93] font-normal">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        {action}
        {showThemeToggle && <ThemeToggle />}
      </div>
    </header>
  )
}

