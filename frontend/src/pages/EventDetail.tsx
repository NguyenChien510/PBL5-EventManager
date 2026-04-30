import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EventService } from '../services/eventService'
import { Icon } from '../components/ui'

const artists = [
  { name: 'Sơn Tùng M-TP', role: 'Ca sĩ chính', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8' },
  { name: 'DJ Snake', role: 'Guest DJ', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8uGa4mjJqgWx5lFfDdLFanomchIA51IL8c0cvb3MIvS4GBu7ELTNexbhcJEIciFGOrbVfUWEGrFk5mRHb_asax4cBD8ddZD6DCO2x-TFSGHMrGlb_3UzaAzSv-lol1Y13h0NCWx1bisS-1wiw9mM1Pk1uAuWn4ENmtn0bHrhfEN0_pXnmDQCY_Dx7HWH1bijivgY4hCUMU_lb4qGiw0i4ZqDGhPXEC97rUmzSAyfodwGiVLLxAAz2QaKrFMSGuRiEE4j49dJZMqw' },
  { name: 'Binz', role: 'Ca sĩ khách mời', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrnq1Yzgsd28u9RCJh3At5GShj32DcYi9T_WN8ctWilvGZn9VmfNHcOXN0PJVpwKNobaOeiLmwLHEdWBHMa0-lffiM-Lwoaqt5KkCR09eDjWJ-SCeEHoTwndxp4Nre5iCAhg4T1qbg7h75lD0xQbdhUfxGLICenIk71wCsX_N9LaLNhSBdHcgwT-D_-lV4s-BSw1EUi9YzTDRA_WzoNc9T9dOkYFrwkftJ5xX9JXksilQMRTFko1lYzpfcj_je9bmv6z9ywUt6AXg' },
]


const timeline = [
  { time: '18:00', title: 'Mở cổng', icon: 'door_front', color: 'bg-slate-500' },
  { time: '19:00', title: 'DJ Opening Set', icon: 'headphones', color: 'bg-purple-500' },
  { time: '20:00', title: 'Sơn Tùng M-TP biểu diễn', icon: 'mic', color: 'bg-primary' },
  { time: '21:30', title: 'Khách mời đặc biệt', icon: 'star', color: 'bg-yellow-500' },
  { time: '22:30', title: 'Kết thúc', icon: 'celebration', color: 'bg-green-500' },
]

const EventCalendar = ({
  sessions,
  defaultDate,
  selectedSessionId,
  onSelectSession,
  compact = false
}: {
  sessions: any[],
  defaultDate: Date,
  selectedSessionId?: number | null,
  onSelectSession?: (sessionId: number) => void,
  compact?: boolean
}) => {
  const [currentDate, setCurrentDate] = useState(defaultDate);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }

  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  const getSessionForDay = (day: Date) => {
    if (!sessions || sessions.length === 0) return null;
    const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

    return sessions.find(session => {
      let sDateStr: string;
      if (Array.isArray(session.sessionDate)) {
        sDateStr = `${session.sessionDate[0]}-${String(session.sessionDate[1]).padStart(2, '0')}-${String(session.sessionDate[2]).padStart(2, '0')}`;
      } else if (typeof session.sessionDate === 'string') {
        sDateStr = session.sessionDate.split('T')[0];
      } else {
        return false;
      }
      return dayStr === sDateStr;
    });
  };

  const isEventDay = (day: Date) => !!getSessionForDay(day);

  const isToday = (day: Date) => {
    return day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear();
  };

  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  return (
    <div className={`bg-white rounded-[1.5rem] border border-slate-100 shadow-lg overflow-hidden relative group/cal ${compact ? 'p-4' : 'p-8'}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/cal:bg-primary/10 transition-colors duration-700" />

      <div className={`flex items-center justify-between relative z-10 ${compact ? 'mb-4' : 'mb-8'}`}>
        <div>
          <h3 className={`${compact ? 'text-sm' : 'text-xl'} font-black text-slate-900 tracking-tight`}>{monthNames[month]} {year}</h3>
          {!compact && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lịch diễn ra sự kiện</p>}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1))}
            className={`${compact ? 'w-7 h-7' : 'w-10 h-10'} rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white hover:shadow-md transition-all`}
          >
            <Icon name="chevron_left" size="xs" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1))}
            className={`${compact ? 'w-7 h-7' : 'w-10 h-10'} rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white hover:shadow-md transition-all`}
          >
            <Icon name="chevron_right" size="xs" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1 relative z-10">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
          <div key={d} className={`text-center font-black text-slate-300 uppercase ${compact ? 'text-[8px] py-1' : 'text-[10px] py-2'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 relative z-10">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className={compact ? 'h-8' : 'h-12'} />;

          const session = getSessionForDay(day);
          const active = !!session;
          const isSelected = session && session.id === selectedSessionId;
          const current = isToday(day);

          return (
            <button
              key={idx}
              disabled={!active}
              onClick={() => session && onSelectSession?.(session.id)}
              className={`flex flex-col items-center justify-center rounded-xl transition-all relative group
                ${compact ? 'h-8 text-xs' : 'h-12 text-sm'}
                ${isSelected ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110 z-20 font-black ring-4 ring-primary/20' :
                  active ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold' :
                    'hover:bg-slate-50 text-slate-400 font-medium'}
                ${current && !isSelected ? 'border-2 border-primary/20 bg-primary/5 text-primary' : ''}
              `}
            >
              <span>{day.getDate()}</span>
              {active && !compact && !isSelected && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-primary/20 rounded-full" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày có sự kiện</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-primary rounded-full" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đang chọn</span>
          </div>
        </div>
      )}
    </div>
  );
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (id) {
          const [eventData, ticketsData] = await Promise.all([
            EventService.getEventById(id),
            EventService.getEventTicketTypes(id)
          ]);
          setEvent(eventData);
          setTicketTypes(ticketsData);
        }
      } catch (error) {
        console.error('Failed to fetch event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light font-display">
        <div className="text-center">
          <Icon name="error_outline" className="text-6xl text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-700">Không tìm thấy sự kiện</h2>
          <Link to="/explore" className="text-primary hover:underline mt-4 inline-block">Quay lại trang Explore</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light font-display">
      {/* Hero */}
      <div className="relative h-[500px] overflow-hidden">
        <img
          src={event.posterUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8"}
          alt={event.title} className="w-full h-full object-cover"
        />
        <div className="hero-gradient absolute inset-0" />

        {/* Nav overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/explore" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <Icon name="arrow_back" /> <span className="text-sm font-medium">Quay lại</span>
            </Link>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20">
                <Icon name="favorite_border" />
              </button>
              <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20">
                <Icon name="share" />
              </button>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-10">
          <div className="max-w-7xl mx-auto">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 backdrop-blur-md rounded-full text-xs font-bold text-white mb-4 shadow-sm"
              style={{ backgroundColor: event.category?.color ? `${event.category.color}CC` : '#ec4899CC' }}
            >
              <Icon name={event.category?.icon || "music_note"} size="sm" /> {event.category?.name || "Âm nhạc"}
            </span>

            <h1 className="text-4xl font-extrabold text-white mb-3">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm">
              <span className="flex items-center gap-2"><Icon name="calendar_today" size="sm" /> {new Date(event.startTime).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })} • {new Date(event.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="flex items-center gap-2"><Icon name="location_on" size="sm" /> {event.location ? `${event.location}${event.province?.name ? `, ${event.province.name}` : ''}` : (event.province?.name || "SVĐ Quân khu 7, TP.HCM")}</span>
              <span className="flex items-center gap-2"><Icon name="star" size="sm" className="text-yellow-400" /> 4.9 (2,450 đánh giá)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-12">
          {/* Main */}
          <div className="space-y-10">
            {/* Description */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" /> Giới thiệu
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </section>

            {/* Artists */}
            {event.artists && event.artists.length > 0 && (
              <section>
                <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full" /> Nghệ sĩ biểu diễn
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {event.artists.map((artist: any) => (
                    <div key={artist.name} className="bg-white rounded-2xl border border-slate-100 p-4 text-center hover:shadow-lg transition-all">
                      <img src={artist.avatar} alt={artist.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover shadow-sm" />
                      <p className="font-bold text-sm text-slate-800">{artist.name}</p>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 opacity-80">Nghệ sĩ</p>
                    </div>
                  ))}
                </div>
              </section>
            )}


          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Compact Event Calendar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Thời gian biểu</span>
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-xl border border-slate-100 ring-4 ring-slate-50">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5
                        ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Icon name="format_list_bulleted" size="xs" />
                  </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5
                        ${viewMode === 'calendar' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Icon name="calendar_month" size="xs" />
                    </button>
                </div>
              </div>

              {viewMode === 'calendar' ? (
                <EventCalendar
                  sessions={event.sessions || []}
                  defaultDate={new Date(event.startTime)}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={(id) => setSelectedSessionId(id)}
                  compact={true}
                />
              ) : (
                <div className="space-y-2 animate-fade-in">
                  {(event.sessions || []).map((session: any) => {
                    const isSelected = session.id === selectedSessionId;
                    // sessionDate is [year, month, day]
                    const date = Array.isArray(session.sessionDate)
                      ? new Date(session.sessionDate[0], session.sessionDate[1] - 1, session.sessionDate[2])
                      : new Date(session.sessionDate);

                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 group
                            ${isSelected
                            ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                            : 'bg-white border-slate-100 hover:border-primary/30 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${isSelected ? 'bg-white/20' : 'bg-primary/5'}`}>
                              <Icon name="event" className={isSelected ? 'text-white' : 'text-primary'} size="sm" />
                            </div>
                            <div>
                              <p className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {date.toLocaleDateString('vi-VN', { weekday: 'long' })}
                              </p>
                              <p className={`text-xs font-bold ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                Ngày {date.getDate()} tháng {date.getMonth() + 1}, {date.getFullYear()}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                              <Icon name="check" size="xs" className="text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="glass-widget rounded-[32px] p-6 overflow-hidden relative">
                <div className="mb-6">
                  <h3 className="text-xl font-black mb-2">Thông tin đặt vé</h3>
                </div>

                {/* Ticket Stats Grid */}
                <div className="relative group">
                  {!selectedSessionId && (
                    <div className="absolute inset-x-0 -inset-y-2 z-30 bg-white/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-primary/20">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <Icon name="touch_app" className="text-primary animate-bounce" />
                      </div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Vui lòng chọn ngày</p>
                      <p className="text-[10px] text-slate-500 font-bold">Click vào ngày trên lịch để xem vé</p>
                    </div>
                  )}


                  {/* Ticket Categories */}
                  <div className="space-y-3 mb-8">
                    {selectedSessionId ? (
                      ticketTypes
                        .filter(tt => tt.sessionId === selectedSessionId)
                        .map((tt, idx) => {
                          const lowerName = tt.name.toLowerCase();
                          let colorTheme = { dot: 'bg-primary', bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary' };

                          if (lowerName.includes('vip')) {
                            colorTheme = { dot: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };
                          } else if (lowerName.includes('diamond') || lowerName.includes('vvip')) {
                            colorTheme = { dot: 'bg-pink-500', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' };
                          }

                          return (
                            <div key={tt.id} className={`flex items-center justify-between p-3 rounded-xl border ${colorTheme.bg} ${colorTheme.border} hover:brightness-95 transition-all`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-md ${colorTheme.dot} shadow-sm`} />
                                <span className={`text-sm font-bold ${colorTheme.text}`}>{tt.name}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-slate-800">{new Intl.NumberFormat('vi-VN').format(tt.price)}đ</p>
                                <p className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">{tt.totalQuantity} vé</p>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 italic text-xs text-slate-400 font-medium">
                        Chọn ngày để xem hạng vé khả dụng
                      </div>
                    )}
                  </div>

                  <Link
                    to={selectedSessionId ? `/event/${id}/seats?session=${selectedSessionId}` : "#"}
                    onClick={(e) => !selectedSessionId && e.preventDefault()}
                    className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-black text-sm transition-all 
                      ${selectedSessionId
                        ? 'bg-primary text-white hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] group'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                      }`}
                  >
                    <Icon name="event_seat" className={selectedSessionId ? 'group-hover:scale-110 transition-transform' : ''} size="sm" />
                    <span>Chọn chỗ ngồi trên sơ đồ</span>
                  </Link>
                </div>
              </div>

              {/* Compact Timeline */}
              {event.schedules && event.schedules.length > 0 && (
                <div className="mt-8 p-6 bg-white rounded-[2rem] border border-slate-200/50 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
                  <div className="flex items-center gap-2 mb-6 px-1 relative z-10">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Lịch trình sự kiện</span>
                  </div>
                  <div className="space-y-0 relative z-10">
                    {event.schedules.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 group/item">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 transition-all group-hover/item:scale-125 
                            ${idx === 0 ? 'bg-primary' : 'bg-slate-200 group-hover/item:bg-primary/50'}`} />
                          {idx !== event.schedules.length - 1 && (
                            <div className="w-px flex-1 bg-slate-100 group-hover/item:bg-primary/20 transition-colors" />
                          )}
                        </div>
                        <div className={`${idx !== event.schedules.length - 1 ? 'pb-6' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                              {item.startTime ? String(item.startTime).substring(0, 5) : item.time}
                            </span>
                          </div>
                          <p className="text-xs font-black text-slate-800 leading-snug group-hover/item:text-primary transition-colors">
                            {item.activity || item.title}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter opacity-0 group-hover/item:opacity-100 transition-opacity">Confirmed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 pt-16 border-t border-slate-200">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Review Summary */}
            <div className="lg:w-1/3 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Đánh giá từ cộng đồng</h2>
                <p className="text-sm text-slate-500 font-medium">Lắng nghe trải nghiệm thực tế từ những người tham gia trước đó</p>
              </div>

              <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-400/10 transition-colors duration-700" />
                
                <p className="text-5xl font-black text-slate-900 mb-2">4.9</p>
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Icon key={s} name="star" className="text-yellow-400" size="sm" />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dựa trên 2,450 đánh giá</p>

                <div className="mt-8 space-y-3">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 w-3">{rating}</span>
                      <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full" 
                          style={{ width: rating === 5 ? '85%' : rating === 4 ? '10%' : '5%' }} 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{rating === 5 ? '85%' : rating === 4 ? '10%' : '5%'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Review List & Input */}
            <div className="lg:w-2/3 space-y-8">

              {/* Individual Reviews */}
              <div className="space-y-6">
                {[
                  { id: 1, user: 'Hoàng Nam', avatar: 'https://i.pravatar.cc/150?u=1', rating: 5, date: '2 ngày trước', comment: 'Sự kiện tuyệt vời! Âm thanh ánh sáng đỉnh cao, ban tổ chức rất chuyên nghiệp. Rất đáng tiền vé.' },
                  { id: 2, user: 'Minh Anh', avatar: 'https://i.pravatar.cc/150?u=2', rating: 4, date: '1 tuần trước', comment: 'Trải nghiệm rất tốt, tuy nhiên lúc vào cổng hơi đông một chút. Mong lần sau sẽ được cải thiện.' },
                  { id: 3, user: 'Lê Tuấn', avatar: 'https://i.pravatar.cc/150?u=3', rating: 5, date: '2 tuần trước', comment: 'Show diễn quá bùng nổ! Nghệ sĩ biểu diễn hết mình. Đã có một đêm không thể quên.' },
                ].map(rev => (
                  <div key={rev.id} className="flex gap-5 group">
                    <img src={rev.avatar} alt={rev.user} className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-slate-800 text-sm">{rev.user}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex gap-0.5">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Icon key={i} name="star" className="text-yellow-400" size="xs" />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">• {rev.date}</span>
                          </div>
                        </div>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-slate-400 transition-all">
                          <Icon name="more_horiz" size="sm" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {rev.comment}
                      </p>
                      <div className="flex items-center gap-4 pt-1">
                        <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                          <Icon name="thumb_up" size="xs" /> Hữu ích (12)
                        </button>
                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                          Phản hồi
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest hover:border-primary/20 hover:text-primary hover:bg-primary/5 transition-all">
                  Xem thêm đánh giá
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EventDetail
