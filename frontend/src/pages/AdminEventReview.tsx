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
    if (!id) return;
    if (status === 'rejected' && (!feedback || !feedback.trim())) {
      toast.error('Vui lòng nhập nội dung phản hồi / lý do từ chối!');
      return;
    }
    try {
      await EventService.updateEventStatus(id, status, feedback.trim() || undefined)
      toast.success(status === 'rejected' ? 'Đã từ chối sự kiện thành công' : 'Đã phê duyệt sự kiện và cập nhật trạng thái')
      navigate('/admin/moderation')
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại')
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
    { icon: 'person', label: 'Nhà tổ chức', value: event.organizer?.fullName || 'N/A', bgClass: 'bg-blue-50/50', iconColor: 'text-blue-600' },
    { icon: 'category', label: 'Thể loại', value: event.category?.name || 'N/A', bgClass: 'bg-indigo-50/50', iconColor: 'text-indigo-600' },
    { icon: 'calendar_today', label: 'Ngày bắt đầu', value: event.startTime ? new Date(event.startTime).toLocaleString('vi-VN') : 'N/A', bgClass: 'bg-emerald-50/50', iconColor: 'text-emerald-600' },
    { icon: 'location_on', label: 'Địa điểm', value: event.location || 'N/A', bgClass: 'bg-amber-50/50', iconColor: 'text-amber-600' },
    { icon: 'confirmation_number', label: 'Trạng thái hiện tại', value: <StatusBadge status={event.status} />, bgClass: 'bg-slate-50', iconColor: 'text-primary' },
  ]


  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader
        title="Kiểm duyệt Chi tiết"
        breadcrumb={['Kiểm duyệt', event.title]}
        backTo="/admin/moderation"
      />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm border-l-4 border-l-blue-500">

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
                    <div key={item.label} className={`flex items-start gap-3 p-3 ${item.bgClass} rounded-xl transition-all hover:shadow-sm`}>
                      <Icon name={item.icon} className={item.iconColor} size="sm" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                        <div className="font-semibold text-slate-700">{item.value}</div>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm border-l-4 border-l-amber-500">
              <h3 className="font-bold mb-4 text-amber-700">Mô tả sự kiện</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.description || 'Không có mô tả cho sự kiện này.'}
              </p>
            </div>


            {/* Map Integration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden min-h-[450px] border-l-4 border-l-indigo-500 transition-all hover:shadow-md">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-700">
                <Icon name="map" className="text-indigo-500" /> Vị trí trên bản đồ
              </h3>

              <div className="rounded-xl overflow-hidden h-80 border border-slate-100 relative z-0">
                <MapContainer center={coordinates || [10.762622, 106.660172]} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
                  <TileLayer
                    url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
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
              <p className="text-[10px] text-slate-400 mt-2 italic">* Bản đồ sử dụng Google Maps. Vị trí được tìm kiếm qua Nominatim.</p>
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

            {/* Schedule */}
            {event.schedules && event.schedules.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm border-l-4 border-l-emerald-500">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-700">
                  <Icon name="event_note" className="text-emerald-500" size="sm" /> Lịch trình
                </h3>
                <div className="space-y-4">
                  {event.schedules.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 items-center group">
                      <div className="w-12 shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 px-2 rounded-lg text-center group-hover:bg-emerald-100 transition-colors">
                        {item.startTime ? String(item.startTime).substring(0, 5) : item.time}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700 group-hover:text-emerald-800 transition-colors">{item.activity || item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Artists Section */}
            {event.artists && event.artists.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm border-l-4 border-l-violet-500">
                <h2 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-violet-500 rounded-full" /> Nghệ sĩ biểu diễn
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {event.artists.map((artist: any) => (
                    <div key={artist.name} className="bg-slate-50 rounded-2xl border border-slate-100 p-3 text-center hover:shadow-md transition-all">
                      <img src={artist.avatar} alt={artist.name} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover shadow-sm" />
                      <p className="font-bold text-[11px] text-slate-700 truncate">{artist.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}




          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminEventReview
