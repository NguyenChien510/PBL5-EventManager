import { useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui'

const VnpaySandbox = () => {
    const [searchParams] = useSearchParams()
    const txnRef = searchParams.get('txnRef')
    const amount = searchParams.get('amount')
    const orderInfo = searchParams.get('orderInfo')

    const handleConfirm = () => {
        // Redirect to backend return URL with mock success params and mock signature
        const returnUrl = `http://localhost:8080/api/public/payment/vnpay-return?vnp_ResponseCode=00&vnp_TransactionResponseCode=00&vnp_TxnRef=${txnRef}&vnp_OrderInfo=${encodeURIComponent(orderInfo || '')}&vnp_TransactionNo=MOCK_TRANSACTION_${Date.now()}&vnp_SecureHash=MOCK_SANDBOX_HASH`
        window.location.href = returnUrl
    }

    const handleCancel = () => {
        // Redirect to result page with failed status
        window.location.href = `/payment-result?status=failed&orderInfo=${encodeURIComponent(orderInfo || '')}`
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center font-sans p-4">
            <div className="max-w-[800px] w-full bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="bg-[#005ba6] p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm">
                            <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png" alt="VNPay" className="w-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Cổng thanh toán VNPay</h1>
                            <p className="text-xs opacity-80">Môi trường thử nghiệm (Sandbox Virtual)</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    {/* Left Panel: Transaction Info */}
                    <div className="p-8 bg-slate-50 border-r border-slate-100">
                        <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-6 border-b pb-2">Thông tin đơn hàng</h2>
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Đơn vị chấp nhận thanh toán</p>
                                <p className="text-lg font-bold text-slate-800">EVENT PLATFORM 🎫</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Mã tham chiếu đơn hàng (vnp_TxnRef)</p>
                                <p className="text-sm font-mono font-bold text-[#005ba6] bg-blue-50 px-2 py-1 rounded inline-block">#{txnRef}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Số tiền thanh toán</p>
                                <p className="text-3xl font-black text-[#005ba6]">{new Intl.NumberFormat('vi-VN').format(Number(amount))} <span className="text-sm font-medium">VND</span></p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Nội dung thanh toán</p>
                                <p className="text-sm font-medium text-slate-700 italic border-l-4 border-blue-200 pl-3 py-1 bg-white/50">{orderInfo}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Actions */}
                    <div className="p-8 flex flex-col justify-center bg-white">

                        <div className="space-y-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Ngân hàng</label>
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="w-6 h-6 flex items-center justify-center bg-blue-600 rounded text-[8px] text-white font-bold">NCB</div>
                                    <span className="text-sm font-bold text-slate-700">Ngân hàng Quốc Dân (NCB)</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Số thẻ (Card Number)</label>
                                <input
                                    type="text"
                                    readOnly
                                    value="970419 8521 1243 61"
                                    className="w-full bg-white px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono font-bold text-slate-700 shadow-sm outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Tên chủ thẻ</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value="NGUYEN VAN A"
                                        className="w-full bg-white px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 shadow-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Ngày phát hành</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value="07/15"
                                        className="w-full bg-white px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 shadow-sm outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleConfirm}
                                className="w-full bg-[#005ba6] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#004a87] transition-all hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Icon name="check_circle" size="sm" /> Xác nhận Thanh toán
                            </button>
                            <button
                                onClick={handleCancel}
                                className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Icon name="cancel" size="sm" /> Hủy giao dịch
                            </button>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100">
                            <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed">
                                Bằng việc thực hiện giao dịch này, bạn đang ở trong môi trường thử nghiệm sandbox.<br />
                                © 2026 VNPay Sandbox - Một phần của EventPlatform Demo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VnpaySandbox
