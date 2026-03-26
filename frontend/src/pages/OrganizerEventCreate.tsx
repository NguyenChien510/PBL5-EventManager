import { useState, useEffect, useRef } from 'react';
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

const categories = ['Âm nhạc', 'Công nghệ', 'Nghệ thuật', 'Giáo dục', 'Thể thao'];

const OrganizerEventCreate = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [mapPosition, setMapPosition] = useState<L.LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([10.762622, 106.660172]); // default HCMC
  
  // Custom dropdown state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Handle click outside for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const searchLocation = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = new L.LatLng(parseFloat(lat), parseFloat(lon));
        setMapPosition(newPos);
        setMapCenter(newPos);
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  const handleMapClick = async (latlng: L.LatLng) => {
    setMapPosition(latlng);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setSearchQuery(data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <DashboardLayout sidebarProps={organizerSidebarConfig}>
      <PageHeader title="Tạo Sự Kiện Mới" breadcrumb={['Sự kiện', 'Tạo sự kiện mới']} />
      <div className="p-8 max-w-5xl mx-auto">
        
        {/* Progress Bar */}
        <div className="mb-14 mt-4 px-2 sm:px-10">
          <div className="flex w-full relative z-0">
            {/* Background line */}
            <div className="absolute top-5 h-1 bg-slate-200 rounded-full -z-10" style={{ left: '12.5%', right: '12.5%' }}></div>
            
            {/* Active line */}
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
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Thông tin sự kiện</h2>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Tên sự kiện *</label>
                    <input type="text" placeholder="Nhập tên sự kiện..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Thể loại *</label>
                    <div className="relative" ref={categoryRef}>
                      <button 
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 hover:border-primary/50 rounded-xl text-left outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                      >
                        <span className="font-semibold text-slate-700">{selectedCategory}</span>
                        <Icon name={isCategoryOpen ? "expand_less" : "expand_more"} className="text-slate-400" />
                      </button>
                      
                      {isCategoryOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                selectedCategory === cat 
                                  ? 'bg-primary/5 text-primary font-bold' 
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Mô tả chi tiết *</label>
                    <textarea placeholder="Mô tả trải nghiệm sự kiện..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all min-h-[160px]" />
                  </div>
                </div>
                
                <div className="lg:col-span-3 flex flex-col">
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Ảnh bìa (Cover Image)</label>
                  <div className="flex-1 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group min-h-[300px]">
                    <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <Icon name="cloud_upload" className="text-primary text-3xl" />
                    </div>
                    <p className="text-base font-bold text-slate-700 mb-1">Tải ảnh sự kiện lên</p>
                    <p className="text-sm font-medium text-slate-400">PNG, JPG (Tối đa 5MB) - Tỉ lệ 16:9</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Time & Location */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Thời gian & Địa điểm</h2>
              <div className="space-y-8">
                {/* Time Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">Ngày bắt đầu</label>
                      <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">Giờ bắt đầu</label>
                      <input type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">Ngày kết thúc</label>
                      <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">Giờ kết thúc</label>
                      <input type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-200 w-full" />

                {/* Location Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Tìm kiếm và ghim trên bản đồ *</label>
                    <div className="flex gap-2 w-full">
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') searchLocation(); }}
                        placeholder="Nhập địa chỉ để tìm kiếm và ghim tự động..." 
                        className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all text-base font-medium" 
                      />
                      <button 
                        onClick={searchLocation}
                        className="px-6 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md flex items-center gap-2"
                      >
                        <Icon name="search" size="sm" /> Tìm kiếm
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 mt-3 font-medium">Bạn có thể kéo thả bản đồ và click trực tiếp để ghim vị trí chính xác nhất</p>
                  </div>
                  
                  <div className="w-full h-[450px] bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200 relative z-0 mt-4 shadow-sm">
                    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapUpdater center={mapCenter} />
                      <LocationPicker position={mapPosition} onPositionChange={handleMapClick} />
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tickets */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900">Thiết lập vé</h2>
                <button className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-2 text-sm">
                  <Icon name="add" size="sm" /> Thêm vé mới
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { type: 'Standard Ticket', price: '500.000', qty: '500' },
                  { type: 'VIP Access', price: '1.200.000', qty: '100' },
                ].map((ticket) => (
                  <div key={ticket.type} className="flex flex-col md:flex-row items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-primary/30 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Icon name="local_activity" className="text-primary" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Tên hiển thị</label>
                        <input defaultValue={ticket.type} className="w-full bg-transparent border-b border-slate-200 focus:border-primary outline-none py-1 font-bold text-slate-700" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Giá vé (VNĐ)</label>
                        <input defaultValue={ticket.price} className="w-full bg-transparent border-b border-slate-200 focus:border-primary outline-none py-1 font-bold text-slate-700" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Số lượng vé</label>
                        <input defaultValue={ticket.qty} className="w-full bg-transparent border-b border-slate-200 focus:border-primary outline-none py-1 font-bold text-slate-700" />
                      </div>
                    </div>
                    <button className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                      <Icon name="delete" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Publish */}
          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both max-w-2xl mx-auto text-center py-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="check_circle" className="text-green-500 text-5xl" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">Hoàn tất thiết lập!</h2>
              <p className="text-slate-500">Sự kiện của bạn đã sẵn sàng. Bạn có muốn lưu lại thành bản nháp hay gửi lên để chúng tôi kiểm duyệt ngay bây giờ?</p>
              
              <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100">
                <label className="text-sm font-bold text-slate-700 mb-3 block">Chế độ hiển thị</label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-primary transition-colors">
                    <input type="radio" name="visibility" className="w-4 h-4 text-primary focus:ring-primary" defaultChecked />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Công khai (Public)</p>
                      <p className="text-xs text-slate-500">Mọi người đều có thể tìm thấy và mua vé</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-primary transition-colors">
                    <input type="radio" name="visibility" className="w-4 h-4 text-primary focus:ring-primary" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Riêng tư (Private)</p>
                      <p className="text-xs text-slate-500">Chỉ những người có link mới có thể xem</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all flex items-center gap-2"
          >
            <Icon name="arrow_back" size="sm" /> Quay lại
          </button>
          
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">
              Lưu nháp
            </button>
            {currentStep < 4 ? (
              <button 
                onClick={nextStep}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/30 flex items-center gap-2"
              >
                Tiếp tục <Icon name="arrow_forward" size="sm" />
              </button>
            ) : (
              <button className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex items-center gap-2">
                <Icon name="publish" size="sm" /> Tạo sự kiện
              </button>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default OrganizerEventCreate
