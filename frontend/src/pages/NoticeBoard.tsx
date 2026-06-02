import React from 'react';
import { ChevronLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const NoticeBoard = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    const role = JSON.parse(localStorage.getItem('user') || '{}').role;
    if (role === 'faculty') navigate('/faculty');
    else if (role === 'admin') navigate('/admin');
    else navigate('/');
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header with Dark slate gradient for a secured lock feel */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={handleGoBack} 
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              Notice Board
            </h1>
            <p className="text-xs text-slate-350">Circulars & Announcements</p>
          </div>
        </div>
      </div>

      {/* Lock Screen */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-red-50 text-red-650 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-inner border border-red-100">
          <Lock className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-lg font-black text-slate-800 mb-2">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-8">
          Notice Board circulars are locked by the administrator. Contact your department coordinator to unlock access.
        </p>
        <button
          onClick={handleGoBack}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black transition-all shadow-md active:scale-95 hover:shadow-lg"
        >
          Go Back
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default NoticeBoard;

