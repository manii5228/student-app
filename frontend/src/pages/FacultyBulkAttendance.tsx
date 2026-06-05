import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, X, Send, Users, Calendar, Clock, BookOpen, List, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Student {
  id: string;
  name: string;
  roll: string;
  avatar_url: string | null;
  status: 'present' | 'absent';
}

interface Session {
  id: string;
  subject_code: string;
  subject_name: string;
  department: string;
  semester: number;
  section: string;
  period_number: number;
  session_date: string;
  total_present: number;
  total_absent: number;
}

const DEPARTMENTS = ['CSE', 'ECE', 'Mech', 'Biomed'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = ['A', 'B', 'C'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const CSE_SUBJECTS = [
  { code: 'CS301', name: 'Database Management Systems' },
  { code: 'CS302', name: 'Operating Systems' },
  { code: 'CS303', name: 'Design & Analysis of Algorithms' },
  { code: 'HU301', name: 'Professional Ethics' },
  { code: 'CS301L', name: 'DBMS Lab' }
];

const FacultyBulkAttendance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'mark' | 'history'>('mark');
  
  // Step 1: Session Details Form States
  const [step, setStep] = useState<1 | 2>(1);
  const [department, setDepartment] = useState('CSE');
  const [semester, setSemester] = useState(4);
  const [section, setSection] = useState('A');
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [period, setPeriod] = useState(1);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Subjects state (dynamic)
  const [subjectsList, setSubjectsList] = useState(CSE_SUBJECTS);
  const [detectedSlot, setDetectedSlot] = useState<any>(null);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [checkingSchedule, setCheckingSchedule] = useState(true);

  // Step 2: Student list & submission states
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History Tab States
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch past sessions when switching to History
  useEffect(() => {
    if (activeTab === 'history') {
      const fetchHistory = async () => {
        try {
          setLoadingHistory(true);
          const { data } = await api.get('/attendance/my-sessions');
          if (data && data.sessions) {
            setPastSessions(data.sessions);
          }
        } catch (err) {
          console.error("Failed to load session history", err);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab]);

  // Timetable and auto-detection on mount
  useEffect(() => {
    const loadTimetableAndDetect = async () => {
      try {
        setCheckingSchedule(true);
        const { data } = await api.get('/timetable/faculty');
        if (data && data.grid) {
          const slots: any[] = [];
          Object.keys(data.grid).forEach(day => {
            if (Array.isArray(data.grid[day])) {
              slots.push(...data.grid[day]);
            }
          });
          
          // Build updated subject list
          setSubjectsList(prev => {
            const updated = [...prev];
            slots.forEach(slot => {
              const exists = updated.some(sub => sub.code === slot.subject_code);
              if (!exists && slot.subject_code) {
                updated.push({ code: slot.subject_code, name: slot.subject_name || 'Subject' });
              }
            });
            return updated;
          });
          
          // Detect current class
          const now = new Date();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDay = dayNames[now.getDay()];
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          // Filter slots for today
          const today = slots.filter(s => s.day.toLowerCase() === currentDay);
          setTodaySlots(today);
          
          let matched: any = null;
          today.forEach(slot => {
            if (!slot.start_time || !slot.end_time) return;
            const [sh, sm] = slot.start_time.split(':').map(Number);
            const [eh, em] = slot.end_time.split(':').map(Number);
            const startMin = sh * 60 + sm;
            const endMin = eh * 60 + em;
            
            if (currentMinutes >= startMin - 15 && currentMinutes <= endMin + 15) {
              matched = slot;
            }
          });

          if (matched) {
            setDetectedSlot(matched);
            
            // Auto-fill form values
            setDepartment(matched.department || 'CSE');
            setSemester(matched.semester || 4);
            setSection(matched.section || 'A');
            setPeriod(matched.period_number || 1);
            
            const existingIdx = CSE_SUBJECTS.findIndex(sub => sub.code === matched.subject_code);
            if (existingIdx !== -1) {
              setSubjectIndex(existingIdx);
            } else {
              setSubjectsList(prev => {
                const updated = [...prev];
                const exists = updated.some(sub => sub.code === matched.subject_code);
                if (!exists) {
                  updated.push({ code: matched.subject_code, name: matched.subject_name });
                }
                const idx = updated.findIndex(sub => sub.code === matched.subject_code);
                setSubjectIndex(idx);
                return updated;
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load timetable for auto-detection", err);
      } finally {
        setCheckingSchedule(false);
      }
    };

    loadTimetableAndDetect();
  }, []);

  const handleSelectTodaySlot = (slot: any) => {
    setDepartment(slot.department || 'CSE');
    setSemester(slot.semester || 4);
    setSection(slot.section || 'A');
    setPeriod(slot.period_number || 1);
    
    const idx = subjectsList.findIndex(sub => sub.code === slot.subject_code);
    if (idx !== -1) {
      setSubjectIndex(idx);
    } else {
      setSubjectsList(prev => {
        const updated = [...prev];
        const exists = updated.some(sub => sub.code === slot.subject_code);
        if (!exists) {
          updated.push({ code: slot.subject_code, name: slot.subject_name });
        }
        const findIdx = updated.findIndex(sub => sub.code === slot.subject_code);
        setSubjectIndex(findIdx);
        return updated;
      });
    }
  };

  const handleFetchStudents = async (
    targetDept = department,
    targetSem = semester,
    targetSec = section
  ) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const { data } = await api.get('/attendance/students', {
        params: {
          department: targetDept,
          semester: targetSem,
          section: targetSec
        }
      });

      if (data.students && data.students.length > 0) {
        setStudents(data.students.map((s: any) => ({
          id: s.id,
          name: s.name,
          roll: s.roll_number || s.email,
          avatar_url: s.avatar_url || null,
          status: 'present' as 'present' | 'absent'
        })));
        setStep(2);
      } else {
        setErrorMsg(`No students found enrolled in ${targetDept} Sem ${targetSem} Section ${targetSec}.`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to retrieve students. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMark = (slot: any) => {
    handleSelectTodaySlot(slot);
    handleFetchStudents(slot.department, slot.semester, slot.section || 'A');
  };

  const toggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } : s
    ));
  };

  const markAll = (status: 'present' | 'absent') => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      
      const selectedSubject = subjectsList[subjectIndex];
      
      // 1. Create the attendance session
      const sessionRes = await api.post('/attendance/session', {
        subject_code: selectedSubject.code,
        subject_name: selectedSubject.name,
        department,
        semester,
        section,
        period_number: period,
        session_date: sessionDate
      });

      const sessionId = sessionRes.data.session.id;

      // 2. Submit the bulk attendance records
      const records = students.map(s => ({
        student_id: s.id,
        status: s.status
      }));

      await api.post(`/attendance/session/${sessionId}/bulk`, {
        records
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setActiveTab('history'); // switch to history to view it
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.error || "Failed to submit attendance session.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAvatarUrl = (url: string | null, index: number) => {
    if (!url) {
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
      
      {/* Header with Tab switcher */}
      <div className="bg-indigo-900 rounded-b-[40px] p-6 pt-12 shadow-lg text-white">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Attendance Registry</h1>
            <p className="text-xs text-indigo-200">Manage class rosters & sessions</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white/10 p-1 rounded-2xl">
          <button 
            onClick={() => { setActiveTab('mark'); setStep(1); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'mark' ? 'bg-white text-indigo-900 shadow-md' : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <List className="w-4 h-4" />
            Mark Roster
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-indigo-900 shadow-md' : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            View History
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mx-6 mt-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold shadow-sm">
          <X className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── MARK ATTENDANCE TAB ── */}
      {activeTab === 'mark' && (
        <div className="flex-1 p-6 flex flex-col justify-start">
          
          {/* STEP 1: FORM SETUP */}
          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              
              {/* Timetable Auto-Detection Header */}
              {checkingSchedule ? (
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-xs font-semibold text-slate-500">Checking timetable schedule...</span>
                </div>
              ) : detectedSlot ? (
                <div className="bg-gradient-to-br from-indigo-905 from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden border border-indigo-800/40">
                  <div className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-indigo-300" /> Class Detected
                    </div>
                    <span className="text-[10px] font-black text-indigo-250 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-xl">
                      {detectedSlot.start_time} - {detectedSlot.end_time}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">
                      {detectedSlot.department} • Sem {detectedSlot.semester} • Section {detectedSlot.section || 'A'} • Period {detectedSlot.period_number}
                    </span>
                    <h3 className="text-sm font-black text-white leading-tight mt-1">
                      {detectedSlot.subject_name}
                    </h3>
                    <p className="text-[10px] text-indigo-200/80 font-bold uppercase tracking-wider mt-0.5">{detectedSlot.subject_code}</p>
                  </div>
                  
                  <div className="mt-5 flex gap-2">
                    <button 
                      onClick={() => handleQuickMark(detectedSlot)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-550 hover:bg-indigo-500 text-white py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                      <Check className="w-4 h-4" /> Quick Mark Attendance
                    </button>
                  </div>
                </div>
              ) : todaySlots.length > 0 ? (
                <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-500" /> Today's Scheduled Classes
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {todaySlots.length} classes
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Select a class scheduled for today to instantly pre-fill all settings:
                  </p>
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {todaySlots.map((slot) => {
                      const isSelected = department === slot.department && 
                                         semester === slot.semester && 
                                         section === (slot.section || 'A') && 
                                         period === slot.period_number;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => handleSelectTodaySlot(slot)}
                          className={`p-3.5 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.98] border text-xs font-bold ${
                            isSelected 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' 
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex-1 pr-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-indigo-650 text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                                {slot.department} Sem {slot.semester} ({slot.section || 'A'})
                              </span>
                              <span className="text-[9px] font-black text-slate-400">
                                Period {slot.period_number}
                              </span>
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-800 mt-1 leading-tight">{slot.subject_name}</h4>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 shrink-0 bg-white border border-slate-100 px-2 py-0.5 rounded-lg shadow-sm">
                            {slot.start_time}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-205 border-slate-200 rounded-[28px] p-5 text-center shadow-sm">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-black text-slate-700">No scheduled class detected right now</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Please fill details manually below.</p>
                </div>
              )}
              
              {/* Session Setup */}
              <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 space-y-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" /> Manual Session Setup
                </h2>
                
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Subject</label>
                  <select 
                    value={subjectIndex}
                    onChange={(e) => setSubjectIndex(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold focus:outline-none"
                  >
                    {subjectsList.map((sub, idx) => (
                      <option key={sub.code} value={idx}>{sub.code} - {sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Dept</label>
                    <select 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold focus:outline-none"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Sem</label>
                    <select 
                      value={semester}
                      onChange={(e) => setSemester(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold focus:outline-none"
                    >
                      {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Sec</label>
                    <select 
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold focus:outline-none"
                    >
                      {SECTIONS.map(secOpt => <option key={secOpt} value={secOpt}>Sec {secOpt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Date</label>
                    <input 
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Period</label>
                    <select 
                      value={period}
                      onChange={(e) => setPeriod(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold focus:outline-none"
                    >
                      {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => handleFetchStudents()}
                  disabled={loading}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Retrieve Student Roster'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MARK STUDENT ROSTER */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-up">
              {/* Class Header details */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    {subjectsList[subjectIndex]?.code || ''} • Period {period}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1">
                    {subjectsList[subjectIndex]?.name || ''}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{department} Sem {semester} Section {section} • {sessionDate}</p>
                </div>
                <div className="bg-indigo-50 px-3.5 py-2 rounded-2xl text-center shrink-0 border border-indigo-100">
                  <p className="text-base font-black text-indigo-900">{presentCount}/{students.length}</p>
                  <p className="text-[8px] font-bold text-indigo-500 uppercase">Present</p>
                </div>
              </div>

              {/* Roster Controls */}
              <div className="flex gap-2">
                <button onClick={() => markAll('present')} className="flex-1 bg-emerald-50 border border-emerald-100 text-emerald-600 py-2.5 rounded-2xl text-xs font-bold transition-all hover:bg-emerald-100 active:scale-95">
                  All Present
                </button>
                <button onClick={() => markAll('absent')} className="flex-1 bg-rose-50 border border-rose-100 text-rose-600 py-2.5 rounded-2xl text-xs font-bold transition-all hover:bg-rose-100 active:scale-95">
                  All Absent
                </button>
              </div>

              {/* Student Cards Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {students.map((s, idx) => {
                  const isPresent = s.status === 'present';
                  return (
                    <button key={s.id} onClick={() => toggleStatus(s.id)}
                      className={`p-4 rounded-[22px] flex flex-col items-center justify-center text-center transition-all active:scale-95 border ${
                        isPresent 
                          ? 'bg-white border-slate-100 shadow-sm' 
                          : 'bg-rose-55 bg-rose-50/70 border-rose-300 shadow-md shadow-rose-500/10'
                      }`}>
                      <div className="relative w-12 h-12 mb-2">
                        <img
                          src={getAvatarUrl(s.avatar_url, idx)}
                          alt={s.name}
                          className="w-12 h-12 rounded-full border border-slate-200 object-cover bg-slate-100"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                          isPresent ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {isPresent ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </div>
                      </div>
                      <p className={`text-xs font-bold leading-tight ${isPresent ? 'text-slate-800' : 'text-rose-950 font-black'}`}>{s.name}</p>
                      <p className={`text-[9px] font-bold ${isPresent ? 'text-slate-400' : 'text-rose-455 text-rose-500'} mt-0.5`}>{s.roll}</p>
                    </button>
                  );
                })}
              </div>

              {/* Float Submitter */}
              <div className="fixed bottom-[88px] left-0 right-0 px-6 sm:max-w-[480px] sm:mx-auto z-40">
                {success ? (
                  <div className="bg-emerald-500 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-xl">
                    <Check className="w-5 h-5" />
                    Attendance Session Saved
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setStep(1)} 
                      disabled={submitting}
                      className="bg-slate-105 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl py-4 px-6 text-xs font-bold active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleSubmitAttendance} 
                      disabled={submitting}
                      className="flex-1 bg-indigo-600 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Session
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ATTENDANCE HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Past Attendance Sessions</h2>
          
          {loadingHistory ? (
            <div className="flex flex-col justify-center items-center py-16">
              <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
              <p className="text-xs font-bold text-slate-400 mt-2">Loading historical records...</p>
            </div>
          ) : pastSessions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto text-slate-350 mb-2 animate-pulse" />
              <p className="text-sm font-bold">No sessions created yet</p>
              <p className="text-xs text-slate-400 mt-1">Submit attendance in the first tab to view records here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pastSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-indigo-600 tracking-widest uppercase">
                      {session.subject_code} • Period {session.period_number}
                    </span>
                    <h3 className="text-xs font-black text-slate-800 mt-0.5 leading-tight">
                      {session.subject_name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Class: {session.department} Sem {session.semester} ({session.section})
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 text-[10px] font-bold">
                      <div className="flex items-center gap-1 text-slate-405">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{session.session_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-emerald-600">{session.total_present} Present</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-500">{session.total_absent} Absent</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default FacultyBulkAttendance;
