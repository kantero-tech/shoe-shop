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
          className="text-[15px] font-medium text-[#1C1C1E] pl-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full min-h-[44px] px-4 py-3',
          'bg-[#F2F2F7] rounded-[12px]',
          'text-[17px] text-[#1C1C1E] placeholder:text-[#8E8E93]',
          'border-0 outline-none ring-0',
          'transition-all duration-200',
          'focus:bg-[#E5E5EA] focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-0',
          error && 'ring-2 ring-[#FF3B30] bg-[#FFE9E8]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-[13px] text-[#FF3B30] pl-1">{error}</p>
      )}
      {helper && !error && (
        <p className="text-[13px] text-[#8E8E93] pl-1">{helper}</p>
      )}
    </div>
  )
}
