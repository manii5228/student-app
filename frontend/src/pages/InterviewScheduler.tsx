import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Interview { id:string; posting_id:string; round_name:string; scheduled_at:string|null; venue:string|null; status:string; }

const InterviewScheduler = () => {
  const nav = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/career/interviews').then(r => setInterviews(r.data.interviews || [])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const upcoming = interviews.filter(i => i.status === 'scheduled');
  const past = interviews.filter(i => i.status !== 'scheduled');

  const formatDate = (d: string|null) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatTime = (d: string|null) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };
  const daysUntil = (d: string|null) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Interview Schedule</h1><p className="text-xs text-violet-200">{upcoming.length} upcoming rounds</p></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></span></div>
        : interviews.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
            <h2 className="text-lg font-bold text-slate-900">No Interviews Scheduled</h2>
            <p className="text-sm text-slate-500 mt-1">Apply to jobs first — interviews appear here once you're shortlisted.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-slide-up">
            {upcoming.length > 0 && <>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming</h3>
              {upcoming.map(iv => {
                const days = daysUntil(iv.scheduled_at);
                return (
                  <div key={iv.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-violet-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{iv.round_name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(iv.scheduled_at)}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${days !== null && days <= 1 ? 'bg-red-100 text-red-700' : days !== null && days <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d away`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/>{formatTime(iv.scheduled_at)}</span>
                      {iv.venue && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3"/>{iv.venue}</span>}
                    </div>
                  </div>
                );
              })}
            </>}
            {past.length > 0 && <>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Past</h3>
              {past.map(iv => (
                <div key={iv.id} className="bg-white/70 rounded-[24px] p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-600">{iv.round_name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(iv.scheduled_at)}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${iv.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {iv.status === 'completed' ? <><CheckCircle className="w-3 h-3 inline mr-1"/>Done</> : iv.status}
                    </span>
                  </div>
                </div>
              ))}
            </>}
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );
};
export default InterviewScheduler;
