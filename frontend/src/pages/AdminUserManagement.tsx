import { Icon, StatCard, StatusBadge, Pagination } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'

const sidebarConfig = adminSidebarConfig

const users = [
  { id: 1, name: 'Nguyễn Minh Khoa', email: 'khoa@email.com', role: 'Organizer', status: 'active' as const, joined: '12/01/2024', events: 8 },
  { id: 2, name: 'Trần Thu Hà', email: 'ha@email.com', role: 'User', status: 'active' as const, joined: '15/03/2024', events: 0 },
  { id: 3, name: 'Lê Đức Anh', email: 'anh@email.com', role: 'Organizer', status: 'pending' as const, joined: '20/05/2024', events: 2 },
  { id: 4, name: 'Phạm Ngọc Linh', email: 'linh@email.com', role: 'User', status: 'locked' as const, joined: '01/02/2024', events: 0 },
  { id: 5, name: 'Hoàng Văn Tùng', email: 'tung@email.com', role: 'Admin', status: 'active' as const, joined: '01/01/2024', events: 0 },
]

const AdminUserManagement = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Quản lý Người dùng" searchPlaceholder="Tìm người dùng..."
        actions={
          <button className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm">
            <Icon name="person_add" size="sm" /> Thêm mới
          </button>
        }
      />
      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Tổng người dùng" value="12,450" icon="people" />
          <StatCard label="Organizers" value={245} icon="business" iconBg="bg-purple-100" iconColor="text-purple-600" />
          <StatCard label="Đang hoạt động" value="11,890" icon="check_circle" iconBg="bg-green-100" iconColor="text-green-600" />
          <StatCard label="Bị khóa" value={18} icon="lock" iconBg="bg-red-100" iconColor="text-red-500" />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex gap-6">
              {['Tất cả', 'Organizer', 'User', 'Admin', 'Bị khóa'].map((tab, i) => (
                <button key={tab} className={`text-sm font-bold ${i === 0 ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}>{tab}</button>
              ))}
            </div>
            <button className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50">
              <Icon name="download" size="sm" /> Xuất danh sách
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                {['Người dùng', 'Vai trò', 'Trạng thái', 'Ngày tham gia', 'Sự kiện', 'Thao tác'].map((h) => (
                  <th key={h} className={`p-4 text-xs font-bold text-slate-400 uppercase ${h === 'Thao tác' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      user.role === 'Admin' ? 'bg-red-100 text-red-600' :
                      user.role === 'Organizer' ? 'bg-purple-100 text-purple-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>{user.role}</span>
                  </td>
                  <td className="p-4"><StatusBadge status={user.status} /></td>
                  <td className="p-4 text-sm text-slate-500">{user.joined}</td>
                  <td className="p-4 text-sm font-medium">{user.events}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all" title="Reset mật khẩu">
                        <Icon name="key" size="sm" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all" title="Chỉnh sửa">
                        <Icon name="edit" size="sm" />
                      </button>
                      <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        user.status === 'locked'
                          ? 'bg-green-100 text-green-600 hover:bg-green-600 hover:text-white'
                          : 'bg-red-100 text-red-600 hover:bg-red-600 hover:text-white'
                      }`} title={user.status === 'locked' ? 'Mở khóa' : 'Khóa'}>
                        <Icon name={user.status === 'locked' ? 'lock_open' : 'lock'} size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-slate-50/30 border-t border-slate-200">
            <Pagination current={1} total={12} label="Hiển thị 5 trong 12,450 người dùng" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminUserManagement
