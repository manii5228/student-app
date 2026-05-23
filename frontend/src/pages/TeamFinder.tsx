import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, Heart, Code, Star, Inbox, Filter, MessageCircle, Send, Users, Sparkles, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Profile { id: string; user_id: string; name: string; department: string|null; year: string|null; skills: string[]; looking_for: string|null; bio: string|null; match_pct: number; }
interface Match { id: string; other_user: { id: string; name: string; department: string|null; skills: string[] }|null; matched_at: string; }
interface Message { id: string; sender_id: string; sender_name: string; content: string; sent_at: string; }

const TeamFinder = () => {
  const nav = useNavigate();
  const [tab, setTab] = useState<'discover'|'matches'>('discover');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<'left'|'right'|null>(null);
  const [matchAlert, setMatchAlert] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  // Chat
  const [chatMatch, setChatMatch] = useState<Match|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string>('');

  // Profile setup
  const [myProfile, setMyProfile] = useState<any>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ skills: '', looking_for: '', bio: '' });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const [profileRes, matchRes] = await Promise.all([
        api.get('/career/team-finder/profile'),
        api.get('/career/team-finder/matches'),
      ]);
      setMyProfile(profileRes.data.profile);
      setMatches(matchRes.data.matches || []);
      if (profileRes.data.profile) {
        setUserId(profileRes.data.profile.user_id);
        loadProfiles();
      } else {
        setShowSetup(true);
      }
    } catch {} finally { setLoading(false); }
  };

  const loadProfiles = async () => {
    try {
      const params: any = {};
      if (filterDept) params.department = filterDept;
      if (filterSkill) params.skill = filterSkill;
      const { data } = await api.get('/career/team-finder/profiles', { params });
      setProfiles(data.profiles || []);
    } catch {}
  };

  useEffect(() => { if (myProfile) loadProfiles(); }, [filterDept, filterSkill]);

  const saveProfile = async () => {
    try {
      await api.post('/career/team-finder/profile', {
        skills: setupForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        looking_for: setupForm.looking_for, bio: setupForm.bio,
      });
      setShowSetup(false);
      init();
    } catch {}
  };

  const handleSwipe = async (dir: 'left'|'right') => {
    if (profiles.length === 0) return;
    const target = profiles[0];
    setDirection(dir);

    setTimeout(async () => {
      setProfiles(prev => prev.slice(1));
      setDirection(null);
      try {
        const { data } = await api.post('/career/team-finder/swipe', {
          target_id: target.user_id, direction: dir === 'right' ? 'right' : 'left',
        });
        if (data.is_match) {
          setMatchAlert(true);
          setTimeout(() => setMatchAlert(false), 3000);
          const mRes = await api.get('/career/team-finder/matches');
          setMatches(mRes.data.matches || []);
        }
      } catch {}
    }, 350);
  };

  const openChat = async (match: Match) => {
    setChatMatch(match);
    setChatLoading(true);
    try {
      const { data } = await api.get(`/career/team-finder/messages/${match.id}`);
      setMessages(data.messages || []);
    } catch {} finally { setChatLoading(false); }
  };

  const sendMsg = async () => {
    if (!msgInput.trim() || !chatMatch) return;
    try {
      const { data } = await api.post(`/career/team-finder/messages/${chatMatch.id}`, { content: msgInput.trim() });
      setMessages(prev => [...prev, data.message]);
      setMsgInput('');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in pb-24 overflow-hidden relative">
      {/* Match Alert */}
      {matchAlert && (
        <div className="fixed top-0 inset-x-0 z-[60] flex justify-center animate-slide-down">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-4 rounded-b-3xl shadow-2xl flex items-center gap-3">
            <Sparkles className="w-6 h-6 animate-pulse"/>
            <div><p className="text-sm font-bold">It's a Match! 🎉</p><p className="text-xs opacity-80">You can now chat with your new teammate!</p></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center p-6 pt-12 relative z-20">
        <button onClick={() => nav('/career')} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors bg-white">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team Finder</h1>
        <button onClick={() => setShowFilters(!showFilters)} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors bg-white">
          <Filter className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-3">
        <div className="flex bg-slate-100 rounded-2xl p-1">
          <button onClick={()=>setTab('discover')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab==='discover'?'bg-white text-slate-900 shadow-md':'text-slate-500'}`}>🔍 Discover</button>
          <button onClick={()=>setTab('matches')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab==='matches'?'bg-white text-slate-900 shadow-md':'text-slate-500'}`}>💬 Matches ({matches.length})</button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 mb-3 animate-fade-in">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Department</label>
                <select value={filterDept} onChange={e=>setFilterDept(e.target.value)} className="w-full bg-white rounded-xl px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:border-cyan-400">
                  <option value="">All</option>
                  <option value="CSE">CSE</option><option value="ECE">ECE</option>
                  <option value="IT">IT</option><option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Skill</label>
                <input value={filterSkill} onChange={e=>setFilterSkill(e.target.value)} placeholder="e.g. React" className="w-full bg-white rounded-xl px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:border-cyan-400"/>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex justify-center items-center"><span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></span></div>
      ) : tab === 'discover' ? (
        /* ─── DISCOVER TAB ─── */
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
          {profiles.length > 0 ? (
            <div className="relative w-full max-w-sm h-[55vh]">
              {profiles.slice(0, 3).map((profile, index) => {
                const isTop = index === 0;
                let transformClass = '';
                let opacityClass = 'opacity-100';
                if (isTop && direction === 'left') { transformClass = '-translate-x-[150%] -rotate-12'; opacityClass = 'opacity-0'; }
                else if (isTop && direction === 'right') { transformClass = 'translate-x-[150%] rotate-12'; opacityClass = 'opacity-0'; }
                else if (index === 1) { transformClass = 'translate-y-4 scale-[0.95]'; }
                else if (index === 2) { transformClass = 'translate-y-8 scale-[0.90]'; }

                const avatarColors = ['bg-gradient-to-br from-cyan-400 to-blue-500', 'bg-gradient-to-br from-purple-400 to-pink-500', 'bg-gradient-to-br from-amber-400 to-orange-500'];
                return (
                  <div key={profile.id} className={`absolute inset-0 bg-white border border-slate-100 rounded-[32px] shadow-xl p-5 flex flex-col transition-all duration-400 ease-out origin-bottom ${transformClass} ${opacityClass}`} style={{ zIndex: 30 - index }}>
                    <div className={`flex-1 rounded-[20px] ${avatarColors[index % 3]} flex flex-col items-center justify-center p-6 mb-4 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.15),transparent)]"></div>
                      <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-md shadow-sm flex items-center justify-center mb-3">
                        <span className="text-3xl font-black text-white">{profile.name.charAt(0)}</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                      <p className="text-xs font-semibold text-white/80 mt-0.5">{profile.department} • {profile.year}</p>
                      <div className="mt-3 bg-white/25 px-4 py-1.5 rounded-full backdrop-blur-sm">
                        <p className="text-xs font-bold text-white">{profile.match_pct}% Match</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Looking For</h3>
                      <p className="text-sm font-bold text-slate-800 leading-tight mb-3">{profile.looking_for}</p>

                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Skills</h3>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {profile.skills.map(s => (
                          <span key={s} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">{s}</span>
                        ))}
                      </div>

                      {profile.bio && <p className="text-[10px] text-slate-400 mt-auto line-clamp-2">{profile.bio}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                <Inbox className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h2>
              <p className="text-sm text-slate-500 max-w-[250px]">You've seen all potential team matches. Check back later!</p>
              <button onClick={loadProfiles} className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg">Refresh</button>
            </div>
          )}

          {profiles.length > 0 && (
            <div className="flex gap-6 mt-6 z-40 relative pb-4">
              <button onClick={() => handleSwipe('left')} className="w-16 h-16 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:scale-110 hover:text-red-500 transition-all active:scale-95">
                <X className="w-8 h-8" />
              </button>
              <button onClick={() => handleSwipe('right')} className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 border border-pink-400 shadow-xl flex items-center justify-center text-white hover:scale-110 transition-all active:scale-95">
                <Heart className="w-7 h-7" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ─── MATCHES TAB ─── */
        <div className="flex-1 overflow-y-auto px-6">
          {matches.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
              <h2 className="text-lg font-bold text-slate-900">No Matches Yet</h2>
              <p className="text-sm text-slate-500 mt-1">Swipe right to find your teammates!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {matches.map(m => (
                <button key={m.id} onClick={() => openChat(m)} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 text-left hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-black text-lg shrink-0">
                    {m.other_user?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{m.other_user?.name}</h3>
                    <p className="text-[10px] text-slate-400">{m.other_user?.department}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.other_user?.skills?.slice(0, 3).map(s => (
                        <span key={s} className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                  <MessageCircle className="w-5 h-5 text-cyan-500 shrink-0"/>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Chat Modal ─── */}
      {chatMatch && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-4 pt-12 flex items-center gap-3">
            <button onClick={()=>setChatMatch(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white"/></button>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">{chatMatch.other_user?.name?.charAt(0)}</div>
            <div><h3 className="text-sm font-bold text-white">{chatMatch.other_user?.name}</h3><p className="text-[10px] text-cyan-100">{chatMatch.other_user?.department}</p></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {chatLoading ? (
              <div className="flex justify-center py-8"><span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span></div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12"><MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2"/><p className="text-xs text-slate-400">Say hi to your new teammate!</p></div>
            ) : (
              messages.map(msg => {
                const isMine = msg.sender_id === (myProfile?.user_id || userId);
                return (
                  <div key={msg.id} className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-cyan-600 text-white rounded-br-md' : 'bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-100'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[9px] mt-1 ${isMine ? 'text-cyan-200' : 'text-slate-400'}`}>{new Date(msg.sent_at).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef}/>
          </div>
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMsg()} placeholder="Type a message..." className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/>
            <button onClick={sendMsg} disabled={!msgInput.trim()} className="w-12 h-12 rounded-full bg-cyan-600 text-white flex items-center justify-center hover:bg-cyan-700 transition-colors disabled:opacity-40 shrink-0">
              <Send className="w-5 h-5"/>
            </button>
          </div>
        </div>
      )}

      {/* ─── Profile Setup Modal ─── */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-slide-up">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-3"><Heart className="w-7 h-7 text-white"/></div>
              <h2 className="text-lg font-bold text-slate-900">Setup Your Profile</h2>
              <p className="text-xs text-slate-500 mt-1">Tell teammates what you bring to the table</p>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Your Skills (comma separated)</label>
                <input value={setupForm.skills} onChange={e=>setSetupForm({...setupForm,skills:e.target.value})} placeholder="React, Python, Figma" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Looking For</label>
                <input value={setupForm.looking_for} onChange={e=>setSetupForm({...setupForm,looking_for:e.target.value})} placeholder="Backend Dev for Hackathon" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Short Bio</label>
                <textarea value={setupForm.bio} onChange={e=>setSetupForm({...setupForm,bio:e.target.value})} placeholder="Tell people about yourself..." rows={2} className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400 resize-none"/>
              </div>
              <button onClick={saveProfile} disabled={!setupForm.skills.trim()} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40">Start Finding Teammates</button>
              <button onClick={()=>{setShowSetup(false); nav('/career');}} className="text-xs font-bold text-slate-400 text-center hover:text-slate-600 transition-colors">Skip for now</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  );
};

export default TeamFinder;
