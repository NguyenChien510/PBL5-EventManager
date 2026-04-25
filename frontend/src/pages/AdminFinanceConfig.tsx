import { useState, useEffect } from 'react'
import { Icon, StatCard } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'
import { apiClient } from '@/utils/axios'
import { toast } from 'react-toastify'

const sidebarConfig = adminSidebarConfig

interface FinanceStats {
  totalRevenue: number
  totalPlatformFee: number
  totalOrders: number
}

const AdminFinanceConfig = () => {
  const [config, setConfig] = useState({
    defaultCommissionRate: '10',
  })
  
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    totalPlatformFee: 0,
    totalOrders: 0,
  })

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
      const [configRes, statsRes] = await Promise.all([
        apiClient.get('/admin/finance/config'),
        apiClient.get('/admin/finance/overview')
      ])
      if (configRes.data) setConfig(configRes.data)
      if (statsRes.data) setStats(statsRes.data)
    } catch (err) {
      console.error(err)
      toast.error('Không thể tải dữ liệu tài chính')
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await apiClient.post('/admin/finance/config', config)
      toast.success('Lưu cấu hình thành công')
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Lưu cấu hình thất bại')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Cấu hình Tài chính" subtitle="Hệ thống thuế & phí dịch vụ nền tảng" />
      
      <div className="p-6 space-y-6 animate-slide-up max-w-7xl">
        {/* Balanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Tổng doanh thu (Gross)" 
            value={formatCurrency(stats.totalRevenue)} 
            icon="payments" 
            iconBg="bg-blue-100" 
            iconColor="text-blue-600" 
          />
          <StatCard 
            label="Lợi nhuận hệ thống" 
            value={formatCurrency(stats.totalPlatformFee)} 
            icon="account_balance_wallet" 
            iconBg="bg-indigo-100" 
            iconColor="text-indigo-600" 
          />
          <StatCard 
            label="Tổng số vé bán ra" 
            value={stats.totalOrders.toString()} 
            icon="confirmation_number" 
            iconBg="bg-purple-100" 
            iconColor="text-purple-600" 
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" style={{ animationDelay: '100ms' }}>
          {/* Config Card - Balanced Size */}
          <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Icon name="tune" className="text-indigo-600" />
                </div>
                Thiết lập thuế nền tảng
              </h3>
              <div className="px-4 py-1.5 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Auto-apply
              </div>
            </div>

            <div className="space-y-6">
              <div className="max-w-md">
                <label className="text-sm font-bold text-slate-500 mb-3 block flex items-center gap-2">
                  Tỷ lệ thuế hệ thống (%)
                </label>
                <div className="relative group">
                  <input 
                    type="number" 
                    value={config.defaultCommissionRate} 
                    onChange={e => setConfig({...config, defaultCommissionRate: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xl font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none group-hover:bg-white"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">%</span>
                </div>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Tỷ lệ phần trăm này sẽ được tự động khấu trừ trực tiếp từ tổng tiền thanh toán của mỗi vé bán ra. 
                  Admin sẽ nhận được khoản này như lợi nhuận vận hành hệ thống.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <button 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-3"
                >
                  <Icon name={loading ? 'sync' : 'save'} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Đang cập nhật...' : 'Cập nhật cấu hình'}
                </button>
              </div>
            </div>
          </div>

          {/* Info Card - Improved Visibility */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-400">
                <Icon name="auto_awesome" size="lg" />
              </div>
              <h4 className="text-xl font-bold">Cơ chế vận hành</h4>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Icon name="verified" size="sm" className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Khấu trừ tự động</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Thuế được tính và khấu trừ ngay tại thời điểm thanh toán thành công.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Icon name="account_balance" size="sm" className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Thanh khoản doanh nghiệp</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Tiền thực nhận của doanh nghiệp là số tiền sau khi đã trừ thuế hệ thống.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>Smart Finance v2.0</span>
              <Icon name="security" size="sm" />
            </div>

            {/* Background Decorations */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminFinanceConfig
