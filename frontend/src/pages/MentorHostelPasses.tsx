import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, XCircle, Search, Clock, MapPin, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Pass {
  id: string;
  student_name: string;
  student_reg: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const MentorHostelPasses = () => {
  const navigate = useNavigate();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'pending'>('pending');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPasses = async () => {
    try {
      const { data } = await api.get('/campus/hostel-pass/mentees');
      setPasses(data.passes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const handleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSelectAll = (filteredPasses: Pass[]) => {
    if (selected.size === filteredPasses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredPasses.map(p => p.id)));
    }
  };

  const bulkUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (selected.size === 0) return;
    setIsSubmitting(true);
    try {
      await api.put('/campus/hostel-pass/bulk-status', {
        ids: Array.from(selected),
        status
      });
      setSelected(new Set());
      await fetchPasses();
    } catch (err) {
      console.error(err);
      alert('Failed to update statuses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = passes.filter(p => {
    if (filter === 'pending' && p.status !== 'pending') return false;
    if (search && !p.student_name.toLowerCase().includes(search.toLowerCase()) && !p.student_reg.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-slate-900 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Hostel Out-Passes</h1>
            <p className="text-xs text-slate-300">Mentee Approvals</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative z-10">
          <input 
            type="text" 
            placeholder="Search by student name or reg no..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col gap-3 z-10 shadow-sm sticky top-0">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => {setFilter('pending'); setSelected(new Set());}} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filter==='pending'?'bg-white shadow text-emerald-600':'text-slate-500'}`}>Pending</button>
          <button onClick={() => {setFilter('all'); setSelected(new Set());}} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filter==='all'?'bg-white shadow text-slate-800':'text-slate-500'}`}>All Passes</button>
        </div>
        
        {filter === 'pending' && filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={() => handleSelectAll(filtered)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
              Select All
            </label>
            {selected.size > 0 && (
              <div className="flex gap-2">
                <button onClick={() => bulkUpdateStatus('rejected')} disabled={isSubmitting} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors">Reject ({selected.size})</button>
                <button onClick={() => bulkUpdateStatus('approved')} disabled={isSubmitting} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Approve ({selected.size})</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-20"><span className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></span></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-800">No Passes Found</h2>
            <p className="text-xs text-slate-500 mt-1">You're all caught up!</p>
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3 animate-slide-up">
              {p.status === 'pending' && (
                <div className="pt-1 shrink-0">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => handleSelect(p.id)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate">{p.student_name}</h3>
                    <p className="text-[10px] font-bold text-slate-400">{p.student_reg}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${p.status==='approved'?'bg-emerald-50 text-emerald-600 border border-emerald-200':p.status==='rejected'?'bg-red-50 text-red-600 border border-red-200':'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                    {p.status}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 mt-2 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">"{p.reason}"</p>
                
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 mt-3">
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3"/> From: {new Date(p.from_date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3"/> To: {new Date(p.to_date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default MentorHostelPasses;
