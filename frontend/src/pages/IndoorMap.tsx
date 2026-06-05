import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, MapPin, Navigation, Map, List, HelpCircle, Compass, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issues in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface POI {
  id: string;
  name: string;
  type: string;
  building?: string;
  floor?: string;
  desc: string;
  coords: [number, number];
  directions: Record<string, string[]>;
}

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

// Leaflet custom components
const MapInvalidateSize = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const RecenterMap = ({ center, zoom = 17 }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.2 });
  }, [center, map, zoom]);
  return null;
};

const IndoorMap = () => {
  const navigate = useNavigate();
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); // List mode is default (vertical)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  
  // Navigation & expand states
  const [expandedPoiId, setExpandedPoiId] = useState<string | null>(null);
  const [startPointId, setStartPointId] = useState('maingate');
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.1818, 80.0401]);
  const [zoom, setZoom] = useState(16);

  // Load POIs from Database
  const fetchPOIs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/indoor-pois');
      setPois(data.pois || []);
      if (data.pois && data.pois.length > 0) {
        // center on first POI
        setMapCenter(data.pois[0].coords);
      }
    } catch (err) {
      // Fallback seed POIs
      setPois([
        {
          id: 'admin',
          name: 'Administrative Block (Block 10)',
          type: 'academic',
          building: 'Block 10',
          floor: 'Ground',
          desc: 'Registrar, Admission Office & Finance Dept',
          coords: [13.1818, 80.0401],
          directions: {
            maingate: [
              "Start at the Main Security Gate.",
              "Walk along the central roadway path toward the administration building.",
              "Walk past the garden fountain plaza.",
              "Enter the Admin Block entrance doors.",
              "The main reception lobby is directly ahead."
            ]
          }
        },
        {
          id: 'block24',
          name: 'Block 24 (CSE & IT Dept)',
          type: 'academic',
          building: 'Block 24',
          floor: 'Ground',
          desc: 'Computer Science HOD Room & Dept Offices',
          coords: [13.1825, 80.0385],
          directions: {
            maingate: [
              "Start at the Main Security Gate.",
              "Walk left onto the department connector road.",
              "Proceed past the electrical block.",
              "Block 24 (CSE & IT) is the red building on the right.",
              "Enter through the main front glass doors."
            ]
          }
        },
        {
          id: 'cselab1',
          name: 'CSE Advanced Research Lab',
          type: 'lab',
          building: 'Block 24',
          floor: '1st Floor',
          desc: 'Block 24, Floor 1 - AI & Cloud Lab',
          coords: [13.1827, 80.0383],
          directions: {
            block24lobby: [
              "Start at the Block 24 ground floor lobby.",
              "Turn left and walk down the main corridor past the elevator.",
              "Pass the CSE Department notices board on your right.",
              "The CSE Advanced Research Lab (AI & Cloud) is on the left (Room 104)."
            ]
          }
        },
        {
          id: 'cselab2',
          name: 'CSE Programming Lab 3',
          type: 'lab',
          building: 'Block 24',
          floor: '2nd Floor',
          desc: 'Block 24, Floor 2 - Java & Web Coding',
          coords: [13.1823, 80.0387],
          directions: {
            block24lobby: [
              "Start at the Block 24 ground floor lobby.",
              "Take the staircase on the right up to the 2nd Floor.",
              "Turn right exiting the staircase corridor.",
              "Walk past the faculty cabins to the end of the hall.",
              "The CSE Programming Lab 3 is on the left (Room 212)."
            ]
          }
        },
        {
          id: 'canteen1',
          name: 'Main Food Court (Canteen)',
          type: 'food',
          building: 'Food Court',
          floor: 'Ground',
          desc: 'South/North Indian Meals & Fast Food',
          coords: [13.1825, 80.0405],
          directions: {
            maingate: [
              "Start at the Main Security Gate.",
              "Walk down the central path and bear left towards the canteens corridor.",
              "The Main Food Court is on the left side of the courtyard."
            ]
          }
        },
        {
          id: 'canteen2',
          name: 'Block 24 Nescafe Station',
          type: 'food',
          building: 'Block 24',
          floor: 'Ground',
          desc: 'Coffee, snacks, & quick bites',
          coords: [13.1824, 80.0386],
          directions: {
            block24lobby: [
              "Start at the Block 24 ground floor lobby.",
              "Walk out through the side glass exit door on the east.",
              "The Nescafe Coffee Station is directly in front under the canopy."
            ]
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOIs();
  }, []);

  const filteredPois = pois.filter(p => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = !filterType || p.type === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  const handleCardExpand = (id: string) => {
    setExpandedPoiId(expandedPoiId === id ? null : id);
  };

  const handleShowOnMap = (poi: POI, e: React.MouseEvent) => {
    e.stopPropagation();
    setMapCenter(poi.coords);
    setZoom(18);
    setViewMode('map');
  };

  // Get start point details
  const startPoint = STARTING_POINTS.find(s => s.id === startPointId) || STARTING_POINTS[0];

  // Helper to resolve custom directions or fallback
  const getDirectionsForPoi = (poi: POI, startId: string) => {
    if (poi.directions && poi.directions[startId] && poi.directions[startId].length > 0) {
      return poi.directions[startId];
    }
    // Hardcoded fallback logic
    if (startId === 'block24lobby') {
      if (poi.id === 'cselab1') {
        return [
          "Start at the Block 24 ground floor lobby.",
          "Turn left and walk down the main corridor past the elevator.",
          "Pass the CSE Department notices board on your right.",
          "The CSE Advanced Research Lab (AI & Cloud) is on the left (Room 104)."
        ];
      } else if (poi.id === 'cselab2') {
        return [
          "Start at the Block 24 ground floor lobby.",
          "Take the staircase on the right up to the 2nd Floor.",
          "Turn right exiting the staircase corridor.",
          "Walk past the faculty cabins to the end of the hall.",
          "The CSE Programming Lab 3 is on the left (Room 212)."
        ];
      }
    }
    return [
      `Depart from ${startPoint.name}.`,
      `Head towards the ${poi.building || 'destination block'}.`,
      `Find the ${poi.floor || 'appropriate'} floor.`,
      `Locate ${poi.name}.`
    ];
  };

  // Custom leaflet icon creator
  const createCustomIcon = (poi: POI) => {
    const style = POI_STYLES[poi.type] || POI_STYLES.academic;
    const iconHtml = `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:36px;height:36px;background:${style.bg};border:2.5px solid ${style.border};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.15);font-size:16px;">
          ${style.emoji}
        </div>
      </div>
    `;
    return new L.DivIcon({
      html: iconHtml,
      className: 'bg-transparent border-none',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 pt-12 shadow-md shrink-0 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const role = JSON.parse(localStorage.getItem('user') || '{}').role;
              if (role === 'faculty') navigate('/faculty');
              else if (role === 'admin') navigate('/admin');
              else navigate(-1);
            }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Campus Map & Directions</h1>
              <p className="text-[10px] text-slate-400 font-medium">Vel Tech University Indoor Navigation</p>
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex bg-white/10 rounded-xl p-1 border border-white/5 shadow-inner">
            <button 
              onClick={() => setViewMode('list')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
            >
              <List className="w-3.5 h-3.5" /> Directions List
            </button>
            <button 
              onClick={() => setViewMode('map')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
            >
              <Map className="w-3.5 h-3.5" /> Map View
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search practical rooms, classrooms, canteens..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 text-white placeholder:text-slate-400 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-medium outline-none focus:bg-white/15 transition-all border border-white/5"
          />
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="py-2.5 px-4 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto shrink-0 hide-scrollbar">
        {[
          { label: 'All Locations', type: '' },
          { label: '🏫 Academic', type: 'academic' },
          { label: '🔬 Labs', type: 'lab' },
          { label: '📚 Libraries', type: 'library' },
          { label: '🍽️ Food & Dining', type: 'food' },
          { label: '🚻 Restrooms', type: 'restroom' }
        ].map(f => (
          <button 
            key={f.label} 
            onClick={() => setFilterType(f.type)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap ${
              filterType === f.type 
                ? 'bg-slate-900 text-white border-slate-950 shadow-sm' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* VIEW PANEL */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : viewMode === 'list' ? (
          /* VERTICAL LIST VIEW (DEFAULT) */
          <div className="h-full overflow-y-auto p-4 flex flex-col gap-3.5 custom-scrollbar">
            {filteredPois.length > 0 ? (
              filteredPois.map(poi => {
                const style = POI_STYLES[poi.type] || POI_STYLES.academic;
                const isExpanded = expandedPoiId === poi.id;
                const directionsList = getDirectionsForPoi(poi, startPointId);

                return (
                  <div 
                    key={poi.id} 
                    onClick={() => handleCardExpand(poi.id)}
                    className={`bg-white rounded-[24px] border transition-all duration-300 overflow-hidden cursor-pointer ${
                      isExpanded 
                        ? 'border-indigo-200 shadow-lg ring-1 ring-indigo-500/5' 
                        : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow'
                    }`}
                  >
                    {/* Card Summary Header */}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold" style={{ 
                          background: style.bg,
                          border: `1.5px solid ${style.border}`
                        }}>
                          {style.emoji}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-black text-slate-800 tracking-tight leading-tight">{poi.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {poi.type}
                            </span>
                            {poi.building && (
                              <span className="text-[9px] font-semibold text-slate-500">
                                • {poi.building} {poi.floor ? `, ${poi.floor}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={(e) => handleShowOnMap(poi, e)}
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors"
                          title="Show on Map"
                        >
                          <Navigation className="w-3.5 h-3.5 fill-indigo-600" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Direction Details */}
                    {isExpanded && (
                      <div className="px-4 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-4">
                          {/* Description */}
                          <div>
                            <p className="text-xs font-semibold text-slate-500 leading-relaxed italic">{poi.desc}</p>
                          </div>

                          {/* Building details */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-white rounded-xl p-2.5 border border-slate-100 text-center">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Building Block</span>
                              <span className="text-xs font-black text-slate-700 mt-0.5 block">{poi.building || 'Main Campus'}</span>
                            </div>
                            <div className="bg-white rounded-xl p-2.5 border border-slate-100 text-center">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Floor Level</span>
                              <span className="text-xs font-black text-slate-700 mt-0.5 block">{poi.floor || 'Ground Floor'}</span>
                            </div>
                          </div>

                          {/* Start Point Selection */}
                          <div className="bg-white p-3 rounded-2xl border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Starting From</label>
                            <select 
                              value={startPointId}
                              onChange={e => setStartPointId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                            >
                              {STARTING_POINTS.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Directions steps */}
                          <div className="flex flex-col gap-3 pl-1">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-indigo-500" /> Walk Directions
                            </h4>
                            {directionsList.length > 0 ? (
                              <div className="flex flex-col gap-3 relative before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-100">
                                {directionsList.map((step, idx) => (
                                  <div key={idx} className="flex gap-3 items-start relative z-10">
                                    <div className="w-6 h-6 bg-indigo-600 text-white font-black rounded-full flex items-center justify-center shrink-0 text-[10px] shadow-sm shadow-indigo-600/20">
                                      {idx + 1}
                                    </div>
                                    <p className="text-xs text-slate-600 font-semibold leading-relaxed pt-0.5">{step}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center py-4 text-center">
                                <HelpCircle className="w-8 h-8 text-slate-300 mb-1.5" />
                                <p className="text-xs text-slate-400 font-semibold">No detailed turn-by-turn steps coded for this start point yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No Locations Found</h3>
                <p className="text-xs text-slate-500 mt-1 px-4">Try clearing filters or search to view other university blocks.</p>
              </div>
            )}
          </div>
        ) : (
          /* MAP VIEW WITH Leaflet */
          <div className="w-full h-full relative">
            <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <MapInvalidateSize />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap center={mapCenter} zoom={zoom} />

              {/* Markers for all rooms */}
              {filteredPois.map(poi => (
                <Marker 
                  key={poi.id} 
                  position={poi.coords} 
                  icon={createCustomIcon(poi)}
                  eventHandlers={{
                    click: () => {
                      setMapCenter(poi.coords);
                      setZoom(18);
                      setExpandedPoiId(poi.id);
                      setViewMode('list');
                    }
                  }}
                >
                  <Popup>
                    <div style={{fontWeight:900,color:'#0f172a',fontSize:'12px'}}>{poi.name}</div>
                    <div style={{fontSize:'10px',color:'#64748b',fontWeight:500,marginTop:'3px'}}>{poi.desc}</div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Quick Map Instruction Banner */}
            <div className="absolute top-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 text-center z-[400] border border-white/10 shadow-lg">
              <p className="text-[10px] text-white font-black">🗺️ Tap any location icon on the map to view detailed walk directions!</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default IndoorMap;
