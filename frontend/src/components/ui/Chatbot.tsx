import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { ChatbotIcon } from './ChatbotIcon';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const Chatbot: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Xin chào! Tôi là trợ lý ảo của EventPlatform. Tôi có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken, user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideInput?: string, silent: boolean = false) => {
    const messageToSend = overrideInput || input;
    if (!messageToSend.trim()) return;

    let newMessages = messages;
    if (!silent) {
      newMessages = [...messages, { role: 'user', content: messageToSend }];
      setMessages(newMessages);
    }
    
    if (!overrideInput) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          session_id: user?.id || 'guest',
          token: accessToken,
          user_id: user?.id
        }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageContent: React.FC<{ content: string; onAction: (text: string) => void }> = ({ content, onAction }) => {
    // Regex cho cả 2 định dạng: [TYPE: Label | Value] và [Label ID: Value]
    const parts = content.split(/(\[.*?:.*?\|.*?\]|\[(?:Xem chi tiết|Đặt vé ngay).*?ID:.*?\])/g);
    
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          // Định dạng mới: [INFO: Label | Value]
          const newMatch = part.match(/\[(INFO|BOOK|SELECT):\s*([^|\]]+)\s*\|\s*([^\]]+)\]/);
          if (newMatch) {
            const [_, type, label, value] = newMatch;
            const btnClass = "inline-flex items-center gap-1 px-3 py-1.5 mt-2 mr-2 rounded-lg text-xs font-bold transition-all border shadow-sm ";
            
            if (type === 'INFO') {
              return (
                <button key={i} onClick={() => navigate(`/event/${value.trim()}`)} className={btnClass + "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white"}>
                  <span className="material-symbols-outlined text-xs">visibility</span>
                  {label}
                </button>
              );
            }
            if (type === 'BOOK') {
              return (
                <button key={i} onClick={() => onAction(`Tôi muốn đặt vé sự kiện ID ${value.trim()}`)} className={btnClass + "bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white"}>
                  <span className="material-symbols-outlined text-xs">local_activity</span>
                  {label}
                </button>
              );
            }
            return (
              <button key={i} onClick={() => onAction(`${label.trim()} (ID: ${value.trim()})`)} className={btnClass + "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-700 hover:text-white"}>
                {label}
              </button>
            );
          }

          // Định dạng cũ (Fallback): [Xem chi tiết ID: 1043]
          const oldMatch = part.match(/\[(Xem chi tiết|Đặt vé ngay).*?ID:\s*([^\]]+)\]/);
          if (oldMatch) {
            const [_, label, value] = oldMatch;
            const btnClass = "inline-flex items-center gap-1 px-3 py-1.5 mt-2 mr-2 rounded-lg text-xs font-bold transition-all border shadow-sm ";
            const isInfo = label.includes("Xem");
            
            return (
              <button 
                key={i} 
                onClick={() => isInfo ? navigate(`/event/${value.trim()}`) : onAction(`Tôi muốn đặt vé sự kiện ID ${value.trim()}`)} 
                className={btnClass + (isInfo ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white" : "bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white")}
              >
                <span className="material-symbols-outlined text-xs">{isInfo ? 'visibility' : 'local_activity'}</span>
                {label}
              </button>
            );
          }

          return <span key={i}>{part}</span>;
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
        <div className="absolute bottom-0 right-0 w-80 sm:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            className={`relative p-4 bg-gradient-to-br from-primary/90 to-electric/90 backdrop-blur-xl text-white flex justify-between items-center shrink-0 shadow-lg border-b border-white/10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="w-12 h-12 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <ChatbotIcon className="w-10 h-10" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-primary rounded-full shadow-lg animate-pulse"></span>
              </div>

              <div>
                <h3 className="font-bold text-base tracking-tight leading-none mb-1">Trợ lý EventPlatform</h3>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95 border border-white/10 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none shadow-md'
                    : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                    }`}
                >
                  <MessageContent 
                    content={msg.content} 
                    onAction={(text) => handleSend(text, true)} 
                  />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập tin nhắn..."
              spellCheck="false"
              autoComplete="off"
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-electric transition-colors"
            >
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
