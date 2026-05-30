import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, MapPin, Coffee, BookOpen, Monitor, Home, Shield, Navigation, ArrowRight } from 'lucide-react';
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

const getPoiDetails = (type: string) => {
  switch (type) {
    case 'academic': 
      return { 
        color: 'bg-indigo-50 border-indigo-400 text-indigo-600', 
        icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5' 
      };
    case 'lab': 
      return { 
        color: 'bg-purple-50 border-purple-400 text-purple-600', 
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z' 
      };
    case 'library': 
      return { 
        color: 'bg-blue-50 border-blue-400 text-blue-600', 
        icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M4 6.5A2.5 2.5 0 0 1 6.5 4H20' 
      };
    case 'food': 
      return { 
        color: 'bg-orange-50 border-orange-400 text-orange-600', 
        icon: 'M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z' 
      };
    case 'restroom': 
      return { 
        color: 'bg-pink-50 border-pink-400 text-pink-600', 
        icon: 'M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 12c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8z' 
      };
    default: 
      return { 
        color: 'bg-slate-50 border-slate-400 text-slate-600', 
        icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' 
      };
  }
};

const createCustomIcon = (poi: typeof POIS[0]) => {
  const details = getPoiDetails(poi.type);
  const iconHtml = `
    <div class="w-10 h-10 ${details.color} border-2 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${details.icon}" />
      </svg>
    </div>
  `;
  return new L.DivIcon({
    html: iconHtml,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const startIcon = new L.DivIcon({
  html: `<div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>
         </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
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
  
  // Navigation & Routing States
  const [isRouting, setIsRouting] = useState(false);
  const [startPointId, setStartPointId] = useState('maingate');

  const filteredPois = POIS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase()));
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
      <div className="bg-slate-900 p-6 pt-12 shadow-md relative z-20">
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
        </div>

        {/* Search Input with dropdown suggestions */}
        {!isRouting && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search CSE labs, block numbers, canteens..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/10 text-white placeholder:text-slate-400 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white/20 transition-colors"
            />
            {search && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto overflow-x-hidden">
                {filteredPois.length > 0 ? (
                  filteredPois.map(poi => (
                    <button 
                      key={poi.id} 
                      onClick={() => handleSearchSelect(poi)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 text-white flex flex-col"
                    >
                      <span className="text-xs font-black">{poi.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">{poi.desc}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-slate-400 italic">No POIs match your search</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0 min-h-[480px] h-[calc(100vh-280px)]">
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
                <div className="font-bold text-slate-800">Start: {startPoint.name}</div>
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
              <Popup className="rounded-xl overflow-hidden shadow-xl">
                <div className="font-black text-slate-900 text-xs">{poi.name}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">{poi.desc}</div>
              </Popup>
            </Marker>
          ))}

          {/* Active Navigation Polyline */}
          {isRouting && selectedPoi && (
            <Polyline 
              positions={activeRoute.coordinates} 
              pathOptions={{ color: '#6366f1', weight: 5, opacity: 0.9 }} 
            />
          )}
        </MapContainer>
      </div>

      {/* Standard POI Details Panel */}
      {!isRouting && selectedPoi && (
        <div className="absolute bottom-20 left-4 right-4 z-20 animate-slide-up">
          <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-5 shadow-2xl border border-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${getPoiDetails(selectedPoi.type).color} flex items-center justify-center shrink-0 border`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path d={getPoiDetails(selectedPoi.type).icon} />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">{selectedPoi.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{selectedPoi.desc}</p>
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
        <div className="absolute bottom-20 left-4 right-4 z-20 animate-slide-up max-h-[45vh] flex flex-col bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Indoor Routing Directions</p>
              <h3 className="text-xs font-black truncate max-w-[200px]">To: {selectedPoi.name}</h3>
            </div>
            <button 
              onClick={() => setIsRouting(false)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>

          {/* Select Start & Steps */}
          <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
            
            {/* Start point Selector */}
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Select Starting Location</label>
              <select 
                value={startPointId}
                onChange={e => setStartPointId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
              >
                {STARTING_POINTS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Directions list */}
            <div className="flex flex-col gap-2.5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Step-by-step Indoor Route</p>
              {activeRoute.directions.map((step, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="w-5 h-5 bg-indigo-50 text-indigo-600 font-black rounded-full flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Floating Filter Categories */}
      {!selectedPoi && !isRouting && (
        <div className="absolute bottom-20 left-0 right-0 z-10 flex overflow-x-auto px-4 gap-2 pb-2 hide-scrollbar">
          {['Academic', 'Lab', 'Library', 'Food', 'Restroom'].map(f => (
            <button 
              key={f} 
              onClick={() => setSearch(f)} 
              className="px-4 py-2 bg-slate-900/90 backdrop-blur text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap active:scale-95 transition-transform"
            >
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
