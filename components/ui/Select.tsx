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
          className="text-[14px] font-semibold text-[#1A1733] pl-1"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={selectId}
          className={cn(
            'w-full min-h-[44px] px-4 py-3 pr-10 appearance-none',
            'bg-[#F5F4FF] rounded-[12px]',
            'text-[16px] text-[#1A1733]',
            'border border-[#E8E6F5] outline-none ring-0',
            'transition-all duration-200',
            'focus:bg-white focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20',
            error && 'border-[#FF3D5A] bg-[#FFE5EB]',
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
            stroke="#6B6889"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      {error && <p className="text-[13px] text-[#FF3D5A] pl-1">{error}</p>}
      {helper && !error && <p className="text-[13px] text-[#6B6889] pl-1">{helper}</p>}
    </div>
  )
}
