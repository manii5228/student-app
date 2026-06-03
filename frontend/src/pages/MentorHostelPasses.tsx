import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, XCircle, Search, Clock, Shield } from 'lucide-react';
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
  mentor_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const MentorHostelPasses = () => {
  const navigate = useNavigate();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPasses = async () => {
    try {
      const { data } = await api.get('/campus/hostel-pass/mentees');
      setPasses(data.passes || []);
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
      const endpoint = '/campus/hostel-pass/bulk-status';
      
      await api.put(endpoint, {
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
    // 1. Search query filter
    if (search && !p.student_name.toLowerCase().includes(search.toLowerCase()) && !p.student_reg.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    // 2. Status filtering
    if (filter === 'pending') {
      return p.mentor_status === 'pending';
    }
    return true;
  });

  const getRoleStatus = (p: Pass) => {
    return p.mentor_status;
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-slate-900 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/faculty')} 
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Hostel Out-Passes</h1>
              <p className="text-xs text-slate-450 font-medium">
                🛡️ Mentee Approvals Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative z-10">
          <input 
            type="text" 
            placeholder="Search by student name or reg no..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 transition-all font-semibold"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col gap-3 z-10 shadow-sm sticky top-0">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => { setFilter('pending'); setSelected(new Set()); }} 
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'pending' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'
            }`}
          >
            Pending ({filtered.filter(p => getRoleStatus(p) === 'pending').length})
          </button>
          <button 
            onClick={() => { setFilter('all'); setSelected(new Set()); }} 
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
            }`}
          >
            All Passes
          </button>
        </div>
        
        {filter === 'pending' && filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selected.size === filtered.length && filtered.length > 0} 
                onChange={() => handleSelectAll(filtered)} 
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" 
              />
              Select All
            </label>
            {selected.size > 0 && (
              <div className="flex gap-2 animate-scale-in">
                <button 
                  onClick={() => bulkUpdateStatus('rejected')} 
                  disabled={isSubmitting} 
                  className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-black rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                >
                  Reject ({selected.size})
                </button>
                <button 
                  onClick={() => bulkUpdateStatus('approved')} 
                  disabled={isSubmitting} 
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-black rounded-lg hover:bg-emerald-700 transition-colors shadow-md active:scale-95"
                >
                  Approve ({selected.size})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Passes Feed List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h2 className="text-sm font-bold text-slate-800">No Passes Found</h2>
            <p className="text-xs text-slate-450 mt-1">There are no circulars or requests pending under this view.</p>
          </div>
        ) : (
          filtered.map(p => {
            const roleStatus = getRoleStatus(p);
            return (
              <div key={p.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex gap-3 animate-slide-up hover:border-slate-200 transition-all">
                {roleStatus === 'pending' && filter === 'pending' && (
                  <div className="pt-1 shrink-0">
                    <input 
                      type="checkbox" 
                      checked={selected.has(p.id)} 
                      onChange={() => handleSelect(p.id)} 
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer" 
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 truncate">{p.student_name}</h3>
                      <p className="text-[9px] font-bold text-slate-400">{p.student_reg}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      roleStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-250' : 
                      roleStatus === 'rejected' ? 'bg-red-50 text-red-600 border border-red-250' : 
                      'bg-amber-50 text-amber-600 border border-amber-250'
                    }`}>
                      {roleStatus}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-600 mt-2.5 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{p.reason}"
                  </p>
                  
                  {/* Approval Pipeline Status Row */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3.5 text-[9px] text-slate-400 font-black uppercase border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1">
                      🛡️ Mentor Approval Status: 
                      <strong className={
                        p.mentor_status === 'approved' ? 'text-emerald-600' : 
                        p.mentor_status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                      }>
                        {p.mentor_status || 'pending'}
                      </strong>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 mt-2.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400"/> From: {new Date(p.from_date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400"/> To: {new Date(p.to_date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default MentorHostelPasses;
