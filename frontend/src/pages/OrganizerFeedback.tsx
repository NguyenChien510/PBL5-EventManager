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
          <PageHeader title="Phản hồi Khách mời" subtitle="Tổng hợp đánh giá từ tất cả các sự kiện của bạn" />
      <div className="p-8 space-y-12">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-down">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 flex items-center gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-400/10 transition-colors duration-700" />
            <div className="w-24 h-24 bg-yellow-50/50 rounded-[2rem] border border-yellow-100 flex flex-col items-center justify-center relative z-10">
              <span className="text-4xl font-black text-yellow-500 tracking-tighter">{averageRating}</span>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3].map(s => <Icon key={s} name="star" size="xs" className="text-yellow-400" filled />)}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Xếp hạng trung bình</p>
              <p className="text-sm text-slate-700 font-bold tracking-tight">{comments.length} đánh giá tổng cộng</p>
              <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Icon
                    key={s}
                    name="star"
                    size="xs"
                    className={s <= Math.round(Number(averageRating)) ? "text-yellow-400" : "text-slate-100"}
                    filled
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors duration-700" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 relative z-10">Phân bố đánh giá</h4>
            <div className="space-y-2 relative z-10">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = comments.filter(c => c.rating === star).length;
                const pct = comments.length > 0 ? (count / comments.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-[10px] w-2 font-black text-slate-400">{star}</span>
                    <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-700" />
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Cần phản hồi</h4>
              <p className="text-5xl font-black text-slate-900 tracking-tighter mb-1">
                {comments.filter(c => !c.reply).length}
              </p>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 text-primary rounded-xl border border-primary/10 w-fit">
                <span className="text-[9px] font-black uppercase tracking-widest">Feedback tồn đọng</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-primary/5 text-primary rounded-[1.5rem] border border-primary/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
              <Icon name="chat_bubble" size="md" />
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Tất cả nhận xét</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Sắp xếp theo <Icon name="expand_more" size="xs" />
            </div>
          </div>

          {comments.map((review, i) => (
            <div 
              key={review.id || i} 
              className="bg-white rounded-[3rem] border border-slate-100/80 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group/card relative overflow-hidden"
              style={{ animationDelay: `${100 + i * 50}ms`, animationFillMode: 'both' }}
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
                      <h4 className="font-black text-slate-900 text-lg mb-2 truncate">{review.user?.fullName}</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                          {review.eventThumbnail && (
                            <img src={review.eventThumbnail} alt="Event" className="w-5 h-5 rounded-lg object-cover shadow-sm" />
                          )}
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight max-w-[200px] truncate">
                            {review.eventName || `Sự kiện ID: ${review.eventId}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 bg-yellow-400/5 px-3 py-1.5 rounded-2xl border border-yellow-400/10">
                      {Array.from({ length: 5 }, (_, s) => (
                        <Icon key={s} name="star" size="xs" className={s < review.rating ? 'text-yellow-400' : 'text-slate-100'} filled />
                      ))}
                    </div>
                  </div>
                  
                  <div className="relative mb-8">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{review.content}</p>
                  </div>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-8">
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
                  <div className="space-y-6 pt-8 border-t border-slate-50">
                    <div className="flex flex-wrap items-center gap-4">
                      <button 
                        onClick={() => handleToggleLike(review.id)}
                        className={`group/heart flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-500 border ${
                          review.isLikedByOrganizer 
                            ? 'bg-rose-50 text-rose-500 border-rose-100 shadow-sm shadow-rose-100/20' 
                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-rose-200 hover:text-rose-400'
                        }`}
                      >
                        <Icon name="favorite" size="xs" filled={review.isLikedByOrganizer} className={review.isLikedByOrganizer ? 'scale-110' : 'group-hover/heart:scale-120 transition-transform'} />
                        <span className="text-[9px] font-black uppercase tracking-[0.1em]">{review.isLikedByOrganizer ? 'Đã yêu thích' : 'Yêu thích'}</span>
                      </button>
                      
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50/50 border border-slate-100/50 text-slate-400">
                        <Icon name={review.reply ? "check_circle" : "pending"} size="xs" className={review.reply ? "text-emerald-500" : ""} />
                        <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                          {review.reply ? 'Đã phản hồi' : 'Chờ phản hồi'}
                        </span>
                      </div>
                    </div>

                    {/* Show existing reply if any */}
                    {review.reply && (
                      <div className="bg-slate-50/80 p-6 rounded-[2.5rem] border border-slate-100/50 space-y-3 relative overflow-hidden group/reply hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm border border-blue-100">
                            <Icon name="reply" size="xs" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phản hồi của bạn</span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed text-slate-600 pl-9">{review.reply}</p>
                      </div>
                    )}

                    {/* Reply Input */}
                    <div className="flex gap-3 bg-slate-50/50 p-2 rounded-[2rem] border-2 border-slate-100 focus-within:border-primary/20 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-primary/5 transition-all duration-500">
                      <input 
                        type="text" 
                        placeholder={review.reply ? "Cập nhật phản hồi mới..." : "Gửi lời cảm ơn chân thành đến khách mời..."} 
                        className="flex-1 px-5 py-3 bg-transparent border-none text-xs font-bold outline-none placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest" 
                        value={replyTexts[review.id] || ''}
                        onChange={(e) => setReplyTexts({ ...replyTexts, [review.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleReply(review.id)}
                      />
                      <button 
                        onClick={() => handleReply(review.id)}
                        className="w-12 h-12 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center hover:bg-primary hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10 group/send"
                      >
                        <Icon name="send" size="xs" className="group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>
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
