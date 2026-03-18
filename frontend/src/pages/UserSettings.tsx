import { Icon, Avatar } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'

const sidebarConfig = userSidebarConfig

const UserSettings = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Cài đặt Tài khoản" />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="font-bold flex items-center gap-2"><Icon name="person" className="text-primary" /> Thông tin cá nhân</h3>
              <div className="flex items-center gap-6 mb-4">
                <Avatar src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2lolVoWnTMF_tJzHB0HICDxEffLk1IEbhad3WFx7IrGcwgMsZ1yjAwl5jAJTmED_lhI8GWcaOuYr1Q9lJYSTQb7uXe2S7aoqaZ7SxZxci4hQGumQrLHo1lzg-kvjUWO0sbbp-JaHsx9xZOedgTu4_crsKxXxz2_sq3uGBkPai-jxAZcDC4SG1iJsIB9uQYDamqJgqWa2ceI0XUnbQst2XT9JHKkVeI994PVmXE4pNAHMgMyHlXsVYezy9806RHYy9QN5yMIKF0Gg" size="xl" className="rounded-2xl" />
                <div>
                  <button className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg mb-2">Đổi ảnh đại diện</button>
                  <p className="text-xs text-slate-400">JPG, PNG tối đa 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Họ</label>
                  <input type="text" defaultValue="Nguyen" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Tên</label>
                  <input type="text" defaultValue="Alex" className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Email</label>
                <input type="email" defaultValue="alex.nguyen@example.com" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Số điện thoại</label>
                <input type="tel" defaultValue="+84 912 345 678" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Ngày sinh</label>
                <input type="date" className="input-field" />
              </div>
              <button className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-600">Cập nhật</button>
            </div>

            {/* Password */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="font-bold flex items-center gap-2"><Icon name="lock" className="text-primary" /> Đổi mật khẩu</h3>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Mật khẩu hiện tại</label>
                <input type="password" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Mật khẩu mới</label>
                <input type="password" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Xác nhận mật khẩu mới</label>
                <input type="password" className="input-field" />
              </div>
              <button className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-600">Đổi mật khẩu</button>
            </div>
          </div>

          {/* Side Settings */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Icon name="notifications" className="text-primary" /> Thông báo</h3>
              <div className="space-y-4">
                {[
                  { label: 'Thông báo qua email', desc: 'Nhận cập nhật về sự kiện mới', default: true },
                  { label: 'Thông báo đẩy', desc: 'Thông báo trên trình duyệt', default: false },
                  { label: 'Nhắc nhở sự kiện', desc: '24h trước sự kiện', default: true },
                  { label: 'Khuyến mãi', desc: 'Mã giảm giá & ưu đãi', default: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Language & Region */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold flex items-center gap-2"><Icon name="language" className="text-primary" /> Ngôn ngữ & Khu vực</h3>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Ngôn ngữ</label>
                <select className="input-field"><option>Tiếng Việt</option><option>English</option></select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Múi giờ</label>
                <select className="input-field"><option>UTC+7 (Hà Nội)</option></select>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4 text-red-500 flex items-center gap-2"><Icon name="warning" /> Vùng nguy hiểm</h3>
              <p className="text-sm text-slate-500 mb-4">Xóa tài khoản sẽ không thể hoàn tác. Tất cả dữ liệu sẽ bị mất.</p>
              <button className="w-full py-2.5 border border-red-500 text-red-500 text-sm font-bold rounded-xl hover:bg-red-50">Xóa tài khoản</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default UserSettings
