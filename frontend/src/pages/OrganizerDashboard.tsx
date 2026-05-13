import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon, StatCard, Loader, Avatar } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'
import { EventService } from '../services/eventService'
import { AuthService } from '../services/authService'
import { Link } from 'react-router-dom'

const sidebarConfig = organizerSidebarConfig

const OrganizerDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          setUserName(user.fullName || user.email.split('@')[0]);
          const [dashRes, commRes] = await Promise.all([
            EventService.getOrganizerDashboard(0, 100), // Fetch top 100 events to accurately rank filling rates
            EventService.getOrganizerComments(user.id)
          ]);
          setDashboardData(dashRes);
          setRecentComments(commRes || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const eventsList = dashboardData?.events?.content || [];
  const chartEvents = [...eventsList].map((evt: any) => ({
    ...evt,
    fillRate: evt.totalTickets > 0 ? Math.round((evt.ticketsSold / evt.totalTickets) * 100) : 0
  })).sort((a: any, b: any) => b.fillRate - a.fillRate).slice(0, 5);

  // Only count and show feedback that hasn't been replied to
  const pendingFeedbackList = recentComments.filter(c => !c.reply);
  const pendingFeedback = pendingFeedbackList.length;

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader className="w-12 h-12 text-primary" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PageHeader title="Bảng Điều Khiển" subtitle={`Chào mừng trở lại, ${userName}! 🚀`} />

          <div className="p-6 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-slide-down">
              {/* Stats: Total Events */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-200 flex items-center justify-between group hover:scale-[1.02] transition-all duration-500 cursor-default overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Tổng sự kiện</h4>
                  <p className="text-3xl font-black text-white tracking-tighter">{dashboardData?.totalEvents || 0}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-all shadow-lg">
                  <Icon name="event" size="md" />
                </div>
              </div>

              {/* Stats: Tickets Sold */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-[2.5rem] shadow-xl shadow-blue-200 flex items-center justify-between group hover:scale-[1.02] transition-all duration-500 cursor-default overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Vé đã bán</h4>
                  <p className="text-3xl font-black text-white tracking-tighter">{(dashboardData?.totalTicketsSold || 0).toLocaleString()}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-all shadow-lg">
                  <Icon name="confirmation_number" size="md" />
                </div>
              </div>

              {/* Stats: Revenue */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-[2.5rem] shadow-xl shadow-emerald-200 flex items-center justify-between group hover:scale-[1.02] transition-all duration-500 cursor-default overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1">Doanh thu</h4>
                  <p className="text-3xl font-black text-white tracking-tighter">{(dashboardData?.totalRevenue || 0).toLocaleString()}đ</p>
                </div>
                <div className="w-14 h-14 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-all shadow-lg">
                  <Icon name="payments" size="md" />
                </div>
              </div>

              {/* Stats: Feedback */}
              <div className="bg-gradient-to-br from-violet-600 to-violet-700 p-6 rounded-[2.5rem] shadow-xl shadow-violet-200 flex items-center justify-between group hover:scale-[1.02] transition-all duration-500 cursor-default overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black text-violet-100 uppercase tracking-widest mb-1">Feedback Mới</h4>
                  <p className="text-3xl font-black text-white tracking-tighter">{pendingFeedback}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-all shadow-lg">
                  <Icon name="chat_bubble_outline" size="md" />
                </div>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-slide-down" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>

              {/* Left Column (Main Data) */}
              <div className="lg:col-span-2 space-y-5">
                {/* Chart Box */}
                <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Tỷ lệ lấp đầy sự kiện</h3>
                      <p className="text-xs text-slate-500 font-medium">Top 5 sự kiện cao nhất</p>
                    </div>
                  </div>
                  {chartEvents.length > 0 ? (
                    <div className="flex items-end gap-6 h-56 mt-4">
                      {chartEvents.map((evt: any) => {
                        return (
                          <Link 
                            key={evt.id} 
                            to={`/organizer/events/${evt.id}/manage?tab=guests`} 
                            state={{ tab: 'guests' }} 
                            className="flex-1 h-full flex flex-col items-center justify-end gap-3 group relative cursor-pointer select-none no-underline" 
                            title={`${evt.ticketsSold} / ${evt.totalTickets} vé đã bán - Bấm để quản lý khách mời`}
                          >
                            <span className="text-xs font-black text-indigo-600 transition-transform group-hover:-translate-y-1 duration-300">
                              {evt.fillRate}%
                            </span>
                            <div className="w-16 sm:w-20 flex-1 bg-slate-50/80 rounded-t-xl relative overflow-hidden ring-1 ring-inset ring-slate-100 border-b-2 border-slate-200">
                              <div
                                className={`absolute bottom-0 w-full rounded-t-xl transition-all duration-1000 ease-out group-hover:brightness-110 group-hover:scale-x-[1.03] origin-bottom ${evt.fillRate === 0 ? 'bg-slate-200' : 'bg-gradient-to-t from-indigo-600 to-blue-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]'}`}
                                style={{ height: `${Math.max(evt.fillRate, 5)}%` }}
                              />
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-slate-600 font-bold text-center leading-tight px-1 w-full h-8 flex items-start justify-center group-hover:text-indigo-600 transition-colors">
                              <span className="line-clamp-2">{evt.title}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-56 flex flex-col items-center justify-center text-slate-300">
                      <Icon name="bar_chart" size="xl" className="mb-2" />
                      <p className="text-xs font-bold uppercase">Chưa có dữ liệu sự kiện</p>
                    </div>
                  )}
                </div>

                {/* Events Table Box */}
                <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden animate-slide-down" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Icon name="event" size="sm" />
                      </div>
                      Sự kiện sắp diễn ra
                    </h3>
                    <Link to="/organizer/events" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-full transition-colors">
                      Xem tất cả
                    </Link>
                  </div>

                  {eventsList.length > 0 ? (
                    <div className="overflow-hidden px-2 pb-2">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100">
                            {['Sự kiện', 'Ngày tổ chức', 'Vé đã bán', 'Trạng thái'].map((h) => (
                              <th key={h} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[...eventsList]
                            .filter((evt: any) => evt.status?.toLowerCase() === 'upcoming' || !evt.status)
                            .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                            .slice(0, 3)
                            .map((evt: any) => {
                              return (
                                <tr key={evt.id} className="hover:bg-slate-50/50 transition-all duration-300 group hover:scale-[1.01] origin-center relative z-0 hover:z-10 cursor-pointer">
                                  <td className="p-4 border-l-4 border-transparent group-hover:border-indigo-600 transition-all duration-300">
                                    <div className="flex items-center gap-3">
                                      <img src={evt.posterUrl || 'https://via.placeholder.com/150'} alt={evt.title} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200" />
                                      <div>
                                        <Link to={`/organizer/events/${evt.id}/manage`} className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors block line-clamp-1">
                                          {evt.title}
                                        </Link>
                                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{evt.location}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                                    {new Date(evt.startTime).toLocaleDateString('vi-VN')}
                                  </td>
                                  <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-indigo-500 rounded-full"
                                          style={{ width: evt.totalTickets ? `${(evt.ticketsSold / evt.totalTickets) * 100}%` : '0%' }}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-slate-700">{evt.ticketsSold}/{evt.totalTickets}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 whitespace-nowrap">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block bg-emerald-50 text-emerald-600 border border-emerald-200">
                                      {evt.status === 'UPCOMING' || !evt.status ? 'Sắp diễn ra' : evt.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400">
                      <p className="text-sm font-medium">Bạn chưa tạo sự kiện nào.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (Sidebar actions & feedback) */}
              <div className="space-y-5 animate-slide-down" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>


                {/* Quick Actions */}
                <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
                  <h3 className="font-black text-slate-900 flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Icon name="bolt" size="sm" />
                    </div>
                    Hành động nhanh
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/organizer/guests" className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[2rem] shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all group overflow-hidden relative">
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md shadow-sm border border-white/10 group-hover:rotate-12 transition-transform">
                        <Icon name="qr_code_scanner" className="text-white" size="md" />
                      </div>
                      <span className="text-[11px] font-black text-white uppercase tracking-widest text-center relative z-10">Quét mã QR</span>
                    </Link>
                    <Link to="/organizer/create" className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[2rem] shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all group overflow-hidden relative">
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md shadow-sm border border-white/10 group-hover:rotate-12 transition-transform">
                        <Icon name="add_circle" className="text-white" size="md" />
                      </div>
                      <span className="text-[11px] font-black text-white uppercase tracking-widest text-center relative z-10">Tạo sự kiện</span>
                    </Link>
                  </div>
                </div>

                {/* Feedback Box */}
                <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                      <Icon name="reviews" size="sm" />
                    </div>
                    Phản hồi mới
                  </h3>

                  <div className="space-y-3 flex-1">
                    {pendingFeedbackList.length > 0 ? (
                      pendingFeedbackList.slice(0, 4).map((comment, idx) => (
                        <div key={idx} className="p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 hover:border-violet-200 hover:bg-white hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 group">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={comment.user?.avatar}
                                alt={comment.user?.fullName}
                                size="md"
                                className="rounded-full ring-2 ring-white"
                                fallback={comment.user?.fullName?.substring(0, 2)}
                              />
                              <span className="text-sm font-black text-slate-900 group-hover:text-violet-600 transition-colors">{comment.user?.fullName || 'Người dùng'}</span>
                            </div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Icon key={i} name="star" size="sm" className={i < comment.rating ? "text-yellow-400" : "text-slate-200"} filled />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4 italic">"{comment.content}"</p>

                          {/* Mini Image Preview */}
                          {comment.images && comment.images.length > 0 && (
                            <div className="flex gap-2">
                              {comment.images.map((img: string, i: number) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt="Review"
                                  onClick={() => setSelectedImageUrl(img)}
                                  className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-700 py-6">
                        <Icon name="chat_bubble_outline" size="xl" className="mb-2 opacity-50" />
                        <p className="text-[15px] font-bold uppercase text-center">Chưa có phản hồi<br />từ khách hàng</p>
                      </div>
                    )}
                  </div>

                  {pendingFeedbackList.length > 0 && (
                    <Link to="/organizer/feedback" className="mt-6 w-full py-3 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl text-center hover:bg-slate-800 transition-colors">
                      Xem tất cả
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImageUrl && createPortal(
        <div
          className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImageUrl(null)}
        >
          <img
            src={selectedImageUrl}
            alt="Enlarged review"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl animate-scale-in object-contain"
          />
        </div>,
        document.body
      )}
    </DashboardLayout>
  )
}

export default OrganizerDashboard
