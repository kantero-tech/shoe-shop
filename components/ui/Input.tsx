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
          className="text-[15px] font-medium text-ios-label pl-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full min-h-[44px] px-4 py-3',
          'bg-ios-fill dark:bg-[#2C2C2E] rounded-[12px]',
          'text-[17px] text-ios-label placeholder:text-ios-label-secondary',
          'border-0 outline-none ring-0',
          'transition-all duration-200',
          'focus:bg-ios-fill-secondary dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-ios-blue focus:ring-offset-0',
          error && 'ring-2 ring-ios-red bg-ios-red-light',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-[13px] text-ios-red pl-1">{error}</p>
      )}
      {helper && !error && (
        <p className="text-[13px] text-ios-label-secondary pl-1">{helper}</p>
      )}
    </div>
  )
}
