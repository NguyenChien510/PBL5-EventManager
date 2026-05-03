import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, StatusBadge, Pagination, Loader, SearchInput } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'
import { useAuthStore } from '../stores/useAuthStore'
import { EventService } from '../services/eventService'

const sidebarConfig = organizerSidebarConfig

interface DashboardStats {
  totalEvents: number
  totalTicketsSold: number
  totalRevenue: number
  rejectedCount: number
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
  const [searchTerm, setSearchTerm] = useState('')

  const STATUS_TABS = [
    { key: 'all', label: 'Tất cả', icon: 'list_alt', color: 'bg-slate-900' },
    { key: 'pending', label: 'Chờ duyệt', icon: 'hourglass_empty', color: 'bg-amber-500' },
    { key: 'upcoming', label: 'Sắp diễn ra', icon: 'schedule', color: 'bg-blue-500' },
    { key: 'sold_out', label: 'Hết vé', icon: 'error_outline', color: 'bg-orange-500' },
    { key: 'ended', label: 'Đã kết thúc', icon: 'done_all', color: 'bg-emerald-500' },
    { key: 'rejected', label: 'Bị từ chối', icon: 'cancel', color: 'bg-red-500' }
  ]

  const fetchDashboardData = async (page: number, status?: string, keyword?: string) => {
    setLoading(true)
    try {
      const data = await EventService.getOrganizerDashboard(page, 3, status, keyword)
      setStats({
        totalEvents: data.totalEvents,
        totalTicketsSold: data.totalTicketsSold,
        totalRevenue: data.totalRevenue,
        rejectedCount: data.rejectedCount
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
    fetchDashboardData(currentPage, selectedStatus, searchTerm)
  }, [currentPage, selectedStatus, searchTerm])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <PageHeader
          title="Quản lý Sự kiện"
        />

        <div className="px-8 py-5 space-y-5">
          {/* Filter tabs and Search/Action */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-3 w-full xl:w-auto order-2 xl:order-1">
              <SearchInput
                placeholder="Tìm sự kiện..."
                value={searchTerm}
                onChange={handleSearch}
                className="flex-1 xl:w-80 h-12 shadow-sm"
              />
              <a
                href="/organizer/create"
                className="px-6 h-12 bg-gradient-to-r from-primary to-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.5)] hover:translate-y-[-2px] transition-all duration-300 flex items-center gap-3 shrink-0 group/btn select-none cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/btn:scale-110 transition-transform duration-500">
                  <Icon name="add" size="xs" />
                </div>
                <span>Tạo mới</span>
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-1.5 flex flex-wrap md:flex-nowrap gap-1.5 w-full md:w-fit overflow-x-auto custom-scrollbar order-1 xl:order-2">
              {STATUS_TABS.map((tab, idx) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setSelectedStatus(tab.key)
                    setCurrentPage(0)
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 md:flex-none ${selectedStatus === tab.key
                    ? `${tab.color} text-white shadow-lg scale-105 z-10`
                    : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  <Icon name={tab.icon} size="xs" className={selectedStatus === tab.key ? 'text-white' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 gap-4 animate-fade-in min-h-[500px] items-start" style={{ animationDelay: '400ms' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader className="w-12 h-12 text-primary" />
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
                    className="bg-white rounded-[2rem] border border-slate-100 p-4 flex flex-col sm:flex-row items-center gap-6 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:border-primary/30 hover:scale-[1.01] transition-all duration-500 group relative overflow-hidden animate-fade-in"
                    style={{
                      animationDelay: `${(index * 60) + 450}ms`
                    }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center" />

                    <div className="w-full sm:w-28 h-28 bg-slate-50 rounded-[1.5rem] overflow-hidden shrink-0 border border-slate-100 shadow-sm relative group-hover:shadow-md transition-all duration-500">
                      <img
                        src={evt.posterUrl}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/200?text=Event' }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={evt.status} />
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{evt.categoryName}</span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-primary transition-colors tracking-tight truncate">
                        {evt.title}
                      </h3>

                      {evt.status === 'rejected' && evt.rejectReason && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-pulse">
                          <Icon name="info" size="xs" className="text-red-500" />
                          <p className="text-[15px] text-red-600 font-bold leading-none">
                            Lý do: {evt.rejectReason}
                          </p>
                        </div>
                      )}

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

                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                        <div
                          className="h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                    </div>
                  </Link>
                )
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
              <Pagination
                current={currentPage + 1}
                total={totalPages}
                onPageChange={handlePageChange}
                label={`Hiển thị ${events.length} trong ${totalElements} sự kiện`}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )

}

export default OrganizerEventList

