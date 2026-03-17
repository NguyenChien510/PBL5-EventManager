import { Icon, StatCard } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'

const sidebarConfig = {
  brandName: 'Vibrant', brandSub: 'Organizer Hub', brandIcon: 'event_available',
  sections: [{ title: 'Quản lý', links: [
    { to: '/organizer/dashboard', label: 'Tổng quan', icon: 'dashboard' },
    { to: '/organizer/finance', label: 'Tài chính', icon: 'account_balance' },
    { to: '/organizer/feedback', label: 'Phản hồi', icon: 'rate_review' },
  ]}],
  user: { name: 'Hoàng Nguyễn', role: 'Event Director' },
}

const transactions = [
  { id: 'TX-001', event: 'Concert Year End', type: 'Vé bán', amount: '+2.400.000', date: '20/12/2024', status: 'Thành công', positive: true },
  { id: 'TX-002', event: 'Concert Year End', type: 'Phí nền tảng', amount: '-240.000', date: '20/12/2024', status: 'Đã trừ', positive: false },
  { id: 'TX-003', event: 'AI Summit', type: 'Rút về tài khoản', amount: '-5.000.000', date: '18/12/2024', status: 'Đang xử lý', positive: false },
  { id: 'TX-004', event: 'Workshop UX', type: 'Vé bán', amount: '+500.000', date: '15/12/2024', status: 'Thành công', positive: true },
]

const OrganizerFinance = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Quyết toán Tài chính" subtitle="Tổng quan doanh thu & chi phí" />
      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Tổng doanh thu" value="2.4B" icon="payments" iconBg="bg-green-100" iconColor="text-green-600" trend={{ value: '+15% tháng này', positive: true }} />
          <StatCard label="Phí nền tảng" value="240M" icon="receipt_long" iconBg="bg-red-100" iconColor="text-red-500" />
          <StatCard label="Thu nhập ròng" value="2.16B" icon="account_balance" iconBg="bg-primary/10" iconColor="text-primary" />
          <StatCard label="Chờ thanh toán" value="85M" icon="hourglass_empty" iconBg="bg-orange-100" iconColor="text-orange-500" />
        </div>

        {/* Chart + Withdraw */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Icon name="trending_up" className="text-primary" /> Biểu đồ doanh thu theo tháng
            </h3>
            <div className="flex items-end gap-3 h-48">
              {[35, 50, 42, 68, 55, 75, 88, 70, 82, 95, 78, 90].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-slate-100 rounded-t-md relative" style={{ height: '100%' }}>
                    <div className="chart-bar absolute bottom-0 w-full bg-gradient-to-t from-primary to-blue-400 rounded-t-md" style={{ height: `${h}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-400">T{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <Icon name="account_balance_wallet" className="text-8xl" />
            </div>
            <div className="relative z-10">
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Số dư khả dụng</p>
              <h4 className="text-3xl font-extrabold mb-6">2.160.000.000đ</h4>
              <button className="w-full py-3 bg-white text-primary font-bold rounded-xl shadow-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Icon name="account_balance" size="sm" /> Rút về tài khoản
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <h3 className="font-bold flex items-center gap-2"><Icon name="receipt" className="text-primary" /> Lịch sử giao dịch</h3>
            <button className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50">
              <Icon name="download" size="sm" /> Xuất CSV
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                {['Mã GD', 'Sự kiện', 'Loại', 'Số tiền', 'Ngày', 'Trạng thái'].map((h) => (
                  <th key={h} className="p-4 text-xs font-bold text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/30">
                  <td className="p-4 text-sm font-mono text-slate-500">{tx.id}</td>
                  <td className="p-4 text-sm font-medium">{tx.event}</td>
                  <td className="p-4 text-sm text-slate-500">{tx.type}</td>
                  <td className={`p-4 text-sm font-bold ${tx.positive ? 'text-green-600' : 'text-red-500'}`}>{tx.amount}đ</td>
                  <td className="p-4 text-sm text-slate-500">{tx.date}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      tx.status === 'Thành công' ? 'bg-green-100 text-green-600' :
                      tx.status === 'Đang xử lý' ? 'bg-orange-100 text-orange-500' :
                      'bg-slate-100 text-slate-500'
                    }`}>{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default OrganizerFinance
