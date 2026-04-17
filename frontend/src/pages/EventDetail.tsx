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

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/80 backdrop-blur-md rounded-full text-xs font-bold text-white mb-4">
              <Icon name="music_note" size="sm" /> {event.category?.name || "Âm nhạc"}
            </span>
            <h1 className="text-4xl font-extrabold text-white mb-3">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm">
              <span className="flex items-center gap-2"><Icon name="calendar_today" size="sm" /> {new Date(event.startTime).toLocaleDateString("vi-VN", {day: "2-digit", month: "short", year: "numeric"})} • {new Date(event.startTime).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit"})}</span>
              <span className="flex items-center gap-2"><Icon name="location_on" size="sm" /> {event.location ? `${event.location}${event.province?.name ? `, ${event.province.name}` : ''}` : (event.province?.name || "SVĐ Quân khu 7, TP.HCM")}</span>
              <span className="flex items-center gap-2"><Icon name="star" size="sm" className="text-yellow-400" /> 4.9 (2,450 đánh giá)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" /> Giới thiệu
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </section>

            {/* Timeline */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" /> Lịch trình sự kiện
              </h2>
              <div className="space-y-0">
                {(event.schedules && event.schedules.length > 0 ? event.schedules : timeline).map((item: any, idx: number, arr: any[]) => {
                  const displayTime = item.startTime ? String(item.startTime).substring(0, 5) : item.time;
                  const displayTitle = item.activity || item.title;
                  return (
                  <div key={idx} className="flex gap-4">
                    {/* Left: time label */}
                    <div className="w-14 shrink-0 text-right pt-4">
                      <span className="text-sm font-bold text-slate-500">{displayTime}</span>
                    </div>

                    {/* Center: dot + connector line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full ${item.color || 'bg-primary'} flex items-center justify-center z-10 shadow-md`}>
                        <Icon name={item.icon || 'adjust'} size="sm" className="text-white text-[14px]" />
                      </div>
                      {idx < arr.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 my-0" />
                      )}
                    </div>

                    {/* Right: content card */}
                    <div className="flex-1 pb-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm font-semibold text-slate-800">{displayTitle}</p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </section>

            {/* Artists */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" /> Nghệ sĩ biểu diễn
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {(event.artists || []).map((artist: any) => (
                  <div key={artist.name} className="bg-white rounded-2xl border border-slate-100 p-4 text-center hover:shadow-lg transition-all">
                    <img src={artist.avatar} alt={artist.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover shadow-sm" />
                    <p className="font-bold text-sm text-slate-800">{artist.name}</p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 opacity-80">Nghệ sĩ</p>
                  </div>
                ))}
              </div>
            </section>


          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[400px]">
            <div className="sticky top-24">
              <div className="glass-widget rounded-[32px] p-8 overflow-hidden relative">
                <div className="mb-6">
                  <h3 className="text-xl font-black mb-2">Thông tin đặt vé</h3>
                  <p className="text-sm text-slate-500 font-medium tracking-tight italic">Giá vé chi tiết sẽ hiển thị sau khi chọn chỗ</p>
                </div>

                {/* Ticket Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng quy mô</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black">{event.totalTickets ? new Intl.NumberFormat('vi-VN').format(event.totalTickets) : '0'}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Chỗ</span>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-sm">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Đã đặt</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-primary">
                        {event.totalTickets && event.ticketsLeft !== undefined 
                          ? new Intl.NumberFormat('vi-VN').format(event.totalTickets - event.ticketsLeft)
                          : '0'}
                      </span>
                      <span className="text-[10px] font-bold text-primary/60 uppercase">
                        {event.totalTickets 
                          ? `/ ${Math.round(((event.totalTickets - (event.ticketsLeft || 0)) / event.totalTickets) * 100)}%` 
                          : '/ 0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ticket Categories */}
                <div className="space-y-3 mb-8">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phân loại & Giá vé</p>
                  {ticketTypes.length > 0 ? ticketTypes.map((tt, idx) => {
                    const lowerName = tt.name.toLowerCase();
                    let colorTheme = {
                        dot: 'bg-slate-400',
                        bg: 'bg-slate-50',
                        border: 'border-slate-200',
                        text: 'text-slate-700'
                    };
                    
                    if (lowerName.includes('vip')) {
                        colorTheme = { dot: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };
                    } else if (lowerName.includes('diamond') || lowerName.includes('vvip')) {
                        colorTheme = { dot: 'bg-pink-500', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' };
                    } else if (lowerName.includes('standard') || lowerName.includes('ga')) {
                        colorTheme = { dot: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' };
                    } else {
                        const palettes = [
                            { dot: 'bg-primary', bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary' },
                            { dot: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
                            { dot: 'bg-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
                        ];
                        colorTheme = palettes[idx % palettes.length];
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
                  }) : (
                    <div className="p-3 text-center text-sm font-medium text-slate-500">
                      Đang cập nhật hạng vé...
                    </div>
                  )}
                </div>

                <Link
                  to={id ? `/event/${id}/seats` : "/seats"}
                  className="w-full flex items-center justify-center gap-3 bg-primary text-white py-5 rounded-[24px] font-black text-lg transition-all hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:scale-[0.97] group"
                >
                  <Icon name="event_seat" className="text-xl group-hover:scale-110 transition-transform" />
                  <span>Chọn chỗ ngồi trên sơ đồ</span>
                </Link>

                <div className="mt-6 pt-6 border-t border-slate-300/30 flex items-center justify-center gap-2 text-slate-400">
                  <Icon name="verified_user" size="sm" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Wow Ticket Protection • No hidden fees</span>
                </div>
              </div>

              {/* Support Widget */}
              <div className="mt-8 p-6 bg-white rounded-3xl border border-slate-200/50 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                  <Icon name="support_agent" className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Hỗ trợ đặc quyền</h4>
                  <div className="flex gap-3 mt-1">
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Chat ngay</button>
                    <span className="text-slate-300">•</span>
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">1900 1234</button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default EventDetail
