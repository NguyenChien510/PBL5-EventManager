import React from 'react'
import Icon from './Icon'

interface PaginationProps {
  current: number
  total: number
  label?: string
  onPageChange?: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ current, total, label, onPageChange }) => {
  const pages = Array.from({ length: Math.min(total, 3) }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-between">
      {label && <p className="text-sm text-slate-500">{label}</p>}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange?.(Math.max(1, current - 1))}
          className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50"
          disabled={current <= 1}
        >
          <Icon name="chevron_left" size="sm" />
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange?.(page)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              page === current
                ? 'bg-primary text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        ))}
        {total > 3 && <span className="px-2 text-slate-400">...</span>}
        {total > 3 && (
          <button
            onClick={() => onPageChange?.(total)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            {total}
          </button>
        )}
        <button
          onClick={() => onPageChange?.(Math.min(total, current + 1))}
          className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50"
          disabled={current >= total}
        >
          <Icon name="chevron_right" size="sm" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
