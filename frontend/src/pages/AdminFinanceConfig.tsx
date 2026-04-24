import { useState, useEffect } from 'react'
import { Icon, StatCard } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'
import { apiClient } from '@/utils/axios'
import { toast } from 'react-toastify'

const sidebarConfig = adminSidebarConfig

const categories = [
  { name: 'Âm nhạc', commission: '10%', fee: '5.000đ', status: true },
  { name: 'Công nghệ', commission: '8%', fee: '10.000đ', status: true },
  { name: 'Nghệ thuật', commission: '12%', fee: '3.000đ', status: true },
  { name: 'Thể thao', commission: '10%', fee: '5.000đ', status: false },
  { name: 'Ẩm thực', commission: '15%', fee: '2.000đ', status: true },
]

const AdminFinanceConfig = () => {
  const [config, setConfig] = useState({
    defaultCommissionRate: '10',
    fixedFeePerTicket: '5000',
    minWithdrawalAmount: '500000',
    withdrawalProcessTime: '1-3 ngày làm việc'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await apiClient.get('/admin/finance/config')
      if (res.data) setConfig(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Không thể tải cấu hình tài chính')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await apiClient.post('/admin/finance/config', config)
      toast.success('Lưu cấu hình thành công')
    } catch (err) {
      console.error(err)
      toast.error('Lưu cấu hình thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Cấu hình Tài chính" subtitle="Quản lý phí nền tảng & hoa hồng" />
      <div className="p-5 space-y-5 animate-slide-down">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard label="Chờ thanh toán" value="125M" icon="hourglass_empty" iconBg="bg-orange-100" iconColor="text-orange-500" />
          <StatCard label="Hoa hồng mặc định" value={`${config.defaultCommissionRate}%`} icon="percent" />
          <StatCard label="Phí cố định / vé" value={`${parseInt(config.fixedFeePerTicket).toLocaleString('vi-VN')}đ`} icon="receipt" iconBg="bg-green-100" iconColor="text-green-600" />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ animationDelay: '100ms' }}>
          <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold flex items-center gap-2"><Icon name="tune" className="text-indigo-600" /> Cài đặt chung</h3>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Tỷ lệ hoa hồng mặc định (%)</label>
              <input type="number" value={config.defaultCommissionRate} onChange={e => setConfig({...config, defaultCommissionRate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Phí cố định trên mỗi vé (VNĐ)</label>
              <input type="number" value={config.fixedFeePerTicket} onChange={e => setConfig({...config, fixedFeePerTicket: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Ngưỡng rút tiền tối thiểu (VNĐ)</label>
              <input type="number" value={config.minWithdrawalAmount} onChange={e => setConfig({...config, minWithdrawalAmount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Thời gian xử lý rút tiền</label>
              <select value={config.withdrawalProcessTime} onChange={e => setConfig({...config, withdrawalProcessTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none">
                <option value="1-3 ngày làm việc">1-3 ngày làm việc</option>
                <option value="3-5 ngày">3-5 ngày</option>
                <option value="7 ngày">7 ngày</option>
              </select>
            </div>
            <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors w-full sm:w-auto">
              {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>

          <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Icon name="category" className="text-indigo-600" /> Hoa hồng theo thể loại</h3>
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
