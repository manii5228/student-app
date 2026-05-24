import React, { useState } from 'react';
import { ChevronLeft, Search, MapPin, Coffee, BookOpen, Monitor, Home, Shield, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// POIs for Vel Tech Campus
const POIS = [
  { id: '1', name: 'Main Block', type: 'academic', coords: [13.1818, 80.0401] as [number, number], icon: <Monitor className="w-5 h-5 text-indigo-600" />, color: 'bg-indigo-100 border-indigo-500', desc: 'Administrative & CS Depts' },
  { id: '2', name: 'Central Library', type: 'library', coords: [13.1815, 80.0410] as [number, number], icon: <BookOpen className="w-5 h-5 text-blue-600" />, color: 'bg-blue-100 border-blue-500', desc: 'Study Hub & Resources' },
  { id: '3', name: 'Main Canteen', type: 'food', coords: [13.1825, 80.0405] as [number, number], icon: <Coffee className="w-5 h-5 text-orange-600" />, color: 'bg-orange-100 border-orange-500', desc: 'Food Court & Cafe' },
  { id: '4', name: 'Leaders Hostel', type: 'hostel', coords: [13.1850, 80.0350] as [number, number], icon: <Home className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-100 border-emerald-500', desc: 'Boys Hostel A' },
  { id: '5', name: 'Princes Hostel', type: 'hostel', coords: [13.1900, 80.0300] as [number, number], icon: <Home className="w-5 h-5 text-teal-600" />, color: 'bg-teal-100 border-teal-500', desc: 'Boys Hostel B' },
  { id: '6', name: 'Kings Hostel', type: 'hostel', coords: [13.1800, 80.0450] as [number, number], icon: <Home className="w-5 h-5 text-cyan-600" />, color: 'bg-cyan-100 border-cyan-500', desc: 'Boys Hostel C' },
  { id: '7', name: 'Main Gate Security', type: 'security', coords: [13.1810, 80.0390] as [number, number], icon: <Shield className="w-5 h-5 text-red-600" />, color: 'bg-red-100 border-red-500', desc: 'Campus Entrance' },
];

const createCustomIcon = (poi: typeof POIS[0]) => {
  const iconHtml = `
    <div class="w-10 h-10 ${poi.color} border-2 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
      ${document.createElement('div').appendChild(poi.icon as any)?.outerHTML || ''}
    </div>
  `;
  return new L.DivIcon({
    html: iconHtml,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, 17, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
};

const CampusMap = () => {
  const navigate = useNavigate();
  const [activePoi, setActivePoi] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.1818, 80.0401]);
  const [search, setSearch] = useState('');

  const filteredPois = POIS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const selectedObj = POIS.find(p => p.id === activePoi);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-slate-900 p-6 pt-12 shadow-md relative z-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Campus Map</h1>
              <p className="text-xs text-slate-300">Vel Tech University</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search blocks, hostels, canteens..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/10 text-white placeholder:text-slate-400 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer center={mapCenter} zoom={16} className="w-full h-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={mapCenter} />

          {/* Dynamic Markers */}
          {filteredPois.map(poi => (
            <Marker 
              key={poi.id} 
              position={poi.coords} 
              icon={createCustomIcon(poi)}
              eventHandlers={{
                click: () => {
                  setActivePoi(poi.id);
                  setMapCenter(poi.coords);
                }
              }}
            >
              <Popup className="rounded-xl overflow-hidden shadow-xl">
                <div className="font-bold text-slate-900">{poi.name}</div>
                <div className="text-xs text-slate-500 font-medium">{poi.desc}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Navigation Panel */}
      <div className={`absolute bottom-20 left-4 right-4 z-20 transition-all duration-300 ${selectedObj ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {selectedObj && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${selectedObj.color} flex items-center justify-center shrink-0`}>
                {selectedObj.icon}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedObj.name}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">{selectedObj.desc}</p>
              </div>
            </div>
            <button className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all shrink-0">
              <Navigation className="w-5 h-5 fill-white" />
            </button>
          </div>
        )}
      </div>

      {/* Floating Filters */}
      {!selectedObj && (
        <div className="absolute bottom-20 left-0 right-0 z-10 flex overflow-x-auto px-4 gap-2 pb-2 hide-scrollbar">
          {['Academic', 'Hostel', 'Food', 'Library', 'Security'].map(f => (
            <button key={f} onClick={() => setSearch(f)} className="px-4 py-2 bg-slate-900/90 backdrop-blur text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap active:scale-95 transition-transform">
              {f}
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CampusMap;
