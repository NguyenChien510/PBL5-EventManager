import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, Loader } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'
import { apiClient } from '../utils/axios'

const sidebarConfig = userSidebarConfig

const UserHistory = () => {
  const navigate = useNavigate()
  const [historyEvents, setHistoryEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'rated' | 'unrated'>('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [ticketsRes, commentsRes] = await Promise.all([
          apiClient.get('/tickets/my'),
          apiClient.get('/comments/my')
        ])

        const checkedInTickets = ticketsRes.data.filter((t: any) => t.status === 'checked_in' || t.status === 'CHECKED_IN' || t.status === 'used')
        const myComments = commentsRes.data

        // Group by eventId
        const eventMap = new Map()
        checkedInTickets.forEach((t: any) => {
          const eId = t.eventId
          if (!eventMap.has(eId)) {
            const comment = myComments.find((c: any) => c.eventId === eId)
            eventMap.set(eId, {
              title: t.title,
              date: t.date,
              location: t.location,
              image: t.image,
              rated: !!comment,
              rating: comment?.rating || 0,
              review: comment?.content || '',
              eventId: eId
            })
          }
        })

        setHistoryEvents(Array.from(eventMap.values()))
      } catch (err) {
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredEvents = historyEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' 
      ? true 
      : filter === 'rated' 
        ? event.rated 
        : !event.rated
    return matchesSearch && matchesFilter
  })

  const reviewedCount = historyEvents.filter(e => e.rated).length
  const unreviewedCount = historyEvents.filter(e => !e.rated).length

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="w-12 h-12 text-primary" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <PageHeader title="Sự kiện đã tham gia" subtitle="Lịch sử tham dự & lưu giữ kỉ niệm đẹp của bạn" />
          </div>
          
          <div className="px-8 py-6 space-y-8">
            {/* Overview Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
              {/* Total Visited */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white relative overflow-hidden shadow-[0_8px_20px_-6px_rgba(37,99,235,0.25)] group hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0">
                    <Icon name="local_activity" className="text-white" size="sm" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-[10px] font-black tracking-wider uppercase leading-none mb-1">Đã tham gia</p>
                    <h4 className="text-2xl font-black leading-none flex items-baseline gap-1">
                      {historyEvents.length} <span className="text-xs font-semibold opacity-75 tracking-normal">sự kiện</span>
                    </h4>
                  </div>
                </div>
              </div>

              {/* Total Reviewed */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white relative overflow-hidden shadow-[0_8px_20px_-6px_rgba(16,185,129,0.25)] group hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0">
                    <Icon name="star" className="text-white" size="sm" filled />
                  </div>
                  <div>
                    <p className="text-emerald-50 text-[10px] font-black tracking-wider uppercase leading-none mb-1">Đã đánh giá</p>
                    <h4 className="text-2xl font-black leading-none flex items-baseline gap-1">
                      {reviewedCount} <span className="text-xs font-semibold opacity-75 tracking-normal">đánh giá</span>
                    </h4>
                  </div>
                </div>
              </div>

              {/* Needing Review */}
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 text-white relative overflow-hidden shadow-[0_8px_20px_-6px_rgba(249,115,22,0.25)] group hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0">
                    <Icon name="rate_review" className="text-white" size="sm" />
                  </div>
                  <div>
                    <p className="text-orange-50 text-[10px] font-black tracking-wider uppercase leading-none mb-1">Chờ phản hồi</p>
                    <h4 className="text-2xl font-black leading-none flex items-baseline gap-1">
                      {unreviewedCount} <span className="text-xs font-semibold opacity-75 tracking-normal">sự kiện</span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Toolbar */}
            {historyEvents.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both shadow-sm">
                {/* Search Input Container */}
                <div className="relative flex-1 min-w-[260px] lg:max-w-sm group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 text-slate-400 group-focus-within:text-primary transition-colors duration-300">
                    <Icon name="search" size="sm" className="transition-transform duration-300 group-focus-within:scale-110" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm sự kiện đã tham gia..." 
                    className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-90 transition-all duration-200"
                    >
                      <Icon name="close" size="xs" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Trạng thái:</span>
                  {(['all', 'rated', 'unrated'] as const).map((f) => {
                    const isActive = filter === f;
                    let colorStyles = "";
                    
                    if (f === 'all') {
                      colorStyles = isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-[0.98]';
                    } else if (f === 'rated') {
                      colorStyles = isActive 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 active:scale-[0.98]';
                    } else {
                      colorStyles = isActive 
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-[1.02]' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 active:scale-[0.98]';
                    }

                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${colorStyles}`}
                      >
                        {f === 'all' ? 'Tất cả' : f === 'rated' ? 'Đã đánh giá' : 'Chưa đánh giá'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main History List */}
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, i) => (
                  <div 
                    key={event.eventId || i} 
                    className="bg-white rounded-[1.75rem] border border-slate-200/70 hover:border-primary/20 p-5 md:p-6 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_40px_-12px_rgba(15,23,42,0.07)] hover:-translate-y-1 flex flex-col md:flex-row gap-6 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                    onClick={() => navigate(`/event/${event.eventId}`)}
                  >
                    {/* Image Section */}
                    <div className="w-full md:w-52 h-36 md:h-32 overflow-hidden rounded-2xl shrink-0 relative group-hover:shadow-lg transition-all duration-500 border border-slate-100/80 bg-slate-50">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-3">
                        <span className="text-white text-[10px] font-black tracking-widest uppercase bg-black/30 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center gap-1 border border-white/10 shadow-inner">
                          <Icon name="visibility" size="xs" />
                          Chi tiết
                        </span>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Badges Layer */}
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100/50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đã tham gia
                          </span>
                          
                          {event.rated && (
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-100/60 px-2.5 py-0.5 rounded-lg text-amber-600 text-xs font-bold shadow-sm">
                              <Icon name="star" size="xs" className="text-amber-500" filled />
                              <span className="mt-0.5">{event.rating}/5</span>
                            </div>
                          )}
                        </div>

                        <h3 className="font-black text-lg md:text-xl text-slate-800 mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                          {event.title}
                        </h3>

                        {/* Event Metadata Tags */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs md:text-sm font-semibold text-slate-500 mb-4">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            <Icon name="calendar_today" size="xs" className="text-slate-400" /> 
                            {event.date}
                          </span>
                          <span className="flex items-center gap-1.5 max-w-[260px] md:max-w-[350px] truncate">
                            <Icon name="location_on" size="xs" className="text-slate-400" /> 
                            {event.location}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Review Section */}
                      <div className="mt-auto">
                        {event.rated ? (
                          <div className="bg-slate-50/80 border border-slate-100/80 p-3.5 rounded-[1.25rem] flex gap-3 items-start group/quote relative">
                            <div className="text-slate-300 flex-shrink-0 transform scale-y-[-1] opacity-40">
                              <Icon name="format_quote" size="sm" />
                            </div>
                            <p className="text-sm text-slate-600 italic font-medium leading-relaxed line-clamp-2 tracking-tight">
                              "{event.review}"
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50/30 border border-blue-100/40 p-3.5 rounded-[1.25rem]">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-blue-600 tracking-widest uppercase mb-0.5 flex items-center gap-1">
                                Chia sẻ cảm nhận của bạn <Icon name="stars" size="xs" />
                              </span>
                              <span className="text-[11px] font-medium text-slate-500 leading-none">Giúp cộng đồng hiểu rõ hơn về trải nghiệm tại sự kiện này.</span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/reviews?eventId=${event.eventId}`);
                              }}
                              className="px-4 py-2 bg-primary hover:bg-blue-700 text-white text-[10px] font-black tracking-widest uppercase rounded-xl transition-all duration-300 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap group/btn hover:-translate-y-0.5 active:translate-y-0"
                            >
                              Đánh giá ngay
                              <Icon name="edit_note" size="xs" className="group-hover/btn:rotate-12 transition-transform duration-300" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* Modern Empty State */
                <div className="py-24 flex flex-col items-center text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200/70 p-8">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 relative shadow-[0_8px_24px_rgba(148,163,184,0.15)]">
                    <Icon name="history" className="text-slate-300" size="lg" />
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center border-2 border-white shadow-sm">
                      <Icon name="search" size="xs" />
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-2">
                    {searchTerm || filter !== 'all' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử tham gia'}
                  </h4>
                  <p className="text-slate-500 font-semibold text-sm max-w-sm leading-relaxed mb-2">
                    {searchTerm || filter !== 'all' 
                      ? 'Vui lòng thử tìm với từ khóa khác hoặc điều chỉnh bộ lọc trạng thái đánh giá.' 
                      : 'Bạn chưa tham gia sự kiện nào qua ứng dụng của chúng tôi. Hãy đặt vé ngay hôm nay!'}
                  </p>
                  
                  {!searchTerm && filter === 'all' && (
                    <button 
                      onClick={() => navigate('/explore')}
                      className="mt-6 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] tracking-widest uppercase rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                    >
                      Khám phá sự kiện mới
                      <Icon name="arrow_forward" size="xs" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default UserHistory

