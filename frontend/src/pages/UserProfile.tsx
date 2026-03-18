import { Icon, Avatar, StatCard } from '../components/ui'
import { TicketCard, TransactionItem } from '../components/domain'
import { DashboardLayout } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'

const sidebarConfig = userSidebarConfig

const tickets = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8',
    title: 'SƠN TÙNG M-TP: THE FIRST JOURNEY 2024',
    ticketId: '#E-TICKET-882910',
    date: '20:00, 15 Th12',
    seat: 'Zone VIP - Row A - 02',
    location: 'SVĐ Quân khu 7, TP.HCM',
    type: 'Premium' as const,
    status: 'active' as const,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8uGa4mjJqgWx5lFfDdLFanomchIA51IL8c0cvb3MIvS4GBu7ELTNexbhcJEIciFGOrbVfUWEGrFk5mRHb_asax4cBD8ddZD6DCO2x-TFSGHMrGlb_3UzaAzSv-lol1Y13h0NCWx1bisS-1wiw9mM1Pk1uAuWn4ENmtn0bHrhfEN0_pXnmDQCY_Dx7HWH1bijivgY4hCUMU_lb4qGiw0i4ZqDGhPXEC97rUmzSAyfodwGiVLLxAAz2QaKrFMSGuRiEE4j49dJZMqw',
    title: 'AI INNOVATION SUMMIT 2024',
    ticketId: '#E-TICKET-77412B',
    date: '08:00, 28 Th11',
    seat: 'Grand Ballroom A',
    location: 'Gem Center, Quận 1',
    type: 'Standard' as const,
    status: 'pending' as const,
  },
]

const transactions = [
  { icon: 'add_card', title: 'Nạp tiền vào ví', date: '10:45, 12 Th10, 2024', amount: '500.000 VNĐ', positive: true },
  { icon: 'confirmation_number', title: 'Mua vé Event Sơn Tùng M-TP', date: '14:20, 08 Th10, 2024', amount: '1.200.000 VNĐ', positive: false },
  { icon: 'loyalty', title: 'Hoàn tiền Loyalty', date: '09:00, 01 Th10, 2024', amount: '25.000 VNĐ', positive: true },
]

const UserProfile = () => {
  return (
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
            <Avatar src={sidebarConfig.user.avatar} size="md" className="rounded-lg ring-2 ring-white shadow-sm" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">Alex Nguyen</span>
          </div>
        </div>
      </header>

      <div className="px-8 lg:px-12 pb-12 space-y-12">
        {/* Profile Card + Wallet */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="xl:col-span-2 section-card p-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar src={sidebarConfig.user.avatar} size="xl" className="rounded-2xl shadow-md border-4 border-white" />
                <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-lg shadow-md">
                  <Icon name="verified" className="text-primary" filled />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-slate-900">Alex Nguyen</h3>
                  <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-md border border-blue-100 uppercase">
                    Thành viên Kim Cương
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">alex.nguyen@example.com • Tham gia từ 2022</p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sự kiện</p>
                    <p className="text-lg font-bold text-slate-800">24</p>
                  </div>
                  <div className="w-px bg-slate-100" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Điểm tích lũy</p>
                    <p className="text-lg font-bold text-slate-800">12,500 <span className="text-xs text-slate-400">pts</span></p>
                  </div>
                </div>
              </div>
            </div>
            <button className="btn-secondary flex items-center gap-2 text-sm">
              <Icon name="edit" size="sm" />
              Sửa hồ sơ
            </button>
          </div>

          {/* Wallet Card */}
          <div className="section-card p-6 flex flex-col justify-between bg-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Icon name="account_balance_wallet" className="text-white text-7xl" />
            </div>
            <div className="relative z-10">
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Số dư Ví Ocean</p>
              <h4 className="text-3xl font-extrabold text-white">
                2.450.000 <span className="text-sm font-medium opacity-80">VNĐ</span>
              </h4>
            </div>
            <div className="relative z-10 flex items-center justify-between mt-6">
              <div className="flex items-center gap-3">
                <Icon name="credit_card" className="text-white/80" />
                <span className="text-xs text-white/90 font-medium">**** 8829</span>
              </div>
              <button className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">
                Nạp tiền
              </button>
            </div>
          </div>
        </section>

        {/* Tickets */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-800">Vé của tôi</h3>
              <span className="px-2.5 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                {tickets.length}
              </span>
            </div>
            <button className="text-sm font-bold text-primary hover:underline">Xem tất cả</button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket, i) => (
              <TicketCard key={i} {...ticket} />
            ))}
          </div>
        </section>

        {/* Transaction History + Offers */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Lịch sử giao dịch</h3>
              <button className="text-xs font-bold text-primary hover:underline">Tất cả lịch sử</button>
            </div>
            <div className="section-card divide-y divide-slate-100">
              {transactions.map((tx, i) => (
                <TransactionItem key={i} {...tx} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Ưu đãi cá nhân</h3>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                  <Icon name="auto_awesome" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Gói VIP Experience</h4>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Nhận ngay mã giảm 20% cho sự kiện tiếp theo dựa trên sở thích của bạn.
                </p>
                <button className="w-full py-3 bg-primary text-white text-xs font-bold rounded-lg shadow-md shadow-primary/20 hover:bg-blue-600 transition-colors tracking-widest">
                  KHÁM PHÁ NGAY
                </button>
              </div>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default UserProfile
