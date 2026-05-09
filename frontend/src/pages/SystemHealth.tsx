import React, { useState, useEffect } from 'react';
import { ChevronLeft, Server, Activity, Database, Cpu, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const SystemHealth = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    cpu: 45,
    ram: 62,
    dbConnections: 124,
    celeryQueue: 5,
    uptime: '14d 08h 22m',
    status: 'Operational'
  });

  // Simulate real-time metrics fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() * 10 - 5))),
        ram: Math.min(100, Math.max(0, prev.ram + (Math.random() * 4 - 2))),
        dbConnections: Math.floor(Math.max(50, prev.dbConnections + (Math.random() * 20 - 10))),
        celeryQueue: Math.max(0, Math.floor(prev.celeryQueue + (Math.random() * 4 - 2))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (val: number, isHighBad: boolean = true) => {
    if (isHighBad) {
      if (val > 85) return 'text-red-500';
      if (val > 70) return 'text-amber-500';
      return 'text-emerald-500';
    }
    return 'text-emerald-500';
  };

  const getStatusBg = (val: number, isHighBad: boolean = true) => {
    if (isHighBad) {
      if (val > 85) return 'bg-red-500';
      if (val > 70) return 'bg-amber-500';
      return 'bg-emerald-500';
    }
    return 'bg-emerald-500';
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in pb-10">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-6 mt-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
          <Activity className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="px-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Title Section */}
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Health</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-sm font-semibold text-slate-500">{metrics.status}</p>
          </div>
        </div>
        
        {/* Core Infrastructure Bento Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* CPU Card */}
          <div className="bg-app-blue rounded-[32px] p-6 flex flex-col justify-between aspect-square shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-slate-800">CPU Usage</span>
              <Cpu className="w-5 h-5 text-app-accent" />
            </div>
            <div className="mt-4">
              <span className={`text-4xl font-bold ${getStatusColor(metrics.cpu)}`}>{metrics.cpu.toFixed(0)}<span className="text-2xl font-semibold">%</span></span>
              <div className="h-2 bg-white/50 rounded-full mt-3 overflow-hidden">
                 <div className={`h-full ${getStatusBg(metrics.cpu)} transition-all duration-1000`} style={{ width: `${metrics.cpu}%` }}></div>
              </div>
            </div>
          </div>

          {/* RAM Card */}
          <div className="bg-app-purple rounded-[32px] p-6 flex flex-col justify-between aspect-square shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-slate-800">RAM Usage</span>
              <HardDrive className="w-5 h-5 text-slate-700" />
            </div>
            <div className="mt-4">
              <span className={`text-4xl font-bold ${getStatusColor(metrics.ram)}`}>{metrics.ram.toFixed(0)}<span className="text-2xl font-semibold">%</span></span>
              <div className="h-2 bg-white/50 rounded-full mt-3 overflow-hidden">
                 <div className={`h-full ${getStatusBg(metrics.ram)} transition-all duration-1000`} style={{ width: `${metrics.ram}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <h2 className="text-xl font-bold text-slate-900 mb-5">Live Services</h2>
        <div className="flex flex-col gap-4 mb-8">
          
          {/* DB Connections */}
          <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-[20px] bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Database className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-slate-900 leading-tight">PGBouncer Pool</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Active PostgreSQL Connections</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-800">{metrics.dbConnections}</span>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">/ 500 Max</span>
            </div>
          </div>

          {/* Celery Queue */}
          <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-[20px] bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Server className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-slate-900 leading-tight">Celery Tasks</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Notifications pending</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-800">{metrics.celeryQueue}</span>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">In Queue</span>
            </div>
          </div>

        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default SystemHealth;
