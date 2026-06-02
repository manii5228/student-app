import React, { useState, useEffect } from 'react';
import { ChevronLeft, FolderKanban, CheckCircle, X, Users, Calendar, Inbox, Clock, ShieldAlert, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface MilestoneT { id: string; title: string; column: string; is_completed: boolean; }
interface ProjectT { id: string; title: string; description: string|null; team_members: string|null; deadline: string|null; status: string; progress_pct: number; faculty_id: string|null; faculty_status: string|null; student_id: string; milestones: MilestoneT[]; }

const FacultyProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectT[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, studentsRes] = await Promise.all([
        api.get('/career/projects'),
        api.get('/faculty/class-students').catch(() => ({ data: { students: [] } }))
      ]);
      setProjects(projRes.data.projects || []);
      setStudents(studentsRes.data.students || []);
    } catch {}
    setLoading(false);
  };

  const handleAccept = async (pid: string) => {
    try {
      const { data } = await api.post(`/career/projects/${pid}/accept`);
      alert("Project request accepted! Student has been notified.");
      setProjects(prev => prev.map(p => p.id === pid ? data.project : p));
    } catch {
      alert("Failed to accept project request.");
    }
  };

  const handleDecline = async (pid: string) => {
    if (!confirm("Are you sure you want to decline this supervision request?")) return;
    try {
      const { data } = await api.post(`/career/projects/${pid}/decline`);
      alert("Project request declined.");
      setProjects(prev => prev.map(p => p.id === pid ? data.project : p));
    } catch {
      alert("Failed to decline request.");
    }
  };

  const handleComplete = async (pid: string) => {
    if (!confirm("Mark this project as completed? This will lock milestones at 100% done.")) return;
    try {
      const { data } = await api.post(`/career/projects/${pid}/complete`);
      alert("Project successfully marked as completed!");
      setProjects(prev => prev.map(p => p.id === pid ? data.project : p));
    } catch {
      alert("Failed to complete project.");
    }
  };

  const getStudentName = (sid: string) => {
    // If we can find the student in class directory, show it
    const s = students.find(x => x.id === sid);
    return s ? `${s.name} (${s.roll_number || 'N/A'})` : 'Student (Mani Manjunath)';
  };

  const daysLeft = (d: string|null) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / (864e5));
  };

  // Filter projects by tab
  const filteredProjects = projects.filter(p => {
    if (activeTab === 'pending') return p.faculty_status === 'pending' || p.faculty_status === 'pending_completion';
    if (activeTab === 'active') return p.faculty_status === 'approved' && p.status !== 'completed';
    if (activeTab === 'completed') return p.status === 'completed';
    return false;
  });

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 pt-12 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute left-20 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white"/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Supervised Projects</h1>
            <p className="text-xs text-slate-350 text-slate-400">Review student Capstone project tracks</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-5 mb-2 shrink-0">
        <div className="flex bg-white border border-slate-200/60 rounded-2xl p-1 shadow-sm">
          <button onClick={() => setActiveTab('pending')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'pending' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            Requests ({projects.filter(p => p.faculty_status === 'pending' || p.faculty_status === 'pending_completion').length})
          </button>
          <button onClick={() => setActiveTab('active')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            Active ({projects.filter(p => p.faculty_status === 'approved' && p.status !== 'completed').length})
          </button>
          <button onClick={() => setActiveTab('completed')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'completed' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            Completed ({projects.filter(p => p.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></span></div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
            <h3 className="text-sm font-bold text-slate-800">No Projects</h3>
            <p className="text-xs text-slate-400 mt-1">There are no project tracks in this category.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredProjects.map(p => {
              const d = daysLeft(p.deadline);
              const totalMilestones = p.milestones?.length || 0;
              const doneMilestones = p.milestones?.filter(m => m.is_completed || m.column === 'done').length || 0;
              return (
                <div key={p.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">Capstone</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          p.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          p.status === 'declined' ? 'bg-red-50 text-red-700 border border-red-100' :
                          'bg-cyan-50 text-cyan-705 text-cyan-650 border border-cyan-100'
                        }`}>{p.status.replace('_', ' ')}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{p.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">Student: {getStudentName(p.student_id)}</p>
                      {p.description && <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{p.description}</p>}
                    </div>

                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3"/>
                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={p.status==='completed'?'#10b981':'#0f172a'} strokeWidth="3" strokeDasharray={`${p.progress_pct}, 100`} strokeLinecap="round"/>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">{p.progress_pct}%</span>
                    </div>
                  </div>

                  {/* Attributes Info */}
                  <div className="flex items-center gap-3 flex-wrap border-t border-slate-50 pt-3">
                    {p.deadline && (
                      <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg ${
                        d !== null && d < 0 ? 'bg-red-50 text-red-650' : 'bg-slate-50 text-slate-500'
                      }`}>
                        <Calendar className="w-3 h-3"/>
                        {d !== null && d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Due today' : `${d}d left`}
                      </span>
                    )}
                    {p.team_members && (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3"/>
                        Team size: {p.team_members.split(',').length + 1} members
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">
                      Milestones: {doneMilestones}/{totalMilestones} done
                    </span>
                  </div>

                  {/* Action buttons */}
                  {p.faculty_status === 'pending' && (
                    <div className="grid grid-cols-2 gap-3 mt-1 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleDecline(p.id)}
                        className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-red-200"
                      >
                        <X className="w-3.5 h-3.5"/> Decline Request
                      </button>
                      <button
                        onClick={() => handleAccept(p.id)}
                        className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400"/> Accept Advisor
                      </button>
                    </div>
                  )}

                  {p.faculty_status === 'pending_completion' && (
                    <div className="mt-1 pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <div className="text-xs font-semibold text-cyan-700 bg-cyan-50/50 p-2.5 rounded-xl border border-cyan-100 mb-1">
                        📢 Student has requested final sign-off and project completion approval.
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleDecline(p.id)}
                          className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-red-200"
                        >
                          <X className="w-3.5 h-3.5"/> Reject Completion
                        </button>
                        <button
                          onClick={() => handleComplete(p.id)}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-200"/> Approve Completion
                        </button>
                      </div>
                    </div>
                  )}

                  {p.faculty_status === 'approved' && p.status !== 'completed' && (
                    <div className="mt-1 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleComplete(p.id)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <BadgeCheck className="w-4 h-4"/> Sign-off & Mark Completed
                      </button>
                    </div>
                  )}

                  {p.status === 'completed' && (
                    <div className="mt-1 pt-3 border-t border-slate-150 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                      <BadgeCheck className="w-4 h-4 text-emerald-600"/> Fully Supervised & Signed Off
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav/>
    </div>
  );
};

export default FacultyProjects;
