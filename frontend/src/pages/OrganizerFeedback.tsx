import React, { useState, useEffect } from 'react'
import { Icon, Avatar } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'
import { EventService } from '../services/eventService'
import { AuthService } from '../services/authService'

const sidebarConfig = organizerSidebarConfig

const OrganizerFeedback = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user && user.id) {
          const data = await EventService.getOrganizerComments(user.id);
          setComments(data || []);
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const averageRating = comments.length > 0 
    ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1) 
    : '0.0';

  if (loading) {
    return (
      <DashboardLayout sidebarProps={sidebarConfig}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin text-primary">
            <Icon name="sync" size="xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Phản hồi Khách mời" subtitle="Tổng hợp đánh giá từ tất cả các sự kiện của bạn" />
      <div className="p-8 space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-6">
            <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-extrabold text-yellow-500">{averageRating}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Xếp hạng trung bình</p>
              <div className="flex gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Icon 
                    key={s} 
                    name="star" 
                    size="sm" 
                    className={s <= Math.round(Number(averageRating)) ? "text-yellow-400" : "text-slate-200"} 
                    filled 
                  />
                ))}
              </div>
              <p className="text-sm text-slate-500 font-bold">{comments.length} đánh giá (Toàn hệ thống)</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Phân bố đánh giá toàn bộ sự kiện</h4>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = comments.filter(c => c.rating === star).length;
              const pct = comments.length > 0 ? (count / comments.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-xs w-4 font-bold">{star}</span>
                  <Icon name="star" size="sm" className="text-yellow-400" filled />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 flex items-center justify-between group hover:border-indigo-500/20 transition-all">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chưa phản hồi</h4>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{comments.length}</p>
              <p className="text-[10px] font-bold text-indigo-500 uppercase">Feedback cần xử lý</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Icon name="chat_bubble_outline" size="sm" />
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          {comments.map((review, i) => (
            <div key={review.id || i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                  {review.userName.substring(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{review.userName}</h4>
                      <p className="text-[10px] text-slate-400">
                        Sự kiện ID: {review.eventId} • {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, s) => (
                        <Icon key={s} name="star" size="sm" className={s < review.rating ? 'text-yellow-400' : 'text-slate-200'} filled />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3 font-medium">{review.content}</p>
                  <div className="flex gap-3">
                    <input type="text" placeholder="Viết phản hồi..." className="flex-1 px-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 ring-indigo-500/20" />
                    <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl">GỬI</button>
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
    </DashboardLayout>
  )
}

export default OrganizerFeedback
