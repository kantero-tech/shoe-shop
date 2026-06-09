'use client'

import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export function Input({ label, error, helper, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[14px] font-semibold text-[#1A1733] pl-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full min-h-[44px] px-4 py-3',
          'rounded-[12px]',
          'text-[16px] outline-none ring-0',
          'border transition-all duration-200',
          'focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20',
          error && 'border-[#FF3D5A] focus:ring-[#FF3D5A]/20',
          className
        )}
        style={{
          background: error ? 'var(--color-red-light, #FFE5EB)' : 'var(--color-fill)',
          borderColor: error ? '#FF3D5A' : 'var(--color-border)',
          color: 'var(--color-text)',
        }}
        {...props}
      />
      {error && (
        <p className="text-[13px] text-[#FF3D5A] pl-1">{error}</p>
      )}
      {helper && !error && (
        <p className="text-[13px] text-[#6B6889] pl-1">{helper}</p>
      )}
    </div>
  )
}
