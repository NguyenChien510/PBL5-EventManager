import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'

const artists = [
  { name: 'Sơn Tùng M-TP', role: 'Ca sĩ chính', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8' },
  { name: 'DJ Snake', role: 'Guest DJ', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8uGa4mjJqgWx5lFfDdLFanomchIA51IL8c0cvb3MIvS4GBu7ELTNexbhcJEIciFGOrbVfUWEGrFk5mRHb_asax4cBD8ddZD6DCO2x-TFSGHMrGlb_3UzaAzSv-lol1Y13h0NCWx1bisS-1wiw9mM1Pk1uAuWn4ENmtn0bHrhfEN0_pXnmDQCY_Dx7HWH1bijivgY4hCUMU_lb4qGiw0i4ZqDGhPXEC97rUmzSAyfodwGiVLLxAAz2QaKrFMSGuRiEE4j49dJZMqw' },
  { name: 'Binz', role: 'Ca sĩ khách mời', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrnq1Yzgsd28u9RCJh3At5GShj32DcYi9T_WN8ctWilvGZn9VmfNHcOXN0PJVpwKNobaOeiLmwLHEdWBHMa0-lffiM-Lwoaqt5KkCR09eDjWJ-SCeEHoTwndxp4Nre5iCAhg4T1qbg7h75lD0xQbdhUfxGLICenIk71wCsX_N9LaLNhSBdHcgwT-D_-lV4s-BSw1EUi9YzTDRA_WzoNc9T9dOkYFrwkftJ5xX9JXksilQMRTFko1lYzpfcj_je9bmv6z9ywUt6AXg' },
]

const tickets = [
  { name: 'Standard', price: '500.000 VNĐ', color: 'border-slate-300', features: ['Khu vực đứng', 'Cổng vào thường'] },
  { name: 'Premium', price: '1.200.000 VNĐ', color: 'border-primary', highlight: true, features: ['Khu VIP ngồi', 'Quà tặng Premium', 'Backstage access'] },
  { name: 'Diamond', price: '3.500.000 VNĐ', color: 'border-yellow-500', features: ['Hàng ghế đầu', 'Meet & Greet', 'Full VIP experience'] },
]

const timeline = [
  { time: '18:00', title: 'Mở cổng', icon: 'door_front', color: 'bg-slate-500' },
  { time: '19:00', title: 'DJ Opening Set', icon: 'headphones', color: 'bg-purple-500' },
  { time: '20:00', title: 'Sơn Tùng M-TP biểu diễn', icon: 'mic', color: 'bg-primary' },
  { time: '21:30', title: 'Khách mời đặc biệt', icon: 'star', color: 'bg-yellow-500' },
  { time: '22:30', title: 'Kết thúc', icon: 'celebration', color: 'bg-green-500' },
]

const EventDetail = () => {
  return (
    <div className="min-h-screen bg-background-light font-display">
      {/* Hero */}
      <div className="relative h-[500px] overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8"
          alt="Event" className="w-full h-full object-cover"
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
              <Icon name="music_note" size="sm" /> Âm nhạc
            </span>
            <h1 className="text-4xl font-extrabold text-white mb-3">SƠN TÙNG M-TP: THE FIRST JOURNEY 2024</h1>
            <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm">
              <span className="flex items-center gap-2"><Icon name="calendar_today" size="sm" /> 15 Th12, 2024 • 20:00</span>
              <span className="flex items-center gap-2"><Icon name="location_on" size="sm" /> SVĐ Quân khu 7, TP.HCM</span>
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
              <p className="text-slate-600 leading-relaxed">
                Đêm nhạc đặc biệt đánh dấu chặng đường âm nhạc của Sơn Tùng M-TP. Với hệ thống âm thanh, ánh sáng đẳng cấp quốc tế cùng dàn nghệ sĩ khách mời đặc biệt, hứa hẹn mang đến trải nghiệm không thể nào quên.
              </p>
            </section>

            {/* Timeline */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" /> Lịch trình sự kiện
              </h2>
              <div className="space-y-0">
                {timeline.map((item, idx) => (
                  <div key={item.time} className="flex gap-4">
                    {/* Left: time label */}
                    <div className="w-14 shrink-0 text-right pt-4">
                      <span className="text-sm font-bold text-slate-500">{item.time}</span>
                    </div>

                    {/* Center: dot + connector line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center z-10 shadow-md`}>
                        <Icon name={item.icon} size="sm" className="text-white text-[14px]" />
                      </div>
                      {idx < timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 my-0" />
                      )}
                    </div>

                    {/* Right: content card */}
                    <div className="flex-1 pb-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Artists */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" /> Nghệ sĩ biểu diễn
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {artists.map((artist) => (
                  <div key={artist.name} className="bg-white rounded-2xl border border-slate-100 p-4 text-center hover:shadow-lg transition-all">
                    <img src={artist.avatar} alt={artist.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
                    <p className="font-bold text-sm">{artist.name}</p>
                    <p className="text-xs text-slate-500">{artist.role}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-extrabold mb-4">Chọn loại vé</h3>
              <div className="space-y-3 mb-6">
                {tickets.map((ticket) => (
                  <label key={ticket.name} className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    ticket.highlight ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/30'
                  }`}>
                    <input type="radio" name="ticket" className="mr-3 accent-primary" defaultChecked={ticket.highlight} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{ticket.name}</p>
                        <p className="font-extrabold text-primary">{ticket.price}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ticket.features.map((f) => (
                          <span key={f} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{f}</span>
                        ))}
                      </div>
                    </div>
                    {ticket.highlight && (
                      <span className="absolute -top-2 right-3 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full">HOT</span>
                    )}
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-500">Số lượng</span>
                <div className="flex items-center gap-3">
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center">−</button>
                  <span className="font-bold">2</span>
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-100 mb-4">
                <span className="text-sm font-medium text-slate-500">Tổng tiền</span>
                <span className="text-xl font-extrabold text-primary">2.400.000 VNĐ</span>
              </div>

              <Link to="/seats" className="w-full py-3.5 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
                <Icon name="confirmation_number" size="sm" />
                Chọn ghế & Thanh toán
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail
