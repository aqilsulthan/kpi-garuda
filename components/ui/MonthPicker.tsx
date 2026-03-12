'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthPickerProps {
  value: string // format: YYYY-MM
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export default function MonthPicker({ value, onChange, disabled, className }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Parse initial value
  const initialDate = value ? new Date(value + '-01') : new Date()
  const [viewYear, setViewYear] = useState(initialDate.getFullYear())

  const selectedYear = value ? parseInt(value.split('-')[0]) : null
  const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : null

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMonthClick = (monthIdx: number) => {
    const formattedMonth = (monthIdx + 1).toString().padStart(2, '0')
    onChange(`${viewYear}-${formattedMonth}`)
    setIsOpen(false)
  }

  const getDisplayValue = () => {
    if (!value) return 'Pilih Periode'
    const [y, m] = value.split('-')
    return `${months[parseInt(m) - 1]} ${y}`
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:border-primary-400",
          isOpen && "ring-2 ring-primary-500 border-transparent"
        )}
      >
        <span className={!value ? "text-gray-400" : ""}>{getDisplayValue()}</span>
        <CalendarIcon size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[260px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => setViewYear(viewYear - 1)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-500" />
            </button>
            <span className="text-sm font-bold text-gray-800">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear(viewYear + 1)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Months Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((m, idx) => {
              const isSelected = selectedYear === viewYear && selectedMonth === idx
              const isCurrent = new Date().getFullYear() === viewYear && new Date().getMonth() === idx
              
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthClick(idx)}
                  className={cn(
                    "py-2.5 text-xs font-medium rounded-lg transition-all",
                    isSelected 
                      ? "bg-primary-600 text-white shadow-md shadow-primary-200" 
                      : isCurrent
                        ? "bg-primary-50 text-primary-700 border border-primary-100"
                        : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {m}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
             <button
              type="button"
              onClick={() => onChange('')}
              className="text-[10px] font-bold text-primary-600 hover:underline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date()
                setViewYear(now.getFullYear())
                onChange(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`)
                setIsOpen(false)
              }}
              className="text-[10px] font-bold text-primary-600 hover:underline"
            >
              Tahun Ini
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
