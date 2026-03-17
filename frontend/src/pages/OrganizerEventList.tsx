import { Icon, StatusBadge, Pagination } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'

const sidebarConfig = {
  brandName: 'Vibrant',
  brandSub: 'Organizer Hub',
  brandIcon: 'event_available',
  sections: [
    { title: 'Dashboard', links: [
      { to: '/organizer/dashboard', label: 'Tổng quan', icon: 'dashboard' },
      { to: '/organizer/events', label: 'Sự kiện', icon: 'event' },
      { to: '/organizer/create', label: 'Tạo sự kiện', icon: 'add_circle' },
      { to: '/organizer/guests', label: 'Khách mời', icon: 'groups' },
    ]},
    { title: 'Quản lý', links: [
      { to: '/organizer/timeline', label: 'Kịch bản', icon: 'timeline' },
      { to: '/organizer/hr', label: 'Nhân sự', icon: 'people' },
      { to: '/organizer/finance', label: 'Tài chính', icon: 'account_balance' },
      { to: '/organizer/feedback', label: 'Phản hồi', icon: 'rate_review' },
      { to: '/organizer/profile', label: 'Hồ sơ DN', icon: 'business' },
    ]},
  ],
  user: { name: 'Hoàng Nguyễn', role: 'Event Director' },
}

const events = [
  { id: 1, title: 'Concert Year End Party 2024', date: '20/12/2024', location: 'SVĐ Quân khu 7', sold: 450, total: 500, revenue: '540.000.000', status: 'active' as const },
  { id: 2, title: 'AI Innovation Summit', date: '28/11/2024', location: 'Gem Center, Q1', sold: 180, total: 200, revenue: '144.000.000', status: 'active' as const },
  { id: 3, title: 'Gala Dinner Night', date: '15/01/2025', location: 'InterContinental', sold: 0, total: 300, revenue: '0', status: 'pending' as const },
  { id: 4, title: 'Workshop UI/UX Design', date: '10/11/2024', location: 'Dreamplex, Q1', sold: 50, total: 50, revenue: '25.000.000', status: 'approved' as const },
]

const OrganizerEventList = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader
        title="Quản lý Sự kiện"
        searchPlaceholder="Tìm sự kiện..."
        actions={
          <a href="/organizer/create" className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 flex items-center gap-2 shadow-sm">
            <Icon name="add" size="sm" /> Tạo mới
          </a>
        }
      />
      <div className="p-8 space-y-6">
        {/* Filter tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
          {['Tất cả (12)', 'Đang diễn ra (4)', 'Sắp tới (5)', 'Bản nháp (3)'].map((tab, i) => (
            <button key={tab} className={`text-sm font-bold pb-2 border-b-2 transition-all ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-primary'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 gap-4">
          {events.map((evt) => (
            <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-6 hover:shadow-md hover:border-primary/20 transition-all group">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Icon name="event" className="text-primary text-3xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{evt.title}</h3>
                  <StatusBadge status={evt.status} />
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Icon name="calendar_today" size="sm" /> {evt.date}</span>
                  <span className="flex items-center gap-1"><Icon name="location_on" size="sm" /> {evt.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-8 shrink-0">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase">Vé bán</p>
                  <p className="text-lg font-bold">{evt.sold}<span className="text-slate-400 text-sm">/{evt.total}</span></p>
                  <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(evt.sold/evt.total)*100}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase">Doanh thu</p>
                  <p className="text-lg font-bold text-primary">{evt.revenue}đ</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                    <Icon name="edit" size="sm" />
                  </button>
                  <button className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                    <Icon name="visibility" size="sm" />
                  </button>
                  <button className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <Icon name="delete" size="sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Pagination current={1} total={3} label="Hiển thị 4 trong 12 sự kiện" />
      </div>
    </DashboardLayout>
  )
}

export default OrganizerEventList
