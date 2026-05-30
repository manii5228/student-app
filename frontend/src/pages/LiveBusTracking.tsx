import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Bus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom div icons
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

const hostelIcon = new L.DivIcon({
  html: `<div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
         </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Coords & Routes definitions
const veltechCoords: [number, number] = [13.1818, 80.0401];

const ROUTES = {
  Leaders: [
    [13.1880, 80.0350] as [number, number],
    [13.1865, 80.0360] as [number, number],
    [13.1850, 80.0375] as [number, number],
    [13.1835, 80.0390] as [number, number],
    [13.1818, 80.0401] as [number, number]
  ],
  Princes: [
    [13.1940, 80.0280] as [number, number],
    [13.1915, 80.0305] as [number, number],
    [13.1885, 80.0335] as [number, number],
    [13.1850, 80.0370] as [number, number],
    [13.1818, 80.0401] as [number, number]
  ],
  Kings: [
    [13.1760, 80.0500] as [number, number],
    [13.1780, 80.0470] as [number, number],
    [13.1795, 80.0440] as [number, number],
    [13.1810, 80.0415] as [number, number],
    [13.1818, 80.0401] as [number, number]
  ]
};

const SCHEDULES = {
  Leaders: ['08:45', '09:45', '10:45', '11:45', '12:45', '13:45', '14:45', '15:45', '16:45', '17:45', '18:45', '19:45'],
  Princes: ['08:30', '10:30', '12:30', '14:30', '16:30', '18:30', '20:30'],
  Kings: ['08:30', '12:30', '16:30', '20:30']
};

interface BusState {
  id: string;
  bus_number: string;
  route_name: string;
  type: 'Leaders' | 'Princes' | 'Kings';
  progress: number;
  direction: number; // 1 = to college, -1 = to hostel
  speed: number;
}

const interpolatePath = (coords: [number, number][], progress: number): [number, number] => {
  if (coords.length === 0) return [0, 0];
  if (coords.length === 1) return coords[0];
  const segments = coords.length - 1;
  const rawIndex = progress * segments;
  const index = Math.floor(rawIndex);
  const segmentProgress = rawIndex - index;
  
  if (index >= segments) return coords[coords.length - 1];
  
  const start = coords[index];
  const end = coords[index + 1];
  return [
    start[0] + (end[0] - start[0]) * segmentProgress,
    start[1] + (end[1] - start[1]) * segmentProgress
  ];
};

const LiveBusTracking = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<BusState[]>([
    { id: 'b1', bus_number: 'L-1', route_name: 'Leaders Hostel Line A', type: 'Leaders', progress: 0.1, direction: 1, speed: 0.006 },
    { id: 'b2', bus_number: 'L-2', route_name: 'Leaders Hostel Line B', type: 'Leaders', progress: 0.6, direction: -1, speed: 0.005 },
    { id: 'b3', bus_number: 'P-1', route_name: 'Princes Hostel Line', type: 'Princes', progress: 0.35, direction: 1, speed: 0.004 },
    { id: 'b4', bus_number: 'K-1', route_name: 'Kings Hostel Line', type: 'Kings', progress: 0.75, direction: -1, speed: 0.003 }
  ]);
  const [selectedBusId, setSelectedBusId] = useState<string>('b1');
  const [tab, setTab] = useState<'hosteller' | 'dayscholer'>('hosteller');

  const selectedBus = buses.find(b => b.id === selectedBusId) || buses[0];

  // Smooth position interpolation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setBuses(prev => 
        prev.map(b => {
          let nextProgress = b.progress + b.speed * b.direction;
          let nextDirection = b.direction;
          
          if (nextProgress >= 1) {
            nextProgress = 1;
            nextDirection = -1;
          } else if (nextProgress <= 0) {
            nextProgress = 0;
            nextDirection = 1;
          }
          return {
            ...b,
            progress: nextProgress,
            direction: nextDirection
          };
        })
      );
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const getBusETA = (b: BusState) => {
    const remaining = b.direction === 1 ? (1 - b.progress) : b.progress;
    return Math.max(1, Math.ceil(remaining * 15));
  };

  const getBusStatus = (b: BusState) => {
    if (b.progress < 0.15) {
      return b.direction === 1 ? `Near ${b.type} Hostel (Departing)` : `Near ${b.type} Hostel (Arrived)`;
    }
    if (b.progress > 0.85) {
      return b.direction === 1 ? `Near College Gate (Arrived)` : `Near College Gate (Departing)`;
    }
    return b.direction === 1 ? 'On the way to College' : `On the way to ${b.type} Hostel`;
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="p-4 pt-12 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-transparent pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const role = JSON.parse(localStorage.getItem('user') || '{}').role;
              if (role === 'faculty') navigate('/faculty');
              else if (role === 'admin') navigate('/admin');
              else navigate(-1);
            }} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white shadow-sm">Live Bus Tracker</h1>
              <p className="text-[10px] text-blue-200 shadow-sm font-medium uppercase tracking-wider">Campus Shuttles</p>
            </div>
          </div>
          
          <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setTab('hosteller')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${tab === 'hosteller' ? 'bg-white text-slate-950 shadow-sm' : 'text-white'}`}
            >
              Hosteller
            </button>
            <button 
              onClick={() => setTab('dayscholer')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${tab === 'dayscholer' ? 'bg-white text-slate-950 shadow-sm' : 'text-white'}`}
            >
              Dayscholer
            </button>
          </div>
        </div>
      </div>

      {tab === 'hosteller' ? (
        <>
          {/* Map Area */}
          <div className="flex-1 relative z-0 min-h-[480px] h-[calc(100vh-280px)]">
            <MapContainer center={veltechCoords} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* College Gate Marker */}
              <Marker position={veltechCoords} icon={collegeIcon}>
                <Popup>
                  <div className="font-bold text-slate-800">Vel Tech University</div>
                  <div className="text-xs text-slate-500">Main Campus Entrance</div>
                </Popup>
              </Marker>

              {/* Hostels Markers */}
              <Marker position={ROUTES.Leaders[0]} icon={hostelIcon}>
                <Popup>
                  <div className="font-bold text-slate-800">Leaders Hostel</div>
                  <div className="text-xs text-slate-500">Boys Hostel A</div>
                </Popup>
              </Marker>
              <Marker position={ROUTES.Princes[0]} icon={hostelIcon}>
                <Popup>
                  <div className="font-bold text-slate-800">Princes Hostel</div>
                  <div className="text-xs text-slate-500">Boys Hostel B</div>
                </Popup>
              </Marker>
              <Marker position={ROUTES.Kings[0]} icon={hostelIcon}>
                <Popup>
                  <div className="font-bold text-slate-800">Kings Hostel</div>
                  <div className="text-xs text-slate-500">Boys Hostel C</div>
                </Popup>
              </Marker>

              {/* Route Polylines */}
              {Object.entries(ROUTES).map(([key, coords]) => {
                const isSelected = selectedBus.type === key;
                return (
                  <Polyline 
                    key={key} 
                    positions={coords} 
                    pathOptions={{
                      color: isSelected ? '#2563eb' : '#94a3b8',
                      weight: isSelected ? 4 : 2,
                      dashArray: isSelected ? undefined : '5, 5',
                      opacity: isSelected ? 0.8 : 0.4
                    }}
                  />
                );
              })}

              {/* Smooth Animated Bus Markers */}
              {buses.map(bus => {
                const currentPos = interpolatePath(ROUTES[bus.type], bus.progress);
                return (
                  <Marker 
                    key={bus.id} 
                    position={currentPos} 
                    icon={busIcon} 
                    eventHandlers={{ click: () => setSelectedBusId(bus.id) }}
                  >
                    <Popup>
                      <div className="font-bold text-slate-800">{bus.bus_number} ({bus.type} Route)</div>
                      <div className="text-xs font-semibold text-slate-500 mt-0.5">{getBusStatus(bus)}</div>
                      <div className="text-xs text-emerald-600 font-bold mt-1">ETA: {getBusETA(bus)} mins</div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Selected Bus Info Panel & Schedules Drawer */}
          <div className="absolute bottom-20 left-4 right-4 z-20 animate-slide-up flex flex-col gap-2">
            
            {/* Main Info */}
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[28px] p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center border border-blue-200">
                    <Bus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-black flex items-center gap-1.5">
                      {selectedBus.bus_number} 
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                        {selectedBus.type}
                      </span>
                    </h3>
                    <p className="text-slate-500 text-xs font-bold truncate max-w-[150px]">{getBusStatus(selectedBus)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-500 justify-end mb-0.5">
                    <Clock className="w-4 h-4" />
                    <span className="font-black text-xl">{getBusETA(selectedBus)}</span>
                    <span className="text-xs font-bold mt-1">min</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {selectedBus.direction === 1 ? 'Heading to College' : `Heading to ${selectedBus.type}`}
                  </p>
                </div>
              </div>

              {/* Schedules */}
              <div className="mb-4 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hourly Route Schedules</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                  {SCHEDULES[selectedBus.type].map((time, idx) => (
                    <span key={idx} className="shrink-0 bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Bus Picker Tab */}
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar border-t border-slate-100 pt-3">
                {buses.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBusId(b.id)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedBusId === b.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {b.bus_number} ({b.type})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
            <Bus className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Dayscholer Shuttles</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
            Dayscholer route timetables and live tracking details are currently under schedule synchronization.
          </p>
          <span className="mt-4 px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Coming in next phase
          </span>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default LiveBusTracking;
