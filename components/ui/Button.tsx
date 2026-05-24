'use client'

import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-ios-blue text-white active:opacity-90 shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
  secondary: 'bg-ios-fill text-ios-blue active:bg-ios-fill-secondary dark:bg-[#2C2C2E] dark:text-ios-blue',
  danger: 'bg-ios-red text-white active:opacity-90 shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
  ghost: 'bg-transparent text-ios-blue active:bg-ios-fill dark:active:bg-[#2C2C2E]',
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'h-11 px-5 rounded-[14px]',
        'text-[17px] font-semibold',
        'transition-all duration-200 ease-out',
        'active:scale-[0.96]',
        'select-none',
        variantStyles[variant],
        fullWidth && 'w-full',
        isDisabled && 'opacity-40 pointer-events-none',
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
