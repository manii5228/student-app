import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Stethoscope, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Appointment { id:string; appointment_type:string; description:string|null; preferred_date:string|null; preferred_time:string|null; status:string; doctor_name:string; notes:string|null; }

const HealthCenter = () => {
  const nav = useNavigate();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [form, setForm] = useState({ appointment_type:'general', description:'', preferred_date:'', preferred_time:'morning' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const {data}=await api.get('/utility/health/appointments'); setAppts(data.appointments||[]); } catch{} setLoading(false); };

  const book = async () => {
    if (!form.preferred_date) return;
    setSubmitting(true);
    try { await api.post('/utility/health/appointments', form); setShowBook(false); setForm({appointment_type:'general',description:'',preferred_date:'',preferred_time:'morning'}); load(); } catch{}
    setSubmitting(false);
  };

  const cancel = async (id:string) => { try { await api.post(`/utility/health/appointments/${id}/cancel`); load(); } catch{} };

  const types = [{v:'general',l:'🏥 General',c:'bg-blue-100 text-blue-700'},{v:'dental',l:'🦷 Dental',c:'bg-purple-100 text-purple-700'},{v:'eye',l:'👁️ Eye',c:'bg-cyan-100 text-cyan-700'},{v:'mental_health',l:'🧠 Mental Health',c:'bg-pink-100 text-pink-700'}];
  const statusBadge = (s:string) => s==='pending'?'bg-amber-100 text-amber-700':s==='confirmed'?'bg-emerald-100 text-emerald-700':s==='completed'?'bg-slate-100 text-slate-500':'bg-red-100 text-red-600';

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
            <div><h1 className="text-xl font-bold text-white">Health Center</h1><p className="text-xs text-red-100">Campus clinic appointments</p></div>
          </div>
          <button onClick={()=>setShowBook(true)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"><Plus className="w-5 h-5"/></button>
        </div>
        {/* Quick info */}
        <div className="flex gap-3 mt-4 relative z-10">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center"><p className="text-lg font-black text-white">{appts.filter(a=>a.status==='pending'||a.status==='confirmed').length}</p><p className="text-[9px] font-bold text-red-200 uppercase">Upcoming</p></div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center"><p className="text-lg font-black text-white">{appts.filter(a=>a.status==='completed').length}</p><p className="text-[9px] font-bold text-red-200 uppercase">Completed</p></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></span></div>
        : appts.length===0 ? (
          <div className="text-center py-20"><Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No Appointments</h2><p className="text-sm text-slate-500 mt-1 mb-4">Book a visit to the campus clinic.</p><button onClick={()=>setShowBook(true)} className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-sm">+ Book Appointment</button></div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            {appts.map(a=>(
              <div key={a.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 capitalize">{a.appointment_type.replace('_',' ')} Checkup</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{a.doctor_name}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${statusBadge(a.status)}`}>{a.status}</span>
                </div>
                {a.description && <p className="text-xs text-slate-500 mt-2">{a.description}</p>}
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/>{a.preferred_date?new Date(a.preferred_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):''}</span>
                  <span className="text-[10px] font-bold text-slate-400 capitalize">{a.preferred_time}</span>
                </div>
                {a.notes && <div className="mt-2 bg-blue-50 rounded-xl px-3 py-2"><p className="text-xs text-blue-700">📝 {a.notes}</p></div>}
                {(a.status==='pending'||a.status==='confirmed')&&<button onClick={()=>cancel(a.id)} className="mt-3 w-full py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100">Cancel Appointment</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showBook && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg animate-slide-up">
          <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-slate-900">Book Appointment</h2><button onClick={()=>setShowBook(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button></div>
          <div className="flex flex-col gap-3">
            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Type</label>
              <div className="grid grid-cols-2 gap-2">{types.map(t=><button key={t.v} onClick={()=>setForm({...form,appointment_type:t.v})} className={`py-3 rounded-2xl text-xs font-bold border-2 transition-all ${form.appointment_type===t.v?'border-red-500 bg-red-50 text-red-700':'border-slate-200 text-slate-600'}`}>{t.l}</button>)}</div>
            </div>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe your issue (optional)" rows={2} className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-red-400 resize-none"/>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date *</label><input type="date" value={form.preferred_date} onChange={e=>setForm({...form,preferred_date:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-red-400"/></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Time</label><select value={form.preferred_time} onChange={e=>setForm({...form,preferred_time:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-red-400"><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></div>
            </div>
            <button onClick={book} disabled={submitting||!form.preferred_date} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-sm hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-40">{submitting?'Booking...':'Book Appointment'}</button>
          </div>
        </div>
      </div>}
      <BottomNav/>
    </div>
  );
};
export default HealthCenter;
