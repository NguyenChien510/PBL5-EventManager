import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'

interface SidebarLink {
  to: string
  label: string
  icon: string
  badge?: string | number
}

interface SidebarSection {
  title?: string
  links: SidebarLink[]
}

interface SidebarProps {
  brandName: string
  brandSub?: string
  brandIcon: string
  sections: SidebarSection[]
  user?: { name: string; role: string; avatar?: string }
  children?: React.ReactNode
}

const Sidebar: React.FC<SidebarProps> = ({ brandSub, sections, user, children }) => {
  const location = useLocation()

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50">
      {/* Brand */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <Icon name="confirmation_number" className="text-white" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
              Event<span className="text-sky-500 font-black">Platform</span>
            </h1>
            {brandSub && (
              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-slate-400 mt-0.5 truncate">{brandSub}</p>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && (
              <div className="px-4 pt-6 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {section.title}
              </div>
            )}
            {section.links.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-slate-500 hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <Icon name={link.icon} filled={isActive} />
                  <span className="flex-1">{link.label}</span>
                  {link.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
        {children}
      </nav>

      {/* User Footer */}
      {user && (
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            {user.avatar ? (
              <Avatar src={user.avatar} size="md" ring />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="person" className="text-primary" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
