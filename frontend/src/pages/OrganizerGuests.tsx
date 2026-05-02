import { Icon, StatCard } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'

const sidebarConfig = organizerSidebarConfig

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
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
            <div className="p-8 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Danh sách khách mời</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Danh sách người tham dự thực tế</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-5 py-2.5 text-xs font-black bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-sm">
                  <Icon name="filter_list" size="sm" /> Lọc
                </button>
                <button className="px-5 py-2.5 text-xs font-black bg-primary text-white rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                  <Icon name="download" size="sm" /> Xuất dữ liệu
                </button>
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left whitespace-nowrap border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/80 backdrop-blur-md">
                    {['Khách mời', 'Mã vé', 'Hạng vé', 'Trạng thái', ''].map((h) => (
                      <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {guests.map((guest, idx) => (
                    <tr key={guest.ticket} className="group hover:bg-slate-50/50 transition-all duration-300 relative">
                      <td className="px-8 py-6 relative">
                         {/* Subtle hover accent */}
                         <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-r-full" />
                         <div className="flex items-center gap-4">
                           <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-sm shadow-sm border border-white">
                             {guest.name.substring(0, 1).toUpperCase()}
                           </div>
                           <div className="flex flex-col">
                             <span className="font-black text-slate-900 text-sm tracking-tight group-hover:text-primary transition-colors">{guest.name}</span>
                             <span className="text-[10px] text-slate-400 font-bold tracking-tight mt-0.5">{guest.email}</span>
                           </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-mono font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">{guest.ticket}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm border ${
                          guest.type === 'VIP' ? 'bg-amber-100 text-amber-600 border-amber-200 shadow-amber-50' :
                          guest.type === 'Premium' ? 'bg-primary/10 text-primary border-primary/20 shadow-primary/50' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>{guest.type}</span>
                      </td>
                      <td className="px-8 py-6">
                        {guest.checked ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            {guest.time}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            Chờ đến
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {!guest.checked && (
                          <button className="px-5 py-2.5 bg-white text-primary text-xs font-black rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm shadow-primary/5">
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
      </div>
    </DashboardLayout>
  )
}

export default OrganizerGuests
