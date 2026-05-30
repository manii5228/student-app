import React from 'react';
import { 
  Briefcase, Clock, FileText, PenTool, 
  ChevronLeft, Target, Users, TrendingUp, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const FacultyCareer = () => {
  const navigate = useNavigate();

  const features = [
    { name: 'Job Portal', icon: <Briefcase className="w-5 h-5 text-emerald-600"/>, color: 'bg-emerald-100', desc: 'Post & manage placement drives', path: '/career/jobs' },
    { name: 'Interview Schedule', icon: <Clock className="w-5 h-5 text-violet-600"/>, color: 'bg-violet-100', desc: 'Schedule & manage rounds', path: '/career/interviews' },
    { name: 'Company Prep', icon: <FileText className="w-5 h-5 text-blue-600"/>, color: 'bg-blue-100', desc: 'Add prep material & PYQs', path: '/career/prep' },
    { name: 'Internships', icon: <PenTool className="w-5 h-5 text-teal-600"/>, color: 'bg-teal-100', desc: 'Track student internships', path: '/career/internships' },
  ];

  const stats = [
    { label: 'Active Drives', value: '4', icon: <Target className="w-4 h-4 text-emerald-500"/>, bg: 'bg-emerald-50' },
    { label: 'Students Placed', value: '67', icon: <Users className="w-4 h-4 text-blue-500"/>, bg: 'bg-blue-50' },
    { label: 'Avg Package', value: '6.2 LPA', icon: <TrendingUp className="w-4 h-4 text-violet-500"/>, bg: 'bg-violet-50' },
    { label: 'Companies', value: '12', icon: <BarChart3 className="w-4 h-4 text-amber-500"/>, bg: 'bg-amber-50' },
  ];

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-8 bottom-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
        
        <div className="flex items-center gap-3 relative z-10 mb-5">
          <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <ChevronLeft className="w-5 h-5 text-white"/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Placement Management</h1>
            <p className="text-xs text-emerald-200">Manage career & placement activities</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 relative z-10">
          {stats.map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-3 text-center`}>
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-sm font-black text-slate-800">{s.value}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="px-5 pt-6 flex-1 overflow-y-auto">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 pl-1">Placement Tools</h3>
        <div className="flex flex-col gap-3">
          {features.map((f, idx) => (
            <button 
              key={idx} 
              onClick={() => navigate(f.path)}
              className="bg-white rounded-[20px] p-4 flex items-center gap-4 text-left shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all active:scale-[0.98] group"
            >
              <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800">{f.name}</h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{f.desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180 shrink-0"/>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default FacultyCareer;
