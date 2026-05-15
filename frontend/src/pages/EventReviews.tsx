import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Icon, Loader } from '../components/ui'
import { createPortal } from 'react-dom'
import { DashboardLayout, PageHeader } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'
import { apiClient } from '../utils/axios'
import { toast } from 'react-hot-toast'

const emotions = [
  { emoji: '😠', label: 'Tệ', rating: 1, color: 'text-rose-500', bg: 'bg-rose-50' },
  { emoji: '😕', label: 'Tạm', rating: 2, color: 'text-orange-500', bg: 'bg-orange-50' },
  { emoji: '😊', label: 'Tuyệt', rating: 3, color: 'text-amber-500', bg: 'bg-amber-50' },
  { emoji: '🤩', label: 'Rất đỉnh', rating: 4, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { emoji: '🔥', label: 'Cháy hết mình', rating: 5, color: 'text-pink-500', bg: 'bg-pink-50' },
]

const EventReviews = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const eventId = searchParams.get('eventId')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      navigate('/history')
      return
    }
    fetchEventDetails()
  }, [eventId])

  const fetchEventDetails = async () => {
    try {
      const response = await apiClient.get(`/events/${eventId}`)
      setEvent(response.data)
    } catch (error) {
      console.error('Error fetching event details:', error)
      toast.error('Không thể tải thông tin sự kiện')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > 3) {
      toast.error('Chỉ được tải lên tối đa 3 ảnh')
      return
    }

    setUploading(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      const response = await apiClient.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImages([...images, ...response.data])
      toast.success('Đã tải ảnh lên')
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Tải ảnh thất bại')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Vui lòng nhập cảm nhận của bạn')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post('/comments', {
        eventId: Number(eventId),
        content: comment,
        rating,
        images
      })
      toast.success('Cảm ơn bạn đã đánh giá!')
      navigate('/history')
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Gửi đánh giá thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout sidebarProps={userSidebarConfig}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="w-12 h-12 text-primary" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <PageHeader
              title="Đánh giá sự kiện"
              subtitle="Chia sẻ trải nghiệm của bạn với cộng đồng"
              backTo="/history"
              breadcrumb={['Cá nhân', 'Lịch sử tham gia', 'Đánh giá']}
            />
          </div>

          <div className="p-6 max-w-2xl mx-auto space-y-6 pb-24">
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both" style={{ animationDelay: '100ms' }}>
              
              {/* Premium Event Banner Header */}
              <div className="relative h-44 bg-slate-900 overflow-hidden animate-in fade-in duration-1000">
                <img
                  src={event?.bannerUrl || event?.posterUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'}
                  className="w-full h-full object-cover opacity-40 scale-105 blur-[2px]"
                  alt="Banner Blurred"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/60 to-slate-900" />
                
                {/* Overlay Content: Poster and Text Grid */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end gap-5 z-10">
                  <div className="relative w-20 h-28 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 translate-y-2 aspect-[3/4] bg-slate-800">
                    <img
                      src={event?.posterUrl || event?.bannerUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'}
                      className="w-full h-full object-cover"
                      alt="Poster"
                    />
                  </div>
                  <div className="flex-1 pb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-[9px] font-black tracking-wider text-white/90 uppercase mb-2 border border-white/10">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Bạn đã tham gia
                    </span>
                    <h3 className="text-xl font-black text-white leading-tight tracking-tight drop-shadow-sm line-clamp-2">{event?.title}</h3>
                    <div className="text-white/75 text-[10px] font-bold mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1.5">
                        <Icon name="calendar_today" size="xs" /> 
                        {event?.startTime ? new Date(event.startTime).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      </span>
                      <span className="w-1 h-1 bg-white/30 rounded-full" />
                      <span className="flex items-center gap-1.5">
                        <Icon name="location_on" size="xs" /> 
                        {event?.province?.name || event?.province || 'Địa điểm chưa xác định'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-10 space-y-8">
                {/* Rating Section */}
                <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '300ms' }}>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Không khí sự kiện thế nào?</h4>
                    <p className="text-xs text-slate-500 font-medium">Hãy chọn cảm xúc diễn tả chính xác nhất trải nghiệm của bạn</p>
                  </div>
                  <div className="flex justify-center items-center gap-3 sm:gap-5">
                    {emotions.map((e) => (
                      <button
                        key={e.rating}
                        onClick={() => setRating(e.rating)}
                        className="group flex flex-col items-center gap-2 transition-all duration-300 outline-none relative active:scale-90"
                      >
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-500 cursor-pointer ${rating === e.rating
                          ? `${e.bg} ${e.color} scale-110 shadow-xl shadow-current/10 ring-2 ring-offset-4 ring-current transform -translate-y-1`
                          : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400 hover:scale-105 hover:-translate-y-0.5'
                          }`}>
                          <span className="transition-transform duration-300 group-hover:scale-110 active:scale-95">{e.emoji}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${rating === e.rating ? e.color : 'text-slate-400'}`}>
                          {e.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                {/* Comment Section */}
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '450ms' }}>
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Icon name="rate_review" size="xs" className="text-slate-400" /> Cảm nhận chi tiết
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{comment.length}/500</span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    placeholder="Đừng ngần ngại chia sẻ những khoảnh khắc đáng nhớ, chất lượng âm thanh, ánh sáng, hay khâu tổ chức của sự kiện nhé..."
                    className="w-full min-h-[110px] bg-slate-50/50 border border-slate-200/80 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl p-4 text-sm text-slate-700 font-semibold placeholder:text-slate-400 transition-all outline-none resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]"
                  />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '600ms' }}>
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Icon name="photo_library" size="xs" className="text-slate-400" /> Hình ảnh thực tế
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{images.length}/3</span>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-200 shadow-sm bg-slate-50 animate-in zoom-in-95 duration-300">
                        <img
                          src={img}
                          className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-500"
                          alt="Review"
                          onClick={() => setSelectedImageUrl(img)}
                        />
                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Icon name="zoom_in" size="sm" className="text-white" />
                        </div>
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-90 z-10"
                        >
                          <Icon name="close" size="xs" />
                        </button>
                      </div>
                    ))}

                    {images.length < 3 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="aspect-square rounded-2xl bg-slate-50/50 border-2 border-dashed border-slate-200 hover:border-primary/40 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all duration-300 group relative"
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="text-[9px] font-bold text-primary">Đang tải...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center mb-1.5 transition-colors">
                              <Icon name="add_a_photo" size="sm" className="group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider">Thêm ảnh</span>
                          </>
                        )}
                      </button>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Premium Voucher Banner */}
                <div className="bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.04] to-transparent rounded-2xl p-4 flex items-center gap-4 border border-dashed border-amber-500/20 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both relative overflow-hidden" style={{ animationDelay: '750ms' }}>
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-amber-600 pointer-events-none">
                    <Icon name="stars" size="xl" />
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-amber-500/20">
                    <Icon name="workspace_premium" size="sm" />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900">Ưu đãi người tham gia!</p>
                      <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide animate-pulse">Thưởng</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">Đánh giá để nhận ngay phần quà độc quyền <span className="text-amber-600 font-black tracking-wide">+100 pts</span> vào ví điểm thưởng.</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '900ms' }}>
                  <button
                    onClick={() => navigate('/history')}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 text-xs font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest border border-slate-200/50"
                  >
                    Để sau
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || uploading}
                    className="flex-[2.5] py-4 bg-primary text-white text-xs font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none group"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        Gửi đánh giá ngay <Icon name="send" size="sm" className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
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
                alt="Full size preview"
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

export default EventReviews
