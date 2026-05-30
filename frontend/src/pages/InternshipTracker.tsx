import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Briefcase, Calendar, DollarSign, Trash2, X, Award, CheckCircle2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface InternshipT { 
  id: string; 
  company_name: string; 
  role_title: string; 
  description: string | null; 
  start_date: string | null; 
  end_date: string | null; 
  stipend: number | null; 
  mode: string; 
  certificate_url: string | null; 
  status: string; 
  skills_learned: string | null; 
  is_verified?: boolean; 
}

const InternshipTracker = () => {
  const nav = useNavigate();
  const [list, setList] = useState<InternshipT[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [form, setForm] = useState({ 
    company_name: '', 
    role_title: '', 
    description: '', 
    start_date: '', 
    end_date: '', 
    stipend: '', 
    mode: 'onsite', 
    skills_learned: '', 
    status: 'ongoing' 
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => { 
    try { 
      const { data } = await api.get('/career/internships'); 
      setList(data.internships || []); 
    } catch {} 
    setLoading(false); 
  };

  const add = async () => {
    if (!form.company_name.trim() || !form.role_title.trim() || !form.start_date) return;
    setSubmitting(true);
    try {
      const payload = {
        company_name: form.company_name,
        role_title: form.role_title,
        description: form.description.trim() || null,
        start_date: form.start_date,
        end_date: form.end_date ? form.end_date : null,
        stipend: form.stipend ? parseFloat(form.stipend) : null,
        mode: form.mode,
        skills_learned: form.skills_learned.trim() || null,
        status: form.status
      };
      await api.post('/career/internships', payload);
      setShowAdd(false); 
      setForm({ 
        company_name: '', 
        role_title: '', 
        description: '', 
        start_date: '', 
        end_date: '', 
        stipend: '', 
        mode: 'onsite', 
        skills_learned: '', 
        status: 'ongoing' 
      }); 
      fetch();
    } catch {}
    setSubmitting(false);
  };

  const del = async (id: string) => { 
    try { 
      await api.delete(`/career/internships/${id}`); 
      setList(p => p.filter(x => x.id !== id)); 
    } catch {} 
  };

  const markComplete = async (id: string) => { 
    try { 
      const { data } = await api.put(`/career/internships/${id}`, { 
        status: 'completed', 
        end_date: new Date().toISOString().split('T')[0] 
      }); 
      setList(p => p.map(x => x.id === id ? data.internship : x)); 
    } catch {} 
  };

  const ongoing = list.filter(i => i.status === 'ongoing');
  const completed = list.filter(i => i.status === 'completed');
  const modeColors: Record<string, string> = { 
    onsite: 'bg-teal-50 text-teal-700 border border-teal-100', 
    remote: 'bg-sky-50 text-sky-700 border border-sky-100', 
    hybrid: 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/career/internships/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'internships.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {}
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => { const u = JSON.parse(localStorage.getItem('user') || '{}'); nav(u.role === 'faculty' ? '/faculty/career' : '/career'); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Internship Tracker</h1>
              <p className="text-xs text-teal-100">{list.length} internships recorded</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} title="Export to CSV" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={() => setShowAdd(true)} title="Add Internship" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-3 relative z-10 mt-4">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-white">{ongoing.length}</p>
            <p className="text-[9px] font-bold text-teal-200 uppercase">Ongoing</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-white">{completed.length}</p>
            <p className="text-[9px] font-bold text-teal-200 uppercase">Completed</p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      {list.length > 0 && (
        <div className="px-4 pt-4 shrink-0 flex justify-end">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-slate-100 flex">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'timeline' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Timeline View
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900">No Internships</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">Record your internship experience to keep track.</p>
            <button onClick={() => setShowAdd(true)} className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-teal-500/10 hover:bg-teal-700 transition-all">
              + Add Internship
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-3 animate-slide-up">
            {list.map(i => (
              <div key={i.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      {i.role_title}
                      {i.is_verified && (
                        <span title="Verified by Placement Cell">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/5 shrink-0" />
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{i.company_name}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${modeColors[i.mode] || 'bg-slate-100 text-slate-500'}`}>{i.mode}</span>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${i.status === 'ongoing' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{i.status}</span>
                  </div>
                </div>
                {i.description && <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{i.description}</p>}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {i.start_date ? new Date(i.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                    {i.end_date ? ` — ${new Date(i.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ' — Present'}
                  </span>
                  {i.stipend && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5"><DollarSign className="w-3 h-3" />₹{i.stipend.toLocaleString()}/mo</span>}
                </div>
                {i.skills_learned && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {i.skills_learned.split(',').map((s, idx) => (
                      <span key={idx} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{s.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                  {i.status === 'ongoing' && (
                    <button onClick={() => markComplete(i.id)} className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1 transition-colors">
                      <Award className="w-3.5 h-3.5" />Mark Complete
                    </button>
                  )}
                  <button onClick={() => del(i.id)} className="py-2 px-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="mt-4 mb-28">
              <button
                onClick={() => setShowAdd(true)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" /> Add Internship
              </button>
            </div>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-teal-200 ml-3 flex flex-col gap-8 py-2 animate-fade-in">
            {list.map(i => (
              <div key={i.id} className="relative group">
                {/* Timeline node */}
                <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-50 shadow-md flex items-center justify-center transition-all group-hover:scale-125 ${
                  i.status === 'ongoing' ? 'bg-amber-500' : 'bg-teal-500'
                }`} />
                
                {/* Card */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {i.role_title}
                        {i.is_verified && (
                          <span title="Verified by Placement Cell">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/5 shrink-0" />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{i.company_name}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${modeColors[i.mode] || 'bg-slate-100 text-slate-500'}`}>{i.mode}</span>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${i.status === 'ongoing' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{i.status}</span>
                    </div>
                  </div>
                  {i.description && <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{i.description}</p>}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {i.start_date ? new Date(i.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                      {i.end_date ? ` — ${new Date(i.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ' — Present'}
                    </span>
                    {i.stipend && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5"><DollarSign className="w-3 h-3" />₹{i.stipend.toLocaleString()}/mo</span>}
                  </div>
                  {i.skills_learned && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {i.skills_learned.split(',').map((s, idx) => (
                        <span key={idx} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                    {i.status === 'ongoing' && (
                      <button onClick={() => markComplete(i.id)} className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1 transition-colors">
                        <Award className="w-3.5 h-3.5" />Mark Complete
                      </button>
                    )}
                    <button onClick={() => del(i.id)} className="py-2 px-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4 mb-28 mr-3">
              <button
                onClick={() => setShowAdd(true)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" /> Add Internship
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add Internship</h2>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company Name *</label>
                <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Google, TCS, etc." className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-xs font-semibold border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Role / Title *</label>
                <input value={form.role_title} onChange={e => setForm({ ...form, role_title: e.target.value })} placeholder="Software Engineer Intern" className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-xs font-semibold border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief details about your role and responsibilities..." rows={3} className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-xs font-medium border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-all resize-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full bg-slate-50 rounded-xl px-3 py-3 text-xs font-semibold border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date (optional)</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full bg-slate-50 rounded-xl px-3 py-3 text-xs font-semibold border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Stipend (₹/month)</label>
                  <input type="number" value={form.stipend} onChange={e => setForm({ ...form, stipend: e.target.value })} placeholder="15000" className="w-full bg-slate-50 rounded-xl px-3 py-3 text-xs font-semibold border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mode</label>
                  <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })} className="w-full bg-slate-50 rounded-xl px-3 py-3 text-xs font-bold text-slate-700 border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-all">
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Skills Learned</label>
                <input value={form.skills_learned} onChange={e => setForm({ ...form, skills_learned: e.target.value })} placeholder="React, Python, Git (comma-separated)" className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-xs font-semibold border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" />
              </div>
              
              <button 
                onClick={add} 
                disabled={submitting || !form.company_name.trim() || !form.role_title.trim() || !form.start_date} 
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-xs hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-teal-600/10 mt-2"
              >
                {submitting ? 'Saving...' : 'Add Internship'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default InternshipTracker;
