import React, { useState } from 'react';
import { Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UpsellModal from './UpsellModal';

const GuestLockedFeature = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center bg-slate-950 text-white rounded-3xl relative overflow-hidden border border-slate-800 shadow-2xl">
      {/* Modern glassmorphism ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-48 h-48 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Pulsing Lock Icon Container */}
      <div className="relative mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md animate-pulse">
        <Lock className="w-9 h-9 text-violet-400" />
      </div>

      <h2 className="text-xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-violet-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
        Account Authentication Required
      </h2>
      
      <p className="text-xs text-slate-400 max-w-xs mb-8 leading-relaxed">
        This is a premium student portal featuring interactive databases and private college systems. Guests are restricted from this view.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-[200px] z-10">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] transform hover:scale-[1.02] active:scale-[0.98] text-xs"
        >
          <LogIn className="w-3.5 h-3.5" />
          Unlock Feature
        </button>

        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-2.5 px-4 rounded-xl border border-white/10 transition-all text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go to Dashboard
        </button>
      </div>

      <UpsellModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default GuestLockedFeature;
