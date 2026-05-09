import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Save, Search, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const MOCK_STUDENTS = Array.from({ length: 40 }, (_, i) => ({
  id: `stu_${i + 1}`,
  name: `Student ${i + 1}`,
  roll: `VTU26${(i + 1).toString().padStart(3, '0')}`,
  marks: null as number | null
}));

const FacultyMarksEntry = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [search, setSearch] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Use a ref to track the latest state for the auto-save interval
  const studentsRef = useRef(students);
  const dirtyRef = useRef(dirty);

  useEffect(() => {
    studentsRef.current = students;
    dirtyRef.current = dirty;
  }, [students, dirty]);

  // Dirty-Checking Auto-Save (Every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) {
        handleSave(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarksChange = (id: string, val: string) => {
    const num = val === '' ? null : Number(val);
    if (num !== null && (num < 0 || num > 50)) return; // Max 50
    
    setStudents(prev => prev.map(s => s.id === id ? { ...s, marks: num } : s));
    setDirty(true);
  };

  const handleSave = (isAuto = false) => {
    if (!dirtyRef.current && isAuto) return;
    
    setSaving(true);
    // Simulate API POST /api/v1/academic/internal-marks/bulk
    setTimeout(() => {
      setSaving(false);
      setDirty(false);
      setLastSaved(new Date());
    }, 800);
  };

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">

      {/* Header */}
      <div className="bg-emerald-600 p-6 pt-12 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Marks Entry</h1>
              <p className="text-xs text-emerald-100">CAT-1 • Data Structures</p>
            </div>
          </div>
          
          {/* Save Status Indicator */}
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="text-xs font-bold text-emerald-100 bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-emerald-100 border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </span>
            ) : dirty ? (
              <span className="text-xs font-bold text-amber-200 bg-black/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                Unsaved
              </span>
            ) : lastSaved && (
              <span className="text-xs font-bold text-emerald-100 bg-black/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/15 text-white placeholder:text-emerald-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white/25 transition-colors"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Table Header */}
          <div className="flex px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
            <div className="flex-[2]">Student</div>
            <div className="flex-1 text-center">Marks (50)</div>
          </div>
          
          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {filtered.map(s => (
              <div key={s.id} className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-[2]">
                  <p className="text-sm font-bold text-slate-800">{s.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{s.roll}</p>
                </div>
                <div className="flex-1 flex justify-center">
                  <input 
                    type="number"
                    value={s.marks === null ? '' : s.marks}
                    onChange={(e) => handleMarksChange(s.id, e.target.value)}
                    placeholder="--"
                    className={`w-16 h-10 text-center rounded-xl font-bold text-sm outline-none transition-all ${
                      s.marks !== null && dirty 
                        ? 'bg-amber-50 border-2 border-amber-400 text-amber-900 shadow-[0_0_10px_rgba(251,191,36,0.3)]' 
                        : s.marks !== null 
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                          : 'bg-slate-100 border border-transparent text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 ring-emerald-500/10'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Save Button (for immediate save) */}
      <div className="fixed bottom-[88px] right-6">
        <button 
          onClick={() => handleSave(false)}
          disabled={!dirty || saving}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            dirty 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Save className="w-6 h-6" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default FacultyMarksEntry;
