import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { DashboardLayout, PageHeader } from '../components/layout';
import { adminSidebarConfig } from '../config/adminSidebarConfig';
import { Icon, Loader } from '../components/ui';
import { EventService } from '../services/eventService';
import toast from 'react-hot-toast';
import { Stage, Layer, Circle, Text, Group, Rect, Line } from 'react-konva';
import { Html5Qrcode } from 'html5-qrcode';
import { API_BASE_URL } from '../constants';
import { SeatAttendeeModal, ZoneAttendeesModal } from './OrganizerEventModals';

interface ManageStats {
  totalSeats: number;
  soldSeats: number;
  checkedInSeats: number;
  totalRevenue: number;
  salesByTicketType: Record<string, number>;
  dailyRevenue?: Record<string, number>;
}

interface Attendee {
  ticketId: number;
  userName: string;
  userEmail: string;
  seatNumber: string;
  ticketTypeName: string;
  status: string;
  purchaseDate: string;
  orderId: number;
  ticketTypeColor?: string;
  checkInDate?: string;
  userAvatar?: string;
}

// Sub-components for Roster
const colorMap = {
  sky: 'bg-sky-50 border-sky-400 text-sky-700',
  red: 'bg-red-50 border-red-500 text-red-700',
  orange: 'bg-orange-50 border-orange-400 text-orange-700',
  emerald: 'bg-emerald-50 border-emerald-400 text-emerald-700',
  purple: 'bg-purple-50 border-purple-400 text-purple-700',
  indigo: 'bg-indigo-50 border-indigo-400 text-indigo-700',
}

const RosterCard = ({ shift }: any) => (
  <div className={`p-2 rounded-xl border mb-2 text-[10px] sm:text-xs shadow-sm ${colorMap[shift.color as keyof typeof colorMap]}`}>
    <p className="font-bold">{shift.title}</p>
    <p className="opacity-80">{shift.time}</p>
  </div>
)

const AdminEventManage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as 'overview' | 'guests' | 'finance' | 'feedback' | 'edit';
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'finance' | 'feedback' | 'edit'>(initialTab || 'overview');
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<ManageStats | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [seats, setSeats] = useState<any[]>([]);
  const uniqueTicketTypes = React.useMemo(() => {
    const map = new Map();
    seats.forEach((s: any) => {
      if (s.ticketTypeName && !map.has(s.ticketTypeName)) {
        map.set(s.ticketTypeName, { name: s.ticketTypeName, color: s.color });
      }
    });
    return Array.from(map.values());
  }, [seats]);
  const [comments, setComments] = useState<any[]>([]);
  const [shapes, setShapes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [guestViewMode, setGuestViewMode] = useState<'list' | 'seats'>('list');
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<Attendee | null>(null);

  // Premium Guest States imported from Organizer Flow
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHECKED_IN' | 'PENDING'>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [guestPage, setGuestPage] = useState(1);
  const itemsPerPage = 5;
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [manualCode, setManualCode] = useState('');
  const [qrError, setQrError] = useState<string | null>(null);
  const [selectedZoneForModal, setSelectedZoneForModal] = useState<any>(null);
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);

  // Finance pagination
  const [transactionPage, setTransactionPage] = useState(1);
  const transactionsPerPage = 5;
  const [orders, setOrders] = useState<any[]>([]);

  // New state for Finance tab
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const getWeekRangeString = (date: Date) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(start.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${start.toLocaleDateString('vi-VN', options)} - ${end.toLocaleDateString('vi-VN', options)}, ${start.getFullYear()}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const weeklyMockData = [
    { day: 'T2', val: 45 },
    { day: 'T3', val: 78 },
    { day: 'T4', val: 56 },
    { day: 'T5', val: 89 },
    { day: 'T6', val: 32 },
    { day: 'T7', val: 120 },
    { day: 'CN', val: 110 },
  ];



  useEffect(() => {
    if (stats) {
      console.log('Finance Debug - Stats received:', stats);
      console.log('Finance Debug - Daily Revenue keys:', Object.keys(stats.dailyRevenue || {}));
    }
  }, [stats]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [eventData, statsData, attendeesData, seatsData, commentsData, ticketTypesData, ordersData] = await Promise.all([
        EventService.getEventById(id),
        EventService.getEventManageStats(id),
        EventService.getEventAttendees(id),
        EventService.getEventSeats(id),
        EventService.getEventComments(id),
        EventService.getEventTicketTypes(id),
        EventService.getEventOrders(id)
      ]);
      setEvent(eventData);
      setTicketTypes(ticketTypesData || []);
      if (eventData.seatMapLayout) {
        try {
          setShapes(JSON.parse(eventData.seatMapLayout));
        } catch (e) {
          console.error('Error parsing layout', e);
        }
      }
      setStats(statsData);
      setAttendees(attendeesData);
      setSeats(seatsData || []);
      setComments(commentsData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // Auto-jump to week with data only once when entering the finance tab
  const hasAutoJumped = React.useRef(false);

  useEffect(() => {
    if (activeTab === 'finance' && stats?.dailyRevenue && !hasAutoJumped.current) {
      const hasDataThisWeek = Array.from({ length: 7 }).some((_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return Number(stats.dailyRevenue?.[dk] || 0) > 0;
      });

      if (!hasDataThisWeek) {
        const keys = Object.keys(stats.dailyRevenue).filter(k => Number(stats.dailyRevenue![k]) > 0);
        if (keys.length > 0) {
          const latestDateString = keys.sort().reverse()[0];
          const latestDate = new Date(latestDateString);
          const day = latestDate.getDay();
          const diff = latestDate.getDate() - (day === 0 ? 6 : day - 1);
          const monday = new Date(latestDate.setDate(diff));
          monday.setHours(0, 0, 0, 0);
          console.log('Finance Debug - Initial auto jump to week with data:', monday);
          setCurrentWeekStart(monday);
          hasAutoJumped.current = true;
        }
      } else {
        hasAutoJumped.current = true; // Even if it has data, mark as jumped so we don't interfere with manual navigation later
      }
    }

    // Reset jump flag if leaving the tab, so it can re-jump next time they enter
    if (activeTab !== 'finance') {
      hasAutoJumped.current = false;
    }
  }, [activeTab, stats]); // Removed currentWeekStart from dependencies to allow manual navigation

  useEffect(() => {
    fetchData();
  }, [id]);

  type EditType = 'title' | 'info' | 'description' | 'schedule' | null;
  const [activeEditType, setActiveEditType] = useState<EditType>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editSchedules, setEditSchedules] = useState<any[]>([]);

  useEffect(() => {
    const isModalOpen = !!selectedSeatInfo || !!activeEditType || !!selectedZoneForModal || !!scanResult;
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedSeatInfo, activeEditType, selectedZoneForModal, scanResult]);

  useEffect(() => {
    if (event) {
      setEditForm({
        title: event.title,
        location: event.location,
        startTime: event.startTime,
        description: event.description,
        categoryId: event.categoryId
      });
      setEditSchedules(event.schedules || []);
    }
  }, [event]);



  const handleCheckIn = async (ticketId: number, currentStatus: string) => {
    const isCheckedIn = currentStatus === 'CHECKED_IN';
    try {
      await EventService.checkInTicket(ticketId, !isCheckedIn);
      toast.success(isCheckedIn ? 'Đã hủy check-in' : 'Check-in thành công');
      fetchData();
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const handleQrSuccess = async (decodedText: string) => {
    const loadingToast = toast.loading("Đang thực hiện check-in...");
    try {
      const orderInfo = await EventService.getOrderByQR(decodedText);
      await EventService.checkInOrderByQR(decodedText);

      setScanResult(orderInfo);
      setIsScanning(false);
      toast.success("Check-in thành công!", { id: loadingToast });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã QR không hợp lệ hoặc đã được sử dụng", { id: loadingToast });
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualCode.trim()) {
      toast.error("Vui lòng nhập mã code");
      return;
    }
    handleQrSuccess(manualCode.trim());
  };

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isScanning && activeTab === 'guests') {
      html5QrCode = new Html5Qrcode("qr-reader");

      const config = { fps: 10, aspectRatio: 1.0 };

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        handleQrSuccess,
        (errorMessage) => {
          // Ignored error
        }
      ).catch(err => {
        console.error("Unable to start scanning", err);
        setQrError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập hoặc sử dụng HTTPS.");
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode?.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [isScanning, activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      handleQrSuccess(decodedText);
    } catch (err) {
      toast.error("Không thể nhận diện mã QR từ ảnh này");
    } finally {
      html5QrCode.clear();
    }
  };

  const handleCheckInOrder = async (orderId: number) => {
    try {
      await EventService.checkInOrder(orderId);
      toast.success('Đã check-in toàn bộ vé trong đơn hàng này');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const ticketSalesBreakdown = React.useMemo(() => {
    if (!ticketTypes) return [];
    return ticketTypes.map((tt: any) => {
      const sold = attendees.filter((a: any) => a.ticketTypeName === tt.name).length;
      const total = tt.totalQuantity || 0;
      const percentage = total > 0 ? Math.round((sold / total) * 100) : 0;
      return {
        ...tt,
        sold,
        total,
        percentage
      };
    }).filter((tt: any) => tt.name.toLowerCase().includes(zoneSearchQuery.toLowerCase()));
  }, [ticketTypes, attendees, zoneSearchQuery]);

  const groupedAttendees = React.useMemo(() => {
    const groups: Record<number, any> = {};
    attendees.forEach(a => {
      if (!groups[a.orderId]) {
        groups[a.orderId] = {
          id: a.orderId,
          fullName: a.userName,
          email: a.userEmail,
          ticketTypeName: a.ticketTypeName,
          seats: [{ seatNumber: a.seatNumber, color: a.ticketTypeColor, typeName: a.ticketTypeName }],
          ticketStatuses: [a.status],
          checkInDate: a.checkInDate,
          avatarUrl: a.userAvatar ? (a.userAvatar.startsWith('http') ? a.userAvatar : `${API_BASE_URL.replace('/api', '')}${a.userAvatar.startsWith('/') ? '' : '/'}${a.userAvatar}`) : null
        };
      } else {
        groups[a.orderId].seats.push({ seatNumber: a.seatNumber, color: a.ticketTypeColor, typeName: a.ticketTypeName });
        groups[a.orderId].ticketStatuses.push(a.status);
        if (a.checkInDate && (!groups[a.orderId].checkInDate || new Date(a.checkInDate) > new Date(groups[a.orderId].checkInDate))) {
          groups[a.orderId].checkInDate = a.checkInDate;
        }
      }
    });

    Object.values(groups).forEach((g: any) => {
      g.checkInStatus = g.ticketStatuses.every((status: string) => status === 'CHECKED_IN');
    });

    return Object.values(groups).filter((a: any) => {
      const matchesSearch = a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.seats.some((s: any) => s.seatNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(a.id).includes(searchTerm);

      if (statusFilter === 'ALL') return matchesSearch;
      if (statusFilter === 'CHECKED_IN') return matchesSearch && a.checkInStatus;
      if (statusFilter === 'PENDING') return matchesSearch && !a.checkInStatus;
      return matchesSearch;
    });
  }, [attendees, searchTerm, statusFilter]);

  useEffect(() => {
    setGuestPage(1);
  }, [searchTerm, statusFilter]);

  const paginatedAttendees = React.useMemo(() => {
    const startIndex = (guestPage - 1) * itemsPerPage;
    return groupedAttendees.slice(startIndex, startIndex + itemsPerPage);
  }, [groupedAttendees, guestPage]);

  const totalGuestPages = Math.ceil(groupedAttendees.length / itemsPerPage);

  const memoizedSeatMap = React.useMemo(() => {
    if (seats.length === 0 && shapes.length === 0) {
      return <div className="text-slate-400 py-20 italic text-sm">Đang tải sơ đồ sự kiện...</div>;
    }

    return (
      <Stage
        width={800}
        height={500}
        draggable
        onMouseEnter={(e) => {
          if (e.target === e.target.getStage()) {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'grab';
          }
        }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'grabbing';
          }
        }}
        onMouseUp={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'grab';
        }}
      >
        <Layer>
          {Array.from({ length: 21 }).map((_, i) => (
            <Rect key={'v' + i} x={i * 40} y={0} width={1} height={500} fill="#1e293b" opacity={0.3} />
          ))}
          {Array.from({ length: 13 }).map((_, i) => (
            <Rect key={'h' + i} x={0} y={i * 40} width={800} height={1} fill="#1e293b" opacity={0.3} />
          ))}

          {shapes.map((shape: any) => {
            if (shape.type === 'rect') {
              const isInteractive = !!shape.ticketTypeId;
              let targetTt = ticketTypes?.find((t: any) => String(t.id) === String(shape.ticketTypeId));
              if (!targetTt && ticketTypes && ticketTypes.length > 0 && !isNaN(Number(shape.ticketTypeId)) && Number(shape.ticketTypeId) <= 50) {
                const sortedTypes = [...ticketTypes].sort((a: any, b: any) => a.id - b.id);
                const ttIdx = Number(shape.ticketTypeId) - 1;
                if (ttIdx >= 0 && ttIdx < sortedTypes.length) {
                  targetTt = sortedTypes[ttIdx];
                }
              }

              let isSoldOut = false;
              let availableCount = 0;
              if (isInteractive && targetTt) {
                const sold = attendees.filter((a: any) => a.ticketTypeName === targetTt.name).length;
                const total = targetTt.totalQuantity || 0;
                availableCount = Math.max(0, total - sold);
                isSoldOut = availableCount <= 0;
              }

              const zoneColor = targetTt?.color || shape.fill || '#cbd5e1';
              const baseLabel = isInteractive && targetTt ? (shape.labelText || targetTt.name) : shape.labelText;
              const displayText = isSoldOut ? `${baseLabel}\n🚫 ĐÃ BÁN HẾT` : baseLabel;

              return (
                <Group
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  rotation={shape.rotation || 0}
                >
                  <Rect
                    x={0}
                    y={0}
                    width={shape.width}
                    height={shape.height}
                    fill={isSoldOut ? '#1e293b' : zoneColor}
                    stroke={isInteractive ? (isSoldOut ? '#f43f5e' : zoneColor) : 'transparent'}
                    strokeWidth={isInteractive ? (isSoldOut ? 2 : 1.5) : 0}
                    dash={isInteractive ? [5, 3] : undefined}
                    opacity={isSoldOut ? 0.5 : (shape.opacity !== undefined ? shape.opacity : (isInteractive ? 0.5 : 0.7))}
                    cornerRadius={4}
                  />

                  {isSoldOut && (
                    <>
                      <Line
                        points={[0, 0, shape.width, shape.height]}
                        stroke="#f43f5e"
                        strokeWidth={1.5}
                        opacity={0.4}
                        listening={false}
                      />
                      <Line
                        points={[shape.width, 0, 0, shape.height]}
                        stroke="#f43f5e"
                        strokeWidth={1.5}
                        opacity={0.4}
                        listening={false}
                      />
                    </>
                  )}

                  {displayText && (
                    <Text
                      x={2}
                      y={0}
                      width={shape.width - 4}
                      height={shape.height}
                      text={displayText}
                      fontSize={Math.max(8, Math.min(13, shape.height / 3.5))}
                      fontStyle="bold"
                      fill={isSoldOut ? '#94a3b8' : '#ffffff'}
                      align="center"
                      verticalAlign="middle"
                      listening={false}
                      wrap="word"
                      ellipsis={true}
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
                  fill={shape.fill || '#94a3b8'}
                  fontStyle="bold"
                  rotation={shape.rotation || 0}
                  listening={false}
                />
              );
            }
            return null;
          })}

          {seats.filter((s: any) => Number(s.x) > 0 && Number(s.y) > 0).map((seat: any) => {
            const isOccupied = seat.status !== 'AVAILABLE';
            const attendee = isOccupied ? attendees.find((a: any) => a.seatNumber === seat.seatNumber) : null;
            const isCheckedIn = isOccupied && attendee?.status === 'CHECKED_IN';

            const baseColor = seat.color || '#3b82f6';
            const circleFill = isCheckedIn ? '#10b981' : (isOccupied ? baseColor : 'rgba(15, 23, 42, 0.8)');
            const circleStroke = isCheckedIn ? '#fff' : baseColor;
            const shadowColor = isCheckedIn ? '#10b981' : baseColor;
            const textColor = isOccupied ? '#fff' : baseColor;

            return (
              <Group
                key={seat.id}
                x={Number(seat.x) || 0}
                y={Number(seat.y) || 0}
                onClick={() => {
                  if (attendee) {
                    setSelectedSeatInfo(attendee);
                  } else {
                    toast.dismiss();
                    toast(`${seat.seatNumber} - ${seat.ticketTypeName} (Đang trống)`, { icon: '🎫' });
                  }
                }}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = attendee ? 'pointer' : 'help';
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'default';
                }}
              >
                <Circle
                  radius={14}
                  fill={circleFill}
                  shadowBlur={isOccupied ? 12 : 4}
                  shadowColor={shadowColor}
                  shadowOpacity={isOccupied ? 0.5 : 0.2}
                  stroke={circleStroke}
                  strokeWidth={isOccupied ? 1.5 : 2}
                />
                <Text
                  text={seat.seatNumber}
                  fontSize={seat.seatNumber.length > 2 ? 8 : 10}
                  fontStyle="bold"
                  fill={textColor}
                  align="center"
                  verticalAlign="middle"
                  offsetX={seat.seatNumber.length > 2 ? 7 : 5}
                  offsetY={5}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    );
  }, [shapes, ticketTypes, seats, attendees, setSelectedSeatInfo]);

  const filteredAttendees = attendees.filter(a =>
    a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.seatNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPlatformFee = React.useMemo(() => {
    return orders.reduce((sum: number, o: any) => sum + (o.platformFee || 0), 0);
  }, [orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatTime = (timeInput: any) => {
    if (!timeInput) return '??:??';
    if (typeof timeInput === 'string') return timeInput.substring(0, 5);
    if (Array.isArray(timeInput) && timeInput.length >= 2) {
      const h = String(timeInput[0]).padStart(2, '0');
      const m = String(timeInput[1]).padStart(2, '0');
      return `${h}:${m}`;
    }
    return '??:??';
  };

  if (loading && !event) {
    return (
      <DashboardLayout sidebarProps={adminSidebarConfig}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="w-12 h-12 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: 'visibility' },
    { id: 'guests', label: 'Khách mời', icon: 'how_to_reg' },
    { id: 'finance', label: 'Tài chính', icon: 'payments' },
    { id: 'feedback', label: 'Phản hồi', icon: 'reviews' }
  ];


  const handleUpdateEvent = async () => {
    try {
      // Mock update
      const updatedEvent = { ...event, ...editForm, schedules: editSchedules };
      setEvent(updatedEvent);
      toast.success('Cập nhật thành công');
      setActiveEditType(null);
    } catch (error) {
      toast.error('Cập nhật thất bại');
    }
  };

  const CleanEditButton = ({ onClick, title }: { onClick: () => void, title: string }) => (
    <button
      onClick={onClick}
      className="p-1 text-slate-300 hover:text-primary hover:bg-slate-100 rounded-md transition-all group/edit"
      title={title}
    >
      <Icon name="edit_square" size="xs" className="group-hover/edit:scale-110" />
    </button>
  );



  return (
    <DashboardLayout sidebarProps={adminSidebarConfig}>
      <div className="min-h-screen bg-slate-50/50" style={{ scrollbarGutter: 'stable' }}>
        <PageHeader
          title={event?.title || 'Quản lý sự kiện'}
          subtitle="Theo dõi và quản lý chi tiết sự kiện"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-10">
          {/* Tab Navigation - Fixed structure with sticky behavior */}
          <div className="sticky top-[72px] z-40 py-4 bg-slate-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all flex justify-start items-center gap-4">
            <Link
              to="/admin/events"
              className="w-12 h-12 bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all group shrink-0 animate-in fade-in slide-in-from-left-4 duration-500"
              title="Quay lại danh sách"
            >
              <Icon name="arrow_back" size="sm" className="group-hover:-translate-x-1 transition-transform" />
            </Link>

            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-1.5 flex flex-wrap sm:flex-nowrap gap-1.5 w-fit animate-in fade-in slide-in-from-left-6 duration-700">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 hover:bg-slate-50'
                    } animate-in fade-in slide-in-from-left-2`}
                  style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                >
                  <Icon name={tab.icon} size="sm" />
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6 pt-4">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Event Hero Banner */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col lg:flex-row group">
                  <div className="lg:w-1/2 relative overflow-hidden min-h-[300px] lg:min-h-0">
                    <img src={event?.posterUrl} alt={event?.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                  </div>

                  <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center space-y-6 bg-gradient-to-br from-white via-white to-slate-50 relative z-10">
                    <div className="flex justify-between items-start">
                      <h3 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight flex items-center gap-3">
                        {event?.title}
                        <CleanEditButton onClick={() => setActiveEditType('title')} title="Đổi tên sự kiện" />
                      </h3>

                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border"
                        style={{
                          backgroundColor: `${event?.category?.color || '#3b82f6'}15`,
                          borderColor: `${event?.category?.color || '#3b82f6'}30`,
                          color: event?.category?.color || '#3b82f6'
                        }}
                      >
                        <Icon name={event?.category?.icon || 'event'} size="sm" />
                        {event?.category?.name || event?.categoryName || 'Sự kiện'}
                      </span>
                    </div>
                    <div className="space-y-5 relative group/info">
                      <div className="absolute -right-2 top-0">
                        <CleanEditButton onClick={() => setActiveEditType('info')} title="Sửa thời gian & địa điểm" />
                      </div>

                      <div className="flex items-center gap-4 group/item">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                          <Icon name="calendar_today" size="sm" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian tổ chức</p>
                          <p className="text-slate-900 font-bold">{event?.startTime ? new Date(event.startTime).toLocaleString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).replace('lúc ', '') : 'Chưa cập nhật'}</p>

                        </div>
                      </div>

                      <div className="flex items-center gap-4 group/item">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                          <Icon name="location_on" size="sm" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa điểm</p>
                          <p className="text-slate-900 font-bold">{event?.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-primary/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform" />
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Icon name="confirmation_number" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Vé đã bán</p>
                        <div className="flex items-baseline gap-1">
                          <h4 className="text-2xl font-black text-slate-900">{stats?.soldSeats}</h4>
                          <span className="text-slate-400 font-bold text-[10px]">/ {stats?.totalSeats} mục tiêu</span>
                        </div>
                        <div className="mt-3 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <div className="h-full bg-primary" style={{ width: `${((stats?.soldSeats || 0) / (stats?.totalSeats || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform" />
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 bg-emerald-50/10 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                        <Icon name="payments" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Doanh thu hiện thực</p>
                        <h4 className="text-2xl font-black text-emerald-600 truncate">{formatCurrency(stats?.totalRevenue || 0)}</h4>
                        <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Tỷ lệ lấp đầy: {Math.round(((stats?.soldSeats || 0) / (stats?.totalSeats || 1)) * 100)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-orange-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform" />
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                        <Icon name="how_to_reg" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Tỷ lệ Check-in</p>
                        <h4 className="text-2xl font-black text-orange-600">{Math.round(((stats?.checkedInSeats || 0) / (stats?.soldSeats || 1)) * 100)}%</h4>
                        <p className="mt-1.5 text-[10px] text-slate-400 font-medium truncate">{stats?.checkedInSeats} khách đã đến</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Timeline / Schedule Section */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                      <h5 className="font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          Lịch trình
                        </div>
                        <CleanEditButton onClick={() => setActiveEditType('schedule')} title="Sửa lịch trình" />
                      </h5>


                      <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {(event?.schedules || []).map((item: any, idx: number) => (
                          <div key={idx} className="relative group">
                            <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 bg-white border-2 border-primary rounded-full z-10 group-hover:scale-125 transition-transform" />
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                {formatTime(item.startTime)}

                              </span>
                              <h6 className="text-sm font-black text-slate-900 leading-tight">{item.activity}</h6>
                            </div>
                          </div>
                        ))}
                        {(!event?.schedules || event.schedules.length === 0) && (
                          <p className="text-xs text-slate-400 font-medium italic">Chưa có lịch trình chính thức</p>
                        )}

                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Icon name="format_quote" size="xl" className="text-slate-900" />
                      </div>
                      <h5 className="font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                          Mô tả sự kiện
                        </div>
                        <CleanEditButton onClick={() => setActiveEditType('description')} title="Sửa mô tả" />
                      </h5>


                      <div className="text-sm text-slate-600 leading-loose font-medium whitespace-pre-line bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-100 relative z-10">
                        {event?.description || 'Chưa có mô tả chi tiết cho sự kiện này.'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'guests' && (
              <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-6 animate-fade-in">
                  {event?.seatMapLayout && (
                    <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                      <button
                        onClick={() => setGuestViewMode('list')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${guestViewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                      >
                        <Icon name="list" size="sm" /> Danh sách
                      </button>
                      <button
                        onClick={() => setGuestViewMode('seats')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${guestViewMode === 'seats' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                      >
                        <Icon name="grid_view" size="sm" /> Sơ đồ ghế
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setIsScanning(!isScanning)}
                    className={`ml-auto px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 shadow-xl active:scale-95 group relative overflow-hidden ${isScanning
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/30 hover:shadow-rose-500/50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/30 hover:shadow-blue-600/50'
                      }`}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm ${isScanning
                      ? 'bg-white/20 rotate-180'
                      : 'bg-white/15 group-hover:rotate-12 group-hover:scale-110 group-hover:bg-white/20'
                      }`}>
                      <Icon name={isScanning ? "close" : "qr_code_scanner"} size="xs" />
                    </div>
                    <span className="relative z-10">{isScanning ? "Đóng Scanner" : "Quét mã QR"}</span>
                  </button>
                </div>

                {isScanning ? (
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl animate-scale-in max-w-4xl mx-auto w-full relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                      <div className="w-full lg:w-1/2 space-y-4 opacity-0 animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:forwards]">
                        <div className="relative bg-slate-950 rounded-3xl overflow-hidden aspect-video max-h-[300px] flex items-center justify-center">
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-primary/40 animate-scan z-20" />
                          <div id="qr-reader" className="w-full h-full object-cover relative z-10 [&_*]:border-none [&_img]:hidden [&_button]:hidden [&_a]:hidden [&_span]:hidden">
                            {qrError && (
                              <div className="absolute inset-0 z-30 bg-rose-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                                <Icon name="error" size="sm" className="mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">{qrError}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-6 self-center opacity-0 animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:forwards]">
                        <div className="space-y-1">
                          <h4 className="text-lg font-black text-slate-900 tracking-tight">Quét mã QR</h4>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tự động nhận diện và check-in</p>
                        </div>

                        <div className="space-y-4">
                          <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                              <Icon name="tag" size="xs" />
                            </div>
                            <input
                              type="text"
                              value={manualCode}
                              onChange={(e) => setManualCode(e.target.value)}
                              placeholder="Nhập mã vé thủ công..."
                              className="w-full pl-11 pr-24 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-primary/30 outline-none transition-all placeholder:text-slate-300 uppercase tracking-widest"
                              onKeyDown={(e) => e.key === 'Enter' && handleManualCheckIn()}
                            />
                            <button
                              onClick={handleManualCheckIn}
                              className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg"
                            >
                              Xác nhận
                            </button>
                          </div>

                          <label className="flex items-center gap-5 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-white hover:to-white rounded-[2rem] border-2 border-dashed border-blue-200 hover:border-blue-400 cursor-pointer transition-all duration-300 active:scale-[0.98] group/upload shadow-sm hover:shadow-xl hover:shadow-blue-500/10">
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-blue-50 group-hover/upload:bg-blue-600 group-hover/upload:text-white group-hover/upload:scale-110 transition-all duration-500">
                              <Icon name="add_photo_alternate" size="sm" className="group-hover/upload:rotate-12 transition-transform" />
                            </div>
                            <div className="flex-1">
                              <span className="block text-[12px] font-black text-slate-800 uppercase tracking-widest group-hover/upload:text-blue-600 transition-colors">Tải ảnh QR từ máy</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Hỗ trợ PNG, JPG • Tối đa 5MB</span>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 text-slate-300 group-hover/upload:bg-blue-50 group-hover/upload:text-blue-600 transition-all">
                              <Icon name="chevron_right" size="xs" className="group-hover/upload:translate-x-1 transition-transform" />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {guestViewMode === 'list' ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                          <div className="xl:col-span-6 relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                              <Icon name="search" size="xs" />
                            </div>
                            <input
                              type="text"
                              placeholder="Tìm tên khách, email, số ghế..."
                              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-2xl font-bold outline-none transition-all placeholder:text-slate-400 shadow-sm"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>

                          <div className="xl:col-span-3 relative">
                            <button
                              onClick={() => setIsFilterOpen(!isFilterOpen)}
                              className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-700 hover:bg-white hover:border-primary/30 transition-all shadow-sm group"
                            >
                              <div className="flex items-center gap-2">
                                <Icon name={
                                  statusFilter === 'ALL' ? 'apps' :
                                    statusFilter === 'CHECKED_IN' ? 'check_circle' : 'hourglass_empty'
                                } size="xs" className={
                                  statusFilter === 'ALL' ? 'text-blue-600' :
                                    statusFilter === 'CHECKED_IN' ? 'text-emerald-500' : 'text-amber-500'
                                } />
                                <span className="truncate">{
                                  statusFilter === 'ALL' ? 'Tất cả' :
                                    statusFilter === 'CHECKED_IN' ? 'Đã đến' : 'Chưa đến'
                                }</span>
                              </div>
                              <Icon name="expand_more" size="xs" className={`text-slate-400 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFilterOpen && (
                              <>
                                <div className="fixed inset-0 z-[40]" onClick={() => setIsFilterOpen(false)} />
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
                                  {[
                                    { id: 'ALL', label: 'Tất cả trạng thái', icon: 'apps', color: 'text-blue-600' },
                                    { id: 'CHECKED_IN', label: 'Đã check-in', icon: 'check_circle', color: 'text-emerald-500' },
                                    { id: 'PENDING', label: 'Chưa check-in', icon: 'hourglass_empty', color: 'text-amber-500' }
                                  ].map((opt) => (
                                    <button
                                      key={opt.id}
                                      onClick={() => {
                                        setStatusFilter(opt.id);
                                        setIsFilterOpen(false);
                                      }}
                                      className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-wider transition-all hover:bg-slate-50 ${statusFilter === opt.id ? 'bg-slate-50' : 'text-slate-600'}`}
                                    >
                                      <Icon name={opt.icon} size="xs" className={opt.color} />
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          <div className="xl:col-span-3 flex items-center gap-2">
                            <div className="flex-1 bg-emerald-50 border border-emerald-100 p-2 rounded-2xl flex items-center gap-3 shadow-sm">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-100 shrink-0">
                                <Icon name="check_circle" size="xs" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Đã đến</p>
                                <p className="text-sm font-black text-emerald-900 leading-none">{stats?.checkedInSeats || 0}</p>
                              </div>
                            </div>
                            <div className="flex-1 bg-indigo-50 border border-indigo-100 p-2 rounded-2xl flex items-center gap-3 shadow-sm">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
                                <Icon name="groups" size="xs" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Tổng vé</p>
                                <p className="text-sm font-black text-indigo-900 leading-none">{stats?.soldSeats || 0}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50/50">
                                  <th className="px-8 py-4 text-[14px] font-black uppercase">Khách mời</th>
                                  <th className="px-8 py-4 text-[14px] font-black uppercase">Thông tin vé</th>
                                  <th className="px-8 py-4 text-[14px] font-black uppercase">Check-in Date</th>
                                  <th className="px-8 py-4 text-[14px] font-black uppercase text-center">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {paginatedAttendees.map((attendee) => (
                                  <tr key={attendee.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-lg shadow-inner overflow-hidden border border-slate-200">
                                          {attendee.avatarUrl ? (
                                            <img
                                              src={attendee.avatarUrl}
                                              alt={attendee.fullName}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerText = attendee.fullName.charAt(0);
                                              }}
                                            />
                                          ) : (
                                            attendee.fullName.charAt(0)
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-base font-black text-slate-900 leading-tight">{attendee.fullName}</div>
                                          <div className="text-xs font-bold text-slate-500">{attendee.email}</div>
                                          <div className="text-[10px] font-black text-primary mt-1">ID: #{attendee.id}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-8 py-6">
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap gap-1.5">
                                          {attendee.seats.map((seat, seatIdx) => (
                                            <span
                                              key={`${seat.seatNumber}-${seatIdx}`}
                                              className="px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm text-white"
                                              style={{ backgroundColor: seat.color || '#3b82f6' }}
                                              title={seat.typeName}
                                            >
                                              {seat.seatNumber}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-8 py-6">
                                      {attendee.checkInDate ? (
                                        <div className="flex flex-row items-baseline gap-3">
                                          <span className="text-lg font-black text-primary">
                                            {new Date(attendee.checkInDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                          <span className="text-base font-black text-slate-400">
                                            {new Date(attendee.checkInDate).toLocaleDateString('vi-VN')}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-bold text-slate-400 italic whitespace-nowrap">Chưa check-in</span>
                                      )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                      {attendee.checkInStatus ? (
                                        <div className="flex items-center justify-center">
                                          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                                            <Icon name="done" size="sm" />
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => handleCheckInOrder(attendee.id)}
                                          className="px-6 py-2.5 bg-slate-100 hover:bg-primary hover:text-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-200 hover:border-primary"
                                        >
                                          Check-in
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {totalGuestPages > 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 animate-fade-in">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Trang <span className="text-primary">{guestPage}</span> / {totalGuestPages}
                              <span className="mx-2 text-slate-200">•</span>
                              Tổng <span className="text-slate-900">{groupedAttendees.length}</span> khách mời
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setGuestPage(p => Math.max(1, p - 1))}
                                disabled={guestPage === 1}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                              >
                                <Icon name="chevron_left" size="sm" className="group-hover:-translate-x-0.5 transition-transform" />
                              </button>

                              <div className="flex items-center gap-1.5 px-2">
                                {[...Array(totalGuestPages)].map((_, i) => {
                                  const pageNum = i + 1;
                                  if (totalGuestPages > 5) {
                                    if (pageNum !== 1 && pageNum !== totalGuestPages && Math.abs(pageNum - guestPage) > 1) {
                                      if (pageNum === 2 || pageNum === totalGuestPages - 1) return <span key={pageNum} className="text-slate-300">...</span>;
                                      return null;
                                    }
                                  }
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setGuestPage(pageNum)}
                                      className={`min-w-[40px] h-10 rounded-xl text-[11px] font-black transition-all ${guestPage === pageNum
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/30'
                                        }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                onClick={() => setGuestPage(p => Math.min(totalGuestPages, p + 1))}
                                disabled={guestPage === totalGuestPages}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                              >
                                <Icon name="chevron_right" size="sm" className="group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 mb-10 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 pb-8">
                          <div className="flex items-center flex-wrap gap-4 border-r border-slate-200 pr-6">
                            <div className="flex items-center gap-2 bg-emerald-50/80 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                              <span className="tracking-wide">Đã Check-In</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                              <span className="tracking-wide">Đã bán</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 text-slate-400 px-3 py-1.5 rounded-full border border-slate-200">
                              <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 bg-transparent" />
                              <span className="tracking-wide">Trống</span>
                            </div>
                          </div>

                          <div className="flex items-center flex-wrap gap-3">
                            {uniqueTicketTypes.map((tt) => (
                              <div key={tt.name} className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50/50 border border-slate-100 rounded-full transition-all hover:bg-white hover:shadow-sm hover:border-slate-200/70 cursor-default group">
                                <div className="w-2 h-2 rounded-full transition-transform group-hover:scale-110" style={{ backgroundColor: tt.color || '#3b82f6', boxShadow: `0 0 8px ${(tt.color || '#3b82f6')}40` }} />
                                <span className="text-slate-700 font-extrabold tracking-tight leading-none mt-[1px]">{tt.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                          <div className="xl:col-span-3 relative w-full bg-slate-900 rounded-[3rem] overflow-hidden flex flex-col items-center shadow-2xl border-8 border-slate-800 animate-in zoom-in-95 duration-500">
                            <div className="w-full py-4 bg-slate-800/60 backdrop-blur-md flex justify-center relative z-10 border-b border-slate-700/50 shadow-lg">
                              <div className="relative bg-slate-700 text-slate-300 px-16 py-2 rounded-full text-xs font-black uppercase tracking-[0.4em] border border-slate-600/50 shadow-inner overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30" />
                                Sân Khấu / Stage
                              </div>
                            </div>

                            <div className="relative w-full bg-[#0f172a] overflow-auto py-8 custom-scrollbar">
                              <div className="w-fit mx-auto min-w-[800px] flex justify-center">
                                {memoizedSeatMap}
                              </div>
                            </div>

                            <div className="w-full py-3 bg-slate-800/30 border-t border-slate-800/50 px-6 flex justify-between items-center text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live Seating View
                              </div>
                              <div>
                                Click on occupied seats to view details
                              </div>
                            </div>
                          </div>

                          <div className="xl:col-span-1 bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col gap-5 min-w-0 overflow-hidden animate-in slide-in-from-right-6 duration-500 self-stretch">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-xs">
                                  <Icon name="grid_view" size="sm" />
                                </div>
                                <h3 className="font-black text-slate-800 text-[15px] tracking-tight">Chi tiết</h3>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3.5 max-h-[420px] xl:max-h-[480px] overflow-y-auto pr-1.5 custom-scrollbar">
                              {ticketSalesBreakdown.length === 0 ? (
                                <div className="p-8 text-center italic text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                                  Không tìm thấy phân khu nào.
                                </div>
                              ) : (
                                ticketSalesBreakdown.map((tt) => {
                                  const percentColor = tt.percentage >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-100/40' : tt.percentage >= 30 ? 'text-amber-600 bg-amber-50 border-amber-100/40' : 'text-red-500 bg-red-50 border-red-100/40';

                                  return (
                                    <div
                                      key={tt.id || tt.name}
                                      onClick={() => setSelectedZoneForModal(tt)}
                                      className="rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 group cursor-pointer relative overflow-hidden shrink-0 border-l-4"
                                      style={{
                                        borderLeftColor: tt.color || '#3b82f6',
                                        backgroundColor: `${tt.color || '#3b82f6'}08`,
                                        borderTop: '1px solid #e2e8f020',
                                        borderRight: '1px solid #e2e8f020',
                                        borderBottom: '1px solid #e2e8f020',
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: tt.color || '#3b82f6', boxShadow: `0 0 8px ${tt.color || '#3b82f6'}40` }} />
                                          <div className="min-w-0">
                                            <h4 className="font-black text-slate-800 text-xs truncate leading-tight group-hover:text-primary transition-colors">{tt.name}</h4>
                                            <p className="text-[9px] text-slate-400 font-bold tracking-wide mt-0.5 truncate">{new Intl.NumberFormat('vi-VN').format(tt.price)} đ • Vé {tt.type === 'SEATED' ? 'Đầu' : 'Thường'}</p>
                                          </div>
                                        </div>
                                        <Icon name="chevron_right" size="xs" className="text-slate-300 transition-all group-hover:text-slate-500 group-hover:translate-x-0.5 shrink-0" />
                                      </div>

                                      <div className="grid grid-cols-2 gap-2.5 mt-1">
                                        <div className="bg-white/60 p-2.5 rounded-xl border border-slate-100/50 flex flex-col justify-center">
                                          <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1.5">Đã bán</span>
                                          <span className="text-[11px] font-black text-slate-700 tracking-tight leading-none">{tt.sold} / {tt.total}</span>
                                        </div>
                                        <div className="bg-white/60 p-2.5 rounded-xl border border-slate-100/50 flex flex-col justify-center">
                                          <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1.5">Tỷ lệ</span>
                                          <span className={`text-[11px] font-black tracking-tight leading-none ${percentColor.split(' ')[0]}`}>{tt.percentage}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        <SeatAttendeeModal
                          attendee={selectedSeatInfo}
                          onClose={() => setSelectedSeatInfo(null)}
                          onCheckIn={handleCheckIn}
                        />
                        <ZoneAttendeesModal
                          zone={selectedZoneForModal}
                          attendees={attendees}
                          onClose={() => setSelectedZoneForModal(null)}
                          onCheckIn={handleCheckIn}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'finance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-2xl font-black text-slate-900 tracking-tight">Doanh thu theo tuần</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Báo cáo tài chính chi tiết</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fetchData()}
                          className="w-10 h-10 flex items-center justify-center bg-white text-blue-400 rounded-xl hover:text-primary border border-blue-50 shadow-sm transition-all"
                          title="Làm mới dữ liệu"
                        >
                          <Icon name="refresh" size="sm" />
                        </button>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-primary p-1.5 rounded-xl shadow-lg">
                          <button
                            onClick={() => navigateWeek('prev')}
                            className="w-8 h-8 flex items-center justify-center bg-white/10 text-white rounded-lg hover:bg-white hover:text-primary transition-all active:scale-90"
                          >
                            <Icon name="chevron_left" size="xs" />
                          </button>
                          <div className="px-2 text-center min-w-[140px]">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                              {getWeekRangeString(currentWeekStart)}
                            </span>
                          </div>
                          <button
                            onClick={() => navigateWeek('next')}
                            className="w-8 h-8 flex items-center justify-center bg-white/10 text-white rounded-lg hover:bg-white hover:text-primary transition-all active:scale-90"
                          >
                            <Icon name="chevron_right" size="xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end gap-3 sm:gap-6 h-56 pt-2 relative">
                      {(() => {
                        const hasDataThisWeek = Array.from({ length: 7 }).some((_, i) => {
                          const d = new Date(currentWeekStart);
                          d.setDate(d.getDate() + i);
                          const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          return Number(stats?.dailyRevenue?.[dk] || 0) > 0;
                        });

                        const hasAnyData = Object.values(stats?.dailyRevenue || {}).some(v => Number(v) > 0);

                        if (!hasDataThisWeek && stats?.dailyRevenue) {
                          const findWeekWithData = () => {
                            const keys = Object.keys(stats.dailyRevenue).filter(k => Number(stats.dailyRevenue[k]) > 0);
                            if (keys.length === 0) return null;
                            const latestDateString = keys.sort().reverse()[0];
                            const latestDate = new Date(latestDateString);
                            const day = latestDate.getDay();
                            const diff = latestDate.getDate() - (day === 0 ? 6 : day - 1);
                            const monday = new Date(latestDate.setDate(diff));
                            monday.setHours(0, 0, 0, 0);
                            return monday;
                          };

                          const weekWithData = findWeekWithData();

                          return (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 animate-in fade-in duration-700 z-20">
                              <Icon name="insert_chart" size="lg" className="mb-4 opacity-10 scale-150" />
                              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Không có dữ liệu tuần này</p>
                              {hasAnyData && weekWithData && (
                                <button
                                  onClick={() => setCurrentWeekStart(weekWithData)}
                                  className="px-6 py-3 bg-gradient-to-r from-primary to-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-100"
                                >
                                  Xem tuần có doanh thu gần nhất
                                </button>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date(currentWeekStart);
                        d.setDate(d.getDate() + i);

                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const dateKey = `${year}-${month}-${day}`;

                        if (i === 0) console.log('Finance Debug - First day key in chart:', dateKey);

                        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                        // Ensure we parse the revenue correctly regardless of format
                        const rawRevenue = stats?.dailyRevenue?.[dateKey];
                        const revenue = rawRevenue ? Number(rawRevenue) : 0;
                        const valInM = revenue / 1000000;

                        const weekValues = Array.from({ length: 7 }).map((_, idx) => {
                          const dw = new Date(currentWeekStart);
                          dw.setDate(dw.getDate() + idx);
                          const dk = `${dw.getFullYear()}-${String(dw.getMonth() + 1).padStart(2, '0')}-${String(dw.getDate()).padStart(2, '0')}`;
                          const rv = stats?.dailyRevenue?.[dk];
                          return rv ? Number(rv) : 0;
                        });
                        const maxVal = Math.max(...weekValues, 1000000);
                        const h = revenue > 0 ? Math.max((revenue / maxVal) * 100, 2) : 0; // Min 2% height if has revenue

                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 animate-in slide-in-from-bottom duration-700 h-full relative group" style={{ animationDelay: `${i * 100}ms` }}>
                            {/* Tooltip moved here to avoid overflow-hidden clipping */}
                            {revenue > 0 && (
                              <div
                                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-black px-4 py-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[9999] scale-50 group-hover:scale-100 border border-white/10 flex items-center gap-2"
                                style={{ bottom: `calc(${h}% + 40px)` }} // Positioned relative to the bar height
                              >
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                {formatCurrency(revenue)}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/10"></div>
                              </div>
                            )}

                            <div className="w-full bg-slate-50 rounded-2xl relative flex-1 overflow-hidden border border-slate-100/50" >
                              <div
                                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-700 via-primary to-blue-400 rounded-2xl transition-all duration-1000 group-hover:brightness-110 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                style={{ height: `${h}%` }}
                              >
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-900 font-black">{dayNames[d.getDay()]}</span>
                              <span className="text-[9px] text-slate-400 font-black opacity-60">
                                {d.getDate() + '/' + (d.getMonth() + 1)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Revenue Card */}
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-center relative overflow-hidden h-[160px] border border-emerald-500/20">
                      <div className="absolute -right-6 -bottom-6 opacity-10">
                        <Icon name="account_balance_wallet" className="text-[100px]" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Doanh thu hiện thực</p>
                        <h4 className="text-3xl font-black mb-1">{formatCurrency(stats?.totalRevenue || 0)}</h4>
                        <p className="text-[9px] text-emerald-100/40 italic">Đã bao gồm VAT & Phí hệ thống</p>
                      </div>
                    </div>

                    {/* Cost Card */}
                    <div className="bg-gradient-to-br from-rose-600 to-rose-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-center relative overflow-hidden h-[210px] border border-rose-500/20">
                      <div className="absolute -right-6 -bottom-6 opacity-10 text-white">
                        <Icon name="payments" className="text-[100px]" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest">Phí hệ thống đã thu</p>
                        </div>
                        <h4 className="text-3xl font-black mb-1">
                          {formatCurrency(totalPlatformFee)}
                        </h4>
                        <p className="text-[9px] text-rose-100/40 italic">Khấu trừ từ các giao dịch mua vé</p>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_15px_40px_rgba(0,0,0,0.04)] overflow-hidden animate-in slide-in-from-bottom duration-700 delay-200">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-700 to-primary text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                        <Icon name="history" size="xs" />
                      </div>
                      <div>
                        <span className="font-black text-md uppercase block leading-none mb-1">Giao dịch gần nhất</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/10 p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
                        disabled={transactionPage === 1}
                        className="w-7 h-7 flex items-center justify-center hover:bg-white hover:text-primary rounded-lg disabled:opacity-20 transition-all active:scale-90"
                      >
                        <Icon name="chevron_left" size="xs" />
                      </button>
                      <span className="text-[10px] font-black text-white/90 min-w-[32px] text-center">{transactionPage} / {Math.ceil(orders.length / transactionsPerPage) || 1}</span>
                      <button
                        onClick={() => setTransactionPage(p => Math.min(Math.ceil(orders.length / transactionsPerPage), p + 1))}
                        disabled={transactionPage >= Math.ceil(orders.length / transactionsPerPage)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-white hover:text-primary rounded-lg disabled:opacity-20 transition-all active:scale-90"
                      >
                        <Icon name="chevron_right" size="xs" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-blue-50 text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] border-b border-blue-100">
                          <th className="p-5">Mã GD</th>
                          <th className="p-5">Khách hàng</th>
                          <th className="p-5">Số ghế</th>
                          <th className="p-5">Thời gian</th>
                          <th className="p-5">Số tiền</th>
                          <th className="p-5">Thuế hệ thống</th>
                          <th className="p-5">Thực nhận</th>
                          <th className="p-5">Phương thức</th>
                          <th className="p-5">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {orders
                          .slice((transactionPage - 1) * transactionsPerPage, transactionPage * transactionsPerPage)
                          .map((order: any, i: number) => (
                            <tr key={order.id} className="text-sm hover:bg-blue-50/30 transition-all group animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                              <td className="p-5" >
                                <span className="font-mono text-xs text-blue-400 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 group-hover:bg-white transition-colors">#{order.id}</span>
                              </td>
                              <td className="p-5" >
                                <p className="font-black text-slate-900 group-hover:text-primary transition-colors">{order.userName}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{order.userEmail}</p>
                              </td>
                              <td className="p-5">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {(order.tickets || []).map((ticket: any) => {
                                    const isVip = ticket.ticketTypeName?.toLowerCase().includes('vip');
                                    const baseColor = ticket.ticketTypeColor || '#475569';
                                    return (
                                      <span 
                                        key={ticket.id} 
                                        className="px-2 py-0.5 rounded text-xs font-bold border transition-all hover:brightness-95"
                                        style={{
                                          backgroundColor: ticket.ticketTypeColor ? `${ticket.ticketTypeColor}1A` : '#f1f5f9',
                                          color: baseColor,
                                          borderColor: ticket.ticketTypeColor ? `${ticket.ticketTypeColor}4D` : '#e2e8f0'
                                        }}
                                        title={ticket.ticketTypeName}
                                      >
                                        {isVip && <span className="mr-0.5">⭐</span>}{ticket.seatNumber}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="p-5 text-xs text-slate-500 font-bold">
                                {new Date(order.purchaseDate).toLocaleString('vi-VN', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </td>
                              <td className="p-5" >
                                <span className="font-black text-slate-800 text-sm">{formatCurrency(order.totalAmount)}</span>
                              </td>
                              <td className="p-5" >
                                <span className="font-bold text-red-500 text-xs">-{formatCurrency(order.platformFee || 0)}</span>
                              </td>
                              <td className="p-5" >
                                <span className="font-black text-emerald-600 text-base">+{formatCurrency((order.totalAmount || 0) - (order.platformFee || 0))}</span>
                              </td>
                              <td className="p-5">
                                <div className="flex items-center gap-2">
                                  {order.paymentMethod?.toLowerCase().includes('momo') ? (
                                    <img src="https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png" alt="MoMo" className="w-5 h-5 rounded-md object-cover" />
                                  ) : (
                                    <Icon name="credit_card" className="text-slate-400" size="xs" />
                                  )}
                                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{order.paymentMethod || 'COD'}</span>
                                </div>
                              </td>
                              <td className="p-5" >
                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100 shadow-sm inline-block">Thành công</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}




            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-8">
                    <div className="w-24 h-24 bg-yellow-50 rounded-3xl flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-yellow-500">
                        {comments.length > 0
                          ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)
                          : '0.0'}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Icon
                            key={s}
                            name="star"
                            size="xs"
                            className={s <= Math.round(comments.reduce((acc, c) => acc + c.rating, 0) / (comments.length || 1)) ? "text-yellow-400" : "text-slate-200"}
                            filled
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">Xếp hạng trung bình</h4>
                      <p className="text-xs text-slate-500 font-medium">{comments.length} đánh giá (Toàn hệ thống)</p>
                    </div>
                  </div>
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="space-y-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = comments.filter(c => c.rating === star).length;
                        const percentage = comments.length > 0 ? (count / comments.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 mb-1">
                            <span className="text-xs w-4 font-bold">{star}</span>
                            <Icon name="star" size="sm" className="text-yellow-400" filled />
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-10 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                          <Icon name="chat_bubble" size="xs" />
                        </div>
                        {comments.length > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-[15px] font-black text-slate-400 uppercase mb-1">Chưa phản hồi</h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-900 tracking-tighter">
                            {comments.length}
                          </span>
                          <span className="text-[11px] font-black text-indigo-500 uppercase">Feedback</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {comments.map((review, i) => (
                    <div key={review.id || i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                            {review.userName.substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{review.userName}</h4>
                            <span className="text-[10px] text-slate-400">
                              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, s) => (
                            <Icon key={s} name="star" size="xs" className={s < review.rating ? 'text-yellow-400' : 'text-slate-100'} filled />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{review.content}</p>
                      <div className="flex gap-3">
                        <input type="text" placeholder="Gửi phản hồi cho khách..." className="flex-1 px-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 ring-primary/20" />
                        <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl shadow-lg">GỬI</button>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                      <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="chat_bubble_outline" size="md" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Chưa có nhận xét nào</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <div className="bg-white p-20 rounded-3xl border-4 border-dashed border-slate-100 text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="construction" size="xl" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">Tính năng Đang hoàn thiện</h4>
                <p className="text-slate-500 max-w-md mx-auto">Chúng tôi đang đồng bộ hóa bộ công cụ chỉnh sửa để mang lại trải nghiệm tốt nhất. Trong thời gian này, bạn có thể xem thông tin tổng quát.</p>
                <div className="pt-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl"
                  >
                    Quay lại Tổng quan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Event Modal - Localized & Dynamic */}
        {activeEditType && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setActiveEditType(null)} />
            <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/20">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                    <Icon
                      name={
                        activeEditType === 'title' ? 'edit_note' :
                          activeEditType === 'info' ? 'map' :
                            activeEditType === 'description' ? 'description' : 'schedule'
                      }
                      size="sm"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {activeEditType === 'title' ? 'Chỉnh sửa tên sự kiện' :
                        activeEditType === 'info' ? 'Thời gian & Địa điểm' :
                          activeEditType === 'description' ? 'Mô tả chi tiết' : 'Quản lý lịch trình'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cập nhật nội dung tương ứng</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveEditType(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>

              <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {activeEditType === 'title' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên sự kiện mới</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all shadow-inner"
                        value={editForm?.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {activeEditType === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa điểm tổ chức</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all shadow-inner"
                        value={editForm?.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày & Giờ bắt đầu</label>
                      <input
                        type="datetime-local"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all shadow-inner"
                        value={(() => {
                          try {
                            if (!editForm?.startTime) return '';
                            return new Date(editForm.startTime).toISOString().slice(0, 16);
                          } catch (e) {
                            return '';
                          }
                        })()}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {activeEditType === 'description' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung mô tả</label>
                    <textarea
                      rows={10}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all resize-none shadow-inner leading-relaxed"
                      placeholder="Nhập mô tả chi tiết cho sự kiện..."
                      value={editForm?.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                )}

                {activeEditType === 'schedule' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Các mốc lịch trình</label>
                      <button
                        onClick={() => setEditSchedules([...editSchedules, { startTime: [8, 0], activity: '' }])}
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <Icon name="add" size="xs" /> Thêm mốc mới
                      </button>
                    </div>
                    <div className="space-y-3">
                      {editSchedules.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                          <div className="w-24 shrink-0">
                            <input
                              type="time"
                              className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                              value={formatTime(item.startTime)}
                              onChange={(e) => {
                                const [h, m] = e.target.value.split(':').map(Number);
                                const newSchedules = [...editSchedules];
                                newSchedules[idx].startTime = [h, m];
                                setEditSchedules(newSchedules);
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Hoạt động..."
                              className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                              value={item.activity}
                              onChange={(e) => {
                                const newSchedules = [...editSchedules];
                                newSchedules[idx].activity = e.target.value;
                                setEditSchedules(newSchedules);
                              }}
                            />
                          </div>
                          <button
                            onClick={() => setEditSchedules(editSchedules.filter((_, i) => i !== idx))}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Icon name="delete" size="xs" />
                          </button>
                        </div>
                      ))}
                      {editSchedules.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Trống lịch trình</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button
                  onClick={() => setActiveEditType(null)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-50 transition-all uppercase"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleUpdateEvent}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all uppercase"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {scanResult && createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setScanResult(null)} />
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Icon name="qr_code_2" size="xl" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Icon name="fact_check" size="md" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black tracking-tight">Check-in Thành công</h3>
                      <div className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-full animate-bounce">SUCCESS</div>
                    </div>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Đơn hàng #{scanResult.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setScanResult(null)}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
                        <Icon name="person" size="sm" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Người mua</p>
                        <p className="text-sm font-black text-slate-900">{scanResult.userName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Email</p>
                      <p className="text-sm font-bold text-slate-700">{scanResult.userEmail}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Icon name="confirmation_number" size="xs" />
                      Danh sách vé ({scanResult.tickets?.length || 0})
                    </p>
                    <div className="grid gap-3">
                      {scanResult.tickets?.map((ticket: any) => {
                        const isVIP = ticket.ticketTypeName?.toLowerCase().includes('vip');
                        return (
                          <div
                            key={ticket.id}
                            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isVIP
                              ? 'bg-amber-50/50 border-amber-200/50 shadow-sm shadow-amber-100/20'
                              : 'bg-primary/5 border-primary/10 shadow-sm shadow-primary/5'
                              }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isVIP ? 'bg-amber-500 text-white' : 'bg-primary text-white'
                                }`}>
                                <Icon name={isVIP ? "stars" : "confirmation_number"} size="xs" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${isVIP ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
                                    }`}>
                                    {ticket.ticketTypeName}
                                  </span>
                                  <span className="text-xs font-black text-slate-400">|</span>
                                  <span className="text-sm font-black text-slate-900">Ghế {ticket.seatNumber}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-600 mt-0.5 truncate max-w-[200px]">{ticket.sessionName}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-base font-black text-slate-900">{formatCurrency(ticket.price)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0 text-center">
                <button
                  onClick={() => setScanResult(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-xl hover:shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Icon name="done_all" size="sm" />
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </DashboardLayout>
  );
};


export default AdminEventManage;
