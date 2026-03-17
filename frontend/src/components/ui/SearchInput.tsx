import React from 'react'
import Icon from './Icon'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Tìm kiếm...',
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Icon
        name="search"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size="sm"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm w-full focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
      />
    </div>
  )
}

export default SearchInput
