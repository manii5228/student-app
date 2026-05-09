import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, CheckCircle2, FileText, Award, 
  Map, Users, BookOpen, GraduationCap, ClipboardList
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const Academic = () => {
  const navigate = useNavigate();

  const features = [
    { name: 'Timetable', icon: <CalendarDays className="w-6 h-6 text-indigo-500" />, color: 'bg-indigo-50', path: '/academic/timetable' },
    { name: 'Attendance', icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, color: 'bg-green-50', path: '/academic/attendance' },
    { name: 'Assignments', icon: <FileText className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50', path: '/academic/assignments' },
    { name: 'Results/Grades', icon: <Award className="w-6 h-6 text-yellow-500" />, color: 'bg-yellow-50', path: null },
    { name: 'Syllabus Map', icon: <Map className="w-6 h-6 text-purple-500" />, color: 'bg-purple-50', path: null },
    { name: 'Faculty Dir.', icon: <Users className="w-6 h-6 text-orange-500" />, color: 'bg-orange-50', path: null },
    { name: 'Internal Marks', icon: <BookOpen className="w-6 h-6 text-pink-500" />, color: 'bg-pink-50', path: null },
    { name: 'Credit Hub', icon: <GraduationCap className="w-6 h-6 text-emerald-500" />, color: 'bg-emerald-50', path: null },
    { name: 'PYQ Papers', icon: <ClipboardList className="w-6 h-6 text-violet-500" />, color: 'bg-violet-50', path: '/academic/question-papers' },
  ];

  return (
    <div className="h-full bg-app-bg flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Header */}
      <div className="bg-indigo-600 rounded-b-[40px] p-8 pt-12 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Academic Core</h1>
        <p className="text-indigo-100 text-sm">Manage your studies and track progress.</p>
        
        {/* Quick Stats Card overlaying the header */}
        <div className="bg-white rounded-[24px] p-5 mt-6 shadow-xl flex justify-between items-center transform translate-y-12">
          <div className="text-center flex-1 border-r border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CGPA</p>
            <p className="text-2xl font-bold text-slate-900">8.75</p>
          </div>
          <div className="text-center flex-1 border-r border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Credits</p>
            <p className="text-2xl font-bold text-slate-900">120<span className="text-sm text-slate-500">/160</span></p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rank</p>
            <p className="text-2xl font-bold text-indigo-600">4<span className="text-sm text-slate-500">th</span></p>
          </div>
        </div>
      </div>

      {/* Grid of Features */}
      <div className="px-6 pt-20 flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3">
          {features.map((feature, idx) => (
            <button key={idx} 
              onClick={() => feature.path && navigate(feature.path)}
              className="bg-white rounded-[24px] p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all active:scale-95 group">
              <div className={`w-14 h-14 rounded-full ${feature.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <span className="text-[11px] font-bold text-slate-700 leading-tight">{feature.name}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Academic;
