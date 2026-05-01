import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const orderInfo = searchParams.get('orderInfo');
  const transactionId = searchParams.get('transactionId');

  const isSuccess = status === 'success';

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/tickets');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
        {/* Header Section */}
        <div className={`p-8 flex flex-col items-center text-center ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 w-full h-full transform -skew-y-12 origin-top-left opacity-30"></div>
          
          <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.4)] mb-5">
            <span className={`material-symbols-outlined text-[60px] ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isSuccess ? 'check_circle' : 'cancel'}
            </span>
          </div>
          <h1 className="relative z-10 text-3xl font-extrabold text-white mb-2 tracking-tight">
            {isSuccess ? 'Thanh toán Thành công!' : 'Thanh toán Thất bại'}
          </h1>
          <p className="relative z-10 text-white/90 text-sm font-medium">
            {isSuccess ? 'Cảm ơn bạn đã mua vé. Dưới đây là thông tin giao dịch của bạn.' : 'Rất tiếc. Giao dịch mua vé của bạn chưa hoàn tất.'}
          </p>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-slate-500 text-sm font-medium">Trạng thái</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {isSuccess ? 'Hoàn tất' : 'Hủy bỏ / Lỗi'}
              </span>
            </div>
            
            {orderInfo && (
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 text-sm font-medium">Thông tin đơn hàng</span>
                <span className="text-slate-800 text-sm font-semibold max-w-[60%] text-right">{orderInfo}</span>
              </div>
            )}
            
            {transactionId && (
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 text-sm font-medium">Mã giao dịch</span>
                <span className="text-slate-800 text-sm font-mono font-semibold">{transactionId}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col gap-3">
            <Link 
              to={isSuccess ? '/tickets' : '/seat-selection'} 
              className={`w-full py-4 rounded-2xl font-bold text-center text-white transition-all shadow-lg hover:-translate-y-1 ${
                isSuccess 
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' 
                  : 'bg-primary hover:bg-primary-dark shadow-primary/30'
              }`}
            >
              {isSuccess ? 'Xem vé của tôi' : 'Thử lại thanh toán'}
            </Link>
            
            <Link 
              to="/" 
              className="w-full py-4 rounded-2xl font-bold text-center text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
