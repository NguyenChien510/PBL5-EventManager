import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/ui'
import { EventService } from '../services/eventService'
import { apiClient } from '../utils/axios'
import { useAuthStore } from '../stores/useAuthStore'
import { toast } from 'react-hot-toast'

const paymentMethods = [
  { id: 'momo', label: 'Ví MoMo', logo: 'https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png', color: 'bg-accent-pink' },
  { id: 'vnpay', label: 'VNPay', logo: 'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png', color: 'bg-[#005ba6]' },
]

const SeatSelection = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user } = useAuthStore();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [activePayment, setActivePayment] = useState('momo')

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const [eventData, seatsData] = await Promise.all([
          EventService.getEventById(id),
          EventService.getEventSeats(id)
        ]);
        setEvent(eventData);
        setSeats(seatsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const seatRows = Array.from(new Set(seats.map(s => s.seatNumber.charAt(0)))).sort();
  const seatsPerRow = seats.length > 0 ? Math.max(...seats.map(s => parseInt(s.seatNumber.substring(1)))) : 0;

  const toggleSeat = (seatId: string) => {
    const seatObj = seats.find(s => s.seatNumber === seatId);
    if (!seatObj || seatObj.status !== 'AVAILABLE') return;

    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    )
  }

  const selectedSeatObjects = seats.filter(s => selectedSeats.includes(s.seatNumber));
  const totalTicketPrice = selectedSeatObjects.reduce((sum, s) => sum + s.price, 0);
  const systemFee = selectedSeats.length > 0 ? 25000 : 0
  const totalPrice = totalTicketPrice > 0 ? totalTicketPrice + systemFee : 0;

  const handlePayment = async () => {
    if (selectedSeatObjects.length === 0) return;

    setIsProcessing(true);
    try {
      if (activePayment === 'vnpay' || activePayment === 'momo') {
        const payload = {
          amount: totalPrice,
          orderInfo: `Thanh toan ve ${event?.title?.substring(0, 50) || 'su kien'}`,
          userId: user?.id,
          seatIds: selectedSeatObjects.map(s => s.id),
          paymentMethod: activePayment
        };

        const response = await apiClient.post('/payment/create', payload);
        if (response.data && response.data.url) {
          window.location.href = response.data.url;
        } else {
          toast.error("Hệ thống không kích hoạt được cổng thanh toán");
        }
      } else {
        toast.success(`Đang xử lý ${activePayment}... Dịch vụ chưa mở!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Có lỗi xảy ra khi tạo mã giao dịch");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light font-display">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 h-20">
        <div className="max-w-[1440px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <Icon name="confirmation_number" className="text-white" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight uppercase">Event<span className="text-primary">Platform</span></h1>
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              <Link to="/explore" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">Khám phá</Link>
              <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
              <span className="text-sm font-bold text-primary">Chọn chỗ ngồi & Thanh toán</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2lolVoWnTMF_tJzHB0HICDxEffLk1IEbhad3WFx7IrGcwgMsZ1yjAwl5jAJTmED_lhI8GWcaOuYr1Q9lJYSTQb7uXe2S7aoqaZ7SxZxci4hQGumQrLHo1lzg-kvjUWO0sbbp-JaHsx9xZOedgTu4_crsKxXxz2_sq3uGBkPai-jxAZcDC4SG1iJsIB9uQYDamqJgqWa2ceI0XUnbQst2XT9JHKkVeI994PVmXE4pNAHMgMyHlXsVYezy9806RHYy9QN5yMIKF0Gg" alt="Avatar" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-20">
        <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Seat Map Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-card rounded-3xl p-8 overflow-hidden relative">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-2xl font-black mb-1">Sơ đồ vị trí</h2>
                  <p className="text-sm text-slate-500 font-medium">Chọn ghế yêu thích của bạn cho biểu diễn biểu diễn tại {event?.location || 'địa điểm diễn ra'}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-200"></div>
                    <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
                    <span className="text-[11px] font-bold uppercase text-yellow-600 tracking-wider">VIP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-100 flex items-center justify-center">
                      <Icon name="close" className="text-[8px] text-slate-400" />
                    </div>
                    <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Đã đặt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary"></div>
                    <span className="text-[11px] font-bold uppercase text-primary tracking-wider font-black">Đang chọn</span>
                  </div>
                </div>
              </div>

              {/* Stage */}
              <div className="w-full h-4 bg-slate-200 rounded-full mb-20 relative shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Sân Khấu / Stage</p>
              </div>

              {/* Seat Grid */}
              <div className="seat-map-container">
                {loading ? (
                  <div className="flex items-center justify-center p-12 text-slate-500 italic">Đang tải sơ đồ...</div>
                ) : (
                  <div className="seat-grid-3d flex flex-col items-center gap-4 pb-12">
                    {seatRows.map((row) => (
                      <div key={row} className="flex gap-2">
                        <div className="w-8 flex items-center justify-center text-xs font-bold text-slate-400">{row}</div>
                        <div className="flex gap-2">
                          {Array.from({ length: seatsPerRow }, (_, idx) => {
                            const col = idx + 1
                            const seatId = `${row}${col.toString().padStart(2, '0')}` // Ex: A01

                            const seatObj = seats.find(s => s.seatNumber === seatId);
                            const isBooked = !seatObj || seatObj.status !== 'AVAILABLE';
                            const isSelected = selectedSeats.includes(seatId);
                            const isVip = seatObj && seatObj.ticketTypeName.toLowerCase().includes('vip');

                            // Visual Gap after col 3 and depending on items, 3 and max-3. Let's make it fixed every 4 items or so for visual.
                            // The original mock had gap after col=3 and col=9 (length=12).
                            // Assuming similar pattern to keep visual nice, let's keep gaps dynamic or constant
                            const showGap = (Math.floor(seatsPerRow / 4) !== 0) && (col % Math.floor(seatsPerRow / 4) === 0 && col !== seatsPerRow);

                            return (
                              <div key={seatId} className="flex gap-2">
                                {seatObj ? (
                                  <button
                                    onClick={() => toggleSeat(seatId)}
                                    disabled={isBooked}
                                    title={`${seatId} - ${seatObj.ticketTypeName} - ${new Intl.NumberFormat('vi-VN').format(seatObj.price)}đ`}
                                    className={`seat-item ${isBooked ? 'booked' : isSelected ? 'selected' : isVip ? 'vip-available' : 'available'}`}
                                  >
                                    {isBooked ? <Icon name="close" className="text-[14px]" /> : col}
                                  </button>
                                ) : (
                                  <div className="w-8 h-8 pointer-events-none" />
                                )}
                                {showGap && <div className="w-4 md:w-8 border-r border-slate-100/50"></div>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Selection Card */}
            <div className="glass-card rounded-3xl p-8">
              <h3 className="text-lg font-black mb-6">Phương thức thanh toán</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    onClick={() => setActivePayment(pm.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      activePayment === pm.id 
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 ${pm.color} rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0`}>
                      <img src={pm.logo} alt={pm.label} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-slate-700">{pm.label}</p>
                    </div>
                    {activePayment === pm.id ? (
                      <Icon name="check_circle" className="text-primary" filled />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Summary Area */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="glass-card rounded-3xl p-8 overflow-hidden relative">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-lg shadow-slate-200/50">
                    <img
                      src={event?.posterUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDXA5gI3Jj67HhkZCkCBEWYDtdkCzI6_kVR_8U8d-QEYnBhdxblaFKW2KwGgdbxN5pmIXfKBt3ag6PVVf8QWJ919eU3nJOexqNUYw-OXr32JprRTunkoArYM5QFqhPRmTHcNIggYov5VsmMBrMeCGZC2vxyCTHUMSm0FPx2pqhvPfnHy2MUg4YyNKo35hNgvXtLqdaD83ImEG4knBstaNZht0W5IbX3Gr0qRgrUF24Qyp7Ngl-vA8Pk0GJ-MjmAVEVJJvNwsd2rGqY"}
                      alt="Event" className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="inline-block bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-1 rounded-lg mb-2">{event?.category?.name || 'Sự kiện'}</span>
                    <h3 className="text-base font-black leading-tight line-clamp-2">{event?.title || 'Đang tải...'}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2">
                      {event?.startTime ? new Date(event.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sắp tới'} • {event?.startTime ? new Date(event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Đang cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Vị trí ghế</span>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {selectedSeats.length > 0 ? (
                        selectedSeats.map(seat => (
                          <span key={seat} className="px-2 py-1 bg-primary text-white text-xs font-black rounded-lg">{seat}</span>
                        ))
                      ) : (
                        <span className="text-xs font-bold text-slate-300">Chưa chọn ghế</span>
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-slate-100"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Giá vé ({selectedSeats.length} vé)</span>
                    <span className="text-sm font-black">{new Intl.NumberFormat('vi-VN').format(totalTicketPrice)}đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 group">
                      <span className="text-sm font-medium text-slate-500">Phí hệ thống</span>
                      <Icon name="info" className="text-[14px] text-slate-300 cursor-help" />
                    </div>
                    <span className="text-sm font-black">{new Intl.NumberFormat('vi-VN').format(systemFee)}đ</span>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-2xl p-4 mb-8 border border-primary/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-500">Tổng cộng</span>
                    <span className="text-2xl font-black text-primary">{new Intl.NumberFormat('vi-VN').format(totalPrice)}đ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-right">Đã bao gồm thuế VAT</p>
                </div>

                <button
                  onClick={handlePayment}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98] mb-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedSeats.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Đang tạo giao dịch...' : 'Xác nhận Thanh toán'}
                  {!isProcessing && <Icon name="arrow_forward" />}
                </button>
                <p className="text-[11px] text-center text-slate-400 font-medium px-4 leading-relaxed">
                  Bằng việc nhấn "Xác nhận", bạn đồng ý với <a href="#" className="text-primary hover:underline font-bold">Điều khoản & Điều kiện</a> của EventPlatform.
                </p>
              </div>

              <div className="glass-card rounded-3xl p-6 border-dashed border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                  <Icon name="headset_mic" />
                </div>
                <div>
                  <p className="text-sm font-black">Cần hỗ trợ?</p>
                  <p className="text-xs text-slate-500 font-medium">Hotline 1900 1234 (8:00 - 22:00)</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default SeatSelection
