import { Icon } from '../components/ui'
import { DashboardLayout } from '../components/layout'

const sidebarConfig = {
  brandName: 'Vibrant', brandSub: 'Organizer Hub', brandIcon: 'event_available',
  sections: [{ title: 'Quản lý', links: [
    { to: '/organizer/dashboard', label: 'Tổng quan', icon: 'dashboard' },
    { to: '/organizer/timeline', label: 'Kịch bản', icon: 'timeline' },
    { to: '/organizer/hr', label: 'Nhân sự', icon: 'people' },
  ]}],
  user: { name: 'Hoàng Nguyễn', role: 'Event Director' },
}

const phases = [
  { time: '06:00 - 10:00', title: 'Giai đoạn Chuẩn bị', icon: 'engineering', color: 'bg-blue-500', items: ['Setup sân khấu & ánh sáng', 'Kiểm tra âm thanh', 'Phân công vị trí nhân sự', 'Test run kịch bản MC'] },
  { time: '10:00 - 14:00', title: 'Đón khách & Khai mạc', icon: 'door_front', color: 'bg-green-500', items: ['Mở cổng check-in', 'Welcome drink & networking', 'Khai mạc chính thức', 'MC dẫn chương trình'] },
  { time: '14:00 - 18:00', title: 'Nội dung chính', icon: 'mic', color: 'bg-purple-500', items: ['Keynote Speaker #1', 'Panel Discussion', 'Workshop song song', 'Coffee break & networking'] },
  { time: '18:00 - 22:00', title: 'Kết thúc & Gala', icon: 'celebration', color: 'bg-orange-500', items: ['Trao giải & vinh danh', 'Biểu diễn đặc biệt', 'Gala dinner', 'Dọn dẹp & thu gom'] },
]

const OrganizerTimeline = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <div className="p-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Kịch bản & Timeline</h2>
            <p className="text-sm text-slate-500 mt-1">Concert Year End Party 2024 — 20/12/2024</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2">
              <Icon name="download" size="sm" /> Xuất PDF
            </button>
            <button className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 flex items-center gap-2 shadow-sm">
              <Icon name="share" size="sm" /> Chia sẻ team
            </button>
          </div>
        </header>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-8">
            {phases.map((phase) => (
              <div key={phase.title} className="relative pl-20">
                <div className={`absolute left-4 w-10 h-10 rounded-full ${phase.color} flex items-center justify-center text-white shadow-lg z-10`}>
                  <Icon name={phase.icon} size="sm" />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{phase.time}</span>
                      <h3 className="text-lg font-bold mt-2">{phase.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-primary"><Icon name="edit" size="sm" /></button>
                      <button className="p-2 text-slate-400 hover:text-red-500"><Icon name="delete" size="sm" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {phase.items.map((item) => (
                      <div key={item} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary accent-primary" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Phase */}
        <button className="w-full py-4 border-2 border-dashed border-primary/30 rounded-2xl text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5">
          <Icon name="add_circle" /> Thêm giai đoạn mới
        </button>
      </div>
    </DashboardLayout>
  )
}

export default OrganizerTimeline
