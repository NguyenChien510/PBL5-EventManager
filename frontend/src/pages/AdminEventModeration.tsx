import { Icon, StatCard, Pagination, StatusBadge } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'

const sidebarConfig = adminSidebarConfig

const events = [
  {
    id: 1,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhrQCoJtEP5Ry2FtPg7fIKAvyMtac_QwaU5LX7pK5AWyz_EvZeSgGr8zlzflM6eHwgBY2Y-W1n0dT5oLtPm8y18PExMvAGGgmwVNIhm2x1Nqc88xDpfneYCC16Ms3c7S7yAcSHYFDlg7NYffD6V37rjaOFm9J9y2XulgSOZWiWDqT9N1_lR40oG8fcfH2tnUGDRmn8hLpqFl4WGbZUgbbB_Wh1XQK8gicjGStc76fLYqgKPjaoIXBM0ejcMfNAm_e4k26Oc8pc_14',
    title: 'Vibrant Summer Fest 2024',
    location: 'Công viên Tao Đàn, TP.HCM',
    organizer: 'EventMaster Team',
    orgInitials: 'EM',
    orgColor: 'bg-primary/20',
    category: 'Âm nhạc',
    catColor: 'bg-blue-100 text-blue-600',
    date: '10/05/2024',
    status: 'pending' as const,
  },
  {
    id: 2,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR6C3A8yWubses6CRU2zRsfJEQwPGBjGF5EwbJ5a2-UDogAswQJggRN0owp0ITeLNvJmrLa6HXxHG5lRJ6KH09ciirDYq7BGt1_Om7qtXxmgQbs-rAgD-6vCaDYePticjbrJTeXyZ_rtEfdD7rsuTtv4XJfmztzsuZ9ls_K1-1oRCRx2gPda-rOD26oRXvFEwIue_SyWEVdWp40R0SWYsYfKfzST2z-ahNk-3SfafICgm11QAm6l3UmOzqy4uNU5ZAG1mb556pXhY',
    title: 'TechSummit Vietnam 2024',
    location: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
    organizer: 'VNG Corporation',
    orgInitials: 'VN',
    orgColor: 'bg-purple-100 text-purple-600',
    category: 'Công nghệ',
    catColor: 'bg-purple-100 text-purple-600',
    date: '12/05/2024',
    status: 'editing' as const,
  },
  {
    id: 3,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrnq1Yzgsd28u9RCJh3At5GShj32DcYi9T_WN8ctWilvGZn9VmfNHcOXN0PJVpwKNobaOeiLmwLHEdWBHMa0-lffiM-Lwoaqt5KkCR09eDjWJ-SCeEHoTwndxp4Nre5iCAhg4T1qbg7h75lD0xQbdhUfxGLICenIk71wCsX_N9LaLNhSBdHcgwT-D_-lV4s-BSw1EUi9YzTDRA_WzoNc9T9dOkYFrwkftJ5xX9JXksilQMRTFko1lYzpfcj_je9bmv6z9ywUt6AXg',
    title: 'Artisan Market - Hanoi',
    location: 'Khu Phố Cổ, Hà Nội',
    organizer: 'Local Craft VN',
    orgInitials: 'LC',
    orgColor: 'bg-orange-100 text-orange-600',
    category: 'Nghệ thuật',
    catColor: 'bg-yellow-100 text-yellow-600',
    date: '13/05/2024',
    status: 'rejected' as const,
  },
]

const recentActivities = [
  { icon: 'check', iconBg: 'bg-green-100', iconColor: 'text-green-600', title: 'Đã duyệt "Music Night"', by: 'Admin Nguyễn', time: '5 phút trước' },
  { icon: 'close', iconBg: 'bg-red-100', iconColor: 'text-red-600', title: 'Từ chối "Seminar Crypto"', by: 'Admin Trần', time: '12 phút trước' },
  { icon: 'edit', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', title: 'Yêu cầu sửa "Startup Pitch"', by: 'Admin Nguyễn', time: '45 phút trước' },
]

const AdminEventModeration = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Danh sách Kiểm duyệt" searchPlaceholder="Tìm tên sự kiện, nhà tổ chức..." />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Chờ phê duyệt" value={24} icon="pending_actions" iconBg="bg-primary/10" iconColor="text-primary" trend={{ value: '+12% hôm nay', positive: true }} />
          <StatCard label="Đã duyệt (Tháng)" value="1,452" icon="check_circle" iconBg="bg-green-100" iconColor="text-green-600" trend={{ value: '+5% vs tháng trước', positive: true }} />
          <StatCard label="Yêu cầu chỉnh sửa" value="08" icon="edit_note" iconBg="bg-orange-100" iconColor="text-orange-500" />
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-8">
              {['Tất cả chờ duyệt (24)', 'Ưu tiên cao', 'Sự kiện lớn', 'Đã bị cờ'].map((tab, i) => (
                <button key={tab} className={`border-b-2 pb-4 px-2 text-sm font-bold transition-all ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-primary'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 pb-3">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-white">
                <Icon name="filter_list" size="sm" /> Bộ lọc
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-white">
                <Icon name="sort" size="sm" /> Sắp xếp
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {['Thông tin Sự kiện', 'Nhà tổ chức', 'Thể loại', 'Ngày gửi', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className={`p-4 text-xs font-bold uppercase tracking-wider text-slate-400 ${h === 'Thao tác' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <tr key={evt.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${evt.image}')` }} />
                        <div>
                          <p className="font-bold text-sm">{evt.title}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{evt.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${evt.orgColor} flex items-center justify-center text-[10px] font-bold`}>{evt.orgInitials}</div>
                        <p className="text-sm font-medium">{evt.organizer}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${evt.catColor}`}>{evt.category}</span>
                    </td>
                    <td className="p-4 text-sm font-medium">{evt.date}</td>
                    <td className="p-4">
                      <StatusBadge status={evt.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {evt.status === 'pending' && (
                          <>
                            <button className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all" title="Phê duyệt">
                              <Icon name="check" size="sm" />
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all" title="Yêu cầu chỉnh sửa">
                              <Icon name="edit" size="sm" />
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all" title="Từ chối">
                              <Icon name="close" size="sm" />
                            </button>
                          </>
                        )}
                        {evt.status === 'editing' && (
                          <>
                            <button className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all">
                              <Icon name="check" size="sm" />
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                              <Icon name="visibility" size="sm" />
                            </button>
                          </>
                        )}
                        {evt.status === 'rejected' && (
                          <button className="w-8 h-8 rounded-lg bg-gray-200 text-gray-400 flex items-center justify-center opacity-40" disabled>
                            <Icon name="history" size="sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-slate-50/30 border-t border-slate-200">
              <Pagination current={1} total={3} label="Hiển thị 10 trong 24 sự kiện chờ duyệt" />
            </div>
          </div>
        </div>

        {/* Quick Feedback + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Icon name="feedback" className="text-primary" /> Phản hồi Nhanh
            </h3>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">Lý do từ chối / Yêu cầu sửa đổi (Nội bộ)</label>
                <textarea className="w-full bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 placeholder:italic" placeholder="Nhập chi tiết lỗi hoặc lý do từ chối..." rows={3} />
              </div>
              <div className="flex flex-wrap gap-2">
                {['Ảnh bìa vi phạm', 'Nội dung không rõ ràng', 'Sai thể loại', 'Thiếu giấy phép'].map((reason) => (
                  <button key={reason} className="px-3 py-1.5 rounded-full border border-primary/30 text-primary text-xs font-bold bg-primary/5 hover:bg-primary/10">
                    {reason}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button className="px-6 py-2.5 rounded-lg border border-red-500 text-red-500 text-sm font-bold hover:bg-red-50 transition-all">Gửi Từ Chối</button>
                <button className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all">Yêu Cầu Chỉnh Sửa</button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Icon name="history" className="text-primary" /> Hoạt động gần đây
            </h3>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              {recentActivities.map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${act.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon name={act.icon} className={act.iconColor} size="sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{act.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Bởi {act.by} • {act.time}</p>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 text-xs font-bold text-primary hover:underline">Xem tất cả nhật ký</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminEventModeration
