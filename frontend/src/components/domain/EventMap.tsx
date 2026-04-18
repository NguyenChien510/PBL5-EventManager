import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface MapEvent {
  id: string;
  title: string;
  lat: number;
  lng: number;
  location: string;
  date: string;
}

interface EventMapProps {
  events: MapEvent[];
}

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <span className="font-semibold text-primary">Bạn đang ở đây</span>
      </Popup>
    </Marker>
  );
}

const EventMap = ({ events }: EventMapProps) => {
  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-sm border border-slate-200 z-0 relative">
      <MapContainer center={[10.762622, 106.660172]} zoom={13} scrollWheelZoom={false} className="h-full w-full z-0">
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
        />
        <LocationMarker />
        {events.map((event) => (
          <Marker key={event.id} position={[event.lat, event.lng]}>
            <Popup>
              <div className="font-sans min-w-[200px]">
                <h3 className="font-bold text-slate-900 leading-snug">{event.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{event.location}</p>
                <p className="text-sm font-semibold text-primary mt-2">{event.date}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default EventMap;
