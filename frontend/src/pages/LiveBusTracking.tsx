import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Bus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const busIcon = new L.DivIcon({
  html: `<div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-500 relative">
           <div class="absolute -inset-1 bg-blue-500/30 rounded-full animate-ping"></div>
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
         </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const collegeIcon = new L.DivIcon({
  html: `<div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
         </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

interface BusData {
  id: string;
  bus_number: string;
  route_name: string;
  type: string;
  position: [number, number];
  next_stop: string;
  eta: string;
}

const LiveBusTracking = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);

  const veltechCoords: [number, number] = [13.1818, 80.0401];

  const fetchBuses = () => {
    api.get('/campus/buses/live').then(r => {
      setBuses(r.data.buses || []);
      if (!selectedBus && r.data.buses?.length > 0) {
        setSelectedBus(r.data.buses[0]);
      } else if (selectedBus) {
        const updated = r.data.buses.find((b:any) => b.id === selectedBus.id);
        if (updated) setSelectedBus(updated);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 3000); // Poll every 3 seconds for live simulation
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="p-4 pt-12 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button onClick={() => navigate('/campus')} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white/30 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white shadow-sm">Live Bus Tracker</h1>
            <p className="text-[10px] text-blue-200 shadow-sm font-medium uppercase tracking-wider">Campus Shuttles</p>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer center={veltechCoords} zoom={15} className="w-full h-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* College Marker */}
          <Marker position={veltechCoords} icon={collegeIcon}>
            <Popup>
              <div className="font-bold text-slate-800">Vel Tech Campus</div>
              <div className="text-xs text-slate-500">Main Gate</div>
            </Popup>
          </Marker>

          {/* Bus Markers */}
          {buses.map(bus => (
            <Marker key={bus.id} position={bus.position} icon={busIcon} eventHandlers={{ click: () => setSelectedBus(bus) }}>
              <Popup>
                <div className="font-bold text-slate-800">{bus.bus_number} - {bus.route_name}</div>
                <div className="text-xs text-emerald-600 font-bold mt-1">ETA: {bus.eta}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Selected Bus Info Panel */}
      {selectedBus && (
        <div className="absolute bottom-20 left-4 right-4 z-20 animate-slide-up">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center border border-blue-200">
                  <Bus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black">{selectedBus.bus_number}</h3>
                  <p className="text-slate-500 text-xs font-bold">{selectedBus.route_name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-emerald-500 justify-end mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-black text-xl">{selectedBus.eta.split(' ')[0]}</span>
                  <span className="text-xs font-bold mt-1">min</span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Next Stop: {selectedBus.next_stop}</p>
              </div>
            </div>
            
            {/* Bus Picker */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {buses.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBus(b)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedBus.id === b.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {b.bus_number}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default LiveBusTracking;
