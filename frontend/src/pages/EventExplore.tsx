import { Link } from 'react-router-dom'
import { Icon, SearchInput, Pagination } from '../components/ui'
import { EventCard } from '../components/domain'

const categories = [
  { label: 'Tất cả', icon: 'apps', active: true },
  { label: 'Âm nhạc', icon: 'music_note', active: false },
  { label: 'Công nghệ', icon: 'computer', active: false },
  { label: 'Nghệ thuật', icon: 'palette', active: false },
  { label: 'Thể thao', icon: 'sports_soccer', active: false },
  { label: 'Ẩm thực', icon: 'restaurant', active: false },
]

const events = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8',
    title: 'SƠN TÙNG M-TP: THE FIRST JOURNEY 2024',
    date: '15 Th12, 2024', time: '20:00',
    location: 'SVĐ Quân khu 7, TP.HCM',
    price: '500.000đ', category: 'Âm nhạc',
    categoryColor: 'bg-pink-100 text-pink-600',
    rating: 4.9, ticketsLeft: 120, totalTickets: 800,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8uGa4mjJqgWx5lFfDdLFanomchIA51IL8c0cvb3MIvS4GBu7ELTNexbhcJEIciFGOrbVfUWEGrFk5mRHb_asax4cBD8ddZD6DCO2x-TFSGHMrGlb_3UzaAzSv-lol1Y13h0NCWx1bisS-1wiw9mM1Pk1uAuWn4ENmtn0bHrhfEN0_pXnmDQCY_Dx7HWH1bijivgY4hCUMU_lb4qGiw0i4ZqDGhPXEC97rUmzSAyfodwGiVLLxAAz2QaKrFMSGuRiEE4j49dJZMqw',
    title: 'AI Innovation Summit 2024',
    date: '28 Th11, 2024', time: '08:00',
    location: 'Gem Center, Quận 1',
    price: '800.000đ', category: 'Công nghệ',
    categoryColor: 'bg-cyan-100 text-cyan-600',
    rating: 4.7, ticketsLeft: 45, totalTickets: 200,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrnq1Yzgsd28u9RCJh3At5GShj32DcYi9T_WN8ctWilvGZn9VmfNHcOXN0PJVpwKNobaOeiLmwLHEdWBHMa0-lffiM-Lwoaqt5KkCR09eDjWJ-SCeEHoTwndxp4Nre5iCAhg4T1qbg7h75lD0xQbdhUfxGLICenIk71wCsX_N9LaLNhSBdHcgwT-D_-lV4s-BSw1EUi9YzTDRA_WzoNc9T9dOkYFrwkftJ5xX9JXksilQMRTFko1lYzpfcj_je9bmv6z9ywUt6AXg',
    title: 'Artisan Market - Hội Chợ Thủ Công',
    date: '10 Th01, 2025', time: '09:00',
    location: 'Khu Phố Cổ, Hà Nội',
    price: '150.000đ', category: 'Nghệ thuật',
    categoryColor: 'bg-purple-100 text-purple-600',
    rating: 4.5, ticketsLeft: 280, totalTickets: 500,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8',
    title: 'Rock Festival Vietnam 2024',
    date: '20 Th12, 2024', time: '18:00',
    location: 'SVĐ Mỹ Đình, Hà Nội',
    price: '350.000đ', category: 'Âm nhạc',
    categoryColor: 'bg-pink-100 text-pink-600',
    rating: 4.8, ticketsLeft: 350, totalTickets: 1000,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8uGa4mjJqgWx5lFfDdLFanomchIA51IL8c0cvb3MIvS4GBu7ELTNexbhcJEIciFGOrbVfUWEGrFk5mRHb_asax4cBD8ddZD6DCO2x-TFSGHMrGlb_3UzaAzSv-lol1Y13h0NCWx1bisS-1wiw9mM1Pk1uAuWn4ENmtn0bHrhfEN0_pXnmDQCY_Dx7HWH1bijivgY4hCUMU_lb4qGiw0i4ZqDGhPXEC97rUmzSAyfodwGiVLLxAAz2QaKrFMSGuRiEE4j49dJZMqw',
    title: 'Startup Pitch Night #12',
    date: '05 Th01, 2025', time: '19:00',
    location: 'Dreamplex, Q1, TP.HCM',
    price: 'Miễn phí', category: 'Công nghệ',
    categoryColor: 'bg-cyan-100 text-cyan-600',
    rating: 4.3, ticketsLeft: 15, totalTickets: 50,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrnq1Yzgsd28u9RCJh3At5GShj32DcYi9T_WN8ctWilvGZn9VmfNHcOXN0PJVpwKNobaOeiLmwLHEdWBHMa0-lffiM-Lwoaqt5KkCR09eDjWJ-SCeEHoTwndxp4Nre5iCAhg4T1qbg7h75lD0xQbdhUfxGLICenIk71wCsX_N9LaLNhSBdHcgwT-D_-lV4s-BSw1EUi9YzTDRA_WzoNc9T9dOkYFrwkftJ5xX9JXksilQMRTFko1lYzpfcj_je9bmv6z9ywUt6AXg',
    title: 'Lễ hội Ẩm thực Hà Nội 2024',
    date: '22 Th12, 2024', time: '10:00',
    location: 'Ba Vì, Hà Nội',
    price: '100.000đ', category: 'Ẩm thực',
    categoryColor: 'bg-yellow-100 text-yellow-600',
    rating: 4.6, ticketsLeft: 180, totalTickets: 300,
  },
]

const EventExplore = () => {
  return (
    <div className="min-h-screen bg-background-light font-display">
      {/* Top Bar */}
      <nav className="glass-nav sticky top-0 z-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Icon name="confirmation_number" className="text-white text-lg" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight">
              Event<span className="text-sky-500 font-black">Platform</span>
            </h1>
          </Link>
          <SearchInput placeholder="Tìm sự kiện, nghệ sĩ, địa điểm..." className="w-96 hidden md:block" />
          <div className="flex items-center gap-3">
            <Link to="/profile" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-primary">Đăng nhập</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-72 shrink-0 hidden lg:block space-y-6">
          <div className="filter-card">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icon name="tune" className="text-primary" size="sm" /> Thể loại
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${
                    cat.active ? 'bg-primary/10 text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon name={cat.icon} size="sm" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-card">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icon name="paid" className="text-primary" size="sm" /> Khoảng giá
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input type="number" placeholder="Từ" className="flex-1 px-3 py-2 bg-slate-50 rounded-lg border-none text-sm" />
                <input type="number" placeholder="Đến" className="flex-1 px-3 py-2 bg-slate-50 rounded-lg border-none text-sm" />
              </div>
              <input type="range" className="w-full accent-primary" />
            </div>
          </div>

          <div className="filter-card">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icon name="location_on" className="text-primary" size="sm" /> Khu vực
            </h3>
            <div className="space-y-2">
              {['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng'].map((city) => (
                <label key={city} className="flex items-center gap-3 py-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/50" />
                  <span className="text-sm text-slate-600">{city}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Event Grid */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Khám phá sự kiện</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{events.length} sự kiện</span>
              <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm">
                <option>Mới nhất</option>
                <option>Giá tăng dần</option>
                <option>Đánh giá cao</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {events.map((event, i) => (
              <EventCard key={i} {...event} />
            ))}
          </div>

          <Pagination current={1} total={5} label="Hiển thị 6 trong 120 sự kiện" />
        </main>
      </div>
    </div>
  )
}

export default EventExplore
