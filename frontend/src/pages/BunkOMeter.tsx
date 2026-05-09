import React, { useState } from 'react';
import { ChevronLeft, AlertTriangle, CheckCircle, MinusCircle, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

// Mock data — in production, fetched from /api/v1/attendance/bunk-o-meter
const MOCK_SUBJECTS = [
  { code: 'CS301', name: 'Data Structures', total: 40, present: 36, percentage: 90 },
  { code: 'CS302', name: 'Digital Logic', total: 38, present: 30, percentage: 78.9 },
  { code: 'MA301', name: 'Mathematics III', total: 42, present: 33, percentage: 78.6 },
  { code: 'CS303', name: 'Operating Systems', total: 36, present: 28, percentage: 77.8 },
  { code: 'CS301L', name: 'DS Lab', total: 20, present: 18, percentage: 90 },
  { code: 'HU301', name: 'English', total: 30, present: 21, percentage: 70 },
];

const BunkOMeter = () => {
  const navigate = useNavigate();
  const [skipCount, setSkipCount] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Bunk simulation
  const simulate = (total: number, present: number, skip: number) => {
    const newTotal = total + skip;
    const newPct = present / newTotal * 100;
    const safeBunks = Math.max(0, Math.floor(present / 0.75 - total));
    return { newPct: Math.round(newPct * 10) / 10, safeBunks };
  };

  const overallTotal = MOCK_SUBJECTS.reduce((s, sub) => s + sub.total, 0);
  const overallPresent = MOCK_SUBJECTS.reduce((s, sub) => s + sub.present, 0);
  const overallPct = Math.round(overallPresent / overallTotal * 1000) / 10;

  return (
    <div className="min-h-full bg-white flex flex-col font-sans animate-fade-in relative pb-24">

      {/* Header */}
      <div className="bg-amber-500 rounded-b-[40px] p-6 pt-12">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/academic')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Bunk-O-Meter</h1>
        </div>

        {/* Overall Stats */}
        <div className="bg-white rounded-[24px] p-5 mt-2 shadow-xl transform translate-y-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-600">Overall Attendance</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${overallPct >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {overallPct >= 75 ? 'SAFE' : 'DANGER'}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900">{overallPct}%</span>
            <span className="text-sm text-slate-500 mb-1">({overallPresent}/{overallTotal} classes)</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${overallPct >= 85 ? 'bg-emerald-500' : overallPct >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-red-500 font-bold">75% MIN</span>
            <span className="text-[10px] text-slate-400 font-bold">100%</span>
          </div>
        </div>
      </div>

      {/* Simulator */}
      <div className="px-6 pt-16">
        <div className="bg-slate-900 rounded-[24px] p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            <p className="text-sm font-bold text-white">Bunk Simulator</p>
          </div>
          <p className="text-xs text-slate-400 mb-4">What if I skip my next classes?</p>
          <div className="flex items-center gap-3">
            <span className="text-white text-sm font-medium">Skip</span>
            {[1, 2, 3, 5, 10].map(n => (
              <button key={n} onClick={() => setSkipCount(n)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${skipCount === n ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {n}
              </button>
            ))}
            <span className="text-white text-sm font-medium">classes</span>
          </div>
        </div>
      </div>

      {/* Subject-wise Cards */}
      <div className="px-6 flex-1 overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Subject Wise</h3>
        <div className="flex flex-col gap-3">
          {MOCK_SUBJECTS.map(sub => {
            const { newPct, safeBunks } = simulate(sub.total, sub.present, skipCount);
            const willDrop = newPct < 75;
            const isDanger = sub.percentage < 75;

            return (
              <button key={sub.code} onClick={() => setSelectedSubject(selectedSubject === sub.code ? null : sub.code)}
                className={`rounded-[20px] p-4 text-left transition-all ${isDanger ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-transparent'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{sub.name}</p>
                    <p className="text-xs text-slate-500">{sub.code} · {sub.present}/{sub.total}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${isDanger ? 'text-red-600' : sub.percentage >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {sub.percentage}%
                    </span>
                    {isDanger ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  </div>
                </div>

                {/* Simulation Result */}
                {selectedSubject === sub.code && (
                  <div className={`mt-3 pt-3 border-t ${willDrop ? 'border-red-200' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">After skipping {skipCount}</p>
                        <p className={`text-xl font-black ${willDrop ? 'text-red-600' : 'text-emerald-600'}`}>{newPct}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Safe bunks left</p>
                        <p className={`text-xl font-black ${safeBunks <= 2 ? 'text-red-600' : 'text-emerald-600'}`}>{safeBunks}</p>
                      </div>
                    </div>
                    {willDrop && (
                      <div className="mt-2 bg-red-100 rounded-xl p-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <p className="text-xs font-bold text-red-700">WARNING: Will drop below 75%!</p>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default BunkOMeter;
