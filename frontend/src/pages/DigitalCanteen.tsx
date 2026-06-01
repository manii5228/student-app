import React from 'react';
import { ChevronLeft, Lock, ArrowLeft, Coffee, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const DigitalCanteen = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-slate-950 flex flex-col font-sans text-white animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-md p-6 pt-12 border-b border-white/5 flex items-center gap-3 relative z-10 shrink-0">
        <button 
          onClick={() => navigate('/')} 
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
        >
          <ChevronLeft className="w-5 h-5 text-slate-350" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Canteen Pre-order</h1>
          <p className="text-xs text-slate-400">Main Cafeteria Services</p>
        </div>
      </div>

      {/* Futuristic Dark Glassmorphic Locked Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-[-10%] w-60 h-60 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-sm flex flex-col items-center">
          {/* Animated Lock Badge */}
          <div className="relative mb-8 flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 border border-white/15 shadow-2xl backdrop-blur-xl animate-float">
            <Lock className="w-10 h-10 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-0.5 shadow-md">
              <Sparkles className="w-2 h-2" /> V2.0
            </div>
          </div>

          <h2 className="text-2xl font-black mb-3 tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
            Digital Canteen Locked
          </h2>
          
          <p className="text-xs text-slate-400 leading-relaxed mb-8 max-w-xs">
            Skip the line, scan dining cards, and preorder hot meals! The Digital Canteen is currently locked in Version 1.0 and is launching in the next version update.
          </p>

          {/* Feature highlights preview grid */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left mb-8 backdrop-blur-md">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" /> Upcoming Preorder Features:
            </h4>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="font-bold text-slate-200">Express QR Checkout & Meal Pickup</span>
              </div>
              <div className="flex items-center gap-2 text-xs border-t border-white/5 pt-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="font-bold text-slate-200">Daily Canteen Specials Scheduling</span>
              </div>
              <div className="flex items-center gap-2 text-xs border-t border-white/5 pt-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="font-bold text-slate-200">Live In-App Order Queue Status</span>
              </div>
            </div>
          </div>

          {/* Button back */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.15)] transform active:scale-95 text-xs w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Safety
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default DigitalCanteen;
