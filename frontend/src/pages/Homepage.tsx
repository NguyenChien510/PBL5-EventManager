import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Icon } from '../components/ui'
import { EventCard, EventMap } from '../components/domain'
import { useAuthStore } from '../stores/useAuthStore'
import { useCategoryStore } from '../stores/useCategoryStore'

const featuredEvents = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8',
    title: 'SƠN TÙNG M-TP: THE FIRST JOURNEY 2024',
    date: '15 Th12, 2024',
    time: '20:00',
    location: 'SVĐ Quân khu 7, TP.HCM',
    price: '500.000đ',
    category: 'Âm nhạc',
    categoryColor: 'bg-pink-100 text-pink-600',
    rating: 4.9,
    ticketsLeft: 120,
    totalTickets: 800,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8uGa4mjJqgWx5lFfDdLFanomchIA51IL8c0cvb3MIvS4GBu7ELTNexbhcJEIciFGOrbVfUWEGrFk5mRHb_asax4cBD8ddZD6DCO2x-TFSGHMrGlb_3UzaAzSv-lol1Y13h0NCWx1bisS-1wiw9mM1Pk1uAuWn4ENmtn0bHrhfEN0_pXnmDQCY_Dx7HWH1bijivgY4hCUMU_lb4qGiw0i4ZqDGhPXEC97rUmzSAyfodwGiVLLxAAz2QaKrFMSGuRiEE4j49dJZMqw',
    title: 'AI Innovation Summit 2024',
    date: '28 Th11, 2024',
    time: '08:00',
    location: 'Gem Center, Quận 1, TP.HCM',
    price: '800.000đ',
    category: 'Công nghệ',
    categoryColor: 'bg-cyan-100 text-cyan-600',
    rating: 4.7,
    ticketsLeft: 45,
    totalTickets: 200,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrnq1Yzgsd28u9RCJh3At5GShj32DcYi9T_WN8ctWilvGZn9VmfNHcOXN0PJVpwKNobaOeiLmwLHEdWBHMa0-lffiM-Lwoaqt5KkCR09eDjWJ-SCeEHoTwndxp4Nre5iCAhg4T1qbg7h75lD0xQbdhUfxGLICenIk71wCsX_N9LaLNhSBdHcgwT-D_-lV4s-BSw1EUi9YzTDRA_WzoNc9T9dOkYFrwkftJ5xX9JXksilQMRTFko1lYzpfcj_je9bmv6z9ywUt6AXg',
    title: 'Artisan Market - Hội Chợ Thủ Công',
    date: '10 Th01, 2025',
    time: '09:00',
    location: 'Khu Phố Cổ, Hà Nội',
    price: '150.000đ',
    category: 'Nghệ thuật',
    categoryColor: 'bg-purple-100 text-purple-600',
    rating: 4.5,
    ticketsLeft: 280,
    totalTickets: 500,
  },
]

const mapEvents = [
  { id: '1', title: 'SƠN TÙNG M-TP: THE FIRST JOURNEY 2024', lat: 10.8016, lng: 106.6660, location: 'SVĐ Quân khu 7, TP.HCM', date: '15 Th12, 2024' },
  { id: '2', title: 'AI Innovation Summit 2024', lat: 10.7877, lng: 106.7018, location: 'Gem Center, Quận 1, TP.HCM', date: '28 Th11, 2024' },
  { id: '3', title: 'Artisan Market - Hội Chợ Thủ Công', lat: 21.0335, lng: 105.8505, location: 'Khu Phố Cổ, Hà Nội', date: '10 Th01, 2025' }
]

const Homepage = () => {
  const { user, signOut } = useAuthStore()
  const { categories, fetchCategories } = useCategoryStore()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <div className="min-h-screen bg-background-light font-display">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50 border-b border-slate-200/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Icon name="confirmation_number" className="text-white text-lg" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight">
              Event<span className="text-sky-400">Platform</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-primary">Trang chủ</Link>
            <Link to="/explore" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Khám phá</Link>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Về chúng tôi</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Liên hệ</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:flex flex-col items-start text-xs">
                    <span className="text-slate-500 font-medium">Xin chào,</span>
                    <span className="text-slate-900 font-bold max-w-[100px] truncate">{user.fullName || user.email}</span>
                  </div>
                  <Icon name="expand_more" className="text-slate-400" size="sm" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
                      <Icon name="person" size="sm" /> Tài khoản
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-6 md:pt-10">
        <div className="relative overflow-hidden rounded-[28px] bg-[#061A3A] text-white shadow-[0_24px_70px_rgba(2,6,23,0.35)] ring-1 ring-white/10">
          {/* background accents (lightweight) */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 h-52 w-[520px] -translate-x-1/2 bg-sky-500/25 blur-3xl" />
            <div className="absolute -top-12 -left-10 h-48 w-48 bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -top-12 -right-10 h-48 w-48 bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-40 opacity-40 [background:repeating-linear-gradient(90deg,rgba(148,163,184,0.18)_0,rgba(148,163,184,0.18)_2px,transparent_2px,transparent_10px)]" />
            <div className="absolute inset-0 opacity-[0.10] [background:radial-gradient(circle_at_50%_35%,white,transparent_60%)]" />
          </div>

          <div className="relative px-6 py-14 md:px-12 md:py-16 lg:px-16 lg:py-20">
            <div className="flex flex-col items-center text-center gap-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-[11px] font-semibold tracking-wide ring-1 ring-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                HỆ SINH THÁI SỰ KIỆN PREMIUM
              </span>
              <div>
                <h2 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
                  Kết Nối Trải Nghiệm
                  <br />
                </h2>
                <p className="mt-4 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
                  Nền tảng quản lý và bán vé sự kiện chuyên nghiệp, mang lại sự tin cậy
                  <br className="hidden md:block" />
                  và thanh lịch tuyệt đối.
                </p>
              </div>

              {/* Search bar */}
              <div className="mt-4 w-full max-w-3xl">
                <div className="bg-white rounded-full shadow-[0_18px_44px_rgba(2,6,23,0.35)] px-2 py-2 ring-1 ring-slate-200">
                  <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200">
                      <Icon name="search" className="text-slate-400" />
                      <input
                        placeholder="Tìm tên sự kiện, nghệ sĩ, hội thảo..."
                        className="w-full bg-transparent text-[13px] md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none"
                      />
                    </div>
                    <div className="hidden md:block h-10 w-px bg-slate-200 my-auto" />
                    <button className="flex items-center justify-between gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-[13px] md:text-sm text-slate-700 font-semibold">
                      <Icon name="location_on" className="text-sky-500" />
                      <span className="whitespace-nowrap">Chọn khu vực</span>
                    </button>
                    <div className="hidden md:block h-10 w-px bg-slate-200 my-auto" />
                    <button className="flex items-center justify-between gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-[13px] md:text-sm text-slate-700 font-semibold">
                      <Icon name="event" className="text-sky-500" />
                      <span className="whitespace-nowrap">Chọn ngày</span>
                    </button>
                    <Link
                      to="/explore"
                      className="mt-1 md:mt-0 md:ml-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white whitespace-nowrap"
                    >
                      <Icon name="search" size="sm" />
                      Tìm ngay
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 mt-10 md:mt-12 relative z-10">
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/70 rounded-3xl shadow-lg shadow-slate-900/5 p-4 md:p-6">
          <div className="flex items-end justify-between gap-6 mb-4 md:mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-slate-900">Chọn theo chủ đề</h3>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Gợi ý nhanh để bạn tìm đúng gu</p>
            </div>
            <Link to="/explore" className="hidden md:inline-flex text-sm font-extrabold text-primary hover:underline items-center gap-1">
              Xem thêm <Icon name="arrow_forward" size="sm" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id || cat.name}
              to="/explore"
              className="rounded-2xl p-5 border border-slate-100 bg-gradient-to-b from-white to-slate-50/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-3 group"
            >
              <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon name={cat.icon} />
              </div>
              <span className="text-sm font-bold text-slate-700">{cat.name}</span>
            </Link>
          ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">Sự kiện nổi bật</h3>
            <p className="text-slate-500 text-sm mt-1">Những sự kiện hot nhất đang được săn đón</p>
          </div>
          <Link to="/explore" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
            Xem tất cả <Icon name="arrow_forward" size="sm" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredEvents.map((event, i) => (
            <EventCard key={i} {...event} />
          ))}
        </div>
      </section>

      {/* Events Near You Map */}
      <section className="bg-slate-50 border-y border-slate-200/60 pb-16 pt-12 mt-4 relative z-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Sự kiện quanh bạn</h3>
              <p className="text-slate-500 text-sm mt-1">Khám phá các sự kiện thú vị đang diễn ra gần vị trí của bạn</p>
            </div>
          </div>
          <EventMap events={mapEvents} />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 pb-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Đặt vé cực nhanh</h3>
              <p className="text-slate-500 text-sm mt-1">3 bước để sẵn sàng lên đường</p>
            </div>
            <Link to="/explore" className="hidden md:inline-flex text-sm font-extrabold text-primary hover:underline items-center gap-1">
              Bắt đầu <Icon name="arrow_forward" size="sm" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'search', title: 'Tìm sự kiện', desc: 'Lọc theo chủ đề, địa điểm, thời gian và ngân sách.' },
              { icon: 'shopping_cart', title: 'Chọn vé', desc: 'Xem chi tiết, chỗ ngồi (nếu có) và số lượng vé còn lại.' },
              { icon: 'qr_code_2', title: 'Nhận vé', desc: 'Nhận e-ticket nhanh chóng và check-in tiện lợi tại cổng.' },
            ].map((step, idx) => (
              <div key={step.title} className="rounded-2xl border border-slate-100 bg-slate-50/40 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name={step.icon} />
                  </div>
                  <span className="text-xs font-extrabold text-slate-400">0{idx + 1}</span>
                </div>
                <p className="text-base font-extrabold text-slate-900 mb-2">{step.title}</p>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary/5 border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Sự kiện mỗi tháng' },
              { value: '1M+', label: 'Người dùng' },
              { value: '99.9%', label: 'Tỷ lệ hài lòng' },
              { value: '24/7', label: 'Hỗ trợ khách hàng' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-extrabold text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-primary to-electric rounded-3xl p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent_50%)]" />
          <div className="relative">
            <h3 className="text-2xl font-extrabold mb-3">Không bỏ lỡ sự kiện nào!</h3>
            <p className="text-white/70 mb-6">Đăng ký nhận thông báo về các sự kiện mới nhất</p>
            <div className="flex max-w-md mx-auto gap-3">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                className="flex-1 px-5 py-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 transition-colors">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white/60">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-bold mb-4">
                Event<span className="text-sky-400">Platform</span>
              </h4>
              <p className="text-sm leading-relaxed">Nền tảng bán vé sự kiện cao cấp hàng đầu Việt Nam.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Khám phá</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:text-white transition-colors">Sự kiện</a>
                <a href="#" className="block hover:text-white transition-colors">Thể loại</a>
                <a href="#" className="block hover:text-white transition-colors">Địa điểm</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Hỗ trợ</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:text-white transition-colors">FAQ</a>
                <a href="#" className="block hover:text-white transition-colors">Liên hệ</a>
                <a href="#" className="block hover:text-white transition-colors">Điều khoản</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Nhà tổ chức</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:text-white transition-colors">Đăng ký tổ chức</a>
                <a href="#" className="block hover:text-white transition-colors">Bảng giá</a>
                <a href="#" className="block hover:text-white transition-colors">Hướng dẫn</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm">
            © 2024 EventPlatform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
