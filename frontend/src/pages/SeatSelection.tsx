import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui'
import { EventService } from '../services/eventService'
import { apiClient } from '../utils/axios'
import { useAuthStore } from '../stores/useAuthStore'
import { toast } from 'react-hot-toast'
import { Stage, Layer, Circle, Text, Group } from 'react-konva'

const paymentMethods = [
  { id: 'momo', label: 'Ví MoMo', logo: 'https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png', color: 'bg-accent-pink' },
  { id: 'vnpay', label: 'VNPay', logo: 'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png', color: 'bg-[#005ba6]' },
]

const SeatSelection = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user } = useAuthStore();
  
  // For mapped seats
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([])
  
  // For GA/No map seats
  const [quantities, setQuantities] = useState<{[typeName: string]: number}>({})

  const [activePayment, setActivePayment] = useState('momo')

  // Canvas interaction states
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);

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

  // Group tickets for Non-map mode
  const groupedTickets = useMemo(() => {
    const group = new Map();
    seats.forEach(seat => {
      const name = seat.ticketTypeName;
      if (!group.has(name)) {
        group.set(name, {
          name: name,
          price: seat.price,
          color: seat.color || '#6366f1',
          availableSeats: [],
          totalSeats: 0,
        });
      }
      const info = group.get(name);
      info.totalSeats++;
      if (seat.status === 'AVAILABLE') {
        info.availableSeats.push(seat);
      }
    });
    return Array.from(group.values());
  }, [seats]);

  // Unique colors and names for Legend
  const legendItems = useMemo(() => {
    const unique = new Map();
    seats.forEach(s => {
      if(!unique.has(s.ticketTypeName)) {
         unique.set(s.ticketTypeName, { name: s.ticketTypeName, color: s.color || '#6366f1'});
      }
    });
    return Array.from(unique.values());
  }, [seats]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Limit scaling
    if (newScale < 0.5 || newScale > 3) return;

    setStageScale(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const toggleSeat = (seat: any) => {
    if (seat.status !== 'AVAILABLE') return;
    
    setSelectedSeatIds((prev) =>
      prev.includes(seat.id) ? prev.filter((sid) => sid !== seat.id) : [...prev, seat.id]
    )
  }

  const updateQuantity = (typeName: string, change: number, maxAvailable: number) => {
    setQuantities(prev => {
      const current = prev[typeName] || 0;
      const next = Math.max(0, Math.min(maxAvailable, current + change));
      return { ...prev, [typeName]: next };
    });
  };

  // Derived current total selection
  const hasSeatMap = event?.hasSeatMap === true;
  
  let finalSelectedSeatIds: number[] = [];
  let finalSeatObjects: any[] = [];

  if (hasSeatMap) {
    finalSeatObjects = seats.filter(s => selectedSeatIds.includes(s.id));
    finalSelectedSeatIds = finalSeatObjects.map(s => s.id);
  } else {
    // Aggregate from quantities
    groupedTickets.forEach(group => {
      const qty = quantities[group.name] || 0;
      const toPick = group.availableSeats.slice(0, qty);
      finalSeatObjects = [...finalSeatObjects, ...toPick];
      finalSelectedSeatIds = [...finalSelectedSeatIds, ...toPick.map((s: any) => s.id)];
    });
  }

  const totalTicketPrice = finalSeatObjects.reduce((sum, s) => sum + s.price, 0);
  const totalPrice = totalTicketPrice;

  const handlePayment = async () => {
    if (finalSelectedSeatIds.length === 0) return;

    setIsProcessing(true);
    try {
      if (activePayment === 'vnpay' || activePayment === 'momo') {
        const payload = {
          amount: totalPrice,
          orderInfo: `Thanh toan ve ${event?.title?.substring(0, 50) || 'su kien'}`,
          userId: user?.id,
          seatIds: finalSelectedSeatIds,
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
        </div>
      </header>

      <main className="pt-28 pb-20">
        <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-card rounded-3xl p-8 overflow-hidden relative flex flex-col min-h-[600px]">
              <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-bold mb-6 group/back cursor-pointer bg-transparent border-none p-0 w-fit">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/back:bg-primary group-hover/back:text-white transition-all">
                  <Icon name="arrow_back" size="sm" />
                </div>
                <span className="text-xs uppercase tracking-widest">Quay lại sự kiện</span>
              </button>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-black mb-1">
                    {hasSeatMap ? 'Sơ đồ vị trí' : 'Chọn loại vé'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {hasSeatMap ? 'Vui lòng chọn ghế yêu thích của bạn trên bản đồ.' : 'Vui lòng nhập số lượng vé bạn muốn mua.'}
                  </p>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {legendItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{item.name}</span>
                    </div>
                  ))}
                  <div className="h-3 w-px bg-slate-200 mx-1"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200 flex items-center justify-center"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đã bán</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex-grow flex flex-col items-center justify-center p-12 text-slate-500 italic">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                  <p className="font-medium">Đang tải thông tin vé...</p>
                </div>
              ) : (
                <div className="flex-grow flex flex-col">
                  {hasSeatMap ? (
                    /* --- RENDER SEAT MAP (KONVA) --- */
                    <>
                       <div className="mb-4 bg-slate-900/5 text-slate-600 p-2 px-4 rounded-lg text-xs font-bold flex items-center gap-2">
                         <Icon name="info" size="xs" />
                         <span>Dùng chuột lăn để phóng to/thu nhỏ, nhấp và kéo để di chuyển bản đồ.</span>
                       </div>
                       
                       <div className="flex-grow relative bg-[#f8fafc] rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden cursor-grab active:cursor-grabbing select-none" style={{ height: '500px' }}>
                          
                          {/* Simple Stage visual marker */}
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none">
                            <div className="px-6 py-1 bg-slate-800 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border border-slate-700">
                               Sân Khấu
                            </div>
                          </div>

                          <Stage
                            width={800}
                            height={500}
                            ref={stageRef}
                            draggable
                            scaleX={stageScale}
                            scaleY={stageScale}
                            x={stagePosition.x}
                            y={stagePosition.y}
                            onWheel={handleWheel}
                            onDragEnd={(e) => {
                              setStagePosition({ x: e.target.x(), y: e.target.y() });
                            }}
                            style={{ width: '100%', height: '100%' }}
                          >
                            <Layer>
                              {seats.map((seat) => {
                                const isSelected = selectedSeatIds.includes(seat.id);
                                const isAvailable = seat.status === 'AVAILABLE';
                                
                                // Styling variables
                                let fillColor = seat.color || '#6366f1';
                                let strokeColor = 'transparent';
                                let strokeWidth = 0;
                                let opacity = 1;
                                
                                if (!isAvailable) {
                                  fillColor = '#e2e8f0'; // gray
                                  opacity = 0.6;
                                } else if (isSelected) {
                                  strokeColor = '#1e293b';
                                  strokeWidth = 2.5;
                                  // Keep vibrant fill but with intense stroke
                                }

                                return (
                                  <Group
                                    key={seat.id}
                                    x={seat.x || 100}
                                    y={seat.y || 100}
                                    onClick={() => toggleSeat(seat)}
                                    onTap={() => toggleSeat(seat)}
                                    style={{ cursor: isAvailable ? 'pointer' : 'not-allowed' }}
                                    onMouseEnter={(e) => {
                                      if(isAvailable) {
                                        const container = e.target.getStage()?.container();
                                        if(container) container.style.cursor = 'pointer';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      const container = e.target.getStage()?.container();
                                      if(container) container.style.cursor = 'grab';
                                    }}
                                  >
                                    <Circle
                                      radius={15}
                                      fill={fillColor}
                                      stroke={strokeColor}
                                      strokeWidth={strokeWidth}
                                      opacity={opacity}
                                      shadowColor="black"
                                      shadowBlur={isSelected ? 10 : 2}
                                      shadowOpacity={isSelected ? 0.3 : 0.1}
                                      shadowOffset={{ x: 0, y: 2 }}
                                    />
                                    {/* Checkmark icon overlay if selected */}
                                    {isSelected && (
                                      <Circle
                                         radius={5}
                                         fill="#ffffff"
                                         x={0}
                                         y={0}
                                      />
                                    )}
                                    <Text
                                      text={seat.seatNumber}
                                      fontSize={8}
                                      fontStyle="bold"
                                      fill={isAvailable ? "#ffffff" : "#94a3b8"}
                                      align="center"
                                      verticalAlign="middle"
                                      x={-15}
                                      y={-4}
                                      width={30}
                                      listening={false}
                                    />
                                  </Group>
                                );
                              })}
                            </Layer>
                          </Stage>
                       </div>
                    </>
                  ) : (
                    /* --- RENDER QUANTITY LIST (NO MAP) --- */
                    <div className="flex-grow flex flex-col gap-4">
                       {groupedTickets.length === 0 ? (
                         <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-500 font-bold">
                            Chưa có thông tin vé cho sự kiện này.
                         </div>
                       ) : (
                         groupedTickets.map((group, idx) => {
                           const currentQty = quantities[group.name] || 0;
                           const remaining = group.availableSeats.length;
                           const isSoldOut = remaining === 0;

                           return (
                             <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-primary/30 hover:shadow-md">
                               <div className="flex items-center gap-4">
                                 <div className="w-3 h-12 rounded-full" style={{ backgroundColor: group.color }}></div>
                                 <div>
                                   <h3 className="text-lg font-extrabold text-slate-800">{group.name}</h3>
                                   <p className="text-primary font-black text-xl mt-1">
                                     {new Intl.NumberFormat('vi-VN').format(group.price)} <span className="text-sm font-bold text-slate-400">VNĐ</span>
                                   </p>
                                   <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                     {isSoldOut ? 'Hết vé' : `Còn trống ${remaining}/${group.totalSeats}`}
                                   </div>
                                 </div>
                               </div>

                               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                 <button
                                   onClick={() => updateQuantity(group.name, -1, remaining)}
                                   disabled={currentQty <= 0}
                                   className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                   <Icon name="remove" size="sm" />
                                 </button>
                                 
                                 <span className="w-8 text-center font-black text-xl text-slate-800">
                                   {currentQty}
                                 </span>

                                 <button
                                   onClick={() => updateQuantity(group.name, 1, remaining)}
                                   disabled={currentQty >= remaining}
                                   className="w-10 h-10 rounded-lg bg-primary text-white shadow-md shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                   <Icon name="add" size="sm" />
                                 </button>
                               </div>
                             </div>
                           );
                         })
                       )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Summary Area */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="glass-card rounded-3xl p-6 overflow-hidden relative">
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
                    <span className="text-sm font-bold text-slate-500">
                      {hasSeatMap ? 'Vị trí ghế' : 'Số lượng vé'}
                    </span>
                    <div className="flex flex-wrap gap-2 justify-end max-w-[60%]">
                      {finalSeatObjects.length > 0 ? (
                        hasSeatMap ? (
                          finalSeatObjects.map(s => (
                            <span key={s.id} className="px-2 py-1 text-white text-xs font-black rounded-lg shadow-sm" style={{ backgroundColor: s.color || '#6366f1' }}>
                              {s.seatNumber}
                            </span>
                          ))
                        ) : (
                           Object.entries(quantities).map(([name, qty]) => {
                             if (qty <= 0) return null;
                             const color = groupedTickets.find(g => g.name === name)?.color || '#6366f1';
                             return (
                               <span key={name} className="px-2 py-1 text-white text-xs font-black rounded-lg shadow-sm" style={{ backgroundColor: color }}>
                                 {name} x{qty}
                               </span>
                             );
                           })
                        )
                      ) : (
                        <span className="text-xs font-bold text-slate-300">Chưa chọn vé</span>
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-slate-100"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Giá vé ({finalSeatObjects.length} vé)</span>
                    <span className="text-sm font-black">{new Intl.NumberFormat('vi-VN').format(totalTicketPrice)}đ</span>
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
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98] mb-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={finalSeatObjects.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Đang xử lý...' : 'Thanh toán ngay'}
                  {!isProcessing && <Icon name="arrow_forward" size="sm" />}
                </button>
              </div>

              {/* Payment Selection Card */}
              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-sm font-black mb-4 text-slate-800">Phương thức thanh toán</h3>
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      onClick={() => setActivePayment(pm.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${activePayment === pm.id
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                    >
                      <div className={`w-8 h-8 ${pm.color} rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0`}>
                        <img src={pm.logo} alt={pm.label} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-slate-700">{pm.label}</p>
                      </div>
                      {activePayment === pm.id ? (
                        <Icon name="check_circle" className="text-primary" filled size="sm" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0"></div>
                      )}
                    </div>
                  ))}
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
