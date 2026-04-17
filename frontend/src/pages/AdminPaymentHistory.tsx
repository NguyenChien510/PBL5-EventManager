import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../utils/axios';
import { Loader } from '../components/ui/loader';
import toast from 'react-hot-toast';
import { DashboardLayout, PageHeader } from '../components/layout';
import { adminSidebarConfig } from '../config/adminSidebarConfig';
import { Icon } from '../components/ui';
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
    totalAmount: number;
    status: string;
    paymentMethod: string;
    purchaseDate: string;
    eventId?: number;
    eventTitle?: string;
    eventPosterUrl?: string;
    eventSessionId?: number;
    tickets?: TicketDetailDTO[];
}

const AdminPaymentHistory = () => {
    const [orders, setOrders] = useState<OrderDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
    const [sessionSeats, setSessionSeats] = useState<any[]>([]);
    const [isLoadingSeats, setIsLoadingSeats] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await apiClient.get('/admin/orders');
                setOrders(response.data);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
                toast.error("Không thể tải lịch sử thanh toán");
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

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
            {isLoading ? (
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader className="w-10 h-10 text-primary" />
                </div>
            ) : (
                <>
                    <PageHeader title="Lịch sử Giao dịch" searchPlaceholder="Tìm mã đơn, email..." />

                    <div className="p-8 space-y-8">
                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Icon name="payments" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng đơn hàng</p>
                                    <p className="text-2xl font-black text-slate-900">{orders.length}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <Icon name="account_balance_wallet" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng doanh thu</p>
                                    <p className="text-2xl font-black text-emerald-600">
                                        {orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}đ
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                    <Icon name="history" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang chờ</p>
                                    <p className="text-2xl font-black text-amber-600">
                                        {orders.filter(o => o.status === 'PENDING').length} đơn
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Mã Đơn</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Khách hàng</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Số tiền</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Cổng T.Toán</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Thời gian</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600">
                                        {orders.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                    Chưa có giao dịch nào được ghi nhận.
                                                </td>
                                            </tr>
                                        ) : (
                                            orders.map((order) => (
                                                <tr
                                                    key={order.id}
                                                    className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    <td className="px-6 py-5">
                                                        <span className="font-mono font-bold text-primary group-hover:underline">
                                                            #{order.id.toString().padStart(6, '0')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{order.userName}</span>
                                                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{order.userEmail}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="font-extrabold text-slate-900">
                                                            {order.totalAmount.toLocaleString()}đ
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                                                            <Icon name="point_of_sale" size="sm" />
                                                            {order.paymentMethod || 'VNPAY'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-xs">
                                                        {new Date(order.purchaseDate).toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Khách hàng</p>
                                    <p className="font-bold text-slate-900">{selectedOrder.userName}</p>
                                    <p className="text-xs text-slate-500">{selectedOrder.userEmail}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Thanh toán qua</p>
                                    <p className="font-bold text-slate-900 capitalize">{selectedOrder.paymentMethod}</p>
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
        </DashboardLayout>
    );
};

export default AdminPaymentHistory;
