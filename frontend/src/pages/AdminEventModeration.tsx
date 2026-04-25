import { Icon, StatCard, Pagination, StatusBadge, Loader } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventService } from '../services/eventService'
import { toast } from 'react-hot-toast'

const sidebarConfig = adminSidebarConfig

const recentActivities = [
  { icon: 'check', iconBg: 'bg-green-100', iconColor: 'text-green-600', title: 'Đã duyệt "Music Night"', by: 'Admin Nguyễn', time: '5 phút trước' },
  { icon: 'close', iconBg: 'bg-red-100', iconColor: 'text-red-600', title: 'Từ chối "Seminar Crypto"', by: 'Admin Trần', time: '12 phút trước' },
]

const AdminEventModeration = () => {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState({ pending: 0, processed: 0 })
  const [currentPage, setCurrentPage] = useState(0)
  const navigate = useNavigate()
  const filteredEvents = events
  const fetchEvents = useCallback(async (page = 0) => {
    try {
      setLoading(true)
      const data = await EventService.getAllAdminEvents(page, 5, ['pending'])
      setEvents(data.events.content)
      setPagination({
        totalPages: data.events.totalPages,
        totalElements: data.events.totalElements,
        size: data.events.size,
        number: data.events.number
      })
      setStats({
        pending: data.pendingCount,
        processed: data.processedCount
      })
    } catch (error) {
      console.error('Error fetching admin events:', error)
      toast.error('Không thể tải danh sách sự kiện')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents(currentPage)
  }, [currentPage, fetchEvents])


  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Kiểm duyệt Sự kiện" searchPlaceholder="Tìm tên sự kiện, nhà tổ chức..." />

      <div className="p-6 space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard label="Danh sách chờ duyệt" value={stats.pending} icon="pending_actions" iconBg="bg-primary/10" iconColor="text-primary" />
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-primary transition-all cursor-pointer" onClick={() => navigate('/admin/events')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                <Icon name="history" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lịch sử xử lý</p>
                <p className="text-2xl font-black text-slate-900">{stats.processed}</p>
              </div>
            </div>
            <Icon name="arrow_forward" className="text-slate-300 group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200">
            <h2 className="text-sm font-bold text-primary border-b-2 border-primary pb-4 px-2">Danh sách chờ duyệt ({stats.pending})</h2>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-visible p-1">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {['Thông tin Sự kiện', 'Nhà tổ chức', 'Thể loại', 'Ngày tạo', 'Ngày bắt đầu', 'Trạng thái'].map((h) => (
                    <th key={h} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                            <Loader className="w-8 h-8 text-primary" />
                            <p className="text-sm font-medium italic">Đang tải danh sách kiểm duyệt...</p>
                        </div>
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">Không có sự kiện nào.</td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr
                      key={evt.id}
                      onClick={() => navigate(`/admin/review/${evt.id}`)}
                      className="group hover:bg-white transition-all duration-300 cursor-pointer hover:scale-[1.01] relative hover:z-10 hover:shadow-xl"
                    >
                      <td className="p-4 relative">
                        {/* Hover Border Accent */}
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-r-full" />
                        
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0"
                            style={{ backgroundImage: `url('${evt.posterUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'}')` }}
                          />
                          <div className="flex-grow min-w-0 max-w-[250px]">
                            <p className="font-bold text-sm text-slate-900 leading-tight mb-0.5 whitespace-normal">{evt.title}</p>
                            <p className="text-xs text-slate-400 truncate">{evt.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold uppercase`}>
                            {evt.organizerName?.substring(0, 2) || '??'}
                          </div>
                          <p className="text-sm font-medium">{evt.organizerName || 'Người dùng hệ thống'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${!evt.categoryColor?.startsWith('#') ? (evt.categoryColor || 'bg-slate-100 text-slate-600') : 'text-white'}`}
                          style={evt.categoryColor?.startsWith('#') ? { backgroundColor: evt.categoryColor } : {}}
                        >
                          {evt.categoryName || 'Chưa phân loại'}
                        </span>
                      </td>

                      <td className="p-4 text-sm font-medium">
                        {evt.createdAt ? new Date(evt.createdAt).toLocaleDateString('vi-VN') : '---'}
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {evt.startTime ? new Date(evt.startTime).toLocaleDateString('vi-VN') : '---'}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={evt.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="p-4 bg-slate-50/30 border-t border-slate-200">
              <Pagination
                current={currentPage + 1}
                total={pagination?.totalPages || 1}
                onPageChange={(page) => setCurrentPage(page - 1)}
                label={`Hiển thị ${filteredEvents.length} trên ${pagination?.totalElements || 0} sự kiện`}
              />
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default AdminEventModeration
