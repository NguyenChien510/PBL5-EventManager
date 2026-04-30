import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Icon } from '../ui'
import { useAuthStore } from '../../stores/useAuthStore'

const Navbar = () => {
  const { user, signOut } = useAuthStore()
  const roleName = (user?.role?.name ?? '').toUpperCase().replace('ROLE_', '')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle click outside for user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="glass-nav sticky top-0 z-[60] border-b border-slate-200/60 backdrop-blur-xl bg-white/70">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Icon name="confirmation_number" className="text-white text-lg" />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight">
            Event<span className="text-sky-500 font-black">Platform</span>
          </h1>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Trang chủ</Link>
          <Link to="/explore" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Khám phá</Link>
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Về chúng tôi</a>
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Liên hệ</a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:flex flex-col items-start text-xs">
                  <span className="text-slate-500 font-medium">Xin chào,</span>
                  <span className="text-slate-900 font-bold max-w-[200px] truncate">{user.fullName || user.email}</span>
                </div>
                <Icon name="expand_more" className="text-slate-400" size="sm" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-58 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {roleName === 'ORGANIZER' ? (
                    <>
                      <Link
                        to="/organizer/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-900 hover:bg-primary/5 hover:text-primary transition-colors font-medium whitespace-nowrap"
                      >
                        <Icon name="dashboard" size="sm" /> Trung tâm điều hành
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                    </>
                  ) : roleName === 'ADMIN' ? (
                    <>
                      <Link
                        to="/admin/moderation"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-900 hover:bg-primary/5 hover:text-primary transition-colors font-medium whitespace-nowrap"
                      >
                        <Icon name="verified_user" size="sm" /> Kiểm duyệt sự kiện
                      </Link>
                      <Link
                        to="/admin/users"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-900 hover:bg-primary/5 hover:text-primary transition-colors font-medium whitespace-nowrap"
                      >
                        <Icon name="manage_accounts" size="sm" /> Quản lý người dùng
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                    </>
                  ) : (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors font-medium"
                      >
                        <Icon name="person" size="sm" /> Thông tin cá nhân
                      </Link>
                      <Link
                        to="/tickets"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors font-medium"
                      >
                        <Icon name="confirmation_number" size="sm" /> Vé của tôi
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                    </>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium whitespace-nowrap"
                  >
                    <Icon name="logout" size="sm" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/signin" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                Đăng nhập
              </Link>
              <Link to="/signup" className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-sm shadow-primary/20">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
