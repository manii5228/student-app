import React from 'react';
import { 
  Briefcase, CheckSquare, Clock, BookOpen, 
  Users, Share2, Target, FileText, PenTool, BarChart3, Lock, LogIn, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Career = () => {
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
    { name: 'Job Portal', icon: <Briefcase className="w-6 h-6 text-emerald-600" />, color: 'bg-emerald-100', text: 'View & apply for placements.', path: '/career/jobs' },
    { name: 'Portfolio Builder', icon: <BookOpen className="w-6 h-6 text-orange-600" />, color: 'bg-orange-100', text: 'Auto-generate your ATS CV.', path: '/career/portfolio' },
    { name: 'Team Finder', icon: <Users className="w-6 h-6 text-indigo-600" />, color: 'bg-indigo-100', text: 'Tinder-style match making.', path: '/career/team-finder' },
    { name: 'Referral Hub', icon: <Share2 className="w-6 h-6 text-pink-600" />, color: 'bg-pink-100', text: 'Ask alumni for referrals.', path: '/career/referrals' },
    { name: 'Project Tracker', icon: <Target className="w-6 h-6 text-cyan-600" />, color: 'bg-cyan-100', text: 'Milestones & deadlines.', path: '/career/projects' },
    { name: 'Skill Badges', icon: <CheckSquare className="w-6 h-6 text-purple-600" />, color: 'bg-purple-100', text: 'Earn digital achievements.', path: '/career/badges' },
    { name: 'Interviews', icon: <Clock className="w-6 h-6 text-violet-600" />, color: 'bg-violet-100', text: 'Upcoming placement rounds.', path: '/career/interviews' },
    { name: 'Company Prep', icon: <FileText className="w-6 h-6 text-blue-600" />, color: 'bg-blue-100', text: 'Previous year questions.', path: '/career/prep' },
    { name: 'Internships', icon: <PenTool className="w-6 h-6 text-teal-600" />, color: 'bg-teal-100', text: 'Track summer internships.', path: '/career/internships' },
    { name: 'Mock Tests', icon: <BarChart3 className="w-6 h-6 text-rose-600" />, color: 'bg-rose-100', text: 'Practice MCQ tests.', path: '/career/mock-tests' },
  ];

  return (
    <div className="h-full bg-app-bg flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Header */}
      <div className="bg-emerald-600 rounded-b-[40px] p-8 pt-12 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Career Hub</h1>
        <p className="text-emerald-100 text-sm">Placements, Internships & Alumni.</p>
        
        {/* Placement Target Card overlaying the header */}
        <div className="bg-slate-900 rounded-[24px] p-6 mt-6 shadow-xl flex items-center justify-between transform translate-y-12">
          <div>
            <p className="text-sm font-medium text-emerald-400 mb-1">Dream Company Target</p>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Google <Target className="w-5 h-5 text-emerald-500" />
            </h2>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-slate-700 flex items-center justify-center">
            <span className="text-white font-bold">75%</span>
          </div>
        </div>
      </div>

      {/* Grid of Features */}
      <div className="px-6 pt-20 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, idx) => (
            <button 
              key={idx} 
              onClick={() => feature.path && navigate(feature.path)}
              className="bg-white rounded-[28px] p-5 flex flex-col justify-between items-start text-left shadow-sm hover:shadow-md transition-all active:scale-95 group h-36"
            >
              <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{feature.name}</h3>
                <p className="text-[10px] font-medium text-slate-500 mt-1 leading-tight">{feature.text}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Career;
