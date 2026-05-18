import React, { useState, useEffect } from 'react';
import { ChevronLeft, Clock, BookOpen, Users, Smartphone, TrendingUp, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface UsageData { category:string; minutes:number; color:string; icon:React.ReactNode; }

const UsageAnalytics = () => {
  const nav = useNavigate();
  const [period, setPeriod] = useState<'today'|'week'|'month'>('week');
  const [totalMinutes, setTotalMinutes] = useState(0);

  // Simulated usage data (in a real app, tracked via page visit timestamps)
  const usageByPeriod: Record<string, UsageData[]> = {
    today: [
      { category:'Academics', minutes:45, color:'bg-blue-500', icon:<BookOpen className="w-4 h-4"/> },
      { category:'Career', minutes:20, color:'bg-emerald-500', icon:<TrendingUp className="w-4 h-4"/> },
      { category:'Campus', minutes:15, color:'bg-purple-500', icon:<Users className="w-4 h-4"/> },
      { category:'Social', minutes:30, color:'bg-pink-500', icon:<Smartphone className="w-4 h-4"/> },
    ],
    week: [
      { category:'Academics', minutes:280, color:'bg-blue-500', icon:<BookOpen className="w-4 h-4"/> },
      { category:'Career', minutes:120, color:'bg-emerald-500', icon:<TrendingUp className="w-4 h-4"/> },
      { category:'Campus', minutes:90, color:'bg-purple-500', icon:<Users className="w-4 h-4"/> },
      { category:'Social', minutes:160, color:'bg-pink-500', icon:<Smartphone className="w-4 h-4"/> },
    ],
    month: [
      { category:'Academics', minutes:1200, color:'bg-blue-500', icon:<BookOpen className="w-4 h-4"/> },
      { category:'Career', minutes:480, color:'bg-emerald-500', icon:<TrendingUp className="w-4 h-4"/> },
      { category:'Campus', minutes:360, color:'bg-purple-500', icon:<Users className="w-4 h-4"/> },
      { category:'Social', minutes:600, color:'bg-pink-500', icon:<Smartphone className="w-4 h-4"/> },
    ],
  };

  const data = usageByPeriod[period];
  const total = data.reduce((s,d)=>s+d.minutes,0);
  const pct = (m:number) => total ? Math.round(m/total*100) : 0;
  const fmt = (m:number) => m>=60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;

  // Weekly chart data (simulated)
  const weeklyBars = [
    { day:'Mon', study:50, social:20 }, { day:'Tue', study:40, social:30 },
    { day:'Wed', study:60, social:15 }, { day:'Thu', study:35, social:25 },
    { day:'Fri', study:45, social:35 }, { day:'Sat', study:20, social:45 },
    { day:'Sun', study:30, social:40 },
  ];
  const maxBar = Math.max(...weeklyBars.map(b=>b.study+b.social));

  // Streak
  const streak = 12; // simulated consecutive days
  const studyRatio = data.length ? Math.round((data[0].minutes/total)*100) : 0;

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Usage Analytics</h1><p className="text-xs text-orange-100">Track your app activity</p></div>
        </div>
        {/* Total time */}
        <div className="flex gap-3 mt-4 relative z-10">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center"><p className="text-2xl font-black text-white">{fmt(total)}</p><p className="text-[9px] font-bold text-orange-200 uppercase">Total Time</p></div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center"><p className="text-2xl font-black text-white">{streak}</p><p className="text-[9px] font-bold text-orange-200 uppercase">Day Streak 🔥</p></div>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {(['today','week','month'] as const).map(p=><button key={p} onClick={()=>setPeriod(p)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold capitalize transition-all ${period===p?'bg-orange-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}>{p}</button>)}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Donut-like bars */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4 animate-slide-up">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Time Breakdown</h3>
          {/* Stacked bar */}
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex mb-4">
            {data.map((d,i)=><div key={i} className={`${d.color} transition-all`} style={{width:`${pct(d.minutes)}%`}}></div>)}
          </div>
          {/* Legend */}
          <div className="flex flex-col gap-3">
            {data.map((d,i)=>(
              <div key={i} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${d.color} flex items-center justify-center text-white`}>{d.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{d.category}</span>
                    <span className="text-sm font-black text-slate-700">{fmt(d.minutes)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden"><div className={`h-full ${d.color} rounded-full transition-all`} style={{width:`${pct(d.minutes)}%`}}></div></div>
                </div>
                <span className="text-xs font-bold text-slate-400 w-10 text-right">{pct(d.minutes)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly chart */}
        {period !== 'today' && <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Weekly Activity</h3>
          <div className="flex items-end gap-2 h-32">
            {weeklyBars.map((b,i)=>(
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col rounded-lg overflow-hidden" style={{height:`${((b.study+b.social)/maxBar)*100}%`}}>
                  <div className="bg-blue-400 flex-grow" style={{flex:b.study}}></div>
                  <div className="bg-pink-400 flex-grow" style={{flex:b.social}}></div>
                </div>
                <span className="text-[9px] font-bold text-slate-400">{b.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 justify-center">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400"></div>Study</span>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-pink-400"></div>Social</span>
          </div>
        </div>}

        {/* Insights */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">💡 Insights</h3>
          <div className="flex flex-col gap-2">
            <div className="bg-blue-50 rounded-xl px-4 py-3"><p className="text-xs font-medium text-blue-700">{studyRatio >= 50 ? '📚 Great focus! You spend most of your time on academics.' : '⚡ Try to increase your study time ratio for better results.'}</p></div>
            <div className="bg-emerald-50 rounded-xl px-4 py-3"><p className="text-xs font-medium text-emerald-700">🔥 {streak}-day streak! Keep the momentum going.</p></div>
            <div className="bg-amber-50 rounded-xl px-4 py-3"><p className="text-xs font-medium text-amber-700">⏰ Peak activity: Weekday evenings (6-9 PM)</p></div>
          </div>
        </div>
      </div>
      <BottomNav/>
    </div>
  );
};
export default UsageAnalytics;
