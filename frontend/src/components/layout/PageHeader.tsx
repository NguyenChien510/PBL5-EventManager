import React from 'react'
import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import SearchInput from '../ui/SearchInput'

interface PageHeaderProps {
  title: string
  subtitle?: string
  searchPlaceholder?: string
  actions?: React.ReactNode
  centerContent?: React.ReactNode
  breadcrumb?: string[]
  backTo?: string
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, searchPlaceholder, actions, centerContent, breadcrumb, backTo }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between min-h-[80px]">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {backTo && (
          <Link 
            to={backTo} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm group"
          >
            <Icon name="arrow_back" size="sm" className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
        {breadcrumb && (
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            {breadcrumb.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevron_right" size="sm" />}
                <span className={i === breadcrumb.length - 1 ? 'text-slate-800 font-medium whitespace-nowrap' : 'whitespace-nowrap'}>{item}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h2 className="text-xl font-bold tracking-tight text-slate-900 truncate">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>

      {centerContent && (
        <div className="flex-1 flex justify-center px-4">
          {centerContent}
        </div>
      )}

      <div className="flex-1 flex items-center justify-end gap-4">
        {searchPlaceholder && (
          <SearchInput placeholder={searchPlaceholder} className="w-72 hidden xl:block" />
        )}
        {actions}
        <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-primary transition-colors">
          <Icon name="notifications" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-primary transition-colors">
          <Icon name="dark_mode" />
        </button>
      </div>
    </header>
  )
}


export default PageHeader
