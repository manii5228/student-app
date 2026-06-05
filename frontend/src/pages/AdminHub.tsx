import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar as CalendarIcon, Bell, Activity, DollarSign,
  Lock, Download, Flag, TrendingUp, ShieldAlert, CheckCircle,
  Database, Server, MapPin
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

const AdminHub = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user.first_name ? `${user.first_name}` : 'Administrator';
  const [stats, setStats] = useState({ totalUsers: '...', activeUsers: '...', serverLoad: '42%' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        const total = data.total_users || 0;
        const active = data.active_users || 0;
        setStats({
          totalUsers: total >= 1000 ? `${(total / 1000).toFixed(0)}k` : String(total),
          activeUsers: active >= 1000 ? `${(active / 1000).toFixed(0)}k` : String(active),
          serverLoad: '42%',
        });
      } catch {
        setStats({ totalUsers: '—', activeUsers: '—', serverLoad: '—' });
      }
    };
    fetchStats();
  }, []);

  // Core Management Modules
  const managementFeatures = [
    { name: 'User Management', desc: 'Create & manage accounts', icon: <Users className="w-6 h-6"/>, color: 'from-blue-500 to-blue-600', path: '/admin/users' },
    { name: 'Master Timetable', desc: 'Resolve scheduling conflicts', icon: <CalendarIcon className="w-6 h-6"/>, color: 'from-indigo-500 to-indigo-600', path: '/admin/timetable' },
    { name: 'Global Alerts', desc: '15k user mass announcements', icon: <Bell className="w-6 h-6"/>, color: 'from-red-500 to-red-600', path: '/admin/alerts' },
    { name: 'Fee Defaulters', desc: 'Track pending payments', icon: <DollarSign className="w-6 h-6"/>, color: 'from-amber-500 to-amber-600', path: '/admin/fees' },
  ];

  // Control & Moderation
  const controlFeatures = [
    { name: 'Access Control', desc: 'Restrict features (Exam Mode)', icon: <Lock className="w-5 h-5 text-slate-600"/>, color: 'bg-slate-100', path: '/admin/access-control' },
    { name: 'Faculty Roles', desc: 'Manage coordinator assignments', icon: <Users className="w-5 h-5 text-purple-600"/>, color: 'bg-purple-100', path: '/admin/faculty-roles' },
    { name: 'ID Card Templates', desc: 'Manage student & faculty template looks', icon: <Database className="w-5 h-5 text-indigo-600"/>, color: 'bg-indigo-100', path: '/admin/id-templates' },
    { name: 'Club Moderation', desc: 'Approve student clubs & events', icon: <Flag className="w-5 h-5 text-emerald-600"/>, color: 'bg-emerald-100', path: '/admin/moderation' },
    { name: 'Data Export Engine', desc: 'NAAC/NBA accreditation reports', icon: <Download className="w-5 h-5 text-indigo-600"/>, color: 'bg-indigo-100', path: '/admin/export' },
    { name: 'Indoor Map Admin', desc: 'Manage campus rooms & directions', icon: <MapPin className="w-5 h-5 text-indigo-600"/>, color: 'bg-indigo-100', path: '/admin/indoor-map' },
  ];

  // Analytics & Infrastructure
  const analyticsFeatures = [
    { name: 'System Health', desc: 'Server load & DB metrics', icon: <Activity className="w-5 h-5 text-cyan-600"/>, color: 'bg-cyan-100', path: '/admin/health' },
    { name: 'Placement Analytics', desc: 'Placed vs Eligible stats', icon: <TrendingUp className="w-5 h-5 text-green-600"/>, color: 'bg-green-100', path: '/admin/placements' },
  ];

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-black p-6 pt-12 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-black text-lg shadow-lg"><ShieldAlert className="w-6 h-6"/></div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Console</h1>
              <p className="text-xs text-slate-400">Welcome, {adminName}</p>
            </div>
          </div>
          {/* Quick stats */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
              <p className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1"><Database className="w-4 h-4"/> 99%</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">DB Health</p>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
              <p className="text-lg font-black text-white flex items-center justify-center gap-1"><Users className="w-4 h-4"/> {stats.totalUsers}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Total Users</p>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
              <p className="text-lg font-black text-amber-400 flex items-center justify-center gap-1"><Server className="w-4 h-4"/> {stats.serverLoad}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Server Load</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Core Management */}
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Core Management</h3>
        <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up">
          {managementFeatures.map(f => (
            <button key={f.name} onClick={() => navigate(f.path)}
              className={`bg-gradient-to-br ${f.color} rounded-[24px] p-4 flex flex-col justify-between aspect-square text-left shadow-md hover:shadow-lg active:scale-95 transition-all group overflow-hidden relative`}>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors"></div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">{f.icon}</div>
              <div className="relative z-10">
                <h4 className="text-sm font-bold text-white leading-tight mb-1">{f.name}</h4>
                <p className="text-[9px] font-medium text-white/70 line-clamp-2">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Control & Moderation */}
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Control & Moderation</h3>
        <div className="flex flex-col gap-3 mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
          {controlFeatures.map(f => (
            <button key={f.name} onClick={() => navigate(f.path)}
              className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-slate-100 hover:shadow-md active:scale-[0.98] transition-all text-left">
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>{f.icon}</div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">{f.name}</h4>
                <p className="text-[11px] text-slate-500">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Analytics & Infrastructure */}
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Analytics & Infrastructure</h3>
        <div className="flex flex-col gap-3 mb-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
          {analyticsFeatures.map(f => (
            <button key={f.name} onClick={() => navigate(f.path)}
              className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-slate-100 hover:shadow-md active:scale-[0.98] transition-all text-left">
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>{f.icon}</div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">{f.name}</h4>
                <p className="text-[11px] text-slate-500">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};
export default AdminHub;
