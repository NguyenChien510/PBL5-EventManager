import { useState, useEffect } from 'react'
import { Pagination, Icon } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'
import { apiClient } from '../utils/axios'

const sidebarConfig = userSidebarConfig

const UserTickets = () => {
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Tất cả')

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await apiClient.get('/tickets/my')
        setTickets(response.data)
      } catch (err) {
        console.error('Error fetching tickets:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [])

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'Tất cả') return true
    if (activeTab === 'Sắp tới') return t.status === 'active' || t.status === 'pending'
    if (activeTab === 'Đã sử dụng') return t.status === 'used'
    if (activeTab === 'Đã hủy') return t.status === 'cancelled'
    return true
  })

  if (loading) {
    return (
      <DashboardLayout sidebarProps={sidebarConfig}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Vé của tôi" searchPlaceholder="Tìm vé bằng ID hoặc tên sự kiện..." />
      
      <div className="px-8 lg:px-12 py-8 space-y-10">
        {/* Stats & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng số vé</span>
              <span className="text-2xl font-black text-slate-900">{tickets.length.toString().padStart(2, '0')}</span>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sắp tới</span>
              <span className="text-2xl font-black text-primary">
                {tickets.filter(t => t.status === 'active' || t.status === 'pending').length.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl">
            {['Tất cả', 'Sắp tới', 'Đã sử dụng', 'Đã hủy'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-slate-100' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredTickets.length > 0 ? filteredTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              onClick={() => setSelectedTicket(ticket)}
              className="group bg-white rounded-[2.5rem] p-6 flex gap-6 border border-slate-100 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
            >
              {/* Left: Poster */}
              <div className="w-40 h-52 flex-shrink-0 rounded-[2rem] overflow-hidden relative shadow-lg">
                <img src={ticket.image} alt={ticket.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                   <div className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-[8px] font-black text-white uppercase text-center tracking-widest">
                     {ticket.type}
                   </div>
                </div>
              </div>

              {/* Right: Info */}
              <div className="flex-1 flex flex-col justify-between py-2">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-primary tracking-[0.2em]">{ticket.ticketId}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${
                      ticket.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {ticket.status === 'active' ? 'Sẵn sàng' : ticket.status === 'pending' ? 'Chờ xử lý' : 'Đã sử dụng'}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-primary transition-colors">
                    {ticket.title}
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Icon name="calendar_today" size="sm" className="opacity-40" />
                      <span className="text-xs font-medium">{ticket.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <Icon name="location_on" size="sm" className="opacity-40" />
                      <span className="text-xs font-medium truncate max-w-[200px]">{ticket.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <Icon name="event_seat" size="sm" className="opacity-40" />
                      <span className="text-xs font-bold text-slate-700">{ticket.seat}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-100">
                   <div className="flex items-center gap-2">
                      <Icon name="qr_code_2" size="sm" className="text-primary" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết vé →</span>
                   </div>
                </div>
              </div>

              {/* Decorative Cutout */}
              <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background-light rounded-full -translate-y-1/2 border-l border-slate-100" />
              <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background-light rounded-full -translate-y-1/2 border-r border-slate-100" />
            </div>
          )) : (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
              <Icon name="confirmation_number" className="text-slate-200 text-6xl mb-4" />
              <p className="text-slate-400 font-medium">Không tìm thấy vé nào phù hợp.</p>
            </div>
          )}
        </div>

        {filteredTickets.length > 0 && (
          <Pagination current={1} total={1} label={`Đang hiển thị ${filteredTickets.length} vé`} />
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 pb-0 flex justify-between items-center">
              <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase">Thông tin vé điện tử</span>
              <button onClick={() => setSelectedTicket(null)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-50 transition-colors">
                <Icon name="close" />
              </button>
            </div>

            <div className="p-8 pt-6 space-y-8">
              {/* Event Summary */}
              <div className="flex gap-6">
                <img src={selectedTicket.image} className="w-24 h-32 rounded-2xl object-cover shadow-md" />
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{selectedTicket.title}</h3>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">{selectedTicket.ticketId}</p>
                </div>
              </div>

              {/* QR Section */}
              <div className="bg-slate-50 rounded-[2.5rem] p-8 text-center border border-slate-100 relative">
                <div className="bg-white p-6 rounded-3xl inline-block shadow-inner border border-slate-100 mb-6">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedTicket.ticketId}`} 
                    alt="QR Code"
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-sm font-black text-slate-900 mb-1 tracking-tight">VÉ HỢP LỆ</p>
                <p className="text-[10px] font-medium text-slate-400">Xuất trình mã này tại quầy soát vé để check-in</p>
                
                {/* Side Cutouts */}
                <div className="absolute top-1/2 -right-4 w-8 h-8 bg-white rounded-full -translate-y-1/2" />
                <div className="absolute top-1/2 -left-4 w-8 h-8 bg-white rounded-full -translate-y-1/2" />
              </div>

              {/* Detailed Info Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                  <p className="text-xs font-black text-slate-800">{selectedTicket.date}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Loại vé</p>
                  <p className="text-xs font-black text-slate-800">{selectedTicket.type}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vị trí ngồi</p>
                  <p className="text-xs font-black text-slate-800">{selectedTicket.seat}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Địa điểm</p>
                  <p className="text-xs font-black text-slate-800 leading-relaxed">{selectedTicket.location}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button className="flex-1 py-4 bg-primary text-white text-xs font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                  <Icon name="download" size="sm" /> TẢI VỀ PDF
                </button>
                <button className="flex-1 py-4 bg-slate-100 text-slate-900 text-xs font-black rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                  <Icon name="share" size="sm" /> CHIA SẺ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default UserTickets
