import React, { useState } from 'react';
import { ChevronLeft, Map, Search, MapPin, Coffee, BookOpen, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const POIS = [
  { id: '1', name: 'Main Auditorium', type: 'hall', x: 50, y: 30, icon: <MapPin className="w-4 h-4 text-white" />, color: 'bg-indigo-500' },
  { id: '2', name: 'CS Labs (Block B)', type: 'lab', x: 20, y: 50, icon: <Monitor className="w-4 h-4 text-white" />, color: 'bg-emerald-500' },
  { id: '3', name: 'Central Library', type: 'library', x: 80, y: 60, icon: <BookOpen className="w-4 h-4 text-white" />, color: 'bg-blue-500' },
  { id: '4', name: 'Canteen', type: 'food', x: 40, y: 80, icon: <Coffee className="w-4 h-4 text-white" />, color: 'bg-orange-500' },
];

const IndoorMap = () => {
  const navigate = useNavigate();
  const [activePoi, setActivePoi] = useState<string | null>(null);

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Header */}
      <div className="bg-slate-900 p-6 pt-12 shadow-md relative z-20">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/campus')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Indoor Campus Map</h1>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search labs, offices, washrooms..."
            className="w-full bg-white/10 text-white placeholder:text-slate-400 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white/20 transition-colors"
          />
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="flex-1 relative overflow-hidden bg-[#e2e8f0] flex items-center justify-center">
        
        {/* The SVG Building Layout */}
        <div className="relative w-full max-w-[400px] aspect-[3/4] bg-white rounded-3xl shadow-xl border-4 border-slate-300 mx-4 overflow-hidden p-4">
          
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Building Blocks */}
            <rect x="10" y="10" width="80" height="30" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="10" y="45" width="30" height="45" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="45" y="45" width="45" height="45" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
            
            {/* Pathways */}
            <path d="M 42 10 L 42 90" stroke="#e2e8f0" strokeWidth="4" />
            <path d="M 10 42 L 90 42" stroke="#e2e8f0" strokeWidth="4" />
          </svg>

          {/* Render POIs */}
          {POIS.map(poi => (
            <button 
              key={poi.id}
              onClick={() => setActivePoi(poi.id)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 group z-10"
              style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
            >
              <div className={`w-8 h-8 ${poi.color} rounded-full flex items-center justify-center shadow-lg shadow-black/20 ${activePoi === poi.id ? 'ring-4 ring-white' : ''}`}>
                {poi.icon}
              </div>
              {/* Tooltip */}
              <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${activePoi === poi.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
                {poi.name}
              </div>
            </button>
          ))}

        </div>
      </div>

      {/* Selected POI Details Panel */}
      <div className={`absolute bottom-[80px] left-4 right-4 z-20 transition-all duration-300 ${activePoi ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {activePoi && (
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800">{POIS.find(p => p.id === activePoi)?.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Ground Floor • Open until 8 PM</p>
            </div>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700">
              Navigate
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default IndoorMap;
