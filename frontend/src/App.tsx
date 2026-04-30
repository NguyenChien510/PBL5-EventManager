import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'

// Page imports
import UserProfile from './pages/UserProfile'
import UserTickets from './pages/UserTickets'
import UserHistory from './pages/UserHistory'
import UserSettings from './pages/UserSettings'
import EventExplore from './pages/EventExplore'
import EventDetail from './pages/EventDetail'
import SeatSelection from './pages/SeatSelection'
import VouchersRewards from './pages/VouchersRewards'
import EventReviews from './pages/EventReviews'
import OrganizerDashboard from './pages/OrganizerDashboard'
import OrganizerEventList from './pages/OrganizerEventList'
import OrganizerEventCreate from './pages/OrganizerEventCreate'
import OrganizerGuests from './pages/OrganizerGuests'
import OrganizerTimeline from './pages/OrganizerTimeline'
import OrganizerHR from './pages/OrganizerHR'
import OrganizerFinance from './pages/OrganizerFinance'
import OrganizerFeedback from './pages/OrganizerFeedback'
import OrganizerProfile from './pages/OrganizerProfile'
import AdminEventModeration from './pages/AdminEventModeration'
import AdminEventReview from './pages/AdminEventReview'
import AdminUserManagement from './pages/AdminUserManagement'
import AdminFinanceConfig from './pages/AdminFinanceConfig'
import AdminPaymentHistory from './pages/AdminPaymentHistory'
import AdminEventManagement from './pages/AdminEventManagement'
import Homepage from './pages/Homepage'
import OrganizerEventManage from './pages/OrganizerEventManage'
import AdminEventManage from './pages/AdminEventManage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import PaymentResult from './pages/PaymentResult'
import VnpaySandbox from './pages/VnpaySandbox'
import Chatbot from './components/ui/Chatbot'
import { useAuthStore } from './stores/useAuthStore'
import { AuthService } from './services/authService'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { GuestRoute } from './components/auth/GuestRoute'

function App() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const { user, accessToken, signOut } = useAuthStore()
  const roleName = (user?.role?.name ?? '').toUpperCase().replace('ROLE_', '')

  // Proactive auth check on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      if (accessToken) {
        // 1. Check local expiration first (fast)
        const { isTokenExpired, signOut } = useAuthStore.getState();
        if (isTokenExpired(accessToken)) {
          console.warn('Token expired locally. Logging out...');
          signOut();
          return;
        }

        // 2. Double check with backend
        try {
          await AuthService.getCurrentUser()
        } catch (error) {
          console.error('Initial auth verification failed:', error)
          // Interceptor in axios.ts handles the redirect and clearing of state
        }
      }
    }
    verifyAuth()
  }, [accessToken])

  // Global scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const publicSection = {
    title: '🎫 Trang công khai',
    links: [
      { to: '/', label: 'Trang chủ', icon: 'home' },
      { to: '/explore', label: 'Khám phá sự kiện', icon: 'explore' },
      { to: '/event-detail', label: 'Chi tiết sự kiện', icon: 'event' },
      { to: '/seat-selection', label: 'Chọn chỗ & Thanh toán', icon: 'event_seat' },
    ],
  };

  const userSection = {
    title: '👤 Người dùng',
    links: [
      { to: '/profile', label: 'Hồ sơ cá nhân', icon: 'person' },
      { to: '/tickets', label: 'Vé của tôi', icon: 'confirmation_number' },
      { to: '/history', label: 'Sự kiện đã tham gia', icon: 'history' },
      { to: '/vouchers', label: 'Ưu đãi & Quà tặng', icon: 'redeem' },
      { to: '/reviews', label: 'Đánh giá sự kiện', icon: 'rate_review' },
      { to: '/settings', label: 'Cài đặt', icon: 'settings' },
    ],
  };

  const organizerSection = {
    title: '🏢 Organizer',
    links: [
      { to: '/organizer/dashboard', label: 'Trung tâm điều hành', icon: 'dashboard' },
      { to: '/organizer/events', label: 'Quản lý sự kiện', icon: 'event_note' },
      { to: '/organizer/create-event', label: 'Tạo sự kiện', icon: 'add_circle' },
      { to: '/organizer/guests', label: 'Khách mời & Check-in', icon: 'groups' },
      { to: '/organizer/timeline', label: 'Kịch bản & Timeline', icon: 'timeline' },
      { to: '/organizer/finance', label: 'Quyết toán tài chính', icon: 'account_balance' },
      { to: '/organizer/feedback', label: 'Phản hồi khách mời', icon: 'feedback' },
    ],
  };

  const adminSection = {
    title: '🛡️ Admin',
    links: [
      { to: '/admin/moderation', label: 'Kiểm duyệt sự kiện', icon: 'verified_user' },
      { to: '/admin/events', label: 'Quản lý sự kiện', icon: 'event_note' },
      { to: '/admin/users', label: 'Quản lý người dùng', icon: 'manage_accounts' },
      { to: '/admin/finance', label: 'Cấu hình tài chính', icon: 'settings' },
      { to: '/admin/payments', label: 'Lịch sử giao dịch', icon: 'payments' },
    ],
  };

  const navSections = [
    {
      ...publicSection,
    },
    ...(roleName === 'USER' ? [userSection] : []),
    ...(roleName === 'ORGANIZER' ? [organizerSection] : []),
    ...(roleName === 'ADMIN' ? [adminSection] : []),
  ];

  return (
    <div className="min-h-screen bg-background-light">
      {/* Floating Navigation Button */}
      {/* Floating Navigation Button - Tạm ẩn theo yêu cầu
      <button
        onClick={() => setNavOpen(!navOpen)}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 transition-all duration-300"
        id="nav-toggle"
      >
        <span className="material-symbols-outlined text-2xl">
          {navOpen ? 'close' : 'menu'}
        </span>
      </button>
      */}

      {/* Navigation Panel */}
      {navOpen && (
        <div className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-sm" onClick={() => setNavOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-primary to-electric">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                🎫 Event<span className="text-sky-200 font-black">Platform</span>
              </h2>
              <p className="text-white/70 text-sm mt-1">Điều hướng tất cả trang</p>
            </div>
            <div className="p-4 space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-3 mb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.links.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setNavOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          location.pathname === link.to
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-slate-600 hover:bg-primary/5 hover:text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Routes */}
      <Routes>
        {/* Guest Only Routes */}
        <Route element={<GuestRoute />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route>

        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/explore" element={<EventExplore />} />
        <Route path="/event-detail" element={<EventDetail />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/event" element={<EventDetail />} />

        {/* Protected Routes: USER and above */}
        <Route element={<ProtectedRoute allowedRoles={['USER', 'ORGANIZER']} />}>
          <Route path="/event/:id/seats" element={<SeatSelection />} />
          <Route path="/seat-selection" element={<SeatSelection />} />
          <Route path="/seats" element={<SeatSelection />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/vnpay-sandbox" element={<VnpaySandbox />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/tickets" element={<UserTickets />} />
          <Route path="/history" element={<UserHistory />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/vouchers" element={<VouchersRewards />} />
          <Route path="/reviews" element={<EventReviews />} />
        </Route>

        {/* Protected Routes: ORGANIZER only */}
        <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
          <Route path="/organizer" element={<Navigate to="/organizer/dashboard" replace />} />
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer/events" element={<OrganizerEventList />} />
          <Route path="/organizer/events/:id/manage" element={<OrganizerEventManage />} />
          <Route path="/organizer/create-event" element={<OrganizerEventCreate />} />
          <Route path="/organizer/create" element={<OrganizerEventCreate />} />
          <Route path="/organizer/guests" element={<OrganizerGuests />} />
          <Route path="/organizer/timeline" element={<OrganizerTimeline />} />
          <Route path="/organizer/hr" element={<OrganizerHR />} />
          <Route path="/organizer/finance" element={<OrganizerFinance />} />
          <Route path="/organizer/feedback" element={<OrganizerFeedback />} />
          <Route path="/organizer/profile" element={<OrganizerProfile />} />
        </Route>

        {/* Protected Routes: ADMIN only */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<Navigate to="/admin/moderation" replace />} />
          <Route path="/admin/moderation" element={<AdminEventModeration />} />
          <Route path="/admin/events" element={<AdminEventManagement />} />
          <Route path="/admin/review/:id" element={<AdminEventReview />} />
          <Route path="/admin/event/manage/:id" element={<AdminEventManage />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/finance" element={<AdminFinanceConfig />} />
          <Route path="/admin/payments" element={<AdminPaymentHistory />} />
        </Route>
      </Routes>
      {/* Chatbot */}
      <Chatbot />
      <Toaster position="top-center" />
    </div>
  )
}

export default App
