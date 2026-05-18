import React, { useState } from 'react';
import { ChevronLeft, AlertTriangle, Phone, Shield, Flame, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

const EmergencyButton = () => {
  const nav = useNavigate();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  const types = [
    { key:'medical', label:'Medical', icon:<Heart className="w-8 h-8"/>, color:'from-red-500 to-rose-600', desc:'Ambulance / First Aid' },
    { key:'security', label:'Security', icon:<Shield className="w-8 h-8"/>, color:'from-blue-500 to-indigo-600', desc:'Campus security alert' },
    { key:'fire', label:'Fire', icon:<Flame className="w-8 h-8"/>, color:'from-orange-500 to-red-600', desc:'Fire department alert' },
    { key:'other', label:'Other', icon:<Phone className="w-8 h-8"/>, color:'from-slate-500 to-slate-700', desc:'General emergency' },
  ];

  const sendAlert = async (alertType: string) => {
    setSending(true); setSelectedType(alertType);
    try {
      let loc: {latitude?:number;longitude?:number;location?:string} = {};
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res,rej) => navigator.geolocation.getCurrentPosition(res,rej,{timeout:5000}));
          loc = { latitude:pos.coords.latitude, longitude:pos.coords.longitude, location:`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` };
        } catch {}
      }
      await api.post('/utility/emergency', { alert_type:alertType, ...loc, message:`Emergency ${alertType} alert triggered` });
      setSent(true);
    } catch {}
    setSending(false);
  };

  if (sent) return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center animate-slide-up">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Alert Sent!</h1>
          <p className="text-sm text-slate-500 mb-2">Campus security has been notified.</p>
          <p className="text-xs text-slate-400">Help is on the way. Stay calm and stay where you are.</p>
          <div className="mt-8 flex flex-col gap-3">
            <a href="tel:100" className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"><Phone className="w-4 h-4"/>Call Emergency (100)</a>
            <button onClick={()=>{setSent(false);setSelectedType('');}} className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm">Back</button>
          </div>
        </div>
      </div>
      <BottomNav/>
    </div>
  );

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Emergency</h1><p className="text-xs text-red-200">One-tap alert to campus security</p></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-red-50 rounded-2xl p-4 mb-5 border border-red-200">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-600"/><span className="text-xs font-bold text-red-700">USE ONLY IN REAL EMERGENCIES</span></div>
          <p className="text-xs text-red-600">This will send an immediate alert to campus security with your location.</p>
        </div>

        <h2 className="text-sm font-bold text-slate-900 mb-3">Select Emergency Type</h2>
        <div className="grid grid-cols-2 gap-3">
          {types.map(t=>(
            <button key={t.key} onClick={()=>sendAlert(t.key)} disabled={sending}
              className={`bg-gradient-to-br ${t.color} rounded-[24px] p-6 flex flex-col items-center gap-3 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50`}>
              {sending && selectedType===t.key ? <span className="w-8 h-8 border-4 border-white/40 border-t-white rounded-full animate-spin"></span> : t.icon}
              <div className="text-center"><h3 className="text-sm font-bold">{t.label}</h3><p className="text-[10px] text-white/70 mt-0.5">{t.desc}</p></div>
            </button>
          ))}
        </div>

        <div className="mt-6 bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Emergency Contacts</h3>
          <div className="flex flex-col gap-2">
            {[{n:'Campus Security',p:'044-2656-0001'},{n:'Ambulance',p:'108'},{n:'Fire Station',p:'101'},{n:'Police',p:'100'}].map(c=>(
              <a key={c.p} href={`tel:${c.p}`} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 hover:bg-slate-100 transition-colors">
                <span className="text-sm font-medium text-slate-700">{c.n}</span>
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><Phone className="w-3 h-3"/>{c.p}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      <BottomNav/>
    </div>
  );
};
export default EmergencyButton;
