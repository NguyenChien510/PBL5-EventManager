import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useCategoryStore } from '../stores/useCategoryStore'
import { Icon, SearchInput, Pagination } from '../components/ui'
import { EventCard } from '../components/domain'

// categories will be loaded from store

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

const cities = ['Tất cả khu vực', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng']
const sorts = ['Mới nhất', 'Giá tăng dần', 'Giá giảm dần', 'Đánh giá cao']

const EventExplore = () => {
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(3000000);
  
  const { categories, fetchCategories } = useCategoryStore()
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const displayCategories = [
    { id: 'all' as const, name: 'Tất cả', icon: 'apps' },
    ...categories
  ]

  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(sorts[0]);
  const sortRef = useRef<HTMLDivElement>(null);

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${
                    selectedCategoryId === cat.id ? 'bg-primary/10 text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon name={cat.icon} size="sm" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-card">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icon name="paid" className="text-primary" size="sm" /> Khoảng giá
            </h3>
            <div className="space-y-6 select-none">
              <div className="flex items-center justify-between text-xs font-bold text-primary bg-primary/5 px-3 py-2 rounded-lg">
                <span>{new Intl.NumberFormat('vi-VN').format(minPrice)}đ</span>
                <span className="text-slate-400">-</span>
                <span>{new Intl.NumberFormat('vi-VN', { notation: 'standard' }).format(maxPrice)}đ{maxPrice >= 3000000 ? '+' : ''}</span>
              </div>
              
              <div className="relative h-1.5 bg-slate-200 rounded-full flex items-center touch-none">
                {/* Active track color */}
                <div 
                  className="absolute h-full bg-primary rounded-full pointer-events-none"
                  style={{ 
                    left: `${(minPrice / 3000000) * 100}%`, 
                    right: `${100 - (maxPrice / 3000000) * 100}%` 
                  }}
                />
                
                {/* Min Slider Element */}
                <input 
                  type="range" 
                  min="0" 
                  max="3000000" 
                  step="100000"
                  value={minPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val <= maxPrice) setMinPrice(val);
                  }}
                  className="absolute w-full h-1.5 opacity-0 appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer z-20"
                />
                
                {/* Max Slider Element */}
                <input 
                  type="range" 
                  min="0" 
                  max="3000000" 
                  step="100000"
                  value={maxPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= minPrice) setMaxPrice(val);
                  }}
                  className="absolute w-full h-1.5 opacity-0 appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer z-30"
                />

                {/* Min Thumb display */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-primary rounded-full shadow-md z-10 pointer-events-none"
                  style={{ left: `calc(${(minPrice / 3000000) * 100}% - 8px)` }}
                />
                
                {/* Max Thumb display */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-primary rounded-full shadow-md z-10 pointer-events-none"
                  style={{ left: `calc(${(maxPrice / 3000000) * 100}% - 8px)` }}
                />
              </div>

              <div className="flex gap-3">
                <input 
                  type="number" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  placeholder="Từ" 
                  className="flex-1 w-0 px-3 py-2.5 bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-sm font-semibold transition-all outline-none" 
                />
                <input 
                  type="number" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  placeholder="Đến" 
                  className="flex-1 w-0 px-3 py-2.5 bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-sm font-semibold transition-all outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="filter-card">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icon name="location_on" className="text-primary" size="sm" /> Khu vực
            </h3>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 hover:border-primary/50 rounded-xl text-sm font-semibold text-slate-700 transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
              >
                {selectedCity}
                <Icon name={isCityDropdownOpen ? "expand_less" : "expand_more"} className="text-slate-400 transition-transform" />
              </button>
              
              {isCityDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 transform opacity-100 scale-100 transition-all origin-top">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setSelectedCity(city); setIsCityDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedCity === city 
                          ? 'bg-primary/5 text-primary font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Event Grid */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6 z-40 relative">
            <h2 className="text-2xl font-extrabold text-slate-900">Khám phá sự kiện</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500 hidden sm:block">{events.length} sự kiện</span>
              
              <div className="relative" ref={sortRef}>
                <button 
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-primary/50 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
                >
                  <Icon name="sort" size="sm" className="text-slate-400" />
                  {selectedSort}
                  <Icon name={isSortDropdownOpen ? "expand_less" : "expand_more"} size="sm" className="text-slate-400 ml-1 transition-transform" />
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 z-50 transform opacity-100 scale-100 transition-all origin-top-right">
                    {sorts.map((sortOption) => (
                      <button
                        key={sortOption}
                        onClick={() => { setSelectedSort(sortOption); setIsSortDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          selectedSort === sortOption 
                            ? 'bg-primary/5 text-primary font-bold' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        {sortOption}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
