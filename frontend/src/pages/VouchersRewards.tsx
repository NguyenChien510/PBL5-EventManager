import { useState, useEffect } from 'react'
import { Icon, Avatar, Loader } from '../components/ui'
import { DashboardLayout } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'
import { apiClient } from '../utils/axios'

const sidebarConfig = userSidebarConfig

const VouchersRewards = () => {
  const [user, setUser] = useState<any>(null)
  const [availableRewards, setAvailableRewards] = useState<any[]>([])
  const [myCoupons, setMyCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exchanging, setExchanging] = useState(false)

  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchProfile(),
          fetchRewards(),
          fetchMyCoupons()
        ])
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/users/me')
      setUser(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRewards = async () => {
    try {
      const res = await apiClient.get('/coupons/available')
      setAvailableRewards(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMyCoupons = async () => {
    try {
      const res = await apiClient.get('/coupons/my')
      setMyCoupons(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleExchange = async (couponId: number, cost: number) => {
    if ((user?.loyaltyPoints || 0) < cost) {
      alert('Không đủ điểm để đổi mã này')
      return
    }

    setExchanging(true)
    try {
      await apiClient.post(`/coupons/exchange?couponId=${couponId}`)
      await Promise.all([fetchProfile(), fetchMyCoupons()])
      alert('Đổi mã thành công! Kiểm tra trong "Mã của tôi"')
    } catch (err) {
      alert('Có lỗi xảy ra khi đổi mã')
    } finally {
      setExchanging(false)
    }
  }

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader className="w-12 h-12 text-primary" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header 
        className="h-24 px-12 flex items-center justify-between sticky top-0 z-40 bg-background-light/80 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700"
      >
        <div>
          <h2 className="text-2xl font-black text-slate-900">Ưu đãi &amp; Quà tặng</h2>
          <p className="text-sm font-medium text-slate-500">Đổi điểm thưởng lấy các đặc quyền giới hạn.</p>
        </div>
        <div className="flex items-center gap-8">
          <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 flex items-center gap-3">
            <Icon name="loyalty" className="text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Điểm của bạn</span>
              <span className="text-lg font-black text-slate-900">{(user?.loyaltyPoints || 0).toLocaleString()} <span className="text-xs font-medium text-slate-400">pts</span></span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div className="flex items-center gap-4">
            <Avatar src={sidebarConfig.user.avatar} size="lg" className="rounded-2xl shadow-md border-2 border-white" />
          </div>
        </div>
      </header>

      <div className="px-12 space-y-12 pb-20 mt-4">
        {/* Available Rewards */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="section-title"><span className="section-dot" /> Đổi điểm nhận mã giảm giá</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableRewards.length > 0 ? availableRewards.map((v, i) => (
              <div 
                key={v.id} 
                className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <div className="h-44 relative flex flex-col justify-end overflow-hidden">
                   {v.imageUrl ? (
                     <img src={v.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={v.code} />
                   ) : (
                     <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                   
                   <div className="relative p-8 z-10">
                     <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                       <Icon name="confirmation_number" className="text-white/40" />
                     </div>
                     <h4 className="text-3xl font-black text-white mb-1">GIẢM {v.discountValue <= 100 ? `${v.discountValue}%` : `${(v.discountValue / 1000).toLocaleString()}K`}</h4>
                     <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Cho mọi đơn hàng trên hệ thống</p>
                   </div>
                </div>
                <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Chi phí</span>
                      <span className="text-xl font-black text-primary">{v.pointCost.toLocaleString()} <span className="text-xs font-medium opacity-50">pts</span></span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hạn đổi</span>
                      <span className="text-xs font-bold text-slate-700">31/12/2024</span>
                    </div>
                  </div>
                  <button 
                    disabled={(user?.loyaltyPoints || 0) < v.pointCost || exchanging}
                    onClick={() => handleExchange(v.id, v.pointCost)}
                    className={`w-full py-4 rounded-2xl text-xs font-black transition-all ${
                      (user?.loyaltyPoints || 0) >= v.pointCost 
                      ? 'bg-primary text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {exchanging ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      (user?.loyaltyPoints || 0) >= v.pointCost ? 'ĐỔI NGAY' : 'KHÔNG ĐỦ ĐIỂM'
                    )}
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <Icon name="history" className="text-slate-300 text-5xl mb-4" />
                <p className="text-slate-500 font-bold tracking-tight">Hiện không có phần thưởng nào khả dụng.</p>
              </div>
            )}
          </div>
        </section>

        {/* My Coupons */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '400ms' }}>
           <h3 className="section-title mb-8"><span className="section-dot" /> Mã giảm giá của tôi</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {myCoupons.map((coupon, i) => (
               <div 
                key={coupon.id} 
                className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-primary/40 transition-colors group animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                style={{ animationDelay: `${500 + i * 100}ms` }}
               >
                 <div className="flex items-center justify-between mb-6">
                   <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                     <Icon name="check_circle" className="text-emerald-500" size="sm" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sẵn sàng dùng</span>
                 </div>
                 <h5 className="text-lg font-black text-slate-900 mb-1">-{coupon.discountValue.toLocaleString()}đ</h5>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-6">{coupon.code}</p>
                 <button className="w-full py-3 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-primary transition-all uppercase tracking-widest">
                   SAO CHÉP MÃ
                 </button>
               </div>
             ))}
             {myCoupons.length === 0 && (
               <div className="col-span-full p-12 text-center bg-white rounded-[2rem] border border-slate-100">
                 <p className="text-slate-400 text-sm font-medium italic">Bạn chưa có mã giảm giá nào. Hãy tích lũy điểm để đổi quà nhé!</p>
               </div>
             )}
           </div>
        </section>

        {/* Featured Banner */}
        <section 
          className="relative h-[300px] rounded-[3rem] overflow-hidden group shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both"
          style={{ animationDelay: '700ms' }}
        >
          <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=2070" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-center px-16 max-w-2xl">
            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-4 border border-white/30 inline-block w-fit">Đặc quyền Diamond</span>
            <h4 className="text-4xl font-black text-white mb-4 leading-tight">Mời bạn bè, nhận ngay<br/>1000 điểm thưởng!</h4>
            <button className="px-8 py-4 bg-white text-primary text-xs font-black rounded-2xl shadow-xl hover:bg-slate-50 transition-all w-fit">MỜI NGAY</button>
          </div>
        </section>
      </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default VouchersRewards

