import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, StatusBadge, Pagination } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'
import { useAuthStore } from '../stores/useAuthStore'
import { EventService } from '../services/eventService'

const sidebarConfig = organizerSidebarConfig

interface DashboardStats {
  totalEvents: number
  totalTicketsSold: number
  totalRevenue: number
}

const OrganizerEventList = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState('all')

  const STATUS_TABS = [
    { key: 'all', label: 'Tất cả', icon: 'list_alt', color: 'bg-slate-900' },
    { key: 'pending', label: 'Chờ duyệt', icon: 'hourglass_empty', color: 'bg-amber-500' },
    { key: 'upcoming', label: 'Sắp diễn ra', icon: 'schedule', color: 'bg-blue-500' },
    { key: 'sold_out', label: 'Hết vé', icon: 'error_outline', color: 'bg-orange-500' },
    { key: 'ended', label: 'Đã kết thúc', icon: 'done_all', color: 'bg-emerald-500' },
    { key: 'rejected', label: 'Bị từ chối', icon: 'cancel', color: 'bg-red-500' }
  ]

  const fetchDashboardData = async (page: number, status?: string) => {
    setLoading(true)
    try {
      const data = await EventService.getOrganizerDashboard(page, 10, status)
      setStats({
        totalEvents: data.totalEvents,
        totalTicketsSold: data.totalTicketsSold,
        totalRevenue: data.totalRevenue
      })
      setEvents(data.events.content)
      setTotalPages(data.events.totalPages)
      setTotalElements(data.events.totalElements)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData(currentPage, selectedStatus)
  }, [currentPage, selectedStatus])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1)
  }

  const getCategoryColor = (name: string) => {
    const colors: Record<string, string> = {
      'Âm nhạc': 'bg-blue-500',
      'Workshop': 'bg-emerald-500',
      'Hội thảo': 'bg-purple-500',
      'Thể thao': 'bg-orange-500',
      'Nghệ thuật': 'bg-pink-500',
      'Ẩm thực': 'bg-yellow-500',
      'Công nghệ': 'bg-indigo-500'
    }
    return colors[name] || 'bg-slate-400'
  }

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader
        title="Quản lý Sự kiện"
        searchPlaceholder="Tìm sự kiện..."
        actions={
          <a href="/organizer/create" className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 flex items-center gap-2 shadow-sm">
            <Icon name="add" size="sm" /> Tạo mới
          </a>
        }
      />
      <div className="p-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-3xl p-6 border border-white/20 shadow-xl bg-gradient-to-br from-blue-500/10 to-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Icon name="event" size="lg" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Tổng sự kiện</p>
                <h3 className="text-3xl font-black text-slate-900">{stats?.totalEvents || 0}</h3>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-white/20 shadow-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Icon name="confirmation_number" size="lg" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Vé đã bán</p>
                <h3 className="text-3xl font-black text-slate-900">{stats?.totalTicketsSold || 0}</h3>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-white/20 shadow-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Icon name="payments" size="lg" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Tổng doanh thu</p>
                <h3 className="text-2xl font-black text-emerald-600">{formatCurrency(stats?.totalRevenue || 0)}</h3>
              </div>
            </div>
          </div>

          {/* Rejected Events Card */}
          <div className={`rounded-3xl p-6 border transition-all duration-500 ${events.some(e => e.status === 'REJECTED') ? 'bg-red-50 border-red-200 shadow-lg' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${events.some(e => e.status === 'REJECTED') ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <Icon name={events.some(e => e.status === 'REJECTED') ? 'report' : 'check_circle'} size="xs" />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${events.some(e => e.status === 'REJECTED') ? 'text-red-500' : 'text-slate-400'}`}>Bị từ chối</p>
              </div>
              {events.some(e => e.status === 'REJECTED') && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>

            {events.some(e => e.status === 'REJECTED') ? (
              <div className="space-y-2">
                {events.filter(e => e.status === 'REJECTED').slice(0, 2).map(e => (
                  <div key={e.id} className="flex items-center gap-2 bg-white/60 backdrop-blur-sm p-1.5 rounded-xl border border-red-100 group/item hover:bg-white transition-all cursor-pointer" onClick={() => setSelectedStatus('rejected')}>
                    <img src={e.posterUrl} className="w-7 h-7 rounded-lg object-cover shadow-sm" alt="" />
                    <p className="text-[10px] font-bold text-slate-700 truncate flex-1">{e.title}</p>
                    <Icon name="chevron_right" size="xs" className="text-red-300 group-hover/item:translate-x-0.5 transition-transform" />
                  </div>
                ))}
                {events.filter(e => e.status === 'REJECTED').length > 2 && (
                  <p className="text-[9px] text-red-400 font-bold text-center mt-1">+{events.filter(e => e.status === 'REJECTED').length - 2} sự kiện khác</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase italic">Không có sự kiện lỗi</p>
              </div>
            )}
          </div>
        </div>

        {/* Filter tabs - Redesigned to Box/Form style */}
        <div className="flex justify-start border-b border-slate-100 pb-4">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-1.5 flex flex-wrap md:flex-nowrap gap-1.5 w-full md:w-fit overflow-x-auto custom-scrollbar animate-in fade-in slide-in-from-left-6 duration-700">
            {STATUS_TABS.map((tab, idx) => (
              <button
                key={tab.key}
                onClick={() => {
                  setSelectedStatus(tab.key)
                  setCurrentPage(0)
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 md:flex-none animate-in fade-in slide-in-from-left-2 ${selectedStatus === tab.key
                  ? `${tab.color} text-white shadow-lg scale-105 z-10`
                  : 'text-slate-500 hover:bg-slate-50'
                  }`}
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
              >
                <Icon name={tab.icon} size="xs" className={selectedStatus === tab.key ? 'text-white' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {selectedStatus === tab.key && (
                  <span className="ml-1 px-2 py-0.5 bg-black/10 rounded-lg text-[10px]">
                    {totalElements}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="animate-spin mb-4 text-primary">
                <Icon name="sync" size="xl" />
              </div>
              <p className="font-bold">Đang tải danh sách sự kiện...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-3xl border border-slate-200">
              <Icon name="event_busy" size="xl" className="mb-4 opacity-20" />
              <p className="font-bold text-lg text-slate-500">Không có sự kiện</p>
            </div>
          ) : (
            events.map((evt, index) => {
              const progress = evt.totalTickets > 0 ? Math.min(Math.round((evt.ticketsSold / evt.totalTickets) * 100), 100) : 0;
              
              return (
                <Link
                  key={evt.id}
                  to={`/organizer/events/${evt.id}/manage`}
                  className="bg-white rounded-[2rem] border border-slate-100 p-4 flex flex-col sm:flex-row items-center gap-6 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:border-primary/30 hover:scale-[1.01] transition-all duration-500 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-6"
                  style={{
                    animationDelay: `${index * 60}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  {/* Visual Accent - RESTORED */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center" />

                  {/* Image Section - Slightly smaller */}
                  <div className="w-full sm:w-28 h-28 bg-slate-50 rounded-[1.5rem] overflow-hidden shrink-0 border border-slate-100 shadow-sm relative group-hover:shadow-md transition-all duration-500">
                    <img
                      src={evt.posterUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/200?text=Event' }}
                    />
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={evt.status} />
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{evt.categoryName}</span>
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-900 mb-3 group-hover:text-primary transition-colors tracking-tight truncate">
                      {evt.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Icon name="calendar_month" size="xs" className="text-slate-300" />
                        <span className="text-xs font-bold">
                          {new Date(evt.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Icon name="location_on" size="xs" className="text-slate-300 shrink-0" />
                        <span className="text-xs font-bold text-slate-500 leading-relaxed">
                          {evt.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Section - Wider and integrated */}
                  <div className="w-full sm:w-64 sm:pl-8 sm:border-l border-slate-100 flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vé đã bán</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-950 group-hover:text-primary transition-colors">
                          {evt.ticketsSold}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ {evt.totalTickets}</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <p className="text-[10px] text-right font-black text-primary uppercase tracking-tighter">{progress}% đã lấp đầy</p>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {totalPages > 1 && (
          <Pagination
            current={currentPage + 1}
            total={totalPages}
            onPageChange={handlePageChange}
            label={`Hiển thị ${events.length} trong ${totalElements} sự kiện`}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default OrganizerEventList
