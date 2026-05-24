'use client'

import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  helper?: string
  placeholder?: string
}

export function Select({
  label,
  options,
  error,
  helper,
  placeholder,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[15px] font-medium text-ios-label pl-1"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={selectId}
          className={cn(
            'w-full min-h-[44px] px-4 py-3 pr-10 appearance-none',
            'bg-ios-fill dark:bg-[#2C2C2E] rounded-[12px]',
            'text-[17px] text-ios-label',
            'border-0 outline-none ring-0',
            'transition-all duration-200',
            'focus:bg-ios-fill-secondary dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-ios-blue',
            error && 'ring-2 ring-ios-red bg-ios-red-light',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8E8E93"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      {error && <p className="text-[13px] text-ios-red pl-1">{error}</p>}
      {helper && !error && <p className="text-[13px] text-ios-label-secondary pl-1">{helper}</p>}
    </div>
  )
}
