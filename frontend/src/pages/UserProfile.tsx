import { useState, useEffect } from 'react'
import { Icon, Avatar } from '../components/ui'
import { DashboardLayout } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { apiClient } from '../utils/axios'

import { toast } from 'react-hot-toast'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '../utils/cropImage'
import { useCallback } from 'react'

const sidebarConfig = userSidebarConfig

const UserProfile = () => {
  const { user, setUser } = useAuthStore()
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Tất cả')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)

  // Crop States
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fullNameInput, setFullNameInput] = useState('')
  const [nameLoading, setNameLoading] = useState(false)

  useEffect(() => {
    if (showNameModal && user) {
      setFullNameInput(user.fullName || '')
    }
  }, [showNameModal, user])

  const handleNameUpdate = async () => {
    if (!fullNameInput.trim()) {
      toast.error('Họ tên không được để trống')
      return
    }

    try {
      setNameLoading(true)
      const res = await apiClient.post('/users/update-name', { fullName: fullNameInput })
      setUser(res.data)
      toast.success('Cập nhật họ tên thành công')
      setShowNameModal(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật họ tên')
    } finally {
      setNameLoading(false)
    }
  }

  const handleDownloadQR = async (qrData: string, orderId: string) => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrData}`
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `QRCode_Order_${orderId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download QR failed:', err)
      toast.error('Không thể tải mã QR. Vui lòng thử lại sau.')
    }
  }

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    try {
      setPasswordLoading(true)
      await apiClient.post('/users/change-password', passwordForm)
      toast.success('Đổi mật khẩu thành công')
      setShowPasswordModal(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setTempImage(reader.result as string)
      setShowCropModal(true)
    })
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleUploadCroppedImage = async () => {
    if (!tempImage || !croppedAreaPixels || isUploading) return

    try {
      setIsUploading(true)
      const toastId = toast.loading('Đang xử lý và tải ảnh lên...', { id: 'avatar-upload' })
      
      const croppedImageBlob = await getCroppedImg(tempImage, croppedAreaPixels)
      const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('file', file)

      const res = await apiClient.post('/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setUser(res.data)
      setShowCropModal(false)
      setTempImage(null)
      toast.success('Cập nhật ảnh đại diện thành công', { id: 'avatar-upload' })
    } catch (err: any) {
      console.error('Avatar upload failed:', err)
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại sau.', { id: 'avatar-upload' })
    } finally {
      setIsUploading(false)
    }
  }

  const [statuses, setStatuses] = useState<string[]>([])

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'Tất cả') return true
    if (activeTab === 'Thanh toán thành công') return t.status === 'active' || t.status === 'paid' || t.status === 'pending'
    if (activeTab === 'Đã check-in') return t.status === 'checked_in' || t.status === 'used'
    return true
  })

  const groupedTickets = filteredTickets.reduce((groups, ticket) => {
    const orderId = ticket.orderId || 'N/A'
    if (!groups[orderId]) groups[orderId] = []
    groups[orderId].push(ticket)
    return groups
  }, {} as Record<string, any[]>)

  const sortedOrderIds = Object.keys(groupedTickets).sort((a, b) => b.localeCompare(a))

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, ticketsRes, statusesRes] = await Promise.all([
          apiClient.get('/users/me'),
          apiClient.get('/tickets/my'),
          apiClient.get('/tickets/statuses')
        ])
        setUser(userRes.data)
        setTickets(ticketsRes.data)
        setStatuses(statusesRes.data)
      } catch (err) {
        console.error('Error fetching profile data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (showPasswordModal || selectedTicket || showNameModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showPasswordModal, selectedTicket, showNameModal])

  const getMembershipTier = (pts: number) => {
    if (pts >= 15000) {
      return {
        label: 'Hạng Kim Cương',
        icon: 'diamond',
        className: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-[0_4px_12px_-2px_rgba(6,182,212,0.3)] font-black',
        iconColor: 'text-white'
      }
    }
    if (pts >= 5000) {
      return {
        label: 'Hạng Vàng',
        icon: 'military_tech',
        className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-[0_4px_12px_-2px_rgba(245,158,11,0.3)] font-black',
        iconColor: 'text-white'
      }
    }
    return {
      label: 'Hạng Chuẩn',
      icon: 'stars',
      className: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-transparent font-black',
      iconColor: 'text-white'
    }
  }

  const tier = getMembershipTier(user?.loyaltyPoints || 0)

  if (loading) {
    return (
      <DashboardLayout sidebarProps={sidebarConfig}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <>
      <DashboardLayout sidebarProps={sidebarConfig}>
        {/* Header */}
        <header className="h-20 px-8 lg:px-12 flex items-center justify-between sticky top-0 z-40 bg-white border-b border-slate-100/50">
          <h2 className="text-xl font-bold text-slate-800">Hồ sơ người dùng</h2>
          <div className="flex items-center gap-5">
            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
              <Icon name="search" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary relative">
              <Icon name="notifications" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        <div className="px-8 lg:px-12 pb-12 space-y-6">
          {/* Profile Card + Points */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            {/* Profile Info */}
            <div className="xl:col-span-7 bg-white rounded-3xl p-4 lg:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-50 group-hover:bg-primary/5 transition-colors duration-700" />

              <div className="relative shrink-0">
                <Avatar 
                  key={user?.avatar}
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=random`} 
                  size="xl" 
                  className="w-24 h-24 lg:w-28 lg:h-28 rounded-[1.5rem] shadow-xl border-4 border-white ring-1 ring-slate-100 object-cover" 
                />
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg border-2 border-white flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all">
                  <Icon name="camera_alt" size="sm" />
                  <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
              </div>

              <div className="flex-1 flex flex-col justify-between h-full text-center md:text-left py-2">
                <div>
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{user?.fullName}</h3>
                    <div className={`px-3.5 py-1.5 ${tier.className} text-[9px] rounded-full border uppercase tracking-widest flex items-center gap-1.5 transition-all duration-500 select-none hover:scale-105`}>
                      <Icon name={tier.icon} size="sm" className={`scale-90 ${tier.iconColor}`} filled={true} /> 
                      <span>{tier.label}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800"><Icon name="mail" size="sm" className="opacity-90" /> {user?.email}</span>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full hidden md:block" />
                    <span className="flex items-center gap-1.5 font-bold text-slate-800"><Icon name="calendar_today" size="sm" className="opacity-60" /> Tham gia {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}</span>
                  </p>

                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <button
                      onClick={() => setShowNameModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-primary/20 group/name"
                    >
                      <Icon name="edit" size="sm" className="group-hover/name:scale-110 transition-transform" />
                      Sửa tên
                    </button>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all shadow-lg shadow-slate-900/10 hover:shadow-primary/20 group/pw"
                    >
                      <Icon name="lock" size="sm" className="group-hover/pw:rotate-12 transition-transform" />
                      Đổi mật khẩu
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Points Card */}
            <div className="xl:col-span-5 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-3xl p-4 lg:p-5 text-white relative overflow-hidden shadow-xl shadow-primary/20 flex flex-col justify-between min-h-[180px] group">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 p-6 opacity-10 scale-125 rotate-12 transition-transform group-hover:scale-150 duration-1000">
                <Icon name="loyalty" className="text-white text-[80px]" />
              </div>

              <div className="relative z-10">
                <p className="text-white text-[18px] font-black uppercase mb-2">Điểm thưởng hiện có</p>
                <div className="flex items-baseline gap-1.5">
                  <h4 className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">{(user?.loyaltyPoints || 0).toLocaleString()}</h4>
                  <span className="text-sm font-bold text-white/50 uppercase tracking-widest">pts</span>
                </div>
              </div>

              <div className="relative z-10 space-y-6">
                <Link to="/vouchers" className="w-full py-4 bg-white text-primary text-xs font-black rounded-2xl shadow-xl hover:bg-slate-50 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-[0.15em] flex items-center justify-center gap-2">
                  ĐỔI QUÀ NGAY <Icon name="arrow_forward" size="sm" />
                </Link>
              </div>
            </div>
          </section>

          {/* Tickets */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" />
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Vé của tôi</h3>
                </div>
                <div className="flex items-center justify-center min-w-[32px] h-8 px-2.5 bg-primary/10 border border-primary/20 text-primary text-xs font-black rounded-xl shadow-sm">
                  {tickets.length}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl self-start backdrop-blur-md border border-slate-200/50 shadow-sm">
                {statuses.map((tab) => {
                  const getIcon = (name: string) => {
                    switch (name) {
                      case 'Tất cả': return 'apps'
                      case 'Thanh toán thành công': return 'verified'
                      case 'Đã check-in': return 'qr_code_scanner'
                      default: return 'filter_list'
                    }
                  }
                  const isActive = activeTab === tab
                  const getTabStyles = (name: string, active: boolean) => {
                    if (active) {
                      if (name === 'Thanh toán thành công') return 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105'
                      if (name === 'Đã check-in') return 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 scale-105'
                      return 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                    }
                    if (name === 'Thanh toán thành công') return 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                    if (name === 'Đã check-in') return 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                    return 'text-slate-500 hover:bg-white hover:text-primary'
                  }

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${getTabStyles(tab, isActive)}`}
                    >
                      <Icon name={getIcon(tab)} size="sm" filled={isActive} />
                      {tab}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {sortedOrderIds.length > 0 ? sortedOrderIds.map((orderId) => {
                const ticketsInOrder = groupedTickets[orderId]
                const firstTicket = ticketsInOrder[0]
                const seatList = ticketsInOrder.map(t => t.seat).join(', ')

                return (
                  <div
                    key={orderId}
                    onClick={() => setSelectedTicket(ticketsInOrder)}
                    className="group bg-white rounded-[2.5rem] p-4 md:p-5 flex flex-col md:flex-row gap-6 md:gap-8 border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all cursor-pointer relative overflow-hidden"
                  >
                    {/* Left: Poster & Badges */}
                    <div className="w-full md:w-72 h-44 flex-shrink-0 rounded-[2rem] overflow-hidden relative shadow-xl bg-slate-100">
                      <img src={firstTicket.image} alt={firstTicket.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-black text-white rounded-full uppercase tracking-[0.15em]">
                          {ticketsInOrder.length} Vé
                        </span>
                      </div>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 flex flex-col justify-center py-1">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-black text-slate-900 uppercase">ĐƠN HÀNG #{orderId}</span>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${firstTicket.status === 'paid' || firstTicket.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : firstTicket.status === 'checked_in' || firstTicket.status === 'used'
                              ? 'bg-rose-50 text-rose-600 border-rose-100'
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                            {firstTicket.status === 'paid' || firstTicket.status === 'active'
                              ? 'Thanh toán thành công'
                              : firstTicket.status === 'checked_in' || firstTicket.status === 'used'
                                ? 'Đã check-in'
                                : 'Đang xử lý'}
                          </span>
                        </div>

                        <h4 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-3 group-hover:text-primary transition-colors">
                          {firstTicket.title}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-10">
                          <div className="flex items-center gap-4 text-slate-500">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                              <Icon name="calendar_today" className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Thời gian</p>
                              <p className="text-sm font-black text-slate-800 tabular-nums">{firstTicket.date}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-slate-500">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                              <Icon name="event_seat" className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Vị trí ghế</p>
                              <p className="text-sm font-black text-primary truncate max-w-[200px]">{seatList}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-slate-500 md:col-span-2">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                              <Icon name="location_on" className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Địa điểm</p>
                              <p className="text-sm font-bold text-slate-700 line-clamp-1">{firstTicket.location}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Aesthetic Cutouts */}
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-background-light rounded-full -translate-y-1/2 border-l border-slate-100" />
                    <div className="hidden md:block absolute top-1/2 -left-3 w-6 h-6 bg-background-light rounded-full -translate-y-1/2 border-r border-slate-100" />
                  </div>
                )
              }) : (
                <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                  <Icon name="confirmation_number" className="text-slate-200 text-6xl mb-4" />
                  <p className="text-slate-400 font-medium">
                    {activeTab === 'Đã check-in'
                      ? 'Chưa có vé nào check-in'
                      : activeTab === 'Thanh toán thành công'
                        ? 'Chưa có vé nào đã thanh toán'
                        : 'Bạn chưa mua vé nào. Khám phá các sự kiện ngay!'}
                  </p>
                  {activeTab === 'Tất cả' && (
                    <Link to="/explore" className="mt-4 inline-block text-primary font-bold hover:underline">Khám phá ngay</Link>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </DashboardLayout>

      {/* Ticket Detail Modal - Moved outside DashboardLayout to cover Sidebar */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 transition-opacity" onClick={() => setSelectedTicket(null)} />

          <div className="relative bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header with Close Button */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white backdrop-blur-sm transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <div className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
              {/* Simplified Event Header */}
              <div className="relative h-24">
                <img
                  src={Array.isArray(selectedTicket) ? selectedTicket[0].image : selectedTicket.image}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-lg font-black text-white leading-tight">
                    {Array.isArray(selectedTicket) ? selectedTicket[0].title : selectedTicket.title}
                  </h3>
                </div>
              </div>

              <div className="p-5 pt-4 space-y-4">
                {/* QR Section */}
                <div className="relative group/qr">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-[2.5rem] blur opacity-25 group-hover/qr:opacity-50 transition duration-1000" />
                  <div className="relative text-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Mã QR Check-in Duy nhất</p>
                    
                    <div className="relative inline-block mb-3 p-3 bg-slate-50 rounded-3xl group-hover/qr:bg-white transition-colors duration-500">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${Array.isArray(selectedTicket) ? selectedTicket[0].orderQrCode : selectedTicket.orderQrCode}`}
                        alt="Order QR Code"
                        className="w-32 h-32 relative z-10"
                      />
                      {/* Decorative corners */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/30 rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/30 rounded-br-2xl" />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 group/code">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="text-[10px] font-mono font-bold text-slate-600 tracking-wider">
                          {Array.isArray(selectedTicket) ? selectedTicket[0].orderQrCode : selectedTicket.orderQrCode}
                        </span>
                        <button
                          onClick={() => {
                            const code = Array.isArray(selectedTicket) ? selectedTicket[0].orderQrCode : selectedTicket.orderQrCode
                            navigator.clipboard.writeText(code)
                            toast.success('Đã sao chép mã đơn hàng')
                          }}
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-primary transition-colors flex items-center justify-center"
                          title="Sao chép mã"
                        >
                          <Icon name="content_copy" size="sm" className="!text-[14px]" />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium italic">Vui lòng đưa mã này cho nhân viên check-in tại cửa</p>
                    </div>
                  </div>
                </div>

                {/* Ticket List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Danh sách vé</h4>
                    <span className="text-[9px] font-black bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                      {Array.isArray(selectedTicket) ? selectedTicket.length : 1} VÉ
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {(Array.isArray(selectedTicket) ? selectedTicket : [selectedTicket]).map((ticket: any, index: number) => {
                      const isVIP = ticket.type?.toUpperCase().includes('VIP')
                      return (
                        <div
                          key={ticket.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isVIP
                            ? 'bg-gradient-to-r from-amber-50 to-transparent border-amber-200 shadow-sm'
                            : 'bg-slate-50 border-slate-100'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm border ${isVIP
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-white text-primary border-slate-100'
                              }`}>
                              {isVIP ? <Icon name="stars" size="sm" className="scale-75" /> : index + 1}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{ticket.seat}</p>
                              <p className={`text-[9px] font-black uppercase tracking-wider ${isVIP ? 'text-amber-600' : 'text-slate-400'
                                }`}>
                                {ticket.type}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-400">{ticket.ticketId}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Simplified Actions */}
                <button
                  onClick={() => {
                    const firstTicket = Array.isArray(selectedTicket) ? selectedTicket[0] : selectedTicket
                    if (firstTicket) {
                      handleDownloadQR(firstTicket.orderQrCode, firstTicket.orderId?.toString() || 'N/A')
                    }
                  }}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <Icon name="download" size="sm" className="group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <span className="relative z-10">Lưu mã QR Check-in</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowPasswordModal(false)} />

          <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            >
              <Icon name="close" size="sm" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="lock" className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Đổi mật khẩu</h3>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-medium placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-medium placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-medium placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 flex flex-col md:flex-row gap-3">
                <button
                  disabled={passwordLoading}
                  className="flex-1 py-3.5 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 uppercase tracking-widest text-[10px] disabled:opacity-50"
                  onClick={handlePasswordChange}
                >
                  {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
                <button
                  disabled={passwordLoading}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Change Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowNameModal(false)} />

          <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6">
            <button
              onClick={() => setShowNameModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            >
              <Icon name="close" size="sm" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="edit" className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Cập nhật họ tên</h3>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Họ và tên mới</label>
                <input
                  type="text"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-medium placeholder:text-slate-300"
                  placeholder="Nhập họ tên của bạn"
                />
              </div>

              <div className="pt-2 flex flex-col md:flex-row gap-3">
                <button
                  disabled={nameLoading}
                  className="flex-1 py-3.5 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 uppercase tracking-widest text-[10px] disabled:opacity-50"
                  onClick={handleNameUpdate}
                >
                  {nameLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                </button>
                <button
                  disabled={nameLoading}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                  onClick={() => setShowNameModal(false)}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Avatar Crop Modal */}
      {showCropModal && tempImage && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-6 overflow-hidden touch-none">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={(e) => e.stopPropagation()} />
          <div className="relative bg-white w-full max-w-lg h-full sm:h-auto sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">Căn chỉnh ảnh</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Kéo để di chuyển, cuộn để phóng to</p>
              </div>
              <button 
                onClick={() => setShowCropModal(false)} 
                className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            
            <div className="relative flex-1 min-h-[300px] sm:min-h-[400px] bg-slate-950">
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
                classes={{
                  containerClassName: 'bg-slate-950',
                  mediaClassName: 'transition-none', // Disable transitions on media for smoothness during crop
                }}
              />
            </div>

            <div className="p-6 sm:p-8 space-y-6 bg-white shrink-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icon name="zoom_in" size="sm" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Phóng đại</span>
                  </div>
                  <span className="text-xs font-black text-primary tabular-nums">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="relative h-6 flex items-center">
                  <div className="absolute w-full h-1.5 bg-slate-100 rounded-full" />
                  <div className="absolute h-1.5 bg-primary rounded-full" style={{ width: `${((zoom - 1) / 2) * 100}%` }} />
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.01}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute w-5 h-5 bg-white border-2 border-primary rounded-full shadow-md pointer-events-none transition-transform"
                    style={{ left: `calc(${((zoom - 1) / 2) * 100}% - 10px)` }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCropModal(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 text-[11px] font-black rounded-2xl hover:bg-slate-100 transition-all active:scale-95 uppercase tracking-widest"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleUploadCroppedImage}
                  disabled={isUploading}
                  className="flex-[2] py-4 bg-primary text-white text-[11px] font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang xử lý...</span>
                    </div>
                  ) : (
                    <>
                      Xác nhận <Icon name="check" size="sm" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserProfile
