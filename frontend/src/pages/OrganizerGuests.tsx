import { useEffect, useState, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Icon, SearchInput, Loader } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'
import { EventService } from '../services/eventService'
import { toast } from 'react-hot-toast'
import { Html5Qrcode } from "html5-qrcode"
import { API_BASE_URL } from '../constants'

const sidebarConfig = organizerSidebarConfig

const OrganizerGuests = () => {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | number | null>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [guestPage, setGuestPage] = useState(1)
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null)
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false)
  const eventDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target as Node)) {
        setIsEventDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await EventService.getOrganizerDashboard(0, 100) // Get all events
        setEvents(data.events.content)
        if (data.events.content.length > 0) {
          setSelectedEventId(data.events.content[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
        toast.error('Không thể tải danh sách sự kiện')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // Fetch attendees and stats when event changes
  useEffect(() => {
    if (selectedEventId) {
      fetchEventData()
    }
  }, [selectedEventId])

  const fetchEventData = async () => {
    setAttendeesLoading(true)
    try {
      const [attendeesData, statsData] = await Promise.all([
        EventService.getEventAttendees(selectedEventId!),
        EventService.getEventManageStats(selectedEventId!)
      ])
      setAttendees(attendeesData)

    } catch (error) {
      console.error('Failed to fetch event data:', error)
      toast.error('Không thể tải dữ liệu khách mời')
    } finally {
      setAttendeesLoading(false)
    }
  }

  // QR Scanning Logic
  const handleQrSuccess = async (decodedText: string) => {
    const loadingToast = toast.loading("Đang thực hiện check-in...")
    try {
      const orderInfo = await EventService.getOrderByQR(decodedText)

      // Auto-select event if it belongs to another event the organizer manages
      if (orderInfo.eventId && orderInfo.eventId !== selectedEventId) {
        setSelectedEventId(orderInfo.eventId)
      }

      // Auto check-in
      let checkInSuccess = false;
      try {
        await EventService.checkInOrderByQR(decodedText)
        checkInSuccess = true;
        toast.dismiss(loadingToast)
      } catch (checkInError: any) {
        toast.dismiss(loadingToast)
      }

      setScanResult(orderInfo)
      setHighlightedOrderId(orderInfo.id)
      setIsScanning(false)

      // Refresh attendees only if check-in was successful
      if (checkInSuccess) {
        fetchEventData()
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Mã QR không hợp lệ"
      toast.error(msg, { id: loadingToast })
    }
  }

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null
    if (isScanning) {
      html5QrCode = new Html5Qrcode("reader")
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleQrSuccess,
        () => { }
      ).catch(err => {
        console.error(err)
        toast.error("Không thể khởi động camera")
        setIsScanning(false)
      })
    }
    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(err => {
          if (err.includes("not started")) return;
          console.error(err);
        })
      }
    }
  }, [isScanning])

  const handleCheckIn = async (ticketId: number, currentStatus: boolean) => {
    try {
      await EventService.checkInTicket(ticketId, !currentStatus)
      fetchEventData()
    } catch (error) {
      toast.error('Thao tác thất bại')
    }
  }

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      handleQrSuccess(manualCode.trim())
      setManualCode('')
      setShowManualInput(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const html5QrCode = new Html5Qrcode("reader-hidden")
    try {
      const decodedText = await html5QrCode.scanFile(file, true)
      handleQrSuccess(decodedText)
    } catch (err) {
      toast.error("Không tìm thấy mã QR trong ảnh này")
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  const groupedAttendees = useMemo(() => {
    const groups: Record<number, any> = {};
    attendees.forEach(a => {
      if (!groups[a.orderId]) {
        groups[a.orderId] = {
          id: a.orderId,
          fullName: a.userName || 'Khách ẩn danh',
          email: a.userEmail || '',
          ticketTypeName: a.ticketTypeName,
          seats: [{ seatNumber: a.seatNumber, color: a.ticketTypeColor }],
          checkInStatus: a.status === 'CHECKED_IN',
          checkInDate: a.checkInDate,
          ticketId: a.ticketId,
          status: a.status,
          avatarUrl: (a.userAvatar && typeof a.userAvatar === 'string') ?
            (a.userAvatar.startsWith('http') ? a.userAvatar : `${API_BASE_URL.replace('/api', '')}${a.userAvatar.startsWith('/') ? '' : '/'}${a.userAvatar}`) : null
        };
      } else {
        groups[a.orderId].seats.push({ seatNumber: a.seatNumber, color: a.ticketTypeColor });
        if (a.status === 'CHECKED_IN') {
          groups[a.orderId].checkInStatus = true;
          groups[a.orderId].checkInDate = a.checkInDate;
        }
      }
    });
    return Object.values(groups);
  }, [attendees]);

  const filteredAttendees = useMemo(() => {
    return groupedAttendees.filter(a =>
      (a.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.id ? a.id.toString() : '').includes(searchTerm)
    );
  }, [groupedAttendees, searchTerm]);

  const totalGuestPages = Math.ceil(filteredAttendees.length / 8);
  const paginatedAttendees = filteredAttendees.slice((guestPage - 1) * 8, guestPage * 8);

  if (loading) {
    return (
      <DashboardLayout sidebarProps={sidebarConfig}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-12 h-12 text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Check-in Khách mời" />

      <div className="p-8 space-y-6 animate-in fade-in duration-500">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* QR Scanner - Left Column (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm overflow-hidden">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Icon name="qr_code_scanner" className="text-primary" size="xs" /> Máy quét QR
              </h3>

              <div className="relative h-48 bg-slate-900 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border-4 border-slate-50 shadow-inner group">
                {isScanning ? (
                  <div id="reader" className="w-full h-full"></div>
                ) : (
                  <div className="text-center p-6 transition-all duration-500 group-hover:scale-110">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 backdrop-blur-sm">
                      <Icon name="qr_code_2" className="text-white/40" size="lg" />
                    </div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Sẵn sàng quét</p>
                  </div>
                )}

                {/* Scanner Brackets - Premium Look */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/30 rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/30 rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/30 rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/30 rounded-br-lg"></div>

                  {isScanning && (
                    <div className="absolute left-0 right-0 h-[1px] bg-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`w-full py-3 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 mb-3 transform hover:scale-[1.02] active:scale-95 ${isScanning
                  ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                  : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-black'
                  }`}
              >
                <Icon name={isScanning ? 'stop' : 'videocam'} size="xs" />
                {isScanning ? 'Dừng quét' : 'Mở Camera'}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => document.getElementById('qr-upload-input')?.click()}
                  className="group py-3 px-4 bg-white text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
                >
                  <Icon name="upload" size="xs" className="group-hover:animate-bounce" /> Tải ảnh
                </button>
                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className={`group py-3 px-4 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${showManualInput
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20'
                    : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                    }`}
                >
                  <Icon name="keyboard" size="xs" className="group-hover:rotate-12 transition-transform" /> Nhập mã
                </button>
              </div>

              {showManualInput && (
                <form onSubmit={handleManualCodeSubmit} className="mt-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Nhập mã QR..."
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-black transition-all"
                    >
                      <Icon name="arrow_forward" size="xs" />
                    </button>
                  </div>
                </form>
              )}

              <input
                id="qr-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div id="reader-hidden" className="hidden"></div>
            </div>
          </div>

          {/* Guest List - Right Column (8/12) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name="people" size="sm" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Danh sách Khách mời</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {attendeesLoading ? 'Đang cập nhật...' : `${filteredAttendees.length} người`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-72 z-20" ref={eventDropdownRef}>
                    <button
                      onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all flex items-center justify-between group hover:border-primary/30 hover:bg-white"
                    >
                      <span className="truncate flex items-center gap-2.5">
                        {(() => {
                          const activeEvent = events.find(e => e.id === selectedEventId);
                          if (activeEvent) {
                            const thumb = activeEvent.posterUrl;
                            const thumbUrl = thumb ? (thumb.startsWith('http') ? thumb : `${API_BASE_URL.replace('/api', '')}${thumb.startsWith('/') ? '' : '/'}${thumb}`) : null;
                            return (
                              <>
                                <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/30 flex items-center justify-center shadow-sm">
                                  {thumbUrl ? (
                                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Icon name="event" size="xs" className="text-slate-400" />
                                  )}
                                </div>
                                <span className="truncate leading-none">{activeEvent.title}</span>
                              </>
                            );
                          }
                          return 'Chọn sự kiện';
                        })()}
                      </span>
                      <Icon 
                        name="expand_more" 
                        size="xs" 
                        className={`text-slate-400 transition-transform duration-300 group-hover:text-primary ${isEventDropdownOpen ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    {isEventDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-72 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar z-50 shadow-slate-200/50">
                        {events.map(evt => {
                          const thumb = evt.posterUrl;
                          const thumbUrl = thumb ? (thumb.startsWith('http') ? thumb : `${API_BASE_URL.replace('/api', '')}${thumb.startsWith('/') ? '' : '/'}${thumb}`) : null;
                          const isSelected = selectedEventId === evt.id;
                          return (
                            <button
                              key={evt.id}
                              onClick={() => {
                                setSelectedEventId(evt.id)
                                setIsEventDropdownOpen(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                                isSelected 
                                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/20 flex items-center justify-center shadow-sm">
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Icon name="image" size="xs" className={isSelected ? 'text-white/50' : 'text-slate-400'} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`truncate ${isSelected ? 'text-white font-black' : 'text-slate-800 font-bold'}`}>{evt.title}</p>
                                <p className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-slate-400'} truncate font-medium mt-0.5`}>
                                  {evt.location || 'Chưa cập nhật'}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="w-full sm:w-64">
                    <SearchInput
                      placeholder="Tìm khách mời..."
                      value={searchTerm}
                      onChange={(val) => setSearchTerm(val)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {attendeesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="relative">
                      <Loader className="w-10 h-10 text-primary" />
                      <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang đồng bộ dữ liệu...</p>
                  </div>
                ) : filteredAttendees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6 border-4 border-white shadow-xl shadow-slate-100/50">
                      <Icon name="person_search" size="lg" className="opacity-40" />
                    </div>
                    <p className="font-black text-xs uppercase tracking-widest text-slate-400">Không tìm thấy khách mời</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20">
                          <tr className="bg-slate-50/95 backdrop-blur-md">
                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Khách mời</th>
                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Số ghế</th>
                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Thời gian Check-in</th>
                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-center">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {paginatedAttendees.map((attendee) => (
                            <tr
                              key={attendee.id}
                              className={`group transition-all duration-500 ${highlightedOrderId === attendee.id
                                ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500'
                                : 'hover:bg-slate-50/50'
                                }`}
                            >
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-lg shadow-inner overflow-hidden border border-slate-200 group-hover:scale-105 transition-transform">
                                    {attendee.avatarUrl ? (
                                      <img
                                        src={attendee.avatarUrl}
                                        alt={attendee.fullName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          (e.target as HTMLImageElement).parentElement!.innerText = attendee.fullName.charAt(0);
                                        }}
                                      />
                                    ) : (
                                      attendee.fullName.charAt(0)
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-sm font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">{attendee.fullName}</div>
                                    <div className="text-[10px] font-bold text-slate-500">{attendee.email}</div>
                                    <div className="text-[9px] font-black text-primary mt-1 opacity-60">ORDER: #{attendee.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                  {attendee.seats?.map((seat: any, index: number) => {
                                    const ticketColor = seat.color || '#3b82f6';
                                    return (
                                      <span
                                        key={`${seat.seatNumber}-${index}`}
                                        className="px-2.5 py-1 rounded-lg text-[9px] font-black shadow-sm text-white"
                                        style={{ backgroundColor: ticketColor }}
                                      >
                                        {seat.seatNumber}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                {attendee.checkInDate ? (
                                  <div className="flex flex-row items-baseline gap-2">
                                    <span className="text-sm font-black text-primary">
                                      {new Date(attendee.checkInDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400">
                                      {new Date(attendee.checkInDate).toLocaleDateString('vi-VN')}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 italic">Chưa check-in</span>
                                )}
                              </td>
                              <td className="px-8 py-6 text-center">
                                {attendee.checkInStatus ? (
                                  <div className="flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100 group-hover:rotate-12 transition-transform">
                                      <Icon name="done" size="sm" />
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleCheckIn(attendee.ticketId, attendee.checkInStatus)}
                                    className="px-6 py-2.5 bg-slate-900 hover:bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                                  >
                                    Check-in
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Premium Pagination */}
                    {totalGuestPages > 1 && (
                      <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Trang <span className="text-primary">{guestPage}</span> / {totalGuestPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setGuestPage(p => Math.max(1, p - 1))}
                            disabled={guestPage === 1}
                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-all disabled:opacity-30"
                          >
                            <Icon name="chevron_left" size="xs" />
                          </button>
                          <div className="flex gap-1">
                            {[...Array(totalGuestPages)].map((_, i) => {
                              const p = i + 1;
                              if (totalGuestPages > 5 && Math.abs(p - guestPage) > 1 && p !== 1 && p !== totalGuestPages) return null;
                              return (
                                <button
                                  key={p}
                                  onClick={() => setGuestPage(p)}
                                  className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${guestPage === p ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/30'}`}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setGuestPage(p => Math.min(totalGuestPages, p + 1))}
                            disabled={guestPage === totalGuestPages}
                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-all disabled:opacity-30"
                          >
                            <Icon name="chevron_right" size="xs" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Result Modal - Ported from OrganizerEventManage */}
      {scanResult && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-2">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setScanResult(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className={`p-5 ${scanResult.tickets?.every((t: any) => t.status === 'CHECKED_IN') ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'} text-white relative shrink-0`}>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Icon name={scanResult.tickets?.every((t: any) => t.status === 'CHECKED_IN') ? 'warning' : 'fact_check'} size="md" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black tracking-tight text-white">
                      {scanResult.tickets?.every((t: any) => t.status === 'CHECKED_IN') ? 'Đã Check-in' : 'Check-in Thành công'}
                    </h3>
                    <div className={`px-2 py-0.5 ${scanResult.tickets?.every((t: any) => t.status === 'CHECKED_IN') ? 'bg-amber-500' : 'bg-emerald-500'} text-white text-[8px] font-black rounded-full ${scanResult.tickets?.every((t: any) => t.status === 'CHECKED_IN') ? '' : 'animate-bounce'}`}>
                      {scanResult.tickets?.every((t: any) => t.status === 'CHECKED_IN') ? 'VERIFIED' : 'SUCCESS'}
                    </div>
                  </div>
                  <p className="text-white text-[12px] font-bold uppercase">Đơn hàng #{scanResult.id || scanResult.orderId}</p>
                </div>
              </div>
              <button
                onClick={() => setScanResult(null)}
                className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all z-20 shadow-lg shadow-red-500/20"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">

              <div className="space-y-4">
                {/* Guest Info Card - Full Width */}
                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0 overflow-hidden">
                      {scanResult.userAvatar ? (
                        <img src={scanResult.userAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="person" size="sm" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Khách hàng</p>
                      <p className="text-sm font-black text-slate-900 truncate">{scanResult.userName}</p>
                    </div>
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Liên hệ</p>
                    <p className="text-[12px] font-bold text-slate-800">{scanResult.userEmail}</p>
                  </div>
                </div>

                {/* Event & Checkin Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="event" size="xs" className="text-primary" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sự kiện</p>
                    </div>
                    <p className="text-xs font-black text-slate-900 line-clamp-1">{scanResult.eventTitle}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="history" size="xs" className="text-primary" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-in lúc</p>
                    </div>
                    <p className="text-xs font-black text-slate-900">
                      {scanResult.checkInDate ? new Date(scanResult.checkInDate).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : 'Vừa xong'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách vé</p>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-lg">{scanResult.tickets?.length || 0} VÉ</span>
                </div>
                <div className="space-y-2">
                  {scanResult.tickets?.map((ticket: any) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
                          style={{ 
                            backgroundColor: ticket.ticketTypeColor || '#3b82f6', 
                            boxShadow: `0 4px 12px ${(ticket.ticketTypeColor || '#3b82f6')}40` 
                          }}
                        >
                          <Icon name="confirmation_number" size="xs" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{ticket.ticketTypeName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">ID: #{ticket.id} • {ticket.seatNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ticket.status === 'CHECKED_IN' ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-wider border border-emerald-100">
                            <Icon name="check_circle" size="xs" />
                            ĐÃ CHECK-IN
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-wider border border-amber-100 animate-pulse">
                            CHỜ CHECK-IN
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 pt-2 shrink-0">
              <button
                onClick={() => setScanResult(null)}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
        #reader {
          border: none !important;
        }
        #reader__scan_region {
          background: #0f172a !important;
        }
        #reader video {
          object-fit: cover !important;
        }
      `}} />
    </DashboardLayout>
  )
}

export default OrganizerGuests
