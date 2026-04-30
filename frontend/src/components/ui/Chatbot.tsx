import React, { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Xin chào! Tôi là trợ lý ảo của EventPlatform. Tôi có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Gọi trực tiếp đến AI server, không thông qua các bộ lọc token của hệ thống backend chính
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        mode: 'cors', // Đảm bảo cho phép gọi chéo domain
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const aiMessage: Message = { role: 'ai', content: data.answer };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling AI API:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, đã có lỗi xảy ra khi kết nối với máy chủ AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed bottom-6 right-24 z-[100]"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {/* Floating Button */}
      <button
        onMouseDown={handleMouseDown}
        onClick={handleIconClick}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-colors duration-300 ${
          !isDragging ? 'hover:scale-110 transform cursor-pointer' : 'cursor-grabbing'
        } ${
          isOpen ? 'bg-slate-700 text-white' : 'bg-electric text-white shadow-electric/30'
        }`}
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? 'close' : 'smart_toy'}
        </span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-primary to-electric text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">smart_toy</span>
              <div>
                <h3 className="font-bold text-sm">Trợ lý EventPlatform</h3>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-[10px] text-white/80">Đang trực tuyến</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.content}
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
