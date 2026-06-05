import React, { useState } from 'react';
import {
  Coffee, Bus, Map as MapIcon, Calendar, Bell,
  Users, MessageSquare, ClipboardCheck, BookOpen,
  Heart, AlertTriangle, RefreshCw, Sparkles, Calculator, Camera, Activity, Lock, LogIn, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import UpsellModal from '../components/UpsellModal';
import { api } from '../lib/api';

const Campus = () => {
  const navigate = useNavigate();
  const [upsellOpen, setUpsellOpen] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isGuest = user?.is_guest || user?.role === 'guest';

  if (isGuest) {
    return (
      <div className="min-h-full bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-center font-sans animate-fade-in relative pb-24">
        {/* Decorative background shape */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#3b82f6]/5 rounded-bl-[120px] pointer-events-none"></div>
        <div className="absolute bottom-20 left-0 w-36 h-36 bg-[#4f46e5]/5 rounded-tr-[120px] pointer-events-none"></div>

        <div className="bg-[#111827]/90 border border-slate-800 rounded-[32px] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center justify-center backdrop-blur-md relative z-10">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#1f2937] border border-slate-800 flex items-center justify-center mb-6 shadow-inner">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>

          {/* Heading */}
          <h2 className="text-xl font-bold text-white mb-3 tracking-tight">
            Account Authentication <span className="text-sky-400 font-extrabold">Required</span>
          </h2>

          {/* Subheading */}
          <p className="text-xs text-slate-400 leading-relaxed mb-8">
            This is a premium student portal featuring interactive databases and private college systems. Guests are restricted from this view.
          </p>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#2a3461] hover:bg-[#344075] text-white py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-[#2a3461]/20"
            >
              <LogIn className="w-4 h-4 text-sky-300" />
              Unlock Feature
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#1f2937] hover:bg-[#374151] text-slate-300 py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-800 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              Go to Dashboard
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const logGuestAction = async (featureName: string) => {
    if (!isGuest) return;
    try {
      await api.post('/auth/guest-log', { feature_name: featureName });
    } catch (err) {
      console.error('Failed to log guest action:', err);
    }
  };

  const handleFeatureClick = (feature: any) => {
    if (isGuest && feature.restricted) {
      logGuestAction(`${feature.name.toLowerCase().replace(/\s+/g, '_')}_lock_click`);
      setUpsellOpen(true);
    } else {
      if (isGuest) {
        logGuestAction(`${feature.name.toLowerCase().replace(/\s+/g, '_')}_view`);
      }
      if (feature.path) {
        navigate(feature.path);
      }
    }
  };

  const features = [
    { name: 'Canteen Pre-order', icon: <Coffee className="w-6 h-6 text-orange-600" />, color: 'bg-orange-100', text: 'Skip the line, order now.', path: '/campus/canteen', restricted: false },
    { name: 'Hostel Out-Pass', icon: <Calendar className="w-6 h-6 text-teal-600" />, color: 'bg-teal-100', text: 'QR-based exit pass system.', path: '/campus/hostel-pass', restricted: true },
    { name: 'Bus Tracker', icon: <Bus className="w-6 h-6 text-blue-600" />, color: 'bg-blue-100', text: 'Live GPS of college buses.', path: '/campus/bus', restricted: false },
    { name: 'Indoor Map', icon: <MapIcon className="w-6 h-6 text-emerald-600" />, color: 'bg-emerald-100', text: 'Navigate labs and POIs.', path: '/campus/map', restricted: false },
    { name: 'Events & Comm Hub', icon: <Calendar className="w-6 h-6 text-pink-600" />, color: 'bg-pink-100', text: 'Fests, clubs, and highlights.', path: '/campus/events', restricted: false },
    { name: 'Notice Board', icon: <Bell className="w-6 h-6 text-red-600" />, color: 'bg-red-100', text: 'Important announcements.', path: '/campus/notices', restricted: false },
    { name: 'Anon Feedback', icon: <MessageSquare className="w-6 h-6 text-purple-600" />, color: 'bg-purple-100', text: 'Voice your concerns safely.', path: '/campus/feedback', restricted: true },
    { name: 'Library Portal', icon: <BookOpen className="w-6 h-6 text-amber-700" />, color: 'bg-amber-100', text: 'Search, borrow & renew books.', path: '/campus/library', restricted: true },
    { name: 'Doc Scanner', icon: <Camera className="w-6 h-6 text-slate-700" />, color: 'bg-slate-100', text: 'Scan notes to digital.', path: '/ai/scanner', restricted: true },
  ];

  return (
    <div className="h-full bg-app-bg flex flex-col font-sans animate-fade-in relative pb-24">

      {/* Header */}
      <div className="bg-orange-500 rounded-b-[40px] p-8 pt-12 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Campus Life</h1>
        <p className="text-orange-100 text-sm">Everything outside the classroom.</p>

        {/* Featured Event Card overlaying the header */}
        <div
          onClick={() => {
            if (isGuest) {
              logGuestAction('featured_lavaza_click');
            }
            navigate('/campus/events');
          }}
          className="bg-slate-900 rounded-[24px] p-5 mt-6 shadow-xl text-white transform translate-y-12 bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
          <div className="relative z-10 flex flex-col h-full justify-end pt-16">
            <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full w-max mb-2">UPCOMING FEST</span>
            <h2 className="text-2xl font-bold">LAVAZA '26</h2>
            <p className="text-slate-300 text-sm mt-1">Cultural Night • Main Auditorium</p>
          </div>
        </div>
      </div>

      {/* List of Features */}
      <div className="px-6 pt-20 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {features.map((feature, idx) => (
            <button key={idx}
              onClick={() => handleFeatureClick(feature)}
              className={`bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-95 text-left border ${isGuest && feature.restricted ? 'border-dashed border-slate-200 opacity-90' : 'border-transparent'}`}
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center shrink-0`}>
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800 truncate">{feature.name}</h3>
                  {isGuest && feature.restricted && (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">{feature.text}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
      <UpsellModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </div>
  );
};

export default Campus;
