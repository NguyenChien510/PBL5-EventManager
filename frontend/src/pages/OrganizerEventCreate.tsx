import { useState, useEffect, useRef } from 'react';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useLocationStore } from '../stores/useLocationStore';
import { Icon } from '../components/ui';
import { ArtistService } from '../services/artistService';
import { EventService } from '../services/eventService';

import { DashboardLayout, PageHeader } from '../components/layout';
import { Stage, Layer, Circle, Text, Group, Rect } from 'react-konva';
import { ChromePicker } from 'react-color';
import { v4 as uuidv4 } from 'uuid';
import { organizerSidebarConfig } from '../config/organizerSidebarConfig';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Sub-components for Map
function LocationPicker({ position, onPositionChange }: { position: L.LatLng | null, onPositionChange: (p: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

function MapUpdater({ center }: { center: L.LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15);
  }, [center, map]);
  return null;
}

const steps = [
  { id: 1, title: 'Thông tin cơ bản' },
  { id: 2, title: 'Thời gian & Địa điểm' },
  { id: 3, title: 'Lịch trình sự kiện' },
  { id: 4, title: 'Loại vé & Giá' },
  { id: 5, title: 'Hoàn tất' }
];

const OrganizerEventCreate = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [mapPosition, setMapPosition] = useState<L.LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([10.762622, 106.660172]); // default HCMC
  const [pendingWardName, setPendingWardName] = useState<string | null>(null);

  const { categories, fetchCategories } = useCategoryStore()
  const { provinces, fetchProvinces, wards, fetchWards } = useLocationStore()

  // Custom dropdown state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isWardOpen, setIsWardOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<any>(null);


  // Ticket & Seat Map State
  const [hasSeatMap, setHasSeatMap] = useState<boolean>(false);
  const [ticketTypes, setTicketTypes] = useState([
    { id: 1, name: 'Vé Thường', price: 500000, color: '#3b82f6', totalQuantity: 100 },
    { id: 2, name: 'Vé VIP', price: 1200000, color: '#f59e0b', totalQuantity: 50 },
  ]);
  const [seats, setSeats] = useState<{ id: string; x: number; y: number; ticketTypeId: number; label: string }[]>([]);
  const [activePaintTicketId, setActivePaintTicketId] = useState<number | null>(null);
  const [activeColorPicker, setActiveColorPicker] = useState<number | null>(null);

  // Basic Info State
  const [title, setTitle] = useState('');
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [artistQuery, setArtistQuery] = useState('');
  const [artistSuggestions, setArtistSuggestions] = useState<any[]>([]);
  const [isArtistDropdownOpen, setIsArtistDropdownOpen] = useState(false);
  const [description, setDescription] = useState('');

  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop');

  // Time State
  const [sessions, setSessions] = useState([
    { id: 1, sessionDate: '', startTime: '', endTime: '', name: 'Phiên 1' }
  ]);

  // Schedule State
  const [schedules, setSchedules] = useState([
    { id: 1, startTime: '', activity: '' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const data = await EventService.uploadImage(file);
      setPosterUrl(data.url);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Tải ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };


  // Keep wizard UX consistent: each step starts from top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  useEffect(() => {
    fetchCategories()
    fetchProvinces()
  }, [fetchCategories, fetchProvinces])

  // Smart Backend-driven Search
  useEffect(() => {
    const timer = setTimeout(() => {
      ArtistService.search(artistQuery, selectedArtists)
        .then(setArtistSuggestions)
        .catch(console.error);
    }, 300);

    return () => clearTimeout(timer);
  }, [artistQuery, selectedArtists]);



  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0])
    }
  }, [categories, selectedCategory])



  useEffect(() => {
    if (selectedProvince) {
      fetchWards(selectedProvince.id)
      setSelectedWard(null)
    }
  }, [selectedProvince, fetchWards])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const normalizeLocationName = (name: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
      .replace(/[đĐ]/g, "d")             // Special case for 'đ' and 'Đ'
      .replace(/^(tinh|thanh pho|quan|huyen|thi xa|phuong|xa|thi tran|ward|district|city|province)\s+/i, '')
      .replace(/\s+(thanh pho|tinh|quan|huyen|thi xa|phuong|xa|thi tran|ward|district|city|province)$/i, '')
      .trim();
  };

  useEffect(() => {
    if (wards.length > 0 && pendingWardName) {
      const normalizedPending = normalizeLocationName(pendingWardName);
      const matchedWard = wards.find(w => {
        const normalizedWard = normalizeLocationName(w.name);
        return normalizedPending.includes(normalizedWard) || normalizedWard.includes(normalizedPending);
      });

      if (matchedWard) {
        setSelectedWard(matchedWard);
        setPendingWardName(null);
      }
    }
  }, [wards, pendingWardName]);

  const categoryRef = useRef<HTMLDivElement>(null);
  const provinceRef = useRef<HTMLDivElement>(null);
  const wardRef = useRef<HTMLDivElement>(null);
  const artistRef = useRef<HTMLDivElement>(null);


  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
        setIsProvinceOpen(false);
      }
      if (wardRef.current && !wardRef.current.contains(event.target as Node)) {
        setIsWardOpen(false);
      }
      if (artistRef.current && !artistRef.current.contains(event.target as Node)) {
        setIsArtistDropdownOpen(false);
      }


    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addArtist = (name: string) => {
    if (name.trim() && !selectedArtists.includes(name.trim())) {
      setSelectedArtists([...selectedArtists, name.trim()]);
    }
    setArtistQuery('');
    setIsArtistDropdownOpen(false);
  };

  const removeArtist = (name: string) => {
    setSelectedArtists(selectedArtists.filter(a => a !== name));
  };


  const updateLocationDetails = (address: any) => {
    if (!address) return;

    // Extract province/city name
    const cityName = address.city || address.province || address.state || address.state_district;
    // Extract ward/suburb name
    const wardName = address.suburb || address.quarter || address.neighbourhood || address.district || address.town || address.village || address.subdistrict;

    if (cityName) {
      const normalizedCity = normalizeLocationName(cityName);
      const matchedProvince = provinces.find(p => {
        const normalizedP = normalizeLocationName(p.name);
        return normalizedCity.includes(normalizedP) || normalizedP.includes(normalizedCity);
      });

      if (matchedProvince) {
        setSelectedProvince(matchedProvince);
        if (wardName) {
          setPendingWardName(wardName);
        }
      }
    }
  };

  const searchLocation = async () => {
    if (!searchQuery) return;
    try {
      const query = searchQuery;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const { lat, lon } = first;
        const newPos = new L.LatLng(parseFloat(lat), parseFloat(lon));
        setMapPosition(newPos);
        setMapCenter(newPos);

        if (first.address) {
          updateLocationDetails(first.address);
        }
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  const handleMapClick = async (latlng: L.LatLng) => {
    setMapPosition(latlng);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        setSearchQuery(data.display_name);
        if (data.address) {
          updateLocationDetails(data.address);
        }
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    }
  };

  const getNextSeatLabel = (ticketTypeId: number) => {
    const count = seats.filter(s => s.ticketTypeId === ticketTypeId).length + 1;
    const tt = ticketTypes.find(t => t.id === ticketTypeId);
    const prefix = tt ? tt.name.substring(0,1).toUpperCase() : 'S';
    return `${prefix}${count}`;
  };

  const getRowLetter = (index: number) => {
    let row = "";
    let i = index - 1;
    while (i >= 0) {
      row = String.fromCharCode(65 + (i % 26)) + row;
      i = Math.floor(i / 26) - 1;
    }
    return row;
  };

  const handleCreateEvent = async () => {
    try {
      if (!title.trim()) {
        alert("Vui lòng nhập tên sự kiện");
        setCurrentStep(1);
        return;
      }
      if (!selectedCategory?.id) {
        alert("Vui lòng chọn thể loại");
        setCurrentStep(1);
        return;
      }
      if (!description.trim()) {
        alert("Vui lòng nhập mô tả chi tiết");
        setCurrentStep(1);
        return;
      }
      if (!selectedProvince?.id) {
        alert("Vui lòng chọn Tỉnh / Thành phố");
        setCurrentStep(2);
        return;
      }
      if (sessions.length === 0 || sessions.some(s => !s.sessionDate || !s.startTime || !s.endTime)) {
        alert("Vui lòng điền đầy đủ thông tin các phiên diễn");
        setCurrentStep(2);
        return;
      }
      if (schedules.some(s => !s.startTime || !s.activity.trim())) {
        alert("Vui lòng điền đầy đủ thông tin lịch trình sự kiện");
        setCurrentStep(2);
        return;
      }
      if (ticketTypes.length === 0 || ticketTypes.some(t => !t.name?.trim())) {
        alert("Vui lòng tạo ít nhất 1 hạng vé hợp lệ");
        setCurrentStep(3);
        return;
      }

      const payload = {
        title,
        categoryId: selectedCategory?.id,
        artists: selectedArtists,
        description,

        location: searchQuery,
        provinceId: selectedProvince?.id,
        wardId: selectedWard?.id,
        posterUrl,
        sessions: sessions.map(s => ({
          sessionDate: s.sessionDate,
          startTime: s.startTime,
          endTime: s.endTime,
          name: s.name
        })),
        schedules: schedules.map(s => ({
          startTime: s.startTime + ':00', // ensure HH:mm:ss for backend
          activity: s.activity
        })),
        ticketTypes: ticketTypes.map(t => ({
          name: t.name,
          price: t.price,
          totalQuantity: hasSeatMap ? seats.filter(s => s.ticketTypeId === t.id).length : t.totalQuantity,
          color: t.color
        })),
        hasSeatMap,
        seatMapConfig: hasSeatMap ? {
          seats: seats.map(s => ({
            x: s.x,
            y: s.y,
            ticketTypeName: ticketTypes.find(t => t.id === s.ticketTypeId)?.name || ticketTypes[0].name,
            seatNumber: s.label
          }))
        } : null
      };

      setIsSubmitting(true);
      const data = await EventService.createEvent(payload);
      console.log('Event created successfully:', data);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert("Lỗi: " + (err instanceof Error ? err.message : "Không thể tạo sự kiện"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const getStepColor = () => {
    return {
      border: 'focus:border-blue-400',
      ring: 'focus:ring-blue-100/60',
      text: 'text-blue-600',
      bg: 'bg-blue-50/50',
      gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600'
    };
  };

  const stepColor = getStepColor();
  const smoothFieldClass = `w-full px-4 py-3 bg-slate-50 border border-slate-200 outline-none transition-all rounded-xl shadow-sm ${stepColor.border} focus:ring-4 ${stepColor.ring}`;
  const smoothDropdownClass = `w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-left outline-none transition-all ${stepColor.border} focus:ring-4 ${stepColor.ring}`;

  const compactProgressBar = (
    <div className="flex items-center gap-2 w-full max-w-2xl">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none group">
            <div className="flex flex-col items-center relative">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-500 ${isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-110'
                  : isCompleted
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}
              >
                {isCompleted ? <Icon name="check" size="xs" /> : step.id}
              </div>
              <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-tight transition-all duration-300 w-max ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1.5 rounded-full transition-all duration-700 ${isCompleted ? 'bg-blue-600' : 'bg-slate-100'}`} />
            )}
          </div>
        )
      })}
    </div>
  );


  return (
    <DashboardLayout sidebarProps={organizerSidebarConfig}>
      <PageHeader
        title="Tạo Sự Kiện Mới"
        breadcrumb={['Sự kiện', 'Tạo sự kiện mới']}
        centerContent={compactProgressBar}
        backTo="/organizer/events"
      />

      <div className={`p-6 mx-auto transition-all duration-500 ${currentStep === 1 ? 'max-w-5xl' :
        currentStep === 4 ? 'max-w-[1700px]' :
          'max-w-7xl'
        }`}>





        {isSubmitted ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-16 text-center animate-in fade-in zoom-in-95 duration-700 ease-out fill-mode-both">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border border-green-100 animate-bounce">
                <Icon name="check" className="text-green-500 text-[50px]" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Chúc mừng! Sự kiện đã được đăng</h2>
            <p className="text-slate-500 max-w-xl mx-auto mb-12 text-lg font-medium leading-relaxed">
              Sự kiện của bạn đã được gửi thành công và đang được chuyển tới ban quản trị để phê duyệt.
              Bạn có thể theo dõi trạng thái tại bảng điều khiển.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/25"
              >
                Tạo thêm sự kiện mới
              </button>
              <button
                onClick={() => window.location.href = '/organizer/dashboard'}
                className="w-full sm:w-auto px-10 py-4 bg-slate-50 text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-200"
              >
                Về bảng điều khiển
              </button>
            </div>
          </div>
        ) : (
          <>


            {/* Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 min-h-[400px]">

              {currentStep === 1 && (
                <div className="space-y-4 w-full animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
                  <h2 className={`text-xl font-extrabold mb-4 ${stepColor.text}`}>Thông tin sự kiện</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">



                    <div className="space-y-4 w-full">


                      <div>
                        <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Tên sự kiện *</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên sự kiện..." className={smoothFieldClass} />
                      </div>
                      <div>
                        <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Thể loại *</label>

                        <div className="relative" ref={categoryRef}>
                          <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className={smoothDropdownClass}>
                            <span className="font-semibold text-slate-700">{selectedCategory?.name || 'Chọn thể loại'}</span>
                            <Icon name={isCategoryOpen ? "expand_less" : "expand_more"} className="text-slate-400" />
                          </button>
                          {isCategoryOpen && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 shadow-sky-900/10">
                              {categories.map((cat) => (
                                <button
                                  key={cat.id}
                                  onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }}
                                  className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 border-l-4 mb-1 last:mb-0 ${selectedCategory?.id === cat.id
                                    ? 'font-bold shadow-sm'
                                    : 'hover:translate-x-1'
                                    }`}
                                  style={{
                                    borderLeftColor: cat.color || '#cbd5e1',
                                    backgroundColor: selectedCategory?.id === cat.id ? `${cat.color}20` : `${cat.color}08`, // 12% and 3% opacity approx
                                    color: cat.color || '#475569'
                                  }}
                                >
                                  <span className="font-semibold">{cat.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                      <div>
                        <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Nghệ sĩ biểu diễn (Multi-Tag Selection)</label>
                        <div className="relative" ref={artistRef}>

                          <div className={`flex flex-wrap gap-2 p-2 min-h-[50px] max-h-32 overflow-y-auto w-full px-4 py-3 bg-slate-50 border border-slate-200 outline-none transition-all rounded-xl shadow-sm ${stepColor.border} focus:ring-4 ${stepColor.ring}`}>
                            {selectedArtists.map((artist) => (
                              <span key={artist} className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${stepColor.bg} ${stepColor.text} text-[11px] font-bold rounded-lg border border-current/20 animate-in zoom-in-95 duration-200 h-fit`}>
                                {artist}
                                <button type="button" onClick={() => removeArtist(artist)} className="hover:text-red-500 transition-colors flex items-center">
                                  <Icon name="close" size="xs" />
                                </button>
                              </span>
                            ))}

                            <input
                              type="text"
                              value={artistQuery}
                              onFocus={() => setIsArtistDropdownOpen(true)}
                              onChange={(e) => setArtistQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addArtist(artistQuery);
                                }
                              }}
                              placeholder={selectedArtists.length === 0 ? "Tìm kiếm hoặc nhập nghệ sĩ..." : ""}
                              className="flex-1 bg-transparent border-none outline-none text-sm min-w-[140px] self-center"
                            />
                          </div>


                          {isArtistDropdownOpen && (

                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 shadow-sky-900/10 max-h-48 overflow-y-auto">
                              {artistSuggestions.length > 0 ? (
                                artistSuggestions.map(a => (
                                  <button
                                    key={a.id}
                                    onClick={() => addArtist(a.name)}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 font-medium text-slate-600 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <img src={a.avatar} alt={a.name} className="w-6 h-6 rounded-full object-cover" />
                                      {a.name}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                !artistQuery && <div className="px-4 py-2.5 text-xs text-slate-400 italic">Bắt đầu nhập để tìm kiếm nghệ sĩ...</div>
                              )}

                              <button
                                onClick={() => addArtist(artistQuery)}
                                className="w-full text-left px-4 py-2.5 text-xs italic text-primary hover:bg-primary/5 font-bold transition-colors border-t border-slate-50"
                              >
                                + Thêm nghệ sĩ mới: "{artistQuery}"
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Mô tả chi tiết *</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả trải nghiệm sự kiện..." className={`${smoothFieldClass} min-h-[120px]`} />

                      </div>

                    </div>
                    <div className="flex flex-col">
                      <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Ảnh bìa (Cover Image)</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400/50 hover:bg-blue-50/10 transition-all group min-h-[220px] overflow-hidden relative ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />

                        {isUploading ? (
                          <div className="flex flex-col items-center">
                            <Icon name="sync" className="text-primary text-3xl animate-spin mb-2" />
                            <p className="text-sm font-bold text-slate-500">Đang tải lên...</p>
                          </div>
                        ) : posterUrl ? (
                          <img src={posterUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                              <Icon name="cloud_upload" className="text-primary text-3xl" />
                            </div>
                            <p className="text-base font-bold text-slate-700 mb-1">Tải ảnh sự kiện lên</p>
                            <p className="text-sm font-medium text-slate-400">PNG, JPG (Tối đa 5MB) - Tỉ lệ 16:9</p>
                          </>
                        )}
                      </div>
                      <input type="text" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="Hoặc dán URL ảnh bìa tại đây..." className={`mt-4 text-xs ${smoothFieldClass}`} />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 w-full animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
                  <h2 className={`text-2xl font-extrabold mb-2 ${stepColor.text}`}>Thời gian & Địa điểm</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">



                    {/* Left Column: Sessions */}
                    <div className="lg:col-span-4 space-y-5">



                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Phiên diễn sự kiện</h3>
                        <button
                          onClick={() => {
                            const firstSession = sessions[0];
                            setSessions([...sessions, {
                              id: Date.now(),
                              sessionDate: '',
                              startTime: firstSession ? firstSession.startTime : '',
                              endTime: firstSession ? firstSession.endTime : '',
                              name: `Phiên ${sessions.length + 1}`
                            }]);
                          }}
                          className={`px-4 py-2 ${stepColor.gradient} text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5 text-sm shadow-md shadow-blue-200/50`}
                        >
                          <Icon name="add" size="xs" />
                        </button>


                      </div>
                      <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                        {sessions.map((session, index) => (
                          <div key={session.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group hover:border-primary/20 transition-colors">
                            <div className="space-y-3">

                              <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">{session.name} - Ngày diễn ra</label>
                                <input type="date" value={session.sessionDate} onChange={(e) => { const newSessions = [...sessions]; newSessions[index].sessionDate = e.target.value; setSessions(newSessions); }} className={smoothFieldClass} />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Bắt đầu</label><input type="time" value={session.startTime} onChange={(e) => { const newSessions = [...sessions]; newSessions[index].startTime = e.target.value; setSessions(newSessions); }} className={`${smoothFieldClass} px-2.5`} /></div>
                                <div><label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Kết thúc</label><input type="time" value={session.endTime} onChange={(e) => { const newSessions = [...sessions]; newSessions[index].endTime = e.target.value; setSessions(newSessions); }} className={`${smoothFieldClass} px-2.5`} /></div>
                              </div>

                            </div>
                            {sessions.length > 1 && <button onClick={() => setSessions(sessions.filter(s => s.id !== session.id))} className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-200 text-red-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm opacity-0 group-hover:opacity-100"><Icon name="close" size="xs" /></button>}
                          </div>
                        ))}
                      </div>
                    </div>




                    {/* Right Column: Location & Map */}
                    <div className="lg:col-span-6 space-y-6 pt-1">



                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Tỉnh / Thành phố *</label>
                          <div className="relative" ref={provinceRef}>

                            <button onClick={() => setIsProvinceOpen(!isProvinceOpen)} className={smoothDropdownClass}>
                              <span className="font-semibold text-slate-700">{selectedProvince?.name || 'Chọn tỉnh thành'}</span>
                              <Icon name={isProvinceOpen ? "expand_less" : "expand_more"} className="text-slate-400" />
                            </button>
                            {isProvinceOpen && (
                              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto shadow-sky-900/10">
                                {provinces.map((p) => (<button key={p.id} onClick={() => { setSelectedProvince(p); setIsProvinceOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedProvince?.id === p.id ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}>{p.name}</button>))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Quận / Huyện *</label>
                          <div className="relative" ref={wardRef}>
                            <button onClick={() => setIsWardOpen(!isWardOpen)} disabled={!selectedProvince} className={`${smoothDropdownClass} disabled:opacity-50`}>
                              <span className="font-semibold text-slate-700">{selectedWard?.name || 'Chọn quận huyện'}</span>
                              <Icon name={isWardOpen ? "expand_less" : "expand_more"} className="text-slate-400" />
                            </button>
                            {isWardOpen && (
                              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto shadow-sky-900/10">
                                {wards.map((w) => (<button key={w.id} onClick={() => { setSelectedWard(w); setIsWardOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedWard?.id === w.id ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}>{w.name}</button>))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Tìm kiếm hoặc nhấn chọn vị trí trên bản đồ *</label>
                        <div className="relative flex gap-2">
                          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchLocation()} placeholder="Nhập địa chỉ hoặc tên địa điểm..." className={smoothFieldClass} />
                          <button onClick={searchLocation} className={`px-6 ${stepColor.gradient} text-white rounded-xl font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-blue-200/50`}>
                            <Icon name="search" size="sm" />
                          </button>
                        </div>
                        <div className="w-full h-[320px] bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200 relative z-0 shadow-sm mt-4">

                          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
                            <TileLayer
                              url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                            />
                            <MapUpdater center={mapCenter} />
                            <LocationPicker position={mapPosition} onPositionChange={handleMapClick} />
                          </MapContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className={`text-2xl font-extrabold ${stepColor.text}`}>Lịch trình sự kiện</h2>
                      <p className="text-sm text-slate-500 font-medium">Chi tiết các hoạt động diễn ra trong cùng một sự kiện</p>
                    </div>
                    <button onClick={() => setSchedules([...schedules, { id: Date.now(), startTime: '', activity: '' }])} className={`px-5 py-2.5 ${stepColor.gradient} text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2 text-sm shadow-md shadow-blue-200/50`}>
                      <Icon name="add" size="sm" /> Thêm hoạt động
                    </button>

                  </div>
                  <div className="space-y-4">
                    {schedules.map((sched, index) => (
                      <div key={sched.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group flex flex-col md:flex-row gap-10 items-start md:items-center">


                        <div className="w-full md:w-48 shrink-0">
                          <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Thời gian</label>
                          <input type="time" value={sched.startTime} onChange={(e) => { const newSchedules = [...schedules]; newSchedules[index].startTime = e.target.value; setSchedules(newSchedules); }} className={smoothFieldClass + " py-2"} />
                        </div>

                        <div className="flex-1 w-full relative">
                          <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Hoạt động</label>
                          <input type="text" placeholder="VD: Đón khách và Check-in..." value={sched.activity} onChange={(e) => { const newSchedules = [...schedules]; newSchedules[index].activity = e.target.value; setSchedules(newSchedules); }} className={smoothFieldClass + " py-2 pr-10"} />
                        </div>
                        {schedules.length > 1 && <button onClick={() => setSchedules(schedules.filter(s => s.id !== sched.id))} className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-200 text-red-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm opacity-0 group-hover:opacity-100"><Icon name="close" size="sm" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
                  
                  {/* EVENT TYPE SELECTION */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner shadow-blue-200/50">
                        <Icon name="settings" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-extrabold ${stepColor.text}`}>Loại Hình Sự Kiện</h3>
                        <p className="text-sm font-medium text-slate-500">Lựa chọn hình thức bán vé cho sự kiện của bạn</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button
                        type="button"
                        onClick={() => { setHasSeatMap(false); setActivePaintTicketId(null); }}
                        className={`relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${!hasSeatMap ? 'border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/10' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'}`}
                      >
                        {!hasSeatMap && <div className="absolute top-3 right-3 text-blue-600"><Icon name="check_circle" /></div>}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${!hasSeatMap ? 'bg-blue-600 text-white rotate-6' : 'bg-slate-100 text-slate-500 group-hover:scale-110'}`}>
                          <Icon name="confirmation_number" size="md" />
                        </div>
                        <h4 className={`font-bold text-lg mb-2 ${!hasSeatMap ? 'text-slate-900' : 'text-slate-700'}`}>Vào cửa tự do (General Admission)</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">Phù hợp cho Workshop, Đêm nhạc, Triển lãm... Khách mua vé theo số lượng, không cần chọn ghế trước.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setHasSeatMap(true); if (ticketTypes.length > 0) setActivePaintTicketId(ticketTypes[0].id); }}
                        className={`relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${hasSeatMap ? 'border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/10' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'}`}
                      >
                        {hasSeatMap && <div className="absolute top-3 right-3 text-blue-600"><Icon name="check_circle" /></div>}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${hasSeatMap ? 'bg-blue-600 text-white rotate-6' : 'bg-slate-100 text-slate-500 group-hover:scale-110'}`}>
                          <Icon name="event_seat" size="md" />
                        </div>
                        <h4 className={`font-bold text-lg mb-2 ${hasSeatMap ? 'text-slate-900' : 'text-slate-700'}`}>Sắp xếp chỗ ngồi (Seat Map)</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">Phù hợp cho Nhà hát, Liveshow, Hội trường lớn... Tự tay thiết kế sơ đồ để khách chọn chính xác ghế ngồi.</p>
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  {/* TICKET TYPES */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className={`text-2xl font-extrabold ${stepColor.text}`}>1. Các hạng vé</h2>
                        <p className="text-sm text-slate-500 font-medium">Thiết lập tên, giá tiền và màu sắc nhận diện cho từng hạng vé</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => { 
                          const newId = Math.max(...ticketTypes.map(t => t.id), 0) + 1; 
                          setTicketTypes([...ticketTypes, { id: newId, name: 'Loại vé mới', price: 0, color: '#94a3b8', totalQuantity: 0 }]); 
                        }} 
                        className={`px-5 py-2.5 ${stepColor.gradient} text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2 text-sm shadow-md shadow-blue-200/50`}
                      >
                        <Icon name="add" size="sm" /> Thêm hạng vé
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {ticketTypes.map((ticket, index) => (
                        <div key={ticket.id} className="flex flex-col md:flex-row items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative group hover:border-blue-200 transition-colors">
                          
                          {/* Color Picker */}
                          <div className="relative shrink-0">
                            <button 
                              type="button"
                              onClick={() => setActiveColorPicker(activeColorPicker === ticket.id ? null : ticket.id)}
                              className="w-14 h-14 rounded-2xl shadow-md flex items-center justify-center cursor-pointer hover:scale-105 transition-transform group"
                              style={{ backgroundColor: ticket.color }}
                            >
                              <Icon name="palette" className="text-white/80 mix-blend-difference opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            {activeColorPicker === ticket.id && (
                              <div className="absolute z-50 top-full mt-2 left-0">
                                <div className="fixed inset-0 z-10" onClick={() => setActiveColorPicker(null)} />
                                <div className="relative z-20 bg-white rounded-xl shadow-2xl p-2 border border-slate-100">
                                  <ChromePicker 
                                    color={ticket.color} 
                                    onChange={(color) => {
                                      const newTypes = [...ticketTypes];
                                      newTypes[index].color = color.hex;
                                      setTicketTypes(newTypes);
                                    }} 
                                    disableAlpha={true}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Tên hạng vé</label>
                              <input
                                value={ticket.name}
                                onChange={(e) => { const newTypes = [...ticketTypes]; newTypes[index].name = e.target.value; setTicketTypes(newTypes); }}
                                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all ${stepColor.border} focus:ring-4 ${stepColor.ring}`}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Giá vé (VNĐ)</label>
                              <input
                                type="number"
                                value={ticket.price}
                                onChange={(e) => { const newTypes = [...ticketTypes]; newTypes[index].price = parseInt(e.target.value) || 0; setTicketTypes(newTypes); }}
                                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all ${stepColor.border} focus:ring-4 ${stepColor.ring}`}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">
                                {hasSeatMap ? 'Số lượng (Đã đặt trên sơ đồ)' : 'Tổng số lượng bán'}
                              </label>
                              {hasSeatMap ? (
                                <div className="py-2 px-4 bg-blue-50 text-blue-600 font-black text-lg rounded-xl border border-blue-100 flex items-center gap-2">
                                  <Icon name="event_seat" size="xs" />
                                  {seats.filter(s => s.ticketTypeId === ticket.id).length}
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  value={ticket.totalQuantity}
                                  onChange={(e) => { const newTypes = [...ticketTypes]; newTypes[index].totalQuantity = parseInt(e.target.value) || 0; setTicketTypes(newTypes); }}
                                  className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all ${stepColor.border} focus:ring-4 ${stepColor.ring}`}
                                />
                              )}
                            </div>
                          </div>
                          <button type="button" disabled={ticketTypes.length <= 1} onClick={() => {
                            setTicketTypes(ticketTypes.filter(t => t.id !== ticket.id));
                            setSeats(seats.filter(s => s.ticketTypeId !== ticket.id));
                          }} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0 disabled:opacity-30"><Icon name="delete" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEAT MAP EDITOR - SHOW ONLY IF hasSeatMap IS TRUE */}
                  {hasSeatMap && (
                    <>
                      <div className="h-px bg-slate-100 w-full" />
                      <div className="space-y-6">
                        <div>
                          <h2 className={`text-2xl font-extrabold mb-1 ${stepColor.text}`}>2. Thiết kế sơ đồ chỗ ngồi</h2>
                          <p className="text-sm text-slate-500 font-medium">Click chuột vào bảng vẽ để đặt ghế, hoặc bấm để xóa ghế.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                          {/* Sidebar Tools */}
                          <div className="space-y-6">
                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                              <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Icon name="brush" size="xs" /> Bút vẽ ghế
                              </h4>
                              <div className="space-y-2">
                                {ticketTypes.map(tt => (
                                  <button
                                    key={tt.id}
                                    type="button"
                                    onClick={() => setActivePaintTicketId(tt.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${activePaintTicketId === tt.id ? 'border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-100' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                                  >
                                    <div className="w-5 h-5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: tt.color }} />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-bold truncate ${activePaintTicketId === tt.id ? 'text-blue-900' : 'text-slate-700'}`}>{tt.name}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">Đã đặt: {seats.filter(s => s.ticketTypeId === tt.id).length}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-slate-600">Tổng số ghế:</span>
                                <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{seats.length}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => { if(window.confirm("Xóa toàn bộ ghế?")) setSeats([]) }}
                                className="w-full py-2.5 bg-red-50 text-red-500 hover:bg-red-100 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <Icon name="delete_forever" size="sm" /> Xóa toàn bộ
                              </button>
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 flex gap-2 font-medium">
                              <Icon name="info" size="xs" className="shrink-0" />
                              <div>
                                <strong className="block mb-0.5">Tips:</strong>
                                - Click lên khung canvas để đặt ghế mới.<br/>
                                - Click vào ghế đã có để xóa ghế đó.<br/>
                                - Ghế có thể di chuyển bằng cách kéo thả.
                              </div>
                            </div>
                          </div>

                          {/* Konva Canvas Area */}
                          <div className="lg:col-span-3 relative bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col items-center shadow-2xl border-8 border-slate-800 group">
                            {/* STAGE INDICATOR */}
                            <div className="w-full py-3 bg-slate-800/50 backdrop-blur-sm flex justify-center relative z-10 border-b border-slate-700/50">
                              <div className="bg-slate-700 text-slate-300 px-12 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.3em] border border-slate-600/50 shadow-inner">
                                Sân Khấu / Stage
                              </div>
                            </div>
                            
                            <div className="relative w-full bg-slate-900 aspect-[4/3] lg:aspect-video max-h-[600px] overflow-hidden cursor-crosshair">
                              <Stage 
                                width={800} 
                                height={500} 
                                className="bg-[#0f172a]"
                                onMouseDown={(e) => {
                                  // Check if click on empty area of Stage
                                  const clickedOnEmpty = e.target === e.target.getStage();
                                  if (clickedOnEmpty && activePaintTicketId) {
                                    const stage = e.target.getStage();
                                    const pos = stage?.getRelativePointerPosition();
                                    if(pos) {
                                      const label = getNextSeatLabel(activePaintTicketId);
                                      setSeats([...seats, { 
                                        id: uuidv4(), 
                                        x: pos.x, 
                                        y: pos.y, 
                                        ticketTypeId: activePaintTicketId,
                                        label: label
                                      }]);
                                    }
                                  }
                                }}
                              >
                                <Layer>
                                  {/* Grid helpers (optional but looks nice) */}
                                  {Array.from({length: 20}).map((_, i) => (
                                    <Rect key={'v'+i} x={i * 40} y={0} width={1} height={500} fill="#1e293b" opacity={0.3} />
                                  ))}
                                  {Array.from({length: 15}).map((_, i) => (
                                    <Rect key={'h'+i} x={0} y={i * 40} width={800} height={1} fill="#1e293b" opacity={0.3} />
                                  ))}

                                  {/* Render Seats */}
                                  {seats.map((seat) => {
                                    const tt = ticketTypes.find(t => t.id === seat.ticketTypeId);
                                    const color = tt ? tt.color : '#ccc';
                                    
                                    return (
                                      <Group 
                                        key={seat.id} 
                                        x={seat.x} 
                                        y={seat.y} 
                                        draggable
                                        onDragEnd={(e) => {
                                          const newSeats = seats.map(s => 
                                            s.id === seat.id ? { ...s, x: e.target.x(), y: e.target.y() } : s
                                          );
                                          setSeats(newSeats);
                                        }}
                                        onClick={(e) => {
                                          // Prevent Stage mousedown event triggering add
                                          e.cancelBubble = true;
                                          // Click removes the seat
                                          setSeats(seats.filter(s => s.id !== seat.id));
                                        }}
                                      >
                                        <Circle
                                          radius={14}
                                          fill={color}
                                          shadowBlur={5}
                                          shadowColor="#000"
                                          shadowOpacity={0.3}
                                          stroke="#fff"
                                          strokeWidth={1.5}
                                        />
                                        <Text 
                                          text={seat.label} 
                                          fontSize={10} 
                                          fontStyle="bold"
                                          fill="#fff" 
                                          align="center" 
                                          verticalAlign="middle" 
                                          offsetX={seat.label.length > 2 ? 7 : 5}
                                          offsetY={5}
                                        />
                                      </Group>
                                    );
                                  })}
                                </Layer>
                              </Stage>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {currentStep === 5 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both max-w-2xl mx-auto text-center py-8">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon name="check_circle" className="text-green-500 text-[45px]" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900">Hoàn tất thiết lập!</h2>
                  <p className="text-slate-500">Sự kiện của bạn đã sẵn sàng. Hãy nhấn nút "Tạo sự kiện" bên dưới để gửi lên ban quản trị phê duyệt.</p>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button onClick={prevStep} disabled={currentStep === 1} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all flex items-center gap-2">
                <Icon name="arrow_back" size="sm" /> Quay lại
              </button>
              <div className="flex gap-3">
                {currentStep < 5 ? (
                  <button onClick={nextStep} className={`px-8 py-3 ${stepColor.gradient} text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-blue-200/50 flex items-center gap-2`}> Tiếp tục <Icon name="arrow_forward" size="sm" /> </button>
                ) : (
                  <button onClick={handleCreateEvent} disabled={isSubmitting} className={`px-8 py-3 ${stepColor.gradient} text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-blue-200/50 flex items-center gap-2 disabled:opacity-50`}>
                    <Icon name={isSubmitting ? "sync" : "publish"} size="sm" className={isSubmitting ? "animate-spin" : ""} /> {isSubmitting ? "Đang xử lý..." : "Tạo sự kiện"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrganizerEventCreate;
