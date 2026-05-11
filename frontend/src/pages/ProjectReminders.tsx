import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, CheckCircle, Circle, Trash2, Calendar, Users, FolderKanban, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface MilestoneT { id: string; title: string; due_date: string | null; is_completed: boolean; }
interface ProjectT { id: string; title: string; description: string|null; team_members: string|null; deadline: string|null; status: string; progress_pct: number; milestones: MilestoneT[]; }

const ProjectReminders = () => {
  const nav = useNavigate();
  const [projects, setProjects] = useState<ProjectT[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '', deadline: '', team: '' });
  const [newMs, setNewMs] = useState<{title:string;due_date:string}[]>([]);
  const [msInput, setMsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string|null>(null);

  useEffect(() => { fetch(); }, []);
  const fetch = async () => { try { const {data} = await api.get('/career/projects'); setProjects(data.projects||[]); } catch{} setLoading(false); };

  const create = async () => {
    if(!form.title.trim()) return; setSubmitting(true);
    try { await api.post('/career/projects', { title:form.title, description:form.desc||undefined, deadline:form.deadline||undefined, team_members:form.team||undefined, milestones:newMs }); setShowCreate(false); setForm({title:'',desc:'',deadline:'',team:''}); setNewMs([]); fetch(); } catch{}
    setSubmitting(false);
  };

  const toggle = async (mid:string) => { try { const {data} = await api.post(`/career/milestones/${mid}/toggle`); setProjects(p=>p.map(x=>x.id===data.project.id?data.project:x)); } catch{} };
  const del = async (pid:string) => { try { await api.delete(`/career/projects/${pid}`); setProjects(p=>p.filter(x=>x.id!==pid)); } catch{} };
  const addMs = async (pid:string) => { const t=prompt('Milestone title:'); if(!t) return; try { const {data}=await api.post(`/career/projects/${pid}/milestones`,{title:t}); setProjects(p=>p.map(x=>x.id===data.project.id?data.project:x)); } catch{} };

  const daysLeft = (d:string|null) => { if(!d) return null; return Math.ceil((new Date(d).getTime()-Date.now())/(864e5)); };
  const statusStyle = (s:string) => s==='completed'?'bg-emerald-100 text-emerald-700':s==='overdue'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700';

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-cyan-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={()=>nav('/career')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
            <div><h1 className="text-xl font-bold text-white">Project Tracker</h1><p className="text-xs text-cyan-100">{projects.length} projects</p></div>
          </div>
          <button onClick={()=>setShowCreate(true)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"><Plus className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></span></div>
        : projects.length===0 ? (
          <div className="text-center py-20"><FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No Projects</h2><p className="text-sm text-slate-500 mt-1 mb-4">Create your first project.</p><button onClick={()=>setShowCreate(true)} className="bg-cyan-600 text-white px-6 py-3 rounded-2xl font-bold text-sm">+ New Project</button></div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map(p => { const d=daysLeft(p.deadline); const isExp=expanded===p.id; return (
              <div key={p.id} className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={()=>setExpanded(isExp?null:p.id)} className="w-full p-5 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1"><h3 className="text-sm font-bold text-slate-900 truncate">{p.title}</h3><span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${statusStyle(p.status)}`}>{p.status.replace('_',' ')}</span></div>
                      {p.description && <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>}
                    </div>
                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36"><path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3"/><path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={p.progress_pct===100?'#10b981':p.status==='overdue'?'#ef4444':'#06b6d4'} strokeWidth="3" strokeDasharray={`${p.progress_pct}, 100`} strokeLinecap="round"/></svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">{p.progress_pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {p.deadline && <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg ${d!==null&&d<0?'bg-red-50 text-red-600':d!==null&&d<=3?'bg-amber-50 text-amber-600':'bg-slate-50 text-slate-500'}`}><Calendar className="w-3 h-3"/>{d!==null&&d<0?`${Math.abs(d)}d overdue`:d===0?'Due today':`${d}d left`}</span>}
                    {p.team_members && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Users className="w-3 h-3"/>{p.team_members.split(',').length}</span>}
                    <span className="text-[10px] font-bold text-slate-400">{p.milestones.filter(m=>m.is_completed).length}/{p.milestones.length} done</span>
                  </div>
                </button>
                {isExp && <div className="border-t border-slate-100 px-5 pb-4 animate-fade-in">
                  {p.milestones.map(ms=>(
                    <button key={ms.id} onClick={()=>toggle(ms.id)} className="w-full flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 text-left group">
                      {ms.is_completed?<CheckCircle className="w-5 h-5 text-emerald-500 shrink-0"/>:<Circle className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-cyan-400"/>}
                      <span className={`text-sm flex-1 ${ms.is_completed?'line-through text-slate-400':'text-slate-700 font-medium'}`}>{ms.title}</span>
                      {ms.due_date && <span className="text-[10px] font-bold text-slate-400">{new Date(ms.due_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>}
                    </button>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <button onClick={()=>addMs(p.id)} className="flex-1 py-2.5 bg-cyan-50 text-cyan-700 rounded-xl text-xs font-bold hover:bg-cyan-100 flex items-center justify-center gap-1"><Plus className="w-3 h-3"/>Add Milestone</button>
                    <button onClick={()=>del(p.id)} className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>}
              </div>
            );})}
          </div>
        )}
      </div>

      {showCreate && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
          <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-slate-900">New Project</h2><button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button></div>
          <div className="flex flex-col gap-4">
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Project title *" className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"/>
            <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Description" rows={2} className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400 resize-none"/>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Deadline</label><input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Team</label><input value={form.team} onChange={e=>setForm({...form,team:e.target.value})} placeholder="Name, Name" className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Milestones</label>
              {newMs.map((m,i)=><div key={i} className="flex items-center gap-2 mb-2"><Circle className="w-4 h-4 text-slate-300 shrink-0"/><span className="text-sm text-slate-700 flex-1">{m.title}</span><button onClick={()=>setNewMs(p=>p.filter((_,idx)=>idx!==i))} className="text-red-400"><X className="w-3 h-3"/></button></div>)}
              <div className="flex gap-2"><input value={msInput} onChange={e=>setMsInput(e.target.value)} placeholder="Add milestone..." onKeyDown={e=>{if(e.key==='Enter'&&msInput.trim()){setNewMs(p=>[...p,{title:msInput.trim(),due_date:''}]);setMsInput('');}}} className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/><button onClick={()=>{if(msInput.trim()){setNewMs(p=>[...p,{title:msInput.trim(),due_date:''}]);setMsInput('');}}} className="px-3 py-2 bg-cyan-50 text-cyan-600 rounded-xl text-sm font-bold">+</button></div>
            </div>
            <button onClick={create} disabled={submitting||!form.title.trim()} className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-cyan-700 active:scale-[0.98] transition-all disabled:opacity-40">{submitting?'Creating...':'Create Project'}</button>
          </div>
        </div>
      </div>}
      <BottomNav/>
    </div>
  );
};
export default ProjectReminders;
