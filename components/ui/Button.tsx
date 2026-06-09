'use client'

import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'text-white active:opacity-90',
  secondary: 'bg-[#EEEDFF] text-[#6C63FF] active:bg-[#E0DEFF]',
  danger: 'text-white active:opacity-90',
  ghost: 'bg-transparent text-[#6C63FF] active:bg-[#EEEDFF]',
}

const variantInlineStyle: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)',
    boxShadow: '0 4px 14px rgba(108, 99, 255, 0.35)',
  },
  secondary: {},
  danger: {
    background: 'linear-gradient(135deg, #FF3D5A 0%, #FF6B8A 100%)',
    boxShadow: '0 4px 14px rgba(255, 61, 90, 0.30)',
  },
  ghost: {},
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  style,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      style={{ ...variantInlineStyle[variant], ...style }}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'h-11 px-5 rounded-[14px]',
        'text-[16px] font-semibold',
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
