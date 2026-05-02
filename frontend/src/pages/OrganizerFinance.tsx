import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, StatCard, Loader } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'
import { apiClient } from '@/utils/axios'

const sidebarConfig = organizerSidebarConfig

interface OrderDTO {
  id: number;
  totalAmount: number;
  platformFee: number | null;
  status: string;
  purchaseDate: string;
  eventTitle: string;
  userName?: string;
  userEmail?: string;
  eventId?: number;
  eventPosterUrl?: string;
}

const OrganizerFinance = () => {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [chartData, setChartData] = useState<number[]>(Array(12).fill(0))
  const navigate = useNavigate()
  const itemsPerPage = 5

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const [transactionsRes, statsRes] = await Promise.all([
          apiClient.get('/organizer/finance/transactions'),
          apiClient.get('/organizer/finance/stats')
        ])
        if (transactionsRes.data) setOrders(transactionsRes.data)
        if (statsRes.data) setChartData(statsRes.data)
      } catch (err) {
        console.error('Error fetching finance data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const totalRevenue = orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.totalAmount, 0)
  const platformFee = orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + (o.platformFee || 0), 0)
  const netIncome = totalRevenue - platformFee



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  // Pagination Logic
  const totalPages = Math.ceil(orders.length / itemsPerPage)
  const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader className="w-12 h-12 text-primary" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PageHeader title="Quyết toán Tài chính" subtitle="Tổng quan doanh thu & chi phí" />
      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-down">
          {/* Total Revenue - Emerald Gradient */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2rem] shadow-xl shadow-emerald-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Icon name="payments" size="xl" className="text-white scale-[3]" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-50/80 mb-1">Tổng doanh thu</p>
              <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>

          {/* Net Income - Indigo Gradient */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2rem] shadow-xl shadow-indigo-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Icon name="account_balance" size="xl" className="text-white scale-[3]" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-50/80 mb-1">Thu nhập ròng (Thực nhận)</p>
              <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(netIncome)}</p>
            </div>
          </div>

          {/* Platform Fee - Rose Gradient */}
          <div className="bg-gradient-to-br from-rose-500 to-red-600 p-8 rounded-[2rem] shadow-xl shadow-rose-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Icon name="receipt_long" size="xl" className="text-white scale-[3]" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-50/80 mb-1">Thuế / Phí nền tảng</p>
              <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(platformFee)}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="grid grid-cols-1 gap-5 animate-slide-down" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-900">Biểu đồ doanh thu</h3>
                <p className="text-xs text-slate-500 font-medium">Theo tháng trong năm (VND)</p>
              </div>
            </div>
            <div className="flex items-end gap-4 sm:gap-6 h-56 mt-4 px-2">
              {chartData.map((val, i) => {
                const maxVal = Math.max(...chartData, 1000000);
                const heightPercent = (val / maxVal) * 100;
                return (
                  <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-3 group relative cursor-pointer">
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 whitespace-nowrap">
                      {formatCurrency(val)}
                    </div>

                    <span className="text-[10px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-1 duration-300">
                      {val > 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}K`}
                    </span>
                    <div className="w-full flex-1 bg-slate-50/80 rounded-t-xl relative overflow-hidden ring-1 ring-inset ring-slate-100 border-b-2 border-slate-200">
                      <div className="absolute bottom-0 w-full rounded-t-xl transition-all duration-700 ease-out group-hover:brightness-110 bg-gradient-to-t from-indigo-600 to-blue-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                        style={{ height: `${Math.max(heightPercent, 2)}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase group-hover:text-indigo-600 transition-colors">T{i + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden animate-slide-down" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h3 className="font-black text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                <Icon name="receipt" size="sm" />
              </div>
              Lịch sử giao dịch
            </h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 px-6 py-3 rounded-xl shadow-lg shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <Icon name="download" size="sm" /> Xuất CSV
            </button>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50">
                  {['Mã GD', 'Sự kiện', 'Khách hàng', 'Tổng thu', 'Phí nền tảng', 'Thực nhận', 'Ngày', 'Trạng thái'].map((h) => (
                    <th key={h} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-bold text-sm italic">Chưa có giao dịch nào phát sinh</td>
                  </tr>
                )}
                {paginatedOrders.map((tx) => {
                  const txFee = tx.platformFee || 0;
                  const txNet = tx.totalAmount - txFee;
                  return (
                    <tr key={tx.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="p-6 text-xs font-bold text-slate-400 font-mono">#{tx.id}</td>
                      <td className="p-6">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group/event"
                          onClick={() => {
                            if (tx.eventId) {
                              navigate(`/organizer/events/${tx.eventId}/manage`, { state: { tab: 'finance' } });
                            }
                          }}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            {tx.eventPosterUrl ? (
                              <img src={tx.eventPosterUrl} alt={tx.eventTitle} className="w-full h-full object-cover group-hover/event:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon name="event" className="text-slate-400" size="sm" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-black text-slate-800 tracking-tight group-hover/event:text-primary transition-colors max-w-[200px] truncate" title={tx.eventTitle}>
                            {tx.eventTitle}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{tx.userName || 'Ẩn danh'}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{tx.userEmail || ''}</p>
                      </td>
                      <td className="p-6 text-sm font-black whitespace-nowrap text-emerald-600">{formatCurrency(tx.totalAmount)}</td>
                      <td className="p-6 text-sm font-bold whitespace-nowrap text-rose-500">-{formatCurrency(txFee)}</td>
                      <td className="p-6 text-sm font-black whitespace-nowrap text-indigo-600">{formatCurrency(txNet)}</td>
                      <td className="p-6 text-xs font-bold text-slate-500 whitespace-nowrap">{new Date(tx.purchaseDate).toLocaleString('vi-VN')}</td>
                      <td className="p-6 whitespace-nowrap">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block border shadow-sm ${tx.status === 'COMPLETED' ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100' :
                            tx.status === 'PENDING' ? 'bg-orange-400 text-white border-orange-500 shadow-orange-100' :
                              'bg-slate-400 text-white border-slate-500 shadow-slate-100'
                          }`}>{tx.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {orders.length > itemsPerPage && (
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, orders.length)} / {orders.length} giao dịch
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                >
                  <Icon name="chevron_left" size="sm" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                >
                  <Icon name="chevron_right" size="sm" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default OrganizerFinance
