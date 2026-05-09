import React, { useState, useEffect } from 'react';
import { ChevronLeft, QrCode, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const FacultyQRAttendance = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [qrCodeStr, setQrCodeStr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  // Mock GPS fetch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("GPS error", err)
      );
    }
  }, []);

  const generateQR = () => {
    setGenerating(true);
    // Simulate API call to /api/v1/attendance/session/:id/qr
    setTimeout(() => {
      setQrCodeStr(`Class_Slot_402_${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
      setTimeLeft(60);
      setGenerating(false);
    }, 1000);
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
    <div className="min-h-full bg-slate-900 flex flex-col font-sans animate-fade-in relative pb-24">

      {/* Header */}
      <div className="p-6 pt-12">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Dynamic QR</h1>
        </div>
        <p className="text-slate-400 text-sm">Generate a 60-second time-locked QR code tied to your GPS location.</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-12">
        
        {/* GPS Status */}
        <div className={`mb-6 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold ${
          location ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          <MapPin className="w-4 h-4" />
          {location ? `GPS Locked: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Acquiring GPS...'}
        </div>

        {/* QR Display Area */}
        <div className="bg-white rounded-[40px] p-8 w-full max-w-[320px] aspect-square flex flex-col items-center justify-center shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
          {qrCodeStr ? (
            <>
              {/* Pseudo QR Code (In production, use react-qr-code) */}
              <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center border-4 border-slate-900 relative">
                <QrCode className="w-32 h-32 text-slate-800" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+Cjwvc3ZnPg==')] opacity-10"></div>
              </div>
              
              {/* Timer Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-100">
                <div 
                  className={`h-full transition-all duration-1000 linear ${timeLeft < 15 ? 'bg-red-500' : 'bg-indigo-500'}`}
                  style={{ width: `${(timeLeft / 60) * 100}%` }}
                />
              </div>
              
              <div className="absolute top-4 right-4 bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg">
                {timeLeft}
              </div>
            </>
          ) : (
            <div className="text-center">
              <QrCode className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-400">No active QR code.</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={generateQR} 
          disabled={generating || !location || !!qrCodeStr}
          className="mt-8 w-full max-w-[320px] bg-indigo-500 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-xl hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50"
        >
          {generating ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : qrCodeStr ? (
            <>
              <RefreshCw className="w-5 h-5" />
              Active for {timeLeft}s
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              Generate QR Code
            </>
          )}
        </button>

        <div className="mt-6 flex items-start gap-2 text-slate-400 bg-white/5 p-4 rounded-2xl max-w-[320px]">
          <AlertCircle className="w-5 h-5 shrink-0 text-indigo-400" />
          <p className="text-xs leading-relaxed">Students must be within 50 meters of your current GPS location to scan successfully.</p>
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default FacultyQRAttendance;
