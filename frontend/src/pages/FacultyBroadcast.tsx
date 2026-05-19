import React, { useState } from 'react';
import { ChevronLeft, Send, Bell, CheckCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

const FacultyBroadcast = () => {
  const nav = useNavigate();
  const [targetClass, setTargetClass] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal'|'urgent'>('normal');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const classes = ['CSE-A Sem 4','CSE-B Sem 4','CSE-A Sem 6','ECE-A Sem 4','ECE-B Sem 6','MECH-A Sem 4','All Students'];

  const send = async () => {
    if (!targetClass || !message.trim()) return;
    setSending(true);
    try { await api.post('/faculty/broadcast', { target_class:targetClass, message:message.trim(), priority }); setSent(true); } catch{}
    setSending(false);
  };

  if (sent) return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5"><CheckCircle className="w-10 h-10 text-emerald-600"/></div>
          <h1 className="text-xl font-black text-slate-900">Broadcast Sent!</h1>
          <p className="text-sm text-slate-500 mt-2">Notification sent to <span className="font-bold text-slate-700">{targetClass}</span></p>
          <div className="mt-6 flex flex-col gap-2">
            <button onClick={()=>{setSent(false);setMessage('');setTargetClass('');}} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm">Send Another</button>
            <button onClick={()=>nav('/faculty')} className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm">Back to Hub</button>
          </div>
        </div>
      </div>
      <BottomNav/>
    </div>
  );

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-white"/><div><h1 className="text-xl font-bold text-white">Broadcast</h1><p className="text-xs text-rose-200">Send notification to class</p></div></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4 animate-slide-up">
          {/* Target class */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Target Class *</label>
            <div className="flex flex-wrap gap-2">
              {classes.map(c => <button key={c} onClick={()=>setTargetClass(c)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border-2 ${targetClass===c?'border-rose-500 bg-rose-50 text-rose-700':'border-slate-200 text-slate-600 hover:border-slate-300'}`}>{c}</button>)}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Priority</label>
            <div className="flex gap-2">
              <button onClick={()=>setPriority('normal')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${priority==='normal'?'border-blue-500 bg-blue-50 text-blue-700':'border-slate-200 text-slate-500'}`}>📩 Normal</button>
              <button onClick={()=>setPriority('urgent')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${priority==='urgent'?'border-red-500 bg-red-50 text-red-700':'border-slate-200 text-slate-500'}`}>🚨 Urgent</button>
            </div>
          </div>

          {/* Message */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Message *</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} placeholder="Type your announcement..." className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-rose-400 resize-none"/>
            <p className="text-[10px] text-slate-400 mt-1 text-right">{message.length}/500</p>
          </div>

          {/* Preview */}
          {(targetClass && message.trim()) && <div className="bg-slate-900 rounded-[20px] p-5 shadow-lg">
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Preview</p>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-indigo-400"/><span className="text-xs font-bold text-indigo-400">{targetClass}</span>
              {priority==='urgent' && <span className="text-[9px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-lg">URGENT</span>}
            </div>
            <p className="text-sm text-white">{message}</p>
          </div>}

          <button onClick={send} disabled={sending||!targetClass||!message.trim()} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-40">
            <Send className="w-4 h-4"/>{sending?'Sending...':'Send Broadcast'}
          </button>
        </div>
      </div>
      <BottomNav/>
    </div>
  );
};
export default FacultyBroadcast;
