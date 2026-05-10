import React from 'react';
import { ChevronLeft, GraduationCap, ArrowUpRight, Flame, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const MOCK_CREDITS = {
  totalRequired: 160,
  totalEarned: 124,
  core: { earned: 80, required: 90 },
  elective: { earned: 32, required: 40 },
  project: { earned: 12, required: 30 },
  semesters: [
    { sem: 'Sem 1', earned: 24, sgpa: 8.5 },
    { sem: 'Sem 2', earned: 24, sgpa: 8.8 },
    { sem: 'Sem 3', earned: 26, sgpa: 8.2 },
    { sem: 'Sem 4', earned: 26, sgpa: 8.9 },
    { sem: 'Sem 5', earned: 24, sgpa: 8.7 },
  ]
};

const CreditDashboard = () => {
  const navigate = useNavigate();
  
  const percentage = Math.round((MOCK_CREDITS.totalEarned / MOCK_CREDITS.totalRequired) * 100);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in pb-10 relative">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-6 mt-4 relative z-20">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center shadow-sm hover:bg-white transition-colors bg-slate-50">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Credit Dashboard</h1>
        <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center shadow-sm bg-slate-50">
          <GraduationCap className="w-5 h-5 text-indigo-500" />
        </div>
      </div>

      <div className="px-6 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Main Circular Progress */}
        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 mb-8 flex flex-col items-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] opacity-50"></div>
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-50 rounded-tr-[80px] opacity-50"></div>
           
           <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 relative z-10">Degree Progress</h2>
           
           <div className="relative w-48 h-48 flex items-center justify-center mb-4 z-10">
              <svg className="w-full h-full transform -rotate-90">
                 {/* Background Circle */}
                 <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100" />
                 {/* Progress Circle */}
                 <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" 
                   strokeDasharray={502.4} 
                   strokeDashoffset={502.4 - (502.4 * percentage) / 100} 
                   strokeLinecap="round"
                   className="text-indigo-500 transition-all duration-1000 ease-out" 
                 />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                 <span className="text-5xl font-black text-slate-900">{percentage}<span className="text-2xl text-slate-400">%</span></span>
              </div>
           </div>

           <div className="flex items-center gap-6 mt-4 relative z-10">
              <div className="text-center">
                 <p className="text-2xl font-black text-indigo-600">{MOCK_CREDITS.totalEarned}</p>
                 <p className="text-xs font-bold text-slate-400 uppercase">Earned</p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-center">
                 <p className="text-2xl font-black text-slate-400">{MOCK_CREDITS.totalRequired}</p>
                 <p className="text-xs font-bold text-slate-400 uppercase">Required</p>
              </div>
           </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-8">
           <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
             <Target className="w-5 h-5 text-indigo-500" /> Category Breakdown
           </h3>
           <div className="space-y-4">
              
              {/* Core Subjects */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                 <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Core Subjects</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Mandatory</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{MOCK_CREDITS.core.earned}<span className="text-sm text-slate-400 font-medium">/{MOCK_CREDITS.core.required}</span></p>
                 </div>
                 <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(MOCK_CREDITS.core.earned / MOCK_CREDITS.core.required) * 100}%` }}></div>
                 </div>
              </div>

              {/* Electives */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                 <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Electives</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Specializations</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{MOCK_CREDITS.elective.earned}<span className="text-sm text-slate-400 font-medium">/{MOCK_CREDITS.elective.required}</span></p>
                 </div>
                 <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(MOCK_CREDITS.elective.earned / MOCK_CREDITS.elective.required) * 100}%` }}></div>
                 </div>
              </div>

              {/* Projects & Labs */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                 <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Projects & Labs</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Practical</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{MOCK_CREDITS.project.earned}<span className="text-sm text-slate-400 font-medium">/{MOCK_CREDITS.project.required}</span></p>
                 </div>
                 <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(MOCK_CREDITS.project.earned / MOCK_CREDITS.project.required) * 100}%` }}></div>
                 </div>
              </div>

           </div>
        </div>

        {/* Semester Timeline */}
        <div className="mb-6">
           <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
             <Flame className="w-5 h-5 text-orange-500" /> Semester Timeline
           </h3>
           <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
             {MOCK_CREDITS.semesters.map((s, idx) => (
               <div key={idx} className="min-w-[120px] bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col items-center flex-shrink-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{s.sem}</p>
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg mb-2">
                     {s.earned}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                     <ArrowUpRight className="w-3 h-3" /> SGPA {s.sgpa}
                  </div>
               </div>
             ))}
           </div>
        </div>

      </div>
      <BottomNav />
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CreditDashboard;
