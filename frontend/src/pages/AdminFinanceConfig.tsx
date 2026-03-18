import { Icon, StatCard } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'

const sidebarConfig = adminSidebarConfig

const categories = [
  { name: 'Âm nhạc', commission: '10%', fee: '5.000đ', status: true },
  { name: 'Công nghệ', commission: '8%', fee: '10.000đ', status: true },
  { name: 'Nghệ thuật', commission: '12%', fee: '3.000đ', status: true },
  { name: 'Thể thao', commission: '10%', fee: '5.000đ', status: false },
  { name: 'Ẩm thực', commission: '15%', fee: '2.000đ', status: true },
]

const AdminFinanceConfig = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Cấu hình Tài chính" subtitle="Quản lý phí nền tảng & hoa hồng" />
      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Chờ thanh toán" value="125M" icon="hourglass_empty" iconBg="bg-orange-100" iconColor="text-orange-500" />
          <StatCard label="Hoa hồng mặc định" value="10%" icon="percent" />
          <StatCard label="Phí cố định / vé" value="5.000đ" icon="receipt" iconBg="bg-green-100" iconColor="text-green-600" />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold flex items-center gap-2"><Icon name="tune" className="text-primary" /> Cài đặt chung</h3>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Tỷ lệ hoa hồng mặc định (%)</label>
              <input type="number" defaultValue="10" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Phí cố định trên mỗi vé (VNĐ)</label>
              <input type="number" defaultValue="5000" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Ngưỡng rút tiền tối thiểu (VNĐ)</label>
              <input type="number" defaultValue="500000" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Thời gian xử lý rút tiền</label>
              <select className="input-field"><option>1-3 ngày làm việc</option><option>3-5 ngày</option><option>7 ngày</option></select>
            </div>
            <button className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-600">Lưu cài đặt</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Icon name="category" className="text-primary" /> Hoa hồng theo thể loại</h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cat.status ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-sm font-bold">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Hoa hồng</p>
                      <p className="text-sm font-bold text-primary">{cat.commission}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Phí/vé</p>
                      <p className="text-sm font-bold">{cat.fee}</p>
                    </div>
                    <div className="flex gap-1">
                      <button className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
                        <Icon name="edit" size="sm" />
                      </button>
                      <button className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                        cat.status
                          ? 'bg-green-50 border-green-200 text-green-600'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <Icon name={cat.status ? 'visibility' : 'visibility_off'} size="sm" />
                      </button>
                    </div>
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

export default AdminFinanceConfig
