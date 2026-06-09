import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({ children, className, padding = 'md', onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className={cn(
        'rounded-2xl w-full text-left',
        'border',
        'shadow-[var(--shadow-card)]',
        onClick && [
          'cursor-pointer active:scale-[0.98] active:opacity-80',
          'transition-all duration-200 ease-out',
        ],
        paddingMap[padding],
        className
      )}
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    >
      {children}
    </Tag>
  )
}
