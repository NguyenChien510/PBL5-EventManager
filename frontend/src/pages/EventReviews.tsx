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
            />
          </div>
      
      <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both" style={{ animationDelay: '100ms' }}>
          {/* Event Banner */}
          <div className="relative h-48 bg-slate-900 animate-in fade-in duration-1000">
            <img 
              src={event?.bannerUrl || event?.posterUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'} 
              className="w-full h-full object-cover opacity-60"
              alt="Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-white/70 uppercase mb-2 block">Bạn đang đánh giá cho</span>
                <h3 className="text-2xl font-black text-white">{event?.title}</h3>
                <p className="text-white/60 text-xs font-bold mt-1 flex items-center gap-2">
                  <Icon name="calendar_today" size="sm" /> {event?.startTime ? new Date(event.startTime).toLocaleDateString('vi-VN') : ''}
                  <span className="w-1 h-1 bg-white/30 rounded-full" />
                  <Icon name="location_on" size="sm" /> {event?.province?.name || event?.province || 'Địa điểm chưa xác định'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-12">
            {/* Rating Section */}
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '300ms' }}>
              <h4 className="text-xl font-black text-slate-900">Không khí sự kiện thế nào?</h4>
              <div className="flex justify-center gap-4 sm:gap-6">
                {emotions.map((e) => (
                  <button 
                    key={e.rating}
                    onClick={() => setRating(e.rating)}
                    className="group flex flex-col items-center gap-3 transition-all outline-none"
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] flex items-center justify-center text-3xl sm:text-4xl transition-all duration-300 ${
                      rating === e.rating 
                        ? `${e.bg} ${e.color} scale-110 shadow-lg ring-2 ring-offset-2 ring-current` 
                        : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400'
                    }`}>
                      {e.emoji}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${
                      rating === e.rating ? e.color : 'text-slate-400'
                    }`}>
                      {e.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '450ms' }}>
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cảm nhận chi tiết</label>
                <span className="text-[10px] font-bold text-slate-300">{comment.length}/500</span>
              </div>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                placeholder="Hãy chia sẻ những khoảnh khắc đáng nhớ nhất của bạn tại sự kiện này..."
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-3xl p-6 text-slate-700 font-medium placeholder:text-slate-400 transition-all outline-none min-h-[160px] resize-none"
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '600ms' }}>
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ảnh thực tế (Tối đa 3)</label>
                <span className="text-[10px] font-bold text-slate-300">{images.length}/3</span>
              </div>
              
              <div className="flex gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden group border border-slate-100 shadow-sm">
                    <img 
                      src={img} 
                      className="w-full h-full object-cover cursor-zoom-in" 
                      alt="Review" 
                      onClick={() => setSelectedImageUrl(img)}
                    />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon name="close" size="xs" />
                    </button>
                  </div>
                ))}
                
                {images.length < 3 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-primary/30 hover:text-primary transition-all group"
                  >
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <>
                        <Icon name="add_a_photo" />
                        <span className="text-[9px] font-black uppercase mt-1">Thêm ảnh</span>
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

            {/* Bonus Banner */}
            <div className="bg-primary/5 rounded-3xl p-6 flex items-center gap-6 border border-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '750ms' }}>
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0">
                <Icon name="workspace_premium" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Quà tặng đánh giá!</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Mỗi đánh giá chất lượng sẽ giúp bạn nhận được <span className="text-primary font-black">50 pts</span> điểm thưởng.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '900ms' }}>
              <button 
                onClick={() => navigate('/history')}
                className="flex-1 py-5 bg-slate-100 text-slate-500 text-sm font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest"
              >
                Để sau
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="flex-[2] py-5 bg-primary text-white text-sm font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    Gửi đánh giá ngay <Icon name="send" size="sm" />
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
