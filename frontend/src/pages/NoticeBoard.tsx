import React from 'react';
import { ChevronLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const NoticeBoard = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-red-500 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const role = JSON.parse(localStorage.getItem('user') || '{}').role;
              if (role === 'faculty') navigate('/faculty');
              else if (role === 'admin') navigate('/admin');
              else if (window.history.length > 2) { navigate(-1); }
              else { navigate('/campus'); }
            }} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shadow-sm">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Notice Board</h1>
              <p className="text-xs text-red-100">Official Announcements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Locked State */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-5 border-2 border-red-100 shadow-inner">
          <span className="text-4xl">🔒</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Notice Board Locked</h2>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          The Notice Board module is currently under maintenance and will be available soon. Please check back later for official announcements.
        </p>
        <div className="mt-6 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-200 uppercase tracking-wider">
          🛠️ Under Maintenance
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NoticeBoard;
