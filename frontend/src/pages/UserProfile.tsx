import { useState, useEffect } from 'react'
import { Icon, Avatar } from '../components/ui'
import { DashboardLayout } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { apiClient } from '../utils/axios'

const sidebarConfig = userSidebarConfig

const UserProfile = () => {
  const { user, setUser } = useAuthStore()
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Tất cả')

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'Tất cả') return true
    if (activeTab === 'Sắp tới') return t.status === 'active' || t.status === 'pending'
    if (activeTab === 'Đã sử dụng') return t.status === 'used'
    if (activeTab === 'Đã hủy') return t.status === 'cancelled'
    return true
  })

  const groupedTickets = filteredTickets.reduce((groups, ticket) => {
    const orderId = ticket.orderId || 'N/A'
    if (!groups[orderId]) groups[orderId] = []
    groups[orderId].push(ticket)
    return groups
  }, {} as Record<string, any[]>)

  const sortedOrderIds = Object.keys(groupedTickets).sort((a, b) => b.localeCompare(a))

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, ticketsRes] = await Promise.all([
          apiClient.get('/users/me'),
          apiClient.get('/tickets/my')
        ])
        setUser(userRes.data)
        setTickets(ticketsRes.data)
      } catch (err) {
        console.error('Error fetching profile data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getMembershipTier = (pts: number) => {
    if (pts >= 15000) return { label: 'Hạng Kim Cương', icon: 'diamond' }
    if (pts >= 5000) return { label: 'Hạng Vàng', icon: 'military_tech' }
    return { label: 'Hạng Chuẩn', icon: 'stars' }
  }

  const tier = getMembershipTier(user?.loyaltyPoints || 0)

  useEffect(() => {
    if (selectedTicket) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedTicket])

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
    <>
      <DashboardLayout sidebarProps={sidebarConfig}>
        {/* Header */}
        <header className="h-20 px-8 lg:px-12 flex items-center justify-between sticky top-0 z-40 bg-background-light/90 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-800">Hồ sơ người dùng</h2>
          <div className="flex items-center gap-5">
            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
              <Icon name="search" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary relative">
              <Icon name="notifications" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <Avatar src={user?.avatar || sidebarConfig.user.avatar} size="md" className="rounded-lg ring-2 ring-white shadow-sm" />
              <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">{user?.fullName}</span>
            </div>
          </div>
        </header>

        <div className="px-8 lg:px-12 pb-12 space-y-6">
          {/* Profile Card + Points */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
            {/* Profile Info */}
            <div className="xl:col-span-7 bg-white rounded-3xl p-4 lg:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-50 group-hover:bg-primary/5 transition-colors duration-700" />
              
              <div className="relative shrink-0">
                <Avatar src={user?.avatar || sidebarConfig.user.avatar} size="xl" className="w-24 h-24 lg:w-28 lg:h-28 rounded-[1.5rem] shadow-xl border-4 border-white ring-1 ring-slate-100 object-cover" />
                <div className="absolute -bottom-1 -right-1 bg-primary p-1.5 rounded-xl shadow-lg border-2 border-white animate-bounce-subtle">
                  <Icon name="verified" className="text-white text-[10px]" filled />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between h-full text-center md:text-left py-2">
                <div>
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{user?.fullName}</h3>
                    <div className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-full border border-primary/20 uppercase tracking-widest flex items-center gap-1.5">
                      <Icon name={tier.icon} size="sm" className="scale-75" /> {tier.label}
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mb-6 flex items-center justify-center md:justify-start gap-4">
                    <span className="flex items-center gap-1.5"><Icon name="mail" size="sm" className="opacity-60" /> {user?.email}</span>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full hidden md:block" />
                    <span className="flex items-center gap-1.5"><Icon name="calendar_today" size="sm" className="opacity-60" /> Tham gia {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</span>
                  </p>
                </div>

              </div>

              <button className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm hidden md:flex items-center gap-2 group-hover:scale-105">
                <Icon name="settings" size="sm" />
              </button>
            </div>

            {/* Points Card */}
            <div className="xl:col-span-5 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-3xl p-4 lg:p-5 text-white relative overflow-hidden shadow-xl shadow-primary/20 flex flex-col justify-between min-h-[180px] group">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 p-6 opacity-10 scale-125 rotate-12 transition-transform group-hover:scale-150 duration-1000">
                <Icon name="loyalty" className="text-white text-[80px]" />
              </div>
              
              <div className="relative z-10">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Điểm thưởng hiện có</p>
                <div className="flex items-baseline gap-1.5">
                  <h4 className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">{(user?.loyaltyPoints || 0).toLocaleString()}</h4>
                  <span className="text-sm font-bold text-white/50 uppercase tracking-widest">pts</span>
                </div>
              </div>

              <div className="relative z-10 space-y-6">
                <Link to="/vouchers" className="w-full py-4 bg-white text-primary text-xs font-black rounded-2xl shadow-xl hover:bg-slate-50 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-[0.15em] flex items-center justify-center gap-2">
                  ĐỔI QUÀ NGAY <Icon name="arrow_forward" size="sm" />
                </Link>
              </div>
            </div>
          </section>

          {/* Tickets */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Vé của tôi</h3>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase">
                  {tickets.length}
                </span>
              </div>
              
              <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl self-start">
                {['Tất cả', 'Sắp tới', 'Đã sử dụng', 'Đã hủy'].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      activeTab === tab 
                      ? 'bg-white text-primary shadow-sm ring-1 ring-slate-100' 
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {sortedOrderIds.length > 0 ? sortedOrderIds.map((orderId) => {
                const ticketsInOrder = groupedTickets[orderId]
                const firstTicket = ticketsInOrder[0]
                const seatList = ticketsInOrder.map(t => t.seat).join(', ')
                
                return (
                  <div 
                    key={orderId} 
                    onClick={() => setSelectedTicket(ticketsInOrder)}
                    className="group bg-white rounded-[2.5rem] p-5 flex flex-col md:flex-row gap-8 border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
                  >
                    {/* Left: Poster & Badges */}
                    <div className="w-full md:w-32 h-44 flex-shrink-0 rounded-3xl overflow-hidden relative shadow-lg">
                      <img src={firstTicket.image} alt={firstTicket.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-[9px] font-black text-white rounded-full uppercase tracking-widest">
                          {ticketsInOrder.length} Vé
                        </span>
                      </div>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Đơn hàng #{orderId}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            firstTicket.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {firstTicket.status === 'active' ? 'Sẵn sàng' : 'Chờ xử lý'}
                          </span>
                        </div>
                        
                        <h4 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-primary transition-colors">
                          {firstTicket.title}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                          <div className="flex items-center gap-3 text-slate-500">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                              <Icon name="calendar_today" size="sm" className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</p>
                              <p className="text-[10px] font-black text-slate-800">{firstTicket.date}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-slate-500">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                              <Icon name="event_seat" size="sm" className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Vị trí ghế</p>
                              <p className="text-[10px] font-black text-primary truncate max-w-[150px]">{seatList}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-slate-500 md:col-span-2">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                              <Icon name="location_on" size="sm" className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Địa điểm</p>
                              <p className="text-[10px] font-bold text-slate-700 truncate max-w-[350px]">{firstTicket.location}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-5 mt-4 border-t border-dashed border-slate-100">
                         <div className="flex items-center gap-3 group/btn">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover/btn:bg-primary transition-colors">
                              <Icon name="qr_code_2" size="sm" className="text-primary group-hover/btn:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/btn:text-primary">Xem tất cả mã vé →</span>
                         </div>
                      </div>
                    </div>

                    {/* Aesthetic Cutouts */}
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-background-light rounded-full -translate-y-1/2 border-l border-slate-100" />
                    <div className="hidden md:block absolute top-1/2 -left-3 w-6 h-6 bg-background-light rounded-full -translate-y-1/2 border-r border-slate-100" />
                  </div>
                )
              }) : (
                <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                  <Icon name="confirmation_number" className="text-slate-200 text-6xl mb-4" />
                  <p className="text-slate-400 font-medium">Bạn chưa mua vé nào. Khám phá các sự kiện ngay!</p>
                  <Link to="/explore" className="mt-4 inline-block text-primary font-bold hover:underline">Khám phá ngay</Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </DashboardLayout>

      {/* Ticket Detail Modal - Moved outside DashboardLayout to cover Sidebar */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 transition-opacity" onClick={() => setSelectedTicket(null)} />
          
          <div className="relative bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header with Close Button */}
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white backdrop-blur-sm transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <div className="max-h-[85vh] overflow-y-auto overflow-x-hidden">
              {/* Simplified Event Header */}
              <div className="relative h-40">
                <img 
                  src={Array.isArray(selectedTicket) ? selectedTicket[0].image : selectedTicket.image} 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-xl font-bold text-white leading-tight">
                    {Array.isArray(selectedTicket) ? selectedTicket[0].title : selectedTicket.title}
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* QR Section */}
                <div className="text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Mã QR Đơn Hàng</p>
                  <div className="inline-block p-4 bg-white rounded-xl shadow-sm mb-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${Array.isArray(selectedTicket) ? selectedTicket[0].orderQrCode : selectedTicket.orderQrCode}`} 
                      alt="Order QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-600 bg-slate-200/50 py-1 px-3 rounded-full inline-block">
                    {Array.isArray(selectedTicket) ? selectedTicket[0].orderQrCode : selectedTicket.orderQrCode}
                  </p>
                </div>

                {/* Ticket List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Danh sách vé</h4>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {Array.isArray(selectedTicket) ? selectedTicket.length : 1} vé
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(Array.isArray(selectedTicket) ? selectedTicket : [selectedTicket]).map((ticket: any, index: number) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary font-bold text-xs shadow-sm border border-slate-100">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{ticket.seat}</p>
                            <p className="text-[9px] font-medium text-slate-500 uppercase">{ticket.type}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">{ticket.ticketId}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simplified Actions */}
                <button className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors">
                  Tải PDF đơn hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserProfile
