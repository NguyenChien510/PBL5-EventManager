import React, { useState } from 'react'
import Icon from './Icon'

interface PaginationProps {
  current: number // 1-indexed
  total: number
  label?: string
  onPageChange?: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ current, total, label, onPageChange }) => {
  const [isInputVisible, setIsInputVisible] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const getPages = () => {
    const pages: (number | string)[] = []
    const range = 1 // Number of pages to show around current page

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)

      if (current > range + 3) {
        pages.push('...')
      }

      const start = Math.max(2, current - range)
      const end = Math.min(total - 1, current + range)

      // Add middle pages
      if (current <= range + 3) {
        for (let i = 2; i <= Math.max(end, range + 3); i++) pages.push(i)
      } else if (current >= total - (range + 2)) {
        for (let i = Math.min(start, total - (range + 2)); i < total; i++) pages.push(i)
      } else {
        for (let i = start; i <= end; i++) pages.push(i)
      }

      if (current < total - (range + 2)) {
        pages.push('...')
      }

      pages.push(total)
    }
    // Remove duplicates
    return Array.from(new Set(pages))
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(inputValue)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= total) {
      onPageChange?.(pageNum)
    }
    setIsInputVisible(false)
    setInputValue('')
  }

  return (
    <div className="flex items-center justify-between py-3">
      {label && (
        <div className="hidden sm:block">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">
            {label}
          </p>
        </div>
      )}
      
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm mx-auto sm:mx-0">
        <button
          onClick={() => onPageChange?.(Math.max(1, current - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50/50 text-slate-400 hover:text-primary hover:bg-white hover:border-primary hover:shadow-md transition-all disabled:opacity-30 disabled:hover:border-slate-100 disabled:hover:text-slate-400 disabled:hover:shadow-none"
          disabled={current <= 1}
        >
          <Icon name="chevron_left" size="sm" />
        </button>

        <div className="flex items-center gap-0.5 px-0.5">
          {getPages().map((page, idx) => {
            if (page === '...') {
              return isInputVisible ? (
                <form key={`input-${idx}`} onSubmit={handleInputSubmit} className="relative mx-0.5">
                  <input
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={() => setIsInputVisible(false)}
                    className="w-8 h-8 rounded-lg border-2 border-primary bg-white text-[10px] font-black text-center outline-none shadow-lg animate-in fade-in zoom-in duration-200 text-primary"
                    placeholder="#"
                  />
                </form>
              ) : (
                <button
                  key={`ellipsis-${idx}`}
                  onClick={() => setIsInputVisible(true)}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-primary hover:bg-slate-50 rounded-lg transition-all font-black group text-xs"
                >
                  <span className="group-hover:hidden">...</span>
                  <Icon name="edit" size="xs" className="hidden group-hover:block" />
                </button>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === current

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange?.(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-white shadow-[0_4px_12px_-4px_rgba(59,130,246,0.5)] scale-105 z-10'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onPageChange?.(Math.min(total, current + 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50/50 text-slate-400 hover:text-primary hover:bg-white hover:border-primary hover:shadow-md transition-all disabled:opacity-30 disabled:hover:border-slate-100 disabled:hover:text-slate-400 disabled:hover:shadow-none"
          disabled={current >= total}
        >
          <Icon name="chevron_right" size="sm" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
