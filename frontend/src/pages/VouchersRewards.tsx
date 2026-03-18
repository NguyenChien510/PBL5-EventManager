import { Icon, Avatar } from '../components/ui'
import { DashboardLayout } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'

const sidebarConfig = userSidebarConfig

const vouchers = [
  {
    badge: 'Hạng Kim Cương',
    icon: 'diamond',
    iconColor: 'text-blue-400',
    gradient: 'from-slate-900 to-slate-800',
    title: 'GIẢM 500K',
    subtitle: 'Cho vé đại nhạc hội',
    code: 'DIAMOND500',
    expiry: 'Hạn dùng: 31/12/2024',
  },
  {
    badge: 'Hạng Kim Cương',
    icon: 'stars',
    iconColor: 'text-white/50',
    gradient: 'from-primary to-blue-700',
    title: 'LOUNGE VIP',
    subtitle: 'Sử dụng không giới hạn',
    code: 'VIPIO_24',
    expiry: 'Hạn dùng: 15/01/2025',
  },
  {
    badge: 'Quà tặng đặc biệt',
    icon: 'featured_video',
    iconColor: 'text-purple-300',
    gradient: 'from-indigo-900 via-purple-900 to-indigo-900',
    title: 'FREE DRINK',
    subtitle: 'Tại sự kiện Ocean Night',
    code: 'DRINKFREE_D',
    expiry: 'Sử dụng tại quầy Bar',
  },
]

const partnerGifts = [
  { name: 'Starbucks Coffee', desc: 'Giảm 15% cho mọi thức uống dòng Refreshers.', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9DK6KXKE8H6i5SupJ2_7K5BMszoS22d4vv7mH3uYNfZ7wCQ3hTl48SKKRE0oEfykJWiYSO-2SHmuoG2x6QNDK5Nd7037SEKYb2sAwi7NLehL-n4A5yn06h18ijiDVXissYrlP3HNNiEkmEuH__-SYxIGMFTSYJIPQ6iH_MgAzopio6lOrwzRLhZ6BxheC8EzwAsqgy7k1NNzHjVGw3JEwqFqPvnl0Ly7OZE1MHJs2uUgT8CoppEM2cPTqPIRWGnPqzyTiI-eUHrM' },
  { name: 'Grab Việt Nam', desc: 'Code 30k cho chuyến xe đi đến mọi sự kiện.', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNidYMYv8oPV0PJ6pmqFwRb2s4lbuCRktbMgL9yfrjNzKEoZi5-ipysXJDBzilI0X8c-EJhVfy5JGv_e6ofeV3nrlWK7Ktd9VhDk24sJsvAvGsMlXuk9jlskjHoD7CxqcnyJiL6ufL1HXe3OiimSkYR0RuKkZ80MAcJb6xAMrY9G2TzZl2n4H-suWbd6t-9ZJFTgjlrD6tC6qVK1Zhd7z1MFPSkR45Fpo2P7p7ST9JJzJuoPDRMFjmgIq5wmGO1CqmbaJE8c8aoqo' },
  { name: 'Nike Store', desc: 'Giảm ngay 200k khi mua giày Running.', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCoG68EL9sDjSeR_wMsX8_09yruhuD5ZiL9D1GksosK6nU93WX562zG_qN66w5BTi0_OhbmnlMlZCM1ezYDkzf6vEuRfTdIZnnqQa4eYpGwbs7sjnja57N8AqWjE07MqkmgK2_IfsxO6mQeuutitIFKDXaVvtkDPy3qF-ATh0FDw6__GqXurWWCycDnRVahn0LipwDEHJFjacfjPc5HRsY5U4YGjrjqvpsbKLpB6EZTu_z-vqvvrS2ir7NXPrkr9HRfd3KNyEBv-I' },
  { name: 'Netflix Premium', desc: 'Tặng 01 tháng sử dụng gói Ultra HD.', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP7aAFar4LdlEwgkc-4TrngAs65qu5TaUDW0Q2N6cwQJ7Ezr072_slhm-QGWDu73EDrQ3YIoJbGqeM-MRNqqjX-GOcS7B43tx1FJz3h8FyFgVOTuya00hooS1L7kVsSDZfhwHzfnyGKes9ez3rFgmBoR8amyrSSM9fph_Y8vtbw_L4IkvJoAphFco9aPF2UWhtantmQ3uiuMsi0pc5wcKqxD4iMlQbrwOh7KzlzHS9oeBcfQF-NAB-FVCv3p_iZAnDJhvb8Px_bEQ' },
]

const VouchersRewards = () => {
  return (
    <DashboardLayout sidebarProps={{
      ...sidebarConfig,
      children: (
        <div className="p-8">
          <div className="bg-primary/5 rounded-[2rem] p-6 text-center border border-primary/10">
            <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-widest">Hạng Thành Viên</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Icon name="diamond" className="text-primary" />
              <span className="text-sm font-black text-slate-900">Kim Cương</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mb-2 overflow-hidden">
              <div className="w-3/4 h-full bg-primary rounded-full" />
            </div>
            <p className="text-[10px] text-slate-500 font-medium">1,250 điểm để lên hạng kế</p>
          </div>
        </div>
      ),
    }}>
      {/* Header */}
      <header className="h-24 px-12 flex items-center justify-between sticky top-0 z-40 bg-background-light/80 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Ưu đãi &amp; Quà tặng</h2>
          <p className="text-sm font-medium text-slate-500">Khám phá những đặc quyền dành riêng cho bạn.</p>
        </div>
        <div className="flex items-center gap-6">
          <button className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-primary transition-colors">
            <Icon name="notifications" />
          </button>
          <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-bold">Alex Nguyen</p>
              <p className="text-[10px] font-bold text-primary uppercase">Diamond Member</p>
            </div>
            <Avatar src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2lolVoWnTMF_tJzHB0HICDxEffLk1IEbhad3WFx7IrGcwgMsZ1yjAwl5jAJTmED_lhI8GWcaOuYr1Q9lJYSTQb7uXe2S7aoqaZ7SxZxci4hQGumQrLHo1lzg-kvjUWO0sbbp-JaHsx9xZOedgTu4_crsKxXxz2_sq3uGBkPai-jxAZcDC4SG1iJsIB9uQYDamqJgqWa2ceI0XUnbQst2XT9JHKkVeI994PVmXE4pNAHMgMyHlXsVYezy9806RHYy9QN5yMIKF0Gg" size="lg" className="rounded-2xl shadow-md" />
          </div>
        </div>
      </header>

      <div className="px-12 space-y-12 pb-20">
        {/* Diamond Vouchers */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title"><span className="section-dot" /> Ưu đãi hạng Kim cương</h3>
            <button className="text-sm font-bold text-primary hover:underline">Xem quyền hạn</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map((v) => (
              <div key={v.code} className="voucher-card group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all">
                <div className={`p-6 bg-gradient-to-br ${v.gradient} text-white relative`}>
                  <div className="flex justify-between items-start mb-8">
                    <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase border border-white/20">{v.badge}</div>
                    <Icon name={v.icon} className={v.iconColor} />
                  </div>
                  <h4 className="text-3xl font-black mb-1">{v.title}</h4>
                  <p className="text-xs text-slate-300 font-medium uppercase tracking-widest">{v.subtitle}</p>
                </div>
                <div className="zigzag-bottom" />
                <div className="p-6 pt-2 flex flex-col flex-1 justify-between">
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Mã ưu đãi</p>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <span className="font-black text-slate-900 tracking-wider uppercase">{v.code}</span>
                      <button><Icon name="content_copy" className="text-primary" /></button>
                    </div>
                    <p className="text-[10px] mt-3 flex items-center gap-1 text-slate-500">
                      <Icon name="calendar_today" size="sm" className="text-[14px]" /> {v.expiry}
                    </p>
                  </div>
                  <button className="w-full py-3 bg-primary text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform">
                    ĐỔI NGAY
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Event */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title"><span className="section-dot" /> Sự kiện sắp diễn ra</h3>
            <button className="text-sm font-bold text-primary hover:underline">Khám phá thêm</button>
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-8 bento-card min-h-[400px] flex flex-col justify-end p-0 relative overflow-hidden rounded-2xl">
              <img alt="Big Event" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="relative z-10 p-10">
                <span className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase rounded-full tracking-widest mb-4 inline-block">Sự kiện tiêu điểm</span>
                <h4 className="text-4xl font-black text-white mb-4 leading-tight">SUMMER FESTIVAL 2024:<br/>BEACH PARTY NIGHT</h4>
                <div className="flex items-center gap-6 text-white/80 mb-8">
                  <span className="flex items-center gap-2"><Icon name="calendar_month" size="sm" /> 15/07/2024</span>
                  <span className="flex items-center gap-2"><Icon name="location_on" size="sm" /> Bãi biển Vũng Tàu</span>
                </div>
                <div className="flex gap-4">
                  <button className="px-8 py-4 bg-white text-slate-900 text-xs font-black rounded-2xl hover:bg-slate-50 transition-colors">MUA VÉ NGAY</button>
                  <button className="px-8 py-4 bg-white/20 backdrop-blur-md text-white text-xs font-black rounded-2xl border border-white/30 hover:bg-white/30 transition-colors">XEM CHI TIẾT</button>
                </div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 space-y-6">
              <div className="bento-card bg-primary h-[calc(50%-12px)] relative rounded-2xl p-6 overflow-hidden">
                <div className="relative z-10">
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Ưu đãi độc quyền</span>
                  <h4 className="text-2xl font-black text-white mt-2 mb-4">Gói VIP 2 người<br/>giảm 20%</h4>
                  <button className="text-white flex items-center gap-2 text-xs font-bold hover:underline">
                    Tìm hiểu thêm <Icon name="arrow_forward" size="sm" />
                  </button>
                </div>
                <Icon name="confirmation_number" className="absolute -right-4 -bottom-4 text-[120px] text-white/10 rotate-12" />
              </div>
              <div className="bento-card h-[calc(50%-12px)] group bg-white rounded-2xl p-6 relative overflow-hidden border border-slate-200">
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase mb-1">Workshops</p>
                    <h4 className="text-lg font-black text-slate-900 leading-snug">Nghệ thuật &amp; Rượu vang:<br/>Chủ đề "Dưới Đại Dương"</h4>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-bold text-slate-500">20/06/2024</span>
                    <button className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                      <Icon name="add" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Gifts */}
        <section>
          <h3 className="section-title mb-6"><span className="section-dot" /> Quà tặng từ đối tác</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerGifts.map((gift) => (
              <div key={gift.name} className="bento-card group flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                  <img alt={gift.name} className="w-10 h-10 grayscale group-hover:grayscale-0 transition-all" src={gift.logo} />
                </div>
                <h5 className="text-sm font-black text-slate-900 mb-1">{gift.name}</h5>
                <p className="text-[11px] text-slate-500 font-medium mb-6 leading-relaxed">{gift.desc}</p>
                <button className="w-full py-2.5 bg-slate-50 text-slate-900 text-[10px] font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors uppercase tracking-widest">
                  Lấy mã
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default VouchersRewards
