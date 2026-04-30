import { useState, useEffect, useRef } from 'react';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useLocationStore } from '../stores/useLocationStore';
import { Icon } from '../components/ui';
import { ArtistService } from '../services/artistService';
import { EventService } from '../services/eventService';

import { DashboardLayout, PageHeader } from '../components/layout';
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
  const [activeRowDropdown, setActiveRowDropdown] = useState<number | null>(null);

  // Ticket & Seat Map State
  const [ticketTypes, setTicketTypes] = useState([
    { id: 1, name: 'Vé Thường', price: 500000, color: 'bg-blue-500', totalQuantity: 100 },
    { id: 2, name: 'Vé VIP', price: 1200000, color: 'bg-amber-500', totalQuantity: 50 },
  ]);
  const [rowCount, setRowCount] = useState(5);
  const [seatsPerRow, setSeatsPerRow] = useState(10);
  const [rowAssignments, setRowAssignments] = useState<Record<number, number>>({
    1: 2, 2: 1, 3: 1, 4: 1, 5: 1
  });

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

  // Keep row assignments valid when row count / ticket types change
  useEffect(() => {
    if (ticketTypes.length === 0) {
      setRowAssignments({});
      return;
    }

    const defaultTicketTypeId = ticketTypes[0].id;
    const validTicketTypeIds = new Set(ticketTypes.map(t => t.id));
    const nextAssignments: Record<number, number> = {};

    for (let i = 1; i <= rowCount; i++) {
      const current = rowAssignments[i];
      nextAssignments[i] = current && validTicketTypeIds.has(current)
        ? current
        : defaultTicketTypeId;
    }

    const hasChanged =
      Object.keys(nextAssignments).length !== Object.keys(rowAssignments).length ||
      Object.entries(nextAssignments).some(([k, v]) => rowAssignments[Number(k)] !== v);

    if (hasChanged) {
      setRowAssignments(nextAssignments);
    }
  }, [rowCount, ticketTypes, rowAssignments]);

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

      if (!target.closest('[data-row-assignment-dropdown="true"]')) {
        setActiveRowDropdown(null);
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
          totalQuantity: Object.values(rowAssignments).filter(ttId => ttId === t.id).length * seatsPerRow
        })),
        seatMapConfig: {
          rows: rowCount,
          seatsPerRow,
          rowAssignments: Array.from({ length: rowCount }, (_, i) => i + 1).map(rowIdx => ({
            rowIndex: rowIdx,
            ticketTypeName: ticketTypes.find(t => t.id === rowAssignments[rowIdx])?.name || ticketTypes[0].name
          }))
        }
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
                  <div className="flex items-center justify-between">
                    <div><h2 className={`text-2xl font-extrabold ${stepColor.text}`}>1. Các loại vé</h2><p className="text-sm text-slate-500 font-medium">Định nghĩa các hạng vé và mức giá của bạn</p></div>
                    <button onClick={() => { const newId = Math.max(...ticketTypes.map(t => t.id), 0) + 1; setTicketTypes([...ticketTypes, { id: newId, name: 'Loại vé mới', price: 0, color: 'bg-slate-500', totalQuantity: 0 }]); }} className={`px-5 py-2.5 ${stepColor.gradient} text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2 text-sm shadow-md shadow-blue-200/50`}><Icon name="add" size="sm" /> Thêm hạng vé</button>

                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {ticketTypes.map((ticket, index) => (
                      <div key={ticket.id} className="flex flex-col md:flex-row items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl group hover:border-primary/30 transition-shadow hover:shadow-md">
                        <div className={`w-12 h-12 rounded-xl ${ticket.color} shadow-sm flex items-center justify-center shrink-0`}><Icon name="local_activity" className="text-white" /></div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Tên hạng vé</label>
                            <input
                              value={ticket.name}
                              onChange={(e) => { const newTypes = [...ticketTypes]; newTypes[index].name = e.target.value; setTicketTypes(newTypes); }}
                              className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none transition-all ${stepColor.border} focus:ring-2 ${stepColor.ring}`}
                            />

                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Giá vé (VNĐ)</label>
                            <input
                              type="number"
                              value={ticket.price}
                              onChange={(e) => { const newTypes = [...ticketTypes]; newTypes[index].price = parseInt(e.target.value) || 0; setTicketTypes(newTypes); }}
                              className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none transition-all ${stepColor.border} focus:ring-2 ${stepColor.ring}`}
                            />

                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Số lượng (Từ sơ đồ)</label>
                            <div className="py-1 font-bold text-cyan-600">
                              {Object.values(rowAssignments).filter(ttId => ttId === ticket.id).length * seatsPerRow}
                            </div>
                          </div>
                        </div>
                        <button disabled={ticketTypes.length <= 1} onClick={() => setTicketTypes(ticketTypes.filter(t => t.id !== ticket.id))} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0 disabled:opacity-30"><Icon name="delete" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-slate-100 w-full" />
                  <div className="space-y-8">
                    <div><h2 className={`text-2xl font-extrabold mb-1 ${stepColor.text}`}>2. Cấu hình sơ đồ ghế</h2><p className="text-sm text-slate-500 font-medium">Thiết lập số hàng, số ghế và gán hạng vé cho từng khu vực</p></div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-4 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Số hàng</label><input type="number" min="1" max="26" value={rowCount} onChange={(e) => setRowCount(parseInt(e.target.value) || 1)} className={smoothFieldClass} /></div>
                          <div><label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Ghế mỗi hàng</label><input type="number" min="1" max="50" value={seatsPerRow} onChange={(e) => setSeatsPerRow(parseInt(e.target.value) || 1)} className={smoothFieldClass} /></div>
                        </div>
                        <div className="space-y-3">
                          <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Gán hạng vé theo hàng</label>

                          <div className="max-h-[300px] pr-2 space-y-2 custom-scrollbar overflow-y-auto pb-4">
                            {Array.from({ length: rowCount }, (_, i) => i + 1).map(rowIdx => {
                              const shouldFlipUp = rowCount > 3 && rowIdx >= rowCount - 2;
                              return (
                                <div key={rowIdx} className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 relative ${activeRowDropdown === rowIdx ? 'z-50' : 'z-10'}`}>
                                  <span className={`w-8 h-8 flex items-center justify-center bg-white rounded-lg text-xs font-black shadow-sm border ${activeRowDropdown === rowIdx ? 'border-primary text-primary' : 'border-slate-100 text-slate-700'}`}>{getRowLetter(rowIdx)}</span>
                                  <div className="relative flex-1" data-row-assignment-dropdown="true">
                                    <button
                                      type="button"
                                      onClick={() => setActiveRowDropdown(activeRowDropdown === rowIdx ? null : rowIdx)}
                                      className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all shadow-sm ${activeRowDropdown === rowIdx ? `bg-white ${stepColor.border.replace('focus:', '')} ring-4 ${stepColor.ring} text-slate-800` : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                    >
                                      <span>
                                        {ticketTypes.find(t => t.id === (rowAssignments[rowIdx] || ticketTypes[0].id))?.name || 'Chọn hạng vé'}
                                      </span>
                                      <Icon name={activeRowDropdown === rowIdx ? "expand_less" : "expand_more"} className={activeRowDropdown === rowIdx ? `${stepColor.text}` : 'text-slate-400'} />
                                    </button>

                                    {activeRowDropdown === rowIdx && (
                                      <div className={`absolute z-[100] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in duration-200 ${shouldFlipUp ? 'bottom-[calc(100%+8px)] slide-in-from-bottom-2' : 'top-[calc(100%+8px)] slide-in-from-top-2'}`}>
                                        {ticketTypes.map(t => (
                                          <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                              setRowAssignments({ ...rowAssignments, [rowIdx]: t.id });
                                              setActiveRowDropdown(null);
                                            }}
                                            className={`w-full flex justify-between items-center px-4 py-2.5 text-sm transition-colors ${(rowAssignments[rowIdx] || ticketTypes[0].id) === t.id
                                              ? 'bg-slate-50 text-slate-900 font-bold'
                                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                              }`}
                                          >
                                            <span>{t.name}</span>
                                            {(rowAssignments[rowIdx] || ticketTypes[0].id) === t.id && (
                                              <Icon name="check" size="sm" className={stepColor.text} />
                                            )}

                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="lg:col-span-8 bg-slate-900 rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col items-center">
                        <div className="w-full h-2 bg-slate-700 rounded-full mb-12 relative"><div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sân Khấu / Stage</div></div>
                        <div className="w-full overflow-auto max-h-[400px] p-4 flex flex-col items-center gap-2 custom-scrollbar">
                          {Array.from({ length: rowCount }, (_, i) => i + 1).map(rowIdx => {
                            const ttId = rowAssignments[rowIdx] || ticketTypes[0].id;
                            const tt = ticketTypes.find(t => t.id === ttId);
                            return (<div key={rowIdx} className="flex gap-1.5 items-center"> <span className="text-[10px] font-bold text-slate-600 w-4 text-center">{getRowLetter(rowIdx)}</span> <div className="flex gap-1"> {Array.from({ length: seatsPerRow }, (_, j) => j + 1).map(colIdx => (<div key={colIdx} className={`w-3.5 h-3.5 rounded-sm ${tt?.color || 'bg-slate-700'} opacity-80 hover:opacity-100 transition-opacity cursor-default`} title={`${getRowLetter(rowIdx)}${colIdx} - ${tt?.name}`} />))} </div> </div>);
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
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
