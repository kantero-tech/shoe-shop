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
          className="text-[15px] font-medium text-[#1C1C1E] pl-1"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={selectId}
          className={cn(
            'w-full min-h-[44px] px-4 py-3 pr-10 appearance-none',
            'bg-[#F2F2F7] rounded-[12px]',
            'text-[17px] text-[#1C1C1E]',
            'border-0 outline-none ring-0',
            'transition-all duration-200',
            'focus:bg-[#E5E5EA] focus:ring-2 focus:ring-[#007AFF]',
            error && 'ring-2 ring-[#FF3B30] bg-[#FFE9E8]',
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
      {error && <p className="text-[13px] text-[#FF3B30] pl-1">{error}</p>}
      {helper && !error && <p className="text-[13px] text-[#8E8E93] pl-1">{helper}</p>}
    </div>
  )
}
