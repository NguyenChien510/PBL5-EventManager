import React, { useState, useEffect } from 'react';
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
  // New state for Finance tab
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const getWeekRangeString = (date: Date) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(start.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${start.toLocaleDateString('vi-VN', options)} - ${end.toLocaleDateString('vi-VN', options)}, ${start.getFullYear()}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const weeklyMockData = [
    { day: 'T2', val: 45 },
    { day: 'T3', val: 78 },
    { day: 'T4', val: 56 },
    { day: 'T5', val: 89 },
    { day: 'T6', val: 32 },
    { day: 'T7', val: 120 },
    { day: 'CN', val: 110 },
  ];

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiPlanResult, setAiPlanResult] = useState<any>(null);

  const generateAIPlan = () => {
    setIsGeneratingPlan(true);
    setTimeout(() => {
      setAiPlanResult({
        tasks: [
          { id: 1, text: "Chốt danh sách nhà cung cấp F&B", priority: 'High' },
          { id: 2, text: "Gửi thư mời điện tử & QR Code cho khách", priority: 'High' },
          { id: 3, text: "Kiểm duyệt kịch bản âm thanh ánh sáng", priority: 'Medium' },
          { id: 4, text: "Chuẩn bị quà tặng lưu niệm (Gift box)", priority: 'Low' },
          { id: 5, text: "Xây dựng layout mặt bằng bố trí", priority: 'Medium' }
        ],
        tools: [
          { name: "Màn hình LED P2.5", qty: 1, unit: "Bộ" },
          { name: "Hệ thống Mic không dây", qty: 6, unit: "Cái" },
          { name: "Standee đón khách", qty: 12, unit: "Tấm" },
          { name: "Thẻ đeo nhân sự", qty: 30, unit: "Bộ" }
        ],
        budgetSections: [
          {
            id: 'III',
            title: 'Dàn dựng và trang trí',
            total: 450000000,
            subSections: [
              {
                id: 'A',
                title: 'Khu vực đón khách',
                items: [
                  { stt: 1, item: 'Cổng chào', unit: 'chiếc', qty: 1, unitPrice: 25000000, remarks: 'Thiết kế theo theme sự kiện' },
                  { stt: 2, item: 'Standee', unit: 'chiếc', qty: 10, unitPrice: 500000, remarks: 'Thiết kế theo theme sự kiện' },
                  { stt: 3, item: 'Banner dọc', unit: 'chiếc', qty: 10, unitPrice: 300000, remarks: 'Thiết kế theo theme sự kiện' },
                  { stt: 4, item: 'Backdrop chụp hình', unit: 'chiếc', qty: 1, unitPrice: 15000000, remarks: 'Thiết kế theo theme sự kiện, platform và đèn trang trí' },
                  { stt: 5, item: 'Cánh cửa thần kỳ', unit: 'bộ', qty: 5, unitPrice: 20000000, remarks: 'Cánh cửa lớn thiết kế kiểu hightech và màn hình' },
                ]
              },
              {
                id: 'B',
                title: 'Khu vực phòng tiệc',
                items: [
                  { stt: 6, item: 'Sân khấu', unit: 'gói', qty: 1, unitPrice: 250000000, remarks: 'Sân khấu lớn và hoàn thiện bề mặt. Bậc lên xuống sân khấu. Thiết kế trang trí vách sân khấu' },
                  { stt: 7, item: 'Hệ thống giàn Truss', unit: 'gói', qty: 1, unitPrice: 50000000, remarks: 'Cho sân khấu, màn LED nhiều lớp, hệ thống ATAS' },
                  { stt: 8, item: 'Bục phát biểu và logo', unit: 'gói', qty: 1, unitPrice: 2000000, remarks: '' },
                ]
              }
            ]
          },
          {
            id: 'IV',
            title: 'Thiết bị',
            total: 320000000,
            subSections: [
              {
                id: 'A',
                title: 'Hệ thống âm thanh ánh sáng',
                items: [
                  { stt: 1, item: 'Hệ thống ATAS', unit: 'gói', qty: 1, unitPrice: 60000000, remarks: '' },
                  { stt: 2, item: 'Màn LED', unit: 'gói', qty: 1, unitPrice: 180000000, remarks: 'Hệ thống màn LED lớn nhiều lớp' },
                  { stt: 3, item: 'Hệ thống trượt màn LED', unit: 'gói', qty: 1, unitPrice: 20000000, remarks: 'Có thể trượt để mở màn LED' },
                ]
              }
            ]
          }
        ]
      });
      setIsGeneratingPlan(false);
    }, 3500);
  };

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

  type EditType = 'title' | 'info' | 'description' | 'schedule' | null;
  const [activeEditType, setActiveEditType] = useState<EditType>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editSchedules, setEditSchedules] = useState<any[]>([]);

  useEffect(() => {
    if (event) {
      setEditForm({
        title: event.title,
        location: event.location,
        startTime: event.startTime,
        description: event.description,
        categoryId: event.categoryId
      });
      setEditSchedules(event.schedules || []);
    }
  }, [event]);



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

  const formatTime = (timeInput: any) => {
    if (!timeInput) return '??:??';
    if (typeof timeInput === 'string') return timeInput.substring(0, 5);
    if (Array.isArray(timeInput) && timeInput.length >= 2) {
      const h = String(timeInput[0]).padStart(2, '0');
      const m = String(timeInput[1]).padStart(2, '0');
      return `${h}:${m}`;
    }
    return '??:??';
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
    { id: 'feedback', label: 'Phản hồi', icon: 'reviews' }
  ];


  const handleUpdateEvent = async () => {
    try {
      // Mock update
      const updatedEvent = { ...event, ...editForm, schedules: editSchedules };
      setEvent(updatedEvent);
      toast.success('Cập nhật thành công');
      setActiveEditType(null);
    } catch (error) {
      toast.error('Cập nhật thất bại');
    }
  };

  const CleanEditButton = ({ onClick, title }: { onClick: () => void, title: string }) => (
    <button
      onClick={onClick}
      className="p-1 text-slate-300 hover:text-primary hover:bg-slate-100 rounded-md transition-all group/edit"
      title={title}
    >
      <Icon name="edit_square" size="xs" className="group-hover/edit:scale-110" />
    </button>
  );



  return (
    <DashboardLayout sidebarProps={organizerSidebarConfig}>
      <div className="min-h-screen bg-slate-50/50" style={{ scrollbarGutter: 'stable' }}>
        <PageHeader
          title={event?.title || 'Quản lý sự kiện'}
          subtitle="Theo dõi và quản lý chi tiết sự kiện của bạn"
          backTo="/organizer/events"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-10">
          {/* Tab Navigation - Fixed structure with sticky behavior */}
          <div className="sticky top-[72px] z-40 py-4 bg-slate-50/50 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-1.5 grid grid-cols-3 lg:grid-cols-6 gap-1.5 w-full">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  <Icon name={tab.icon} size="sm" />
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6 pt-4">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Event Hero Banner */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col lg:flex-row group">
                  <div className="lg:w-1/2 relative overflow-hidden min-h-[300px] lg:min-h-0">
                    <img src={event?.posterUrl} alt={event?.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                  </div>

                  <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center space-y-6 bg-gradient-to-br from-white via-white to-slate-50 relative z-10">
                    <div className="flex justify-between items-start">
                      <h3 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight flex items-center gap-3">
                        {event?.title}
                        <CleanEditButton onClick={() => setActiveEditType('title')} title="Đổi tên sự kiện" />
                      </h3>

                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border"
                        style={{
                          backgroundColor: `${event?.category?.color || '#3b82f6'}15`,
                          borderColor: `${event?.category?.color || '#3b82f6'}30`,
                          color: event?.category?.color || '#3b82f6'
                        }}
                      >
                        <Icon name={event?.category?.icon || 'event'} size="sm" />
                        {event?.category?.name || event?.categoryName || 'Sự kiện'}
                      </span>
                    </div>
                    <div className="space-y-5 relative group/info">
                      <div className="absolute -right-2 top-0">
                        <CleanEditButton onClick={() => setActiveEditType('info')} title="Sửa thời gian & địa điểm" />
                      </div>

                      <div className="flex items-center gap-4 group/item">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                          <Icon name="calendar_today" size="sm" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian tổ chức</p>
                          <p className="text-slate-900 font-bold">{event?.startTime ? new Date(event.startTime).toLocaleString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).replace('lúc ', '') : 'Chưa cập nhật'}</p>

                        </div>
                      </div>

                      <div className="flex items-center gap-4 group/item">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                          <Icon name="location_on" size="sm" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa điểm</p>
                          <p className="text-slate-900 font-bold">{event?.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-primary/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform" />
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Icon name="confirmation_number" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Vé đã bán</p>
                        <div className="flex items-baseline gap-1">
                          <h4 className="text-2xl font-black text-slate-900">{stats?.soldSeats}</h4>
                          <span className="text-slate-400 font-bold text-[10px]">/ {stats?.totalSeats} mục tiêu</span>
                        </div>
                        <div className="mt-3 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <div className="h-full bg-primary" style={{ width: `${((stats?.soldSeats || 0) / (stats?.totalSeats || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform" />
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 bg-emerald-50/10 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                        <Icon name="payments" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Doanh thu hiện thực</p>
                        <h4 className="text-2xl font-black text-emerald-600 truncate">{formatCurrency(stats?.totalRevenue || 0)}</h4>
                        <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Tỷ lệ lấp đầy: {Math.round(((stats?.soldSeats || 0) / (stats?.totalSeats || 1)) * 100)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-orange-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform" />
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                        <Icon name="how_to_reg" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Tỷ lệ Check-in</p>
                        <h4 className="text-2xl font-black text-orange-600">{Math.round(((stats?.checkedInSeats || 0) / (stats?.soldSeats || 1)) * 100)}%</h4>
                        <p className="mt-1.5 text-[10px] text-slate-400 font-medium truncate">{stats?.checkedInSeats} khách đã đến</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Timeline / Schedule Section */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                      <h5 className="font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          Lịch trình
                        </div>
                        <CleanEditButton onClick={() => setActiveEditType('schedule')} title="Sửa lịch trình" />
                      </h5>


                      <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {(event?.schedules || []).map((item: any, idx: number) => (
                          <div key={idx} className="relative group">
                            <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 bg-white border-2 border-primary rounded-full z-10 group-hover:scale-125 transition-transform" />
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                {formatTime(item.startTime)}

                              </span>
                              <h6 className="text-sm font-black text-slate-900 leading-tight">{item.activity}</h6>
                            </div>
                          </div>
                        ))}
                        {(!event?.schedules || event.schedules.length === 0) && (
                          <p className="text-xs text-slate-400 font-medium italic">Chưa có lịch trình chính thức</p>
                        )}

                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Icon name="format_quote" size="xl" className="text-slate-900" />
                      </div>
                      <h5 className="font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                          Mô tả sự kiện
                        </div>
                        <CleanEditButton onClick={() => setActiveEditType('description')} title="Sửa mô tả" />
                      </h5>


                      <div className="text-sm text-slate-600 leading-loose font-medium whitespace-pre-line bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-100 relative z-10">
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
                          placeholder="Nhập mã check-in"
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl text-center font-bold outline-none transition-all"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                      <div>
                        <h4 className="text-lg font-bold">Biểu đồ Doanh thu (Ước tính)</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Thống kê chi tiết theo từng ngày</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button
                          onClick={() => navigateWeek('prev')}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-primary transition-colors"
                        >
                          <Icon name="chevron_left" size="sm" />
                        </button>
                        <div className="px-2 text-center min-w-[150px]">
                          <span className="text-[11px] font-black text-slate-700 whitespace-nowrap">
                            {getWeekRangeString(currentWeekStart)}
                          </span>
                        </div>
                        <button
                          onClick={() => navigateWeek('next')}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-primary transition-colors"
                        >
                          <Icon name="chevron_right" size="sm" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end gap-3 sm:gap-6 h-56 pt-2">
                      {weeklyMockData.map((item, i) => {
                        // Calculate height based on max val (120 in mock)
                        const h = (item.val / 130) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-3">
                            <div className="w-full bg-slate-50 rounded-2xl relative group h-full" >
                              <div
                                className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-blue-400 rounded-2xl transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-400 shadow-lg shadow-primary/10"
                                style={{ height: `${h}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl">
                                  {item.val}M VNĐ
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[11px] text-slate-900 font-black">{item.day}</span>
                              <span className="text-[8px] text-slate-400 font-bold">
                                {(() => {
                                  const d = new Date(currentWeekStart);
                                  d.setDate(d.getDate() + i);
                                  return d.getDate() + '/' + (d.getMonth() + 1);
                                })()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Revenue Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden h-[240px]">
                      <div className="absolute -right-10 -bottom-10 opacity-10">
                        <Icon name="account_balance_wallet" className="text-[140px]" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2">Doanh thu hiện thực</p>
                        <h4 className="text-4xl font-black mb-1">{formatCurrency(stats?.totalRevenue || 0)}</h4>
                        <p className="text-[10px] text-white/40 italic">Đã bao gồm VAT & Phí hệ thống</p>
                      </div>
                      <div className="relative z-10">
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
                          <Icon name="file_download" size="xs" /> XUẤT BÁO CÁO
                        </button>
                      </div>
                    </div>

                    {/* Cost Card (Mockup) */}
                    <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden h-[240px] border border-slate-800">
                      <div className="absolute -right-10 -bottom-10 opacity-10 text-emerald-500">
                        <Icon name="payments" className="text-[140px]" />
                      </div>
                      <div className="relative z-10">
                         <div className="flex items-center gap-2 mb-2">
                           <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Chi phí sự kiện</p>
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                         </div>
                        <h4 className="text-4xl font-black mb-1">
                          {aiPlanResult ? formatCurrency(aiPlanResult.budgetSections.reduce((acc: number, cur: any) => acc + cur.total, 0)) : '770.000.000 ₫'}
                        </h4>
                        <p className="text-[10px] text-white/40 italic">Dự toán dựa trên kế hoạch AI</p>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                           <div className="text-center transition-transform hover:scale-105">
                              <p className="text-[8px] text-white/40 font-bold uppercase mb-1">Cần thanh toán</p>
                              <p className="text-xs font-black">215.000K</p>
                           </div>
                           <div className="w-px h-8 bg-white/10"></div>
                           <div className="text-center transition-transform hover:scale-105">
                              <p className="text-[8px] text-white/40 font-bold uppercase mb-1">Đã chi trả</p>
                              <p className="text-xs font-black text-emerald-400">555.000K</p>
                           </div>
                        </div>
                      </div>
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

                {/* AI Planning Section */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
                    {!aiPlanResult && !isGeneratingPlan && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 space-y-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 group-hover:scale-110 transition-transform duration-500">
                          <Icon name="auto_awesome" className="text-white text-4xl" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-2xl font-black text-slate-900 tracking-tight">Kế hoạch & Dự toán AI</h4>
                          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">Sử dụng trí tuệ nhân tạo để tự động hóa danh sách công việc, dụng cụ cần thiết và dự toán ngân sách chi tiết cho sự kiện này.</p>
                        </div>
                        <button
                          onClick={generateAIPlan}
                          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:translate-y-[-2px] flex items-center gap-3"
                        >
                          <Icon name="bolt" size="sm" />
                          BẮT ĐẦU TẠO NGAY
                        </button>
                      </div>
                    )}

                    {isGeneratingPlan && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 bg-slate-50/50 backdrop-blur-sm">
                        <div className="relative w-32 h-32">
                          <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-t-purple-600 rounded-full animate-spin"></div>
                          <div className="absolute inset-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                            <Icon name="psychology" className="text-white text-3xl" />
                          </div>
                          {/* Floating particles simulation */}
                          <div className="absolute -top-4 -right-4 w-4 h-4 bg-pink-400 rounded-full animate-ping"></div>
                          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                        <div className="space-y-2 text-center">
                          <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse">ĐANG PHÂN TÍCH SỰ KIỆN...</h4>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">AI đang thiết lập công việc & ngân sách</p>
                        </div>
                      </div>
                    )}

                    {aiPlanResult && (
                      <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all group/header hover:border-purple-200">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover/header:rotate-12 transition-transform duration-500">
                              <Icon name="auto_awesome" size="md" />
                            </div>
                            <div>
                               <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                  Kế hoạch & Dự toán AI
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-[8px] font-black uppercase tracking-tighter">Premium Gen</span>
                               </h4>
                              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Tối ưu hóa ngân sách dựa trên loại hình sự kiện & mục tiêu</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                              <Icon name="download" size="xs" /> PDF Report
                            </button>
                            <button
                              onClick={generateAIPlan}
                              className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"
                              title="Tạo lại kế hoạch"
                            >
                              <Icon name="refresh" size="sm" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Column 1: Tasks */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                                <h5 className="font-black text-xs uppercase tracking-widest text-slate-700">Công việc trọng tâm</h5>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">{aiPlanResult.tasks.length} nhiệm vụ</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {aiPlanResult.tasks.map((task: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md hover:border-purple-200 transition-all">
                                  <div className="w-6 h-6 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center group-hover:border-purple-500 transition-colors">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700 leading-tight">{task.text}</p>
                                  </div>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-red-50 text-red-500 border border-red-100' :
                                    task.priority === 'Medium' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-slate-100 text-slate-400'
                                    }`}>{task.priority}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Column 2: Tools */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                                <h5 className="font-black text-xs uppercase tracking-widest text-slate-700">Tài liệu & Thiết bị</h5>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">{aiPlanResult.tools.length} loại</span>
                            </div>
                            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                              {aiPlanResult.tools.map((tool: any, idx: number) => (
                                <div key={idx} className="p-4 flex justify-between items-center hover:bg-white group transition-all">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white border border-slate-200 text-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-pink-50 transition-all">
                                      <Icon name="inventory_2" size="xs" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{tool.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-600 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">{tool.qty} {tool.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Full Width Spreadsheet Section */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between bg-slate-900 p-5 rounded-3xl text-white shadow-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                             <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                                   <Icon name="table_chart" size="sm" />
                                </div>
                                <div>
                                   <h5 className="font-black text-sm uppercase tracking-widest">DỰ TOÁN NGÂN SÁCH CHI TIẾT</h5>
                                   <p className="text-[9px] text-white/50 font-bold uppercase tracking-tighter">Dựa trên khối lượng và đơn giá thực tế</p>
                                </div>
                             </div>
                             <div className="text-right relative z-10">
                                <p className="text-[9px] text-white/50 font-bold uppercase mb-1">Tổng cộng dự toán</p>
                                <p className="text-2xl font-black text-primary">
                                  {formatCurrency(aiPlanResult.budgetSections.reduce((acc: number, cur: any) => acc + cur.total, 0))}
                                </p>
                             </div>
                          </div>

                          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto custom-scrollbar">
                              <table className="w-full text-xs font-bold border-collapse">
                                <thead>
                                  <tr className="bg-orange-500 text-white text-[10px] uppercase tracking-widest shadow-lg">
                                    <th className="p-4 border border-orange-600 w-12 text-center first:rounded-tl-[2rem]">STT</th>
                                    <th className="p-4 border border-orange-600 text-left min-w-[300px]">Mục</th>
                                    <th className="p-4 border border-orange-600 text-center w-28">Đơn vị</th>
                                    <th className="p-4 border border-orange-600 text-center w-28">Số lượng</th>
                                    <th className="p-4 border border-orange-600 text-right min-w-[130px]">Đơn giá</th>
                                    <th className="p-4 border border-orange-600 text-right min-w-[160px]">Thành tiền (VND)</th>
                                    <th className="p-4 border border-orange-600 text-left min-w-[280px] last:rounded-tr-[2rem]">Chú thích</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {aiPlanResult.budgetSections.map((section: any) => (
                                    <React.Fragment key={section.id}>
                                      {/* Main Section Header */}
                                      <tr className="bg-[#a6ce39] text-white leading-loose shadow-sm">
                                        <td className="p-4 border border-emerald-600 text-center uppercase font-black">{section.id}</td>
                                        <td className="p-4 border border-emerald-600 uppercase tracking-widest font-black" colSpan={4}>{section.title}</td>
                                        <td className="p-4 border border-emerald-600 text-right font-black text-sm">{formatCurrency(section.total).replace('₫', '')}</td>
                                        <td className="p-4 border border-emerald-600"></td>
                                      </tr>

                                      {section.subSections.map((sub: any) => (
                                        <React.Fragment key={sub.id}>
                                          {/* Sub-section Header */}
                                          <tr className="bg-slate-50 text-slate-900 border-b border-slate-200">
                                            <td className="p-4 border-x border-slate-100 text-center font-black">{sub.id}</td>
                                            <td className="p-4 border-x border-slate-100 font-black pl-8" colSpan={6}>{sub.title}</td>
                                          </tr>

                                          {sub.items.map((item: any) => (
                                            <tr key={`${section.id}-${sub.id}-${item.stt}`} className="text-slate-600 hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                                              <td className="p-4 border-x border-slate-100 text-center font-medium">{item.stt}</td>
                                              <td className="p-4 border-x border-slate-100 pl-10 font-bold text-slate-800">{item.item}</td>
                                              <td className="p-4 border-x border-slate-100 text-center font-medium italic text-slate-400">{item.unit}</td>
                                              <td className="p-4 border-x border-slate-100 text-center font-black text-slate-700">{item.qty}</td>
                                              <td className="p-4 border-x border-slate-100 text-right font-medium">{formatCurrency(item.unitPrice).replace('₫', '')}</td>
                                              <td className="p-4 border-x border-slate-100 text-right font-black text-slate-900">{formatCurrency(item.qty * item.unitPrice).replace('₫', '')}</td>
                                              <td className="p-4 border-x border-slate-100 text-xs font-normal italic leading-relaxed text-slate-400 group-hover:text-slate-600 transition-colors">
                                                {item.remarks}
                                              </td>
                                            </tr>
                                          ))}
                                        </React.Fragment>
                                      ))}
                                    </React.Fragment>
                                  ))}
                                  {/* Final Total Row */}
                                  <tr className="bg-slate-900 text-white">
                                    <td colSpan={5} className="p-6 border border-slate-900 text-right uppercase tracking-[0.2em] font-black text-[10px] text-white/50">TỔNG CỘNG HỆ THỐNG DỰ TOÁN</td>
                                    <td className="p-6 border border-slate-900 text-right font-black text-2xl text-primary">
                                      {formatCurrency(aiPlanResult.budgetSections.reduce((acc: number, cur: any) => acc + cur.total, 0))}
                                    </td>
                                    <td className="p-6 border border-slate-900"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                             <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                                <Icon name="info" size="sm" />
                             </div>
                             <div>
                                <h6 className="text-[11px] font-black text-amber-900 uppercase">Lưu ý quan trọng</h6>
                                <p className="text-[10px] text-amber-700 font-medium leading-relaxed italic">Dự toán này mang tính chất tham khảo dựa trên dữ liệu thị trường hiện tại. Chi phí thực tế có thể thay đổi tùy thuộc vào nhà cung cấp và thời điểm đặt hàng.</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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

        {/* Edit Event Modal - Localized & Dynamic */}
        {activeEditType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setActiveEditType(null)} />
            <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/20">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                    <Icon
                      name={
                        activeEditType === 'title' ? 'edit_note' :
                          activeEditType === 'info' ? 'map' :
                            activeEditType === 'description' ? 'description' : 'schedule'
                      }
                      size="sm"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {activeEditType === 'title' ? 'Chỉnh sửa tên sự kiện' :
                        activeEditType === 'info' ? 'Thời gian & Địa điểm' :
                          activeEditType === 'description' ? 'Mô tả chi tiết' : 'Quản lý lịch trình'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cập nhật nội dung tương ứng</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveEditType(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>

              <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {activeEditType === 'title' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên sự kiện mới</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all shadow-inner"
                        value={editForm?.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {activeEditType === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa điểm tổ chức</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all shadow-inner"
                        value={editForm?.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày & Giờ bắt đầu</label>
                      <input
                        type="datetime-local"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all shadow-inner"
                        value={(() => {
                          try {
                            if (!editForm?.startTime) return '';
                            return new Date(editForm.startTime).toISOString().slice(0, 16);
                          } catch (e) {
                            return '';
                          }
                        })()}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {activeEditType === 'description' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung mô tả</label>
                    <textarea
                      rows={10}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all resize-none shadow-inner leading-relaxed"
                      placeholder="Nhập mô tả chi tiết cho sự kiện..."
                      value={editForm?.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                )}

                {activeEditType === 'schedule' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Các mốc lịch trình</label>
                      <button
                        onClick={() => setEditSchedules([...editSchedules, { startTime: [8, 0], activity: '' }])}
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <Icon name="add" size="xs" /> Thêm mốc mới
                      </button>
                    </div>
                    <div className="space-y-3">
                      {editSchedules.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                          <div className="w-24 shrink-0">
                            <input
                              type="time"
                              className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                              value={formatTime(item.startTime)}
                              onChange={(e) => {
                                const [h, m] = e.target.value.split(':').map(Number);
                                const newSchedules = [...editSchedules];
                                newSchedules[idx].startTime = [h, m];
                                setEditSchedules(newSchedules);
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Hoạt động..."
                              className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                              value={item.activity}
                              onChange={(e) => {
                                const newSchedules = [...editSchedules];
                                newSchedules[idx].activity = e.target.value;
                                setEditSchedules(newSchedules);
                              }}
                            />
                          </div>
                          <button
                            onClick={() => setEditSchedules(editSchedules.filter((_, i) => i !== idx))}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Icon name="delete" size="xs" />
                          </button>
                        </div>
                      ))}
                      {editSchedules.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Trống lịch trình</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button
                  onClick={() => setActiveEditType(null)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-50 transition-all uppercase"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleUpdateEvent}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all uppercase"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};


export default OrganizerEventManage;
