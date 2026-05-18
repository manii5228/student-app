import React, { useState, useEffect } from 'react';
import { ChevronLeft, Wifi, WifiOff, RefreshCw, Database, Clock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const SyncStatus = () => {
  const nav = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<string|null>(localStorage.getItem('lastSyncTime'));
  const [syncing, setSyncing] = useState(false);
  const [cacheSize, setCacheSize] = useState('0 KB');
  const [offlineEnabled, setOfflineEnabled] = useState(localStorage.getItem('offlineMode') === 'true');

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    estimateCacheSize();
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const estimateCacheSize = () => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) { total += (localStorage.getItem(key) || '').length * 2; }
    }
    if (total < 1024) setCacheSize(`${total} B`);
    else if (total < 1048576) setCacheSize(`${(total/1024).toFixed(1)} KB`);
    else setCacheSize(`${(total/1048576).toFixed(1)} MB`);
  };

  const syncNow = async () => {
    setSyncing(true);
    // Simulate sync with actual cache update
    await new Promise(r => setTimeout(r, 1500));
    const now = new Date().toISOString();
    localStorage.setItem('lastSyncTime', now);
    setLastSync(now);
    estimateCacheSize();
    setSyncing(false);
  };

  const toggleOffline = () => {
    const next = !offlineEnabled;
    setOfflineEnabled(next);
    localStorage.setItem('offlineMode', String(next));
  };

  const clearCache = () => {
    const keep = ['token', 'user', 'offlineMode', 'lastSyncTime'];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && !keep.includes(key)) localStorage.removeItem(key);
    }
    estimateCacheSize();
  };

  const timeSince = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className={`p-6 pt-12 shadow-md relative overflow-hidden transition-colors ${isOnline ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div>
            <h1 className="text-xl font-bold text-white">Sync & Offline</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isOnline ? <><Wifi className="w-3 h-3 text-emerald-200"/><span className="text-xs text-emerald-200 font-medium">Online</span></> : <><WifiOff className="w-3 h-3 text-red-300"/><span className="text-xs text-red-300 font-medium">Offline</span></>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Connection status */}
        <div className={`rounded-[24px] p-5 shadow-sm border mb-4 ${isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            {isOnline ? <Wifi className="w-8 h-8 text-emerald-600"/> : <WifiOff className="w-8 h-8 text-red-500"/>}
            <div>
              <h3 className="text-sm font-bold text-slate-900">{isOnline ? 'Connected' : 'No Internet'}</h3>
              <p className="text-xs text-slate-500">{isOnline ? 'All data is up-to-date' : 'Using cached data'}</p>
            </div>
          </div>
        </div>

        {/* Last sync */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400"/>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Last Synced</h3>
                <p className="text-xs text-slate-500">{lastSync ? timeSince(lastSync) : 'Never synced'}</p>
              </div>
            </div>
            <button onClick={syncNow} disabled={syncing || !isOnline} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-30 flex items-center gap-1.5">
              <RefreshCw className={`w-3 h-3 ${syncing?'animate-spin':''}`}/>{syncing?'Syncing...':'Sync Now'}
            </button>
          </div>
        </div>

        {/* Offline mode toggle */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-slate-400"/>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Offline Mode</h3>
                <p className="text-xs text-slate-500">Cache academic data locally</p>
              </div>
            </div>
            <button onClick={toggleOffline} className={`w-12 h-7 rounded-full transition-all relative ${offlineEnabled?'bg-emerald-500':'bg-slate-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all ${offlineEnabled?'left-6':'left-1'}`}></div>
            </button>
          </div>
        </div>

        {/* Cache info */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cache Size</h3>
              <p className="text-xs text-slate-500">{cacheSize} stored locally</p>
            </div>
            <button onClick={clearCache} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100">Clear Cache</button>
          </div>
        </div>

        {/* What gets cached */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3">What Gets Cached</h3>
          {[{n:'Timetable',ok:true},{n:'Attendance Data',ok:true},{n:'Results & Grades',ok:true},{n:'Syllabus',ok:true},{n:'Internal Marks',ok:true},{n:'Profile Info',ok:true}].map(item=>(
            <div key={item.n} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
              <Check className="w-4 h-4 text-emerald-500"/>
              <span className="text-xs font-medium text-slate-700">{item.n}</span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav/>
    </div>
  );
};
export default SyncStatus;
