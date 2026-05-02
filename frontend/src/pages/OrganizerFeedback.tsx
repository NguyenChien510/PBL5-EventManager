import React, { useState, useEffect } from 'react'
import { Icon, Avatar, Loader } from '../components/ui'
import { createPortal } from 'react-dom'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'
import { EventService } from '../services/eventService'
import { AuthService } from '../services/authService'
import toast from 'react-hot-toast'

const sidebarConfig = organizerSidebarConfig

const OrganizerFeedback = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = await AuthService.getCurrentUser();
      if (user && user.id) {
        const data = await EventService.getOrganizerComments(user.id);
        setComments(data || []);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Không thể tải dữ liệu phản hồi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReply = async (commentId: number) => {
    const reply = replyTexts[commentId];
    if (!reply || !reply.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    const loadingToast = toast.loading('Đang gửi phản hồi...');
    try {
      await EventService.replyToComment(commentId, reply);
      toast.success('Đã gửi phản hồi thành công', { id: loadingToast });
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
      // Refresh data
      const user = await AuthService.getCurrentUser();
      const updatedComments = await EventService.getOrganizerComments(user.id);
      setComments(updatedComments);
    } catch (error) {
      console.error('Error replying to comment:', error);
      toast.error('Không thể gửi phản hồi', { id: loadingToast });
    }
  };

  const handleToggleLike = async (commentId: number) => {
    try {
      await EventService.toggleLikeComment(commentId);
      // Optimistic update
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, isLikedByOrganizer: !c.isLikedByOrganizer } : c
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Thao tác thất bại');
    }
  };

  const averageRating = comments.length > 0
    ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)
    : '0.0';

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="w-12 h-12 text-primary" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PageHeader title="Phản hồi Khách mời" subtitle="Hệ thống quản lý đánh giá và tương tác khách mời tập trung" />
      <div className="p-8 space-y-12">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-down">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center gap-6 relative overflow-hidden group">
            <div className="w-20 h-20 bg-yellow-400 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-200/50">
              <span className="text-4xl font-black leading-none tracking-tighter">{averageRating}</span>
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
                      className={s <= Math.round(Number(averageRating)) ? "text-yellow-400" : "text-slate-100"}
                      filled
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

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

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-all">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Cần phản hồi</h4>
              <div className="flex items-baseline gap-4">
                <p className="text-5xl font-black text-slate-900 tracking-tighter">
                  {comments.filter(c => !c.reply).length}
                </p>
                <div className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-sm shadow-amber-900/5">
                  <span className="text-xs font-black uppercase tracking-widest">Tồn đọng</span>
                </div>
              </div>
            </div>
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform duration-500">
              <Icon name="chat_bubble" size="sm" filled />
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Tất cả nhận xét</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
              Sắp xếp theo <Icon name="expand_more" size="xs" />
            </div>
          </div>

          {comments.map((review, i) => (
            <div 
              key={review.id || i} 
              className="bg-white rounded-[2.5rem] border border-slate-100/80 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group/card relative overflow-hidden"
              style={{ animationDelay: `${100 + i * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 relative">
                  <div className="absolute -inset-2 bg-gradient-to-tr from-slate-100 to-transparent rounded-[2.5rem] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                  <Avatar
                    src={review.user?.avatar}
                    alt={review.user?.fullName}
                    size="xl"
                    className="rounded-[2rem] shadow-md border-4 border-white relative z-10 group-hover/card:scale-105 transition-transform duration-700"
                    fallback={review.user?.fullName?.substring(0, 2)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div>
                      <h4 className="font-black text-slate-900 text-lg mb-1 truncate">{review.user?.fullName}</h4>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          {review.eventThumbnail && (
                            <img src={review.eventThumbnail} alt="Event" className="w-6 h-6 rounded-lg object-cover shadow-sm" />
                          )}
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight max-w-[200px] truncate">
                            {review.eventName || `Sự kiện ID: ${review.eventId}`}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
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
                        <Icon key={s} name="star" size="xl" className={s < review.rating ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-slate-100'} filled />
                      ))}
                    </div>
                  </div>
                
                <div className="relative mb-6">
                  <p className="text-xl text-slate-900 font-black leading-relaxed tracking-tight">
                    {review.content}
                  </p>
                </div>

                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mb-3">
                      {review.images.map((img: string, idx: number) => (
                        <div key={idx} className="relative group/img cursor-pointer overflow-hidden rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500">
                          <img
                            src={img}
                            alt="Review"
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover group-hover/img:scale-110 transition-transform duration-700"
                            onClick={() => setSelectedImageUrl(img)}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                            <Icon name="zoom_in" size="sm" className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Section & Like Button */}
                  <div className="space-y-4 pt-3 border-t border-slate-50">
                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        onClick={() => handleToggleLike(review.id)}
                        className={`group/heart flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all duration-500 border ${
                          review.isLikedByOrganizer 
                            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' 
                            : 'bg-rose-50/30 text-rose-400 border-rose-100/50 hover:bg-rose-50 hover:border-rose-200'
                        }`}
                      >
                        <Icon name="favorite" size="xs" filled={review.isLikedByOrganizer} className={review.isLikedByOrganizer ? 'scale-110' : 'group-hover/heart:scale-120 transition-transform'} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{review.isLikedByOrganizer ? 'Đã yêu thích' : 'Yêu thích'}</span>
                      </button>
                      
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border transition-all duration-500 ${
                        review.reply 
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
                      <div className="bg-slate-900/95 backdrop-blur-xl p-8 rounded-[2.5rem] space-y-4 relative overflow-hidden group/reply shadow-2xl shadow-slate-900/20 border border-white/10">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                          <Icon name="format_quote" size="xl" className="text-white rotate-180" />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-inner">
                            <Icon name="auto_awesome" size="xs" filled />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 block mb-0.5">Official Response</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-white">Ban Tổ Chức</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-slate-200 pl-14 relative z-10 border-l-2 border-white/10 ml-5 py-1">
                          {review.reply}
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2 bg-white p-1.5 rounded-[2rem] border-2 border-slate-900/10 focus-within:border-slate-900/30 focus-within:shadow-xl transition-all duration-500">
                        <input 
                          type="text" 
                          placeholder="Gửi lời cảm ơn chân thành..." 
                          className="flex-1 px-4 py-2 bg-transparent border-0 focus:ring-0 text-xs font-black outline-none placeholder:text-slate-400 placeholder:font-black placeholder:uppercase placeholder:tracking-widest" 
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
          {comments.length === 0 && (
            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="reviews" size="md" />
              </div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Hệ thống chưa ghi nhận nhận xét nào</p>
            </div>
          )}
        </div>
      </div>

      {selectedImageUrl && createPortal(
        <div
          className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-300"
          onClick={() => setSelectedImageUrl(null)}
        >
          <button
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
            onClick={() => setSelectedImageUrl(null)}
          >
            <Icon name="close" size="md" />
          </button>
          <img
            src={selectedImageUrl}
            alt="Full size review"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
        </div>
      )}
    </DashboardLayout>
  )
}

export default OrganizerFeedback
