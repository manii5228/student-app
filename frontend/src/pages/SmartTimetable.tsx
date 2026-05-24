import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Clock, User, Zap, AlertTriangle, Calendar, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import BottomNav from '../components/BottomNav';

interface TimetableSlot {
  id: string;
  day: string;
  period_number: number;
  start_time: string;
  end_time: string;
  slot_type: 'lecture' | 'lab' | 'tutorial' | 'break' | 'free';
  subject_code: string;
  subject_name: string;
  faculty_id: string;
  faculty_name: string;
  room_number: string;
  building: string;
  is_cancelled: boolean;
  remarks?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SmartTimetable = () => {
  const navigate = useNavigate();
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const today = new Date().getDay(); // 0=Sunday, 1=Monday
    return today === 0 ? 0 : today - 1; // Default to Monday if Sunday
  });

  const [timetableGrid, setTimetableGrid] = useState<Record<string, TimetableSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveBanner, setLiveBanner] = useState<string | null>(null);

  // Auto-refresh current time every 15 seconds
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timeInterval);
  }, []);

  // Fetch student timetable
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const res = await api.get('/timetable/my-timetable');
        if (res.data && res.data.grid) {
          setTimetableGrid(res.data.grid);
        }
      } catch (err: any) {
        console.error(err);
        setError("Please complete your profile to view your timetable, or check server connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  // Server-Sent Events (SSE) listener for class updates
  useEffect(() => {
    const sseUrl = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/timetable/events` 
      : 'http://localhost:5000/api/v1/timetable/events';
      
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'cancel' || data.type === 'substitute') {
          // Play subtle notification alert
          playNotificationSound();
          setLiveBanner(data.message);
          
          // Re-fetch timetable slots
          api.get('/timetable/my-timetable').then(res => {
            if (res.data && res.data.grid) {
              setTimetableGrid(res.data.grid);
            }
          });
        }
      } catch (err) {
        console.error("Failed to parse SSE payload", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn(e);
    }
  };

  const exportICS = async () => {
    try {
      setExporting(true);
      const res = await api.get('/timetable/my-timetable/export.ics', {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'VelTech_Timetable.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export calendar. Ensure database timetable is set.");
    } finally {
      setExporting(false);
    }
  };

  // Helper check: is current slot live?
  const getSlotStatus = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    if (nowMin >= startMin && nowMin <= endMin) {
      return 'live';
    } else if (nowMin < startMin) {
      return 'upcoming';
    }
    return 'past';
  };

  // Calculate elapsed progress percentage for progress bar
  const getProgressPercentage = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    if (nowMin < startMin) return 0;
    if (nowMin > endMin) return 100;
    return Math.round(((nowMin - startMin) / (endMin - startMin)) * 100);
  };

  // Conflict highlights: checks if next class building is far (e.g. going from LH block to Lab block)
  const checkDistanceConflict = (currentSlot: TimetableSlot, nextSlot: TimetableSlot) => {
    if (!currentSlot.room_number || !nextSlot.room_number) return false;
    const b1 = currentSlot.building || currentSlot.room_number.split('-')[0];
    const b2 = nextSlot.building || nextSlot.room_number.split('-')[0];
    return b1 !== b2;
  };

  // Get active day slots
  const activeDayName = DAYS[selectedDayIdx];
  const activeDayKey = activeDayName.toLowerCase();
  const slots = timetableGrid[activeDayKey] || [];

  // Sort slots by period number
  const sortedSlots = [...slots].sort((a, b) => a.period_number - b.period_number);

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Upper header block */}
      <div className="bg-[#22346c] rounded-b-[40px] p-6 pt-12 shadow-lg relative">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#a91f23]/10 rounded-bl-[120px] pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-black text-white tracking-tight">Smart Timetable</h1>
          </div>
          <button 
            onClick={exportICS}
            disabled={exporting}
            className="flex items-center gap-1.5 bg-[#a91f23] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#921a1d] active:scale-95 transition-all shadow">
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            Sync Calendar
          </button>
        </div>

        {/* Horizontal Calendar Selector */}
        <div className="flex gap-2 mt-6 relative z-10 overflow-x-auto hide-scrollbar">
          {DAYS.map((day, idx) => (
            <button key={day} onClick={() => setSelectedDayIdx(idx)}
              className={`flex-1 min-w-[70px] py-2.5 rounded-2xl text-xs font-bold transition-all ${
                selectedDayIdx === idx 
                  ? 'bg-white text-[#22346c] shadow-lg' 
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}>
              {DAY_SHORT[idx]}
            </button>
          ))}
        </div>
      </div>

      {/* SSE Real-time alert notifications */}
      {liveBanner && (
        <div className="mx-6 mt-4 bg-[#a91f23]/10 border border-[#a91f23]/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-bounce">
          <Sparkles className="w-5 h-5 text-[#a91f23] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-[#a91f23] uppercase tracking-wider">Timetable Update</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{liveBanner}</p>
          </div>
          <button onClick={() => setLiveBanner(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Main timeline listing */}
      <div className="px-6 pt-6 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-48">
            <Loader2 className="w-8 h-8 text-[#22346c] animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-400">Syncing college schedules...</span>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
            <AlertTriangle className="w-10 h-10 text-[#c9503d] mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">{error}</p>
            <button onClick={() => navigate('/profile')} className="mt-3 px-4 py-2 bg-[#22346c] text-white rounded-full text-xs font-bold">
              Update Profile
            </button>
          </div>
        ) : sortedSlots.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold">No classes scheduled for {activeDayName}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedSlots.map((slot, index) => {
              const status = getSlotStatus(slot.start_time, slot.end_time);
              const progress = getProgressPercentage(slot.start_time, slot.end_time);
              
              // Calculate distances between this and the next slot
              const nextSlot = sortedSlots[index + 1];
              const hasConflict = nextSlot && checkDistanceConflict(slot, nextSlot);

              return (
                <React.Fragment key={slot.id}>
                  <div className={`rounded-3xl p-5 border transition-all relative overflow-hidden ${
                    slot.is_cancelled 
                      ? 'bg-red-50/50 border-red-100 opacity-60' 
                      : status === 'live' 
                        ? 'bg-white border-[#22346c] shadow-md ring-1 ring-[#22346c]'
                        : 'bg-white border-slate-100 shadow-sm'
                  }`}>

                    {/* Class Cancelled or substituted watermark */}
                    {slot.is_cancelled && (
                      <div className="absolute top-3 right-3 bg-[#a91f23]/10 text-[#a91f23] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                        Cancelled
                      </div>
                    )}

                    {/* Substitute indicator */}
                    {!slot.is_cancelled && slot.remarks && slot.remarks.toLowerCase().includes('substitute') && (
                      <div className="absolute top-3 right-3 bg-[#0080c7]/10 text-[#0080c7] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                        Substitute Class
                      </div>
                    )}

                    {/* Live pulse indicator */}
                    {status === 'live' && !slot.is_cancelled && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live Now</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <h3 className={`text-base font-bold leading-tight ${slot.is_cancelled ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {slot.subject_name || "Free Period"}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{slot.subject_code || "FREE"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-[#22346c]">{slot.start_time}</span>
                        <p className="text-[10px] text-slate-400 font-semibold">{slot.end_time}</p>
                      </div>
                    </div>

                    {/* Live Progress Bar */}
                    {status === 'live' && !slot.is_cancelled && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                          <span>Elapsed</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#a91f23] to-[#22346c] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    )}

                    {/* Details row */}
                    {slot.subject_code && (
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] font-semibold text-slate-500">{slot.faculty_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] font-semibold text-slate-500">{slot.room_number || "Lab Block"}</span>
                        </div>
                      </div>
                    )}

                    {/* Location Navigation Button */}
                    {status === 'live' && !slot.is_cancelled && slot.room_number && (
                      <button 
                        onClick={() => navigate('/campus/map')}
                        className="mt-4 w-full bg-[#22346c] text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#1a2854] shadow-sm">
                        <MapPin className="w-3.5 h-3.5" />
                        Locate Class ({slot.room_number})
                      </button>
                    )}
                  </div>

                  {/* Conflict alert between slots */}
                  {hasConflict && !slot.is_cancelled && !nextSlot.is_cancelled && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 my-1 mx-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-[10px] leading-relaxed text-amber-800">
                        <span className="font-bold">Distant Building Alert</span>
                        <p className="mt-0.5">
                          Back-to-back classes are scheduled in different blocks. You'll need to walk from {slot.room_number} to {nextSlot.room_number} (Approx. 6 min walk).
                        </p>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default SmartTimetable;
