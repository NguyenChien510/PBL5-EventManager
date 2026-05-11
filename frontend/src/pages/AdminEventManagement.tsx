import { Icon, StatCard, Pagination, StatusBadge, Loader } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventService } from '../services/eventService'
import { toast } from 'react-hot-toast'

const sidebarConfig = adminSidebarConfig

const AdminEventManagement = () => {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState({ upcoming: 0, ended: 0, rejected: 0 })
  const [currentPage, setCurrentPage] = useState(0)
  const [activeTab, setActiveTab] = useState('Tất cả')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const navigate = useNavigate()

  const getStatusesByTab = (tab: string) => {
    if (tab === 'Sắp tới') return ['upcoming']
    if (tab === 'Đã kết thúc') return ['ended']
    if (tab === 'Bị từ chối') return ['rejected']
    return ['upcoming', 'rejected', 'sold_out', 'ended'] // Default: All processed
  }

  const fetchEvents = useCallback(async (page = 0, tab = activeTab, keyword = debouncedSearchTerm) => {
    try {
      setLoading(true)
      const statuses = getStatusesByTab(tab)
      const data = await EventService.getAllAdminEvents(page, 5, statuses, keyword)
      setEvents(data.events.content)
      setPagination({
        totalPages: data.events.totalPages,
        totalElements: data.events.totalElements,
        size: data.events.size,
        number: data.events.number
      })
      setStats(prev => ({ ...prev, total: data.processedCount }))
    } catch (error) {
      console.error('Error fetching admin events:', error)
      toast.error('Không thể tải danh sách sự kiện')
    } finally {
      setLoading(false)
    }
  }, [activeTab, debouncedSearchTerm])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchEvents(currentPage, activeTab, debouncedSearchTerm)
  }, [currentPage, activeTab, debouncedSearchTerm, fetchEvents])

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader 
        title="Quản lý Sự kiện" 
        searchPlaceholder="Tìm tên sự kiện, nhà tổ chức..." 
        searchValue={searchTerm}
        onSearch={setSearchTerm}
      />

      <div className="p-6 space-y-6 animate-slide-up">
        {/* Simple Tabs for status filtering */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex gap-8">
            {['Tất cả', 'Sắp tới', 'Đã kết thúc', 'Bị từ chối'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(0);
                }}
                className={`border-b-2 pb-4 px-2 text-sm font-bold transition-all ${activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-primary'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm relative overflow-visible p-1">
          <div className="overflow-visible">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {['Sự kiện', 'Nhà tổ chức', 'Thể loại', 'Ngày tạo', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader className="w-8 h-8 text-primary" />
                            <p className="text-sm text-slate-400 font-medium italic">Đang tải danh sách sự kiện...</p>
                        </div>
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">Không có sự kiện nào.</td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr
                      key={evt.id}
                      className="group hover:bg-white transition-all duration-300 cursor-pointer hover:scale-[1.01] relative hover:z-10 hover:shadow-xl"
                      onClick={() => navigate(`/admin/event/manage/${evt.id}`)}
                    >
                      <td className="p-4 relative">
                        {/* Hover Border Accent */}
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-r-full" />
                        
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0 shadow-sm"
                            style={{ backgroundImage: `url('${evt.posterUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'}')` }}
                          />
                          <div className="flex-grow min-w-0 max-w-[250px]">
                            <p className="font-bold text-sm text-slate-900 leading-tight mb-0.5 whitespace-normal">{evt.title}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight truncate">{evt.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                            {evt.organizerName?.substring(0, 1) || 'U'}
                          </div>
                          <p className="text-xs font-bold text-slate-700">{evt.organizerName || 'System'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${!evt.categoryColor?.startsWith('#') ? (evt.categoryColor || 'bg-slate-100 text-slate-600') : 'text-white'}`}
                          style={evt.categoryColor?.startsWith('#') ? { backgroundColor: evt.categoryColor } : {}}
                        >
                          {evt.categoryName || 'General'}
                        </span>
                      </td>

                      <td className="p-4 text-[11px] font-bold text-slate-500">
                        {evt.createdAt ? new Date(evt.createdAt).toLocaleDateString('vi-VN') : '---'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge status={evt.status} />
                          {evt.status === 'rejected' && evt.rejectReason && (
                            <div 
                              className="group relative flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-50/50 px-2 py-0.5 rounded border border-red-100 max-w-[150px] cursor-help"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Icon name="info" size="xs" />
                              <span className="truncate italic font-medium text-red-400">Lý do: {evt.rejectReason}</span>
                              
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-56 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl z-[100] leading-relaxed font-medium animate-in fade-in zoom-in-95 duration-200">
                                <div className="text-red-400 font-black mb-1 uppercase tracking-widest text-[9px]">Lý do từ chối:</div>
                                {evt.rejectReason}
                                <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-800"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/event/manage/${evt.id}`);
                            }}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                            title="Xem chi tiết"
                        >
                            <Icon name="visibility" size="sm" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-4 py-2.5 bg-slate-50/30 border-t border-slate-200">
            <Pagination
              current={currentPage + 1}
              total={pagination?.totalPages || 1}
              onPageChange={(page) => setCurrentPage(page - 1)}
              label={`Hiển thị ${events.length} trên ${pagination?.totalElements || 0} sự kiện`}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminEventManagement
