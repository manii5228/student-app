import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Send, AlertTriangle, Info, Bell,
  Radio, CheckCircle2, Users
} from 'lucide-react';

const AdminGlobalAlerts = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'info' | 'warning' | 'critical'>('info');
  const [target, setTarget] = useState<'all' | 'students' | 'faculty'>('all');
  const [sent, setSent] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    
    // Simulate sending broadcast
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setTitle('');
      setMessage('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Global Alerts</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Radio className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Broadcast Message</h2>
              <p className="text-xs text-slate-500">Reach up to 15,000 active users instantly</p>
            </div>
          </div>

          {sent && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-bold text-green-800">Alert broadcasted successfully!</p>
                <p className="text-xs text-green-600">Notifications are being pushed to devices.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-5">
            {/* Target Audience */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Audience</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setTarget('all')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${target === 'all' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-bold">Everyone</span>
                </button>
                <button type="button" onClick={() => setTarget('students')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${target === 'students' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-bold">Students Only</span>
                </button>
                <button type="button" onClick={() => setTarget('faculty')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${target === 'faculty' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-bold">Faculty Only</span>
                </button>
              </div>
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Priority Level</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setPriority('info')} className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${priority === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <Info className="w-3.5 h-3.5" /> Info
                </button>
                <button type="button" onClick={() => setPriority('warning')} className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${priority === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <Bell className="w-3.5 h-3.5" /> Warning
                </button>
                <button type="button" onClick={() => setPriority('critical')} className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${priority === 'critical' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <AlertTriangle className="w-3.5 h-3.5" /> Critical
                </button>
              </div>
            </div>

            {/* Message Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Alert Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Campus Closure Tomorrow"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Detailed Message</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type the full announcement details here..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[120px] resize-none"
                  required
                ></textarea>
              </div>
            </div>

            {/* Preview */}
            {title && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Preview (Mobile Notification)</label>
                <div className="bg-slate-800 rounded-2xl p-4 shadow-xl max-w-[300px] mx-auto border-t border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      {priority === 'critical' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : 
                       priority === 'warning' ? <Bell className="w-4 h-4 text-amber-400" /> : 
                       <Info className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight mb-1">{title}</h4>
                      <p className="text-xs text-slate-300 line-clamp-2">{message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={!title || !message}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Send className="w-5 h-5" /> Push to {target === 'all' ? '15,000' : 'selected'} users
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminGlobalAlerts;
