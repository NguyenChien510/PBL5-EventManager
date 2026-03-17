import { Icon, Avatar, StatCard, SearchInput } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'

const sidebarConfig = {
  brandName: 'Vibrant', brandSub: 'Organizer Hub', brandIcon: 'event_available',
  sections: [
    { title: 'Dashboard', links: [
      { to: '/organizer/dashboard', label: 'Tổng quan', icon: 'dashboard' },
      { to: '/organizer/events', label: 'Sự kiện', icon: 'event' },
      { to: '/organizer/guests', label: 'Khách mời', icon: 'groups' },
    ]},
  ],
  user: { name: 'Hoàng Nguyễn', role: 'Event Director' },
}

const guests = [
  { name: 'Nguyễn Minh Khoa', email: 'khoa@email.com', ticket: 'VIP-001', type: 'VIP', checked: true, time: '19:05' },
  { name: 'Trần Thu Hà', email: 'ha@email.com', ticket: 'STD-045', type: 'Standard', checked: true, time: '19:12' },
  { name: 'Lê Đức Anh', email: 'anh@email.com', ticket: 'VIP-023', type: 'VIP', checked: false, time: '' },
  { name: 'Phạm Ngọc Linh', email: 'linh@email.com', ticket: 'PRM-008', type: 'Premium', checked: false, time: '' },
]

const OrganizerGuests = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Quản lý Khách mời & Check-in" searchPlaceholder="Tìm khách mời..." />
      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Tổng khách mời" value={600} icon="groups" />
          <StatCard label="Đã check-in" value={234} icon="check_circle" iconBg="bg-green-100" iconColor="text-green-600" />
          <StatCard label="Chưa check-in" value={366} icon="pending" iconBg="bg-orange-100" iconColor="text-orange-500" />
          <StatCard label="Tỷ lệ" value="39%" icon="pie_chart" iconBg="bg-purple-100" iconColor="text-purple-600" />
        </div>

        {/* QR Scanner + Guest List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QR Scanner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Icon name="qr_code_scanner" className="text-primary" /> Check-in nhanh
            </h3>
            <div className="scan-window aspect-square bg-slate-900 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
              <div className="scan-line absolute w-full h-1 bg-green-500/50 shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              <Icon name="qr_code_2" className="text-white/20 text-7xl" />
            </div>
            <p className="text-sm text-slate-500 text-center mb-4">Hướng camera vào mã QR trên vé</p>
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                <Icon name="photo_camera" size="sm" /> Quét mã
              </button>
              <button className="flex-1 py-2.5 border border-slate-200 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                <Icon name="keyboard" size="sm" /> Nhập thủ công
              </button>
            </div>
          </div>

          {/* Guest List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-bold">Danh sách khách mời</h3>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50">
                  <Icon name="filter_list" size="sm" /> Lọc
                </button>
                <button className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50">
                  <Icon name="download" size="sm" /> Xuất
                </button>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  {['Khách mời', 'Mã vé', 'Loại', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="p-4 text-xs font-bold text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.map((guest) => (
                  <tr key={guest.ticket} className="hover:bg-slate-50/30">
                    <td className="p-4">
                      <p className="font-bold text-sm">{guest.name}</p>
                      <p className="text-xs text-slate-400">{guest.email}</p>
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-500">{guest.ticket}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        guest.type === 'VIP' ? 'bg-yellow-100 text-yellow-600' :
                        guest.type === 'Premium' ? 'bg-primary/10 text-primary' :
                        'bg-slate-100 text-slate-500'
                      }`}>{guest.type}</span>
                    </td>
                    <td className="p-4">
                      {guest.checked ? (
                        <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                          <Icon name="check_circle" size="sm" filled /> {guest.time}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Chưa check-in</span>
                      )}
                    </td>
                    <td className="p-4">
                      {!guest.checked && (
                        <button className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-600">
                          Check-in
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default OrganizerGuests
