import { useState, useEffect } from 'react'
import { Icon, Avatar, Loader } from '../components/ui'
import { DashboardLayout } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'
import { apiClient } from '../utils/axios'
import { toast } from 'react-hot-toast'

const sidebarConfig = userSidebarConfig

const VouchersRewards = () => {
  const [user, setUser] = useState<any>(null)
  const [availableRewards, setAvailableRewards] = useState<any[]>([])
  const [myCoupons, setMyCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exchangingId, setExchangingId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

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
      toast.error(
        <div className="flex flex-col gap-0.5 text-left">
          <span className="font-black text-slate-900 text-sm">Không đủ điểm thưởng!</span>
          <span className="text-[11px] text-slate-500 font-semibold">Hãy tham gia thêm sự kiện để tích lũy điểm nhé.</span>
        </div>,
        {
          icon: '⚠️',
          duration: 3500,
          style: {
            borderRadius: '20px',
            background: '#ffffff',
            color: '#334155',
            padding: '12px 20px',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.08)',
          },
        }
      )
      return
    }

    setExchangingId(couponId)
    try {
      await apiClient.post(`/coupons/exchange?couponId=${couponId}`)
      await Promise.all([fetchProfile(), fetchMyCoupons()])
      toast.success(
        <div className="flex flex-col gap-0.5 text-left">
          <span className="font-black text-emerald-600 text-sm">Đổi quà thành công! 🎉</span>
          <span className="text-[11px] text-slate-500 font-semibold">Mã giảm giá đã có trong mục "Mã của tôi".</span>
        </div>,
        {
          icon: '🎁',
          duration: 4500,
          style: {
            borderRadius: '20px',
            background: '#ffffff',
            color: '#334155',
            padding: '12px 20px',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            boxShadow: '0 12px 30px -5px rgba(16, 185, 129, 0.12)',
          },
        }
      )
    } catch (err) {
      toast.error(
        <div className="flex flex-col gap-0.5 text-left">
          <span className="font-black text-rose-600 text-sm">Giao dịch thất bại</span>
          <span className="text-[11px] text-slate-500 font-semibold">Có lỗi xảy ra khi đổi mã. Vui lòng thử lại!</span>
        </div>,
        {
          icon: '❌',
          style: {
            borderRadius: '20px',
            background: '#ffffff',
            color: '#334155',
            padding: '12px 20px',
            border: '1px solid rgba(244, 63, 94, 0.12)',
            boxShadow: '0 12px 30px -5px rgba(244, 63, 94, 0.12)',
          },
        }
      )
    } finally {
      setExchangingId(null)
    }
  }

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success(
      <div className="flex flex-col gap-0.5 text-left">
        <span className="font-black text-slate-900 text-sm">Đã sao chép mã!</span>
        <span className="text-[11px] text-slate-500 font-semibold">Sử dụng ngay mã này tại trang thanh toán vé.</span>
      </div>,
      {
        icon: '📋',
        duration: 3000,
        style: {
          borderRadius: '20px',
          background: '#ffffff',
          color: '#334155',
          padding: '12px 20px',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.08)',
        },
      }
    )
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
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
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hạn đổi </span>
                          <span className="text-xs font-bold text-slate-700">31/12/2026</span>
                        </div>
                      </div>
                      <button
                        disabled={(user?.loyaltyPoints || 0) < v.pointCost || exchangingId !== null}
                        onClick={() => handleExchange(v.id, v.pointCost)}
                        className={`w-full py-4 rounded-2xl text-xs font-black transition-all ${(user?.loyaltyPoints || 0) >= v.pointCost
                          ? 'bg-primary text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                      >
                        {exchangingId === v.id ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myCoupons.map((coupon, i) => {
                  const isCopied = copiedId === coupon.id
                  return (
                    <div
                      key={coupon.id}
                      className="relative flex bg-white rounded-[1.5rem] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-slate-200/60 hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-500 group animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both min-h-[100px]"
                      style={{ animationDelay: `${500 + i * 80}ms` }}
                    >
                      {/* Left Side: Slim Ticket Gradient Stub */}
                      <div className="w-24 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center p-3 text-white relative shrink-0 overflow-hidden">
                        {/* Subtle decorative circles inside stub */}
                        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,_#ffffff_2px,_transparent_0)] bg-[length:6px_6px]" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center select-none">
                          <span className="text-[9px] font-black tracking-[0.15em] uppercase opacity-75 mb-0.5">GIẢM</span>
                          <span className="text-xl font-black tracking-tighter drop-shadow-sm leading-none my-0.5">
                            {coupon.discountValue <= 100 ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}đ`}
                          </span>
                          <Icon name="confirmation_number" size="xs" className="text-white/50 mt-0.5" />
                        </div>

                        {/* Ticket Punch Holes */}
                        <div className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-slate-50 rounded-full border border-slate-100 z-20" />
                        <div className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-slate-50 rounded-full border border-slate-100 z-20" />
                      </div>

                      {/* Right Side: Slim Side-by-Side Details */}
                      <div className="flex-1 py-3 px-5 bg-white flex flex-col justify-center gap-1 relative">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Sẵn sàng dùng
                          </span>
                          <div className="flex items-center gap-0.5 text-slate-300 group-hover:text-amber-400 transition-colors duration-300">
                            <Icon name="verified" size="xs" className="fill-current scale-75" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Mã ưu đãi</p>
                            <p className="text-sm font-black tracking-wider text-slate-700 font-mono truncate select-all group-hover:text-slate-900 transition-colors">{coupon.code}</p>
                          </div>

                          <button
                            onClick={() => handleCopyCode(coupon.id, coupon.code)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-1 shrink-0 hover:scale-105 active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-900 text-white hover:bg-primary shadow-sm hover:shadow-md'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Icon name="check" size="xs" className="scale-90" /> ĐÃ SAO CHÉP
                              </>
                            ) : (
                              <>
                                <Icon name="content_copy" size="xs" className="scale-90" /> SAO CHÉP
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {myCoupons.length === 0 && (
                  <div className="col-span-full py-16 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Icon name="local_activity" size="lg" />
                    </div>
                    <p className="text-slate-600 font-black tracking-tight">Chưa có mã giảm giá</p>
                    <p className="text-slate-400 text-xs mt-1">Hãy tích lũy điểm và tiến hành đổi thưởng phía trên nhé!</p>
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
                <h4 className="text-4xl font-black text-white mb-4 leading-tight">Mời bạn bè, nhận ngay<br />1000 điểm thưởng!</h4>
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

