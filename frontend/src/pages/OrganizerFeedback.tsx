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
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

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
    const reply = replyTexts[commentId]?.trim() || "Ban tổ chức sẽ rút kinh nghiệm, cảm ơn bạn đã nhận xét";

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
          <div className="px-8 py-6 space-y-8">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-down">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden group">
                <div className="w-12 h-12 bg-yellow-400 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-200/50">
                  <span className="text-2xl font-black leading-none tracking-tighter">{averageRating}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Xếp hạng trung bình</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-900 font-black whitespace-nowrap">{comments.length} đánh giá</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Icon
                          key={s}
                          name="star"
                          size="sm"
                          className={s <= Math.round(Number(averageRating)) ? "text-yellow-400" : "text-slate-100"}
                          filled
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 relative overflow-hidden group">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">Phân bổ đánh giá</h4>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = comments.filter(c => c.rating === star).length;
                    const pct = comments.length > 0 ? (count / comments.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-900 w-3">{star}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-900 w-8 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-all">
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Cần phản hồi</h4>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">
                      {comments.filter(c => !c.reply).length}
                    </p>
                    <div className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 shadow-sm shadow-amber-900/5">
                      <span className="text-[10px] font-black uppercase tracking-widest">Tồn đọng</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform duration-500">
                  <Icon name="chat_bubble" size="xs" filled />
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Tất cả nhận xét</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setRatingFilter(null)}
                    className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 border ${ratingFilter === null
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                      : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'
                      }`}
                  >
                    Tất cả
                  </button>
                  {[5, 4, 3, 2, 1].map(star => {
                    const starColors: any = {
                      5: 'bg-amber-500 border-amber-500 shadow-amber-500/20',
                      4: 'bg-blue-500 border-blue-500 shadow-blue-500/20',
                      3: 'bg-emerald-500 border-emerald-500 shadow-emerald-500/20',
                      2: 'bg-orange-500 border-orange-500 shadow-orange-500/20',
                      1: 'bg-rose-500 border-rose-500 shadow-rose-500/20'
                    };
                    return (
                      <button
                        key={star}
                        onClick={() => setRatingFilter(star)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all duration-500 border flex items-center gap-1.5 ${ratingFilter === star
                          ? `${starColors[star]} text-white shadow-lg`
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'
                          }`}
                      >
                        {star} <Icon name="star" size="xs" filled />
                      </button>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const filteredComments = comments.filter(review => ratingFilter === null || review.rating === ratingFilter);
                if (filteredComments.length === 0) {
                  return (
                    <div className="bg-gray-50/50 p-20 rounded-[3rem] border-2 border-gray-200 text-center">
                      <div className="w-16 h-16 bg-white text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                        <Icon name="reviews" size="md" />
                      </div>
                      <p className="text-gray-900 font-black uppercase text-[12px] tracking-widest">
                        {ratingFilter ? `Hệ thống chưa ghi nhận nhận xét ${ratingFilter} sao` : "Hệ thống chưa ghi nhận nhận xét nào"}
                      </p>
                    </div>
                  );
                }
                return (
                  <>
                    {filteredComments.map((review, i) => (
                      <div
                        key={review.id || i}
                        className="bg-white rounded-[2rem] border border-slate-100/80 p-4 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group/card relative overflow-hidden"
                        style={{ animationDelay: `${100 + i * 50}ms`, animationFillMode: 'both' }}
                      >
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-shrink-0">
                            <Avatar
                              src={review.user?.avatar}
                              alt={review.user?.fullName}
                              size="lg"
                              className="rounded-2xl shadow-sm border-4 border-white group-hover/card:scale-105 transition-transform duration-500"
                              fallback={review.user?.fullName?.substring(0, 2)}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                              <div>
                                <h4 className="font-black text-slate-900 text-base mb-0.5 truncate">{review.user?.fullName}</h4>
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                    {review.eventThumbnail && (
                                      <img src={review.eventThumbnail} alt="Event" className="w-6 h-6 rounded-lg object-cover shadow-sm" />
                                    )}
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight max-w-[200px] truncate">
                                      {review.eventName || `Sự kiện ID: ${review.eventId}`}
                                    </span>
                                  </div>
                                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
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
                              <div className="flex gap-1">
                                {Array.from({ length: 5 }, (_, s) => (
                                  <Icon key={s} name="star" size="lg" className={s < review.rating ? 'text-yellow-400' : 'text-slate-100'} filled />
                                ))}
                              </div>
                            </div>

                            <div className="relative mb-2">
                              <p className="text-base text-slate-900 font-bold leading-relaxed">{review.content}</p>
                            </div>

                            {review.images && review.images.length > 0 && (
                              <div className="flex flex-wrap gap-2.5 mb-1.5">
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
                            <div className="space-y-3 pt-2 border-t border-slate-50">
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  onClick={() => handleToggleLike(review.id)}
                                  className={`group/heart flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-500 border ${review.isLikedByOrganizer
                                    ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                                    : 'bg-rose-50/30 text-rose-400 border-rose-100/50 hover:bg-rose-50 hover:border-rose-200'
                                    }`}
                                >
                                  <Icon name="favorite" size="xs" filled={review.isLikedByOrganizer} className={review.isLikedByOrganizer ? 'scale-110' : 'group-hover/heart:scale-120 transition-transform'} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">{review.isLikedByOrganizer ? 'Đã yêu thích' : 'Yêu thích'}</span>
                                </button>

                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-500 ${review.reply
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100/20'
                                  : 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-100/20'
                                  }`}>
                                  <Icon name={review.reply ? "check_circle" : "pending"} size="xs" filled={review.reply} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">
                                    {review.reply ? 'Đã phản hồi' : 'Chờ phản hồi'}
                                  </span>
                                </div>
                              </div>

                              {review.reply ? (
                                <div className="bg-slate-50/80 p-3 rounded-2xl space-y-1 relative overflow-hidden group/reply border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                      <Icon name="subdirectory_arrow_right" size="xs" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Phản hồi từ Ban Tổ Chức</span>
                                  </div>
                                  <p className="text-[11px] font-bold leading-relaxed text-slate-900 pl-8">{review.reply}</p>
                                </div>
                              ) : (
                                <div className="flex gap-2 bg-white p-1.5 rounded-[2rem] border-2 border-slate-900/10 focus-within:border-slate-900/30 focus-within:shadow-xl transition-all duration-500">
                                  <input
                                    type="text"
                                    placeholder="Ban tổ chức sẽ rút kinh nghiệm, cảm ơn bạn đã nhận xét"
                                    className="flex-1 px-4 py-2 bg-transparent border-0 focus:ring-0 text-xs font-black outline-none placeholder:text-slate-500 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
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
                  </>
                );
              })()}
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
