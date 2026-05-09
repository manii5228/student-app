import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Bus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const LiveBusTracking = () => {
  const navigate = useNavigate();
  const [busPosition, setBusPosition] = useState({ x: 10, y: 10 });
  const [eta, setEta] = useState(15);

  // Simulate bus movement along a path
  useEffect(() => {
    const path = [
      {x: 10, y: 10}, {x: 20, y: 15}, {x: 30, y: 30}, 
      {x: 50, y: 40}, {x: 70, y: 60}, {x: 80, y: 80}
    ];
    let step = 0;
    
    const interval = setInterval(() => {
      step = (step + 1) % path.length;
      setBusPosition(path[step]);
      
      // Update ETA
      setEta(Math.max(1, 15 - (step * 3)));
    }, 3000); // Move every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full bg-slate-900 flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Header */}
      <div className="p-6 pt-12 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/campus')} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white shadow-sm">Live Bus Tracker</h1>
              <p className="text-xs text-blue-200 shadow-sm font-medium">Route 4 • Main City to Campus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Map Area */}
      <div className="flex-1 relative bg-[#1e293b] overflow-hidden">
        {/* Map Grid / Roads */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'linear-gradient(#334155 2px, transparent 2px), linear-gradient(90deg, #334155 2px, transparent 2px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Animated Route Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M 10 10 L 20 15 L 30 30 L 50 40 L 70 60 L 80 80" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="opacity-50" />
        </svg>

        {/* Destination Pin */}
        <div className="absolute transition-all" style={{ left: '80%', top: '80%', transform: 'translate(-50%, -100%)' }}>
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-bounce">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div className="mt-1 text-center bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg">
            <p className="text-[10px] font-bold text-emerald-400">Campus</p>
          </div>
        </div>

        {/* Moving Bus Pin */}
        <div className="absolute transition-all duration-1000 ease-linear z-10" 
             style={{ left: `${busPosition.x}%`, top: `${busPosition.y}%`, transform: 'translate(-50%, -50%)' }}>
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 border-4 border-blue-500">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel Bottom */}
      <div className="absolute bottom-[80px] left-4 right-4 z-20">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-inner">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">TN 01 AB 1234</h3>
                <p className="text-blue-200 text-xs">Driver: Kumar</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-emerald-400 justify-end mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-black text-xl">{eta}</span>
                <span className="text-xs font-bold mt-1">min</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Estimated Arrival</p>
            </div>
          </div>
          
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${100 - (eta / 15 * 100)}%` }}></div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default LiveBusTracking;
