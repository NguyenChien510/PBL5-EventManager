import { useState, useEffect, useRef } from 'react';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useLocationStore } from '../stores/useLocationStore';
import { Icon } from '../components/ui';
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
  { id: 3, title: 'Loại vé & Giá' },
  { id: 4, title: 'Hoàn tất' }
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
  const [artists, setArtists] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop');

  // Time State
  const [sessions, setSessions] = useState([
    { id: 1, sessionDate: '', startTime: '', endTime: '', name: 'Phiên 1' }
  ]);

  // Keep wizard UX consistent: each step starts from top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);
  
  useEffect(() => {
    fetchCategories()
    fetchProvinces()
  }, [fetchCategories, fetchProvinces])

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
      if (!target.closest('[data-row-assignment-dropdown="true"]')) {
        setActiveRowDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
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
      if (ticketTypes.length === 0 || ticketTypes.some(t => !t.name?.trim())) {
        alert("Vui lòng tạo ít nhất 1 hạng vé hợp lệ");
        setCurrentStep(3);
        return;
      }

      const payload = {
        title,
        categoryId: selectedCategory?.id,
        artists,
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
      const res = await fetch('http://localhost:8080/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const error = await res.json();
        alert("Lỗi: " + (error.message || "Không thể tạo sự kiện"));
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const smoothFieldClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 outline-none transition-all rounded-xl shadow-sm focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60";
  const smoothDropdownClass = "w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-left outline-none transition-all focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60";

  return (
    <DashboardLayout sidebarProps={organizerSidebarConfig}>
      <PageHeader title="Tạo Sự Kiện Mới" breadcrumb={['Sự kiện', 'Tạo sự kiện mới']} />
      <div className="p-8 max-w-5xl mx-auto">
        
        {isSubmitted ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-16 text-center animate-in fade-in zoom-in-95 duration-700 ease-out fill-mode-both">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border border-green-100 animate-bounce">
                <Icon name="check_circle" className="text-green-500 text-6xl" />
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
            {/* Progress Bar */}
            <div className="mb-14 mt-4 px-2 sm:px-10">
              <div className="flex w-full relative z-0">
                <div className="absolute top-5 h-1 bg-slate-200 rounded-full -z-10" style={{ left: '12.5%', right: '12.5%' }}></div>
                <div 
                  className="absolute top-5 h-1 bg-gradient-to-r from-primary to-blue-400 rounded-full -z-10 transition-all duration-700 ease-in-out" 
                  style={{ left: '12.5%', width: `calc(75% * ${(currentStep - 1) / 3})` }}
                ></div>
                {steps.map(step => (
                  <div key={step.id} className="flex-1 flex flex-col items-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ease-out ${currentStep >= step.id ? 'bg-primary text-white shadow-lg shadow-primary/40 scale-110' : 'bg-white border-2 border-slate-200 text-slate-400 scale-100 delay-100'}`}>
                      {currentStep > step.id ? <Icon name="check" size="sm" /> : step.id}
                    </div>
                    <span className={`absolute top-12 left-1/2 -translate-x-1/2 w-max text-center text-xs font-bold transition-all duration-500 ${currentStep >= step.id ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 min-h-[400px]">
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Thông tin sự kiện</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 space-y-5">
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Tên sự kiện *</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên sự kiện..." className={smoothFieldClass} />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Thể loại *</label>
                        <div className="relative" ref={categoryRef}>
                          <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className={smoothDropdownClass}>
                            <span className="font-semibold text-slate-700">{selectedCategory?.name || 'Chọn thể loại'}</span>
                            <Icon name={isCategoryOpen ? "expand_less" : "expand_more"} className="text-slate-400" />
                          </button>
                          {isCategoryOpen && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 shadow-sky-900/10">
                              {categories.map((cat) => (
                                <button key={cat.id} onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedCategory?.id === cat.id ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}>{cat.name}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Nghệ sĩ biểu diễn</label>
                        <input type="text" value={artists} onChange={(e) => setArtists(e.target.value)} placeholder="Tên các nghệ sĩ..." className={smoothFieldClass} />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Mô tả chi tiết *</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả trải nghiệm sự kiện..." className={`${smoothFieldClass} min-h-[160px]`} />
                      </div>
                    </div>
                    <div className="lg:col-span-3 flex flex-col">
                      <label className="text-sm font-bold text-slate-700 mb-2 block">Ảnh bìa (Cover Image)</label>
                      <div className="flex-1 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group min-h-[300px] overflow-hidden relative">
                        {posterUrl ? <img src={posterUrl} alt="Preview" className="w-full h-full object-cover" /> : (
                          <>
                            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><Icon name="cloud_upload" className="text-primary text-3xl" /></div>
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
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-extrabold text-slate-900">Thời gian & Địa điểm</h2>
                    <button onClick={() => setSessions([...sessions, { id: Date.now(), sessionDate: '', startTime: '', endTime: '', name: `Phiên ${sessions.length + 1}` }])} className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-2 text-sm">
                      <Icon name="add" size="sm" /> Thêm phiên
                    </button>
                  </div>
                  <div className="space-y-6">
                    {sessions.map((session, index) => (
                      <div key={session.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wider">{session.name} - Ngày diễn ra</label><input type="date" value={session.sessionDate} onChange={(e) => { const newSessions = [...sessions]; newSessions[index].sessionDate = e.target.value; setSessions(newSessions); }} className={smoothFieldClass} /></div>
                          <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wider">Giờ bắt đầu</label><input type="time" value={session.startTime} onChange={(e) => { const newSessions = [...sessions]; newSessions[index].startTime = e.target.value; setSessions(newSessions); }} className={smoothFieldClass} /></div>
                          <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wider">Giờ kết thúc</label><input type="time" value={session.endTime} onChange={(e) => { const newSessions = [...sessions]; newSessions[index].endTime = e.target.value; setSessions(newSessions); }} className={smoothFieldClass} /></div>
                        </div>
                        {sessions.length > 1 && <button onClick={() => setSessions(sessions.filter(s => s.id !== session.id))} className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-200 text-red-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm opacity-0 group-hover:opacity-100"><Icon name="close" size="sm" /></button>}
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-slate-200 w-full my-8" />
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Tỉnh / Thành phố *</label>
                        <div className="relative" ref={provinceRef}>
                          <button onClick={() => setIsProvinceOpen(!isProvinceOpen)} className={smoothDropdownClass}>
                            <span className="font-semibold text-slate-700">{selectedProvince?.name || 'Chọn tỉnh thành'}</span>
                            <Icon name={isProvinceOpen ? "expand_less" : "expand_more"} className="text-slate-400" />
                          </button>
                          {isProvinceOpen && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto shadow-sky-900/10">
                              {provinces.map((p) => ( <button key={p.id} onClick={() => { setSelectedProvince(p); setIsProvinceOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedProvince?.id === p.id ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}>{p.name}</button> ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Phường / Xã *</label>
                        <div className="relative" ref={wardRef}>
                          <button onClick={() => setIsWardOpen(!isWardOpen)} disabled={!selectedProvince} className={`${smoothDropdownClass} disabled:opacity-50`}>
                            <span className="font-semibold text-slate-700">{selectedWard?.name || 'Chọn phường xã'}</span>
                            <Icon name={isWardOpen ? "expand_less" : "expand_more"} className="text-slate-400" />
                          </button>
                          {isWardOpen && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto shadow-sky-900/10">
                              {wards.map((w) => ( <button key={w.id} onClick={() => { setSelectedWard(w); setIsWardOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedWard?.id === w.id ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}>{w.name}</button> ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">Địa chỉ chi tiết & Bản đồ *</label>
                      <div className="flex gap-2 w-full mb-4">
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') searchLocation(); }} placeholder="Nhập số nhà, tên đường hoặc gợi ý địa chỉ..." className={`flex-1 ${smoothFieldClass} text-base font-medium`} />
                        <button onClick={searchLocation} className="px-6 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md flex items-center gap-2"><Icon name="search" size="sm" /> Tìm kiếm</button>
                      </div>
                      <div className="w-full h-[400px] bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200 relative z-0 shadow-sm">
                        <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <MapUpdater center={mapCenter} />
                          <LocationPicker position={mapPosition} onPositionChange={handleMapClick} />
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-2xl font-extrabold text-slate-900">1. Các loại vé</h2><p className="text-sm text-slate-500 font-medium">Định nghĩa các hạng vé và mức giá của bạn</p></div>
                    <button onClick={() => { const newId = Math.max(...ticketTypes.map(t => t.id), 0) + 1; setTicketTypes([...ticketTypes, { id: newId, name: 'Loại vé mới', price: 0, color: 'bg-slate-500', totalQuantity: 0 }]); }} className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-2 text-sm"><Icon name="add" size="sm" /> Thêm hạng vé</button>
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
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200/60 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Giá vé (VNĐ)</label>
                            <input
                              type="number"
                              value={ticket.price}
                              onChange={(e) => { const newTypes = [...ticketTypes]; newTypes[index].price = parseInt(e.target.value) || 0; setTicketTypes(newTypes); }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200/60 transition-all"
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
                    <div><h2 className="text-2xl font-extrabold text-slate-900 mb-1">2. Cấu hình sơ đồ ghế</h2><p className="text-sm text-slate-500 font-medium">Thiết lập số hàng, số ghế và gán hạng vé cho từng khu vực</p></div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-4 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-sm font-bold text-slate-700 mb-2 block">Số hàng</label><input type="number" min="1" max="26" value={rowCount} onChange={(e) => setRowCount(parseInt(e.target.value) || 1)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-slate-300 outline-none transition-all rounded-xl shadow-sm" /></div>
                          <div><label className="text-sm font-bold text-slate-700 mb-2 block">Ghế mỗi hàng</label><input type="number" min="1" max="50" value={seatsPerRow} onChange={(e) => setSeatsPerRow(parseInt(e.target.value) || 1)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-slate-300 outline-none transition-all rounded-xl shadow-sm" /></div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700 mb-2 block">Gán hạng vé theo hàng</label>
                          <div className={`max-h-[300px] pr-2 space-y-2 custom-scrollbar ${activeRowDropdown !== null ? 'overflow-visible' : 'overflow-y-auto'}`}>
                            {Array.from({ length: rowCount }, (_, i) => i + 1).map(rowIdx => (
                              <div key={rowIdx} className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 ${activeRowDropdown === rowIdx ? 'relative z-[60]' : 'relative z-10'}`}>
                                <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-xs font-black shadow-sm border border-slate-100">{getRowLetter(rowIdx)}</span>
                                <div className="relative flex-1" data-row-assignment-dropdown="true">
                                  <button
                                    type="button"
                                    onClick={() => setActiveRowDropdown(activeRowDropdown === rowIdx ? null : rowIdx)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none transition-all shadow-sm hover:border-slate-300 focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60"
                                  >
                                    <span>
                                      {ticketTypes.find(t => t.id === (rowAssignments[rowIdx] || ticketTypes[0].id))?.name || 'Chọn hạng vé'}
                                    </span>
                                    <Icon name={activeRowDropdown === rowIdx ? "expand_less" : "expand_more"} className="text-slate-400" />
                                  </button>
                                  {activeRowDropdown === rowIdx && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 shadow-sky-900/10">
                                      {ticketTypes.map(t => (
                                        <button
                                          key={t.id}
                                          type="button"
                                          onClick={() => {
                                            setRowAssignments({ ...rowAssignments, [rowIdx]: t.id });
                                            setActiveRowDropdown(null);
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                            (rowAssignments[rowIdx] || ticketTypes[0].id) === t.id
                                              ? 'bg-primary/5 text-primary font-bold'
                                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                          }`}
                                        >
                                          {t.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="lg:col-span-8 bg-slate-900 rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col items-center">
                        <div className="w-full h-2 bg-slate-700 rounded-full mb-12 relative"><div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sân Khấu / Stage</div></div>
                        <div className="w-full overflow-auto max-h-[400px] p-4 flex flex-col items-center gap-2 custom-scrollbar">
                          {Array.from({ length: rowCount }, (_, i) => i + 1).map(rowIdx => {
                            const ttId = rowAssignments[rowIdx] || ticketTypes[0].id;
                            const tt = ticketTypes.find(t => t.id === ttId);
                            return ( <div key={rowIdx} className="flex gap-1.5 items-center"> <span className="text-[10px] font-bold text-slate-600 w-4 text-center">{getRowLetter(rowIdx)}</span> <div className="flex gap-1"> {Array.from({ length: seatsPerRow }, (_, j) => j + 1).map(colIdx => ( <div key={colIdx} className={`w-3.5 h-3.5 rounded-sm ${tt?.color || 'bg-slate-700'} opacity-80 hover:opacity-100 transition-opacity cursor-default`} title={`${getRowLetter(rowIdx)}${colIdx} - ${tt?.name}`} /> ))} </div> </div> );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both max-w-2xl mx-auto text-center py-8">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><Icon name="check_circle" className="text-green-500 text-5xl" /></div>
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
                {currentStep < 4 ? (
                  <button onClick={nextStep} className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/30 flex items-center gap-2"> Tiếp tục <Icon name="arrow_forward" size="sm" /> </button>
                ) : (
                  <button onClick={handleCreateEvent} disabled={isSubmitting} className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex items-center gap-2 disabled:opacity-50">
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
