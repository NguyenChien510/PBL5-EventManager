import { Icon, StatCard, Pagination, Loader } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'
import { useState, useEffect } from 'react'
import { UserService } from '../services/userService'
import { toast } from 'react-hot-toast'

const UserAvatar = ({ src, name, role, size = 'md' }: { src?: string; name?: string; role?: string; size?: 'md' | 'lg' }) => {
  const [error, setError] = useState(false)
  const firstLetter = name?.substring(0, 1).toUpperCase() || '?'
  
  const roleName = (role || '').toUpperCase().replace('ROLE_', '')
  
  const gradientClasses = roleName.includes('ADMIN') 
    ? 'from-rose-600 via-red-500 to-orange-500' 
    : roleName.includes('ORGANIZER')
    ? 'from-amber-500 via-orange-500 to-yellow-400'
    : 'from-blue-600 via-cyan-500 to-sky-400'

  const sizeClasses = size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-10 h-10 text-sm font-bold'
  const borderClasses = size === 'lg' ? 'border-4 border-white shadow-lg' : 'border border-slate-200 shadow-sm'

  if (src && !error) {
    return (
      <img 
        src={src} 
        alt={name} 
        onError={() => setError(true)}
        className={`${sizeClasses} rounded-full object-cover ${borderClasses}`} 
      />
    )
  }
  
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${gradientClasses} flex items-center justify-center font-black text-white uppercase select-none ${size === 'lg' ? 'shadow-xl shadow-indigo-100 border-4 border-white' : 'shadow-md border border-white/30'}`}>
      {firstLetter}
    </div>
  )
}

const sidebarConfig = adminSidebarConfig

const AdminUserManagement = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Tất cả')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (selectedUser) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedUser]);

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5

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

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const filteredUsers = users.filter(user => {
    // Tab Filter
    if (activeTab !== 'Tất cả') {
      const role = (user.role?.name || '').replace('ROLE_', '').toLowerCase()
      if (role !== activeTab.toLowerCase()) return false;
    }
    
    // Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const name = (user.fullName || '').toLowerCase();
      return email.includes(term) || name.includes(term);
    }

    return true;
  })

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = {
    total: users.length,
    admins: users.filter(u => (u.role?.name || '').includes('ADMIN')).length,
    organizers: users.filter(u => (u.role?.name || '').includes('ORGANIZER')).length,
    regularUsers: users.filter(u => (u.role?.name || '').includes('USER') && !(u.role?.name || '').includes('ADMIN') && !(u.role?.name || '').includes('ORGANIZER')).length
  }
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader 
        title="Quản lý Người dùng" 
        searchPlaceholder="Tìm người dùng..." 
        searchValue={searchTerm}
        onSearch={(v) => {
            setSearchTerm(v);
            setCurrentPage(1);
        }}
      />
      <div className="p-6 space-y-6 animate-slide-up">
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
                  className={`text-sm font-bold transition-all cursor-pointer ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

          </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-visible p-1">
          <div className="overflow-visible">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {['Người dùng', 'Vai trò', 'Ngày tham gia'].map((h) => (
                    <th key={h} className={`p-4 text-xs font-bold uppercase tracking-wider text-slate-400`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                        <Loader className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm text-slate-400 font-medium italic">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 italic">Không có người dùng nào.</td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr 
                        key={user.id} 
                        onClick={() => setSelectedUser(user)}
                        className="group hover:bg-white transition-all duration-300 cursor-pointer hover:scale-[1.01] relative hover:z-10 hover:shadow-xl"
                    >
                      <td className="p-4 relative">
                        {/* Hover Border Accent */}
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-r-full" />
                        
                        <div className="flex items-center gap-3">
                          <UserAvatar src={user.avatar} name={user.fullName} role={user.role?.name} />
                          <div>
                            <p className="font-bold text-sm text-slate-900">{user.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block ${
                          (user.role?.name || '').toUpperCase().includes('ADMIN') ? 'bg-red-600 text-white shadow-sm shadow-red-200' :
                          (user.role?.name || '').toUpperCase().includes('ORGANIZER') ? 'bg-orange-500 text-white shadow-sm shadow-orange-200' :
                          'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        }`}>
                          {user.role?.name?.replace('ROLE_', '') || 'USER'}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}
                      </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-2.5 bg-slate-50/30 border-t border-slate-200">
            <Pagination 
                current={currentPage} 
                total={totalPages} 
                onPageChange={(page) => setCurrentPage(page)}
                label={`Hiển thị ${paginatedUsers.length} trên ${filteredUsers.length} người dùng`} 
            />
          </div>
        </div>
      </div>
    </div>

    {/* Edit User Modal */}
    {selectedUser && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
          onClick={() => setSelectedUser(null)} 
        />
        <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/20">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                <Icon name="manage_accounts" size="sm" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Chi tiết người dùng</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #{selectedUser.id}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <UserAvatar src={selectedUser.avatar} name={selectedUser.fullName} role={selectedUser.role?.name} size="lg" />
              <div>
                <h4 className="text-lg font-black text-slate-900">{selectedUser.fullName}</h4>
                <p className="text-sm font-bold text-slate-500">{selectedUser.email}</p>
                <div className="mt-2 flex gap-2">
                   <span className="px-2 py-1 bg-primary text-white text-[10px] font-black uppercase rounded-lg tracking-wider">
                     {selectedUser.role?.name?.replace('ROLE_', '')}
                   </span>
                   <span className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-lg tracking-wider">
                     {selectedUser.status || 'ACTIVE'}
                   </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <input 
                  type="text" 
                  disabled
                  value={selectedUser.fullName}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                <input 
                  type="text" 
                  disabled
                  value={selectedUser.phone || 'Chưa cập nhật'}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
            <button
              onClick={() => setSelectedUser(null)}
              className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-50 transition-all uppercase"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                toast.success('Đã gửi yêu cầu reset mật khẩu');
                setSelectedUser(null);
              }}
              className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all uppercase"
            >
              Reset mật khẩu
            </button>
          </div>
        </div>
      </div>
    )}
  </DashboardLayout>
)
}

export default AdminUserManagement
