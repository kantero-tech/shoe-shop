'use client'

import React, { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Input } from './Input'

export type SortOption =
  | 'alphabetical'
  | 'price-high'
  | 'price-low'
  | 'qty-high'
  | 'qty-low'
  | 'date-newest'

export interface FilterState {
  sort: SortOption
  sizes: string[]
  minPrice: string
  maxPrice: string
  lowStockOnly: boolean
}

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialFilters: FilterState
  onApply: (filters: FilterState) => void
  availableSizes: string[]
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-newest', label: 'Newest Added' },
  { value: 'alphabetical', label: 'Brand (A-Z)' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'qty-high', label: 'Stock: High to Low' },
  { value: 'qty-low', label: 'Stock: Low to High' },
]

export function FilterDrawer({
  isOpen,
  onClose,
  initialFilters,
  onApply,
  availableSizes,
}: FilterDrawerProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters)
    }
  }, [isOpen, initialFilters])

  const toggleSize = (size: string) => {
    setFilters((prev) => {
      const nextSizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size]
      return { ...prev, sizes: nextSizes }
    })
  }

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  const handleReset = () => {
    setFilters({
      sort: 'date-newest',
      sizes: [],
      minPrice: '',
      maxPrice: '',
      lowStockOnly: false,
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter stock drawer"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[70]',
          'bg-ios-surface rounded-t-3xl border-t border-ios-separator/10 shadow-2xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-ios-fill-tertiary" />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <h2 className="text-[20px] font-bold text-ios-label">Sort & Filter</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-ios-fill-secondary dark:bg-[#2C2C2E] flex items-center justify-center active:scale-90 transition-all"
          >
            <X size={16} className="text-ios-label-secondary" />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-5 pb-10 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* Sorting */}
          <div>
            <span className="text-[12px] font-semibold text-ios-label-secondary uppercase tracking-wider block mb-2.5">
              Sort By
            </span>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map((opt) => {
                const active = filters.sort === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilters((p) => ({ ...p, sort: opt.value }))}
                    className={cn(
                      'px-3.5 py-2.5 rounded-xl text-left text-[14px] font-semibold transition-all select-none',
                      active
                        ? 'bg-ios-blue text-white shadow-sm'
                        : 'bg-ios-fill dark:bg-[#2C2C2E] text-ios-label hover:opacity-90'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sizes */}
          {availableSizes.length > 0 && (
            <div>
              <span className="text-[12px] font-semibold text-ios-label-secondary uppercase tracking-wider block mb-2.5">
                Sizes
              </span>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const active = filters.sizes.includes(size)
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={cn(
                        'px-4 h-[38px] rounded-full text-[13px] font-semibold transition-all select-none flex items-center gap-1',
                        active
                          ? 'bg-ios-blue-light text-ios-blue ring-2 ring-ios-blue/30 dark:bg-ios-blue/20'
                          : 'bg-ios-fill dark:bg-[#2C2C2E] text-ios-label'
                      )}
                    >
                      {active && <Check size={12} />}
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <span className="text-[12px] font-semibold text-ios-label-secondary uppercase tracking-wider block mb-2.5">
              Price Range (RWF)
            </span>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Min"
                type="number"
                inputMode="numeric"
                value={filters.minPrice}
                onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))}
                className="text-[15px]"
              />
              <span className="text-ios-label-secondary font-bold">—</span>
              <Input
                placeholder="Max"
                type="number"
                inputMode="numeric"
                value={filters.maxPrice}
                onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))}
                className="text-[15px]"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between py-2 border-t border-b border-ios-separator/10">
            <div>
              <p className="text-[15px] font-semibold text-ios-label">Low Stock Only</p>
              <p className="text-[12px] text-ios-label-secondary">Show items with 2 or fewer left</p>
            </div>
            <button
              onClick={() => setFilters((p) => ({ ...p, lowStockOnly: !p.lowStockOnly }))}
              aria-label="Toggle low stock"
              className={cn(
                'w-[51px] h-[31px] rounded-full p-0.5 transition-colors duration-200 ease-in-out outline-none select-none',
                filters.lowStockOnly ? 'bg-ios-green' : 'bg-ios-fill-tertiary dark:bg-[#3A3A3C]'
              )}
            >
              <div
                className={cn(
                  'w-[27px] h-[27px] rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out',
                  filters.lowStockOnly ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Bottom Actions */}
          <div
            className="flex items-center gap-3 pt-2"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={handleReset}
              className="flex-1 py-3 text-[17px] font-semibold text-ios-label-secondary active:opacity-60 transition-opacity"
            >
              Reset All
            </button>
            <Button onClick={handleApply} className="flex-[2] rounded-2xl h-[50px]">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
