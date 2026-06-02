import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, CheckCircle, Circle, Trash2, Calendar, Users, FolderKanban, X, GripVertical, UserPlus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface MilestoneT { id: string; title: string; due_date: string | null; is_completed: boolean; column: string; assigned_to: string | null; }
interface ProjectT { id: string; title: string; description: string|null; team_members: string|null; deadline: string|null; status: string; progress_pct: number; milestones: MilestoneT[]; last_modified_by: string|null; last_modified_at: string|null; faculty_id?: string|null; faculty_status?: string|null; }

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
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');

  // Custom Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', due_date: '', assigned_to: '', column: 'todo' });

  // Collaboration indicators simulation
  const [collabNotification, setCollabNotification] = useState<string | null>(null);

  const currentProject = projects.find(p => p.id === activeProject);
  const teamMembers = currentProject?.team_members?.split(',').map(s=>s.trim()).filter(Boolean) || [];

  const isLocked = currentProject?.faculty_id && (
    currentProject.faculty_status === 'pending' || 
    currentProject.faculty_status === 'pending_completion' || 
    currentProject.faculty_status === 'completed'
  );

  useEffect(() => {
    if (activeProject) {
      const timers = [
        setTimeout(() => setCollabNotification("Priya K. joined the project workspace"), 3000),
        setTimeout(() => setCollabNotification(null), 7000),
        setTimeout(() => setCollabNotification("Rahul S. is reviewing tasks..."), 9000),
        setTimeout(() => setCollabNotification(null), 13000)
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setCollabNotification(null);
    }
  }, [activeProject]);

  useEffect(() => { 
    fetchProjects(); 
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const { data } = await api.get('/academic/faculty-directory');
      const list = data.faculty || data.faculties || (Array.isArray(data) ? data : []);
      setFaculties(list);
    } catch {}
  };

  const fetchProjects = async () => {
    try { const {data} = await api.get('/career/projects'); setProjects(data.projects||[]); } catch{}
    setLoading(false);
  };

  const create = async () => {
    if (!form.title.trim() || !form.desc.trim() || !form.deadline.trim() || !form.team.trim()) {
      alert("All fields are compulsory! Please fill in Title, Description, Deadline, and Team Members.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/career/projects', {
        title: form.title, description: form.desc,
        deadline: form.deadline, team_members: form.team,
        milestones: newMs,
        faculty_id: selectedFaculty || undefined
      });
      setShowCreate(false); setForm({title:'',desc:'',deadline:'',team:''}); setNewMs([]); setSelectedFaculty(''); fetchProjects();
    } catch{} setSubmitting(false);
  };

  const edit = async () => {
    if(!activeProject || !form.title.trim()) return; setSubmitting(true);
    try {
      await api.put(`/career/projects/${activeProject}`, {
        title: form.title, description: form.desc||undefined,
        deadline: form.deadline||undefined, team_members: form.team||undefined,
        faculty_id: selectedFaculty || null
      });
      setShowEdit(false); fetchProjects();
    } catch{} setSubmitting(false);
  };

  const del = async (pid:string) => {
    if(!confirm('Delete this project?')) return;
    try { await api.delete(`/career/projects/${pid}`); setProjects(p=>p.filter(x=>x.id!==pid)); setActiveProject(null); } catch{}
  };

  const openAddTaskModal = (col: string = 'todo') => {
    setTaskForm({ title: '', due_date: '', assigned_to: '', column: col });
    setShowTaskModal(true);
  };

  const handleCycleStatus = async (ms: MilestoneT) => {
    if (isLocked) {
      alert("Project is locked pending advisor action/completion.");
      return;
    }
    let nextCol = 'todo';
    if (ms.column === 'todo') {
      nextCol = 'in_progress';
    } else if (ms.column === 'in_progress') {
      // Done status supervisor approval prompt
      const supervisorName = prompt("This task 'Done' status requires supervisor approval. Please enter the name of the Project Supervisor / Faculty to sign off:");
      if (!supervisorName || !supervisorName.trim()) {
        alert("Supervisor approval is required to mark this task as Done!");
        return;
      }
      nextCol = 'done';
      alert(`Task signed off and approved by Prof. ${supervisorName.trim()}!`);
    } else if (ms.column === 'done') {
      nextCol = 'todo';
    }
    
    await moveMilestone(ms.id, nextCol);
  };

  const createTask = async () => {
    if (isLocked) return;
    if (!activeProject || !taskForm.title.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/career/projects/${activeProject}/milestones`, {
        title: taskForm.title.trim(),
        due_date: taskForm.due_date || undefined,
        assigned_to: taskForm.assigned_to || undefined,
        column: taskForm.column
      });
      // Handle both real backend and mock response schemas
      if (data && data.project) {
        setProjects(p => p.map(x => x.id === data.project.id ? data.project : x));
      } else if (data && data.id) {
        // Mock raw milestone response
        setProjects(p => p.map(x => {
          if (x.id === activeProject) {
            const updatedMilestones = [...x.milestones, data];
            const doneCount = updatedMilestones.filter(m => m.column === 'done').length;
            const progress_pct = updatedMilestones.length > 0 ? Math.round((doneCount / updatedMilestones.length) * 100) : 0;
            return { ...x, milestones: updatedMilestones, progress_pct };
          }
          return x;
        }));
      } else {
        fetchProjects();
      }
      setShowTaskModal(false);
    } catch {}
    setSubmitting(false);
  };

  const moveMilestone = async (mid: string, newColumn: string) => {
    if (isLocked) return;
    try {
      const {data} = await api.put(`/career/milestones/${mid}`, { column: newColumn });
      if (data && data.project) {
        setProjects(p => p.map(x => x.id === data.project.id ? data.project : x));
      } else if (data && data.milestone && data.project) {
        // Correct Python structure
        setProjects(p => p.map(x => x.id === data.project.id ? data.project : x));
      } else if (data && data.id) {
        // Mock raw milestone response
        setProjects(p => p.map(proj => {
          const hasMs = proj.milestones.some(m => m.id === mid);
          if (hasMs) {
            const updatedMilestones = proj.milestones.map(m => {
              if (m.id === mid) {
                return { ...m, column: newColumn, is_completed: newColumn === 'done' };
              }
              return m;
            });
            const doneCount = updatedMilestones.filter(m => m.column === 'done').length;
            const progress_pct = updatedMilestones.length > 0 ? Math.round((doneCount / updatedMilestones.length) * 100) : 0;
            return { ...proj, milestones: updatedMilestones, progress_pct };
          }
          return proj;
        }));
      } else {
        fetchProjects();
      }
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

  const handleDragStart = (mid: string) => setDragItem(mid);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (col: string) => {
    if (isLocked) return;
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
                  {!isLocked && (
                    <button onClick={()=>openAddTaskModal()} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-xl text-[10px] font-bold hover:bg-cyan-100 flex items-center gap-1"><Plus className="w-3 h-3"/>Task</button>
                  )}
                  <button onClick={()=>del(currentProject.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100"><Trash2 className="w-3 h-3"/></button>
                </div>
              </div>
              {teamMembers.length > 0 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400"/>
                    <div className="flex gap-1">
                      {teamMembers.map((m, i) => (
                        <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{m}</span>
                      ))}
                    </div>
                  </div>
                  {/* Collaboration Indicators */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400">Editing Now:</span>
                    <div className="flex -space-x-1.5">
                      <div className="w-5.5 h-5.5 rounded-full bg-cyan-500 text-white text-[8px] font-bold flex items-center justify-center border border-white relative shadow-sm" title="Priya K. (Viewing)">
                        P
                        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white animate-pulse"></span>
                      </div>
                      <div className="w-5.5 h-5.5 rounded-full bg-slate-500 text-white text-[8px] font-bold flex items-center justify-center border border-white relative shadow-sm" title="Rahul S. (Active)">
                        R
                        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-amber-500 rounded-full border border-white"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          <div className="flex flex-col h-full p-4">
            {/* Completion request banner */}
            {currentProject.progress_pct === 100 && currentProject.faculty_id && currentProject.faculty_status === 'approved' && (
              <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-4 mb-4 text-white shadow-md flex items-center justify-between gap-3 animate-fade-in">
                <div>
                  <h4 className="text-xs font-bold">Project 100% Done! 🚀</h4>
                  <p className="text-[10px] opacity-90">Please request completion sign-off from your advisor.</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const { data } = await api.post(`/career/projects/${currentProject.id}/complete`);
                      alert(data.message || "Completion approval requested!");
                      fetchProjects();
                    } catch {
                      alert("Failed to send request.");
                    }
                  }}
                  className="bg-white text-teal-700 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 hover:bg-slate-100 transition-colors shadow-sm animate-pulse"
                >
                  Request Sign-off
                </button>
              </div>
            )}

            {/* Advisor Status Alert Banners */}
            {currentProject.faculty_id && (
              <div className="mb-4">
                {currentProject.faculty_status === 'pending' && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold">Awaiting Advisor Acceptance</h4>
                      <p className="text-[10px] text-amber-600 mt-0.5">Your advisor request is pending. Dr. {faculties.find(f => f.id === currentProject.faculty_id)?.last_name || 'Advisor'} must accept the project before you can manage tasks.</p>
                    </div>
                  </div>
                )}
                {currentProject.faculty_status === 'declined' && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold">Supervision Request Declined</h4>
                      <p className="text-[10px] text-red-650 mt-0.5">Your advisor declined to supervise this project. Please edit the project to select another advisor.</p>
                    </div>
                  </div>
                )}
                {currentProject.faculty_status === 'pending_completion' && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold">Completion Sign-off Pending</h4>
                      <p className="text-[10px] text-blue-650 mt-0.5">You have requested project completion sign-off from your advisor. The workspace is currently locked.</p>
                    </div>
                  </div>
                )}
                {currentProject.faculty_status === 'completed' && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold">Project Completed & Approved</h4>
                      <p className="text-[10px] text-emerald-650 mt-0.5">This project is fully supervised, signed off, and marked as completed by your advisor.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status: {currentProject.status.replace('_', ' ')}</p>
                {currentProject.last_modified_by && <p className="text-[10px] text-slate-400">Last edited by {currentProject.last_modified_by}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>{setForm({title:currentProject.title, desc:currentProject.description||'', deadline:currentProject.deadline||'', team:currentProject.team_members||''}); setSelectedFaculty(currentProject.faculty_id||''); setShowEdit(true);}} className="text-xs font-bold bg-white text-cyan-600 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">Edit Project</button>
                {!isLocked && (
                  <button onClick={()=>openAddTaskModal()} className="text-xs font-bold bg-cyan-600 text-white px-3 py-1.5 rounded-lg shadow-md hover:bg-cyan-700 transition-colors">+ Task</button>
                )}
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
                          className={`bg-white rounded-xl p-3 shadow-sm border border-white/80 hover:shadow-md transition-all ${dragItem === ms.id ? 'opacity-50 scale-95' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            {/* Sequential status ticking button */}
                            <button
                              onClick={() => handleCycleStatus(ms)}
                              className="mt-0.5 shrink-0 text-slate-400 hover:text-cyan-600 transition-colors"
                              title="Cycle Status"
                            >
                              {ms.column === 'todo' && <Circle className="w-4.5 h-4.5 text-slate-400" />}
                              {ms.column === 'in_progress' && <Clock className="w-4.5 h-4.5 text-amber-500 animate-pulse" />}
                              {ms.column === 'done' && <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />}
                            </button>
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
                      {p.faculty_id && (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold text-slate-400">Advisor Status:</span>
                          <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                            p.faculty_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            p.faculty_status === 'declined' ? 'bg-red-50 text-red-705 border-red-200' :
                            p.faculty_status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                          }`}>
                            {p.faculty_status}
                          </span>
                        </div>
                      )}
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
                    <div className="flex items-center gap-1 font-sans">
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
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Faculty Advisor / Mentor</label>
                <select
                  value={selectedFaculty}
                  onChange={e => setSelectedFaculty(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">None (Self-supervised)</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>Dr. {f.first_name} {f.last_name} ({f.department})</option>
                  ))}
                </select>
              </div>
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
              <button onClick={create} disabled={submitting||!form.title.trim()||!form.desc.trim()||!form.deadline.trim()||!form.team.trim()} className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-cyan-700 active:scale-[0.98] transition-all disabled:opacity-40 mb-20">{submitting?'Creating...':'Create Project'}</button>
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
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Faculty Advisor / Mentor</label>
                <select
                  value={selectedFaculty}
                  onChange={e => setSelectedFaculty(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">None (Self-supervised)</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>Dr. {f.first_name} {f.last_name} ({f.department})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Deadline</label><input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Team (comma sep.)</label><input value={form.team} onChange={e=>setForm({...form,team:e.target.value})} placeholder="Name, Name" className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
              </div>
              <button onClick={edit} disabled={submitting||!form.title.trim()} className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-cyan-700 active:scale-[0.98] transition-all disabled:opacity-40 mb-20">{submitting?'Saving...':'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Task Modal ─── */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add New Task</h2>
              <button onClick={()=>setShowTaskModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Task Title *</label>
                <input value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})} placeholder="e.g. Design database schema" className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Due Date</label>
                  <input type="date" value={taskForm.due_date} onChange={e=>setTaskForm({...taskForm,due_date:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Column / Status</label>
                  <select value={taskForm.column} onChange={e=>setTaskForm({...taskForm,column:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Assign To</label>
                <select value={taskForm.assigned_to} onChange={e=>setTaskForm({...taskForm,assigned_to:e.target.value})} className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400">
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <button onClick={createTask} disabled={submitting||!taskForm.title.trim()} className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-cyan-700 active:scale-[0.98] transition-all disabled:opacity-40 mb-20">{submitting?'Creating Task...':'Add Task'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Collaboration Alert Toast ─── */}
      {collabNotification && (
        <div className="fixed bottom-28 left-4 right-4 z-[60] animate-slide-up flex justify-center">
          <div className="bg-slate-900/90 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            {collabNotification}
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  );
};
export default ProjectReminders;
