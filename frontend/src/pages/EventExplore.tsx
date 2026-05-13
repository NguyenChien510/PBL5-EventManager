import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useLocationStore } from '../stores/useLocationStore'
import { Icon, Pagination } from '../components/ui'
import { Navbar } from '../components/layout'
import { EventCard } from '../components/domain'
import { EventService } from '../services/eventService'

const sorts = ['Mới nhất', 'Giá tăng dần', 'Giá giảm dần', 'Đánh giá cao']

const EventExplore = () => {
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000000);

  const { categories, fetchCategories } = useCategoryStore()
  const { provinces, fetchProvinces } = useLocationStore()
  const [searchParams] = useSearchParams();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>(
    searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : 'all'
  );

  const [searchQuery, setSearchQuery] = useState(searchParams.get('keyword') || '');
  const [selectedProvince, setSelectedProvince] = useState(searchParams.get('province') || 'Chọn khu vực');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || 'Tất cả thời gian');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(sorts[0]);
  const sortRef = useRef<HTMLDivElement>(null);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await EventService.searchEvents({
        keyword: searchQuery,
        categoryId: selectedCategoryId,
        province: selectedProvince,
        minPrice,
        maxPrice: maxPrice >= 10000000 ? undefined : maxPrice,
        dateFilter: selectedDate,
        sortBy: selectedSort
      });
      setEventsData(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchCategories()
    fetchProvinces()
    // initial fetch will be triggered by the debounce effect below
  }, [fetchCategories, fetchProvinces])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategoryId, selectedProvince, minPrice, maxPrice, selectedDate, selectedSort]);

  const displayCategories = [
    { id: 'all' as const, name: 'Tất cả', icon: 'apps' },
    ...categories
  ]

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
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
      <Navbar />

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
                    selectedCategoryId === cat.id 
                      ? 'bg-primary/15 text-primary font-black' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat.color ? (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  ) : (
                    <Icon name={cat.icon} size="sm" />
                  )}
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
                <span>{new Intl.NumberFormat('vi-VN', { notation: 'standard' }).format(maxPrice)}đ{maxPrice >= 10000000 ? '+' : ''}</span>
              </div>

              <div className="relative h-1.5 bg-slate-200 rounded-full flex items-center touch-none">
                <div
                  className="absolute h-full bg-primary rounded-full pointer-events-none"
                  style={{
                    left: `${Math.min(100, (minPrice / 10000000) * 100)}%`,
                    right: `${100 - Math.min(100, (maxPrice / 10000000) * 100)}%`
                  }}
                />

                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="100000"
                  value={minPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val <= maxPrice) setMinPrice(val);
                  }}
                  className="absolute w-full h-1.5 opacity-0 appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer z-20"
                />

                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="100000"
                  value={maxPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= minPrice) setMaxPrice(val);
                  }}
                  className="absolute w-full h-1.5 opacity-0 appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer z-30"
                />

                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-primary rounded-full shadow-md z-10 pointer-events-none"
                  style={{ left: `calc(${Math.min(100, (minPrice / 10000000) * 100)}% - 8px)` }}
                />

                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-primary rounded-full shadow-md z-10 pointer-events-none"
                  style={{ left: `calc(${Math.min(100, (maxPrice / 10000000) * 100)}% - 8px)` }}
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

        </aside>

        {/* Event Grid */}
        <main className="flex-1 space-y-8">
          {/* Main Search Bar (from Homepage Hero) */}
          <div className="w-full relative z-50">
            <div className="bg-white rounded-2xl md:rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.08)] px-2 py-2 ring-1 ring-slate-200/60">
              <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0">
                <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50/50 border border-slate-100 transition-all focus-within:bg-white focus-within:border-primary/30">
                  <Icon name="search" className="text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên sự kiện, nghệ sĩ, hội thảo..."
                    className="w-full bg-transparent text-[13px] md:text-sm text-slate-800 placeholder:text-slate-400 outline-none border-none focus:outline-none focus:ring-0"
                  />
                </div>

                <div className="hidden md:block h-8 w-px bg-slate-100 my-auto mx-2" />

                {/* Province Selector */}
                <div className="relative" ref={locationRef}>
                  <button
                    onClick={() => setIsLocationOpen(!isLocationOpen)}
                    className={`h-full flex items-center justify-between gap-2 px-4 py-2 rounded-full border text-[13px] md:text-sm font-bold transition-all min-w-[160px] ${isLocationOpen ? 'bg-white border-primary text-primary shadow-sm' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-white hover:border-slate-200'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="location_on" className="text-primary" />
                      <span className="whitespace-nowrap">{selectedProvince}</span>
                    </div>
                    <Icon name={isLocationOpen ? "expand_less" : "expand_more"} size="sm" className="text-slate-400" />
                  </button>

                  {isLocationOpen && (
                    <div className="absolute top-full left-0 mt-3 w-full max-h-64 overflow-y-auto bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-[100] text-left ring-1 ring-slate-200/50">
                      <button
                        onClick={() => { setSelectedProvince('Tất cả khu vực'); setIsLocationOpen(false); }}
                        className="w-full px-4 py-3 text-sm text-slate-600 hover:bg-primary/5 hover:text-primary transition-all font-semibold flex items-center justify-between group"
                      >
                        Tất cả khu vực
                        {selectedProvince === 'Tất cả khu vực' && <Icon name="check" size="sm" className="text-primary" />}
                      </button>
                      {provinces.map((province) => (
                        <button
                          key={province.id}
                          onClick={() => { setSelectedProvince(province.name); setIsLocationOpen(false); }}
                          className={`w-full px-4 py-3 text-sm transition-all font-semibold border-t border-slate-50 flex items-center justify-between group ${selectedProvince === province.name ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                            }`}
                        >
                          {province.name}
                          {selectedProvince === province.name && <Icon name="check" size="sm" className="text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden md:block h-8 w-px bg-slate-100 my-auto mx-2" />

                {/* Date Selector */}
                <div className="relative" ref={dateRef}>
                  <button
                    onClick={() => setIsDateOpen(!isDateOpen)}
                    className={`h-full flex items-center justify-between gap-2 px-5 py-2.5 rounded-full border text-[13px] md:text-sm font-bold transition-all group active:scale-95 ${isDateOpen ? 'bg-white border-primary text-primary' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-white hover:border-slate-200'
                      }`}
                  >
                    <Icon name="event" className={`text-primary transition-transform ${isDateOpen ? 'scale-110' : ''}`} />
                    <span className="whitespace-nowrap">{selectedDate}</span>
                    <Icon name={isDateOpen ? "expand_less" : "expand_more"} size="sm" className="text-slate-400" />
                  </button>

                  {isDateOpen && (
                    <div className="absolute top-full right-0 md:left-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-[100] text-left ring-1 ring-slate-200/50">
                      {['Tất cả thời gian', 'Hôm nay', 'Ngày mai', 'Tháng này'].map((option) => (
                        <button
                          key={option}
                          onClick={() => { setSelectedDate(option); setIsDateOpen(false); }}
                          className={`w-full px-4 py-3 text-sm transition-all font-semibold flex items-center justify-between group ${selectedDate === option ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                            }`}
                        >
                          {option}
                          {selectedDate === option && <Icon name="check" size="sm" className="text-primary" />}
                        </button>
                      ))}
                      <div className="border-t border-slate-50 px-4 py-2 mt-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Hoặc chọn ngày cụ thể</label>
                        <input
                          type="date"
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-primary transition-colors"
                          onChange={(e) => {
                            if (e.target.value) {
                              setSelectedDate(new Date(e.target.value).toLocaleDateString('vi-VN'));
                              setIsDateOpen(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => loadEvents()}
                  className="mt-1 md:mt-0 md:ml-3 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-blue-600 text-sm font-black text-white whitespace-nowrap shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                >
                  <Icon name="search" size="sm" />
                  Tìm ngay
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-6 z-40 relative">
            <h2 className="text-2xl font-extrabold text-slate-900">Khám phá sự kiện</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500 hidden sm:block">{eventsData.length} sự kiện</span>

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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedSort === sortOption
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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
          ) : eventsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {eventsData.map((evt) => {
                const startDate = new Date(evt.startTime);
                const dateStr = startDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
                const timeStr = startDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                const priceStr = evt.minPrice ? new Intl.NumberFormat("vi-VN").format(evt.minPrice) + "đ" : "Chưa cập nhật";
                const locStr = evt.location ? `${evt.location}${evt.provinceName ? `, ${evt.provinceName}` : ""}` : (evt.provinceName || "Chưa cập nhật");

                return (
                  <Link key={evt.id} to={`/event/${evt.id}`} className="block">
                    <EventCard
                      image={evt.posterUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8"}
                      title={evt.title}
                      date={dateStr}
                      time={timeStr}
                      location={locStr}
                      price={priceStr}
                      category={evt.categoryName || "Sự kiện"}
                      categoryColor={evt.categoryColor}
                      ticketsLeft={evt.ticketsLeft}
                      totalTickets={evt.totalTickets}
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Icon name="event_busy" className="text-6xl text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Không tìm thấy sự kiện nào</h3>
              <p className="text-slate-500 mt-2">Hãy thử thay đổi bộ lọc tìm kiếm của bạn</p>
            </div>
          )}

          {!loading && eventsData.length > 0 && (
            <Pagination current={1} total={1} label={`Hiển thị ${eventsData.length} sự kiện`} />
          )}
        </main>
      </div>
    </div>
  )
}

export default EventExplore
