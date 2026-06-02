import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MapPin, Bus, Clock, Navigation2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map invalidation sizing helper to fix Leaflet rendering issues
const MapInvalidateSize = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Custom div icons
const busIcon = new L.DivIcon({
  html: `<div style="width:44px;height:44px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.25);border:3px solid #3b82f6;position:relative;">
           <div style="position:absolute;inset:-4px;background:rgba(59,130,246,0.25);border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
           <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
         </div>`,
  className: 'bg-transparent border-none',
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

const collegeIcon = new L.DivIcon({
  html: `<div style="width:36px;height:36px;background:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.2);border:3px solid white;">
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
         </div>`,
  className: 'bg-transparent border-none',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const createHostelIcon = (label: string, color: string) => new L.DivIcon({
  html: `<div style="display:flex;flex-direction:column;align-items:center;">
           <div style="width:36px;height:36px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.2);border:3px solid white;">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           </div>
           <span style="background:${color};color:white;font-size:9px;font-weight:800;padding:2px 6px;border-radius:6px;margin-top:3px;white-space:nowrap;letter-spacing:0.05em;box-shadow:0 2px 6px rgba(0,0,0,0.15);">${label}</span>
         </div>`,
  className: 'bg-transparent border-none',
  iconSize: [36, 50],
  iconAnchor: [18, 25]
});

const leadersIcon = createHostelIcon('LEADERS', '#6366f1');
const princesIcon = createHostelIcon('PRINCES', '#f59e0b');
const kingsIcon = createHostelIcon('KINGS', '#ef4444');

// Coords & Routes definitions
const veltechCoords: [number, number] = [13.1818, 80.0401];

const ROUTES: Record<string, [number, number][]> = {
  Leaders: [
    [13.1880, 80.0350],
    [13.1865, 80.0360],
    [13.1850, 80.0375],
    [13.1835, 80.0390],
    [13.1818, 80.0401]
  ],
  Princes: [
    [13.1940, 80.0280],
    [13.1915, 80.0305],
    [13.1885, 80.0335],
    [13.1850, 80.0370],
    [13.1818, 80.0401]
  ],
  Kings: [
    [13.1760, 80.0500],
    [13.1780, 80.0470],
    [13.1795, 80.0440],
    [13.1810, 80.0415],
    [13.1818, 80.0401]
  ]
};

const ROUTE_COLORS: Record<string, string> = {
  Leaders: '#6366f1',
  Princes: '#f59e0b',
  Kings: '#ef4444'
};

// Schedule times displayed at the top
const SCHEDULES: Record<string, string[]> = {
  Leaders: ['08:30', '10:30', '12:30', '14:30', '16:30', '18:30', '20:30'],
  Princes: ['08:30', '10:30', '12:30', '14:30', '16:30', '18:30', '20:30'],
  Kings: ['08:30', '10:30', '12:30', '14:30', '16:30', '18:30', '20:30']
};

// Approximate distances in km from each hostel to college
const HOSTEL_DISTANCES: Record<string, number> = {
  Leaders: 1.2,
  Princes: 2.1,
  Kings: 1.5
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

// Calculate distance between two lat/lng points (Haversine formula) in km
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Component that flies map to selected bus
const FlyToBus = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 15, { animate: true, duration: 1 });
  }, []);
  return null;
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
  const [selectedHostel, setSelectedHostel] = useState<string>('Leaders');

  // Live seconds countdown state
  const [etaSeconds, setEtaSeconds] = useState<Record<string, number>>({});
  const etaSecondsRef = useRef<Record<string, number>>({});

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

  // Compute ETA in seconds for all buses
  useEffect(() => {
    const computeETAs = () => {
      const newETAs: Record<string, number> = {};
      buses.forEach(b => {
        const remaining = b.direction === 1 ? (1 - b.progress) : b.progress;
        // Total trip ~ 15 minutes = 900 seconds
        const totalSec = Math.max(1, Math.round(remaining * 900));
        newETAs[b.id] = totalSec;
      });
      etaSecondsRef.current = newETAs;
      setEtaSeconds({ ...newETAs });
    };
    computeETAs();
  }, [buses]);

  // Tick down ETAs every second for smooth countdown
  useEffect(() => {
    const ticker = setInterval(() => {
      setEtaSeconds(prev => {
        const next: Record<string, number> = {};
        Object.keys(prev).forEach(k => {
          next[k] = Math.max(0, prev[k] - 1);
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const formatETA = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return { mins, secs };
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

  // Get current time for highlighting schedule
  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  // Filter buses by selected hostel
  const filteredBuses = buses.filter(b => b.type === selectedHostel);

  const getBusDistanceFromHostel = (b: BusState) => {
    const currentPos = interpolatePath(ROUTES[b.type], b.progress);
    const hostelPos = ROUTES[b.type][0];
    return haversineDistance(currentPos[0], currentPos[1], hostelPos[0], hostelPos[1]).toFixed(2);
  };

  const getBusDistanceFromCollege = (b: BusState) => {
    const currentPos = interpolatePath(ROUTES[b.type], b.progress);
    return haversineDistance(currentPos[0], currentPos[1], veltechCoords[0], veltechCoords[1]).toFixed(2);
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
          {/* Schedule Times Bar at top */}
          <div className="absolute top-28 left-0 right-0 z-20 pointer-events-auto px-3">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{selectedHostel} Schedule</p>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar">
                {SCHEDULES[selectedHostel].map((time, idx) => {
                  const isPast = time < currentHHMM;
                  const isNext = !isPast && (idx === 0 || SCHEDULES[selectedHostel][idx-1] < currentHHMM);
                  return (
                    <span key={idx} className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      isNext ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 scale-105' :
                      isPast ? 'bg-slate-100 text-slate-400 border-slate-100 line-through' :
                      'bg-white text-slate-600 border-slate-200'
                    }`}>
                      {time}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hostel Tabs (Leaders / Princes / Kings) */}
          <div className="absolute top-[172px] left-3 right-3 z-20 pointer-events-auto">
            <div className="flex gap-2 bg-white/90 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg border border-white/80">
              {(['Leaders', 'Princes', 'Kings'] as const).map(hostel => {
                const color = hostel === 'Leaders' ? 'indigo' : hostel === 'Princes' ? 'amber' : 'red';
                const isActive = selectedHostel === hostel;
                const busCount = buses.filter(b => b.type === hostel).length;
                return (
                  <button
                    key={hostel}
                    onClick={() => {
                      setSelectedHostel(hostel);
                      const firstBus = buses.find(b => b.type === hostel);
                      if (firstBus) setSelectedBusId(firstBus.id);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                      isActive 
                        ? `bg-${color}-600 text-white shadow-md` 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                    style={isActive ? { background: ROUTE_COLORS[hostel] } : {}}
                  >
                    <span className="font-black">{hostel}</span>
                    <span className={`text-[9px] ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{busCount} bus{busCount > 1 ? 'es' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative z-0 min-h-[480px] h-[calc(100vh-280px)]">
            <MapContainer center={veltechCoords} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <MapInvalidateSize />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* College Gate Marker */}
              <Marker position={veltechCoords} icon={collegeIcon}>
                <Popup>
                  <div style={{fontWeight:'bold', color:'#1e293b'}}>Vel Tech University</div>
                  <div style={{fontSize:'11px', color:'#64748b'}}>Main Campus Entrance</div>
                </Popup>
              </Marker>

              {/* Hostels Markers with named icons */}
              <Marker position={ROUTES.Leaders[0]} icon={leadersIcon}>
                <Popup>
                  <div style={{fontWeight:'bold', color:'#1e293b'}}>Leaders Hostel</div>
                  <div style={{fontSize:'11px', color:'#64748b'}}>Distance to College: {HOSTEL_DISTANCES.Leaders} km</div>
                </Popup>
              </Marker>
              <Marker position={ROUTES.Princes[0]} icon={princesIcon}>
                <Popup>
                  <div style={{fontWeight:'bold', color:'#1e293b'}}>Princes Hostel</div>
                  <div style={{fontSize:'11px', color:'#64748b'}}>Distance to College: {HOSTEL_DISTANCES.Princes} km</div>
                </Popup>
              </Marker>
              <Marker position={ROUTES.Kings[0]} icon={kingsIcon}>
                <Popup>
                  <div style={{fontWeight:'bold', color:'#1e293b'}}>Kings Hostel</div>
                  <div style={{fontSize:'11px', color:'#64748b'}}>Distance to College: {HOSTEL_DISTANCES.Kings} km</div>
                </Popup>
              </Marker>

              {/* Route Polylines */}
              {Object.entries(ROUTES).map(([key, coords]) => {
                const isSelected = selectedHostel === key;
                return (
                  <Polyline 
                    key={key} 
                    positions={coords} 
                    pathOptions={{
                      color: isSelected ? ROUTE_COLORS[key] : '#94a3b8',
                      weight: isSelected ? 5 : 2,
                      dashArray: isSelected ? undefined : '5, 5',
                      opacity: isSelected ? 0.9 : 0.3
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
                    eventHandlers={{ click: () => { setSelectedBusId(bus.id); setSelectedHostel(bus.type); } }}
                  >
                    <Popup>
                      <div style={{fontWeight:'bold', color:'#1e293b'}}>{bus.bus_number} ({bus.type} Route)</div>
                      <div style={{fontSize:'11px', fontWeight:600, color:'#64748b', marginTop:'2px'}}>{getBusStatus(bus)}</div>
                      <div style={{fontSize:'11px', color:'#10b981', fontWeight:'bold', marginTop:'4px'}}>
                        📍 {getBusDistanceFromCollege(bus)} km from college
                      </div>
                      <div style={{fontSize:'11px', color:'#6366f1', fontWeight:'bold'}}>
                        🏠 {getBusDistanceFromHostel(bus)} km from {bus.type} Hostel
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Selected Bus Info Panel */}
          <div className="absolute bottom-20 left-3 right-3 z-20 animate-slide-up flex flex-col gap-2">
            
            {/* Main Info */}
            <div className="bg-white/95 backdrop-blur-xl border border-white rounded-[28px] p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2" style={{ background: `${ROUTE_COLORS[selectedBus.type]}15`, borderColor: `${ROUTE_COLORS[selectedBus.type]}40` }}>
                    <Bus className="w-6 h-6" style={{ color: ROUTE_COLORS[selectedBus.type] }} />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-black flex items-center gap-1.5">
                      {selectedBus.bus_number} 
                      <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold text-white" style={{ background: ROUTE_COLORS[selectedBus.type] }}>
                        {selectedBus.type}
                      </span>
                    </h3>
                    <p className="text-slate-500 text-xs font-bold truncate max-w-[150px]">{getBusStatus(selectedBus)}</p>
                  </div>
                </div>
                <div className="text-right">
                  {/* Live seconds countdown */}
                  <div className="flex items-center gap-1 justify-end mb-0.5" style={{ color: ROUTE_COLORS[selectedBus.type] }}>
                    <Clock className="w-4 h-4" />
                    <span className="font-black text-xl tabular-nums">
                      {formatETA(etaSeconds[selectedBus.id] || 0).mins}
                    </span>
                    <span className="text-[10px] font-bold mt-1">m</span>
                    <span className="font-black text-xl tabular-nums">
                      {String(formatETA(etaSeconds[selectedBus.id] || 0).secs).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-bold mt-1">s</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {selectedBus.direction === 1 ? 'Heading to College' : `Heading to ${selectedBus.type}`}
                  </p>
                </div>
              </div>

              {/* Distance Info */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">From College</p>
                  <p className="text-sm font-black text-slate-800">{getBusDistanceFromCollege(selectedBus)} km</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">From {selectedBus.type}</p>
                  <p className="text-sm font-black text-slate-800">{getBusDistanceFromHostel(selectedBus)} km</p>
                </div>
              </div>
              
              {/* Bus Picker Tab for selected hostel */}
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar border-t border-slate-100 pt-3">
                {filteredBuses.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBusId(b.id)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedBusId === b.id 
                        ? 'text-white shadow-md' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    style={selectedBusId === b.id ? { background: ROUTE_COLORS[b.type] } : {}}
                  >
                    {b.bus_number}
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
