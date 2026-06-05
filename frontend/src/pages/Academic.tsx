import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, CheckCircle2, FileText, Award, 
  Compass, Users, BookOpen, GraduationCap, ClipboardList,
  Sparkles, Calculator, Lock, LogIn, ArrowLeft
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const Academic = () => {
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isGuest = user?.is_guest || user?.role === 'guest';

  if (isGuest) {
    return (
      <div className="min-h-full bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-center font-sans animate-fade-in relative pb-24">
        {/* Decorative background shape */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#3b82f6]/5 rounded-bl-[120px] pointer-events-none"></div>
        <div className="absolute bottom-20 left-0 w-36 h-36 bg-[#4f46e5]/5 rounded-tr-[120px] pointer-events-none"></div>

        <div className="bg-[#111827]/90 border border-slate-800 rounded-[32px] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center justify-center backdrop-blur-md relative z-10">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#1f2937] border border-slate-800 flex items-center justify-center mb-6 shadow-inner">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>

          {/* Heading */}
          <h2 className="text-xl font-bold text-white mb-3 tracking-tight">
            Account Authentication <span className="text-sky-400 font-extrabold">Required</span>
          </h2>

          {/* Subheading */}
          <p className="text-xs text-slate-400 leading-relaxed mb-8">
            This is a premium student portal featuring interactive databases and private college systems. Guests are restricted from this view.
          </p>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#2a3461] hover:bg-[#344075] text-white py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-[#2a3461]/20"
            >
              <LogIn className="w-4 h-4 text-sky-300" />
              Unlock Feature
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#1f2937] hover:bg-[#374151] text-slate-300 py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-800 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              Go to Dashboard
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const features = [
    { name: 'Timetable', icon: <CalendarDays className="w-6 h-6 text-indigo-500" />, color: 'bg-indigo-50', path: '/academic/timetable' },
    { name: 'Attendance', icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, color: 'bg-green-50', path: '/academic/attendance' },
    { name: 'Assignments', icon: <FileText className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50', path: '/academic/assignments' },
    { name: 'Results/Grades', icon: <Award className="w-6 h-6 text-yellow-500" />, color: 'bg-yellow-50', path: '/academic/results' },
    { name: 'Syllabus Map', icon: <Compass className="w-6 h-6 text-purple-500" />, color: 'bg-purple-50', path: '/academic/syllabus' },
    { name: 'Faculty Dir.', icon: <Users className="w-6 h-6 text-orange-500" />, color: 'bg-orange-50', path: '/academic/faculty' },
    { name: 'Internal Marks', icon: <BookOpen className="w-6 h-6 text-pink-500" />, color: 'bg-pink-50', path: '/academic/internal-marks' },
    { name: 'Credit Hub', icon: <GraduationCap className="w-6 h-6 text-emerald-500" />, color: 'bg-emerald-50', path: '/academic/credits' },
    { name: 'PYQ Papers', icon: <ClipboardList className="w-6 h-6 text-violet-500" />, color: 'bg-violet-50', path: '/academic/question-papers' },
    { name: 'Exam Schedule', icon: <CalendarDays className="w-6 h-6 text-rose-500" />, color: 'bg-rose-50', path: '/academic/exams' },
    { name: 'AI Study Bot', icon: <Sparkles className="w-6 h-6 text-violet-600" />, color: 'bg-violet-50', path: '/ai/study-assistant' },
    { name: 'GPA Predictor', icon: <Calculator className="w-6 h-6 text-cyan-600" />, color: 'bg-cyan-50', path: '/ai/gpa-predictor' },
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
