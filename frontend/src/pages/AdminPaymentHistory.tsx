import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/axios';
import toast from 'react-hot-toast';
import { DashboardLayout, PageHeader } from '../components/layout';
import { adminSidebarConfig } from '../config/adminSidebarConfig';
import { Icon, Pagination, Loader } from '../components/ui';
import AdminSeatMap from '../components/domain/AdminSeatMap';

interface TicketDetailDTO {
    id: number;
    eventTitle: string;
    seatNumber: string;
    price: number;
    sessionName: string;
    seatId: number;
}

interface OrderDTO {
    id: number;
    userEmail: string;
    userName: string;
    userAvatar?: string;
    totalAmount: number;
    platformFee: number | null;
    status: string;
    paymentMethod: string;
    purchaseDate: string;
    eventId?: number;
    eventTitle?: string;
    eventPosterUrl?: string;
    eventSessionId?: number;
    tickets?: TicketDetailDTO[];
}

const CustomerAvatar = ({ src, name, size = 'md' }: { src?: string; name?: string; size?: 'md' | 'lg' }) => {
    const [error, setError] = useState(false);
    const firstLetter = name?.substring(0, 1).toUpperCase() || '?';

    const sizeClasses = size === 'lg' ? 'w-14 h-14 text-xl font-black' : 'w-10 h-10 text-xs font-black';
    const borderClasses = size === 'lg' ? 'border-4 border-white shadow-lg shadow-indigo-100' : 'border border-white/30 shadow-sm';

    if (src && !error) {
        return (
            <img
                src={src}
                alt={name}
                onError={() => setError(true)}
                className={`${sizeClasses} rounded-full object-cover ${borderClasses} shrink-0`}
            />
        );
    }

    return (
        <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white select-none shrink-0 ${borderClasses}`}>
            {firstLetter}
        </div>
    );
};

const AdminPaymentHistory = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<OrderDTO[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
    const [sessionSeats, setSessionSeats] = useState<any[]>([]);
    const [isLoadingSeats, setIsLoadingSeats] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pagination, setPagination] = useState<any>(null);
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalPlatformFee: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const [taxRate, setTaxRate] = useState('5');
    const [_, setAutoApply] = useState(true);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        if (selectedOrder || isConfirmModalOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [selectedOrder, isConfirmModalOpen]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, configRes] = await Promise.all([
                    apiClient.get('/admin/finance/overview'),
                    apiClient.get('/admin/finance/config')
                ]);
                setStats(statsRes.data);
                setTaxRate(configRes.data.defaultCommissionRate || '5');
                setAutoApply(configRes.data.autoApply ?? true);
            } catch (error) {
                console.error("Failed to fetch finance data:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };

        if (currentPage === 0 && orders.length === 0) {
            fetchData();
        }
    }, []);

    const triggerSaveConfig = () => {
        const rateNum = parseFloat(taxRate);
        if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
            toast.error("Tỷ lệ thuế phải nằm trong khoảng từ 0% đến 100%");
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleSaveConfig = async () => {
        try {
            setIsSavingConfig(true);
            const rateNum = parseFloat(taxRate);
            const willApply = !isNaN(rateNum) && rateNum > 0;
            await apiClient.post('/admin/finance/config', {
                defaultCommissionRate: taxRate,
                autoApply: willApply
            });
            setAutoApply(willApply);
            toast.success("Đã cập nhật thiết lập thuế nền tảng thành công!");
            setIsConfirmModalOpen(false);
        } catch (error) {
            console.error("Failed to update config:", error);
            toast.error("Không thể lưu cấu hình");
        } finally {
            setIsSavingConfig(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(0);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const fetchOrders = async (page: number, keyword: string = '') => {
            try {
                setIsTableLoading(true);
                const response = await apiClient.get(`/admin/orders?page=${page}&size=5&keyword=${encodeURIComponent(keyword)}`);
                setOrders(response.data.content);
                setPagination({
                    totalPages: response.data.totalPages,
                    totalElements: response.data.totalElements,
                    size: response.data.size,
                    number: response.data.number
                });
            } catch (error) {
                console.error("Failed to fetch orders:", error);
                toast.error("Không thể tải lịch sử thanh toán");
            } finally {
                setIsTableLoading(false);
            }
        };

        fetchOrders(currentPage, debouncedSearchTerm);
    }, [currentPage, debouncedSearchTerm]);

    useEffect(() => {
        if (selectedOrder?.eventSessionId) {
            const fetchSessionSeats = async () => {
                setIsLoadingSeats(true);
                try {
                    const response = await apiClient.get(`/events/sessions/${selectedOrder.eventSessionId}/seats`);
                    setSessionSeats(response.data);
                } catch (error) {
                    console.error("Failed to fetch session seats:", error);
                } finally {
                    setIsLoadingSeats(false);
                }
            };
            fetchSessionSeats();
        } else {
            setSessionSeats([]);
        }
    }, [selectedOrder]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PENDING':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'CANCELLED':
                return 'bg-rose-100 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <DashboardLayout sidebarProps={adminSidebarConfig}>
            <PageHeader
                title="Lịch sử Giao dịch"
                searchPlaceholder="Tìm mã đơn, email..."
                searchValue={searchTerm}
                onSearch={setSearchTerm}
            />

            {isInitialLoading ? (
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader className="w-10 h-10 text-primary" />
                </div>
            ) : (
                <div className="p-6 animate-slide-up space-y-6">
                    {/* Stats & Compact Config Header Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Icon name="payments" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng đơn hàng</p>
                                <p className="text-2xl font-black text-slate-900">{stats.totalOrders}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Icon name="account_balance_wallet" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng doanh thu</p>
                                <p className="text-2xl font-black text-emerald-600">
                                    {stats.totalRevenue.toLocaleString()}đ
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Icon name="account_balance" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng phí hệ thống</p>
                                <p className="text-2xl font-black text-indigo-600">
                                    {stats.totalPlatformFee.toLocaleString()}đ
                                </p>
                            </div>
                        </div>

                        {/* Compact Tax Card */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-4 transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                                    <Icon name="percent" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">Thiết lập thuế</p>
                                    <p className="text-xs font-extrabold text-slate-600 truncate mt-0.5">Thuế nền tảng</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 relative shrink-0">
                                <div className="relative w-20 flex items-center">
                                    <input
                                        type="number"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(e.target.value)}
                                        className="w-full pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg font-black text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-right"
                                        placeholder="5"
                                        min="0"
                                        max="100"
                                        onKeyDown={(e) => {
                                            // Ngăn nhập số âm
                                            if (parseFloat(e.currentTarget.value) <= 0 && e.key === 'ArrowDown') {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    <span className="absolute right-2.5 text-[10px] font-black">%</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={triggerSaveConfig}
                                    disabled={isSavingConfig}
                                    className="w-8 h-8 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm active:scale-95"
                                    title="Lưu thuế"
                                >
                                    {isSavingConfig ? (
                                        <Loader className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                        <Icon name="check" size="xs" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Full-width History Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 relative min-h-[400px] overflow-visible p-1">
                        {isTableLoading && (
                            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                                <Loader className="w-8 h-8 text-primary" />
                            </div>
                        )}
                        <div className="overflow-visible">
                            <table className="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Mã Đơn</th>
                                        <th className="px-6 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Sự kiện</th>
                                        <th className="px-6 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Khách hàng</th>
                                        <th className="px-6 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Tổng thu</th>
                                        <th className="px-6 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Phí hệ thống</th>
                                        <th className="px-6 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Cổng T.Toán</th>
                                        <th className="px-6 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Thời gian</th>
                                        <th className="px-6 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                    {orders.length === 0 && !isTableLoading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                                Chưa có giao dịch nào được ghi nhận.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="group hover:bg-white transition-all duration-300 cursor-pointer hover:scale-[1.005] relative hover:z-10 hover:shadow-xl"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <td className="px-6 py-3.5 relative">
                                                    {/* Hover Border Accent */}
                                                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-r-full" />

                                                    <span className="font-mono font-bold text-primary group-hover:underline">
                                                        #{order.id.toString().padStart(6, '0')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div
                                                        className="flex items-center gap-3 cursor-pointer group/event"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/admin/event/manage/${order.eventId}?tab=finance`);
                                                        }}
                                                    >
                                                        <div
                                                            className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0 shadow-sm group-hover/event:scale-110 transition-transform duration-300"
                                                            style={{ backgroundImage: `url('${order.eventPosterUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop'}')` }}
                                                        />
                                                        <div className="flex flex-col min-w-0 max-w-[180px]">
                                                            <span className="font-bold text-slate-900 truncate group-hover/event:text-primary transition-colors">{order.eventTitle || 'Sự kiện không xác định'}</span>
                                                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1 group-hover/event:text-emerald-500 transition-colors">
                                                                Tài chính <Icon name="trending_up" size="xs" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <CustomerAvatar src={order.userAvatar} name={order.userName} />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-slate-900 truncate">{order.userName}</span>
                                                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter truncate max-w-[160px]">{order.userEmail}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className="font-extrabold text-slate-900">
                                                        {order.totalAmount.toLocaleString()}đ
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className="font-bold text-rose-500">
                                                        {order.platformFee ? `${order.platformFee.toLocaleString()}đ` : '0đ'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 font-bold text-[10px] uppercase shadow-sm w-fit">
                                                        {order.paymentMethod?.toLowerCase().includes('momo') ? (
                                                            <img src="https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png" alt="MoMo" className="w-4 h-4 rounded-sm object-cover" />
                                                        ) : (
                                                            <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png" alt="VNPAY" className="w-4 h-4 rounded-sm object-contain" />
                                                        )}
                                                        {order.paymentMethod || 'VNPAY'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-xs">
                                                    {new Date(order.purchaseDate).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100">
                                <Pagination
                                    current={currentPage + 1}
                                    total={pagination.totalPages}
                                    onPageChange={(page) => setCurrentPage(page - 1)}
                                    label={`Hiển thị ${orders.length} trên ${pagination.totalElements} giao dịch`}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* Detailed Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
                    <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 bg-gradient-to-r from-primary to-electric text-white relative">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                            >
                                <Icon name="close" />
                            </button>
                            <h3 className="text-2xl font-black">Chi tiết đơn hàng #{selectedOrder.id.toString().padStart(6, '0')}</h3>
                            <p className="text-white/70 text-sm mt-1">Thông tin chi tiết về các vé đã mua</p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
                            {/* Visual Event Banner Link */}
                            {selectedOrder.eventId && (
                                <Link
                                    to={`/event/${selectedOrder.eventId}`}
                                    className="block group relative aspect-[21/9] overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500"
                                >
                                    <img
                                        src={selectedOrder.eventPosterUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"}
                                        alt={selectedOrder.eventTitle}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end p-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded uppercase tracking-wider">Event</span>
                                            <div className="h-[1px] flex-1 bg-white/20"></div>
                                        </div>
                                        <h4 className="text-white text-xl font-black">{selectedOrder.eventTitle}</h4>
                                        <div className="flex items-center gap-2 mt-2 text-white/70 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            Xem chi tiết sự kiện <Icon name="arrow_forward" size="sm" />
                                        </div>
                                    </div>
                                </Link>
                            )}

                            <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-100">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Khách hàng</p>
                                    <div className="flex items-center gap-3">
                                        <CustomerAvatar src={selectedOrder.userAvatar} name={selectedOrder.userName} size="lg" />
                                        <div>
                                            <p className="font-black text-slate-900 leading-tight">{selectedOrder.userName}</p>
                                            <p className="text-xs font-bold text-slate-400 tracking-tight mt-0.5">{selectedOrder.userEmail}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Thanh toán qua</p>
                                    <div className="flex items-center gap-2">
                                        {selectedOrder.paymentMethod?.toLowerCase().includes('momo') ? (
                                            <img src="https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png" alt="MoMo" className="w-5 h-5 rounded-md object-cover" />
                                        ) : (
                                            <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png" alt="VNPAY" className="w-5 h-5 rounded-md object-contain" />
                                        )}
                                        <p className="font-bold text-slate-900 capitalize">{selectedOrder.paymentMethod || 'VNPAY'}</p>
                                    </div>
                                    <p className="text-xs text-slate-500">{new Date(selectedOrder.purchaseDate).toLocaleString('vi-VN')}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Danh sách vé ({selectedOrder.tickets?.length || 0})</p>
                                <div className="space-y-3">
                                    {selectedOrder.tickets?.map((ticket, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                                                    <Icon name="confirmation_number" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{ticket.eventTitle}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">Ghế: <span className="text-primary font-bold">{ticket.seatNumber}</span> • {ticket.sessionName}</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-slate-900">{(ticket.price || 0).toLocaleString()}đ</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Visual Seat Map */}
                            {selectedOrder.eventSessionId && (
                                <div className="pt-4 border-t border-slate-100">
                                    <AdminSeatMap
                                        seats={sessionSeats}
                                        highlightedSeatIds={selectedOrder.tickets?.map(t => t.seatId) || []}
                                    />
                                    {isLoadingSeats && (
                                        <div className="flex justify-center py-4">
                                            <Loader className="w-6 h-6 text-primary" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Tổng thanh toán</p>
                                <p className="text-2xl font-black text-primary mt-1">{selectedOrder.totalAmount.toLocaleString()}đ</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/20"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Platform Fee Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsConfirmModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-[24px] p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 shadow-inner">
                                <Icon name="percent" size="lg" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Cập nhật thuế nền tảng?</h3>
                            <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                                Bạn đang thiết lập tỷ lệ hoa hồng hệ thống là <strong className="text-rose-600 text-base font-black">{taxRate}%</strong>. 
                                Sau khi xác nhận, mức thuế này sẽ được tự động khấu trừ trực tiếp vào tổng doanh thu của mỗi vé bán ra trên toàn sàn.
                            </p>
                        </div>
                        
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all border border-slate-100 active:scale-95"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSaveConfig}
                                disabled={isSavingConfig}
                                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 active:scale-95"
                            >
                                {isSavingConfig ? (
                                    <>
                                        <Loader className="w-4 h-4 text-white" />
                                    </>
                                ) : (
                                    "Xác nhận thay đổi"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AdminPaymentHistory;
