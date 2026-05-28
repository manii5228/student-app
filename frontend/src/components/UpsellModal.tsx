import React from 'react';
import { X, CheckCircle2, Lock, ShieldCheck, UserCheck } from 'lucide-react';

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpsellModal: React.FC<UpsellModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85%] animate-slide-up">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 py-5 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-300 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">VelTech Account Perks</span>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">Unlock Full Student Access</h3>
          <p className="text-xs text-indigo-100 mt-1">
            Upgrade your guest session to access student services, academic records, and career tools.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex justify-center mb-1 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-700">Guest Visitor</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Limited read-only access</div>
            </div>
            
            <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex justify-center mb-1 text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-emerald-800">Student Profile</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Full verified workspace</div>
            </div>
          </div>

          {/* Features Comparison */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Features Comparison</h4>
            
            <div className="space-y-2.5">
              {[
                { name: "Canteen Pre-order & Map Guides", guest: true, student: true },
                { name: "Timetables, Attendance & Results", guest: true, student: true },
                { name: "Campus Map, Notices & Bus Tracking", guest: true, student: true },
                { name: "Events & Fests Information", guest: true, student: true },
                { name: "Internal Marks & Performance", guest: true, student: true },
                { name: "Hostel Passes & Gate Clearances", guest: false, student: true },
                { name: "AI Study Mentor & GPA Predictor", guest: false, student: true },
                { name: "Job Boards, Placements & Referrals", guest: false, student: true },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 text-xs">
                  <span className="text-slate-700 font-medium">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center">
                      {item.guest ? (
                        <CheckCircle2 className="w-4 h-4 text-slate-400 inline" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-rose-400 inline" />
                      )}
                    </span>
                    <span className="w-6 text-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-xs hover:bg-slate-800 transition-all shadow-md transform active:scale-95"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpsellModal;
