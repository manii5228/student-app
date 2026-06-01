import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, MapPin, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// POIs for Vel Tech Campus
const POIS = [
  { id: 'admin', name: 'Administrative Block (Block 10)', type: 'academic', coords: [13.1818, 80.0401] as [number, number], desc: 'Registrar, Admission Office & Finance Dept' },
  { id: 'block24', name: 'Block 24 (CSE & IT Dept)', type: 'academic', coords: [13.1825, 80.0385] as [number, number], desc: 'Computer Science HOD Room & Dept Offices' },
  { id: 'block1', name: 'Block 1 (ECE Dept)', type: 'academic', coords: [13.1805, 80.0410] as [number, number], desc: 'Electronics Dept & Faculty Rooms' },
  { id: 'block2', name: 'Block 2 (Mechanical Dept)', type: 'academic', coords: [13.1835, 80.0415] as [number, number], desc: 'Mechanical Workshops & Labs' },
  { id: 'cselab1', name: 'CSE Advanced Research Lab', type: 'lab', coords: [13.1827, 80.0383] as [number, number], desc: 'Block 24, Floor 1 - AI & Cloud Lab' },
  { id: 'cselab2', name: 'CSE Programming Lab 3', type: 'lab', coords: [13.1823, 80.0387] as [number, number], desc: 'Block 24, Floor 2 - Java & Web Coding' },
  { id: 'physlab', name: 'Engineering Physics Lab', type: 'lab', coords: [13.1833, 80.0417] as [number, number], desc: 'Block 2, Floor 1 - Optics & Lasers' },
  { id: 'lib', name: 'Central Library', type: 'library', coords: [13.1815, 80.0410] as [number, number], desc: 'Study Hub, e-Resources & Archives' },
  { id: 'canteen1', name: 'Main Food Court (Canteen)', type: 'food', coords: [13.1825, 80.0405] as [number, number], desc: 'South/North Indian Meals & Fast Food' },
  { id: 'canteen2', name: 'Block 24 Nescafe Station', type: 'food', coords: [13.1824, 80.0386] as [number, number], desc: 'Coffee, snacks, & quick bites' },
  { id: 'rest1', name: 'Block 24 Restrooms (Floor 1)', type: 'restroom', coords: [13.1826, 80.0384] as [number, number], desc: 'Gents & Ladies Restrooms' },
  { id: 'rest2', name: 'Admin Block Restrooms (Lobby)', type: 'restroom', coords: [13.1819, 80.0400] as [number, number], desc: 'Main floor restrooms' },
];

const STARTING_POINTS = [
  { id: 'maingate', name: 'Main Security Gate', coords: [13.1810, 80.0390] as [number, number] },
  { id: 'adminlobby', name: 'Admin Block Entrance Lobby', coords: [13.1818, 80.0401] as [number, number] },
  { id: 'block24lobby', name: 'Block 24 Ground Floor Lobby', coords: [13.1825, 80.0385] as [number, number] }
];

const POI_STYLES: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
  academic: { bg: '#eef2ff', border: '#818cf8', text: '#4f46e5', emoji: '🏫' },
  lab: { bg: '#faf5ff', border: '#a78bfa', text: '#7c3aed', emoji: '🔬' },
  library: { bg: '#eff6ff', border: '#60a5fa', text: '#2563eb', emoji: '📚' },
  food: { bg: '#fff7ed', border: '#fb923c', text: '#ea580c', emoji: '🍽️' },
  restroom: { bg: '#fdf2f8', border: '#f472b6', text: '#db2777', emoji: '🚻' },
};

// Create POI icons with inline styles (not Tailwind) so they render correctly in Leaflet
const createCustomIcon = (poi: typeof POIS[0]) => {
  const style = POI_STYLES[poi.type] || POI_STYLES.academic;
  const iconHtml = `
    <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
      <div style="width:38px;height:38px;background:${style.bg};border:2.5px solid ${style.border};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.15);font-size:18px;line-height:1;">
        ${style.emoji}
      </div>
      <div style="background:${style.text};color:white;font-size:8px;font-weight:800;padding:2px 5px;border-radius:4px;margin-top:3px;max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.15);">
        ${poi.name.split('(')[0].trim().substring(0, 16)}
      </div>
    </div>
  `;
  return new L.DivIcon({
    html: iconHtml,
    className: '',
    iconSize: [80, 56],
    iconAnchor: [40, 28],
    popupAnchor: [0, -28]
  });
};

const startIcon = new L.DivIcon({
  html: `<div style="display:flex;flex-direction:column;align-items:center;">
           <div style="width:32px;height:32px;background:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.2);border:3px solid white;font-size:16px;">
             📍
           </div>
           <div style="background:#10b981;color:white;font-size:8px;font-weight:800;padding:1px 5px;border-radius:4px;margin-top:2px;">START</div>
         </div>`,
  className: '',
  iconSize: [40, 50],
  iconAnchor: [20, 25],
  popupAnchor: [0, -25]
});

const RecenterMap = ({ center, zoom = 17 }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.5 });
  }, [center, map, zoom]);
  return null;
};

const getIndoorRoute = (startId: string, destId: string, startCoords: [number, number], destCoords: [number, number]) => {
  let coordinates: [number, number][] = [startCoords, destCoords];
  let directions: string[] = [];

  if (startId === 'block24lobby') {
    if (destId === 'cselab1') {
      coordinates = [startCoords, [13.1826, 80.0384], destCoords];
      directions = [
        "Start at the Block 24 ground floor lobby.",
        "Turn left and walk down the main corridor past the elevator.",
        "Pass the CSE Department notices board on your right.",
        "The CSE Advanced Research Lab (AI & Cloud) is on the left (Room 104)."
      ];
    } else if (destId === 'cselab2') {
      coordinates = [startCoords, [13.1824, 80.0386], destCoords];
      directions = [
        "Start at the Block 24 ground floor lobby.",
        "Take the staircase on the right up to the 2nd Floor.",
        "Turn right exiting the staircase corridor.",
        "Walk past the faculty cabins to the end of the hall.",
        "The CSE Programming Lab 3 is on the left (Room 212)."
      ];
    } else if (destId === 'rest1') {
      coordinates = [startCoords, destCoords];
      directions = [
        "Start at the Block 24 ground floor lobby.",
        "Walk straight ahead past the registration desk.",
        "Turn left next to the water station.",
        "The Restrooms are at the end of the short corridor."
      ];
    } else if (destId === 'canteen2') {
      directions = [
        "Start at the Block 24 ground floor lobby.",
        "Walk out through the side glass exit door on the east.",
        "The Nescafe Coffee Station is directly in front under the canopy."
      ];
    } else {
      directions = [
        "Exit Block 24 lobby towards the main walkway.",
        "Walk along the pedestrian paths toward the destination block.",
        "Enter the building main doors.",
        "Check room signs to find the destination."
      ];
    }
  } else if (startId === 'maingate') {
    if (destId === 'admin') {
      coordinates = [startCoords, [13.1814, 80.0396], destCoords];
      directions = [
        "Start at the Main Security Gate.",
        "Walk along the central roadway path toward the administration building.",
        "Walk past the garden fountain plaza.",
        "Enter the Admin Block entrance doors.",
        "The main reception lobby is directly ahead."
      ];
    } else if (destId === 'block24') {
      coordinates = [startCoords, [13.1815, 80.0392], [13.1822, 80.0388], destCoords];
      directions = [
        "Start at the Main Security Gate.",
        "Walk left onto the department connector road.",
        "Proceed past the electrical block.",
        "Block 24 (CSE & IT) is the red building on the right.",
        "Enter through the main front glass doors."
      ];
    } else if (destId === 'canteen1') {
      coordinates = [startCoords, [13.1816, 80.0398], [13.1822, 80.0402], destCoords];
      directions = [
        "Start at the Main Security Gate.",
        "Walk down the central path and bear left towards the canteens corridor.",
        "The Main Food Court is on the left side of the courtyard."
      ];
    } else {
      directions = [
        "Start at the Main Security Gate.",
        "Follow the main road walkway paths.",
        "Walk past the library building square.",
        "Enter the destination building and follow signs."
      ];
    }
  } else {
    directions = [
      "Depart from your starting building lobby.",
      "Head out onto the main campus walking paths.",
      "Walk straight towards the destination block.",
      "Enter the building and follow signs to the room."
    ];
  }

  return { coordinates, directions };
};

const CampusMap = () => {
  const navigate = useNavigate();
  const [activePoiId, setActivePoiId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.1818, 80.0401]);
  const [zoom, setZoom] = useState(16);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  
  // Navigation & Routing States
  const [isRouting, setIsRouting] = useState(false);
  const [startPointId, setStartPointId] = useState('maingate');

  const filteredPois = POIS.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.type === filterType.toLowerCase();
    return matchSearch && matchType;
  });
  const selectedPoi = POIS.find(p => p.id === activePoiId);
  const startPoint = STARTING_POINTS.find(s => s.id === startPointId) || STARTING_POINTS[0];

  const handleSearchSelect = (poi: typeof POIS[0]) => {
    setActivePoiId(poi.id);
    setMapCenter(poi.coords);
    setZoom(18);
    setSearch('');
  };

  const handleDirectionsToggle = () => {
    setIsRouting(true);
    if (selectedPoi) {
      // Recenter between start and destination
      const midLat = (startPoint.coords[0] + selectedPoi.coords[0]) / 2;
      const midLng = (startPoint.coords[1] + selectedPoi.coords[1]) / 2;
      setMapCenter([midLat, midLng]);
      setZoom(16);
    }
  };

  // Get current active route if routing
  const activeRoute = selectedPoi 
    ? getIndoorRoute(startPointId, selectedPoi.id, startPoint.coords, selectedPoi.coords) 
    : { coordinates: [] as [number, number][], directions: [] as string[] };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-slate-900 p-5 pt-12 shadow-md relative z-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const role = JSON.parse(localStorage.getItem('user') || '{}').role;
              if (role === 'faculty') navigate('/faculty');
              else if (role === 'admin') navigate('/admin');
              else navigate(-1);
            }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Campus Map</h1>
              <p className="text-xs text-slate-300">Vel Tech University Navigation</p>
            </div>
          </div>
          {isRouting && (
            <button 
              onClick={() => { setIsRouting(false); setActivePoiId(null); }}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs px-3 py-2 rounded-xl transition-all border border-red-400/30"
            >
              ✕ Cancel
            </button>
          )}
        </div>

        {/* Search Input with dropdown suggestions */}
        {!isRouting && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
            <input
              type="text"
              placeholder="Search CSE labs, block numbers, canteens..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/10 text-white placeholder:text-slate-400 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white/20 transition-colors"
            />
            {search && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto">
                {filteredPois.length > 0 ? (
                  filteredPois.map(poi => {
                    const style = POI_STYLES[poi.type] || POI_STYLES.academic;
                    return (
                      <button 
                        key={poi.id} 
                        onClick={() => handleSearchSelect(poi)}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 text-white flex items-center gap-3"
                      >
                        <span className="text-lg">{style.emoji}</span>
                        <div>
                          <span className="text-xs font-black block">{poi.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{poi.desc}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-xs text-slate-400 italic">No POIs match your search</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0" style={{ minHeight: '400px' }}>
        <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={mapCenter} zoom={zoom} />

          {/* Start Point Marker (if routing) */}
          {isRouting && (
            <Marker position={startPoint.coords} icon={startIcon}>
              <Popup>
                <div style={{fontWeight:'bold',color:'#1e293b'}}>Start: {startPoint.name}</div>
              </Popup>
            </Marker>
          )}

          {/* Dynamic Markers */}
          {POIS.map(poi => (
            <Marker 
              key={poi.id} 
              position={poi.coords} 
              icon={createCustomIcon(poi)}
              eventHandlers={{
                click: () => {
                  setActivePoiId(poi.id);
                  setMapCenter(poi.coords);
                  setZoom(17);
                }
              }}
            >
              <Popup>
                <div style={{fontWeight:900,color:'#0f172a',fontSize:'12px'}}>{poi.name}</div>
                <div style={{fontSize:'10px',color:'#64748b',fontWeight:500,marginTop:'3px'}}>{poi.desc}</div>
              </Popup>
            </Marker>
          ))}

          {/* Active Navigation Polyline */}
          {isRouting && selectedPoi && (
            <Polyline 
              positions={activeRoute.coordinates} 
              pathOptions={{ color: '#6366f1', weight: 5, opacity: 0.9, dashArray: '10,6' }} 
            />
          )}
        </MapContainer>
      </div>

      {/* Standard POI Details Panel */}
      {!isRouting && selectedPoi && (
        <div className="absolute bottom-20 left-3 right-3 z-20 animate-slide-up">
          <div className="bg-white/95 backdrop-blur-xl rounded-[24px] p-4 shadow-2xl border border-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ 
                background: POI_STYLES[selectedPoi.type]?.bg,
                border: `2px solid ${POI_STYLES[selectedPoi.type]?.border}`
              }}>
                {POI_STYLES[selectedPoi.type]?.emoji}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-900 leading-tight truncate">{selectedPoi.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">{selectedPoi.desc}</p>
              </div>
            </div>
            <button 
              onClick={handleDirectionsToggle}
              className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all shrink-0"
            >
              <Navigation className="w-5 h-5 fill-white" />
            </button>
          </div>
        </div>
      )}

      {/* Indoor Turn-by-Turn Routing Panel */}
      {isRouting && selectedPoi && (
        <div className="absolute bottom-20 left-3 right-3 z-20 animate-slide-up" style={{ maxHeight: '45vh' }}>
          <div className="bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col" style={{ maxHeight: '45vh' }}>
            
            {/* Header */}
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
              <div className="min-w-0 mr-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Indoor Routing Directions</p>
                <h3 className="text-xs font-black truncate">To: {selectedPoi.name}</h3>
              </div>
              <button 
                onClick={() => { setIsRouting(false); setActivePoiId(null); }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shrink-0"
              >
                Cancel
              </button>
            </div>

            {/* Select Start & Steps */}
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
              
              {/* Start point Selector */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Select Starting Location</label>
                <select 
                  value={startPointId}
                  onChange={e => setStartPointId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                >
                  {STARTING_POINTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Directions list */}
              <div className="flex flex-col gap-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Step-by-step Indoor Route</p>
                {activeRoute.directions.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="w-6 h-6 bg-indigo-100 text-indigo-600 font-black rounded-full flex items-center justify-center shrink-0 text-[10px]" style={{ minWidth: '24px' }}>
                      {idx + 1}
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating Filter Categories */}
      {!selectedPoi && !isRouting && (
        <div className="absolute bottom-20 left-0 right-0 z-10 flex overflow-x-auto px-3 gap-2 pb-2 hide-scrollbar">
          {[
            { label: 'All', type: '' },
            { label: '🏫 Academic', type: 'academic' },
            { label: '🔬 Lab', type: 'lab' },
            { label: '📚 Library', type: 'library' },
            { label: '🍽️ Food', type: 'food' },
            { label: '🚻 Restroom', type: 'restroom' }
          ].map(f => (
            <button 
              key={f.label} 
              onClick={() => { setFilterType(f.type); if (f.type) setSearch(f.label.replace(/[^\w\s]/g, '').trim()); else setSearch(''); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-full shadow-lg whitespace-nowrap active:scale-95 transition-all ${
                filterType === f.type 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white/90 backdrop-blur text-slate-700 border border-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CampusMap;
