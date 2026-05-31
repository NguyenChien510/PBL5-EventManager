import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { API_BASE_URL } from '@/constants';
import { ChatbotIcon } from './ChatbotIcon';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp?: string;
}

const formatTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (e) {
    return '';
  }
};

const Chatbot: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const { accessToken, user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getWelcomeMessage = (): Message => ({
    role: 'ai',
    content: 'Xin chào! Tôi là trợ lý ảo của EventPlatform. Tôi có thể giúp gì cho bạn?',
    timestamp: new Date().toISOString()
  });

  // Load history once on mount (before chat opens)
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      if (user?.id) {
        try {
          const response = await fetch(`http://localhost:8000/chat-history/${user.id}`);
          const data = await response.json();
          if (data.history && data.history.length > 0) {
            setMessages(data.history.map((m: any) => ({
              ...m,
              timestamp: m.timestamp || new Date().toISOString()
            })));
          } else {
            setMessages([getWelcomeMessage()]);
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
          setMessages([getWelcomeMessage()]);
        }
      } else {
        const guestHistory = localStorage.getItem('chatbot_guest_history');
        if (guestHistory) {
          setMessages(JSON.parse(guestHistory));
        } else {
          setMessages([getWelcomeMessage()]);
        }
      }
      setLoadingHistory(false);
    };
    loadHistory();
  }, [user?.id]);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      hasMoved.current = true;
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleIconClick = () => {
    if (!hasMoved.current) {
      setIsOpen(!isOpen);
    }
  };

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!loadingHistory && isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, loadingHistory, isOpen]);

  const handleSend = async (overrideInput?: string, silent: boolean = false) => {
    const messageToSend = overrideInput || input;
    if (!messageToSend.trim()) return;

    let newMessages = messages;
    if (!silent) {
      const userMessage: Message = { role: 'user', content: messageToSend, timestamp: new Date().toISOString() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Lưu LocalStorage cho khách
      if (!user?.id) {
        localStorage.setItem('chatbot_guest_history', JSON.stringify(updatedMessages));
      }
    }
    
    if (!overrideInput) setInput('');
    setIsLoading(true);
    setLoadingStatus('🤔 Đang phân tích yêu cầu...');

    try {
      // Try streaming endpoint first
      const streamResponse = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          session_id: user?.id ? `user_${user.id}` : 'guest',
          token: accessToken,
          user_id: user?.id
        }),
      });
      
      if (streamResponse.ok && streamResponse.headers.get('content-type')?.includes('text/event-stream')) {
        // SSE streaming path
        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullAnswer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'status') {
                  setLoadingStatus(data.message);
                } else if (data.type === 'result') {
                  fullAnswer = data.answer;
                } else if (data.type === 'error') {
                  fullAnswer = `⚠️ ${data.message}`;
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }

        const answer = (fullAnswer || 'Xin lỗi, tôi không thể xử lý yêu cầu này ngay bây giờ.').trim();
        const aiMessage: Message = { role: 'ai', content: answer, timestamp: new Date().toISOString() };
        setMessages(prev => {
          const updated = [...prev, aiMessage];
          if (!user?.id) {
            localStorage.setItem('chatbot_guest_history', JSON.stringify(updated));
          }
          return updated;
        });
      } else {
        // Fallback to regular endpoint
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageToSend,
            session_id: user?.id ? `user_${user.id}` : 'guest',
            token: accessToken,
            user_id: user?.id
          }),
        });
        const data = await response.json();
        const answer = (data?.answer || 'Xin lỗi, tôi không thể xử lý yêu cầu này ngay bây giờ.').trim();
        const aiMessage: Message = { role: 'ai', content: answer, timestamp: new Date().toISOString() };
        setMessages(prev => {
          const updated = [...prev, aiMessage];
          if (!user?.id) {
            localStorage.setItem('chatbot_guest_history', JSON.stringify(updated));
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = { 
        role: 'ai', 
        content: 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.', 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const onAction = (actionText: string) => {
    handleSend(actionText);
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn làm sạch toàn bộ đoạn chat này không?")) {
      return;
    }
    setMessages([getWelcomeMessage()]);
    if (!user?.id) {
      localStorage.removeItem('chatbot_guest_history');
    } else {
      try {
        await fetch(`http://localhost:8000/chat-history/${user.id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error clearing chat history:', error);
      }
    }
  };

  // Mini Seat Map Component for visual seat selection
  interface Seat {
    id: number;
    seatNumber: string;
    status: 'AVAILABLE' | 'BOOKED' | 'HOLD';
    ticketTypeId: number;
    ticketTypeName: string;
    price: number;
    x: number | null;
    y: number | null;
    color?: string;
  }

  const MiniSeatMap: React.FC<{
    eventId: string;
    onAction: (text: string) => void;
  }> = ({ eventId, onAction }) => {
    const { user } = useAuthStore();
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

    // Pan state
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });
    const dragDistance = useRef(0);
    const panOrigin = useRef({ x: 0, y: 0 });

    const handlePanStart = (clientX: number, clientY: number) => {
      setIsPanning(true);
      dragDistance.current = 0;
      panOrigin.current = { x: clientX, y: clientY };
      panStart.current = {
        x: clientX - panOffset.x,
        y: clientY - panOffset.y
      };
    };

    const handlePanMove = (clientX: number, clientY: number) => {
      if (!isPanning) return;
      const dist = Math.sqrt(
        Math.pow(clientX - panOrigin.current.x, 2) +
        Math.pow(clientY - panOrigin.current.y, 2)
      );
      dragDistance.current = dist;
      setPanOffset({
        x: clientX - panStart.current.x,
        y: clientY - panStart.current.y
      });
    };

    const handlePanEnd = () => {
      setIsPanning(false);
    };

    useEffect(() => {
      let active = true;
      const fetchSeats = async () => {
        setLoading(true);
        setError(null);
        try {
          const sessionId = user?.id ? `user_${user.id}` : 'guest';
          const response = await fetch(`${API_BASE_URL}/events/${eventId}/seats?sessionId=${sessionId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch seat layout');
          }
          const data = await response.json();
          if (active) {
            const seatList = Array.isArray(data) ? data : (data.data || []);
            setSeats(seatList);
          }
        } catch (err: any) {
          if (active) {
            setError(err.message || 'Error loading seats');
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };
      fetchSeats();
      return () => {
        active = false;
      };
    }, [eventId, user?.id]);

    if (loading) {
      return (
        <div className="w-full h-32 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] text-gray-400 font-semibold">Đang tải sơ đồ ghế...</span>
          </div>
        </div>
      );
    }

    if (error || seats.length === 0) {
      return null;
    }

    const hasCoords = seats.some((s) => s.x !== null && s.y !== null);
    const padding = 20;
    const svgWidth = 320;
    
    let processedSeats: (Seat & { renderX: number; renderY: number })[] = [];
    let svgHeight = 180;

    if (hasCoords) {
      const validSeats = seats.filter((s) => s.x !== null && s.y !== null);
      const xs = validSeats.map((s) => s.x!);
      const ys = validSeats.map((s) => s.y!);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      const spanX = maxX - minX || 1;
      const spanY = maxY - minY || 1;
      
      processedSeats = validSeats.map((s) => {
        const x = padding + ((s.x! - minX) / spanX) * (svgWidth - padding * 2);
        const y = padding + 25 + ((s.y! - minY) / spanY) * (180 - padding * 2 - 30);
        return { ...s, renderX: x, renderY: y };
      });
    } else {
      const sortedSeats = [...seats].sort((a, b) => 
        a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true, sensitivity: 'base' })
      );
      const cols = 8;
      const rows = Math.ceil(sortedSeats.length / cols);
      svgHeight = Math.max(160, rows * 32 + 40);
      
      processedSeats = sortedSeats.map((s, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = padding + col * ((svgWidth - padding * 2) / (cols - 1 || 1));
        const y = padding + 30 + row * 32;
        return { ...s, renderX: x, renderY: y };
      });
    }

    const tooltipX = hoveredSeat ? hoveredSeat.renderX + panOffset.x : 0;
    const tooltipY = hoveredSeat ? hoveredSeat.renderY + panOffset.y - 12 : 0;

    return (
      <div className="relative my-2 p-3 bg-gradient-to-b from-slate-50 to-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col items-center w-full">
        <div className="w-full flex items-center justify-between text-[10px] text-gray-500 font-bold mb-2 pb-1.5 border-b border-slate-100 select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-sm"></span>
              <span>Còn trống</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block shadow-sm"></span>
              <span>Đã bán</span>
            </div>
          </div>
        </div>

        <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center seat-map-container">
          <svg 
            width={svgWidth} 
            height={svgHeight} 
            className={`overflow-visible select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={(e) => handlePanStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePanMove(e.clientX, e.clientY)}
            onMouseUp={handlePanEnd}
            onMouseLeave={() => {
              handlePanEnd();
              setHoveredSeat(null);
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 1) {
                handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchEnd={handlePanEnd}
          >
            <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
              <path 
                d={`M 30,15 Q ${svgWidth / 2},5 ${svgWidth - 30},15`} 
                fill="none" 
                stroke="#cbd5e1" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />
              <text 
                x={svgWidth / 2} 
                y={24} 
                textAnchor="middle" 
                fill="#94a3b8" 
                fontSize="9" 
                fontWeight="bold" 
                letterSpacing="1"
              >
                SÂN KHẤU / STAGE
              </text>

              {processedSeats.map((seat) => {
                const isAvailable = seat.status === 'AVAILABLE';
                const color = seat.color || '#375dfb';
                
                return (
                  <g 
                    key={seat.id}
                    className={isAvailable ? "cursor-pointer" : "cursor-not-allowed"}
                    onMouseEnter={() => {
                      setHoveredSeat(seat);
                    }}
                    onMouseLeave={() => setHoveredSeat(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragDistance.current < 5 && isAvailable) {
                        onAction(`CHỌN_GHẾ EV${eventId}_SE${seat.id}`);
                      }
                    }}
                  >
                    {isAvailable && (
                      <circle
                        cx={seat.renderX}
                        cy={seat.renderY}
                        r={8.5}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        className="opacity-30 hover:opacity-100 transition-opacity duration-150"
                      />
                    )}
                    <circle
                      cx={seat.renderX}
                      cy={seat.renderY}
                      r={6.5}
                      fill={isAvailable ? color : '#cbd5e1'}
                      className="transition-opacity duration-150 hover:opacity-90"
                    />
                    <text
                      x={seat.renderX}
                      y={seat.renderY + 2.5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="7"
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {seat.seatNumber.replace(/[^0-9]/g, '') || seat.seatNumber.charAt(0)}
                    </text>
                  </g>
                );
              })}

              {/* Native SVG Tooltip */}
              {hoveredSeat && (
                <g 
                  transform={`translate(${hoveredSeat.renderX}, ${hoveredSeat.renderY - 18})`}
                  className="pointer-events-none"
                >
                  {/* Tooltip Background */}
                  <rect
                    x="-65"
                    y="-38"
                    width="130"
                    height="32"
                    rx="6"
                    fill="#0f172a"
                    opacity="0.95"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  {/* Tooltip Arrow */}
                  <polygon
                    points="0,0 -5,-6 5,-6"
                    fill="#0f172a"
                  />
                  {/* Tooltip Text */}
                  <text
                    x="0"
                    y="-26"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8.5"
                    fontWeight="bold"
                  >
                    Ghế: {hoveredSeat.seatNumber} ({hoveredSeat.status === 'AVAILABLE' ? 'Trống' : 'Hết'})
                  </text>
                  <text
                    x="0"
                    y="-13"
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    {hoveredSeat.price ? `${hoveredSeat.price.toLocaleString('vi-VN')}₫` : 'Miễn phí'}
                  </text>
                </g>
              )}
            </g>
          </svg>
        </div>

        <div className="w-full flex items-center justify-between text-[9px] text-gray-400 font-medium mt-1.5 select-none">
          <span>💡 Kéo để di chuyển • Nhấp để chọn</span>
          {panOffset.x !== 0 || panOffset.y !== 0 ? (
            <button 
              onClick={() => setPanOffset({ x: 0, y: 0 })}
              className="text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-0.5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[10px]">center_focus_strong</span>
              Đặt lại vị trí
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const MessageContent: React.FC<{ content: string; onAction: (text: string) => void }> = ({ content, onAction }) => {
    if (!content) return null;

    // Check for success/failure booking messages to render them as beautiful cards
    const bookingSuccessRegex = /✅\s*Đặt vé thành công!\s*Đơn hàng\s*#(\d+)\s*đã được thanh toán tự động\./i;
    const bookingFailureRegex = /Đơn hàng\s*#(\d+)\s*đã tạo nhưng thanh toán thất bại\s*\(mã:\s*([^)]+)\)\./i;

    const matchSuccess = content.match(bookingSuccessRegex);
    if (matchSuccess) {
      const orderId = matchSuccess[1];
      return (
        <div className="my-2 p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 rounded-2xl flex flex-col items-center text-center gap-3.5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 w-full text-gray-800">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md shadow-emerald-500/20 select-none">
            <span className="material-symbols-outlined text-[26px] font-bold">check_circle</span>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-emerald-800 text-[15px] tracking-tight">Đặt Vé Thành Công!</h4>
            <p className="text-[12.5px] text-gray-600 leading-relaxed font-sans px-2">
              Đơn hàng <span className="px-1.5 py-0.5 mx-0.5 bg-emerald-100/70 border border-emerald-200 text-emerald-800 font-bold rounded-lg shadow-sm font-mono text-[13px]">#{orderId}</span> đã được hệ thống xác nhận và thanh toán tự động thành công.
            </p>
          </div>
          <div className="w-full h-[1px] bg-slate-100" />
          <button 
            onClick={() => navigate(`/profile?openOrder=${orderId}`)} 
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all hover:scale-105 duration-200 shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px]">confirmation_number</span>
            Xem vé
          </button>
        </div>
      );
    }

    const matchFailure = content.match(bookingFailureRegex);
    if (matchFailure) {
      const orderId = matchFailure[1];
      const code = matchFailure[2];
      return (
        <div className="my-2 p-4 bg-gradient-to-br from-rose-50 to-white border border-rose-200/80 rounded-2xl flex flex-col items-center text-center gap-3.5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 w-full text-gray-800">
          <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-md shadow-rose-500/20 select-none">
            <span className="material-symbols-outlined text-[26px] font-bold">error</span>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-rose-800 text-[15px] tracking-tight">Thanh Toán Thất Bại</h4>
            <p className="text-[12.5px] text-gray-600 leading-relaxed font-sans px-2">
              Đơn hàng <span className="px-1.5 py-0.5 mx-0.5 bg-rose-100/70 border border-rose-200 text-rose-800 font-bold rounded-lg shadow-sm font-mono text-[13px]">#{orderId}</span> đã được khởi tạo nhưng thanh toán qua cổng VNPay không thành công.
            </p>
            <p className="text-[11px] text-rose-600/80 font-bold font-mono">MÃ LỖI: {code}</p>
          </div>
          <div className="w-full h-[1px] bg-slate-100" />
          <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-bold tracking-wide select-none">
            <span className="material-symbols-outlined text-[13px]">info</span>
            <span>VUI LÒNG THANH TOÁN LẠI TRONG LỊCH SỬ</span>
          </div>
        </div>
      );
    }

    const matchEventId = content.match(/EV(\d+)_SE/);
    const hasSeatSelection = matchEventId !== null;

    // Helper to render individual button actions
    const renderButton = (btnText: string, key: number) => {
      if (hasSeatSelection && btnText.includes('_SE')) {
        return null;
      }
      // New format: [INFO: Label | Value]
      const newMatch = btnText.match(/\[(INFO|BOOK|SELECT):\s*([^|\]]+)\s*\|\s*([^\]]+)\]/);
      if (newMatch) {
        const [_, type, label, value] = newMatch;
        
        if (type === 'INFO') {
          return (
            <button 
              key={key} 
              onClick={() => navigate(`/event/${value.trim()}`)} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 mr-2 bg-blue-50/50 hover:bg-blue-600 border border-blue-100 hover:border-blue-600 rounded-xl text-xs font-bold text-blue-600 hover:text-white transition-all hover:scale-105 duration-200 shadow-sm hover:shadow active:scale-95"
            >
              <span className="material-symbols-outlined text-[13px]">visibility</span>
              {label.trim()}
            </button>
          );
        }
        if (type === 'BOOK') {
          return (
            <button 
              key={key} 
              onClick={() => onAction(`Tôi muốn đặt vé sự kiện ID ${value.trim()}`)} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 mr-2 bg-emerald-50 hover:bg-emerald-600 border border-emerald-100 hover:border-emerald-600 rounded-xl text-xs font-bold text-emerald-600 hover:text-white transition-all hover:scale-105 duration-200 shadow-sm hover:shadow active:scale-95 animate-pulse hover:animate-none"
            >
              <span className="material-symbols-outlined text-[13px]">local_activity</span>
              {label.trim()}
            </button>
          );
        }
        return (
          <button 
            key={key} 
            onClick={() => {
              const v = value.trim();
              if (v === 'navigate_profile') {
                navigate('/profile');
              } else if (v.startsWith('coupon_')) {
                onAction(`Tôi muốn áp dụng mã ${v.replace('coupon_', '')}`);
              } else if (v.startsWith('EV') && v.includes('_SE')) {
                onAction(`CHỌN_GHẾ ${v}`);
              } else if (v.startsWith('EV') && v.includes('_TT')) {
                onAction(`CHỌN_VÉ ${v}`);
              } else {
                onAction(`${label.trim()} (ID: ${v})`);
              }
            }} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 mr-2 bg-indigo-50/50 hover:bg-indigo-600 border border-indigo-100 hover:border-indigo-600 rounded-xl text-xs font-bold text-indigo-600 hover:text-white transition-all hover:scale-105 duration-200 shadow-sm hover:shadow active:scale-95"
          >
            <span className="material-symbols-outlined text-[13px]">ads_click</span>
            {label.trim()}
          </button>
        );
      }

      // Old format (Fallback): [Xem chi tiết ID: 1043]
      const oldMatch = btnText.match(/\[(Xem chi tiết|Đặt vé ngay).*?ID:\s*([^\]]+)\]/);
      if (oldMatch) {
        const [_, label, value] = oldMatch;
        const isInfo = label.includes("Xem");
        
        return (
          <button 
            key={key} 
            onClick={() => isInfo ? navigate(`/event/${value.trim()}`) : onAction(`Tôi muốn đặt vé sự kiện ID ${value.trim()}`)} 
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 mr-2 border rounded-xl text-xs font-bold transition-all hover:scale-105 duration-200 shadow-sm hover:shadow active:scale-95 ${
              isInfo 
                ? "bg-blue-50/50 border-blue-100 hover:bg-blue-600 hover:text-white text-blue-600 hover:border-blue-600" 
                : "bg-emerald-50 border-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-600 hover:border-emerald-600 animate-pulse hover:animate-none"
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">{isInfo ? 'visibility' : 'local_activity'}</span>
            {label.trim()}
          </button>
        );
      }

      return null;
    };

    // Text format cascades: Code -> Bold -> Price
    const formatPrice = (txt: string) => {
      if (!txt) return '';
      const priceRegex = /(\b\d{1,3}(?:[.,]\d{3})+(?:\s*(?:₫|đ|VNĐ|VND))\b)/gi;
      const parts = txt.split(priceRegex);
      return parts.map((part, index) => {
        if (part.match(priceRegex)) {
          return (
            <span key={index} className="px-1.5 py-0.5 mx-0.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold rounded-lg shadow-sm font-sans">
              {part}
            </span>
          );
        }
        return part;
      });
    };

    const formatBold = (txt: string) => {
      if (!txt) return '';
      const parts = txt.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          if (boldText.match(/^CPN[A-Z0-9]+$/)) {
            return (
              <span key={index} className="px-1.5 py-0.5 mx-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-mono text-[11px] font-bold rounded-lg uppercase shadow-sm">
                🎟️ {boldText}
              </span>
            );
          }
          return (
            <strong key={index} className="font-semibold">
              {boldText}
            </strong>
          );
        }
        return formatPrice(part);
      });
    };

    const formatCode = (txt: string) => {
      if (!txt) return '';
      const parts = txt.split(/(`[^`]+`)/g);
      return parts.map((part, index) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          const codeText = part.slice(1, -1);
          return (
            <code key={index} className="px-1.5 py-0.5 mx-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono text-[11.5px] font-semibold rounded-lg shadow-sm">
              {codeText}
            </code>
          );
        }
        return formatBold(part);
      });
    };

    const renderTextLine = (line: string, lineKey: number) => {
      let trimmedLine = line.trim();
      if (hasSeatSelection && (trimmedLine.includes('Ghế') || trimmedLine.includes('Sơ đồ ghế') || trimmedLine.includes('_SE'))) {
        return null;
      }
      if (trimmedLine.includes('🎭')) {
        trimmedLine = trimmedLine.replace(/[`\\]/g, '');
      }
      if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const listContent = trimmedLine.substring(1).trim();
        return (
          <div key={lineKey} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-indigo-400 mt-1 select-none text-[10px]">●</span>
            <span className="flex-1 leading-relaxed">{formatCode(listContent)}</span>
          </div>
        );
      }
      return <div key={lineKey} className="my-0.5 leading-relaxed">{formatCode(trimmedLine)}</div>;
    };

    const renderNormalText = (text: string) => {
      // Split text by button tags so we can render buttons inline
      const buttonRegex = /(\[.*?:.*?\|.*?\]|\[(?:Xem chi tiết|Đặt vé ngay).*?ID:.*?\])/g;
      const parts = text.split(buttonRegex);
      return parts.map((part, i) => {
        if (part.match(buttonRegex)) {
          return renderButton(part, i);
        }
        const lines = part.split('\n');
        return lines.map((line, lineIdx) => renderTextLine(line, i * 1000 + lineIdx));
      });
    };

    // Main parsing logic: split by '---' to detect event cards
    const trimmed = content.trim();
    const segments = trimmed.split(/---/g);

    return (
      <div className="flex flex-col w-full">
        {hasSeatSelection && (
          <MiniSeatMap eventId={matchEventId[1]} onAction={onAction} />
        )}
        {segments.map((segment, segIdx) => {
          const lines = segment.split('\n');
          const hasEventData = lines.some(l => l.includes('🎭') || l.includes('📅') || l.includes('📍'));

          if (hasEventData) {
            // It's an event card block! Parse its components
            let title = '';
            let date = '';
            let location = '';
            const otherTextLines: string[] = [];
            const buttons: string[] = [];

            lines.forEach(line => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return;

              if (trimmedLine.includes('🎭')) {
                // Remove 🎭, backticks, and any backslashes
                title = trimmedLine.replace('🎭', '').replace(/[`\\]/g, '').trim();
              } else if (trimmedLine.includes('📅')) {
                date = trimmedLine.replace('📅', '').trim();
              } else if (trimmedLine.includes('📍')) {
                location = trimmedLine.replace('📍', '').trim();
              } else {
                // Check if this line is a button
                const buttonRegex = /(\[.*?:.*?\|.*?\]|\[(?:Xem chi tiết|Đặt vé ngay).*?ID:.*?\])/g;
                const matches = trimmedLine.match(buttonRegex);
                if (matches) {
                  matches.forEach(m => buttons.push(m));
                } else {
                  otherTextLines.push(trimmedLine);
                }
              }
            });

            return (
              <div 
                key={segIdx} 
                className="my-3 p-4 bg-gradient-to-b from-slate-50/70 to-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col gap-2.5 w-full"
              >
                {title && (
                  <div className="flex items-start gap-2">
                    <span className="text-base select-none">🎭</span>
                    <h4 className="font-bold text-[14px] text-gray-800 leading-snug">
                      {title}
                    </h4>
                  </div>
                )}
                
                <div className="h-[1px] bg-slate-100 w-full" />
                
                <div className="space-y-2 text-xs">
                  {date && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="material-symbols-outlined text-[15px] text-indigo-500 select-none">calendar_today</span>
                      <span className="font-medium">{date}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-start gap-2 text-gray-500">
                      <span className="material-symbols-outlined text-[15px] text-rose-500 mt-0.5 select-none">location_on</span>
                      <span className="leading-normal flex-1">{location}</span>
                    </div>
                  )}
                </div>

                {otherTextLines.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-slate-200">
                    {otherTextLines.map((l, idx) => (
                      <div key={idx}>{formatCode(l)}</div>
                    ))}
                  </div>
                )}

                {buttons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 pt-2 border-t border-slate-50">
                    {buttons.map((btn, bIdx) => renderButton(btn, bIdx))}
                  </div>
                )}
              </div>
            );
          }

          // Otherwise render normal text (with buttons / lists formatting)
          return (
            <div key={segIdx} className="w-full">
              {renderNormalText(segment)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed bottom-6 right-24 z-[100]"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {!isOpen && (
        <button
          onMouseDown={handleMouseDown}
          onClick={handleIconClick}
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${!isDragging ? 'hover:scale-110 transform cursor-pointer' : 'cursor-grabbing'
            } bg-transparent shadow-none hover:drop-shadow-[0_0_20px_rgba(111,157,255,0.6)]`}
        >
          <ChatbotIcon className="w-28 h-28" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-0 right-0 w-80 sm:w-[400px] h-[480px] bg-[#f9f9ff] rounded-b-3xl rounded-t-xl shadow-[0px_10px_30px_rgba(0,0,0,0.08)] border border-[#c4c5d8] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            className={`px-4 py-3 bg-primary border-b border-[#1460b7]/20 flex justify-between items-center shrink-0 shadow-sm select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10">
                <ChatbotIcon className="w-10 h-10" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary rounded-full shadow-sm"></span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-[16px] text-white leading-tight">Trợ lý EventPlatform</h3>
                <span className="text-[12px] text-sky-100/80 font-normal leading-tight mt-0.5">Active now</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearHistory}
                className="w-8 h-8 rounded-lg bg-[#1460b7]/50 hover:bg-[#1460b7] hover:scale-110 active:scale-90 text-white flex items-center justify-center transition-all border border-white/10 shadow-sm"
                title="Làm sạch đoạn chat"
              >
                <span className="material-symbols-outlined text-[17px] font-bold">refresh</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all border border-red-700/30 hover:border-red-800 hover:scale-110 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] active:scale-90 shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px] font-bold">close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f9f9ff] scroll-smooth custom-scrollbar">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            ) : messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {msg.role === 'user' ? (
                  <div className="flex flex-col items-end gap-1 max-w-[85%]">
                    <div className="p-3 rounded-2xl rounded-tr-none bg-[#375dfb] text-white shadow-sm text-[13.5px] leading-relaxed break-words w-full">
                      <MessageContent 
                        content={msg.content} 
                        onAction={(text) => handleSend(text, true)} 
                      />
                    </div>
                    {msg.timestamp && (
                      <span className="text-[10px] text-gray-400 mr-1 select-none font-medium">
                        {formatTime(msg.timestamp)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 max-w-[85%] w-full">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-[#c4c5d8] overflow-hidden shadow-sm">
                      <ChatbotIcon className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col items-start gap-1 w-full">
                      <div className="p-3 rounded-2xl rounded-tl-none bg-[#f0f3ff] text-[#111c2d] shadow-sm border border-[#c4c5d8]/30 text-[13.5px] leading-relaxed break-words w-full">
                        <MessageContent 
                          content={msg.content} 
                          onAction={(text) => handleSend(text, true)} 
                        />
                      </div>
                      {msg.timestamp && (
                        <span className="text-[10px] text-gray-400 ml-1 select-none font-medium">
                          {formatTime(msg.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-[#c4c5d8] overflow-hidden shadow-sm">
                  <ChatbotIcon className="w-7 h-7" />
                </div>
                <div className="bg-[#f0f3ff] p-3 rounded-2xl rounded-tl-none border border-[#c4c5d8]/30 flex flex-col gap-1.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                  {loadingStatus && <div className="text-[11px] text-gray-400 font-medium select-none">{loadingStatus}</div>}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Chips */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto whitespace-nowrap bg-[#f9f9ff] border-t border-[#c4c5d8]/20 shrink-0 scrollbar-none">
              <button onClick={() => handleSend("Xem coupon của tôi")} className="bg-white border border-[#c4c5d8] px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-[#f0f3ff] hover:border-[#375dfb] hover:scale-105 transition-all duration-200 shadow-sm active:scale-95">
                🎟️ Mã giảm giá
              </button>
              <button onClick={() => handleSend("Các sự kiện sắp tới")} className="bg-white border border-[#c4c5d8] px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-[#f0f3ff] hover:border-[#375dfb] hover:scale-105 transition-all duration-200 shadow-sm active:scale-95">
                🎭 Sự kiện mới nhất
              </button>
              <button onClick={() => handleSend("Tôi cần trợ giúp")} className="bg-white border border-[#c4c5d8] px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-[#f0f3ff] hover:border-[#375dfb] hover:scale-105 transition-all duration-200 shadow-sm active:scale-95">
                ❓ Trợ giúp
              </button>
            </div>
          )}

          {/* Input Area */}
          <footer className="p-3.5 bg-[#f9f9ff] border-t border-[#c4c5d8] shrink-0">
            <div className="relative flex items-center group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhập tin nhắn..."
                spellCheck="false"
                autoComplete="off"
                className="w-full bg-white border border-[#c4c5d8] rounded-lg py-3 pl-4 pr-12 text-[13.5px] text-[#111c2d] placeholder:text-gray-400 focus:outline-none focus:border-[#375dfb] focus:ring-1 focus:ring-[#375dfb] transition-all shadow-sm"
              />
              <div className="absolute right-2.5 flex items-center">
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="bg-[#375dfb] text-white p-1.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
