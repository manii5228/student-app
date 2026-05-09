import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, QrCode, PenTool, LayoutDashboard } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const FacultyHub = () => {
  const navigate = useNavigate();

  const features = [
    { name: 'Bulk Attendance', desc: 'Grid view marker', icon: <Users className="w-8 h-8 text-indigo-500" />, color: 'bg-indigo-50 border-indigo-100', path: '/faculty/bulk-attendance' },
    { name: 'Dynamic QR', desc: 'GPS-locked 60s QR', icon: <QrCode className="w-8 h-8 text-emerald-500" />, color: 'bg-emerald-50 border-emerald-100', path: '/faculty/qr' },
    { name: 'Marks Entry', desc: 'Auto-save portal', icon: <PenTool className="w-8 h-8 text-amber-500" />, color: 'bg-amber-50 border-amber-100', path: '/faculty/marks' },
  ];

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Header */}
      <div className="bg-slate-900 rounded-b-[40px] p-8 pt-12 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">Faculty Hub</h1>
        </div>
        <p className="text-slate-400 text-sm">Welcome back, Dr. Ramesh.</p>
      </div>

      {/* Grid */}
      <div className="px-6 pt-8 flex-1 overflow-y-auto">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Management Tools</h2>
        <div className="flex flex-col gap-4">
          {features.map((feature, idx) => (
            <button key={idx} onClick={() => navigate(feature.path)}
              className={`rounded-[24px] p-5 flex items-center gap-5 border-2 hover:shadow-lg transition-all active:scale-95 text-left ${feature.color}`}>
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{feature.name}</h3>
                <p className="text-sm font-medium text-slate-500">{feature.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default FacultyHub;
