import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { DashboardLayout, PageHeader } from '../components/layout';
import { organizerSidebarConfig } from '../config/organizerSidebarConfig';
import { Icon, Loader } from '../components/ui';
import Avatar from '../components/ui/Avatar';
import { EventService } from '../services/eventService';
import toast from 'react-hot-toast';
import { EditEventModal, ImagePreviewModal, SeatAttendeeModal } from './OrganizerEventModals';
import { Html5Qrcode } from 'html5-qrcode';

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
    orderId: number;
    seatNumber: string;
    ticketTypeName: string;
    status: string;
    purchaseDate: string;
    checkInDate?: string;
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

const OrganizerEventManage = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'finance' | 'feedback' | 'edit'>(
        (location.state as any)?.tab || 'overview'
    );
    const [event, setEvent] = useState<any>(null);
    const [stats, setStats] = useState<ManageStats | null>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [seats, setSeats] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [eventOrders, setEventOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [guestViewMode, setGuestViewMode] = useState<'list' | 'seats'>('list');
    const [selectedSeatInfo, setSelectedSeatInfo] = useState<Attendee | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    const handleReply = async (commentId: number) => {
        const reply = replyTexts[commentId]?.trim() || "Ban tổ chức sẽ rút kinh nghiệm, cảm ơn bạn đã nhận xét";

        try {
            await EventService.replyToComment(commentId, reply);
            toast.success("Đã gửi phản hồi");
            setReplyTexts(prev => ({ ...prev, [commentId]: "" }));
            // Refresh comments
            const updatedComments = await EventService.getEventComments(id!);
            setComments(updatedComments);
        } catch (error) {
            toast.error("Không thể gửi phản hồi");
        }
    };

    const handleToggleLike = async (commentId: number) => {
        try {
            await EventService.toggleLikeComment(commentId);
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, isLikedByOrganizer: !c.isLikedByOrganizer } : c
            ));
        } catch (error) {
            toast.error("Thao tác thất bại");
        }
    };

    // Finance pagination
    const [transactionPage, setTransactionPage] = useState(1);
    const transactionsPerPage = 5;

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

    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [aiPlanResult, setAiPlanResult] = useState<any>(null);

    const generateAIPlan = () => {
        setIsGeneratingPlan(true);
        setTimeout(() => {
            setAiPlanResult({
                tasks: [
                    { id: 1, text: "Chốt danh sách nhà cung cấp F&B", priority: 'High' },
                    { id: 2, text: "Gửi thư mời điện tử & QR Code cho khách", priority: 'High' },
                    { id: 3, text: "Kiểm duyệt kịch bản âm thanh ánh sáng", priority: 'Medium' },
                    { id: 4, text: "Chuẩn bị quà tặng lưu niệm (Gift box)", priority: 'Low' },
                    { id: 5, text: "Xây dựng layout mặt bằng bố trí", priority: 'Medium' }
                ],
                tools: [
                    { name: "Màn hình LED P2.5", qty: 1, unit: "Bộ" },
                    { name: "Hệ thống Mic không dây", qty: 6, unit: "Cái" },
                    { name: "Standee đón khách", qty: 12, unit: "Tấm" },
                    { name: "Thẻ đeo nhân sự", qty: 30, unit: "Bộ" }
                ],
                budgetSections: [
                    {
                        id: 'III',
                        title: 'Dàn dựng và trang trí',
                        total: 450000000,
                        subSections: [
                            {
                                id: 'A',
                                title: 'Khu vực đón khách',
                                items: [
                                    { stt: 1, item: 'Cổng chào', unit: 'chiếc', qty: 1, unitPrice: 25000000, remarks: 'Thiết kế theo theme sự kiện' },
                                    { stt: 2, item: 'Standee', unit: 'chiếc', qty: 10, unitPrice: 500000, remarks: 'Thiết kế theo theme sự kiện' },
                                    { stt: 3, item: 'Banner dọc', unit: 'chiếc', qty: 10, unitPrice: 300000, remarks: 'Thiết kế theo theme sự kiện' },
                                    { stt: 4, item: 'Backdrop chụp hình', unit: 'chiếc', qty: 1, unitPrice: 15000000, remarks: 'Thiết kế theo theme sự kiện, platform và đèn trang trí' },
                                    { stt: 5, item: 'Cánh cửa thần kỳ', unit: 'bộ', qty: 5, unitPrice: 20000000, remarks: 'Cánh cửa lớn thiết kế kiểu hightech và màn hình' },
                                ]
                            },
                            {
                                id: 'B',
                                title: 'Khu vực phòng tiệc',
                                items: [
                                    { stt: 6, item: 'Sân khấu', unit: 'gói', qty: 1, unitPrice: 250000000, remarks: 'Sân khấu lớn và hoàn thiện bề mặt. Bậc lên xuống sân khấu. Thiết kế trang trí vách sân khấu' },
                                    { stt: 7, item: 'Hệ thống giàn Truss', unit: 'gói', qty: 1, unitPrice: 50000000, remarks: 'Cho sân khấu, màn LED nhiều lớp, hệ thống ATAS' },
                                    { stt: 8, item: 'Bục phát biểu và logo', unit: 'gói', qty: 1, unitPrice: 2000000, remarks: '' },
                                ]
                            }
                        ]
                    },
                    {
                        id: 'IV',
                        title: 'Thiết bị',
                        total: 320000000,
                        subSections: [
                            {
                                id: 'A',
                                title: 'Hệ thống âm thanh ánh sáng',
                                items: [
                                    { stt: 1, item: 'Hệ thống ATAS', unit: 'gói', qty: 1, unitPrice: 60000000, remarks: '' },
                                    { stt: 2, item: 'Màn LED', unit: 'gói', qty: 1, unitPrice: 180000000, remarks: 'Hệ thống màn LED lớn nhiều lớp' },
                                    { stt: 3, item: 'Hệ thống trượt màn LED', unit: 'gói', qty: 1, unitPrice: 20000000, remarks: 'Có thể trượt để mở màn LED' },
                                ]
                            }
                        ]
                    }
                ]
            });
            setIsGeneratingPlan(false);
        }, 3500);
    };

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
            const [eventData, statsData, attendeesData, seatsData, commentsData, ordersData] = await Promise.all([
                EventService.getEventById(id),
                EventService.getEventManageStats(id),
                EventService.getEventAttendees(id),
                EventService.getEventSeats(id),
                EventService.getEventComments(id),
                EventService.getEventOrders(id)
            ]);
            setEvent(eventData);
            setStats(statsData);
            setAttendees(attendeesData);
            setSeats(seatsData || []);
            setComments(commentsData || []);
            setEventOrders(ordersData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResubmit = async () => {
        if (!id) return;
        const loadingToast = toast.loading('Đang gửi lại yêu cầu...');
        try {
            await EventService.resubmitEvent(id);
            toast.success('Đã gửi lại yêu cầu phê duyệt thành công', { id: loadingToast });
            fetchData();
        } catch (error: any) {
            console.error('Error resubmitting event:', error);
            toast.error(error.response?.data?.message || 'Gửi lại yêu cầu thất bại', { id: loadingToast });
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

    // Scroll lock when modal is open
    useEffect(() => {
        if (activeEditType || selectedSeatInfo) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [activeEditType, selectedSeatInfo]);

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

    // QR Scanning Logic
    const [qrError, setQrError] = useState<string | null>(null);

    const handleQrSuccess = async (decodedText: string) => {
        try {
            await EventService.checkInOrderByQR(decodedText);
            toast.success("Check-in thành công cho toàn bộ đơn hàng!");
            setIsScanning(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Mã QR không hợp lệ hoặc đã được sử dụng");
        }
    };

    useEffect(() => {
        let html5QrCode: Html5Qrcode | null = null;

        if (isScanning && activeTab === 'guests') {
            html5QrCode = new Html5Qrcode("qr-reader");
            
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
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

    useEffect(() => {
        const isModalOpen = !!selectedSeatInfo || isGeneratingPlan || !!activeEditType;
        if (isModalOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [selectedSeatInfo, isGeneratingPlan, activeEditType]);



    const handleCheckIn = async (ticketId: number, currentStatus: string) => {
        if (currentStatus === 'CHECKED_IN') {
            toast.error('Không thể hoàn tác check-in');
            return;
        }

        try {
            await EventService.checkInTicket(ticketId, true);
            toast.success('Check-in thành công');
            // Refresh everything to get the latest dates and statuses
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const filteredAttendees = attendees.filter(a =>
        a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.seatNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <DashboardLayout sidebarProps={organizerSidebarConfig}>
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


    const handleUpdateEvent = async (formData: any, schedulesData: any[]) => {
        try {
            // Mock update - Cập nhật state cục bộ để UI phản hồi ngay lập tức
            const updatedEvent = { ...event, ...formData, schedules: schedulesData };
            setEvent(updatedEvent);

            // Ở đây có thể gọi API thực tế nếu cần:
            // await EventService.updateEvent(id, updatedEvent);

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
        <DashboardLayout sidebarProps={organizerSidebarConfig}>
            <div className="min-h-screen bg-slate-50" style={{ scrollbarGutter: 'stable' }}>
                <PageHeader
                    title={event?.title || 'Quản lý sự kiện'}
                    subtitle="Theo dõi và quản lý chi tiết sự kiện của bạn"
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-10">
                    {/* Tab Navigation - Fixed structure with sticky behavior */}
                    <div className="sticky top-[80px] z-40 py-4 transition-all flex justify-start items-center gap-4">
                        <Link
                            to="/organizer/events"
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
                                {/* Rejection Alert */}
                                {event?.status === 'rejected' && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-3xl flex flex-col md:flex-row items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                                            <Icon name="error" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-red-900 font-black text-sm uppercase tracking-widest">Sự kiện bị từ chối</h4>
                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-lg font-black uppercase">Cần chỉnh sửa</span>
                                            </div>
                                            <p className="text-red-700 text-sm font-medium leading-relaxed bg-white/50 p-4 rounded-2xl border border-red-100 mb-4">
                                                <span className="text-red-400 font-black mr-2">LÝ DO:</span>
                                                {event?.rejectReason || 'Quản trị viên chưa cung cấp lý do cụ thể. Vui lòng liên hệ hỗ trợ.'}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <button
                                                    onClick={handleResubmit}
                                                    className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2"
                                                >
                                                    <Icon name="send" size="sm" /> Gửi lại yêu cầu phê duyệt
                                                </button>
                                                <div className="flex items-center gap-2 text-red-600">
                                                    <Icon name="info" size="xs" />
                                                    <p className="text-[10px] font-bold uppercase tracking-wider italic">Cập nhật thông tin dựa trên phản hồi trước khi gửi lại.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                                <Icon name="format_quote" size="xl" className="text-slate-900" />
                                            </div>
                                            <h5 className="font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center justify-between relative z-10">
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
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng khách mời</p>
                                        <p className="text-2xl font-black text-slate-900">{stats?.soldSeats}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đã check-in</p>
                                        <p className="text-2xl font-black text-emerald-600">{stats?.checkedInSeats}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Chưa đến</p>
                                        <p className="text-2xl font-black text-orange-600">{(stats?.soldSeats || 0) - (stats?.checkedInSeats || 0)}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tỷ lệ tham gia</p>
                                        <p className="text-2xl font-black text-purple-600">{Math.round(((stats?.checkedInSeats || 0) / (stats?.soldSeats || 1)) * 100)}%</p>
                                    </div>
                                </div>

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

                                    <button
                                        onClick={() => setIsScanning(!isScanning)}
                                        className={`ml-auto px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isScanning ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}
                                    >
                                        <Icon name={isScanning ? "videocam_off" : "videocam"} size="sm" />
                                        {isScanning ? "Tắt Camera" : "Quét mã QR Check-in"}
                                    </button>
                                </div>

                                {isScanning && (
                                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-300">
                                        <div className="max-w-md mx-auto space-y-6">
                                            <div className="text-center space-y-2">
                                                <h4 className="text-lg font-black text-slate-900">Quét mã QR đơn hàng</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đưa mã QR của khách vào khung hình để tự động check-in</p>
                                            </div>

                                            {qrError && (
                                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold text-center">
                                                    {qrError}
                                                </div>
                                            )}

                                            <div id="qr-reader" className="overflow-hidden rounded-3xl border-4 border-slate-100 bg-slate-950 shadow-inner aspect-square flex items-center justify-center relative">
                                                {!qrError && !isScanning && (
                                                    <div className="text-slate-500 flex flex-col items-center gap-2">
                                                        <Icon name="videocam_off" size="lg" />
                                                        <span className="text-xs font-bold">Camera đang tắt</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <label className="flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 p-4 rounded-2xl border border-slate-200 cursor-pointer transition-all active:scale-95 group">
                                                    <Icon name="upload_file" size="sm" className="text-slate-600 group-hover:text-primary transition-colors" />
                                                    <span className="text-xs font-black text-slate-700">Tải ảnh QR từ thiết bị</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                                </label>
                                                
                                                <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                                    <Icon name="info" size="sm" className="text-blue-500" />
                                                    <p className="text-[10px] text-blue-700 font-bold leading-relaxed italic">
                                                        Mẹo: Giữ mã QR cách camera khoảng 15-20cm để lấy nét tốt nhất.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {guestViewMode === 'list' ? (
                                    <div className="lg:col-span-2 space-y-4">


                                        {/* Redesigned Table/List */}
                                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-separate border-spacing-0">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-100">
                                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">Khách mời</th>
                                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">Thông tin vé</th>
                                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">Check-in Date</th>
                                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">Trạng thái</th>
                                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 text-center">Hành động</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50/80">
                                                        {Object.values(filteredAttendees.reduce((acc, current) => {
                                                            const key = current.orderId ? `order-${current.orderId}` : `user-${current.userEmail}`;
                                                            if (!acc[key]) acc[key] = { ...current, tickets: [] };
                                                            acc[key].tickets.push(current);
                                                            return acc;
                                                        }, {} as Record<string, Attendee & { tickets: Attendee[] }>)).map((group, idx) => (
                                                            <tr
                                                                key={group.orderId || group.userEmail}
                                                                className="group hover:bg-slate-50/50 transition-all duration-300 relative"
                                                                style={{ animationDelay: `${idx * 50}ms` }}
                                                            >
                                                                <td className="px-8 py-6 relative">
                                                                    {/* Subtle hover accent */}
                                                                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-r-full" />
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-sm shadow-sm border border-white">
                                                                            {group.userName.substring(0, 1).toUpperCase()}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-black text-slate-900 text-sm tracking-tight group-hover:text-primary transition-colors">{group.userName}</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] text-slate-400 font-bold tracking-tight">{group.userEmail}</span>
                                                                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-black">ID: #{group.orderId}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                                        {group.tickets.map((t, tidx) => (
                                                                            <div key={tidx} className={`px-2.5 py-1 rounded-xl text-[10px] font-black shadow-sm border ${t.ticketTypeName.toUpperCase().includes('VIP')
                                                                                ? 'bg-amber-500 text-white border-amber-400 shadow-amber-200/50'
                                                                                : 'bg-primary text-white border-primary/20 shadow-primary/20'}`}>
                                                                                {t.seatNumber}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1.5">
                                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                                        {group.tickets.length} vé • {group.tickets[0].ticketTypeName}
                                                                    </p>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    {group.checkInDate ? (
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[11px] font-black text-slate-700">
                                                                                {new Date(group.checkInDate).toLocaleString('vi-VN', {
                                                                                    hour: '2-digit', minute: '2-digit'
                                                                                })}
                                                                            </span>
                                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                                                {new Date(group.checkInDate).toLocaleString('vi-VN', {
                                                                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold text-slate-300 italic">Chưa check-in</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    {group.tickets.every(t => t.status === 'CHECKED_IN') ? (
                                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                                            Hoàn tất ({group.tickets.length})
                                                                        </div>
                                                                    ) : group.tickets.some(t => t.status === 'CHECKED_IN') ? (
                                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-100">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                                            {group.tickets.filter(t => t.status === 'CHECKED_IN').length}/{group.tickets.length} Đã đến
                                                                        </div>
                                                                    ) : (
                                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-100">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                                            Chưa đến
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-8 py-6 text-center">
                                                                    <div className="flex items-center justify-center gap-2.5">
                                                                        {group.tickets.map((t, tidx) => (
                                                                            <button
                                                                                key={tidx}
                                                                                onClick={() => handleCheckIn(t.ticketId, t.status)}
                                                                                className={`w-10 h-10 rounded-[1.15rem] flex items-center justify-center transition-all shadow-sm font-black text-[11px] relative overflow-hidden group/btn ${t.status === 'CHECKED_IN'
                                                                                    ? 'bg-emerald-600 text-white shadow-emerald-200 ring-4 ring-emerald-50 border-emerald-500'
                                                                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-primary hover:text-primary hover:scale-110 active:scale-95 shadow-slate-100'}`}
                                                                            >
                                                                                {t.status === 'CHECKED_IN' ? <Icon name="done" size="xs" /> : t.seatNumber}
                                                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {filteredAttendees.length === 0 && (
                                                            <tr>
                                                                <td colSpan={4} className="py-20 text-center">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-2">
                                                                            <Icon name="search_off" size="xl" />
                                                                        </div>
                                                                        <h5 className="font-black text-slate-900">Không tìm thấy khách mời</h5>
                                                                        <p className="text-xs text-slate-400 font-bold max-w-[200px] leading-relaxed">Hãy thử tìm kiếm bằng một từ khóa khác</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm" >
                                        <div className="max-w-4xl mx-auto space-y-12" >
                                            <div className="text-center space-y-3" >
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight" >Sơ đồ khán đài thực tế</h4>
                                                <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400" >
                                                    <div className="flex items-center gap-2" >
                                                        <div className="w-3 h-3 rounded-sm bg-slate-900" /> <span>Đã bán (Thường)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2" >
                                                        <div className="w-3 h-3 rounded-sm bg-amber-500" /> <span>Đã bán (VIP)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2" >
                                                        <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/30" /> <span>Trống (Thường)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2" >
                                                        <div className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200" /> <span>Trống (VIP)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stage */}
                                            <div className="w-full h-3 bg-slate-200 rounded-full relative shadow-inner overflow-hidden mb-16" >
                                                <div className="absolute inset-x-0 h-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                                                <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]" >Sân Khấu / Stage</p>
                                            </div>

                                            <div className="flex flex-col items-center gap-3 overflow-x-auto pb-8" >
                                                {Array.from(new Set(seats.map((s: any) => s.seatNumber.charAt(0)))).sort().map(row => (
                                                    <div key={row} className="flex gap-2" >
                                                        <div className="w-8 flex items-center justify-center text-[10px] font-black text-slate-300" >{row}</div>
                                                        <div className="flex gap-1.5 md:gap-2" >
                                                            {seats.filter((s: any) => s.seatNumber.startsWith(row))
                                                                .sort((a, b) => {
                                                                    const numA = parseInt(a.seatNumber.substring(1));
                                                                    const numB = parseInt(b.seatNumber.substring(1));
                                                                    return numA - numB;
                                                                })
                                                                .map((seat: any) => {
                                                                    const isOccupied = seat.status !== 'AVAILABLE';
                                                                    const attendee = isOccupied ? attendees.find(a => a.seatNumber === seat.seatNumber) : null;
                                                                    const isVIP = seat.ticketTypeName?.toUpperCase().includes('VIP');

                                                                    return (
                                                                        <div
                                                                            key={seat.id}
                                                                            onClick={() => {
                                                                                if (attendee) setSelectedSeatInfo(attendee);
                                                                            }}
                                                                            title={`${seat.seatNumber} - ${seat.ticketTypeName} - ${isOccupied ? 'Đã bán' : 'Trống'}`}
                                                                            className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${isOccupied
                                                                                ? `${isVIP ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-primary'} text-white cursor-pointer hover:scale-110 shadow-lg shadow-slate-200`
                                                                                : `${isVIP ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-primary/5 text-primary border border-primary/20'} hover:scale-110 cursor-help`
                                                                                }`}
                                                                        >
                                                                            {isOccupied ? <Icon name="person" size="xs" /> : seat.seatNumber.substring(1)}
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <SeatAttendeeModal
                                                attendee={selectedSeatInfo}
                                                onClose={() => setSelectedSeatInfo(null)}
                                                onCheckIn={handleCheckIn}
                                            />
                                        </div>
                                    </div>
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

                                        {/* Cost Card (Mockup) */}
                                        <div className="bg-gradient-to-br from-rose-600 to-rose-950 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden h-[210px] border border-rose-500/20">
                                            <div className="absolute -right-6 -bottom-6 opacity-10 text-white">
                                                <Icon name="payments" className="text-[100px]" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest">Chi phí sự kiện</p>
                                                </div>
                                                <h4 className="text-3xl font-black mb-1">{formatCurrency(0)}</h4>
                                                <p className="text-[9px] text-rose-100/40 italic">Ước tính phí vận hành & Quảng cáo</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction Table - Compact & Modern */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
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
                                            <span className="text-[10px] font-black text-white/90 min-w-[32px] text-center">{transactionPage} / {Math.ceil(eventOrders.length / transactionsPerPage) || 1}</span>
                                            <button
                                                onClick={() => setTransactionPage(p => Math.min(Math.ceil(eventOrders.length / transactionsPerPage), p + 1))}
                                                disabled={transactionPage >= Math.ceil(eventOrders.length / transactionsPerPage)}
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
                                                {eventOrders
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
                                                                        return (
                                                                            <span key={ticket.id} className={`px-2 py-0.5 rounded text-xs font-bold border ${isVip ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
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
                                                                        <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png" alt="VNPAY" className="w-5 h-5 rounded-md object-contain" />
                                                                    )}
                                                                    <span className="text-xs font-bold text-slate-700">{order.paymentMethod || 'VNPAY'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-5" >
                                                                {order.status === 'COMPLETED' ? (
                                                                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100 shadow-sm">Thành công</span>
                                                                ) : order.status === 'PENDING' ? (
                                                                    <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-100 shadow-sm">Chờ xử lý</span>
                                                                ) : (
                                                                    <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-red-100 shadow-sm">{order.status}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* AI Planning Section */}
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
                                        {!aiPlanResult && !isGeneratingPlan && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 space-y-6">
                                                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 group-hover:scale-110 transition-transform duration-500">
                                                    <Icon name="auto_awesome" className="text-white text-4xl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Kế hoạch & Dự toán AI</h4>
                                                    <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">Sử dụng trí tuệ nhân tạo để tự động hóa danh sách công việc, dụng cụ cần thiết và dự toán ngân sách chi tiết cho sự kiện này.</p>
                                                </div>
                                                <button
                                                    onClick={generateAIPlan}
                                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:translate-y-[-2px] flex items-center gap-3"
                                                >
                                                    <Icon name="bolt" size="sm" />
                                                    BẮT ĐẦU TẠO NGAY
                                                </button>
                                            </div>
                                        )}

                                        {isGeneratingPlan && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 bg-slate-50/80">
                                                <div className="relative w-32 h-32">
                                                    <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
                                                    <div className="absolute inset-0 border-4 border-t-purple-600 rounded-full animate-spin"></div>
                                                    <div className="absolute inset-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                                                        <Icon name="psychology" className="text-white text-3xl" />
                                                    </div>
                                                    {/* Floating particles simulation */}
                                                    <div className="absolute -top-4 -right-4 w-4 h-4 bg-pink-400 rounded-full animate-ping"></div>
                                                    <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                                                </div>
                                                <div className="space-y-2 text-center">
                                                    <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse">ĐANG PHÂN TÍCH SỰ KIỆN...</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">AI đang thiết lập công việc & ngân sách</p>
                                                </div>
                                            </div>
                                        )}

                                        {aiPlanResult && (
                                            <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all group/header hover:border-purple-200">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover/header:rotate-12 transition-transform duration-500">
                                                            <Icon name="auto_awesome" size="md" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                                Kế hoạch & Dự toán AI
                                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-[8px] font-black uppercase tracking-tighter">Premium Gen</span>
                                                            </h4>
                                                            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Tối ưu hóa ngân sách dựa trên loại hình sự kiện & mục tiêu</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                                                            <Icon name="download" size="xs" /> PDF Report
                                                        </button>
                                                        <button
                                                            onClick={generateAIPlan}
                                                            className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"
                                                            title="Tạo lại kế hoạch"
                                                        >
                                                            <Icon name="refresh" size="sm" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    {/* Column 1: Tasks */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                                                                <h5 className="font-black text-xs uppercase tracking-widest text-slate-700">Công việc trọng tâm</h5>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400">{aiPlanResult.tasks.length} nhiệm vụ</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {aiPlanResult.tasks.map((task: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md hover:border-purple-200 transition-all">
                                                                    <div className="w-6 h-6 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center group-hover:border-purple-500 transition-colors">
                                                                        <div className="w-2 h-2 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-bold text-slate-700 leading-tight">{task.text}</p>
                                                                    </div>
                                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-red-50 text-red-500 border border-red-100' :
                                                                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-slate-100 text-slate-400'
                                                                        }`}>{task.priority}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Column 2: Tools */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                                                                <h5 className="font-black text-xs uppercase tracking-widest text-slate-700">Tài liệu & Thiết bị</h5>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400">{aiPlanResult.tools.length} loại</span>
                                                        </div>
                                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                                                            {aiPlanResult.tools.map((tool: any, idx: number) => (
                                                                <div key={idx} className="p-4 flex justify-between items-center hover:bg-white group transition-all">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 bg-white border border-slate-200 text-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-pink-50 transition-all">
                                                                            <Icon name="inventory_2" size="xs" />
                                                                        </div>
                                                                        <span className="text-sm font-bold text-slate-700">{tool.name}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-[10px] font-black text-slate-600 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">{tool.qty} {tool.unit}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Full Width Spreadsheet Section */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between bg-slate-900 p-5 rounded-3xl text-white shadow-xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                                                        <div className="flex items-center gap-3 relative z-10">
                                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                                                                <Icon name="table_chart" size="sm" />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-black text-sm uppercase tracking-widest">DỰ TOÁN NGÂN SÁCH CHI TIẾT</h5>
                                                                <p className="text-[9px] text-white/50 font-bold uppercase tracking-tighter">Dựa trên khối lượng và đơn giá thực tế</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right relative z-10">
                                                            <p className="text-[9px] text-white/50 font-bold uppercase mb-1">Tổng cộng dự toán</p>
                                                            <p className="text-2xl font-black text-primary">
                                                                {formatCurrency(aiPlanResult.budgetSections.reduce((acc: number, cur: any) => acc + cur.total, 0))}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                                                        <div className="overflow-x-auto custom-scrollbar">
                                                            <table className="w-full text-xs font-bold border-collapse">
                                                                <thead>
                                                                    <tr className="bg-orange-500 text-white text-[10px] uppercase tracking-widest shadow-lg">
                                                                        <th className="p-4 border border-orange-600 w-12 text-center first:rounded-tl-[2rem]">STT</th>
                                                                        <th className="p-4 border border-orange-600 text-left min-w-[300px]">Mục</th>
                                                                        <th className="p-4 border border-orange-600 text-center w-28">Đơn vị</th>
                                                                        <th className="p-4 border border-orange-600 text-center w-28">Số lượng</th>
                                                                        <th className="p-4 border border-orange-600 text-right min-w-[130px]">Đơn giá</th>
                                                                        <th className="p-4 border border-orange-600 text-right min-w-[160px]">Thành tiền (VND)</th>
                                                                        <th className="p-4 border border-orange-600 text-left min-w-[280px] last:rounded-tr-[2rem]">Chú thích</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {aiPlanResult.budgetSections.map((section: any) => (
                                                                        <React.Fragment key={section.id}>
                                                                            {/* Main Section Header */}
                                                                            <tr className="bg-[#a6ce39] text-white leading-loose shadow-sm">
                                                                                <td className="p-4 border border-emerald-600 text-center uppercase font-black">{section.id}</td>
                                                                                <td className="p-4 border border-emerald-600 uppercase tracking-widest font-black" colSpan={4}>{section.title}</td>
                                                                                <td className="p-4 border border-emerald-600 text-right font-black text-sm">{formatCurrency(section.total).replace('₫', '')}</td>
                                                                                <td className="p-4 border border-emerald-600"></td>
                                                                            </tr>

                                                                            {section.subSections.map((sub: any) => (
                                                                                <React.Fragment key={sub.id}>
                                                                                    {/* Sub-section Header */}
                                                                                    <tr className="bg-slate-50 text-slate-900 border-b border-slate-200">
                                                                                        <td className="p-4 border-x border-slate-100 text-center font-black">{sub.id}</td>
                                                                                        <td className="p-4 border-x border-slate-100 font-black pl-8" colSpan={6}>{sub.title}</td>
                                                                                    </tr>

                                                                                    {sub.items.map((item: any) => (
                                                                                        <tr key={`${section.id}-${sub.id}-${item.stt}`} className="text-slate-600 hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                                                                                            <td className="p-4 border-x border-slate-100 text-center font-medium">{item.stt}</td>
                                                                                            <td className="p-4 border-x border-slate-100 pl-10 font-bold text-slate-800">{item.item}</td>
                                                                                            <td className="p-4 border-x border-slate-100 text-center font-medium italic text-slate-400">{item.unit}</td>
                                                                                            <td className="p-4 border-x border-slate-100 text-center font-black text-slate-700">{item.qty}</td>
                                                                                            <td className="p-4 border-x border-slate-100 text-right font-medium">{formatCurrency(item.unitPrice).replace('₫', '')}</td>
                                                                                            <td className="p-4 border-x border-slate-100 text-right font-black text-slate-900">{formatCurrency(item.qty * item.unitPrice).replace('₫', '')}</td>
                                                                                            <td className="p-4 border-x border-slate-100 text-xs font-normal italic leading-relaxed text-slate-400 group-hover:text-slate-600 transition-colors">
                                                                                                {item.remarks}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </React.Fragment>
                                                                            ))}
                                                                        </React.Fragment>
                                                                    ))}
                                                                    {/* Final Total Row */}
                                                                    <tr className="bg-slate-900 text-white">
                                                                        <td colSpan={5} className="p-6 border border-slate-900 text-right uppercase tracking-[0.2em] font-black text-[10px] text-white/50">TỔNG CỘNG HỆ THỐNG DỰ TOÁN</td>
                                                                        <td className="p-6 border border-slate-900 text-right font-black text-2xl text-primary">
                                                                            {formatCurrency(aiPlanResult.budgetSections.reduce((acc: number, cur: any) => acc + cur.total, 0))}
                                                                        </td>
                                                                        <td className="p-6 border border-slate-900"></td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                                                        <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                                                            <Icon name="info" size="sm" />
                                                        </div>
                                                        <div>
                                                            <h6 className="text-[11px] font-black text-amber-900 uppercase">Lưu ý quan trọng</h6>
                                                            <p className="text-[10px] text-amber-700 font-medium leading-relaxed italic">Dự toán này mang tính chất tham khảo dựa trên dữ liệu thị trường hiện tại. Chi phí thực tế có thể thay đổi tùy thuộc vào nhà cung cấp và thời điểm đặt hàng.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'feedback' && (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                {/* Summary Statistics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Average Rating Box */}
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center gap-6 relative overflow-hidden group">
                                        <div className="w-20 h-20 bg-yellow-400 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-200/50">
                                            <span className="text-4xl font-black leading-none tracking-tighter">
                                                {comments.length > 0 ? (comments.reduce((a, b) => a + b.rating, 0) / comments.length).toFixed(1) : "0.0"}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Xếp hạng trung bình</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-base text-slate-900 font-black whitespace-nowrap">{comments.length} đánh giá</span>
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Icon
                                                            key={s}
                                                            name="star"
                                                            size="lg"
                                                            className={s <= Math.round(Number(comments.length > 0 ? (comments.reduce((a, b) => a + b.rating, 0) / comments.length) : 0)) ? "text-yellow-400" : "text-slate-100"}
                                                            filled
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Distribution Box */}
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden group">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Phân bổ đánh giá</h4>
                                        <div className="space-y-2.5">
                                            {[5, 4, 3, 2, 1].map((star) => {
                                                const count = comments.filter(c => c.rating === star).length;
                                                const pct = comments.length > 0 ? (count / comments.length) * 100 : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-3">
                                                        <span className="text-sm font-black text-slate-900 w-4">{star}</span>
                                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900 w-10 text-right">{pct.toFixed(0)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Needed Box */}
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-all">
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Cần phản hồi</h4>
                                            <div className="flex items-baseline gap-4">
                                                <p className="text-5xl font-black text-slate-900 tracking-tighter">
                                                    {comments.filter(c => !c.reply).length}
                                                </p>
                                                <div className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-sm">
                                                    <span className="text-xs font-black uppercase tracking-widest">Tồn đọng</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform duration-500">
                                            <Icon name="chat_bubble" size="sm" filled />
                                        </div>
                                    </div>
                                </div>

                                {/* All Reviews */}
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Tất cả nhận xét</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={() => setRatingFilter(null)}
                                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 border ${ratingFilter === null
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                                                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'
                                                    }`}
                                            >
                                                Tất cả
                                            </button>
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const starColors: any = {
                                                    5: 'bg-amber-500 border-amber-500 shadow-amber-500/20',
                                                    4: 'bg-blue-500 border-blue-500 shadow-blue-500/20',
                                                    3: 'bg-emerald-500 border-emerald-500 shadow-emerald-500/20',
                                                    2: 'bg-orange-500 border-orange-500 shadow-orange-500/20',
                                                    1: 'bg-rose-500 border-rose-500 shadow-rose-500/20'
                                                };
                                                return (
                                                    <button
                                                        key={star}
                                                        onClick={() => setRatingFilter(star)}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-500 border flex items-center gap-1.5 ${ratingFilter === star
                                                            ? `${starColors[star]} text-white shadow-lg`
                                                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'
                                                            }`}
                                                    >
                                                        {star} <Icon name="star" size="xs" filled />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {(() => {
                                        const filteredComments = comments.filter(review => ratingFilter === null || review.rating === ratingFilter);
                                        if (filteredComments.length === 0) {
                                            return (
                                                <div className="p-20 text-center text-gray-900 font-black uppercase text-sm border-2 border-gray-200 bg-gray-50/50 rounded-[3rem]">
                                                    {ratingFilter ? `Chưa có nhận xét ${ratingFilter} sao` : "Chưa có nhận xét nào"}
                                                </div>
                                            );
                                        }
                                        return (
                                            <>
                                                {filteredComments.map((review, i) => (
                                                    <div
                                                        key={review.id || i}
                                                        className="bg-white rounded-[2.5rem] border border-slate-100/80 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group/card relative overflow-hidden"
                                                    >
                                                        <div className="flex flex-col md:flex-row gap-8">
                                                            <div className="flex-shrink-0">
                                                                <Avatar
                                                                    src={review.user?.avatar}
                                                                    alt={review.user?.fullName}
                                                                    size="xl"
                                                                    className="rounded-3xl shadow-sm border-4 border-white group-hover/card:scale-105 transition-transform duration-500"
                                                                    fallback={review.user?.fullName?.substring(0, 2)}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                                                    <div>
                                                                        <h4 className="font-black text-slate-900 text-lg mb-1">{review.user?.fullName}</h4>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                                                                {new Date(review.createdAt).toLocaleString('vi-VN', {
                                                                                    day: '2-digit',
                                                                                    month: 'short',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-1.5">
                                                                        {Array.from({ length: 5 }, (_, s) => (
                                                                            <Icon key={s} name="star" size="xl" className={s < review.rating ? 'text-yellow-400' : 'text-slate-100'} filled />
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="relative mb-3">
                                                                    <p className="text-lg text-slate-900 font-bold leading-relaxed">"{review.content}"</p>
                                                                </div>

                                                                {review.images && review.images.length > 0 && (
                                                                    <div className="flex flex-wrap gap-3 mb-1.5">
                                                                        {review.images.filter((img: string) => img && img.trim() !== "").map((img: string, idx: number) => (
                                                                            <div key={idx} className="relative group/img cursor-pointer overflow-hidden rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500">
                                                                                <img
                                                                                    src={img}
                                                                                    alt="Review"
                                                                                    className="w-24 h-24 object-cover group-hover/img:scale-110 transition-transform duration-700"
                                                                                    onClick={() => setSelectedImageUrl(img)}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Action Bar */}
                                                                <div className="space-y-3 pt-2 border-t border-slate-50">
                                                                    <div className="flex flex-wrap items-center gap-3">
                                                                        <button
                                                                            onClick={() => handleToggleLike(review.id)}
                                                                            className={`group/heart flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all duration-500 border ${review.isLikedByOrganizer
                                                                                ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                                                                                : 'bg-rose-50/30 text-rose-400 border-rose-100/50 hover:bg-rose-50 hover:border-rose-200'
                                                                                }`}
                                                                        >
                                                                            <Icon name="favorite" size="xs" filled={review.isLikedByOrganizer} className={review.isLikedByOrganizer ? 'scale-110' : 'group-hover/heart:scale-120 transition-transform'} />
                                                                            <span className="text-[10px] font-black uppercase tracking-widest">{review.isLikedByOrganizer ? 'Đã yêu thích' : 'Yêu thích'}</span>
                                                                        </button>

                                                                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border transition-all duration-500 ${review.reply
                                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100/20'
                                                                            : 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-100/20'
                                                                            }`}>
                                                                            <Icon name={review.reply ? "check_circle" : "pending"} size="xs" filled={review.reply} />
                                                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                                                {review.reply ? 'Đã phản hồi' : 'Chờ phản hồi'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {review.reply ? (
                                                                        <div className="bg-slate-50/80 p-4 rounded-[1.5rem] space-y-2 relative overflow-hidden group/reply border border-slate-100 shadow-sm">
                                                                            <div className="flex items-center gap-2.5">
                                                                                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                                                                    <Icon name="subdirectory_arrow_right" size="xs" />
                                                                                </div>
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Phản hồi từ Ban Tổ Chức</span>
                                                                            </div>
                                                                            <p className="text-xs font-bold leading-relaxed text-slate-900 pl-9">{review.reply}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex gap-3 bg-white p-2 rounded-[2rem] border-2 border-slate-900/10 focus-within:border-slate-900/30 focus-within:shadow-xl transition-all duration-500">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Ban tổ chức sẽ rút kinh nghiệm, cảm ơn bạn đã nhận xét"
                                                                                className="flex-1 px-5 py-3 bg-transparent border-0 focus:ring-0 text-xs font-black outline-none placeholder:text-slate-500 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                                                                                value={replyTexts[review.id] || ''}
                                                                                onChange={(e) => setReplyTexts({ ...replyTexts, [review.id]: e.target.value })}
                                                                                onKeyDown={(e) => e.key === 'Enter' && handleReply(review.id)}
                                                                            />
                                                                            <button
                                                                                onClick={() => handleReply(review.id)}
                                                                                className="w-10 h-10 bg-slate-900 text-white rounded-[1.1rem] flex items-center justify-center hover:bg-primary hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10 group/send"
                                                                            >
                                                                                <Icon name="send" size="xs" className="group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        );
                                    })()}
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

                <EditEventModal
                    activeEditType={activeEditType}
                    onClose={() => setActiveEditType(null)}
                    initialForm={editForm}
                    initialSchedules={editSchedules}
                    onUpdate={handleUpdateEvent}
                    formatTime={formatTime}
                />

                <ImagePreviewModal
                    imageUrl={selectedImageUrl}
                    onClose={() => setSelectedImageUrl(null)}
                />
            </div>
        </DashboardLayout>
    );
};


export default OrganizerEventManage;
