import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'

const seatRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const seatsPerRow = 12

const bookedSeats = ['A3', 'A4', 'B5', 'B6', 'B7', 'C2', 'D8', 'D9', 'E1', 'F3', 'G6', 'G7', 'H10']

const paymentMethods = [
  { id: 'zalopay', label: 'ZaloPay', icon: '💳' },
  { id: 'credit', label: 'Thẻ tín dụng', icon: '💳' },
  { id: 'bank', label: 'Chuyển khoản', icon: '🏦' },
]

const SeatSelection = () => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['C5', 'C6'])
  const [activePayment, setActivePayment] = useState('zalopay')

  const toggleSeat = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    )
  }

  return (
    <div className="min-h-screen bg-background-light font-display">
      {/* Header */}
      <nav className="glass-nav sticky top-0 z-50 border-b border-slate-200/60 px-6 h-16 flex items-center justify-between">
        <Link to="/event" className="flex items-center gap-2 text-slate-500 hover:text-primary">
          <Icon name="arrow_back" /> <span className="text-sm font-medium">Quay lại</span>
        </Link>
        <h1 className="text-lg font-bold">Chọn ghế ngồi</h1>
        <div className="flex items-center gap-2 text-sm font-bold text-rose-500">
          <Icon name="timer" size="sm" /> 14:59
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seat Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon name="music_note" className="text-primary text-2xl" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">SƠN TÙNG M-TP: THE FIRST JOURNEY 2024</h2>
              <p className="text-sm text-slate-500">15 Th12, 2024 • 20:00 • SVĐ Quân khu 7</p>
            </div>
          </div>

          {/* Stage & Seats */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            {/* Stage */}
            <div className="text-center mb-8">
              <div className="inline-block px-20 py-3 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-full">
                <span className="text-sm font-bold text-primary uppercase tracking-widest">Sân khấu</span>
              </div>
            </div>

            {/* Seat Grid */}
            <div className="seat-map-container">
              <div className="seat-grid-3d space-y-2 flex flex-col items-center">
                {seatRows.map((row) => (
                  <div key={row} className="flex items-center gap-1">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{row}</span>
                    {Array.from({ length: seatsPerRow }, (_, col) => {
                      const seatId = `${row}${col + 1}`
                      const isBooked = bookedSeats.includes(seatId)
                      const isSelected = selectedSeats.includes(seatId)
                      return (
                        <button
                          key={seatId}
                          onClick={() => toggleSeat(seatId)}
                          disabled={isBooked}
                          className={`seat-item ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                          title={seatId}
                        >
                          {col + 1}
                        </button>
                      )
                    })}
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{row}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="flex items-center gap-2"><div className="seat-item available w-6 h-6" /><span className="text-xs text-slate-500">Trống</span></div>
              <div className="flex items-center gap-2"><div className="seat-item selected w-6 h-6" /><span className="text-xs text-slate-500">Đang chọn</span></div>
              <div className="flex items-center gap-2"><div className="seat-item booked w-6 h-6" /><span className="text-xs text-slate-500">Đã đặt</span></div>
            </div>
          </div>
        </div>

        {/* Payment Sidebar */}
        <div className="space-y-6">
          {/* Selected Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Icon name="event_seat" className="text-primary" />
              Ghế đã chọn ({selectedSeats.length})
            </h3>
            <div className="space-y-2 mb-4">
              {selectedSeats.map((seat) => (
                <div key={seat} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <span className="text-sm font-bold">Ghế {seat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">1.200.000đ</span>
                    <button onClick={() => toggleSeat(seat)} className="text-slate-400 hover:text-red-500">
                      <Icon name="close" size="sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between py-3 border-t border-slate-100">
              <span className="font-medium text-slate-500">Tổng cộng</span>
              <span className="text-xl font-extrabold text-primary">{(selectedSeats.length * 1200000).toLocaleString()}đ</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Icon name="payment" className="text-primary" />
              Phương thức thanh toán
            </h3>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setActivePayment(pm.id)}
                  className={`payment-method-card w-full flex items-center gap-3 ${activePayment === pm.id ? 'active' : ''}`}
                >
                  <span className="text-2xl">{pm.icon}</span>
                  <span className="font-bold text-sm">{pm.label}</span>
                  {activePayment === pm.id && <Icon name="check_circle" className="text-primary ml-auto" filled />}
                </button>
              ))}
            </div>
          </div>

          {/* Checkout button */}
          <button className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 text-lg">
            <Icon name="lock" /> Thanh toán
          </button>
        </div>
      </div>
    </div>
  )
}

export default SeatSelection
