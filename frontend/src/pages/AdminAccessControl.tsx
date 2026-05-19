import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, ShieldAlert, ToggleLeft, ToggleRight, Calendar, Info } from 'lucide-react';

const AdminAccessControl = () => {
  const navigate = useNavigate();
  const [examMode, setExamMode] = useState(false);
  const [controls, setControls] = useState({
    eventBookings: true,
    libraryPasses: true,
    hostelLeaves: true,
    clubActivities: true,
  });

  const toggleControl = (key: keyof typeof controls) => {
    setControls(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExamMode = () => {
    const newMode = !examMode;
    setExamMode(newMode);
    if (newMode) {
      setControls({
        eventBookings: false,
        libraryPasses: true,
        hostelLeaves: false,
        clubActivities: false,
      });
    } else {
      setControls({
        eventBookings: true,
        libraryPasses: true,
        hostelLeaves: true,
        clubActivities: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Access Control</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Global Override */}
        <div className={`rounded-[24px] p-6 text-white shadow-lg transition-all duration-500 ${examMode ? 'bg-red-600 shadow-red-600/20' : 'bg-slate-800 shadow-slate-800/20'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <ShieldAlert className="w-6 h-6" /> Exam Mode Override
              </h2>
              <p className={`text-xs mt-1 ${examMode ? 'text-red-100' : 'text-slate-400'}`}>
                One-tap restriction for midterms/finals
              </p>
            </div>
            <button onClick={toggleExamMode} className="transition-transform active:scale-90">
              {examMode ? <ToggleRight className="w-10 h-10 text-white" /> : <ToggleLeft className="w-10 h-10 text-slate-500" />}
            </button>
          </div>
          {examMode && (
            <div className="bg-black/20 p-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-fade-in">
              <Info className="w-4 h-4 shrink-0" />
              Extracurriculars disabled. Library access enhanced.
            </div>
          )}
        </div>

        {/* Granular Controls */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Granular Control Panel</h3>
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-slate-100 divide-y divide-slate-50">
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Event Bookings</h4>
                  <p className="text-xs text-slate-500">Student ticket generation</p>
                </div>
              </div>
              <button onClick={() => toggleControl('eventBookings')} className="transition-transform active:scale-90">
                {controls.eventBookings ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Hostel Leaves</h4>
                  <p className="text-xs text-slate-500">Out-pass application system</p>
                </div>
              </div>
              <button onClick={() => toggleControl('hostelLeaves')} className="transition-transform active:scale-90">
                {controls.hostelLeaves ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAccessControl;
