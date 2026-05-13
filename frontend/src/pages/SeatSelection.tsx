import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui'
import { EventService } from '../services/eventService'
import { apiClient } from '../utils/axios'
import { useAuthStore } from '../stores/useAuthStore'
import { toast } from 'react-hot-toast'
import { Stage, Layer, Circle, Text, Group, Rect, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'

const paymentMethods = [
  { id: 'momo', label: 'Ví MoMo', logo: 'https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png', color: 'bg-accent-pink' },
  { id: 'vnpay', label: 'VNPay', logo: 'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png', color: 'bg-[#005ba6]' },
]

const SeatSelection = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [seats, setSeats] = useState<any[]>([]);
  const [shapes, setShapes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user } = useAuthStore();

  // For mapped seats
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([])

  // For GA/No map seats
  const [quantities, setQuantities] = useState<{ [typeName: string]: number }>({})
  const [activeZonePick, setActiveZonePick] = useState<any>(null);

  const [activePayment, setActivePayment] = useState('momo')

  // Canvas interaction states
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // Coupon states
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [couponInput, setCouponInput] = useState('');
  const [showCouponDropdown, setShowCouponDropdown] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.metaKey) {
        setIsCtrlPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || (!e.metaKey && e.key === 'Meta')) {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [loading]); // Only start observing when the DOM might render it
  const [bgImage] = useImage(event?.seatMapBgUrl || '');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const [eventData, seatsData, ticketsData, couponData] = await Promise.all([
          EventService.getEventById(id),
          EventService.getEventSeats(id),
          EventService.getEventTicketTypes(id),
          apiClient.get('/coupons/my').then(res => res.data).catch(() => [])
        ]);
        setEvent(eventData);
        setSeats(seatsData || []);
        setTicketTypes(ticketsData || []);
        setMyCoupons(couponData || []);
        if (eventData.seatMapLayout) {
          try {
            setShapes(JSON.parse(eventData.seatMapLayout));
          } catch (e) {
            console.error("Failed parsing seatMapLayout", e);
          }
        }
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
      if (!unique.has(s.ticketTypeName)) {
        unique.set(s.ticketTypeName, { name: s.ticketTypeName, color: s.color || '#6366f1' });
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
    // 1. Physical mapped seats
    finalSeatObjects = seats.filter(s => selectedSeatIds.includes(s.id));

    // 2. Area-based ticket quantities (Zone Boxes / GA)
    groupedTickets.forEach(group => {
      const qty = quantities[group.name] || 0;
      if (qty > 0) {
        // Filter available seats of this type that haven't been picked physically
        const unpickedAvailable = group.availableSeats.filter((s: any) => !finalSeatObjects.some(so => so.id === s.id));
        const toPick = unpickedAvailable.slice(0, qty);
        finalSeatObjects = [...finalSeatObjects, ...toPick];
      }
    });

    finalSelectedSeatIds = finalSeatObjects.map(s => s.id);
  } else {
    // Aggregate from quantities only
    groupedTickets.forEach(group => {
      const qty = quantities[group.name] || 0;
      const toPick = group.availableSeats.slice(0, qty);
      finalSeatObjects = [...finalSeatObjects, ...toPick];
      finalSelectedSeatIds = [...finalSelectedSeatIds, ...toPick.map((s: any) => s.id)];
    });
  }

  const totalTicketPrice = finalSeatObjects.reduce((sum, s) => sum + s.price, 0);

  const discountAmount = useMemo(() => {
    if (!selectedCoupon || totalTicketPrice === 0) return 0;
    const val = selectedCoupon.discountValue;
    if (val <= 100) {
      // Percentage discount
      return (totalTicketPrice * val) / 100;
    } else {
      // Flat amount discount
      return Math.min(val, totalTicketPrice);
    }
  }, [selectedCoupon, totalTicketPrice]);

  const totalPrice = Math.max(0, totalTicketPrice - discountAmount);

  const handleApplyCouponCode = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const matched = myCoupons.find((c: any) => c.code === code && !c.isUsed);
    if (matched) {
      setSelectedCoupon(matched);
      toast.success('Áp dụng mã giảm giá thành công!');
      setShowCouponDropdown(false);
    } else {
      toast.error('Mã giảm giá không hợp lệ, đã sử dụng hoặc không thuộc về bạn!');
      setSelectedCoupon(null);
    }
  };

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
          paymentMethod: activePayment,
          couponCode: selectedCoupon ? selectedCoupon.code : null
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

  const memoizedLayerContent = useMemo(() => {
    return (
      <Layer>
        {bgImage && (
          <KonvaImage
            image={bgImage}
            width={800}
            height={500}
            listening={false}
          />
        )}

        {shapes.map((shape, shapeIdx) => {
          if (shape.type === 'rect') {
            const isInteractive = !!shape.ticketTypeId;
            // Map shape.ticketTypeId to actual ticket type
            // Note: Handle ID mismatch between local template creation (1, 2, 3...) and DB IDs (54, 55, 56...)
            let targetTt = ticketTypes?.find((t: any) => String(t.id) === String(shape.ticketTypeId));
            if (!targetTt && ticketTypes && ticketTypes.length > 0 && !isNaN(Number(shape.ticketTypeId)) && Number(shape.ticketTypeId) <= 50) {
              const sortedTypes = [...ticketTypes].sort((a: any, b: any) => a.id - b.id);
              const ttIdx = Number(shape.ticketTypeId) - 1;
              if (ttIdx >= 0 && ttIdx < sortedTypes.length) {
                targetTt = sortedTypes[ttIdx];
              }
            }
            const groupInfo = groupedTickets.find(g => g.name === targetTt?.name);
            const availableCount = groupInfo?.availableSeats?.length || 0;
            const currentQty = targetTt ? (quantities[targetTt.name] || 0) : 0;

            return (
              <Group
                key={shape.id || `shape-${shapeIdx}`}
                x={shape.x}
                y={shape.y}
                rotation={shape.rotation || 0}
                onClick={(e) => {
                  e.cancelBubble = true;
                  console.log('[SeatSelection] Zone clicked:', { shapeId: shape.id, ticketTypeId: shape.ticketTypeId, isInteractive, targetTtId: targetTt?.id, targetTtName: targetTt?.name, availableCount });
                  if (isInteractive && targetTt) {
                    setActiveZonePick({
                      ticketTypeId: targetTt.id,
                      name: targetTt.name,
                      available: availableCount
                    });
                  }
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  if (isInteractive && targetTt) {
                    setActiveZonePick({
                      ticketTypeId: targetTt.id,
                      name: targetTt.name,
                      available: availableCount
                    });
                  }
                }}
                onMouseEnter={(e) => {
                  if (isInteractive) {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                  }
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = '';
                }}
              >
                <Rect
                  x={0}
                  y={0}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill || '#cbd5e1'}
                  stroke={isInteractive ? (currentQty > 0 ? '#ffffff' : '#6366f1') : 'transparent'}
                  strokeWidth={isInteractive ? (currentQty > 0 ? 3 : 1.5) : 0}
                  dash={isInteractive && currentQty === 0 ? [5, 3] : undefined}
                  opacity={shape.opacity !== undefined ? shape.opacity : (isInteractive ? 0.6 : 0.8)}
                  cornerRadius={6}
                  shadowColor={isInteractive && currentQty > 0 ? (shape.fill || '#6366f1') : 'transparent'}
                  shadowBlur={currentQty > 0 ? 15 : 0}
                  shadowOpacity={0.8}
                />
                {(shape.labelText || isInteractive) && (
                  <Text
                    x={4}
                    y={0}
                    width={shape.width - 8}
                    height={shape.height}
                    text={
                      isInteractive && targetTt
                        ? `${shape.labelText || targetTt.name}\n(${availableCount} trống)\n${currentQty > 0 ? `★ CHỌN: ${currentQty}` : 'BẤM ĐỂ CHỌN'}`
                        : (shape.labelText || '')
                    }
                    fontSize={Math.max(7, Math.min(13, shape.height / (isInteractive ? 4.5 : 3.5)))}
                    fontStyle="bold"
                    fill="#ffffff"
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                    wrap="word"
                    ellipsis={true}
                    shadowColor="rgba(0,0,0,0.8)"
                    shadowBlur={3}
                    shadowOpacity={1}
                    shadowOffset={{ x: 1, y: 1 }}
                  />
                )}
              </Group>
            );
          } else if (shape.type === 'text') {
            return (
              <Text
                key={shape.id}
                x={shape.x}
                y={shape.y}
                text={shape.text || ''}
                fontSize={shape.fontSize || 16}
                fill={shape.fill || '#475569'}
                fontStyle="bold"
                rotation={shape.rotation || 0}
                listening={false}
              />
            );
          }
          return null;
        })}

        {seats.filter((s: any) => Number(s.x) > 0 && Number(s.y) > 0).map((seat) => {
          const isSelected = selectedSeatIds.includes(seat.id);
          const isAvailable = seat.status === 'AVAILABLE';

          // Map seat.ticketTypeId to actual DB IDs
          let targetTt = ticketTypes?.find((t: any) => String(t.id) === String(seat.ticketTypeId));
          if (!targetTt && ticketTypes && ticketTypes.length > 0 && !isNaN(Number(seat.ticketTypeId)) && Number(seat.ticketTypeId) <= 50) {
            const sortedTypes = [...ticketTypes].sort((a: any, b: any) => a.id - b.id);
            const idx = Number(seat.ticketTypeId) - 1;
            if (idx >= 0 && idx < sortedTypes.length) {
              targetTt = sortedTypes[idx];
            }
          }

          // Styling variables
          let fillColor = targetTt?.color || seat.color || '#6366f1';
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
              onClick={(e) => {
                e.cancelBubble = true;
                toggleSeat(seat);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                toggleSeat(seat);
              }}
              style={{ cursor: isAvailable ? 'pointer' : 'not-allowed' }}
              onMouseEnter={(e) => {
                if (isAvailable) {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'pointer';
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = '';
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
    );
  }, [bgImage, shapes, ticketTypes, groupedTickets, quantities, selectedSeatIds, seats]);

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

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-1">
                    {hasSeatMap ? 'Sơ đồ vị trí' : 'Chọn loại vé'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {hasSeatMap ? 'Chọn vị trí của bạn trên bản đồ 3D trực quan.' : 'Vui lòng nhập số lượng vé mong muốn.'}
                  </p>
                </div>

                {/* Dynamic Premium Legend */}
                {hasSeatMap && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3.5 p-4.5 bg-slate-50/80 backdrop-blur border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-sm">
                    {legendItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 group cursor-default">
                        <div className="w-3 h-3 rounded-full shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: item.color || '#3b82f6', boxShadow: `0 0 8px ${item.color || '#3b82f6'}50` }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                    ))}
                    <div className="w-px h-3.5 bg-slate-200/70 mx-1 hidden sm:block" />
                    <div className="flex items-center gap-2.5 text-slate-400 opacity-75">
                      <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300/20" />
                      <span>Đã bán / Đã khóa</span>
                    </div>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex-grow flex flex-col items-center justify-center p-16 text-slate-400 italic">
                  <div className="animate-spin w-10 h-10 border-[3px] border-slate-200 border-t-primary rounded-full mb-4 shadow-sm"></div>
                  <p className="font-semibold text-sm uppercase tracking-widest">Đang tải dữ liệu ghế...</p>
                </div>
              ) : (
                <div className="flex-grow flex flex-col">
                  {hasSeatMap ? (
                    /* --- RENDER SEAT MAP (KONVA) --- */
                    <>

                      {/* Immersive Dark Stage Canvas Viewport */}
                      <div ref={containerRef} className={`flex-grow relative bg-[#0f172a] rounded-[2.5rem] overflow-hidden select-none border-8 border-slate-900 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col transition-all hover:shadow-[0_30px_70px_-12px_rgba(15,23,42,0.4)] ${isCtrlPressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`} style={{ height: '550px' }}>

                        {/* Premium Header overlay for Stage marker */}
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none select-none flex flex-col items-center gap-2">
                          <div className="relative bg-slate-800/90 backdrop-blur-md text-slate-300 px-10 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-slate-700/50 shadow-xl overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30" />
                            Sân Khấu / Stage
                          </div>
                        </div>

                        <Stage
                          width={dimensions.width}
                          height={dimensions.height}
                          ref={stageRef}
                          draggable={isCtrlPressed}
                          scaleX={stageScale}
                          scaleY={stageScale}
                          x={stagePosition.x}
                          y={stagePosition.y}
                          onWheel={handleWheel}
                          onDragEnd={(e) => {
                            if (e.target === e.target.getStage()) {
                              setStagePosition({ x: e.target.x(), y: e.target.y() });
                            }
                          }}
                          style={{ width: '100%', height: '100%', background: '#0f172a' }}
                        >
                          {memoizedLayerContent}
                        </Stage>

                        {/* --- FLOATING ZONE PICKER OVERLAY --- */}
                        {activeZonePick && (
                          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-xs z-20 flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 transform animate-scale-up">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đặt vé cho khu vực</h4>
                                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{activeZonePick.name}</h3>
                                </div>
                                <button
                                  onClick={() => setActiveZonePick(null)}
                                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors font-bold text-xs"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="mb-6 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-slate-400 font-bold">SỨC CHỨA CÒN LẠI</span>
                                  <span className="text-sm text-emerald-600 font-black leading-tight">{activeZonePick.available} chỗ</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(activeZonePick.name, -1, activeZonePick.available)}
                                    disabled={(quantities[activeZonePick.name] || 0) <= 0}
                                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-black text-lg disabled:opacity-40 hover:border-primary hover:text-primary active:scale-95 transition-all shadow-sm"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-black text-xl text-slate-800">
                                    {quantities[activeZonePick.name] || 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(activeZonePick.name, 1, activeZonePick.available)}
                                    disabled={(quantities[activeZonePick.name] || 0) >= activeZonePick.available}
                                    className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setActiveZonePick(null)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs tracking-wide shadow-lg active:scale-[0.98] transition-all"
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                        )}
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
                        <>
                          {/* Physical seats */}
                          {finalSeatObjects.filter(s => selectedSeatIds.includes(s.id)).map(s => (
                            <span key={s.id} className="px-2 py-1 text-white text-xs font-black rounded-lg shadow-sm" style={{ backgroundColor: s.color || '#6366f1' }}>
                              {s.seatNumber}
                            </span>
                          ))}
                          {/* Quantities (zones) */}
                          {Object.entries(quantities).map(([name, qty]) => {
                            if (qty <= 0) return null;
                            const color = groupedTickets.find(g => g.name === name)?.color || '#6366f1';
                            return (
                              <span key={name} className="px-2 py-1 text-white text-xs font-black rounded-lg shadow-sm" style={{ backgroundColor: color }}>
                                {name} x{qty}
                              </span>
                            );
                          })}
                        </>
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
                  <div className="h-px bg-slate-100"></div>

                  {/* Coupon Input & Dropdown */}
                  <div>
                    <label className="text-sm font-bold text-slate-500 mb-2 block">Mã giảm giá</label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <input
                            type="text"
                            placeholder="Nhập mã coupon..."
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="w-full px-4 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCouponDropdown(!showCouponDropdown)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1 transition-colors ${showCouponDropdown ? 'text-primary' : ''}`}
                          >
                            <Icon name="local_activity" size="sm" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyCouponCode}
                          disabled={!couponInput}
                          className="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-primary transition-all tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Áp dụng
                        </button>
                      </div>

                      {/* Dropdown Vouchers List */}
                      {showCouponDropdown && (
                        <div className="absolute z-50 bottom-full mb-2 right-0 left-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Chọn Voucher Của Bạn</span>
                            <button onClick={() => setShowCouponDropdown(false)} className="text-slate-400 hover:text-slate-600"><Icon name="close" size="xs" /></button>
                          </div>
                          {myCoupons.filter(c => !c.isUsed).length === 0 ? (
                            <div className="p-4 text-center text-xs font-bold text-slate-400">Bạn chưa có mã giảm giá nào khả dụng</div>
                          ) : (
                            <div className="p-2 space-y-1">
                              {myCoupons.filter(c => !c.isUsed).map((coupon) => (
                                <div
                                  key={coupon.id}
                                  onClick={() => {
                                    setSelectedCoupon(coupon);
                                    setCouponInput(coupon.code);
                                    setShowCouponDropdown(false);
                                    toast.success('Đã chọn mã giảm giá!');
                                  }}
                                  className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer border border-transparent hover:border-slate-100 transition-all group"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-primary/5 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary/10">
                                      <Icon name="local_offer" size="xs" />
                                    </div>
                                    <div>
                                      <span className="text-xs font-black block text-slate-800">{coupon.code}</span>
                                      <span className="text-[10px] text-slate-400 font-bold">
                                        Giảm {coupon.discountValue <= 100 ? `${coupon.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(coupon.discountValue)}đ`}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-black text-primary hover:text-white hover:bg-primary bg-primary/10 px-2 py-1 rounded-lg uppercase transition-colors">Chọn</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Coupon Badge */}
                    {selectedCoupon && (
                      <div className="flex items-center justify-between mt-3 bg-emerald-50 border border-emerald-100/50 px-3 py-2.5 rounded-xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Icon name="check" size="xs" filled />
                          </div>
                          <div>
                            <p className="text-xs font-black text-emerald-800 leading-none">Đã áp dụng: {selectedCoupon.code}</p>
                            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">-{new Intl.NumberFormat('vi-VN').format(discountAmount)}đ</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedCoupon(null);
                            setCouponInput('');
                          }} 
                          className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-100"
                        >
                          Huỷ bỏ
                        </button>
                      </div>
                    )}
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
