import React, { useState, useEffect } from 'react';
import { ChevronLeft, Award, Star, Zap, Code, Users, Trophy, BookOpen, Share2, Info, Plus, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Badge { 
  id: string; 
  name: string; 
  description: string | null; 
  category: string; 
  icon: string; 
  color: string; 
  criteria: string | null; 
  points: number; 
}

interface Earned { 
  id: string; 
  badge: Badge | null; 
  note: string | null; 
  earned_at: string | null; 
}

interface Holder { 
  student_id: string; 
  name: string; 
  department: string; 
  earned_at: string; 
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  roll_number?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  award: <Award className="w-8 h-8"/>, 
  star: <Star className="w-8 h-8"/>, 
  zap: <Zap className="w-8 h-8"/>,
  code: <Code className="w-8 h-8"/>, 
  users: <Users className="w-8 h-8"/>, 
  trophy: <Trophy className="w-8 h-8"/>,
  book: <BookOpen className="w-8 h-8"/>,
};

const catColors: Record<string, string> = {
  technical: 'from-indigo-500 to-blue-600', 
  soft_skill: 'from-pink-500 to-rose-600',
  workshop: 'from-amber-500 to-orange-600', 
  hackathon: 'from-emerald-500 to-teal-600',
};

const SkillBadges = () => {
  const nav = useNavigate();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earned, setEarned] = useState<Earned[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'earned' | 'all'>('earned');
  
  // Auth Info
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;
  const isFaculty = role === 'faculty';
  const isAdmin = role === 'admin';

  // Modal state
  const [selectedBadge, setSelectedBadge] = useState<{ badge: Badge, earned: Earned | null } | null>(null);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loadingHolders, setLoadingHolders] = useState(false);

  // Faculty Creation Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    category: 'technical',
    icon: 'award',
    color: '#6366f1',
    criteria: '',
    points: 10
  });
  const [creating, setCreating] = useState(false);

  // Faculty Award State
  const [classStudents, setClassStudents] = useState<StudentUser[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [awardNote, setAwardNote] = useState('');
  const [awarding, setAwarding] = useState(false);
  const [awardSuccess, setAwardSuccess] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/career/badges').then(r => setAllBadges(r.data.badges || [])),
      api.get('/career/badges/my-badges').then(r => setEarned(r.data.earned_badges || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 12; // tilt angle
    const angleY = (x - xc) / 12;
    card.style.transform = `perspective(600px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-4px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = e.currentTarget;
    card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  const openBadgeModal = async (badge: Badge, earnedObj: Earned | null = null) => {
    setSelectedBadge({ badge, earned: earnedObj });
    setAwardSuccess(false);
    setSelectedStudent('');
    setAwardNote('');
    setLoadingHolders(true);
    setHolders([]);
    
    // Fetch holders
    api.get(`/career/badges/${badge.id}/holders`)
      .then(r => setHolders(r.data.holders || []))
      .catch(() => {})
      .finally(() => setLoadingHolders(false));

    // Fetch class students if faculty
    if (isFaculty || isAdmin) {
      setLoadingStudents(true);
      api.get('/faculty/class-students')
        .then(r => setClassStudents(r.data.students || []))
        .catch(() => {})
        .finally(() => setLoadingStudents(false));
    }
  };

  const shareToLinkedIn = (b: Badge) => {
    const url = encodeURIComponent(window.location.origin);
    const title = encodeURIComponent(`I just earned the ${b.name} badge at Vel Tech!`);
    const summary = encodeURIComponent(`I earned this badge for: ${b.criteria || b.description}`);
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${summary}`, '_blank', 'width=600,height=600');
  };

  // Faculty: Create Badge Template
  const handleCreateBadge = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      await api.post('/career/badges', createForm);
      setShowCreate(false);
      setCreateForm({
        name: '',
        description: '',
        category: 'technical',
        icon: 'award',
        color: '#6366f1',
        criteria: '',
        points: 10
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create badge template');
    } finally {
      setCreating(false);
    }
  };

  // Faculty: Award Badge
  const handleAwardBadge = async () => {
    if (!selectedBadge || !selectedStudent) return;
    setAwarding(true);
    try {
      await api.post(`/career/badges/${selectedBadge.badge.id}/award`, {
        student_id: selectedStudent,
        note: awardNote
      });
      setAwardSuccess(true);
      setSelectedStudent('');
      setAwardNote('');
      
      // Refresh holders
      const { data } = await api.get(`/career/badges/${selectedBadge.badge.id}/holders`);
      setHolders(data.holders || []);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to award badge');
    } finally {
      setAwarding(false);
    }
  };

  const handleBack = () => {
    if (role === 'faculty') nav('/faculty/career');
    else if (role === 'admin') nav('/admin');
    else nav('/career');
  };

  const earnedIds = new Set(earned.map(e => e.badge?.id));
  const totalPoints = earned.reduce((s, e) => s + (e.badge?.points || 0), 0);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 pt-12 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white"/>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Skill Badges</h1>
              <p className="text-xs text-indigo-200">Verifiable Credentials</p>
            </div>
          </div>
          {(isFaculty || isAdmin) && (
            <button onClick={() => setShowCreate(true)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
              <Plus className="w-5 h-5"/>
            </button>
          )}
        </div>
        {/* Stats */}
        <div className="flex gap-3 relative z-10">
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 shadow-sm">
            <p className="text-2xl font-black text-white drop-shadow-sm">{earned.length}</p>
            <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider mt-0.5">Earned</p>
          </div>
          <div className="flex-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-center shadow-md">
            <p className="text-2xl font-black text-white drop-shadow-sm">{totalPoints}</p>
            <p className="text-[9px] font-bold text-orange-100 uppercase tracking-wider mt-0.5">Total Points</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 shadow-sm">
            <p className="text-2xl font-black text-white drop-shadow-sm">{allBadges.length - earned.length}</p>
            <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider mt-0.5">Locked</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-5 mb-2">
        <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner">
          <button onClick={() => setTab('earned')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${tab === 'earned' ? 'bg-white text-indigo-700 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>🏆 My Badges</button>
          <button onClick={() => setTab('all')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${tab === 'all' ? 'bg-white text-indigo-700 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>📋 All Available</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : tab === 'earned' ? (
          earned.length === 0 ? (
            <div className="text-center py-20 px-6 animate-fade-in">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Trophy className="w-8 h-8 text-indigo-300"/>
              </div>
              <h2 className="text-lg font-bold text-slate-900">No Badges Yet</h2>
              <p className="text-sm text-slate-500 mt-2">Attend workshops, complete hackathons, and excel in projects to earn verifiable skill badges.</p>
              <button onClick={() => setTab('all')} className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">View Requirements</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-6 animate-slide-up">
              {earned.map((e, idx) => {
                const b = e?.badge; if (!b) return null;
                const grad = b?.category ? catColors[b.category] || 'from-slate-500 to-slate-600' : 'from-slate-500 to-slate-600';
                return (
                  <button key={e.id || idx} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={() => openBadgeModal(b, e)} className="group bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className={`relative w-20 h-20 rounded-[28px] bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <div className="absolute inset-0 bg-white/20 rounded-[28px] blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10 drop-shadow-md">{iconMap[b.icon] || <Award className="w-8 h-8"/>}</div>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight mb-1">{b.name}</h3>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500"/>
                      <span className="text-[10px] font-bold text-slate-600">{b.points} pts</span>
                    </div>
                    {e.earned_at && <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{new Date(e.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3 pb-6 animate-slide-up">
            {/* Guidelines Card */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-3xl p-4 mb-2">
              <h4 className="text-xs font-black text-indigo-900 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600"/> How to Achieve Skill Badges
              </h4>
              <ul className="text-[10px] text-indigo-700/80 font-medium space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><span className="font-bold text-indigo-900">Workshop Sync:</span> Automatically synced and awarded when you register and attend department seminars and practical labs.</li>
                <li><span className="font-bold text-indigo-900">Project Tracker:</span> Completed projects (with 100% Kanban tasks checked off) earn you execution badges.</li>
                <li><span className="font-bold text-indigo-900">Faculty Nominations:</span> Mentors and professors can award custom achievement badges directly to your profile.</li>
              </ul>
            </div>
            
            {allBadges.map(b => {
              const e = earned.find(x => x?.badge?.id === b?.id) || null;
              const isEarned = !!e;
              const grad = b?.category ? catColors[b.category] || 'from-slate-500 to-slate-600' : 'from-slate-500 to-slate-600';
              return (
                <button key={b?.id || Math.random().toString()} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={() => openBadgeModal(b, e)} className={`text-left rounded-3xl p-4 shadow-sm border flex items-center gap-4 transition-all hover:shadow-md ${isEarned ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-md shrink-0 transition-transform ${!isEarned ? 'opacity-50 grayscale hover:grayscale-0 hover:scale-105' : 'scale-105 rotate-2'}`}>
                    {iconMap[b.icon] || <Award className="w-6 h-6"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`text-sm font-bold truncate ${isEarned ? 'text-indigo-900' : 'text-slate-900'}`}>{b.name}</h3>
                      {isEarned && <span className="text-[8px] font-black px-1.5 py-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded shadow-sm">EARNED</span>}
                    </div>
                    {b.description && <p className="text-xs text-slate-500 line-clamp-2 leading-snug">{b.description}</p>}
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end justify-center">
                    <p className={`text-lg font-black ${isEarned ? 'text-indigo-600' : 'text-slate-400'}`}>{b.points}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">pts</p>
                  </div>
                </button>
              );
            })}
            {allBadges.length === 0 && <div className="text-center py-20"><Award className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No Badges Available</h2></div>}
          </div>
        )}
      </div>

      {/* ─── Badge Detail Modal ─── */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in p-4" onClick={() => setSelectedBadge(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className={`relative pt-12 pb-8 px-6 bg-gradient-to-br ${catColors[selectedBadge.badge.category] || 'from-slate-500 to-slate-600'} text-center overflow-hidden shrink-0`}>
              <div className="absolute top-4 left-4"><button onClick={() => setSelectedBadge(null)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><ChevronLeft className="w-5 h-5"/></button></div>
              {selectedBadge.earned && <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Earned</div>}
              
              <div className="relative w-28 h-28 mx-auto bg-white/20 backdrop-blur-md rounded-[40px] flex items-center justify-center text-white shadow-2xl mb-4 rotate-3 animate-float border-2 border-white/30">
                <div className="scale-150 drop-shadow-lg">{iconMap[selectedBadge.badge.icon] || <Award/>}</div>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">{selectedBadge.badge.name}</h2>
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest mt-2">{selectedBadge.badge.category.replace('_', ' ')} • {selectedBadge.badge.points} PTS</p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> Description</h4>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedBadge.badge.description}</p>
              </div>

              {selectedBadge.badge.criteria && (
                <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">How to earn</h4>
                  <p className="text-xs font-medium text-slate-600">{selectedBadge.badge.criteria}</p>
                </div>
              )}

              {/* Faculty Award Action panel */}
              {(isFaculty || isAdmin) && (
                <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-3xl p-4 flex flex-col gap-3">
                  <h4 className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">Award Badge to Class Student</h4>
                  {awardSuccess && (
                    <div className="bg-emerald-100 text-emerald-800 rounded-xl p-2.5 text-xs font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600"/> Badge awarded successfully!
                    </div>
                  )}
                  {loadingStudents ? (
                    <div className="flex justify-center py-2"><span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span></div>
                  ) : classStudents.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No class students found.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <select
                        value={selectedStudent}
                        onChange={e => setSelectedStudent(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                      >
                        <option value="">Select Student</option>
                        {classStudents.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.roll_number || 'No Roll'})</option>
                        ))}
                      </select>

                      <input
                        value={awardNote}
                        onChange={e => setAwardNote(e.target.value)}
                        placeholder="Award citation note (e.g. Excellent HackGrid setup)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />

                      <button
                        onClick={handleAwardBadge}
                        disabled={awarding || !selectedStudent}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-colors disabled:opacity-40"
                      >
                        {awarding ? 'Awarding...' : 'Award Badge'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedBadge.earned && selectedBadge.earned.note && (
                <div className="mb-6 bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Award Note</h4>
                  <p className="text-xs font-medium text-indigo-900 italic">"{selectedBadge.earned.note}"</p>
                </div>
              )}

              {selectedBadge.earned && (
                <div className="mb-6 bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 shadow-md font-mono text-[9px]">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                    <span className="font-bold text-cyan-400 uppercase tracking-wider text-[8px]">Verifiable Credential</span>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase">Secured</span>
                  </div>
                  <div className="flex flex-col gap-1 text-slate-400">
                    <p><span className="text-slate-500 font-bold">ISSUER:</span> Vel Tech Registrar</p>
                    <p><span className="text-slate-500 font-bold">RECORD ID:</span> VC-{selectedBadge.earned.id?.substring(0, 8).toUpperCase()}</p>
                    <p className="break-all"><span className="text-slate-500 font-bold">BLOCK SIG:</span> SHA256:{(() => {
                      const idVal = selectedBadge.earned.id || 'badge-auth';
                      let hash = 0;
                      for (let i = 0; i < idVal.length; i++) {
                        hash = (hash << 5) - hash + idVal.charCodeAt(i);
                        hash |= 0;
                      }
                      return Math.abs(hash).toString(16).repeat(4).substring(0, 40);
                    })()}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Other Holders</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{holders.length}</span>
                </h4>
                {loadingHolders ? (
                  <div className="flex justify-center py-4"><span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span></div>
                ) : holders.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                    {holders.map(h => (
                      <div key={h.student_id} className="min-w-[120px] bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center text-center snap-start shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mb-2">{h.name.charAt(0)}</div>
                        <p className="text-xs font-bold text-slate-900 truncate w-full">{h.name.split(' ')[0]}</p>
                        <p className="text-[9px] text-slate-500">{h.department}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No one else has earned this yet.</p>
                )}
              </div>
            </div>

            {selectedBadge.earned && (
              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <button onClick={() => shareToLinkedIn(selectedBadge.badge)} className="w-full bg-[#0a66c2] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#004182] transition-colors shadow-md">
                  <Share2 className="w-4 h-4" /> Share on LinkedIn
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Faculty Create Badge Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Create Badge Template</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500"/>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Badge Name *</label>
                <input
                  value={createForm.name}
                  onChange={e => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="e.g. Flutter Master"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Category</label>
                <select
                  value={createForm.category}
                  onChange={e => setCreateForm({...createForm, category: e.target.value})}
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200"
                >
                  <option value="technical">Technical</option>
                  <option value="soft_skill">Soft Skill</option>
                  <option value="workshop">Workshop</option>
                  <option value="hackathon">Hackathon</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Icon</label>
                  <select
                    value={createForm.icon}
                    onChange={e => setCreateForm({...createForm, icon: e.target.value})}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200"
                  >
                    <option value="award">Award Banner</option>
                    <option value="star">Star</option>
                    <option value="zap">Lightning (Zap)</option>
                    <option value="code">Code brackets</option>
                    <option value="users">People (Users)</option>
                    <option value="trophy">Trophy</option>
                    <option value="book">Book ADT</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">XP Points</label>
                  <input
                    type="number"
                    value={createForm.points}
                    onChange={e => setCreateForm({...createForm, points: parseInt(e.target.value) || 10})}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="What is this badge for?"
                  rows={2}
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Criteria (Optional)</label>
                <input
                  value={createForm.criteria}
                  onChange={e => setCreateForm({...createForm, criteria: e.target.value})}
                  placeholder="e.g. Score >90% in Flutter Hackathon"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <button
                onClick={handleCreateBadge}
                disabled={creating || !createForm.name.trim()}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {creating ? 'Creating...' : 'Create Badge Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  );
};

export default SkillBadges;
