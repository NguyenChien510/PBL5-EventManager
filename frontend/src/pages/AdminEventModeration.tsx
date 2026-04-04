import { Icon, StatCard, Pagination, StatusBadge } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventService } from '../services/eventService'
import { toast } from 'react-hot-toast'

const sidebarConfig = adminSidebarConfig

const recentActivities = [
  { icon: 'check', iconBg: 'bg-green-100', iconColor: 'text-green-600', title: 'Đã duyệt "Music Night"', by: 'Admin Nguyễn', time: '5 phút trước' },
  { icon: 'close', iconBg: 'bg-red-100', iconColor: 'text-red-600', title: 'Từ chối "Seminar Crypto"', by: 'Admin Trần', time: '12 phút trước' },
  { icon: 'edit', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', title: 'Yêu cầu sửa "Startup Pitch"', by: 'Admin Nguyễn', time: '45 phút trước' },
]

const AdminEventModeration = () => {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Danh sách chờ duyệt')
  const navigate = useNavigate()

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await EventService.getAllAdminEvents()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching admin events:', error)
      toast.error('Không thể tải danh sách sự kiện')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const filteredEvents = events.filter(evt => {
    if (activeTab === 'Danh sách chờ duyệt') return evt.status === 'pending'
    if (activeTab === 'Đã duyệt') return evt.status === 'upcoming' || evt.status === 'rejected'
    if (activeTab === 'Đang chỉnh sửa') return evt.status === 'editing'
    return true
  })

  const stats = {
    pending: events.filter(e => e.status === 'pending').length,
    approved: events.filter(e => e.status === 'upcoming' || e.status === 'rejected').length,
    editing: events.filter(e => e.status === 'editing').length
  }
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Danh sách Kiểm duyệt" searchPlaceholder="Tìm tên sự kiện, nhà tổ chức..." />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Danh sách chờ duyệt" value={stats.pending} icon="pending_actions" iconBg="bg-primary/10" iconColor="text-primary" />
          <StatCard label="Đã duyệt" value={stats.approved} icon="check_circle" iconBg="bg-green-100" iconColor="text-green-600" />
          <StatCard label="Đang chỉnh sửa" value={stats.editing} icon="edit_note" iconBg="bg-blue-100" iconColor="text-blue-500" />
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-8">
              {[`Danh sách chờ duyệt (${stats.pending})`, `Đã duyệt (${stats.approved})`, `Đang chỉnh sửa (${stats.editing})`].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.split(' (')[0])}
                  className={`border-b-2 pb-4 px-2 text-sm font-bold transition-all ${
                    activeTab === tab.split(' (')[0]
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
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
                    <td colSpan={6} className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td>
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
                      className={`group hover:bg-slate-50/30 transition-colors cursor-pointer`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0"
                            style={{ backgroundImage: `url('${evt.posterUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'}')` }}
                          />
                          <div>
                            <p className="font-bold text-sm">{evt.title}</p>
                            <p className="text-xs text-slate-400 line-clamp-1">{evt.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold uppercase`}>
                            {evt.organizer?.fullName?.substring(0, 2) || '??'}
                          </div>
                          <p className="text-sm font-medium">{evt.organizer?.fullName || 'Người dùng hệ thống'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${evt.category?.color || 'bg-slate-100 text-slate-600'}`}>
                          {evt.category?.name || 'Chưa phân loại'}
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
              <Pagination current={1} total={1} label={`Hiển thị ${filteredEvents.length} sự kiện`} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* You can put some other global moderation stats or info here if needed */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                <Icon name="verified_user" size="lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Trung tâm Kiểm duyệt</h3>
                <p className="text-slate-500 text-sm mt-1">Chọn một sự kiện từ danh sách phía trên để xem chi tiết và thực hiện phê duyệt.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Icon name="history" className="text-primary" /> Hoạt động gần đây
            </h3>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              {recentActivities.map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${act.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon name={act.icon} className={act.iconColor} size="sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{act.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Bởi {act.by} • {act.time}</p>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 text-xs font-bold text-primary hover:underline">Xem tất cả nhật ký</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminEventModeration
