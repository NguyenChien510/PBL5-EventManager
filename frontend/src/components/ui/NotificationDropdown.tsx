import React, { useEffect, useState, useRef } from 'react';
import Icon from './Icon';
import { apiClient } from '@/utils/axios';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  message: string;
  createdAt: string; // ISO string;
  read: boolean;
}

const formatRelativeTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getNotificationConfig = (message: string) => {
  const lower = message.toLowerCase();

  if (lower.includes('phí hệ thống') || lower.includes('commission') || lower.includes('platform fee')) {
    return {
      icon: 'settings_suggest',
      bgClass: 'bg-gradient-to-br from-rose-500 to-orange-400',
      label: 'Hệ thống',
      labelColor: 'text-rose-600 bg-rose-50 border-rose-100'
    };
  }
  if (lower.includes('thanh toán') || lower.includes('order') || lower.includes('đơn hàng') || lower.includes('tiền')) {
    return {
      icon: 'payments',
      bgClass: 'bg-gradient-to-br from-emerald-500 to-teal-400',
      label: 'Giao dịch',
      labelColor: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    };
  }
  if (lower.includes('vé') || lower.includes('ticket')) {
    return {
      icon: 'local_activity',
      bgClass: 'bg-gradient-to-br from-amber-500 to-yellow-400',
      label: 'Vé',
      labelColor: 'text-amber-900 font-extrabold bg-amber-100/90 border-amber-200/60 shadow-sm'
    };
  }
  if (lower.includes('email') || lower.includes('gửi') || lower.includes('thư')) {
    return {
      icon: 'mail',
      bgClass: 'bg-gradient-to-br from-blue-500 to-indigo-400',
      label: 'Hộp thư',
      labelColor: 'text-blue-600 bg-blue-50 border-blue-100'
    };
  }

  return {
    icon: 'notifications_active',
    bgClass: 'bg-gradient-to-br from-violet-500 to-indigo-400',
    label: 'Thông báo',
    labelColor: 'text-violet-600 bg-violet-50 border-violet-100'
  };
};

const renderHighlightedMessage = (message: string) => {
  // Splitting text around matching double quotes
  const parts = message.split(/("[^"]+")/g);
  return parts.map((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      const name = part.substring(1, part.length - 1);
      return (
        <span key={i} className="font-black text-slate-900 bg-blue-50/60 px-1 rounded border-b-2 border-blue-500/20 mx-0.5 transition-all hover:bg-blue-100/60 inline">
          "{name}"
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const resp = await apiClient.get<Notification[]>('/notifications');
      setNotifications(resp.data);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiClient.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await apiClient.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* High Fidelity Dual-Phase Bell Swing CSS Animations */}
      <style>{`
        @keyframes bell-dome-swing {
          0% { transform: rotate(0); }
          15% { transform: rotate(12deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(6deg); }
          60% { transform: rotate(-3deg); }
          75% { transform: rotate(1deg); }
          100% { transform: rotate(0); }
        }
        @keyframes bell-clapper-swing {
          0% { transform: translateX(0) rotate(0); }
          15% { transform: translateX(-3px) rotate(-15deg); }
          30% { transform: translateX(3px) rotate(15deg); }
          45% { transform: translateX(-2px) rotate(-8deg); }
          60% { transform: translateX(1px) rotate(4deg); }
          75% { transform: translateX(-0.5px) rotate(-2deg); }
          100% { transform: translateX(0) rotate(0); }
        }
        @keyframes idle-pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .group:hover .animate-bell-dome {
          animation: bell-dome-swing 0.85s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .group:hover .animate-bell-clapper {
          animation: bell-clapper-swing 0.85s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .active-bell-pulse {
          animation: idle-pulse-glow 2s infinite;
        }
      `}</style>

      {/* Super Premium Animated Bell Trigger Button */}
      <button
        className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-500 relative active:scale-90 group ${open
          ? 'bg-primary text-white shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] rotate-6 scale-105'
          : unreadCount > 0
            ? 'bg-blue-50 hover:bg-white text-primary border border-blue-200 active-bell-pulse hover:shadow-[0_8px_24px_-4px_rgba(37,99,235,0.25)] hover:border-primary/30'
            : 'bg-slate-50 hover:bg-white text-slate-500 hover:text-primary border border-slate-200/60 hover:border-primary/25 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_-5px_rgba(0,0,0,0.08)]'
          }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="relative flex items-center justify-center">
          {/* Multi-layered Dynamic SVG Bell */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="w-[22px] h-[22px] overflow-visible"
          >
            {/* Bell Dome (Rotates around Top-Center) */}
            <g className="animate-bell-dome origin-top transition-all duration-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0" />
              {/* Bell Clapper (Swings opposite and further) */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v.75a3 3 0 106 0v-.75" className="animate-bell-clapper origin-[50%_72%] transition-all duration-500" />
            </g>
          </svg>
        </div>

        {/* Unread Glowing Dot */}
        {unreadCount > 0 && (
          <span className={`absolute top-1.5 right-1.5 flex h-3 w-3 transition-all duration-300 ${open ? 'scale-0' : 'scale-100'}`}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white shadow-md"></span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 bg-slate-100/95 backdrop-blur-2xl border border-slate-200/80 rounded-[24px] shadow-[0_30px_80px_-15px_rgba(15,23,42,0.25)] z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300 origin-top-right flex flex-col">

          {/* Premium Soft Header: Elegant Light Gradient with comfortable dimensions */}
          <div className="p-4 pb-4 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-white text-slate-800 shadow-sm border-b border-slate-200/60">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner border border-primary/5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-[22px] h-[22px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-slate-850 text-base tracking-tight leading-tight">Thông báo</h4>
                {unreadCount > 0 ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-[11px] font-bold text-rose-500 tracking-wide">Bạn có {unreadCount} tin chưa đọc</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block tracking-wide">Mọi thứ đã được đọc</span>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-[11px] text-primary hover:text-blue-700 font-black uppercase tracking-widest px-3.5 py-2 rounded-xl hover:bg-primary/5 border border-primary/10 transition-all shrink-0 whitespace-nowrap active:scale-95 ml-2 bg-slate-50/50"
              >
                {loading ? 'Đang tải...' : 'Đọc hết'}
              </button>
            )}
          </div>

          {/* List Body Container: Distinct Slate-100 Backdrop (Limited to ~3 items height) */}
          <div className="max-h-[340px] overflow-y-auto p-3 flex flex-col gap-2.5 flex-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 px-4">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-3 text-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-slate-200/60">
                  <Icon name="notifications_off" size="lg" />
                </div>
                <p className="text-sm font-bold text-slate-700">Không có thông báo nào</p>
                <p className="text-[11px] text-slate-400 mt-1 text-center leading-relaxed">Hệ thống sẽ báo cho bạn ngay khi có hoạt động mới.</p>
              </div>
            ) : (
              <>
                {notifications.map((n) => {
                  const cfg = getNotificationConfig(n.message);
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.read) markAsRead(n.id);
                        setOpen(false); // Close dropdown
                        
                        const lower = n.message.toLowerCase();
                        if (lower.includes('vé') || lower.includes('ticket')) {
                          // Extract content between double quotes
                          const match = n.message.match(/"([^"]+)"/);
                          if (match && match[1]) {
                            navigate(`/profile?openEvent=${encodeURIComponent(match[1])}`);
                          } else {
                            navigate('/profile');
                          }
                        }
                      }}
                      className={`p-4 flex items-start gap-3.5 cursor-pointer transition-all duration-300 rounded-2xl border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:-translate-y-[2px] relative group/item ${n.read
                        ? 'bg-white hover:bg-white border-slate-200/50 hover:border-slate-300 hover:shadow-md'
                        : 'bg-white border-blue-200 hover:border-blue-300 shadow-[0_4px_15px_-4px_rgba(37,99,235,0.08)] hover:shadow-lg border-l-[4px] border-l-primary'
                        }`}
                    >
                      {/* Floating Gradient Icon */}
                      <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-200/50 relative transform group-hover/item:scale-110 transition-transform duration-300 ${cfg.bgClass}`}>
                        <Icon name={cfg.icon} size="sm" />
                        {!n.read && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary border border-white"></span>
                          </span>
                        )}
                      </div>

                      {/* Clean Content Typography */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span className={`text-[9.5px] px-2.5 py-0.5 rounded-lg font-black uppercase tracking-widest border shadow-sm/10 ${cfg.labelColor}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold tracking-tight whitespace-nowrap">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>

                        <p className={`text-[12.5px] leading-relaxed tracking-tight font-medium ${!n.read ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'
                          }`}>
                          {renderHighlightedMessage(n.message)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Bottom Safe Bar */}
          <div className="p-3.5 bg-slate-200/60 border-t border-slate-300/50 flex items-center justify-center shadow-[0_-4px_15px_rgba(0,0,0,0.015)]">
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-300/50 px-5 py-1.5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-slate-300"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
