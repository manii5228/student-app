import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Leave { id:string; student_id:string; leave_type:string; from_date:string; to_date:string; reason:string; status:string; created_at:string; }

const FacultyLeaveApproval = () => {
  const nav = useNavigate();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending'|'all'>('pending');
  const [processing, setProcessing] = useState<string|null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const {data} = await api.get('/faculty/leaves'); setLeaves(data.leaves || []); } catch{} setLoading(false); };

  const handleAction = async (id:string, status:'approved'|'rejected') => {
    setProcessing(id);
    try { await api.put(`/faculty/leaves/${id}/approve`, { status }); load(); } catch{}
    setProcessing(null);
  };

  const filtered = filter === 'pending' ? leaves.filter(l=>l.status==='pending') : leaves;
  const statusIcon = (s:string) => s==='pending'?<Clock className="w-4 h-4 text-amber-500"/>:s==='approved'?<CheckCircle className="w-4 h-4 text-emerald-500"/>:<XCircle className="w-4 h-4 text-red-500"/>;
  const statusColor = (s:string) => s==='pending'?'bg-amber-100 text-amber-700':s==='approved'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-600';

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Leave Approval</h1><p className="text-xs text-teal-200">Review student applications</p></div>
        </div>
        <div className="flex gap-3 mt-4 relative z-10">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center"><p className="text-lg font-black text-white">{leaves.filter(l=>l.status==='pending').length}</p><p className="text-[9px] font-bold text-teal-200 uppercase">Pending</p></div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center"><p className="text-lg font-black text-white">{leaves.filter(l=>l.status==='approved').length}</p><p className="text-[9px] font-bold text-teal-200 uppercase">Approved</p></div>
        </div>
      </div>

      <div className="flex gap-2 px-4 mt-4">
        <button onClick={()=>setFilter('pending')} className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${filter==='pending'?'bg-teal-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}>Pending</button>
        <button onClick={()=>setFilter('all')} className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${filter==='all'?'bg-teal-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}>All</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></span></div>
        : filtered.length===0 ? <div className="text-center py-20"><AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No {filter} leaves</h2></div>
        : <div className="flex flex-col gap-3 animate-slide-up">
          {filtered.map(l=>(
            <div key={l.id} className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 capitalize">{l.leave_type} Leave</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{l.from_date} → {l.to_date}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase flex items-center gap-1 ${statusColor(l.status)}`}>{statusIcon(l.status)}{l.status}</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-xl px-3 py-2">{l.reason}</p>
              {l.status==='pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>handleAction(l.id,'approved')} disabled={processing===l.id} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5"/>Approve</button>
                  <button onClick={()=>handleAction(l.id,'rejected')} disabled={processing===l.id} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1"><XCircle className="w-3.5 h-3.5"/>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>}
      </div>
      <BottomNav/>
    </div>
  );
};
export default FacultyLeaveApproval;
