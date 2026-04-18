import { useEffect, useState } from 'react'
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
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'upcoming', label: 'Sắp diễn ra' },
    { key: 'sold_out', label: 'Hết vé' },
    { key: 'ended', label: 'Đã kết thúc' },
    { key: 'rejected', label: 'Bị từ chối' }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 pb-0 overflow-x-auto scroller-hide">
          {STATUS_TABS.map((tab) => (
            <button 
              key={tab.key}
              onClick={() => {
                setSelectedStatus(tab.key)
                setCurrentPage(0)
              }}
              className={`text-sm font-bold pb-4 border-b-2 transition-all whitespace-nowrap ${
                selectedStatus === tab.key 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label} {selectedStatus === tab.key && `(${totalElements})`}
            </button>
          ))}
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
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <Icon name="event_busy" size="xl" className="mb-4 opacity-20" />
               <p className="font-bold">Chưa có sự kiện nào được tạo</p>
               <a href="/organizer/create" className="mt-4 text-primary hover:underline font-bold text-sm">Tạo sự kiện đầu tiên ngay</a>
            </div>
          ) : (
            events.map((evt) => {
               // Mocking sold/total logic for now if not in DTO, or use the one calculated in convertToSummaryDTO if added
               // For this implementation, we'll assume the DTO provides them or we use what's available
               return (
                <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-md hover:border-primary/20 transition-all group relative overflow-hidden">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-200">
                    <img src={evt.posterUrl} alt={evt.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => {
                      (e.target as any).src = 'https://via.placeholder.com/150?text=No+Image'
                    }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{evt.title}</h3>
                      <StatusBadge status={evt.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Icon name="calendar_today" size="sm" /> {new Date(evt.startTime).toLocaleDateString('vi-VN')}</span>
                      <span className="flex items-center gap-1"><Icon name="location_on" size="sm" /> {evt.location}</span>
                      <span className="flex items-center gap-2 px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600">
                        <span className={`w-2 h-2 rounded-full ${getCategoryColor(evt.categoryName)}`}></span>
                        {evt.categoryName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex gap-2">
                      <a 
                        href={`/organizer/events/${evt.id}/manage`} 
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm border border-slate-200"
                        title="Quản lý sự kiện"
                      >
                        <Icon name="manage_accounts" size="sm" />
                      </a>
                      <a href={`/events/${evt.id}`} target="_blank" className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm border border-slate-200" title="Xem trên trang khách">
                        <Icon name="visibility" size="sm" />
                      </a>
                    </div>
                  </div>
                </div>
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
