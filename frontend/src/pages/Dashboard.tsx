import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  ChevronLeft, Share2, Plus, Search, 
  PieChart, Book, ChevronRight, Activity, Lock 
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import UpsellModal from '../components/UpsellModal';
import { api } from '../lib/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [upsellOpen, setUpsellOpen] = useState(false);
  
  // Immediately redirect faculty/admin before any render
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (user) {
    if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  const isGuest = user?.is_guest || user?.role === 'guest';

  const logGuestAction = async (featureName: string) => {
    if (!isGuest) return;
    try {
      await api.post('/auth/guest-log', { feature_name: featureName });
    } catch (err) {
      console.error('Failed to log guest action:', err);
    }
  };

  const handleMetricClick = (metricName: string) => {
    if (isGuest) {
      logGuestAction(`dashboard_${metricName}_click`);
      setUpsellOpen(true);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in pb-24 relative">
      
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-6 mt-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
          <Share2 className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="px-6 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Title Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Progress</h1>
          <div className="flex gap-4 text-slate-500">
            <button className="hover:text-slate-900"><Plus className="w-6 h-6" /></button>
            <button className="hover:text-slate-900"><Search className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Completed Card */}
          <div 
            onClick={() => handleMetricClick('completed_card')}
            className="bg-app-blue rounded-[32px] p-6 flex flex-col justify-between aspect-square relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-slate-800">Completed</span>
              <PieChart className="w-5 h-5 text-app-accent" />
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold text-slate-900">56<span className="text-2xl font-semibold">%</span></span>
            </div>
            {isGuest && (
              <div className="absolute inset-0 bg-white/20 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center border border-slate-200 rounded-[32px]">
                <Lock className="w-5 h-5 text-slate-700 mb-1" />
                <span className="text-[10px] font-bold text-slate-800">Locked</span>
              </div>
            )}
          </div>

          {/* Lessons Card */}
          <div 
            onClick={() => handleMetricClick('lessons_card')}
            className="bg-app-purple rounded-[32px] p-6 flex flex-col justify-between aspect-square relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-slate-800">Lessons</span>
              <Book className="w-5 h-5 text-slate-700" />
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900">21</span>
              <span className="text-xl font-medium text-slate-500">/23</span>
            </div>
            {isGuest && (
              <div className="absolute inset-0 bg-white/20 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center border border-slate-200 rounded-[32px]">
                <Lock className="w-5 h-5 text-slate-700 mb-1" />
                <span className="text-[10px] font-bold text-slate-800">Locked</span>
              </div>
            )}
          </div>
        </div>

        {/* Badges Section */}
        <div 
          onClick={() => handleMetricClick('badges_section')}
          className="mb-8 relative rounded-2xl overflow-hidden p-2 hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Badges</h2>
              <span className="bg-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">8</span>
            </div>
            <button className="text-app-accent font-semibold text-sm flex items-center hover:opacity-80">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Badges Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
            {/* Badge 1 */}
            <div className="flex flex-col items-center gap-2 min-w-[80px] snap-start">
              <div className="w-[72px] h-[72px] rounded-full bg-[#fde8e8] border-4 border-indigo-100 flex items-center justify-center relative shadow-sm">
                <span className="text-3xl">📖</span>
                <div className="absolute -bottom-1 w-10 h-1 bg-red-400 rounded-full"></div>
              </div>
              <span className="text-xs font-semibold text-center leading-tight">Book<br/>Explorer</span>
            </div>
            
            {/* Badge 2 */}
            <div className="flex flex-col items-center gap-2 min-w-[80px] snap-start">
              <div className="w-[72px] h-[72px] rounded-full bg-[#e1e7ff] border-4 border-[#e1e7ff] flex items-center justify-center shadow-sm">
                <div className="w-10 h-10 bg-[#fde8e8] rounded-full flex items-center justify-center">
                  <span className="text-xl text-red-500">♥️</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-center leading-tight">Heart of a<br/>Reader</span>
            </div>

            {/* Badge 3 */}
            <div className="flex flex-col items-center gap-2 min-w-[80px] snap-start">
              <div className="w-[72px] h-[72px] rounded-full bg-[#e1e7ff] border-4 border-[#e1e7ff] flex items-center justify-center shadow-sm">
                 <span className="text-3xl">🌈</span>
              </div>
              <span className="text-xs font-semibold text-center leading-tight">Rainbow<br/>Reader</span>
            </div>

            {/* Badge 4 */}
            <div className="flex flex-col items-center gap-2 min-w-[80px] snap-start">
              <div className="w-[72px] h-[72px] rounded-full bg-[#fde8e8] border-4 border-[#f3f4f6] flex items-center justify-center shadow-sm">
                 <div className="w-8 h-10 bg-red-500 rounded-sm"></div>
              </div>
              <span className="text-xs font-semibold text-center leading-tight">Reading<br/>Pass</span>
            </div>
          </div>
          {isGuest && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center rounded-2xl">
              <Lock className="w-5 h-5 text-slate-700 mb-1" />
              <span className="text-xs font-bold text-slate-800">Sign In to Earn Badges</span>
            </div>
          )}
        </div>

        {/* Your Activity Chart Card */}
        <div 
          onClick={() => handleMetricClick('activity_card')}
          className="bg-app-dark rounded-[40px] p-6 text-white mb-6 shadow-xl relative overflow-hidden cursor-pointer"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Your activity</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">21</span>
                <span className="text-lg text-slate-300 font-medium mr-1">hr</span>
                <span className="text-3xl font-bold">54</span>
                <span className="text-lg text-slate-300 font-medium">min</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <Activity className="w-5 h-5 text-slate-300" />
            </div>
          </div>

          {/* Custom Bar Chart Component */}
          <div className="mt-12">
            <div className="flex items-end justify-between h-32 gap-2 mb-2 relative">
              <div className="absolute top-2 left-[58%] -translate-x-1/2 bg-[#0d7a8e] text-white text-xs font-bold px-3 py-1 rounded-full z-10 whitespace-nowrap">
                4,5hr
              </div>

              <div className="w-full bg-slate-800 rounded-t-xl h-[20%] transition-all"></div>
              <div className="w-full bg-slate-800 rounded-t-xl h-[35%] transition-all"></div>
              <div className="w-full bg-slate-800 rounded-t-xl h-[45%] transition-all"></div>
              <div className="w-full bg-slate-800 rounded-t-xl h-[30%] transition-all"></div>
              
              <div className="w-full h-[85%] rounded-t-xl relative overflow-hidden bg-app-accent">
                 <div className="absolute inset-0 opacity-30" style={{
                   backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #ffffff 4px, #ffffff 8px)'
                 }}></div>
              </div>
              
              <div className="w-full bg-slate-800 rounded-t-xl h-[25%] transition-all"></div>
              <div className="w-full bg-slate-800 rounded-t-xl h-[15%] transition-all"></div>
            </div>
            
            <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span className="text-white">Thr</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>
          </div>

          {isGuest && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center rounded-[40px] border border-slate-800">
              <Lock className="w-6 h-6 text-violet-400 mb-2 animate-bounce" />
              <span className="text-sm font-bold text-white">Track Study Analytics</span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Sign in with your academic account to view usage trends.</p>
            </div>
          )}
        </div>

      </div>

      <BottomNav />
      <UpsellModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
