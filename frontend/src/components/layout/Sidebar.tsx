import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { useAuthStore } from '@/stores/useAuthStore'

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
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const [hasAvatarError, setHasAvatarError] = React.useState(false)
  const [showLogoutModal, setShowLogoutModal] = React.useState(false)

  const handleLogout = () => {
    signOut()
    navigate('/signin')
  }

  React.useEffect(() => {
    setHasAvatarError(false)
  }, [user?.avatar])

  return (
    <>
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
          <div className="p-4 border-t border-slate-100 flex flex-col gap-2.5">
            {/* User Card */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md overflow-hidden shrink-0 ${
                user.avatar && !hasAvatarError 
                  ? 'bg-slate-100 border border-slate-200/50 shadow-sm' 
                  : `bg-gradient-to-tr ${
                      (user.role || '').toUpperCase().includes('ADMIN') 
                        ? 'from-red-500 to-orange-500 shadow-red-500/20' 
                        : (user.role || '').toUpperCase().includes('ORGANIZER') 
                        ? 'from-blue-600 to-sky-400 shadow-blue-600/20' 
                        : 'from-emerald-500 to-teal-400 shadow-emerald-500/20'
                    }`
              }`}>
                {user.avatar && !hasAvatarError ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={() => setHasAvatarError(true)}
                  />
                ) : (
                  <span className="text-sm">{(user.name || '?')[0].toUpperCase()}</span>
                )}
              </div>
              <div className="overflow-hidden flex-1 flex flex-col justify-center min-w-0">
                <p className="text-sm font-black text-slate-900 truncate leading-tight">{user.name}</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                    (user.role || '').toUpperCase().includes('ADMIN') 
                      ? 'bg-red-50 text-red-600 border-red-100' 
                      : (user.role || '').toUpperCase().includes('ORGANIZER') 
                      ? 'bg-blue-50 text-blue-600 border-blue-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Large Logout Button */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white transition-all duration-300 active:scale-[0.98] cursor-pointer font-bold text-xs group shadow-sm hover:shadow-lg hover:shadow-rose-500/20 border border-rose-100/50 hover:border-transparent uppercase tracking-wider"
            >
              <Icon name="power_settings_new" size="sm" className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowLogoutModal(false)} />
          
          <div className="relative bg-white w-full max-w-[340px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200 p-6 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              {/* Icon Circle */}
              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4 shadow-inner border border-rose-100/50">
                <Icon name="power_settings_new" size="md" className="text-rose-500 animate-pulse-subtle" />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-1.5">Đăng xuất tài khoản?</h3>
              <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed px-2">
                Bạn chắc chắn muốn rời khỏi phiên đăng nhập hiện tại chứ?
              </p>
              
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold text-xs transition-all active:scale-[0.97] border border-slate-200/40 cursor-pointer"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false)
                    handleLogout()
                  }}
                  className="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all active:scale-[0.97] shadow-md shadow-rose-500/20 cursor-pointer"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
