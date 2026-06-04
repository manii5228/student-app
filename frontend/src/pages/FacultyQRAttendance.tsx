import React, { useState, useEffect } from 'react';
import { ChevronLeft, QrCode, MapPin, RefreshCw, AlertCircle, Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const FacultyQRAttendance = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [qrCodeStr, setQrCodeStr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number}>({ lat: 13.1818, lng: 80.0401 });

  // Live scan counter states
  const [scanCount, setScanCount] = useState(0);
  const [recentScans, setRecentScans] = useState<string[]>([]);

  // GPS fetch with default fallback
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.error("GPS error", err);
          // Fallback to VelTech campus coordinates if geolocation fails
          setLocation({ lat: 13.1818, lng: 80.0401 });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocation({ lat: 13.1818, lng: 80.0401 });
    }
  }, []);

  const generateQR = () => {
    setGenerating(true);
    setTimeout(() => {
      setQrCodeStr(`Class_Slot_402_${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
      setTimeLeft(60);
      setScanCount(0);
      setRecentScans([]);
      setGenerating(false);
    }, 1000);
  };

  const resetSession = () => {
    setQrCodeStr(null);
    setTimeLeft(60);
    setScanCount(0);
    setRecentScans([]);
  };

  useEffect(() => {
    if (timeLeft > 0 && qrCodeStr) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setQrCodeStr(null);
    }
  }, [timeLeft, qrCodeStr]);

  return (
    <div className="min-h-full bg-slate-900 flex flex-col font-sans animate-fade-in relative pb-24 text-white">

      {/* Header */}
      <div className="p-6 pt-12 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Dynamic QR</h1>
        </div>
        <p className="text-slate-400 text-sm">Generate a 60-second time-locked QR code tied to your GPS location.</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 pb-8 overflow-y-auto">
        
        {/* GPS Status */}
        <div className={`mb-6 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold ${
          location ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          <MapPin className="w-4 h-4" />
          {location ? `GPS Locked: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Acquiring GPS...'}
        </div>

        {/* QR Display Area */}
        <div className={`bg-white rounded-[40px] p-8 w-full max-w-[280px] aspect-square flex flex-col items-center justify-center relative overflow-hidden transition-all duration-1000 ${
          qrCodeStr ? 'scale-102 border-2 border-slate-200 shadow-lg' : 'shadow-none border border-slate-800'
        }`}>
          {qrCodeStr ? (
            <>
              {/* Pseudo QR Code */}
              <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center border-4 border-slate-900 relative">
                <QrCode className="w-28 h-28 text-slate-800" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+Cjwvc3ZnPg==')] opacity-10"></div>
              </div>
              
              {/* Timer Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
                <div 
                  className={`h-full transition-all duration-100 linear ${timeLeft < 15 ? 'bg-red-500' : 'bg-indigo-505 bg-indigo-650 bg-indigo-500'}`}
                  style={{ width: `${(timeLeft / 60) * 100}%` }}
                />
              </div>
              
              <div className="absolute top-3 right-3 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                {timeLeft}
              </div>
            </>
          ) : (
            <div className="text-center">
              <QrCode className="w-14 h-14 text-slate-350 mx-auto mb-4 animate-pulse" />
              <p className="text-xs font-black text-slate-400">Ready to Generate</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-[280px] flex flex-col gap-2 mt-6">
          <button 
            onClick={generateQR} 
            disabled={generating || !!qrCodeStr}
            className="w-full bg-indigo-500 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-xl hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {generating ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : qrCodeStr ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin-slow" />
                Active for {timeLeft}s
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5" />
                Generate QR Code
              </>
            )}
          </button>

          {qrCodeStr && (
            <button 
              onClick={resetSession}
              className="w-full bg-slate-800 text-slate-300 hover:text-white rounded-2xl py-3 flex items-center justify-center gap-2 text-xs font-bold border border-slate-700 transition-all"
            >
              Reset / Reactivate Session
            </button>
          )}
        </div>

        {/* Live Scan Tracker Widgets */}
        {qrCodeStr && (
          <div className="mt-6 w-full max-w-[280px] bg-slate-800/50 border border-slate-800 rounded-2xl p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black text-slate-350 uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Live Scans
              </span>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                {scanCount} / 60
              </span>
            </div>
            
            {/* Recent Scans Log list */}
            <div className="flex flex-col gap-2">
              {recentScans.length > 0 ? (
                recentScans.map((name, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] bg-slate-900/50 p-2 rounded-xl border border-slate-800 animate-slide-up">
                    <span className="font-bold text-slate-300">{name}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                      <CheckCircle className="w-3 h-3" /> Scanned
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-500 italic text-center py-2">Waiting for students to scan...</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-start gap-2 text-slate-400 bg-white/5 p-4 rounded-2xl max-w-[280px]">
          <AlertCircle className="w-5 h-5 shrink-0 text-indigo-400" />
          <p className="text-xs leading-relaxed">Students must be within 50 meters of your current GPS location to scan successfully.</p>
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default FacultyQRAttendance;
