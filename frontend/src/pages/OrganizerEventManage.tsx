import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout, PageHeader } from '../components/layout';
import { organizerSidebarConfig } from '../config/organizerSidebarConfig';
import { Icon } from '../components/ui';
import { EventService } from '../services/eventService';
import toast from 'react-hot-toast';

interface ManageStats {
  totalSeats: number;
  soldSeats: number;
  checkedInSeats: number;
  totalRevenue: number;
  salesByTicketType: Record<string, number>;
}

interface Attendee {
  ticketId: number;
  userName: string;
  userEmail: string;
  seatNumber: string;
  ticketTypeName: string;
  status: string;
  purchaseDate: string;
}

// Sub-components for Roster
const colorMap = {
  sky: 'bg-sky-50 border-sky-400 text-sky-700',
  red: 'bg-red-50 border-red-500 text-red-700',
  orange: 'bg-orange-50 border-orange-400 text-orange-700',
  emerald: 'bg-emerald-50 border-emerald-400 text-emerald-700',
  purple: 'bg-purple-50 border-purple-400 text-purple-700',
  indigo: 'bg-indigo-50 border-indigo-400 text-indigo-700',
}

const RosterCard = ({ shift }: any) => (
  <div className={`p-2 rounded-xl border mb-2 text-[10px] sm:text-xs shadow-sm ${colorMap[shift.color as keyof typeof colorMap]}`}>
    <p className="font-bold">{shift.title}</p>
    <p className="opacity-80">{shift.time}</p>
  </div>
)

const OrganizerEventManage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'finance' | 'staff' | 'feedback' | 'edit'>('overview');
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<ManageStats | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [guestViewMode, setGuestViewMode] = useState<'list' | 'seats'>('list');

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [eventData, statsData, attendeesData, seatsData] = await Promise.all([
        EventService.getEventById(id),
        EventService.getEventManageStats(id),
        EventService.getEventAttendees(id),
        EventService.getEventSeats(id)
      ]);
      setEvent(eventData);
      setStats(statsData);
      setAttendees(attendeesData);
      setSeats(seatsData || []);
    } catch (error) {
      console.error('Error fetching manage data:', error);
      toast.error('Không thể tải thông tin quản lý');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCheckIn = async (ticketId: number, currentStatus: string) => {
    const isCheckedIn = currentStatus === 'CHECKED_IN';
    try {
      await EventService.checkInTicket(ticketId, !isCheckedIn);
      toast.success(isCheckedIn ? 'Đã hủy check-in' : 'Check-in thành công');
      // Update local state
      setAttendees(prev => prev.map(a =>
        a.ticketId === ticketId ? { ...a, status: isCheckedIn ? 'PAID' : 'CHECKED_IN' } : a
      ));
      // Refresh stats
      const newStats = await EventService.getEventManageStats(id!);
      setStats(newStats);
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const filteredAttendees = attendees.filter(a =>
    a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.seatNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading && !event) {
    return (
      <DashboardLayout sidebarProps={organizerSidebarConfig}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin text-primary">
            <Icon name="sync" size="xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: 'visibility' },
    { id: 'guests', label: 'Khách mời', icon: 'how_to_reg' },
    { id: 'finance', label: 'Tài chính', icon: 'payments' },
    { id: 'staff', label: 'Nhân sự', icon: 'groups_3' },
    { id: 'feedback', label: 'Phản hồi', icon: 'reviews' },
    { id: 'edit', label: 'Cài đặt', icon: 'settings' }
  ];

  return (
    <DashboardLayout sidebarProps={organizerSidebarConfig}>
      <PageHeader
        title={event?.title || 'Quản lý sự kiện'}
        subtitle="Theo dõi và quản lý chi tiết sự kiện của bạn"
        backTo="/organizer/events"
      />

      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-wrap gap-2 overflow-x-auto scroller-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <Icon name={tab.icon} size="sm" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6 pt-4">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <img src={event?.posterUrl} alt={event?.title} className="w-full aspect-[3/4] object-cover" />
                    <div className="p-6 space-y-4">
                      <h3 className="text-xl font-black text-slate-900 leading-tight">{event?.title}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-500">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-primary">
                            <Icon name="calendar_today" size="sm" />
                          </div>
                          <div className="text-xs font-bold">
                            <p className="text-slate-400 uppercase tracking-tighter">Thời gian</p>
                            <p className="text-slate-900">{new Date(event?.startTime).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-emerald-500">
                            <Icon name="location_on" size="sm" />
                          </div>
                          <div className="text-xs font-bold">
                            <p className="text-slate-400 uppercase tracking-tighter">Địa điểm</p>
                            <p className="text-slate-900">{event?.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vé đã bán</p>
                      <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-slate-900">{stats?.soldSeats}</h4>
                        <span className="text-slate-400 font-bold text-sm">/ {stats?.totalSeats} mục tiêu</span>
                      </div>
                      <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${((stats?.soldSeats || 0) / (stats?.totalSeats || 1)) * 100}%` }} />
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Doanh thu hiện thực</p>
                      <h4 className="text-3xl font-black text-emerald-600">{formatCurrency(stats?.totalRevenue || 0)}</h4>
                      <p className="mt-2 text-[10px] text-slate-400 font-medium">Tỷ lệ lấp đầy: {Math.round(((stats?.soldSeats || 0) / (stats?.totalSeats || 1)) * 100)}%</p>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h5 className="font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-2">
                      <Icon name="description" size="sm" className="text-primary" /> Mô tả sự kiện
                    </h5>
                    <div className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line bg-slate-50/50 p-6 rounded-2xl border border-slate-100 italic">
                      {event?.description || 'Chưa có mô tả chi tiết cho sự kiện này.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng khách mời</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.soldSeats}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đã check-in</p>
                  <p className="text-2xl font-black text-emerald-600">{stats?.checkedInSeats}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Chưa đến</p>
                  <p className="text-2xl font-black text-orange-600">{(stats?.soldSeats || 0) - (stats?.checkedInSeats || 0)}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tỷ lệ tham gia</p>
                  <p className="text-2xl font-black text-purple-600">{Math.round(((stats?.checkedInSeats || 0) / (stats?.soldSeats || 1)) * 100)}%</p>
                </div>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                <button
                  onClick={() => setGuestViewMode('list')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${guestViewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                >
                  <Icon name="list" size="sm" /> Danh sách
                </button>
                <button
                  onClick={() => setGuestViewMode('seats')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${guestViewMode === 'seats' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                >
                  <Icon name="grid_view" size="sm" /> Sơ đồ ghế
                </button>
              </div>

              {guestViewMode === 'list' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-full aspect-square bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-x-0 h-1 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse" style={{ top: '20%' }} />
                      <Icon name="qr_code_2" className="text-white/20 text-7xl" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">Kích hoạt Camera</button>
                      </div>
                    </div>
                    <div className="w-full">
                      <input
                        type="text"
                        placeholder="Nhập mã vé hoặc email..."
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl text-center font-bold outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-400 font-medium" >Nhập mã vé thủ công để check-in nhanh</p>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center" >
                      <h4 className="font-bold" >Danh sách khách mời</h4>
                      <button className="p-2 text-slate-400 hover:text-primary transition-colors" >
                        <Icon name="download" size="sm" />
                      </button>
                    </div>
                    <div className="overflow-x-auto" >
                      <table className="w-full text-left" >
                        <thead>
                          <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100" >
                            <th className="p-4" >Khách mời</th>
                            <th className="p-4" >Loại vé / Ghế</th>
                            <th className="p-4" >Trạng thái</th>
                            <th className="p-4 text-center" >Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100" >
                          {filteredAttendees.map((a) => (
                            <tr key={a.ticketId} className="hover:bg-slate-50/50 transition-colors" >
                              <td className="p-4" >
                                <p className="font-bold text-slate-900 text-sm" >{a.userName}</p>
                                <p className="text-[10px] text-slate-500" >{a.userEmail}</p>
                              </td>
                              <td className="p-4" >
                                <span className="text-[10px] font-bold text-primary" >{a.ticketTypeName}</span>
                                <p className="text-xs font-bold text-slate-700" >{a.seatNumber}</p>
                              </td>
                              <td className="p-4" >
                                {a.status === 'CHECKED_IN' ? (
                                  <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase" >
                                    <Icon name="check_circle" size="xs" filled /> Đã đến
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold uppercase" >Chưa đến</span>
                                )}
                              </td>
                              <td className="p-4 text-center" >
                                <button
                                  onClick={() => handleCheckIn(a.ticketId, a.status)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${a.status === 'CHECKED_IN' ? 'bg-red-50 text-red-600' : 'bg-primary text-white shadow-md shadow-primary/20'
                                    }`}
                                >
                                  {a.status === 'CHECKED_IN' ? 'HỦY' : 'CHECK'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm" >
                  <div className="max-w-4xl mx-auto space-y-12" >
                    <div className="text-center space-y-2" >
                      <h4 className="text-xl font-black text-slate-900 tracking-tight" >Sơ đồ khán đài thực tế</h4>
                      <p className="text-sm text-slate-400 font-medium italic" >Chú giải: ( <span className="text-slate-800 font-black" >X</span> ) - Ghế đã có người • ( <span className="text-primary font-black" >●</span> ) - Ghế sẵn sàng</p>
                    </div>

                    {/* Stage */}
                    <div className="w-full h-3 bg-slate-200 rounded-full relative shadow-inner overflow-hidden mb-16" >
                      <div className="absolute inset-x-0 h-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                      <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]" >Sân Khấu / Stage</p>
                    </div>

                    <div className="flex flex-col items-center gap-3 overflow-x-auto pb-8" >
                      {Array.from(new Set(seats.map((s: any) => s.seatNumber.charAt(0)))).sort().map(row => (
                        <div key={row} className="flex gap-2" >
                          <div className="w-8 flex items-center justify-center text-[10px] font-black text-slate-300" >{row}</div>
                          <div className="flex gap-1.5 md:gap-2" >
                            {seats.filter((s: any) => s.seatNumber.startsWith(row))
                              .sort((a, b) => {
                                const numA = parseInt(a.seatNumber.substring(1));
                                const numB = parseInt(b.seatNumber.substring(1));
                                return numA - numB;
                              })
                              .map((seat: any) => {
                                const isOccupied = seat.status !== 'AVAILABLE';
                                return (
                                  <div
                                    key={seat.id}
                                    title={`${seat.seatNumber} - ${seat.ticketTypeName} - ${isOccupied ? 'Đã bán' : 'Trống'}`}
                                    className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${isOccupied
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : 'bg-primary/5 text-primary border border-primary/20 hover:scale-110 cursor-help'
                                      }`}
                                  >
                                    {isOccupied ? <Icon name="close" size="xs" /> : seat.seatNumber.substring(1)}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="text-lg font-bold">Biểu đồ Doanh thu (Ước tính)</h4>
                    <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                      <button className="px-3 py-1 text-[10px] font-bold bg-white shadow-sm rounded-lg">Ngày</button>
                      <button className="px-3 py-1 text-[10px] font-bold text-slate-400">Tuần</button>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 h-48">
                    {[40, 65, 52, 85, 75, 95, 80, 70, 88, 60, 45, 90].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-slate-50 rounded-t-lg relative group" style={{ height: '100%' }}>
                          <div className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all group-hover:bg-blue-600" style={{ height: `${h}%` }}>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {h}M
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">T{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-10">
                    <Icon name="account_balance_wallet" className="text-[160px]" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Doanh thu hiện thực</p>
                    <h4 className="text-4xl font-black mb-1">{formatCurrency(stats?.totalRevenue || 0)}</h4>
                    <p className="text-[10px] text-white/40 italic">Đã bao gồm VAT & Phí hệ thống</p>
                  </div>
                  <div className="relative z-10 space-y-3">
                    <button className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm">
                      <Icon name="file_download" size="sm" /> XUẤT BÁO CÁO
                    </button>
                    <p className="text-center text-[10px] text-white/60 font-medium">Báo cáo tài chính chi tiết phiên bản PDF</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 font-bold text-slate-900">Giao dịch gần nhất</div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="p-4">Mã GD</th>
                      <th className="p-4">Khách hàng</th>
                      <th className="p-4">Số tiền</th>
                      <th className="p-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {filteredAttendees.slice(0, 5).map((a, i) => (
                      <tr key={i} className="text-sm">
                        <td className="p-4 font-mono text-xs text-slate-400">TX-{1000 + i}</td>
                        <td className="p-4 text-slate-700">{a.userName}</td>
                        <td className="p-4 font-bold text-emerald-600">+{formatCurrency(250000)}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">Thành công</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <button className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50"><Icon name="chevron_left" /></button>
                  <span className="font-bold text-sm">Tuần: 23/10 - 29/10, 2024</span>
                  <button className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50"><Icon name="chevron_right" /></button>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20">LẬP LỊCH MỚI</button>
                  <button className="p-2 border border-slate-200 rounded-xl"><Icon name="more_vert" /></button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                  <div className="p-4 border-r border-slate-100 text-center">Nhân viên</div>
                  {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map(day => (
                    <div key={day} className="p-4 text-center border-r border-slate-100 last:border-r-0">{day}</div>
                  ))}
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { name: 'Hoàng Nguyễn', color: 'sky' },
                    { name: 'Lê Minh Tuấn', color: 'orange' },
                    { name: 'Quỳnh Anh', color: 'purple' }
                  ].map((staff, i) => (
                    <div key={i} className="grid grid-cols-8 hover:bg-slate-50/30 transition-colors group">
                      <div className="p-4 border-r border-slate-100 flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-center">{staff.name}</span>
                      </div>
                      {[0, 1, 2, 3, 4, 5, 6].map(d => (
                        <div key={d} className="p-2 border-r border-slate-100 last:border-r-0 min-h-[120px] relative">
                          {d === i || d === i + 2 ? (
                            <RosterCard shift={{ title: 'Sự kiện chính', time: '08:00 - 17:00', color: staff.color }} />
                          ) : d === 5 ? (
                            <div className="absolute inset-2 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center">
                              <Icon name="add" className="text-slate-200" />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                    <Icon name="warning" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Trùng lịch</p>
                    <p className="text-xl font-black text-slate-900">01 ca trực</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm col-span-2">
                  <Icon name="info" className="text-primary" />
                  <p className="text-xs text-slate-500 font-medium italic">Sử dụng tính năng Smart AI Fill để tự động tối ưu hóa lịch trình nhân sự dựa trên cường độ công việc.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-8">
                  <div className="w-24 h-24 bg-yellow-50 rounded-3xl flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-yellow-500">4.8</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => <Icon key={s} name="star" size="xs" className="text-yellow-400" filled />)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">Xếp hạng trung bình</h4>
                    <p className="text-xs text-slate-500 font-medium">Dựa trên 150+ đánh giá thực tế từ khách hàng đã tham gia.</p>
                  </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => (
                      <div key={star} className="flex items-center gap-4">
                        <span className="text-xs font-bold w-4">{star}</span>
                        <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${star === 5 ? 85 : star === 4 ? 10 : 5}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold w-8">{star === 5 ? '85%' : star === 4 ? '10%' : '5%'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Nguyễn Minh Khoa', rating: 5, date: '2 giờ trước', text: 'Chương trình diễn ra rất mướt, âm thanh ánh sáng tuyệt vời quá trời luôn!' },
                  { name: 'Lê Thu Trang', rating: 4, date: '1 ngày trước', text: 'Ok, phục vụ tốt nhưng check-in hơi đông, cần cải thiện tốc độ.' }
                ].map((review, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{review.name}</h4>
                          <span className="text-[10px] text-slate-400">{review.date}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, s) => <Icon key={s} name="star" size="xs" className={s < review.rating ? 'text-yellow-400' : 'text-slate-100'} filled />)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{review.text}</p>
                    <div className="flex gap-3">
                      <input type="text" placeholder="Gửi phản hồi cho khách..." className="flex-1 px-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 ring-primary/20" />
                      <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl shadow-lg">GỬI</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="bg-white p-20 rounded-3xl border-4 border-dashed border-slate-100 text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="construction" size="xl" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">Tính năng Đang hoàn thiện</h4>
              <p className="text-slate-500 max-w-md mx-auto">Chúng tôi đang đồng bộ hóa bộ công cụ chỉnh sửa để mang lại trải nghiệm tốt nhất. Trong thời gian này, bạn có thể xem thông tin tổng quát.</p>
              <div className="pt-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl"
                >
                  Quay lại Tổng quan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerEventManage;
