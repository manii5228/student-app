import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Clock, Users, AlertTriangle, Calendar, Loader2, Sparkles, X, MessageSquare } from 'lucide-react';
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
  room_number: string;
  building: string;
  is_cancelled: boolean;
  remarks?: string;
  department?: string;
  semester?: number;
  section?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FacultyTimetable = () => {
  const navigate = useNavigate();
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const today = new Date().getDay(); // 0=Sunday, 1=Monday
    return today === 0 ? 0 : today - 1; // Default to Monday if Sunday
  });

  const [timetableGrid, setTimetableGrid] = useState<Record<string, TimetableSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cancellation Modal State
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch faculty timetable
  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get('/timetable/faculty');
      if (res.data && res.data.grid) {
        setTimetableGrid(res.data.grid);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load your timetable. Please try again or check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const handleOpenCancelModal = (slot: TimetableSlot) => {
    setSelectedSlot(slot);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!selectedSlot) return;
    try {
      setCancelling(true);
      await api.post(`/timetable/slot/${selectedSlot.id}/cancel`, {
        reason: cancelReason.trim()
      });
      
      // Show success toast
      setSuccessMsg(`Successfully cancelled ${selectedSlot.subject_name}`);
      setTimeout(() => setSuccessMsg(null), 4000);
      
      // Update local state directly to feel instant
      setTimetableGrid(prev => {
        const updated = { ...prev };
        const dayKey = selectedSlot.day.toLowerCase();
        if (updated[dayKey]) {
          updated[dayKey] = updated[dayKey].map(slot => 
            slot.id === selectedSlot.id 
              ? { ...slot, is_cancelled: true, remarks: cancelReason ? `Cancelled: ${cancelReason}` : 'Cancelled' }
              : slot
          );
        }
        return updated;
      });

      setSelectedSlot(null);
    } catch (err) {
      console.error(err);
      alert("Failed to cancel class. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const activeDayName = DAYS[selectedDayIdx];
  const activeDayKey = activeDayName.toLowerCase();
  const slots = timetableGrid[activeDayKey] || [];
  const sortedSlots = [...slots].sort((a, b) => a.period_number - b.period_number);

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Header (Premium dark gradient matching FacultyHub) */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-b-[40px] p-6 pt-12 shadow-lg relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">My Class Schedule</h1>
          </div>
        </div>

        {/* Horizontal Calendar Day Selector */}
        <div className="flex gap-2 mt-6 relative z-10 overflow-x-auto hide-scrollbar">
          {DAYS.map((day, idx) => (
            <button key={day} onClick={() => setSelectedDayIdx(idx)}
              className={`flex-1 min-w-[70px] py-2.5 rounded-2xl text-xs font-bold transition-all ${
                selectedDayIdx === idx 
                  ? 'bg-white text-slate-900 shadow-lg' 
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}>
              {DAY_SHORT[idx]}
            </button>
          ))}
        </div>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="mx-6 mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs font-bold">{successMsg}</p>
        </div>
      )}

      {/* Main Schedule Timeline */}
      <div className="px-6 pt-6 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-48">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-400">Loading your teaching schedule...</span>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[32px] p-6 text-center shadow-sm border border-slate-100">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-750">{error}</p>
            <button onClick={fetchTimetable} className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold">
              Try Again
            </button>
          </div>
        ) : sortedSlots.length === 0 ? (
          <div className="bg-white rounded-[32px] p-8 text-center border border-slate-100 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold">No classes assigned on {activeDayName}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedSlots.map((slot) => {
              const classLabel = slot.department 
                ? `${slot.department} - Sem ${slot.semester} (${slot.section || 'A'})` 
                : 'Assigned Batch';

              return (
                <div key={slot.id} className={`rounded-[28px] p-5 border transition-all relative overflow-hidden ${
                  slot.is_cancelled 
                    ? 'bg-rose-50/40 border-rose-100 opacity-60' 
                    : 'bg-white border-slate-100 shadow-sm'
                }`}>

                  {/* Status watermark */}
                  {slot.is_cancelled && (
                    <div className="absolute top-3 right-3 bg-rose-500/10 text-rose-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                      Cancelled
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <span className="text-[9px] font-black text-indigo-605 text-indigo-600 tracking-widest uppercase">
                        {classLabel}
                      </span>
                      <h3 className={`text-base font-bold leading-tight mt-1 ${slot.is_cancelled ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {slot.subject_name}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{slot.subject_code}</p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-800">{slot.start_time}</span>
                      <p className="text-[10px] text-slate-400 font-semibold">{slot.end_time}</p>
                      <span className="inline-block mt-1 text-[9px] bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded font-black">
                        Period {slot.period_number}
                      </span>
                    </div>
                  </div>

                  {/* Class details */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500">
                        {slot.room_number ? `${slot.room_number} (${slot.building || 'Main Block'})` : 'Campus Room'}
                      </span>
                    </div>
                  </div>

                  {/* Cancel Button */}
                  {!slot.is_cancelled && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleOpenCancelModal(slot)}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all border border-rose-100"
                      >
                        Cancel Class
                      </button>
                    </div>
                  )}

                  {/* Remarks show for cancelled classes */}
                  {slot.is_cancelled && slot.remarks && (
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      <p className="text-[10px] font-semibold text-slate-500">
                        {slot.remarks}
                      </p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-5 animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" /> Cancel Class?
              </h3>
              <button 
                disabled={cancelling}
                onClick={() => setSelectedSlot(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            
            <p className="text-xs leading-relaxed mb-4 text-slate-500">
              Are you sure you want to cancel the class <span className="font-extrabold text-slate-800">{selectedSlot.subject_name}</span>?
              <br /><br />
              All enrolled students will receive push alerts and notice board updates immediately.
            </p>

            {/* Optional cancellation reason */}
            <div className="mb-5">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Health issue, Out of station, Rescheduled..."
                className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-3 text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-all resize-none h-16"
                disabled={cancelling}
              />
            </div>

            <div className="flex gap-2">
              <button
                disabled={cancelling}
                onClick={() => setSelectedSlot(null)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold active:scale-[0.98] transition-all hover:bg-slate-200"
              >
                Go Back
              </button>
              <button
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl text-xs font-bold active:scale-[0.98] transition-all hover:bg-rose-700 flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default FacultyTimetable;
