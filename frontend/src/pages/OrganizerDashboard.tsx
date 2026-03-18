import { Icon, StatCard } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'

const sidebarConfig = organizerSidebarConfig

const chartData = [
  { month: 'T6', value: 40 }, { month: 'T7', value: 65 }, { month: 'T8', value: 55 },
  { month: 'T9', value: 80 }, { month: 'T10', value: 72 }, { month: 'T11', value: 90 },
]

const quickActions = [
  { icon: 'add_circle', label: 'Tạo sự kiện', color: 'bg-primary', href: '/organizer/create' },
  { icon: 'qr_code_scanner', label: 'Check-in', color: 'bg-green-500', href: '/organizer/guests' },
  { icon: 'analytics', label: 'Báo cáo', color: 'bg-purple-500', href: '/organizer/finance' },
  { icon: 'campaign', label: 'Marketing', color: 'bg-orange-500', href: '#' },
]

const schedule = [
  { time: '09:00', title: 'Họp chuẩn bị Gala Dinner', tag: 'Meeting', tagColor: 'bg-blue-100 text-blue-600' },
  { time: '14:00', title: 'Review setup sân khấu', tag: 'Task', tagColor: 'bg-purple-100 text-purple-600' },
  { time: '17:00', title: 'Kiểm tra âm thanh', tag: 'Urgent', tagColor: 'bg-red-100 text-red-600' },
]

const OrganizerDashboard = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Bảng Điều Khiển Tổ Chức" subtitle="Chào buổi sáng, Hoàng! 🌟" />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard label="Tổng sự kiện" value={48} icon="event" iconBg="bg-primary/10" iconColor="text-primary" trend={{ value: '+12 tháng này', positive: true }} />
          <StatCard label="Vé đã bán" value="12,450" icon="confirmation_number" iconBg="bg-green-100" iconColor="text-green-600" trend={{ value: '+8.2%', positive: true }} />
          <StatCard label="Doanh thu" value="2.4B" icon="payments" iconBg="bg-purple-100" iconColor="text-purple-600" trend={{ value: '+15%', positive: true }} />
          <StatCard label="Checkin hôm nay" value={156} icon="qr_code_scanner" iconBg="bg-orange-100" iconColor="text-orange-500" />
        </div>

        {/* Revenue chart + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Icon name="trending_up" className="text-primary" /> Tăng trưởng doanh thu
              </h3>
              <select className="text-sm bg-slate-50 border-none rounded-lg px-3 py-1.5 font-medium">
                <option>6 tháng gần nhất</option>
                <option>12 tháng</option>
              </select>
            </div>
            <div className="flex items-end gap-4 h-48">
              {chartData.map((bar) => (
                <div key={bar.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">{bar.value}%</span>
                  <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '100%' }}>
                    <div
                      className="chart-bar absolute bottom-0 w-full bg-gradient-to-t from-primary to-blue-400 rounded-t-lg"
                      style={{ height: `${bar.value}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{bar.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold mb-4 text-slate-500 uppercase tracking-wider">Hành động nhanh</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <a key={action.label} href={action.href} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all">
                    <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center text-white`}>
                      <Icon name={action.icon} size="sm" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Events table + Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-bold flex items-center gap-2">
                <Icon name="event" className="text-primary" /> Sự kiện sắp tới
              </h3>
              <a href="/organizer/events" className="text-xs font-bold text-primary hover:underline">Xem tất cả</a>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  {['Sự kiện', 'Ngày', 'Vé bán', 'Trạng thái'].map((h) => (
                    <th key={h} className="p-4 text-xs font-bold text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { title: 'Concert Year End Party', date: '20/12', sold: '450/500', status: 'Đang mở bán', statusColor: 'text-green-600 bg-green-50' },
                  { title: 'AI Summit 2024', date: '28/11', sold: '180/200', status: 'Sắp diễn ra', statusColor: 'text-blue-600 bg-blue-50' },
                  { title: 'Gala Dinner', date: '15/01', sold: '0/300', status: 'Bản nháp', statusColor: 'text-slate-500 bg-slate-100' },
                ].map((evt) => (
                  <tr key={evt.title} className="hover:bg-slate-50/30">
                    <td className="p-4 font-bold text-sm">{evt.title}</td>
                    <td className="p-4 text-sm text-slate-500">{evt.date}</td>
                    <td className="p-4 text-sm font-medium">{evt.sold}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${evt.statusColor}`}>{evt.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Icon name="schedule" className="text-primary" /> Lịch hôm nay
            </h3>
            <div className="space-y-4">
              {schedule.map((item) => (
                <div key={item.title} className="flex gap-4 items-start">
                  <div className="text-xs font-bold text-slate-400 w-12 pt-1">{item.time}</div>
                  <div className="flex-1 p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-bold mb-1">{item.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.tagColor}`}>{item.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default OrganizerDashboard
