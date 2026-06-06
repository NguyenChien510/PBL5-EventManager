import { Pagination, StatusBadge, Loader, Icon } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventService } from '../services/eventService'
import { toast } from 'react-hot-toast'

const sidebarConfig = adminSidebarConfig



const AdminEventModeration = () => {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState({ pending: 0, processed: 0 })
  const [currentPage, setCurrentPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const navigate = useNavigate()
  const filteredEvents = events
  const fetchEvents = useCallback(async (page = 0, keyword = '') => {
    try {
      setLoading(true)
      const data = await EventService.getAllAdminEvents(page, 5, ['pending'], keyword)
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
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    fetchEvents(currentPage, debouncedSearchTerm)
  }, [currentPage, debouncedSearchTerm, fetchEvents])


  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader
        title="Kiểm duyệt Sự kiện"
        searchPlaceholder="Tìm tên sự kiện, nhà tổ chức..."
        searchValue={searchTerm}
        onSearch={(val) => {
          setSearchTerm(val)
          setCurrentPage(0)
        }}
      />

      <div className="p-6 space-y-6 animate-slide-up">


        {/* List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200">
            <h2 className="text-sm font-bold text-primary border-b-2 border-primary pb-4 px-2">Danh sách chờ duyệt ({stats.pending})</h2>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-visible p-12 text-center text-slate-400">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 text-primary" />
                <p className="text-sm font-medium italic text-slate-500">Đang tải danh sách kiểm duyệt...</p>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            searchTerm ? (
              /* Search Empty State */
              <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-[2rem] border border-slate-200/80 p-12 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping duration-1000 opacity-75" />
                  <div className="relative w-20 h-20 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 animate-in fade-in zoom-in duration-500">
                    <Icon name="search_off" size="xl" />
                  </div>
                </div>

                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-200/50 mb-3 inline-block">Không có kết quả</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Không tìm thấy sự kiện</h3>
                <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
                  Không tìm thấy sự kiện chờ duyệt nào khớp với từ khóa <span className="font-semibold text-slate-800">"{searchTerm}"</span>.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(0);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-md shadow-blue-500/20"
                >
                  <Icon name="close" size="sm" />
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : (
              /* Actual Empty State */
              <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-[2rem] border border-slate-200/80 p-12 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping duration-1000 opacity-75" />
                  <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-in fade-in zoom-in duration-500">
                    <Icon name="verified_user" size="xl" filled />
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[14px] font-black uppercase tracking-widest rounded-full border border-emerald-200/50 mb-3 inline-block">Đã hoàn thành kiểm duyệt</span>
                <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
                  Mọi sự kiện gửi lên đều đã được phê duyệt hoặc xử lý. Công việc tuyệt vời, hãy tiếp tục phát huy!
                </p>
                <button
                  onClick={() => fetchEvents(currentPage, debouncedSearchTerm)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-md shadow-blue-500/20"
                >
                  <Icon name="refresh" size="sm" />
                  Làm mới danh sách
                </button>
              </div>
            )
          ) : (
            /* Table */
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
                  {filteredEvents.map((evt) => (
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
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2.5 bg-slate-50/30 border-t border-slate-200">
                <Pagination
                  current={currentPage + 1}
                  total={pagination?.totalPages || 1}
                  onPageChange={(page) => setCurrentPage(page - 1)}
                  label={`Hiển thị ${filteredEvents.length} trên ${pagination?.totalElements || 0} sự kiện`}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}

export default AdminEventModeration
