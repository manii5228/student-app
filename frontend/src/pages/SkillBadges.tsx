import React, { useState, useEffect } from 'react';
import { ChevronLeft, Award, Star, Zap, Code, Users, Trophy, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Badge { id:string; name:string; description:string|null; category:string; icon:string; color:string; criteria:string|null; points:number; }
interface Earned { id:string; badge:Badge|null; note:string|null; earned_at:string|null; }

const iconMap: Record<string,React.ReactNode> = {
  award:<Award className="w-6 h-6"/>, star:<Star className="w-6 h-6"/>, zap:<Zap className="w-6 h-6"/>,
  code:<Code className="w-6 h-6"/>, users:<Users className="w-6 h-6"/>, trophy:<Trophy className="w-6 h-6"/>,
  book:<BookOpen className="w-6 h-6"/>,
};

const catColors: Record<string,string> = {
  technical:'from-indigo-500 to-blue-600', soft_skill:'from-pink-500 to-rose-600',
  workshop:'from-amber-500 to-orange-600', hackathon:'from-emerald-500 to-teal-600',
};

const SkillBadges = () => {
  const nav = useNavigate();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earned, setEarned] = useState<Earned[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'earned'|'all'>('earned');

  useEffect(() => {
    Promise.all([
      api.get('/career/badges').then(r => setAllBadges(r.data.badges||[])),
      api.get('/career/badges/my-badges').then(r => setEarned(r.data.earned_badges||[])),
    ]).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const earnedIds = new Set(earned.map(e => e.badge?.id));
  const totalPoints = earned.reduce((s, e) => s + (e.badge?.points || 0), 0);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={()=>nav('/career')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Skill Badges</h1><p className="text-xs text-indigo-200">Showcase your achievements</p></div>
        </div>
        {/* Stats */}
        <div className="flex gap-3 relative z-10">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{earned.length}</p>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Earned</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{totalPoints}</p>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Points</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{allBadges.length}</p>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Available</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className="flex bg-slate-100 rounded-2xl p-1">
          <button onClick={()=>setTab('earned')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${tab==='earned'?'bg-white text-slate-900 shadow-md':'text-slate-500'}`}>🏆 My Badges</button>
          <button onClick={()=>setTab('all')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${tab==='all'?'bg-white text-slate-900 shadow-md':'text-slate-500'}`}>📋 All Badges</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span></div>
        : tab==='earned' ? (
          earned.length===0 ? (
            <div className="text-center py-20"><Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No Badges Yet</h2><p className="text-sm text-slate-500 mt-1">Complete workshops and hackathons to earn badges!</p></div>
          ) : (
            <div className="grid grid-cols-2 gap-3 animate-slide-up">
              {earned.map(e => {
                const b = e.badge; if(!b) return null;
                const grad = catColors[b.category] || 'from-slate-500 to-slate-600';
                return (
                  <div key={e.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-lg mb-3`}>
                      {iconMap[b.icon] || <Award className="w-6 h-6"/>}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{b.name}</h3>
                    <span className="text-[10px] font-bold text-indigo-500 mt-1">{b.points} pts</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">{b.category.replace('_',' ')}</span>
                    {e.earned_at && <span className="text-[9px] text-slate-400 mt-1">{new Date(e.earned_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            {allBadges.map(b => {
              const isEarned = earnedIds.has(b.id);
              const grad = catColors[b.category] || 'from-slate-500 to-slate-600';
              return (
                <div key={b.id} className={`rounded-[24px] p-4 shadow-sm border flex items-center gap-4 ${isEarned?'bg-indigo-50/50 border-indigo-200':'bg-white border-slate-100'}`}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-sm shrink-0 ${!isEarned?'opacity-40 grayscale':''}`}>
                    {iconMap[b.icon] || <Award className="w-5 h-5"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{b.name}</h3>
                      {isEarned && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">EARNED</span>}
                    </div>
                    {b.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{b.description}</p>}
                    {b.criteria && <p className="text-[10px] text-slate-400 mt-1 italic">Criteria: {b.criteria}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-indigo-600">{b.points}</p>
                    <p className="text-[9px] font-bold text-slate-400">pts</p>
                  </div>
                </div>
              );
            })}
            {allBadges.length===0 && <div className="text-center py-20"><Award className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No Badges Available</h2><p className="text-sm text-slate-500 mt-1">Badge templates haven't been created yet.</p></div>}
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );
};
export default SkillBadges;
