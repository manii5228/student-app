import React, { useState } from 'react';
import { ChevronLeft, Plus, Clock, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Slot { date:string; start_time:string; end_time:string; }

const FacultyMeetingScheduler = () => {
  const nav = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlot, setNewSlot] = useState({ date:'', start_time:'', end_time:'' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const addSlot = () => {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) return;
    setSlots([...slots, {...newSlot}]);
    setNewSlot({date:'', start_time:'', end_time:''});
  };
  const removeSlot = (i:number) => setSlots(slots.filter((_,idx)=>idx!==i));

  const publish = async () => {
    if (slots.length===0) return;
    setSubmitting(true);
    try { await api.post('/faculty/meetings/slots', { slots }); setSuccess(true); setSlots([]); } catch{}
    setSubmitting(false);
  };

  const timeSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-cyan-600 to-blue-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Office Hours</h1><p className="text-xs text-cyan-200">Set meeting slots for students</p></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {success && <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-2 animate-slide-up"><CheckCircle className="w-5 h-5 text-emerald-600"/><div><p className="text-sm font-bold text-emerald-700">Slots Published!</p><p className="text-xs text-emerald-600">Students can now book these slots.</p></div></div>}

        {/* Add new slot */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4 animate-slide-up">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-cyan-600"/>Add Time Slot</h3>
          <div className="flex flex-col gap-3">
            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date</label><input type="date" value={newSlot.date} onChange={e=>setNewSlot({...newSlot,date:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">From</label><select value={newSlot.start_time} onChange={e=>setNewSlot({...newSlot,start_time:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"><option value="">Select</option>{timeSlots.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">To</label><select value={newSlot.end_time} onChange={e=>setNewSlot({...newSlot,end_time:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"><option value="">Select</option>{timeSlots.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <button onClick={addSlot} disabled={!newSlot.date||!newSlot.start_time||!newSlot.end_time} className="w-full py-3 bg-cyan-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 active:scale-[0.98] transition-all">+ Add Slot</button>
          </div>
        </div>

        {/* Queued slots */}
        {slots.length > 0 && <>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Queued Slots ({slots.length})</h3>
          <div className="flex flex-col gap-2 mb-4">
            {slots.map((s,i) => (
              <div key={i} className="bg-white rounded-[16px] p-3 flex items-center justify-between shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-cyan-600"/>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{new Date(s.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</p>
                    <p className="text-[11px] text-slate-500">{s.start_time} – {s.end_time}</p>
                  </div>
                </div>
                <button onClick={()=>removeSlot(i)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button>
              </div>
            ))}
          </div>
          <button onClick={publish} disabled={submitting} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">{submitting?'Publishing...':'Publish All Slots'}</button>
        </>}
      </div>
      <BottomNav/>
    </div>
  );
};
export default FacultyMeetingScheduler;
