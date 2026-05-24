import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, CheckCircle, Circle, Trash2, Calendar, Users, FolderKanban, X, GripVertical, UserPlus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface MilestoneT { id: string; title: string; due_date: string | null; is_completed: boolean; column: string; assigned_to: string | null; }
interface ProjectT { id: string; title: string; description: string|null; team_members: string|null; deadline: string|null; status: string; progress_pct: number; milestones: MilestoneT[]; last_modified_by: string|null; last_modified_at: string|null; }

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-slate-100', accent: 'border-slate-300', badge: 'bg-slate-200 text-slate-600', icon: <Circle className="w-3.5 h-3.5" /> },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-50', accent: 'border-amber-300', badge: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'done', label: 'Done', color: 'bg-emerald-50', accent: 'border-emerald-300', badge: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
];

const ProjectReminders = () => {
  const nav = useNavigate();
  const [projects, setProjects] = useState<ProjectT[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '', deadline: '', team: '' });
  const [newMs, setNewMs] = useState<{title:string;due_date:string}[]>([]);
  const [msInput, setMsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeProject, setActiveProject] = useState<string|null>(null);
  const [dragItem, setDragItem] = useState<string|null>(null);
  const [assignModal, setAssignModal] = useState<{mid: string; members: string[]}|null>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try { const {data} = await api.get('/career/projects'); setProjects(data.projects||[]); } catch{}
    setLoading(false);
  };

  const create = async () => {
    if(!form.title.trim()) return; setSubmitting(true);
    try {
      await api.post('/career/projects', {
        title: form.title, description: form.desc||undefined,
        deadline: form.deadline||undefined, team_members: form.team||undefined,
        milestones: newMs,
      });
      setShowCreate(false); setForm({title:'',desc:'',deadline:'',team:''}); setNewMs([]); fetchProjects();
    } catch{} setSubmitting(false);
  };

  const edit = async () => {
    if(!activeProject || !form.title.trim()) return; setSubmitting(true);
    try {
      await api.put(`/career/projects/${activeProject}`, {
        title: form.title, description: form.desc||undefined,
        deadline: form.deadline||undefined, team_members: form.team||undefined,
      });
      setShowEdit(false); fetchProjects();
    } catch{} setSubmitting(false);
  };

  const del = async (pid:string) => {
    if(!confirm('Delete this project?')) return;
    try { await api.delete(`/career/projects/${pid}`); setProjects(p=>p.filter(x=>x.id!==pid)); setActiveProject(null); } catch{}
  };

  const addMs = async (pid:string) => {
    const t = prompt('Milestone title:');
    if(!t) return;
    try { const {data}=await api.post(`/career/projects/${pid}/milestones`,{title:t}); setProjects(p=>p.map(x=>x.id===data.project.id?data.project:x)); } catch{}
  };

  const moveMilestone = async (mid: string, newColumn: string) => {
    try {
      const {data} = await api.put(`/career/milestones/${mid}`, { column: newColumn });
      setProjects(p => p.map(x => x.id === data.project.id ? data.project : x));
    } catch {}
  };

  const assignMilestone = async (mid: string, assignee: string|null) => {
    try {
      const {data} = await api.put(`/career/milestones/${mid}`, { assigned_to: assignee || '' });
      setProjects(p => p.map(x => x.id === data.project.id ? data.project : x));
    } catch {}
    setAssignModal(null);
  };

  const daysLeft = (d:string|null) => { if(!d) return null; return Math.ceil((new Date(d).getTime()-Date.now())/(864e5)); };

  const currentProject = projects.find(p => p.id === activeProject);
  const teamMembers = currentProject?.team_members?.split(',').map(s=>s.trim()).filter(Boolean) || [];

  const handleDragStart = (mid: string) => setDragItem(mid);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (col: string) => {
    if (dragItem) { moveMilestone(dragItem, col); setDragItem(null); }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-600 to-teal-700 p-6 pt-12 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute right-20 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={()=> activeProject ? setActiveProject(null) : nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white"/>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{activeProject ? 'Kanban Board' : 'Project Tracker'}</h1>
              <p className="text-xs text-cyan-100">{activeProject ? currentProject?.title : `${projects.length} projects`}</p>
            </div>
          </div>
          {!activeProject && (
            <button onClick={()=>setShowCreate(true)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Plus className="w-5 h-5"/>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></span></div>
        ) : activeProject && currentProject ? (
          /* ─── KANBAN BOARD ─── */
          <div className="p-4">
            {/* Project Info Bar */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36"><path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3"/><path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={currentProject.progress_pct===100?'#10b981':'#06b6d4'} strokeWidth="3" strokeDasharray={`${currentProject.progress_pct}, 100`} strokeLinecap="round"/></svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-700">{currentProject.progress_pct}%</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{currentProject.title}</h3>
                    {currentProject.deadline && <p className="text-[10px] text-slate-400">{(() => { const d = daysLeft(currentProject.deadline); return d !== null && d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Due today' : `${d}d left`; })()}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>addMs(currentProject.id)} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-xl text-[10px] font-bold hover:bg-cyan-100 flex items-center gap-1"><Plus className="w-3 h-3"/>Task</button>
                  <button onClick={()=>del(currentProject.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100"><Trash2 className="w-3 h-3"/></button>
                </div>
              </div>
              {teamMembers.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Users className="w-3 h-3 text-slate-400"/>
                  <div className="flex gap-1">
                    {teamMembers.map((m, i) => (
                      <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status: {currentProject.status.replace('_', ' ')}</p>
                {currentProject.last_modified_by && <p className="text-[10px] text-slate-400">Last edited by {currentProject.last_modified_by}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>{setForm({title:currentProject.title, desc:currentProject.description||'', deadline:currentProject.deadline||'', team:currentProject.team_members||''}); setShowEdit(true);}} className="text-xs font-bold bg-white text-cyan-600 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">Edit Project</button>
                <button onClick={()=>addMs(currentProject.id)} className="text-xs font-bold bg-cyan-600 text-white px-3 py-1.5 rounded-lg shadow-md hover:bg-cyan-700 transition-colors">+ Task</button>
              </div>
            </div>

            {/* Kanban columns area */}
            <div className="flex-1 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
              {COLUMNS.map(col => {
                const tasks = currentProject.milestones.filter(m => m.column === col.key);
                return (
                  <div
                    key={col.key}
                    className={`min-w-[240px] flex-1 ${col.color} rounded-2xl p-3 border-2 border-dashed ${col.accent} snap-start transition-all ${dragItem ? 'border-solid' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(col.key)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        {col.icon}
                        <span className="text-xs font-bold text-slate-700">{col.label}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${col.badge}`}>{tasks.length}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {tasks.map(ms => (
                        <div
                          key={ms.id}
                          draggable
                          onDragStart={() => handleDragStart(ms.id)}
                          className={`bg-white rounded-xl p-3 shadow-sm border border-white/80 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${dragItem === ms.id ? 'opacity-50 scale-95' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0"/>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold leading-tight ${ms.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{ms.title}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {ms.due_date && (
                                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                                    <Calendar className="w-2.5 h-2.5"/>
                                    {new Date(ms.due_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                                  </span>
                                )}
                                {ms.assigned_to ? (
                                  <span className="text-[9px] font-bold bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded-md">{ms.assigned_to}</span>
                                ) : (
                                  <button
                                    onClick={() => setAssignModal({mid: ms.id, members: teamMembers})}
                                    className="text-[9px] font-bold text-slate-300 hover:text-cyan-500 flex items-center gap-0.5 transition-colors"
                                  >
                                    <UserPlus className="w-2.5 h-2.5"/>Assign
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <div className="text-center py-6 text-[10px] text-slate-400 font-medium">Drop tasks here</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        ) : projects.length === 0 ? (
          /* ─── EMPTY STATE ─── */
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 rounded-3xl bg-cyan-50 flex items-center justify-center mx-auto mb-4"><FolderKanban className="w-8 h-8 text-cyan-400"/></div>
            <h2 className="text-lg font-bold text-slate-900">No Projects Yet</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">Create your first project to start tracking.</p>
            <button onClick={()=>setShowCreate(true)} className="bg-cyan-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-cyan-700 active:scale-[0.97] transition-all">+ New Project</button>
          </div>
        ) : (
          /* ─── PROJECT LIST ─── */
          <div className="p-4 flex flex-col gap-3">
            {projects.map(p => {
              const d = daysLeft(p.deadline);
              const todo = p.milestones.filter(m=>m.column==='todo').length;
              const doing = p.milestones.filter(m=>m.column==='in_progress').length;
              const done = p.milestones.filter(m=>m.column==='done').length;
              return (
                <button key={p.id} onClick={()=>setActiveProject(p.id)} className="w-full bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{p.title}</h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${p.status==='completed'?'bg-emerald-100 text-emerald-700':p.status==='overdue'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{p.status.replace('_',' ')}</span>
                      </div>
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
                    {/* Mini Kanban indicator */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{todo}</span>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">{doing}</span>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">{done}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB for New Project */}
      {!activeProject && projects.length > 0 && (
        <button onClick={() => {setForm({title:'',desc:'',deadline:'',team:''}); setShowCreate(true);}} className="fixed bottom-28 right-4 w-14 h-14 bg-cyan-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-cyan-700 transition-all z-40 active:scale-95">
          <Plus className="w-6 h-6"/>
        </button>
      )}

      {/* ─── Assign Modal ─── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={()=>setAssignModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-slide-up" onClick={e=>e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 mb-4">Assign To</h3>
            <div className="flex flex-col gap-2">
              {assignModal.members.length > 0 ? assignModal.members.map(m => (
                <button key={m} onClick={()=>assignMilestone(assignModal.mid, m)} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 text-left hover:bg-cyan-50 hover:text-cyan-700 transition-colors flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 text-xs font-black shrink-0">{m.charAt(0)}</div>
                  {m}
                </button>
              )) : <p className="text-sm text-slate-400 text-center py-4">No team members. Add them when creating the project.</p>}
              <button onClick={()=>assignMilestone(assignModal.mid, null)} className="text-xs font-bold text-slate-400 mt-2 hover:text-red-500 transition-colors">Clear Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Project Modal ─── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">New Project</h2>
              <button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button>
            </div>
            <div className="flex flex-col gap-4">
              <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Project title *" className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"/>
              <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Description" rows={2} className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400 resize-none"/>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Deadline</label><input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Team (comma sep.)</label><input value={form.team} onChange={e=>setForm({...form,team:e.target.value})} placeholder="Name, Name" className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Milestones</label>
                {newMs.map((m,i)=><div key={i} className="flex items-center gap-2 mb-2"><Circle className="w-4 h-4 text-slate-300 shrink-0"/><span className="text-sm text-slate-700 flex-1">{m.title}</span><button onClick={()=>setNewMs(p=>p.filter((_,idx)=>idx!==i))} className="text-red-400"><X className="w-3 h-3"/></button></div>)}
                <div className="flex gap-2">
                  <input value={msInput} onChange={e=>setMsInput(e.target.value)} placeholder="Add milestone..." onKeyDown={e=>{if(e.key==='Enter'&&msInput.trim()){setNewMs(p=>[...p,{title:msInput.trim(),due_date:''}]);setMsInput('');}}} className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/>
                  <button onClick={()=>{if(msInput.trim()){setNewMs(p=>[...p,{title:msInput.trim(),due_date:''}]);setMsInput('');}}} className="px-3 py-2 bg-cyan-50 text-cyan-600 rounded-xl text-sm font-bold">+</button>
                </div>
              </div>
              <button onClick={create} disabled={submitting||!form.title.trim()} className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-cyan-700 active:scale-[0.98] transition-all disabled:opacity-40 mb-20">{submitting?'Creating...':'Create Project'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Project Modal ─── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Edit Project</h2>
              <button onClick={()=>setShowEdit(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button>
            </div>
            <div className="flex flex-col gap-4">
              <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Project title *" className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"/>
              <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Description" rows={3} className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400 resize-none"/>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Deadline</label><input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Team (comma sep.)</label><input value={form.team} onChange={e=>setForm({...form,team:e.target.value})} placeholder="Name, Name" className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
              </div>
              <button onClick={edit} disabled={submitting||!form.title.trim()} className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-cyan-700 active:scale-[0.98] transition-all disabled:opacity-40 mb-20">{submitting?'Saving...':'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  );
};
export default ProjectReminders;
