import React, { useState } from 'react';
import { ChevronLeft, Check, X, Send, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

// Mock students
const MOCK_STUDENTS = Array.from({ length: 60 }, (_, i) => ({
  id: `stu_${i + 1}`,
  name: `Student ${i + 1}`,
  roll: `VTU26${(i + 1).toString().padStart(3, '0')}`,
  status: 'present' as 'present' | 'absent'
}));

const FacultyBulkAttendance = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } : s
    ));
  };

  const markAll = (status: 'present' | 'absent') => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    // Simulate API call: POST /api/v1/attendance/session/:id/bulk
    const payload = {
      records: students.map(s => ({ student_id: s.id, status: s.status }))
    };
    
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate('/faculty'), 2000);
    }, 1500);
  };

  const presentCount = students.filter(s => s.status === 'present').length;

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-32">

      {/* Header */}
      <div className="bg-indigo-600 p-6 pt-12 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Data Structures</h1>
              <p className="text-xs text-indigo-200">CSE • Sem 3 • Sec A</p>
            </div>
          </div>
          <div className="bg-white/15 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Users className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">{presentCount}/60</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <button onClick={() => markAll('present')} className="flex-1 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 py-2 rounded-xl text-sm font-bold transition-colors">
            All Present
          </button>
          <button onClick={() => markAll('absent')} className="flex-1 bg-red-500/20 text-red-100 hover:bg-red-500/30 py-2 rounded-xl text-sm font-bold transition-colors">
            All Absent
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Tap to mark absent</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {students.map(s => {
            const isPresent = s.status === 'present';
            return (
              <button key={s.id} onClick={() => toggleStatus(s.id)}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 ${
                  isPresent 
                    ? 'bg-white border-2 border-emerald-100 shadow-sm' 
                    : 'bg-red-50 border-2 border-red-500 shadow-md shadow-red-500/20'
                }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isPresent ? 'bg-emerald-100' : 'bg-red-500 text-white'
                }`}>
                  {isPresent ? <Check className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5" />}
                </div>
                <p className={`text-sm font-bold ${isPresent ? 'text-slate-800' : 'text-red-900'}`}>{s.name}</p>
                <p className={`text-[10px] font-bold ${isPresent ? 'text-slate-400' : 'text-red-400'}`}>{s.roll}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Submit Button */}
      <div className="fixed bottom-[88px] left-0 right-0 px-6 sm:max-w-[480px] sm:mx-auto">
        {success ? (
          <div className="bg-emerald-500 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-xl">
            <Check className="w-5 h-5" />
            Attendance Saved
          </div>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-indigo-600 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50">
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Attendance
              </>
            )}
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default FacultyBulkAttendance;
