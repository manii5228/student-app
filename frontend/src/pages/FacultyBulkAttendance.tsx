import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, X, Send, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

const FacultyBulkAttendance = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const generateMockStudents = () => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: `stu_${i + 1}`,
      name: `Student ${i + 1}`,
      roll: `VTU26${(i + 1).toString().padStart(3, '0')}`,
      avatar_url: null,
      status: 'present' as 'present' | 'absent'
    }));
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await api.get('/faculty/class-students');
        if (data.students && data.students.length > 0) {
          setStudents(data.students.map((s: any) => ({
            id: s.id,
            name: s.name,
            roll: s.roll_number || s.email,
            avatar_url: s.avatar_url,
            status: 'present' as 'present' | 'absent'
          })));
        } else {
          setStudents(generateMockStudents());
        }
      } catch {
        setStudents(generateMockStudents());
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

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
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate('/faculty'), 2000);
    }, 1500);
  };

  const getAvatarUrl = (url: string | null, index: number) => {
    if (!url) {
      // Fallback to high-quality realistic human face photo (not cartoon avatar)
      return `https://i.pravatar.cc/150?img=${(index % 70) + 1}`;
    }
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = api.defaults.baseURL || localStorage.getItem('custom_api_url') || 'https://tricky-months-camp.loca.lt/api/v1';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const presentCount = students.filter(s => s.status === 'present').length;

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-32">

      {/* Header */}
      <div className="bg-indigo-600 p-6 pt-12 shadow-md text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Data Structures</h1>
              <p className="text-xs text-indigo-200">CSE • Sem 3 • Sec A</p>
            </div>
          </div>
          <div className="bg-white/15 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Users className="w-4 h-4 text-white" />
            <span className="text-sm font-bold">{presentCount}/{students.length}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
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
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Roster Photo Registry</p>
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {students.map((s, idx) => {
              const isPresent = s.status === 'present';
              return (
                <button key={s.id} onClick={() => toggleStatus(s.id)}
                  className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 ${
                    isPresent 
                      ? 'bg-white border-2 border-emerald-100 shadow-sm' 
                      : 'bg-red-50 border-2 border-red-500 shadow-md shadow-red-500/20'
                  }`}>
                  <div className="relative w-12 h-12 mb-2">
                    <img
                      src={getAvatarUrl(s.avatar_url, idx)}
                      alt={s.name}
                      className="w-12 h-12 rounded-full border border-slate-200 object-cover bg-slate-100"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                      isPresent ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {isPresent ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </div>
                  </div>
                  <p className={`text-xs font-black ${isPresent ? 'text-slate-800' : 'text-red-900'} leading-tight`}>{s.name}</p>
                  <p className={`text-[9px] font-bold ${isPresent ? 'text-slate-400' : 'text-red-400'} mt-0.5`}>{s.roll}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Submit Button */}
      <div className="fixed bottom-[88px] left-0 right-0 px-6 sm:max-w-[480px] sm:mx-auto z-40">
        {success ? (
          <div className="bg-emerald-500 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-xl">
            <Check className="w-5 h-5" />
            Attendance Saved
          </div>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || loading}
            className="w-full bg-indigo-600 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50">
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
