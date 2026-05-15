import { useState, useEffect, useRef } from 'react';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useLocationStore } from '../stores/useLocationStore';
import { Icon } from '../components/ui';
import { ArtistService } from '../services/artistService';
import { EventService } from '../services/eventService';
import { toast } from 'react-hot-toast';

import { DashboardLayout, PageHeader } from '../components/layout';
import { Stage, Layer, Circle, Text, Group, Rect, Transformer } from 'react-konva';
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



// --- ACCORDION SESSION ITEM ---
const SessionAccordionItem = ({ session, index, isOpen, toggle, remove, update, stepColor }: any) => {
  return (
    <div className={`rounded-3xl border transition-all duration-300 ${isOpen ? 'bg-white shadow-xl shadow-sky-900/5 border-blue-100 ring-1 ring-blue-50' : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}>
      <div onClick={toggle} className="w-full flex items-center justify-between p-4 cursor-pointer select-none">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${isOpen ? stepColor.gradient + ' text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>
            {index + 1}
          </div>
          <div className="text-left">
            <h4 className={`font-bold text-sm md:text-base ${isOpen ? 'text-slate-900' : 'text-slate-600'}`}>Phiên {index + 1}</h4>
            <div className="text-[11px] font-medium text-slate-400 flex gap-3 mt-0.5">
              <span className="flex items-center gap-1"><Icon name="calendar_today" size="xs" /> {session.sessionDate || '--/--'}</span>
              <span className="flex items-center gap-1"><Icon name="schedule" size="xs" /> {session.startTime || '--:--'} - {session.endTime || '--:--'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); remove(); }} className="w-8 h-8 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"><Icon name="delete" size="sm" /></button>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : 'text-slate-400'}`}><Icon name="keyboard_arrow_down" /></div>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out border-slate-50 ${isOpen ? 'grid-rows-[1fr] opacity-100 border-t' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-5 pt-3 grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ngày diễn ra</label>
              <input type="date" value={session.sessionDate} onChange={(e) => update({ ...session, sessionDate: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-blue-300 transition-all shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bắt đầu</label>
              <input type="time" value={session.startTime} onChange={(e) => update({ ...session, startTime: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-blue-300 transition-all shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kết thúc</label>
              <input type="time" value={session.endTime} onChange={(e) => update({ ...session, endTime: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-blue-300 transition-all shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const [provinceSearch, setProvinceSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');


  // Ticket & Seat Map State
  const [hasSeatMap, setHasSeatMap] = useState<boolean>(false);
  const [ticketTypes, setTicketTypes] = useState([
    { id: 1, name: 'Vé Thường', price: 500000, color: '#3b82f6', totalQuantity: 100 },
    { id: 2, name: 'Vé VIP', price: 1200000, color: '#f59e0b', totalQuantity: 50 },
  ]);
  const [seats, setSeats] = useState<{ id: string; x: number; y: number; ticketTypeId: number; label: string }[]>([]);
  const [activePaintTicketId, setActivePaintTicketId] = useState<number | null>(null);
  const [activeColorPicker, setActiveColorPicker] = useState<number | null>(null);

  // Graphics Drawing Engine State
  const [shapes, setShapes] = useState<any[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<'cursor' | 'seat' | 'rect' | 'text'>('cursor');
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const selectedShapeId = selectedShapeIds.length === 1 ? selectedShapeIds[0] : null;
  const setSelectedShapeId = (id: string | null) => {
    setSelectedShapeIds(id ? [id] : []);
  };
  const [shapeFill, setShapeFill] = useState('#334155');
  const trRef = useRef<any>(null);

  // Panning & Rubber-Band Selection States
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

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
  const [activeAccordionIndex, setActiveAccordionIndex] = useState<number | null>(0);

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

  const saveLayoutToTemplateSlot = (templateIndex: number) => {
    if (shapes.length === 0 && seats.length === 0) {
      toast.error("Sơ đồ hiện đang trống, không có gì để lưu.");
      return;
    }
    const data = { shapes, seats };
    localStorage.setItem(`custom_floor_template_${templateIndex}`, JSON.stringify(data));
    toast.success(`💾 Đã lưu đè sơ đồ hiện tại vào Mẫu ${templateIndex}! Mẫu này sẽ được tải ra khi bạn nhấn nút lần tới.`, { icon: '💾' });
  };

  const applyLayoutTemplate = (templateIndex: number) => {
    toast.dismiss();

    // Check localStorage override first
    const savedData = localStorage.getItem(`custom_floor_template_${templateIndex}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.shapes) {
          setShapes(parsed.shapes);
          if (parsed.seats) setSeats(parsed.seats);
          setActiveTemplate(templateIndex);
          return;
        }
      } catch (err) {
        console.error("Failed to load override template", err);
      }
    }

    const ticketIds = ticketTypes.map(t => t.id);
    if (ticketIds.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hạng vé phía trên trước khi áp dụng sơ đồ mẫu.");
      return;
    }

    let newShapes: any[] = [];

    // Helper to dynamically link templates back to configured ticket indices
    const getTicketId = (idx: number) => ticketIds[idx % ticketIds.length];

    if (templateIndex === 1) {
      // --- Template 1: TRUNG QUÂN 1589 (15 Years Live Concert) ---
      newShapes = [
        { id: 'ty-l-' + uuidv4().slice(0, 8), type: 'rect', x: 434, y: 52, width: 125, height: 75, fill: '#06b6d4', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(0), labelText: 'ÁNH NẮNG' },
        { id: 'dm-l-' + uuidv4().slice(0, 8), type: 'rect', x: 435, y: 141, width: 125, height: 75, fill: '#a855f7', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(1), labelText: 'DẤU MƯA' },
        { id: 'tt-' + uuidv4().slice(0, 8), type: 'rect', x: 418, y: 227, width: 170, height: 75, fill: '#22c55e', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(0), labelText: 'TỰ TÌNH' },
        { id: 'cbg-wl-' + uuidv4().slice(0, 8), type: 'rect', x: 291, y: 138, width: 120, height: 165, fill: '#f97316', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(1), labelText: 'CHƯA BAO GIỜ' }
      ];
      setSeats([]);
    } else if (templateIndex === 2) {
      // --- Template 2: QUỐC THIÊN CHÂN DUNG NGƯỜI LẠ ---
      newShapes = [
        { id: 'cdnl-r-' + uuidv4().slice(0, 8), type: 'rect', x: 490, y: 37, width: 135, height: 45, fill: '#dc2626', opacity: 0.85, rotation: 0, ticketTypeId: getTicketId(0), labelText: 'CHÂN DUNG NGƯỜI LẠ' },
        { id: 'mmtv-r-' + uuidv4().slice(0, 8), type: 'rect', x: 490, y: 87, width: 135, height: 45, fill: '#d97706', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(1), labelText: 'MONG MANH TÌNH VỀ' },
        { id: 'w-l-' + uuidv4().slice(0, 8), type: 'rect', x: 320, y: 37, width: 160, height: 95, fill: '#475569', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(0), labelText: 'CHIA CÁCH BÌNH YÊN' },
        { id: 'hvv-r-' + uuidv4().slice(0, 8), type: 'rect', x: 490, y: 147, width: 135, height: 45, fill: '#ca8a04', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(1), labelText: 'HOA VÀ VÁY' },
        { id: 'kst-r-' + uuidv4().slice(0, 8), type: 'rect', x: 490, y: 197, width: 135, height: 45, fill: '#16a34a', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(0), labelText: 'KẺ SAY TÌNH' },
        { id: 'chp-l-' + uuidv4().slice(0, 8), type: 'rect', x: 303, y: 144, width: 180, height: 95, fill: '#db2777', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(1), labelText: 'CÁNH HỒNG PHAI' }
      ];
      setSeats([]);
    } else if (templateIndex === 3) {
      // --- Template 3: V CONCERT (Modern Stadium Layout with diagonal structures) ---
      newShapes = [
        { id: 'kv-2-' + uuidv4().slice(0, 8), type: 'rect', x: 298, y: 67, width: 95, height: 80, fill: '#0ea5e9', opacity: 0.85, rotation: 0, ticketTypeId: getTicketId(0), labelText: 'KHÁT VỌNG ' },
        { id: 'cs-2-' + uuidv4().slice(0, 8), type: 'rect', x: 593, y: 178, width: 130, height: 75, fill: '#3f51b5', opacity: 0.85, rotation: 0, ticketTypeId: getTicketId(1), labelText: 'CHIA SẺ ' },
        { id: 'ytth-1-' + uuidv4().slice(0, 8), type: 'rect', x: 419, y: 173, width: 160, height: 90, fill: '#e91e63', opacity: 0.85, rotation: 0, ticketTypeId: getTicketId(0), labelText: 'YÊU THƯƠNG' },
        { id: 'hp-1-' + uuidv4().slice(0, 8), type: 'rect', x: 585, y: 58, width: 160, height: 90, fill: '#ff9800', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(1), labelText: 'HẠNH PHÚC ' },
        { id: 'th-' + uuidv4().slice(0, 8), type: 'rect', x: 418, y: 56, width: 160, height: 100, fill: '#b71c1c', opacity: 0.85, rotation: 0, ticketTypeId: getTicketId(0), labelText: 'TỰ HÀO VIP' },
        { id: 'ext-1-' + uuidv4().slice(0, 8), type: 'rect', x: 262, y: 176, width: 140, height: 80, fill: '#8e24aa', opacity: 0.8, rotation: 0, ticketTypeId: getTicketId(1), labelText: 'MỞ RỘNG ' }
      ];
      setSeats([]);
    }

    setActiveTemplate(templateIndex);
    setShapes(newShapes);
  }


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

  // Ctrl Key Press Listener Effect (for Stage Panning)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(e.type === 'keydown');
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, []);

  // Graphics Transformer Binding Effect (Supports Multiple Nodes)
  useEffect(() => {
    if (trRef.current) {
      if (selectedShapeIds.length > 0) {
        const stage = trRef.current.getStage();
        const nodes = selectedShapeIds
          .map(id => stage.findOne('#' + id))
          .filter(node => !!node);
        trRef.current.nodes(nodes);
      } else {
        trRef.current.nodes([]);
      }
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedShapeIds, shapes]);

  // Graphics Keyboard Delete Shortcut Effect (Supports Bulk Deletion)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedShapeIds.length === 0) return;
      const activeTagName = document.activeElement?.tagName.toLowerCase();
      if (activeTagName === 'input' || activeTagName === 'textarea') {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setShapes(prev => prev.filter(s => !selectedShapeIds.includes(s.id)));
        setSelectedShapeIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeIds]);

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
        setProvinceSearch('');
      }
      if (wardRef.current && !wardRef.current.contains(event.target as Node)) {
        setIsWardOpen(false);
        setWardSearch('');
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


  const centerMapOnLocation = async (provinceName: string, wardName?: string) => {
    let query = provinceName;
    if (wardName) {
      query = `${wardName}, ${provinceName}`;
    }
    query += ", Việt Nam";

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = new L.LatLng(parseFloat(lat), parseFloat(lon));
        setMapPosition(newPos);
        setMapCenter(newPos);
        // update search input to cleaner name if preferred
        setSearchQuery(query.replace(", Việt Nam", ""));
      }
    } catch (err) {
      console.error("Auto centering failed", err);
    }
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
    const prefix = tt ? tt.name.substring(0, 1).toUpperCase() : 'S';
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
      if (ticketTypes.length === 0 || ticketTypes.some(t => !t.name?.trim())) {
        alert("Vui lòng tạo ít nhất 1 hạng vé hợp lệ");
        setCurrentStep(4);
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
        latitude: mapPosition?.lat,
        longitude: mapPosition?.lng,
        posterUrl,
        sessions: sessions.map(s => ({
          sessionDate: s.sessionDate,
          startTime: s.startTime,
          endTime: s.endTime,
          name: s.name
        })),
        schedules: schedules
          .filter(s => s.startTime && s.activity.trim())
          .map(s => ({
            startTime: s.startTime + (s.startTime.length === 5 ? ':00' : ''),
            activity: s.activity
          })),
        ticketTypes: ticketTypes.map(t => ({
          name: t.name,
          price: t.price,
          totalQuantity: hasSeatMap
            ? (seats.some(s => s.ticketTypeId === t.id) ? seats.filter(s => s.ticketTypeId === t.id).length : t.totalQuantity)
            : t.totalQuantity,
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
        } : null,
        seatMapLayout: hasSeatMap ? JSON.stringify(shapes) : null
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

      <div className={`p-6 mx-auto transition-all duration-500 ${currentStep === 1 || currentStep === 2 ? 'max-w-5xl' :
        currentStep === 4 ? 'max-w-[1700px]' :
          'max-w-7xl'
        }`}>





        {isSubmitted ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 p-10 text-center animate-in fade-in zoom-in-95 duration-500 ease-out fill-mode-both max-w-md mx-auto mt-8 mb-12">
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-60" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-2 bg-green-50 rounded-full"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 z-10">
                <Icon name="check" className="text-white text-3xl font-bold" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Đăng sự kiện thành công!</h2>
            <p className="text-slate-500 mb-8 text-sm font-semibold leading-relaxed px-2">
              Sự kiện đã được gửi tới ban quản trị để phê duyệt.
              Bạn có thể theo dõi tiến trình tại Bảng điều khiển.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
              >
                <Icon name="add" size="sm" /> Tạo sự kiện mới
              </button>
              <button
                onClick={() => window.location.href = '/organizer/dashboard'}
                className="w-full px-6 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] transition-all border border-slate-200 flex items-center justify-center gap-2 text-sm"
              >
                <Icon name="dashboard" size="sm" /> Về bảng điều khiển
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
                            const newId = Date.now();
                            setSessions([...sessions, {
                              id: newId,
                              sessionDate: '',
                              startTime: firstSession ? firstSession.startTime : '',
                              endTime: firstSession ? firstSession.endTime : '',
                              name: `Phiên ${sessions.length + 1}`
                            }]);
                            setActiveAccordionIndex(sessions.length);
                          }}
                          className={`px-4 py-2 ${stepColor.gradient} text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5 text-sm shadow-md shadow-blue-200/50`}
                        >
                          <Icon name="add" size="xs" />
                        </button>


                      </div>
                      <div className="space-y-3 h-[420px] overflow-y-auto pr-2 custom-scrollbar p-3 bg-slate-50/40 rounded-3xl border border-slate-100/80 shadow-inner shadow-slate-900/5">
                        {sessions.map((session, index) => (
                          <SessionAccordionItem
                            key={session.id}
                            session={session}
                            index={index}
                            isOpen={activeAccordionIndex === index}
                            toggle={() => setActiveAccordionIndex(activeAccordionIndex === index ? null : index)}
                            remove={() => setSessions(sessions.filter(s => s.id !== session.id))}
                            update={(updatedData: any) => {
                              const newSessions = [...sessions];
                              newSessions[index] = updatedData;
                              setSessions(newSessions);
                            }}
                            stepColor={stepColor}
                          />
                        ))}
                      </div>
                    </div>




                    {/* Right Column: Location & Map */}
                    <div className="lg:col-span-6 space-y-6 pt-1">



                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Tỉnh / Thành phố *</label>
                          <div className="relative" ref={provinceRef}>

                            <button
                              type="button"
                              onClick={() => { setIsProvinceOpen(!isProvinceOpen); setProvinceSearch(''); }}
                              className={smoothDropdownClass}
                            >
                              <span className="font-semibold text-slate-700">{selectedProvince?.name || 'Chọn tỉnh thành'}</span>
                              <Icon name={isProvinceOpen ? "expand_less" : "expand_more"} className="text-slate-400" />
                            </button>
                            {isProvinceOpen && (
                              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 flex flex-col shadow-sky-900/10">
                                <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                                  <div className="relative">
                                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                    <input
                                      type="text"
                                      placeholder="Tìm kiếm..."
                                      value={provinceSearch}
                                      onChange={(e) => setProvinceSearch(e.target.value)}
                                      autoFocus
                                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {provinces
                                    .filter(p => !provinceSearch || normalizeLocationName(p.name).includes(normalizeLocationName(provinceSearch)))
                                    .map((p) => (
                                      <button
                                        key={p.id}
                                        onClick={() => {
                                          setSelectedProvince(p);
                                          setIsProvinceOpen(false);
                                          setProvinceSearch('');
                                          centerMapOnLocation(p.name);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedProvince?.id === p.id ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}
                                      >
                                        {p.name}
                                      </button>
                                    ))}
                                  {provinces.filter(p => !provinceSearch || normalizeLocationName(p.name).includes(normalizeLocationName(provinceSearch))).length === 0 && (
                                    <div className="px-4 py-3 text-sm text-slate-400 italic text-center">Không tìm thấy kết quả</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className={`text-sm font-bold mb-2 block ${stepColor.text}`}>Quận / Huyện *</label>
                          <div className="relative" ref={wardRef}>
                            <button
                              type="button"
                              onClick={() => { setIsWardOpen(!isWardOpen); setWardSearch(''); }}
                              disabled={!selectedProvince}
                              className={`${smoothDropdownClass} disabled:opacity-50`}
                            >
                              <span className="font-semibold text-slate-700">{selectedWard?.name || 'Chọn quận huyện'}</span>
                              <Icon name={isWardOpen ? "expand_less" : "expand_more"} className="text-slate-400" />
                            </button>
                            {isWardOpen && (
                              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 flex flex-col shadow-sky-900/10">
                                <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                                  <div className="relative">
                                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                    <input
                                      type="text"
                                      placeholder="Tìm kiếm..."
                                      value={wardSearch}
                                      onChange={(e) => setWardSearch(e.target.value)}
                                      autoFocus
                                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {wards
                                    .filter(w => !wardSearch || normalizeLocationName(w.name).includes(normalizeLocationName(wardSearch)))
                                    .map((w) => (
                                      <button
                                        key={w.id}
                                        onClick={() => {
                                          setSelectedWard(w);
                                          setIsWardOpen(false);
                                          setWardSearch('');
                                          if (selectedProvince) {
                                            centerMapOnLocation(selectedProvince.name, w.name);
                                          }
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedWard?.id === w.id ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}
                                      >
                                        {w.name}
                                      </button>
                                    ))}
                                  {wards.filter(w => !wardSearch || normalizeLocationName(w.name).includes(normalizeLocationName(wardSearch))).length === 0 && (
                                    <div className="px-4 py-3 text-sm text-slate-400 italic text-center">Không tìm thấy kết quả</div>
                                  )}
                                </div>
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
                        <div className="w-full h-[280px] bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200 relative z-0 shadow-sm mt-4">

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
                    </div>
                    <button onClick={() => setSchedules([...schedules, { id: Date.now(), startTime: '', activity: '' }])} className={`px-5 py-2.5 ${stepColor.gradient} text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2 text-sm shadow-md shadow-blue-200/50`}>
                      <Icon name="add" size="sm" /> Thêm hoạt động
                    </button>

                  </div>
                  <div className="space-y-4">
                    {schedules.map((sched, index) => (
                      <div key={sched.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group flex flex-col md:flex-row gap-10 items-start md:items-center">


                        <div className="w-full md:w-44 shrink-0">
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
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner shadow-blue-200/50">
                        <Icon name="settings" size="sm" />
                      </div>
                      <div>
                        <h3 className={`text-base font-black tracking-tight ${stepColor.text}`}>Loại Hình Sự Kiện</h3>
                        <p className="text-xs font-semibold text-slate-400">Lựa chọn hình thức bán vé cho sự kiện của bạn</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { setHasSeatMap(false); setActivePaintTicketId(null); }}
                        className={`relative overflow-hidden p-3.5 rounded-xl border text-left transition-all duration-300 flex items-center gap-3 group ${!hasSeatMap ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}
                      >
                        {!hasSeatMap && <div className="absolute top-2 right-2 text-blue-600"><Icon name="check_circle" size="sm" /></div>}
                        <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${!hasSeatMap ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'}`}>
                          <Icon name="confirmation_number" size="sm" />
                        </div>
                        <div className="pr-5">
                          <h4 className={`font-bold text-sm leading-snug ${!hasSeatMap ? 'text-blue-900' : 'text-slate-700'}`}>Vào cửa tự do (General Admission)</h4>
                          <p className="text-[11px] font-medium text-slate-400 leading-snug mt-0.5">Phù hợp cho Workshop, Đêm nhạc... Khách mua vé theo số lượng.</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setHasSeatMap(true); if (ticketTypes.length > 0) setActivePaintTicketId(ticketTypes[0].id); }}
                        className={`relative overflow-hidden p-3.5 rounded-xl border text-left transition-all duration-300 flex items-center gap-3 group ${hasSeatMap ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}
                      >
                        {hasSeatMap && <div className="absolute top-2 right-2 text-blue-600"><Icon name="check_circle" size="sm" /></div>}
                        <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${hasSeatMap ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'}`}>
                          <Icon name="event_seat" size="sm" />
                        </div>
                        <div className="pr-5">
                          <h4 className={`font-bold text-sm leading-snug ${hasSeatMap ? 'text-blue-900' : 'text-slate-700'}`}>Sắp xếp chỗ ngồi (Seat Map)</h4>
                          <p className="text-[11px] font-medium text-slate-400 leading-snug mt-0.5">Phù hợp Liveshow, Hội trường... Tự thiết kế sơ đồ chọn ghế.</p>
                        </div>
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
                                type="text"
                                value={ticket.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, "");
                                  const val = raw ? parseInt(raw, 10) : 0;
                                  const newTypes = [...ticketTypes];
                                  newTypes[index].price = val;
                                  setTicketTypes(newTypes);
                                }}
                                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all ${stepColor.border} focus:ring-4 ${stepColor.ring}`}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">
                                {(hasSeatMap && seats.some(s => s.ticketTypeId === ticket.id)) ? 'Số lượng (Tự đếm trên sơ đồ)' : 'Tổng số lượng bán'}
                              </label>
                              {(hasSeatMap && seats.some(s => s.ticketTypeId === ticket.id)) ? (
                                <div className="py-2 px-4 bg-indigo-50 text-indigo-600 font-black text-sm rounded-xl border border-indigo-100 flex items-center gap-2" title="Số lượng được tính bằng cách đếm số chấm ghế bạn đã đặt trực tiếp trên sơ đồ">
                                  <Icon name="event_seat" size="xs" className="text-indigo-500" />
                                  <span>{seats.filter(s => s.ticketTypeId === ticket.id).length} Ghế đặt</span>
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  value={ticket.totalQuantity}
                                  onChange={(e) => { const newTypes = [...ticketTypes]; newTypes[index].totalQuantity = Math.max(0, parseInt(e.target.value) || 0); setTicketTypes(newTypes); }}
                                  className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all ${stepColor.border} focus:ring-4 ${stepColor.ring}`}
                                  placeholder="Số lượng vé..."
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
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-5 rounded-[2rem] border border-slate-200/60 shadow-sm">
                          <div>
                            <h2 className={`text-2xl font-extrabold mb-1 ${stepColor.text}`}>2. Thiết kế sơ đồ chỗ ngồi</h2>
                            <p className="text-sm text-slate-500 font-medium">Vẽ các khu vực hoặc đặt các chấm ghế tự do tùy chỉnh.</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[12px] font-black uppercase tracking-wider mr-1">🚀 Mẫu Sơ Đồ Nhanh:</span>
                            {/* Template 1 */}
                            <div className={`flex items-center border transition-all overflow-hidden rounded-xl shadow-sm ${activeTemplate === 1 ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/10 shadow-cyan-100' : 'bg-white border-slate-200 hover:border-cyan-500'}`}>
                              <button
                                type="button"
                                onClick={() => applyLayoutTemplate(1)}
                                className={`px-3 py-2 text-xs font-extrabold flex items-center gap-2 transition-all active:scale-[0.98] ${activeTemplate === 1 ? 'text-cyan-700 bg-cyan-50' : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'}`}
                                title="Áp dụng Mẫu 1"
                              >
                                <div className={`w-2 h-2 rounded-full bg-cyan-500 transition-transform ${activeTemplate === 1 ? 'scale-125 animate-pulse' : ''}`} />
                                Template 1
                              </button>
                              <button
                                type="button"
                                onClick={() => saveLayoutToTemplateSlot(1)}
                                className={`p-2 border-l transition-all ${activeTemplate === 1 ? 'border-cyan-200/60 text-cyan-600 hover:bg-cyan-100' : 'border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                title="Lưu đè thiết kế hiện tại vào Mẫu 1"
                              >
                                <Icon name="save" size="xs" />
                              </button>
                            </div>

                            {/* Template 2 */}
                            <div className={`flex items-center border transition-all overflow-hidden rounded-xl shadow-sm ${activeTemplate === 2 ? 'border-red-500 bg-red-50 ring-2 ring-red-500/10 shadow-red-100' : 'bg-white border-slate-200 hover:border-red-500'}`}>
                              <button
                                type="button"
                                onClick={() => applyLayoutTemplate(2)}
                                className={`px-3 py-2 text-xs font-extrabold flex items-center gap-2 transition-all active:scale-[0.98] ${activeTemplate === 2 ? 'text-red-700 bg-red-50' : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'}`}
                                title="Áp dụng Mẫu 2"
                              >
                                <div className={`w-2 h-2 rounded-full bg-red-500 transition-transform ${activeTemplate === 2 ? 'scale-125 animate-pulse' : ''}`} />
                                Template 2
                              </button>
                              <button
                                type="button"
                                onClick={() => saveLayoutToTemplateSlot(2)}
                                className={`p-2 border-l transition-all ${activeTemplate === 2 ? 'border-red-200/60 text-red-600 hover:bg-red-100' : 'border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                title="Lưu đè thiết kế hiện tại vào Mẫu 2"
                              >
                                <Icon name="save" size="xs" />
                              </button>
                            </div>

                            {/* Template 3 */}
                            <div className={`flex items-center border transition-all overflow-hidden rounded-xl shadow-sm ${activeTemplate === 3 ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10 shadow-indigo-100' : 'bg-white border-slate-200 hover:border-indigo-500'}`}>
                              <button
                                type="button"
                                onClick={() => applyLayoutTemplate(3)}
                                className={`px-3 py-2 text-xs font-extrabold flex items-center gap-2 transition-all active:scale-[0.98] ${activeTemplate === 3 ? 'text-indigo-700 bg-indigo-50' : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'}`}
                                title="Áp dụng Mẫu 3"
                              >
                                <div className={`w-2 h-2 rounded-full bg-indigo-500 transition-transform ${activeTemplate === 3 ? 'scale-125 animate-pulse' : ''}`} />
                                Template 3
                              </button>
                              <button
                                type="button"
                                onClick={() => saveLayoutToTemplateSlot(3)}
                                className={`p-2 border-l transition-all ${activeTemplate === 3 ? 'border-indigo-200/60 text-indigo-600 hover:bg-indigo-100' : 'border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                title="Lưu đè thiết kế hiện tại vào Mẫu 3"
                              >
                                <Icon name="save" size="xs" />
                              </button>
                            </div>

                            <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" />

                            <button
                              type="button"
                              onClick={() => {
                                const layoutData = { shapes, seats };
                                const dataStr = JSON.stringify(layoutData, null, 2);

                                // Download json file
                                const blob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `layout_export_${Date.now()}.json`;
                                link.click();
                                URL.revokeObjectURL(url);

                                // Copy to clipboard
                                navigator.clipboard.writeText(dataStr)
                                  .then(() => {
                                    toast.success("Đã tải tệp JSON và sao chép dữ liệu vào Clipboard!", { icon: '💾' });
                                  })
                                  .catch(() => {
                                    toast.success("Đã xuất và tải xuống tệp sơ đồ JSON!", { icon: '💾' });
                                  });
                              }}
                              className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-xl hover:bg-emerald-100 hover:border-emerald-400 shadow-sm transition-all flex items-center gap-2 active:scale-95 hover:shadow-md"
                            >
                              <Icon name="save" size="sm" />
                              Lưu / Xuất Sơ Đồ
                            </button>
                          </div>
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
                              <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Icon name="category" size="xs" /> Công cụ đồ họa
                              </h4>

                              {/* Tool Toggles */}
                              <div className="grid grid-cols-4 gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setActiveTool('cursor'); setSelectedShapeIds([]); }}
                                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${activeTool === 'cursor' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                >
                                  <Icon name="near_me" size="sm" />
                                  <span className="text-[9px]">Con trỏ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setActiveTool('seat'); setSelectedShapeIds([]); }}
                                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${activeTool === 'seat' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                >
                                  <Icon name="event_seat" size="sm" />
                                  <span className="text-[9px]">Đặt Ghế</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setActiveTool('rect'); setSelectedShapeIds([]); }}
                                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${activeTool === 'rect' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                >
                                  <Icon name="rectangle" size="sm" />
                                  <span className="text-[9px]">Vẽ Khung</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setActiveTool('text'); setSelectedShapeIds([]); }}
                                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${activeTool === 'text' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                >
                                  <Icon name="title" size="sm" />
                                  <span className="text-[9px]">Thêm Chữ</span>
                                </button>
                              </div>

                              {/* Selection Config */}
                              {selectedShapeId && (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Thuộc tính hình vẽ</p>

                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400">Màu sắc:</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={shapes.find(s => s.id === selectedShapeId)?.fill || shapeFill}
                                        onChange={(e) => {
                                          const nextFill = e.target.value;
                                          setShapeFill(nextFill);
                                          setShapes(shapes.map(s => s.id === selectedShapeId ? { ...s, fill: nextFill } : s));
                                        }}
                                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shrink-0 bg-transparent overflow-hidden"
                                      />
                                      <div className="flex flex-wrap gap-1">
                                        {['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#334155', '#0ea5e9', '#ec4899', '#8b5cf6', '#14b8a6', '#84cc16', '#f97316', '#64748b'].map(c => (
                                          <button
                                            key={c}
                                            type="button"
                                            onClick={() => {
                                              setShapeFill(c);
                                              setShapes(shapes.map(s => s.id === selectedShapeId ? { ...s, fill: c } : s));
                                            }}
                                            className="w-5 h-5 rounded-full border border-white shadow-sm"
                                            style={{ backgroundColor: c }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {shapes.find(s => s.id === selectedShapeId)?.type === 'text' && (
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-400">Nội dung chữ:</label>
                                      <input
                                        type="text"
                                        value={shapes.find(s => s.id === selectedShapeId)?.text || ''}
                                        onChange={(e) => {
                                          const newText = e.target.value;
                                          setShapes(shapes.map(s => s.id === selectedShapeId ? { ...s, text: newText } : s));
                                        }}
                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-semibold outline-none focus:border-blue-400 shadow-sm"
                                      />
                                    </div>
                                  )}

                                  {shapes.find(s => s.id === selectedShapeId)?.type === 'rect' && (
                                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 space-y-3 mb-3">
                                      <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5 tracking-wider">
                                          <Icon name="title" size="xs" className="scale-75 text-slate-400" />
                                          Nhãn hiển thị
                                        </label>
                                        <div className="relative flex items-center">
                                          <input
                                            type="text"
                                            placeholder="Ví dụ: VIP, Khu A1..."
                                            value={shapes.find(s => s.id === selectedShapeId)?.labelText || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setShapes(shapes.map(s => s.id === selectedShapeId ? { ...s, labelText: val } : s));
                                            }}
                                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 transition-all shadow-sm placeholder-slate-400"
                                          />
                                          <Icon name="edit_note" size="xs" className="absolute left-3 text-slate-400 pointer-events-none scale-90" />
                                        </div>
                                      </div>

                                      <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5 tracking-wider">
                                          <Icon name="confirmation_number" size="xs" className="scale-75 text-slate-400" />
                                          Liên kết hạng vé
                                        </label>
                                        <div className="relative flex items-center">
                                          <select
                                            value={shapes.find(s => s.id === selectedShapeId)?.ticketTypeId || ''}
                                            onChange={(e) => {
                                              const val = e.target.value ? parseInt(e.target.value) : null;
                                              const matchedTt = ticketTypes.find(t => t.id === val);
                                              setShapes(shapes.map(s => {
                                                if (s.id === selectedShapeId) {
                                                  return {
                                                    ...s,
                                                    ticketTypeId: val,
                                                    fill: matchedTt ? matchedTt.color : s.fill
                                                  };
                                                }
                                                return s;
                                              }));
                                            }}
                                            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 transition-all shadow-sm cursor-pointer appearance-none"
                                          >
                                            <option value="" className="text-slate-400 font-semibold">Không liên kết (Trang trí)</option>
                                            {ticketTypes.map(t => (
                                              <option key={t.id} value={t.id} className="font-bold text-slate-700">{t.name}</option>
                                            ))}
                                          </select>
                                          <div className="absolute left-3.5 flex items-center justify-center pointer-events-none">
                                            {(() => {
                                              const currentShape = shapes.find(s => s.id === selectedShapeId);
                                              const matchedTt = ticketTypes.find(t => t.id === currentShape?.ticketTypeId);
                                              return (
                                                <span
                                                  className="w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ring-slate-300 transition-all duration-300"
                                                  style={{ backgroundColor: matchedTt ? matchedTt.color : '#94a3b8' }}
                                                />
                                              );
                                            })()}
                                          </div>
                                          <Icon name="expand_more" size="xs" className="absolute right-3 text-slate-400 pointer-events-none scale-75" />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-1 border-t border-dashed border-slate-200 pt-3 mt-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <Icon name="rotate_right" size="xs" /> Góc xoay:
                                      </label>
                                      <span className="text-[10px] font-extrabold text-blue-600 font-mono">
                                        {Math.round(shapes.find(s => s.id === selectedShapeId)?.rotation || 0)}°
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="-180"
                                      max="180"
                                      value={Math.round(shapes.find(s => s.id === selectedShapeId)?.rotation || 0)}
                                      onChange={(e) => {
                                        const rot = parseInt(e.target.value, 10);
                                        setShapes(shapes.map(s => s.id === selectedShapeId ? { ...s, rotation: rot } : s));
                                      }}
                                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                                    />
                                    <div className="flex gap-1">
                                      {[-45, 0, 45, 90].map(angle => (
                                        <button
                                          key={angle}
                                          type="button"
                                          onClick={() => setShapes(shapes.map(s => s.id === selectedShapeId ? { ...s, rotation: angle } : s))}
                                          className="flex-1 text-[8px] font-black text-slate-500 bg-white border border-slate-200 rounded py-0.5 hover:border-blue-400 hover:text-blue-600 shadow-sm active:scale-95"
                                        >
                                          {angle}°
                                        </button>
                                      ))}
                                    </div>
                                  </div>


                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShapes(shapes.filter(s => s.id !== selectedShapeId));
                                      setSelectedShapeId(null);
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-[10px] border border-red-100 transition-colors"
                                  >
                                    <Icon name="delete" size="xs" /> Xóa hình này
                                  </button>
                                </div>
                              )}

                              <div className="text-[10px] text-slate-400 italic font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5 leading-relaxed">
                                <Icon name="info" size="xs" className="shrink-0 mt-0.5 text-slate-500" />
                                {activeTool === 'cursor'
                                  ? "Chế độ con trỏ: Nhấn và kéo chuột trái để bôi bọc chọn nhiều box cùng lúc. Giữ phím Ctrl + Kéo chuột trái để di chuyển (pan) quanh màn hình."
                                  : activeTool === 'seat'
                                    ? "Chọn hạng vé rồi nhấn chuột lên sơ đồ để đặt ghế."
                                    : `Đang ở chế độ ${activeTool === 'rect' ? 'Vẽ Khung' : 'Thêm Chữ'}. Nhấn chuột trái lên sân khấu để vẽ. Nhấn phím Delete để xóa.`
                                }
                              </div>
                            </div>


                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-slate-600">Tổng số ghế:</span>
                                <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{seats.length}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => { if (window.confirm("Xóa toàn bộ ghế?")) setSeats([]) }}
                                className="w-full py-2.5 bg-red-50 text-red-500 hover:bg-red-100 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <Icon name="delete_forever" size="sm" /> Xóa toàn bộ
                              </button>
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 flex gap-2 font-medium">
                              <Icon name="info" size="xs" className="shrink-0" />
                              <div>
                                <strong className="block mb-0.5">Tips:</strong>
                                - Click lên khung canvas để đặt ghế mới.<br />
                                - Click vào ghế đã có để xóa ghế đó.<br />
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

                            <div className="relative w-full bg-slate-900 aspect-[4/3] lg:aspect-video max-h-[600px] overflow-hidden"
                              style={{ cursor: isCtrlPressed ? 'grab' : (activeTool === 'cursor' ? 'default' : 'crosshair') }}>
                              <Stage
                                width={2000}
                                height={2000}
                                className="bg-[#0f172a]"
                                draggable={isCtrlPressed}
                                onMouseDown={(e) => {
                                  const clickedOnEmpty = e.target === e.target.getStage();
                                  if (clickedOnEmpty) {
                                    if (isCtrlPressed) return; // Stage draggable captures movement
                                    const stage = e.target.getStage();
                                    const pos = stage?.getRelativePointerPosition();

                                    if (activeTool === 'cursor') {
                                      setSelectedShapeIds([]);
                                      if (pos) {
                                        setSelectionStart(pos);
                                        setSelectionEnd(pos);
                                      }
                                    } else {
                                      setSelectedShapeIds([]);
                                      if (pos) {
                                        if (activeTool === 'seat' && activePaintTicketId) {
                                          const label = getNextSeatLabel(activePaintTicketId);
                                          setSeats([...seats, {
                                            id: uuidv4(),
                                            x: pos.x,
                                            y: pos.y,
                                            ticketTypeId: activePaintTicketId,
                                            label: label
                                          }]);
                                        } else if (activeTool === 'rect') {
                                          const newId = 'rect-' + uuidv4().slice(0, 8);
                                          setShapes([...shapes, {
                                            id: newId,
                                            type: 'rect',
                                            x: pos.x - 50,
                                            y: pos.y - 30,
                                            width: 100,
                                            height: 60,
                                            fill: shapeFill,
                                            rotation: 0,
                                            opacity: 0.8
                                          }]);
                                          setSelectedShapeIds([newId]);
                                        } else if (activeTool === 'text') {
                                          const newId = 'text-' + uuidv4().slice(0, 8);
                                          setShapes([...shapes, {
                                            id: newId,
                                            type: 'text',
                                            x: pos.x,
                                            y: pos.y,
                                            text: 'Nhãn Chữ',
                                            fill: shapeFill,
                                            fontSize: 16,
                                            rotation: 0
                                          }]);
                                          setSelectedShapeIds([newId]);
                                        }
                                      }
                                    }
                                  }
                                }}
                                onMouseMove={(e) => {
                                  if (selectionStart) {
                                    const stage = e.target.getStage();
                                    const pos = stage?.getRelativePointerPosition();
                                    if (pos) {
                                      setSelectionEnd(pos);
                                    }
                                  }
                                }}
                                onMouseUp={() => {
                                  if (selectionStart && selectionEnd) {
                                    const x1 = Math.min(selectionStart.x, selectionEnd.x);
                                    const y1 = Math.min(selectionStart.y, selectionEnd.y);
                                    const x2 = Math.max(selectionStart.x, selectionEnd.x);
                                    const y2 = Math.max(selectionStart.y, selectionEnd.y);

                                    // Rect overlapping condition
                                    const newlySelected = shapes.filter(s => {
                                      if (s.type === 'rect') {
                                        return (s.x < x2 && s.x + s.width > x1 && s.y < y2 && s.y + s.height > y1);
                                      } else if (s.type === 'text') {
                                        const approxW = (s.text || '').length * 10;
                                        const approxH = s.fontSize || 16;
                                        return (s.x < x2 && s.x + approxW > x1 && s.y < y2 && s.y + approxH > y1);
                                      }
                                      return false;
                                    }).map(s => s.id);

                                    setSelectedShapeIds(newlySelected);
                                  }
                                  setSelectionStart(null);
                                  setSelectionEnd(null);
                                }}
                              >
                                <Layer>
                                  {Array.from({ length: 20 }).map((_, i) => (
                                    <Rect key={'v' + i} x={i * 40} y={0} width={1} height={500} fill="#1e293b" opacity={0.3} />
                                  ))}
                                  {Array.from({ length: 15 }).map((_, i) => (
                                    <Rect key={'h' + i} x={0} y={i * 40} width={800} height={1} fill="#1e293b" opacity={0.3} />
                                  ))}

                                  {/* Render shapes */}
                                  {shapes.map((shape) => {
                                    if (shape.type === 'rect') {
                                      return (
                                        <Group
                                          key={shape.id}
                                          id={shape.id}
                                          x={shape.x}
                                          y={shape.y}
                                          rotation={shape.rotation}
                                          draggable
                                          onDragEnd={(e) => {
                                            const targetX = e.target.x();
                                            const targetY = e.target.y();
                                            setShapes(prev => prev.map(sh =>
                                              sh.id === shape.id ? { ...sh, x: targetX, y: targetY } : sh
                                            ));
                                          }}
                                          onTransformEnd={(e) => {
                                            const node = e.target;
                                            const scaleX = node.scaleX();
                                            const scaleY = node.scaleY();
                                            node.scaleX(1);
                                            node.scaleY(1);
                                            const newX = node.x();
                                            const newY = node.y();
                                            const newW = Math.max(5, node.width() * scaleX);
                                            const newH = Math.max(5, node.height() * scaleY);
                                            const newRot = node.rotation();
                                            setShapes(prev => prev.map(sh =>
                                              sh.id === shape.id ? {
                                                ...sh,
                                                x: newX,
                                                y: newY,
                                                width: newW,
                                                height: newH,
                                                rotation: newRot
                                              } : sh
                                            ));
                                          }}
                                          onClick={(e) => {
                                            e.cancelBubble = true;
                                            if (e.evt.shiftKey || e.evt.ctrlKey) {
                                              setSelectedShapeIds(prev => prev.includes(shape.id) ? prev.filter(id => id !== shape.id) : [...prev, shape.id]);
                                            } else {
                                              setSelectedShapeIds([shape.id]);
                                            }
                                          }}
                                        >
                                          <Rect
                                            x={0}
                                            y={0}
                                            width={shape.width}
                                            height={shape.height}
                                            fill={shape.fill}
                                            stroke={selectedShapeIds.includes(shape.id) ? '#3b82f6' : '#475569'}
                                            strokeWidth={selectedShapeIds.includes(shape.id) ? 2.5 : 1}
                                            opacity={shape.opacity || 0.8}
                                            cornerRadius={4}
                                          />
                                          {shape.labelText && (
                                            <Text
                                              x={2}
                                              y={0}
                                              width={shape.width - 4}
                                              height={shape.height}
                                              text={shape.labelText}
                                              fontSize={Math.max(8, Math.min(14, shape.height / 3.5))}
                                              fill="#ffffff"
                                              fontStyle="bold"
                                              align="center"
                                              verticalAlign="middle"
                                              listening={false}
                                              wrap="word"
                                              ellipsis={true}
                                            />
                                          )}
                                        </Group>
                                      );
                                    } else if (shape.type === 'text') {
                                      return (
                                        <Text
                                          key={shape.id}
                                          id={shape.id}
                                          x={shape.x}
                                          y={shape.y}
                                          text={shape.text}
                                          fontSize={shape.fontSize || 16}
                                          fill={shape.fill}
                                          rotation={shape.rotation}
                                          fontStyle="bold"
                                          draggable
                                          stroke={selectedShapeIds.includes(shape.id) ? '#3b82f6' : 'transparent'}
                                          strokeWidth={selectedShapeIds.includes(shape.id) ? 1.5 : 0}
                                          onDragEnd={(e) => {
                                            const targetX = e.target.x();
                                            const targetY = e.target.y();
                                            setShapes(prev => prev.map(sh =>
                                              sh.id === shape.id ? { ...sh, x: targetX, y: targetY } : sh
                                            ));
                                          }}
                                          onTransformEnd={(e) => {
                                            const node = e.target;
                                            const scaleX = node.scaleX();
                                            node.scaleX(1);
                                            const newX = node.x();
                                            const newY = node.y();
                                            const newSize = Math.max(8, (shape.fontSize || 16) * scaleX);
                                            const newRot = node.rotation();
                                            setShapes(prev => prev.map(sh =>
                                              sh.id === shape.id ? {
                                                ...sh,
                                                x: newX,
                                                y: newY,
                                                fontSize: newSize,
                                                rotation: newRot
                                              } : sh
                                            ));
                                          }}
                                          onClick={(e) => {
                                            e.cancelBubble = true;
                                            if (e.evt.shiftKey || e.evt.ctrlKey) {
                                              setSelectedShapeIds(prev => prev.includes(shape.id) ? prev.filter(id => id !== shape.id) : [...prev, shape.id]);
                                            } else {
                                              setSelectedShapeIds([shape.id]);
                                            }
                                          }}
                                        />
                                      );
                                    }
                                    return null;
                                  })}

                                  {selectedShapeIds.length > 0 && (
                                    <Transformer
                                      ref={trRef}
                                      rotateEnabled={true}
                                      rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                                      boundBoxFunc={(oldBox, newBox) => {
                                        if (newBox.width < 5 || newBox.height < 5) {
                                          return oldBox;
                                        }
                                        return newBox;
                                      }}
                                    />
                                  )}

                                  {/* Visual Rubber-Band Selection Rectangle */}
                                  {selectionStart && selectionEnd && (
                                    <Rect
                                      x={Math.min(selectionStart.x, selectionEnd.x)}
                                      y={Math.min(selectionStart.y, selectionEnd.y)}
                                      width={Math.abs(selectionStart.x - selectionEnd.x)}
                                      height={Math.abs(selectionStart.y - selectionEnd.y)}
                                      fill="rgba(59, 130, 246, 0.12)"
                                      stroke="#3b82f6"
                                      strokeWidth={1.5}
                                      dash={[4, 4]}
                                      listening={false}
                                    />
                                  )}

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
                                          e.cancelBubble = true;
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
