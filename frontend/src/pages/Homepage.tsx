import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Icon } from '../components/ui'
import { Navbar } from '../components/layout'
import { EventCard, EventMap } from '../components/domain'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useLocationStore } from '../stores/useLocationStore'

// Feature events removed (using real database only)

interface UpcomingEvent {
  id: number
  title: string
  location: string
  startTime: string
  posterUrl?: string
  categoryName?: string
  categoryColor?: string
  provinceName?: string
  minPrice?: number
  maxPrice?: number
  ticketsLeft?: number
  totalTickets?: number
  status: 'pending' | 'sold_out' | 'ended' | 'upcoming'
}

interface NearbyMapEvent {
  id: string
  title: string
  lat: number
  lng: number
  location: string
  date: string
  provinceName: string
  image?: string
  time?: string
}

const provinceFallbackCoords: Record<string, { lat: number; lng: number }> = {
  'TP. Hồ Chí Minh': { lat: 10.7769, lng: 106.7009 },
  'Hồ Chí Minh': { lat: 10.7769, lng: 106.7009 },
  'Hà Nội': { lat: 21.0285, lng: 105.8542 },
  'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
  'Cần Thơ': { lat: 10.0452, lng: 105.7469 },
  'Hải Phòng': { lat: 20.8449, lng: 106.6881 },
  'Khánh Hòa': { lat: 12.2388, lng: 109.1967 },
  'Lâm Đồng': { lat: 11.9404, lng: 108.4583 },
}

const Homepage = () => {
  const { categories, fetchCategories } = useCategoryStore()
  const { provinces, fetchProvinces } = useLocationStore()
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState('Chọn khu vực')
  const locationRef = useRef<HTMLDivElement>(null)

  const [isDateOpen, setIsDateOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('Tất cả thời gian')
  const dateRef = useRef<HTMLDivElement>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [nearbyMapEvents, setNearbyMapEvents] = useState<NearbyMapEvent[]>([])
  const [isMapLoading, setIsMapLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchProvinces()
  }, [fetchCategories, fetchProvinces])

  useEffect(() => {
    let isMounted = true
    const fetchUpcomingEvents = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/events/upcoming-card-data')
        if (!res.ok) throw new Error('Failed to fetch upcoming events')
        const data = await res.json()
        if (isMounted) setUpcomingEvents(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to load upcoming events for homepage map:', error)
        if (isMounted) setUpcomingEvents([])
      }
    }

    fetchUpcomingEvents()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    let isMounted = true

    const toDisplayDate = (isoDateTime: string) => {
      const date = new Date(isoDateTime)
      if (Number.isNaN(date.getTime())) return 'Sắp diễn ra'
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const toDisplayTime = (isoDateTime: string) => {
      const date = new Date(isoDateTime)
      if (Number.isNaN(date.getTime())) return '--:--'
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }

    const getFallbackCoords = (provinceName?: string, location?: string) => {
      if (provinceName && provinceFallbackCoords[provinceName]) {
        return provinceFallbackCoords[provinceName]
      }

      if (location) {
        const matched = Object.entries(provinceFallbackCoords).find(([key]) => location.includes(key))
        if (matched) return matched[1]
      }

      return { lat: 10.7769, lng: 106.7009 }
    }

    const buildNearbyMapEvents = async () => {
      if (upcomingEvents.length === 0) {
        setNearbyMapEvents([])
        return
      }

      setIsMapLoading(true)
      try {
        const geocoded = await Promise.all(
          upcomingEvents.slice(0, 20).map(async (event) => {
            const query = [event.location, event.provinceName, 'Viet Nam'].filter(Boolean).join(', ')
            let lat: number | null = null
            let lng: number | null = null
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
              const data = await res.json()
              if (Array.isArray(data) && data.length > 0) {
                lat = Number(data[0].lat)
                lng = Number(data[0].lon)
              }
            } catch {
              // fall through to province-level fallback
            }

            if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
              const fallback = getFallbackCoords(event.provinceName, event.location)
              lat = fallback.lat
              lng = fallback.lng
            }

            return {
              id: String(event.id),
              title: event.title,
              lat,
              lng,
              location: event.location,
              date: toDisplayDate(event.startTime),
              time: toDisplayTime(event.startTime),
              provinceName: event.provinceName || '',
              image: event.posterUrl,
            } as NearbyMapEvent
          })
        )

        if (isMounted) {
          setNearbyMapEvents(geocoded.filter((e): e is NearbyMapEvent => !!e))
        }
      } catch (error) {
        console.error('Failed to geocode upcoming event locations:', error)
        if (isMounted) setNearbyMapEvents([])
      } finally {
        if (isMounted) setIsMapLoading(false)
      }
    }

    buildNearbyMapEvents()
    return () => { isMounted = false }
  }, [upcomingEvents])

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNearbyEvents =
    selectedProvince === 'Chọn khu vực' || selectedProvince === 'Tất cả khu vực'
      ? nearbyMapEvents
      : nearbyMapEvents.filter(event => event.provinceName === selectedProvince)

  const featuredEventsFromDb = upcomingEvents.slice(0, 3).map((event) => {
    const dateObj = new Date(event.startTime)
    const validDate = !Number.isNaN(dateObj.getTime())
    const formatVnd = (value?: number) =>
      typeof value === 'number'
        ? value.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ'
        : null
    const low = formatVnd(event.minPrice)
    const high = formatVnd(event.maxPrice)
    const priceDisplay = low && high ? (low === high ? low : `${low} - ${high}`) : (low || high || 'Đang cập nhật')

    return {
      id: event.id,
      image: event.posterUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop',
      title: event.title,
      date: validDate ? dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sắp cập nhật',
      time: validDate ? dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--',
      location: event.location,
      price: priceDisplay,
      category: event.categoryName || 'Sự kiện',
      categoryColor: event.categoryColor || 'bg-primary/10 text-primary',

      rating: undefined,
      ticketsLeft: event.ticketsLeft,
      totalTickets: event.totalTickets,
    }
  })

  const visibleFeaturedEvents = featuredEventsFromDb;

  return (
    <div className="min-h-screen bg-background-light font-display">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-6 md:pt-10 relative z-40">
        <div className="relative rounded-[28px] bg-[#061A3A] text-white shadow-[0_24px_70px_rgba(2,6,23,0.35)] ring-1 ring-white/10 min-h-[400px]">
          {/* Background Decorations With Clipping */}
          <div className="absolute inset-0 overflow-hidden rounded-[28px] pointer-events-none">
            <div className="absolute -top-24 left-1/2 h-52 w-[520px] -translate-x-1/2 bg-sky-500/25 blur-3xl" />
            <div className="absolute -top-12 -left-10 h-48 w-48 bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -top-12 -right-10 h-48 w-48 bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-40 opacity-40 [background:repeating-linear-gradient(90deg,rgba(148,163,184,0.18)_0,rgba(148,163,184,0.18)_2px,transparent_2px,transparent_10px)]" />
            <div className="absolute inset-0 opacity-[0.10] [background:radial-gradient(circle_at_50%_35%,white,transparent_60%)]" />
          </div>

          <div className="relative px-6 py-14 md:px-12 md:py-16 lg:px-16 lg:py-20 z-20">
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
              <div className="mt-4 w-full max-w-4xl relative z-50">
                <div className="bg-white rounded-full shadow-[0_18px_44px_rgba(2,6,23,0.35)] px-2 py-2 ring-1 ring-slate-200">
                  <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 transition-all">
                      <Icon name="search" className="text-slate-400" />
                      <input
                        placeholder="Tìm tên sự kiện, nghệ sĩ, hội thảo..."
                        className="w-full bg-transparent text-[13px] md:text-sm text-slate-800 placeholder:text-slate-400 outline-none border-none focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="hidden md:block h-10 w-px bg-slate-100 my-auto mx-2" />

                    {/* Province Selector */}
                    <div className="relative" ref={locationRef}>
                      <button
                        onClick={() => setIsLocationOpen(!isLocationOpen)}
                        className={`h-full flex items-center justify-between gap-2 px-4 py-2 rounded-full border text-[13px] md:text-sm font-bold transition-all min-w-[160px] ${isLocationOpen ? 'bg-white border-sky-500 text-primary shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-sky-300'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon name="location_on" className="text-sky-500" />
                          <span className="whitespace-nowrap">{selectedProvince}</span>
                        </div>
                        <Icon name={isLocationOpen ? "expand_less" : "expand_more"} size="sm" className="text-slate-400" />
                      </button>

                      {isLocationOpen && (
                        <div className="absolute top-full left-0 mt-3 w-full max-h-64 overflow-y-auto bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-[100] text-left animate-slide-down ring-1 ring-slate-200/50">
                          <button
                            onClick={() => { setSelectedProvince('Tất cả khu vực'); setIsLocationOpen(false); }}
                            className="w-full px-4 py-3 text-sm text-slate-600 hover:bg-sky-50 hover:text-primary transition-all font-semibold flex items-center justify-between group"
                          >
                            Tất cả khu vực
                            {selectedProvince === 'Tất cả khu vực' && <Icon name="check" size="sm" className="text-primary" />}
                          </button>
                          {provinces.map((province) => (
                            <button
                              key={province.id}
                              onClick={() => { setSelectedProvince(province.name); setIsLocationOpen(false); }}
                              className={`w-full px-4 py-3 text-sm transition-all font-semibold border-t border-slate-50 flex items-center justify-between group ${selectedProvince === province.name ? 'bg-sky-50 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                                }`}
                            >
                              {province.name}
                              {selectedProvince === province.name && <Icon name="check" size="sm" className="text-primary" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="hidden md:block h-10 w-px bg-slate-100 my-auto mx-2" />

                    {/* Date Selector */}
                    <div className="relative" ref={dateRef}>
                      <button
                        onClick={() => setIsDateOpen(!isDateOpen)}
                        className={`h-full flex items-center justify-between gap-2 px-5 py-2.5 rounded-full border text-[13px] md:text-sm font-bold transition-all group shadow-sm active:scale-95 ${isDateOpen ? 'bg-white border-sky-500 text-primary' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-sky-300'
                          }`}
                      >
                        <Icon name="event" className={`text-sky-500 transition-transform ${isDateOpen ? 'scale-110' : ''}`} />
                        <span className="whitespace-nowrap">{selectedDate}</span>
                        <Icon name={isDateOpen ? "expand_less" : "expand_more"} size="sm" className="text-slate-400" />
                      </button>

                      {isDateOpen && (
                        <div className="absolute top-full right-0 md:left-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-[100] text-left animate-slide-down ring-1 ring-slate-200/50">
                          {['Tất cả thời gian', 'Hôm nay', 'Ngày mai', 'Tháng này'].map((option) => (
                            <button
                              key={option}
                              onClick={() => { setSelectedDate(option); setIsDateOpen(false); }}
                              className={`w-full px-4 py-3 text-sm transition-all font-semibold flex items-center justify-between group ${selectedDate === option ? 'bg-sky-50 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
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
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-sky-500 transition-colors"
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

                    <Link
                      to="/explore"
                      className="mt-1 md:mt-0 md:ml-3 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-sm font-black text-white whitespace-nowrap shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95"
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
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: cat.color }}
                >
                  <div className="relative z-10">
                    <Icon name={cat.icon} />
                  </div>
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
            <p className="text-slate-500 text-sm mt-1">Các sự kiện đang được quan tâm nhiều nhất</p>
          </div>
          <Link to="/explore" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
            Xem tất cả <Icon name="arrow_forward" size="sm" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleFeaturedEvents.length > 0 ? (
            visibleFeaturedEvents.map((event, i) => (
              <Link key={event.id || i} to={`/event/${event.id}`}>
                <EventCard {...event} />
              </Link>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 h-48 flex items-center justify-center text-slate-500 bg-white rounded-3xl border border-slate-100 italic">
              Đang tải danh sách sự kiện nổi bật...
            </div>
          )}
        </div>
      </section>

      {/* Events Near You Map */}
      <section className="bg-slate-50 border-y border-slate-200/60 pb-16 pt-12 mt-4 relative z-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Sự kiện quanh bạn</h3>
            </div>
          </div>
          {isMapLoading ? (
            <div className="w-full h-[400px] md:h-[500px] rounded-3xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 font-semibold">
              Đang tải vị trí sự kiện...
            </div>
          ) : filteredNearbyEvents.length > 0 ? (
            <EventMap events={filteredNearbyEvents} />
          ) : (
            <div className="w-full h-[400px] md:h-[500px] rounded-3xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 font-semibold">
              Chưa có sự kiện upcoming phù hợp để hiển thị bản đồ.
            </div>
          )}
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
