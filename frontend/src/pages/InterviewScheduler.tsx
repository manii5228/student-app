import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Clock, MapPin, CheckCircle, AlertCircle, Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Interview {
  id: string;
  posting_id: string;
  round_name: string;
  scheduled_at: string | null;
  venue: string | null;
  status: string;
  company_name?: string;
}

interface Slot {
  id: string;
  time: string;
  available: boolean;
}

const InterviewScheduler = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobIdForBooking, setActiveJobIdForBooking] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'book'>('schedule');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hardcoded target companies that student applied for (for booking simulation)
  const appliedJobsToBook = [
    { id: '3', company_name: 'Deloitte', role: 'Analyst' },
    { id: '2', company_name: 'Amazon', role: 'SDE-1' }
  ];

  const fetchInterviews = async () => {
    try {
      const { data } = await api.get('/career/interviews');
      // For each interview, map company name based on posting_id
      const enriched = (data.interviews || []).map((iv: Interview) => {
        let company_name = 'Deloitte';
        if (iv.posting_id === '4') company_name = 'TCS';
        else if (iv.posting_id === '2') company_name = 'Amazon';
        else if (iv.posting_id === '1') company_name = 'Google';
        return { ...iv, company_name };
      });
      setInterviews(enriched);
    } catch (err) {
      console.warn("Failed to fetch interviews, seeding default list");
      setInterviews([
        { id: '1', posting_id: '3', round_name: 'Technical Round 1', scheduled_at: new Date(Date.now() + 172800000).toISOString(), venue: 'Main Block Cabin 104', status: 'scheduled', company_name: 'Deloitte' },
        { id: '2', posting_id: '4', round_name: 'Aptitude Screening', scheduled_at: new Date(Date.now() - 432000000).toISOString(), venue: 'Online Test Center', status: 'completed', company_name: 'TCS' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchSlots = async (jobId: string) => {
    try {
      const { data } = await api.get(`/career/jobs/${jobId}/interview-slots`);
      setAvailableSlots(data.slots || []);
      setActiveJobIdForBooking(jobId);
    } catch {
      // Mock slots
      const now = new Date();
      const mock = Array.from({ length: 5 }, (_, i) => {
        const t = new Date(now);
        t.setDate(now.getDate() + i + 1);
        t.setHours(10 + i, 0, 0, 0);
        return { id: `slot-${i}`, time: t.toISOString(), available: true };
      });
      setAvailableSlots(mock);
      setActiveJobIdForBooking(jobId);
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlotId || !activeJobIdForBooking) return;
    const selectedSlot = availableSlots.find(s => s.id === selectedSlotId);
    if (!selectedSlot) return;

    setBookingInProgress(true);
    try {
      await api.post(`/career/jobs/${activeJobIdForBooking}/book-interview`, {
        time: selectedSlot.time,
        round_name: activeJobIdForBooking === '2' ? 'Amazon SDE-1 Technical Round 1' : 'Deloitte Analyst Interview'
      });
      setSuccessMessage('Interview slot booked successfully! Added to your schedule.');
      setActiveJobIdForBooking(null);
      setSelectedSlotId(null);
      setActiveTab('schedule');
      fetchInterviews();
    } catch (err) {
      setErrorMessage('Failed to book slot. You might have a scheduling conflict.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const upcoming = interviews.filter(i => i.status === 'scheduled');
  const past = interviews.filter(i => i.status !== 'scheduled');

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  const formatTime = (d: string | null) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };
  
  const daysUntil = (d: string | null) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);
  };

  // Google Maps off-campus routing helper
  const getMapsLink = (venue: string | null) => {
    if (!venue) return '';
    // If it's on-campus, search VelTech campus maps, otherwise search directly
    const query = venue.toLowerCase().includes('cabin') || venue.toLowerCase().includes('block') 
      ? `Veltech University, Chennai, ${venue}` 
      : venue;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => { const u = JSON.parse(localStorage.getItem('user') || '{}'); navigate(u.role === 'faculty' ? '/faculty/career' : '/career'); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Interview Board</h1>
              <p className="text-xs text-violet-200">{upcoming.length} upcoming rounds</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-5 pb-2 shrink-0">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'schedule' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500'
            }`}
          >
            My Schedule
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'book' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500'
            }`}
          >
            Book Slots (Calendly)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : activeTab === 'schedule' ? (
          /* SCHEDULE VIEW */
          interviews.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">No Interviews Scheduled</h2>
              <p className="text-sm text-slate-500 mt-1">Shortlisted drives will prompt slot bookings.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-slide-up pb-28">
              {upcoming.length > 0 && (
                <>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Upcoming Rounds</h3>
                  {upcoming.map(iv => {
                    const days = daysUntil(iv.scheduled_at);
                    const mapsUrl = getMapsLink(iv.venue);
                    return (
                      <div key={iv.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-violet-100 relative">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded uppercase">
                              {iv.company_name}
                            </span>
                            <h3 className="text-base font-black text-slate-900 mt-1.5 leading-tight">{iv.round_name}</h3>
                            <p className="text-xs text-slate-500 font-semibold mt-1">{formatDate(iv.scheduled_at)}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase shrink-0 ${
                            days !== null && days <= 1 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-violet-50 text-violet-700 border border-violet-100'
                          }`}>
                            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d away`}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{formatTime(iv.scheduled_at)}</span>
                            {iv.venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{iv.venue}</span>}
                          </div>
                          
                          {/* Google Maps off-campus and directions routing */}
                          {iv.venue && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 self-start flex items-center gap-1 text-[10px] font-black text-violet-600 hover:text-violet-800 transition-colors uppercase tracking-wider"
                            >
                              <ExternalLink className="w-3 h-3" /> Get Directions (Google Maps)
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              {past.length > 0 && (
                <>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 pl-1">Past Drives</h3>
                  {past.map(iv => (
                    <div key={iv.id} className="bg-white/70 rounded-[24px] p-5 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                            {iv.company_name}
                          </span>
                          <h3 className="text-sm font-bold text-slate-600 mt-1">{iv.round_name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDate(iv.scheduled_at)}</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-1 rounded-lg uppercase bg-emerald-50 text-emerald-600 flex items-center gap-1 border border-emerald-100">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        ) : (
          /* CALENDLY BOOKING TAB */
          <div className="flex flex-col gap-4 animate-fade-in pb-28">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Shortlisted Placements</h3>
            <p className="text-xs text-slate-500 -mt-2 leading-relaxed">Select a drive to pick your preferred interview time slot.</p>
            
            <div className="flex flex-col gap-3">
              {appliedJobsToBook.map(job => {
                const alreadyBooked = interviews.some(iv => iv.posting_id === job.id && iv.status === 'scheduled');
                
                return (
                  <div key={job.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{job.company_name}</h4>
                      <p className="text-xs text-slate-500">{job.role}</p>
                    </div>
                    {alreadyBooked ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-3 py-1.5 rounded-xl border border-emerald-100">
                        Booked
                      </span>
                    ) : (
                      <button
                        onClick={() => fetchSlots(job.id)}
                        className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-black px-4 py-2 rounded-xl"
                      >
                        Book Slot
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar-style booking modal (mobile optimized) */}
            {activeJobIdForBooking && (() => {
              // Group slots by date for calendar view
              const slotsByDate: Record<string, Slot[]> = {};
              availableSlots.forEach(slot => {
                const dateKey = new Date(slot.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                if (!slotsByDate[dateKey]) slotsByDate[dateKey] = [];
                slotsByDate[dateKey].push(slot);
              });
              const dateKeys = Object.keys(slotsByDate);
              const activeDateKey = selectedSlotId 
                ? (() => {
                    const activeSlot = availableSlots.find(s => s.id === selectedSlotId);
                    return activeSlot ? new Date(activeSlot.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : dateKeys[0];
                  })()
                : dateKeys[0];

              return (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-0">
                  <div className="bg-white rounded-t-[32px] w-full max-w-md shadow-2xl animate-slide-up flex flex-col" style={{ maxHeight: '85vh' }}>
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 pb-3 shrink-0">
                      <div>
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5 text-violet-600" /> Select Slot
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">Pick a date, then choose a time.</p>
                      </div>
                      <button
                        onClick={() => { setActiveJobIdForBooking(null); setSelectedSlotId(null); }}
                        className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-200"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Date selector - horizontal scrollable calendar row */}
                    <div className="px-4 pb-3 shrink-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-1">Available Dates</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {dateKeys.map(dateKey => {
                          const dt = new Date(slotsByDate[dateKey][0].time);
                          const dayName = dt.toLocaleDateString('en-IN', { weekday: 'short' });
                          const dayNum = dt.getDate();
                          const monthName = dt.toLocaleDateString('en-IN', { month: 'short' });
                          const isActive = dateKey === activeDateKey;
                          const hasSelected = slotsByDate[dateKey].some(s => s.id === selectedSlotId);

                          return (
                            <button
                              key={dateKey}
                              onClick={() => {
                                // If not already selecting a slot on this date, clear selection
                                if (!hasSelected) setSelectedSlotId(null);
                              }}
                              className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border transition-all min-w-[72px] ${
                                isActive
                                  ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/20'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                              }`}
                            >
                              <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-violet-200' : 'text-slate-400'}`}>{dayName}</span>
                              <span className="text-xl font-black leading-tight">{dayNum}</span>
                              <span className={`text-[10px] font-bold ${isActive ? 'text-violet-200' : 'text-slate-400'}`}>{monthName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time slots for selected date */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-1">Available Times — {activeDateKey}</p>
                      <div className="flex flex-col gap-2">
                        {(slotsByDate[activeDateKey || dateKeys[0]] || []).map(slot => {
                          const timeStr = new Date(slot.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                          const isSelected = selectedSlotId === slot.id;

                          return (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-violet-600 bg-violet-50 shadow-sm'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-violet-600' : 'bg-slate-100'}`}>
                                  <Clock className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                </div>
                                <div>
                                  <p className={`text-sm font-bold ${isSelected ? 'text-violet-700' : 'text-slate-800'}`}>{timeStr}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">60 min slot</p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Confirm button */}
                    <div className="p-4 pt-2 border-t border-slate-100 shrink-0 pb-8">
                      <button
                        onClick={handleBookSlot}
                        disabled={!selectedSlotId || bookingInProgress}
                        className="w-full bg-violet-600 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-violet-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {bookingInProgress ? (
                          <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Booking Slot...</>
                        ) : (
                          <><CalendarIcon className="w-4 h-4" /> Confirm Appointment</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Success Modal */}
      {successMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Success</h3>
            <p className="text-xs font-semibold text-slate-600 mb-6 leading-relaxed">{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage(null)} 
              className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-xs"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Failed</h3>
            <p className="text-xs font-semibold text-slate-600 mb-6 leading-relaxed">{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!activeJobIdForBooking && <BottomNav />}
    </div>
  );
};

export default InterviewScheduler;
