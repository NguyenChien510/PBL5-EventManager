import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Icon } from '../ui'
import { useAuthStore } from '../../stores/useAuthStore'

const Navbar = () => {
  const { user, signOut } = useAuthStore()
  const roleName = (user?.role?.name ?? '').toUpperCase().replace('ROLE_', '')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [hasAvatarError, setHasAvatarError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHasAvatarError(false)
  }, [user?.avatar])

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
                className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border border-slate-200/50 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300 transition-all duration-200 group ${isUserMenuOpen ? 'bg-white shadow-minimal border-slate-300 ring-4 ring-primary/5' : ''
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-md transition-transform group-hover:scale-105 overflow-hidden ${user.avatar && !hasAvatarError ? 'bg-slate-100 border border-slate-200/50' :
                  roleName === 'ADMIN' ? 'bg-gradient-to-tr from-red-500 to-orange-500 shadow-red-500/10' :
                    roleName === 'ORGANIZER' ? 'bg-gradient-to-tr from-blue-600 to-sky-400 shadow-blue-600/10' :
                      'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/10'
                  }`}>
                  {user.avatar && !hasAvatarError ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                      onError={() => setHasAvatarError(true)}
                    />
                  ) : (
                    <span className="text-sm">{user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start text-xs mr-1">
                  <span className="text-slate-400 font-semibold scale-95 origin-left">Xin chào,</span>
                  <span className="text-slate-800 font-extrabold max-w-[140px] truncate leading-tight">
                    {user.fullName || user.email?.split('@')[0]}
                  </span>
                </div>
                <Icon
                  name="expand_more"
                  className={`text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180 text-slate-600' : ''}`}
                  size="sm"
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50 animate-slide-down">
                  {/* Header Info */}
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border-b border-slate-100 flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg overflow-hidden ${user.avatar && !hasAvatarError ? 'bg-slate-100 border border-slate-200/50' :
                      roleName === 'ADMIN' ? 'bg-gradient-to-tr from-red-500 to-orange-500 shadow-red-500/20' :
                        roleName === 'ORGANIZER' ? 'bg-gradient-to-tr from-blue-600 to-sky-400 shadow-blue-600/20' :
                          'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/20'
                      }`}>
                      {user.avatar && !hasAvatarError ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                          onError={() => setHasAvatarError(true)}
                        />
                      ) : (
                        <span className="text-lg">{user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate leading-snug">{user.fullName || user.email}</p>
                      <p className="text-xs text-slate-500 truncate mb-1.5 leading-tight">{user.email}</p>

                      {/* Dynamic Badge */}
                      {roleName === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
                          <Icon name="shield" size="xs" className="text-[11px]" /> Quản trị viên
                        </span>
                      ) : roleName === 'ORGANIZER' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                          <Icon name="business_center" size="xs" className="text-[11px]" /> Ban tổ chức
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <Icon name="person" size="xs" className="text-[11px]" /> Khách hàng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu Options Grouped by Role */}
                  <div className="p-2 max-h-[320px] overflow-y-auto space-y-0.5">
                    {roleName === 'ADMIN' ? (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Danh mục Quản trị</div>
                        <Link
                          to="/admin/moderation"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="verified_user" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Kiểm duyệt sự kiện</span>
                        </Link>
                        <Link
                          to="/admin/events"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="event_note" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Quản lý sự kiện</span>
                        </Link>
                        <Link
                          to="/admin/users"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="manage_accounts" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Quản lý người dùng</span>
                        </Link>
                        <Link
                          to="/admin/payments"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="payments" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Quản lý tài chính</span>
                        </Link>
                      </>
                    ) : roleName === 'ORGANIZER' ? (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Danh mục Tổ chức</div>
                        <Link
                          to="/organizer/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="dashboard" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Trung tâm điều hành</span>
                        </Link>
                        <Link
                          to="/organizer/create-event"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="add_circle" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Tạo sự kiện mới</span>
                        </Link>
                        <Link
                          to="/organizer/events"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="event_note" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Quản lý sự kiện</span>
                        </Link>
                        <Link
                          to="/organizer/finance"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="account_balance" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Quản lý doanh thu</span>
                        </Link>
                        <Link
                          to="/organizer/feedback"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="rate_review" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Quản lý đánh giá</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Danh mục Khách hàng</div>
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="person" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Thông tin cá nhân</span>
                        </Link>
                        <Link
                          to="/history"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="history" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Sự kiện đã tham gia</span>
                        </Link>
                        <Link
                          to="/vouchers"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Icon name="redeem" className="text-slate-500 group-hover:text-primary transition-colors" size="sm" />
                          </div>
                          <span>Ưu đãi & Voucher</span>
                        </Link>

                      </>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="border-t border-slate-100 p-2 bg-slate-50/50">
                    <button
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                        <Icon name="logout" className="text-red-500 transition-colors" size="sm" />
                      </div>
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
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
