import { Icon, StatCard, Pagination } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'
import { useState, useEffect } from 'react'
import { UserService } from '../services/userService'
import { toast } from 'react-hot-toast'

const sidebarConfig = adminSidebarConfig

const AdminUserManagement = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Tất cả')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await UserService.getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    if (activeTab === 'Tất cả') return true
    const role = (user.role?.name || '').replace('ROLE_', '').toLowerCase()
    return role === activeTab.toLowerCase()
  })

  const stats = {
    total: users.length,
    admins: users.filter(u => (u.role?.name || '').includes('ADMIN')).length,
    organizers: users.filter(u => (u.role?.name || '').includes('ORGANIZER')).length,
    regularUsers: users.filter(u => (u.role?.name || '').includes('USER') && !(u.role?.name || '').includes('ADMIN') && !(u.role?.name || '').includes('ORGANIZER')).length
  }
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
          <StatCard label="Tổng người dùng" value={stats.total} icon="people" />
          <StatCard label="Quản trị viên" value={stats.admins} icon="security" iconBg="bg-red-100" iconColor="text-red-600" />
          <StatCard label="Nhà tổ chức" value={stats.organizers} icon="business" iconBg="bg-orange-100" iconColor="text-orange-600" />
          <StatCard label="Người dùng" value={stats.regularUsers} icon="person" iconBg="bg-blue-100" iconColor="text-blue-600" />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex gap-6">
              {['Tất cả', 'Organizer', 'User', 'Admin'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-bold transition-all ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50">
              <Icon name="download" size="sm" /> Xuất danh sách
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                {['Người dùng', 'Vai trò', 'Ngày tham gia', 'Thao tác'].map((h) => (
                  <th key={h} className={`p-4 text-xs font-bold text-slate-400 uppercase ${h === 'Thao tác' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Không có người dùng nào.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                          {user.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{user.fullName}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block ${
                        (user.role?.name || '').toUpperCase().includes('ADMIN') ? 'bg-red-600 text-white' :
                        (user.role?.name || '').toUpperCase().includes('ORGANIZER') ? 'bg-orange-500 text-white' :
                        'bg-blue-600 text-white'
                      }`}>
                        {user.role?.name?.replace('ROLE_', '') || 'USER'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm border border-slate-100" title="Reset mật khẩu">
                          <Icon name="key" size="sm" />
                        </button>
                        <button className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm border border-slate-100" title="Chỉnh sửa">
                          <Icon name="edit" size="sm" />
                        </button>
                        <button className="w-9 h-9 rounded-xl bg-rose-50 text-rose-400 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100" title="Xóa người dùng">
                          <Icon name="delete" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4 bg-slate-50/30 border-t border-slate-200">
            <Pagination current={1} total={1} label={`Hiển thị ${filteredUsers.length} người dùng`} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminUserManagement
