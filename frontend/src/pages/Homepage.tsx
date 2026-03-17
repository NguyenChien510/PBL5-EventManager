import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'
import { EventCard } from '../components/domain'

const categories = [
  { icon: 'music_note', label: 'Âm nhạc', color: 'bg-pink-500' },
  { icon: 'computer', label: 'Công nghệ', color: 'bg-cyan-500' },
  { icon: 'palette', label: 'Nghệ thuật', color: 'bg-purple-500' },
  { icon: 'sports_soccer', label: 'Thể thao', color: 'bg-orange-500' },
  { icon: 'restaurant', label: 'Ẩm thực', color: 'bg-yellow-500' },
]

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

const Homepage = () => {
  return (
    <div className="min-h-screen bg-background-light font-display">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Icon name="confirmation_number" className="text-white text-lg" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight">
              WOW<span className="text-primary">Premium</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-primary">Trang chủ</Link>
            <Link to="/explore" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Khám phá</Link>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Về chúng tôi</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Liên hệ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/profile" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              Đăng nhập
            </Link>
            <Link to="/explore" className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
              Khám phá ngay
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary/20 text-white">
        <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white/80 mb-6">
              <Icon name="auto_awesome" size="sm" />
              Nền tảng bán vé #1 Việt Nam
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              Khám phá & Trải nghiệm<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Sự kiện Đẳng cấp</span>
            </h2>
            <p className="text-lg text-white/70 mb-8 leading-relaxed">
              Từ concert đỉnh cao đến hội thảo công nghệ, tìm kiếm và đặt vé cho những trải nghiệm không thể quên.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/explore" className="px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/30 flex items-center gap-2">
                <Icon name="explore" size="sm" />
                Khám phá sự kiện
              </Link>
              <Link to="/organizer/dashboard" className="px-8 py-3.5 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20">
                Tôi là nhà tổ chức
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              to="/explore"
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-3 group"
            >
              <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon name={cat.icon} />
              </div>
              <span className="text-sm font-bold text-slate-700">{cat.label}</span>
            </Link>
          ))}
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
              <h4 className="text-white font-bold mb-4">WOW Premium</h4>
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
            © 2024 WOW Premium. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
