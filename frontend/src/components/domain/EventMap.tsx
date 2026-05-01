import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

export interface MapEvent {
  id: string;
  title: string;
  lat: number;
  lng: number;
  location: string;
  date: string;
  time?: string;
  image?: string;
}

interface EventMapProps {
  events: MapEvent[];
}

// Custom "Beautiful" Icon using DivIcon
const createCustomIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative group">
        <div class="w-10 h-10 bg-white rounded-2xl shadow-xl border-2 border-primary flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">
          <div class="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor" class="text-primary">
              <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q319-215 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 113-79.5 232.5T480-80Z"/>
            </svg>
          </div>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-primary rotate-45 transform"></div>
      </div>
    `,
    className: 'custom-marker-icon',
    iconSize: [40, 44],
    iconAnchor: [20, 44],
    popupAnchor: [0, -44],
  });
};

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 14);
    });
  }, [map]);

  const userIcon = L.divIcon({
    html: `
      <div class="relative">
        <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
        <div class="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
      </div>
    `,
    className: 'user-location-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <span className="font-bold text-primary">Vị trí của bạn</span>
      </Popup>
    </Marker>
  );
}

const EventMap = ({ events }: EventMapProps) => {
  const navigate = useNavigate();
  const customIcon = createCustomIcon();
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const handleLocateMe = () => {
    if (mapInstance) {
      mapInstance.locate({ setView: true, maxZoom: 14 });
    }
  };

  useEffect(() => {
    if (mapInstance) {
      handleLocateMe();
    }
  }, [mapInstance]);

  return (
    <div className="w-full h-[450px] md:h-[550px] rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-200 z-0 relative group/map map-3d-container bg-slate-900">
      <MapContainer 
        center={[10.762622, 106.660172]} 
        zoom={13} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0 blue-map-filter"
        ref={setMapInstance}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <LocationMarker />
        {events.map((event) => (
          <Marker 
            key={event.id} 
            position={[event.lat, event.lng]} 
            icon={customIcon}
            eventHandlers={{
              mouseover: (e) => {
                e.target.openPopup();
              },
              click: () => {
                navigate(`/event/${event.id}`);
              }
            }}
          >
            <Popup closeButton={false} className="custom-event-popup">
              <div 
                className="w-[220px] bg-white rounded-2xl overflow-hidden cursor-pointer group/popup"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                <div className="h-24 w-full relative overflow-hidden">
                  <img 
                    src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop'} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover/popup:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-2 left-3">
                    <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase rounded-md tracking-tighter">Sắp diễn ra</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-black text-slate-900 text-sm leading-tight mb-1 line-clamp-2 group-hover/popup:text-primary transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                      <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q319-215 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 113-79.5 232.5T480-80Z"/>
                    </svg>
                    <span className="text-[10px] font-bold line-clamp-1">{event.location}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                        <path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm40 320q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-280Z"/>
                      </svg>
                      <span className="text-[11px] font-black">{event.date} • {event.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Locate Me Button */}
      <button 
        onClick={handleLocateMe}
        className="absolute bottom-6 right-6 z-[1000] w-12 h-12 bg-white rounded-2xl shadow-2xl border border-slate-200 flex items-center justify-center text-primary hover:bg-slate-50 transition-all hover:scale-110 active:scale-95 group"
        title="Định vị của tôi"
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" class="group-hover:rotate-12 transition-transform">
          <path d="M440-42l-80-249-249-80 691-282-282 691Zm44-188 126-308-308 126 130 42 52 140Z"/>
        </svg>
      </button>
    </div>
  );
};

export default EventMap;
