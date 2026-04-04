import { Icon, StatusBadge } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { EventService } from '../services/eventService'
import { toast } from 'react-hot-toast'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet marker icons issue
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

function MapAutoCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 15)
  }, [center, map])
  return null
}

const sidebarConfig = adminSidebarConfig

const AdminEventReview = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return
      try {
        setLoading(true)
        const data = await EventService.getEventById(id)
        setEvent(data)
      } catch (error) {
        console.error('Error fetching event detail:', error)
        toast.error('Không thể tải chi tiết sự kiện')
        navigate('/admin/moderation')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id, navigate])

  useEffect(() => {
    const geocodeLocation = async () => {
      if (!event || !event.location) return
      try {
        // Try exact location first
        const query = event.location
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        let data = await res.json()
        
        // Fallback: If not found, try adding province
        if ((!data || data.length === 0) && event.province?.name) {
          const fallbackQuery = `${event.location}, ${event.province.name}`
          const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`)
          data = await fallbackRes.json()
        }

        if (data && data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        }
      } catch (error) {
        console.error('Error geocoding location:', error)
      }
    }
    geocodeLocation()
  }, [event])

  const handleStatusUpdate = async (status: string) => {
    if (!id) return
    try {
      await EventService.updateEventStatus(id, status)
      toast.success(`Đã cập nhật trạng thái sự kiện thành ${status}`)
      navigate('/admin/moderation')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Cập nhật trạng thái thất bại')
    }
  }

  if (loading) {
    return (
      <DashboardLayout sidebarProps={sidebarConfig}>
        <PageHeader title="Đang tải..." />
        <div className="p-8 text-center text-slate-400">Đang tải dữ liệu sự kiện...</div>
      </DashboardLayout>
    )
  }

  if (!event) return null

  const eventDetails = [
    { icon: 'person', label: 'Nhà tổ chức', value: event.organizer?.fullName || 'N/A' },
    { icon: 'category', label: 'Thể loại', value: event.category?.name || 'N/A' },
    { icon: 'calendar_today', label: 'Ngày bắt đầu', value: event.startTime ? new Date(event.startTime).toLocaleString('vi-VN') : 'N/A' },
    { icon: 'location_on', label: 'Địa điểm', value: event.location || 'N/A' },
    { icon: 'confirmation_number', label: 'Trạng thái hiện tại', value: <StatusBadge status={event.status} /> },
  ]

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader 
        title="Kiểm duyệt Chi tiết" 
        breadcrumb={['Kiểm duyệt', event.title]} 
      />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="aspect-[21/9] bg-slate-100 relative">
                <img 
                  src={event.posterUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-4 left-4">
                   <StatusBadge status={event.status} />
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">{event.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {eventDetails.map((item: any) => (
                    <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <Icon name={item.icon} className="text-primary" size="sm" />
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">{item.label}</p>
                        <div className="font-medium">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4">Mô tả sự kiện</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.description || 'Không có mô tả cho sự kiện này.'}
              </p>
            </div>

            {/* Map Integration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden min-h-[450px]">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Icon name="map" className="text-primary" /> Vị trí trên bản đồ
              </h3>
              <div className="rounded-xl overflow-hidden h-80 border border-slate-100 relative z-0">
                <MapContainer center={coordinates || [10.762622, 106.660172]} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {coordinates && (
                    <>
                      <MapAutoCenter center={coordinates} />
                      <Marker position={coordinates}>
                        <Popup>
                          <div className="font-sans">
                            <h3 className="font-bold text-sm">{event.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">{event.location}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </>
                  )}
                </MapContainer>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">* Bản đồ sử dụng OpenStreetMap. Vị trí được tìm kiếm qua Nominatim.</p>
            </div>
          </div>

          {/* Moderation Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm border-t-4 border-t-primary">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Icon name="gavel" className="text-primary" /> Phê duyệt
              </h3>
              
              <div className="mb-6">
                <label className="text-sm font-bold text-slate-600 mb-2 block">Ghi chú phản hồi / Lý do (Internal)</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                  placeholder="Nhập ghi chú cho nhà tổ chức..." 
                  rows={4} 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => handleStatusUpdate('upcoming')}
                  className="w-full py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-sm"
                >
                  <Icon name="check_circle" size="sm" /> Phê duyệt
                </button>
                <button 
                  onClick={() => handleStatusUpdate('editing')}
                  className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-sm"
                >
                  <Icon name="edit" size="sm" /> Yêu cầu chỉnh sửa
                </button>
                <button 
                  onClick={() => handleStatusUpdate('rejected')}
                  className="w-full py-3 bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-sm"
                >
                  <Icon name="block" size="sm" /> Từ chối
                </button>
                
                <button 
                  onClick={() => navigate('/admin/moderation')}
                  className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-sm"
                >
                  Quay lại danh sách
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Icon name="info" className="text-primary" size="sm" /> Thông tin thêm
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID sự kiện:</span>
                  <span className="font-mono font-bold text-xs">{event.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminEventReview
