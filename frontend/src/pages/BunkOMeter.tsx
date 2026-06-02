import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  CheckCircle, 
  Clock, 
  FileText, 
  AlertCircle, 
  X, 
  CornerDownRight, 
  Send,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface SubjectSummary {
  student_id: string;
  subject_code: string;
  subject_name: string;
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  on_duty: number;
  leave: number;
  percentage: number;
}

interface AttendanceDiscrepancyType {
  id: string;
  record_id: string;
  student_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  resolution_remarks: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface AttendanceRecordType {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'on_duty' | 'leave';
  method: string;
  marked_at: string;
  remarks: string | null;
  discrepancy_reported: boolean;
  discrepancy: AttendanceDiscrepancyType | null;
  session?: {
    subject_code: string;
    subject_name: string;
    session_date: string;
    period_number: number;
  };
}

const BunkOMeter = () => {
  const navigate = useNavigate();
  
  // Tabs: 'courses' | 'history'
  const [activeTab, setActiveTab] = useState<'courses' | 'history'>('courses');
  
  // Data State
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecordType[]>([]);
  const [discrepancies, setDiscrepancies] = useState<AttendanceDiscrepancyType[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  
  // Load State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Discrepancy Reporting Modal State
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordType | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bunkometer Long Press States
  const [pressTimer, setPressTimer] = useState<any>(null);
  const [pressedItem, setPressedItem] = useState<{ type: 'global' | 'subject'; code?: string } | null>(null);
  const [pressProgress, setPressProgress] = useState(0); // 0 to 100
  const [longPressActive, setLongPressActive] = useState(false);
  const [bunkCalcResult, setBunkCalcResult] = useState<{
    title: string;
    percentage: number;
    safe: boolean;
    bunk_limit: number;
    consecutive_needed: number;
    present: number;
    total: number;
  } | null>(null);

  const startPress = (type: 'global' | 'subject', code?: string) => {
    cancelPress();
    setPressedItem({ type, code });

    const intervalTime = 50; // ms
    const increment = 100 / (5000 / intervalTime); // progress percentage per interval
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        clearInterval(interval);
        setPressProgress(100);
      } else {
        setPressProgress(progress);
      }
    }, intervalTime);

    const timer = setTimeout(() => {
      clearInterval(interval);
      setPressProgress(0);
      setPressedItem(null);
      if (navigator.vibrate) {
        navigator.vibrate([100]);
      }
      triggerBunkCalculation(type, code);
    }, 5000);

    (timer as any)._interval = interval;
    setPressTimer(timer);
  };

  const cancelPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      if (pressTimer._interval) {
        clearInterval(pressTimer._interval);
      }
      setPressTimer(null);
    }
    setPressedItem(null);
    setPressProgress(0);
  };

  const handleMouseDown = (type: 'global' | 'subject', code?: string) => {
    if ('ontouchstart' in window) return;
    startPress(type, code);
  };

  const triggerBunkCalculation = async (type: 'global' | 'subject', code?: string) => {
    setLongPressActive(true);
    try {
      const { data } = await api.get('/attendance/bunk-calculator');
      if (type === 'global') {
        setBunkCalcResult({
          title: 'Global Compliance Summary',
          percentage: data.global.percentage,
          safe: data.global.safe,
          bunk_limit: data.global.bunk_limit,
          consecutive_needed: data.global.consecutive_needed,
          present: data.global.present,
          total: data.global.total
        });
      } else {
        const sub = data.subjects.find((s: any) => s.subject_code === code);
        if (sub) {
          setBunkCalcResult({
            title: sub.subject_name,
            percentage: sub.percentage,
            safe: sub.safe,
            bunk_limit: sub.bunk_limit,
            consecutive_needed: sub.consecutive_needed,
            present: sub.present,
            total: sub.total
          });
        }
      }
    } catch (err) {
      console.error("Failed to load bunk calculations:", err);
      // Local fallback
      if (type === 'global') {
        const total = subjects.reduce((sum, s) => sum + s.total_classes, 0);
        const present = subjects.reduce((sum, s) => sum + s.present + s.late + s.on_duty, 0);
        const pct = total > 0 ? (present / total * 100) : 0;
        const safe = pct >= 75;
        const bunk_limit = safe ? Math.floor(present / 0.75) - total : 0;
        const consecutive = safe ? 0 : 3 * total - 4 * present;
        setBunkCalcResult({
          title: 'Global Compliance Summary (Local)',
          percentage: Math.round(pct * 10) / 10,
          safe,
          bunk_limit: Math.max(0, bunk_limit),
          consecutive_needed: Math.max(0, consecutive),
          present,
          total
        });
      } else {
        const s = subjects.find(sub => sub.subject_code === code);
        if (s) {
          const present = s.present + s.late + s.on_duty;
          const total = s.total_classes;
          const pct = s.percentage;
          const safe = pct >= 75;
          const bunk_limit = safe ? Math.floor(present / 0.75) - total : 0;
          const consecutive = safe ? 0 : 3 * total - 4 * present;
          setBunkCalcResult({
            title: s.subject_name,
            percentage: pct,
            safe,
            bunk_limit: Math.max(0, bunk_limit),
            consecutive_needed: Math.max(0, consecutive),
            present,
            total
          });
        }
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent, code: string) => {
    if (longPressActive) {
      e.preventDefault();
      e.stopPropagation();
      setLongPressActive(false);
      return;
    }
    setExpandedSubject(expandedSubject === code ? null : code);
  };

  // Easter Egg States
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [showSecretBunk, setShowSecretBunk] = useState(false);
  const [crashSimulated, setCrashSimulated] = useState(false);
  const [bunkSliderVal, setBunkSliderVal] = useState(0);

  // Today Filters
  const [filterTodayOnly, setFilterTodayOnly] = useState(true);
  const [todaySubjects, setTodaySubjects] = useState<string[]>([]);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [bunkResponse, recordsResponse, discrepanciesResponse] = await Promise.all([
        api.get('/attendance/bunk-o-meter'),
        api.get('/attendance/my-records'),
        api.get('/attendance/discrepancies')
      ]);
      
      setSubjects(bunkResponse.data.subjects || []);
      setRecords(recordsResponse.data.records || []);
      setDiscrepancies(discrepanciesResponse.data.discrepancies || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to load attendance tracker data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayTimetable = async () => {
    try {
      const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const res = await api.get('/timetable/my-timetable');
      if (res.data && res.data.grid) {
        const slotsForToday = res.data.grid[todayDayName] || [];
        const codes = slotsForToday
          .map((s: any) => s.subject_code)
          .filter((code: any) => !!code);
        setTodaySubjects(codes);
      }
    } catch (e) {
      console.warn("Failed to fetch today's timetable grid:", e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTodayTimetable();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleReportDiscrepancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !disputeReason.trim()) return;
    
    try {
      setSubmittingDispute(true);
      await api.post('/attendance/discrepancy', {
        record_id: selectedRecord.id,
        reason: disputeReason
      });
      
      triggerToast('Discrepancy request submitted successfully.');
      setDiscrepancyModalOpen(false);
      setDisputeReason('');
      setSelectedRecord(null);
      fetchData();
    } catch (err: any) {
      console.error('Failed to submit dispute:', err);
      alert(err.response?.data?.error || 'Failed to submit dispute request.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Overall calculations
  const actualTotalClasses = subjects.reduce((sum, s) => sum + s.total_classes, 0);
  const actualPresentClasses = subjects.reduce((sum, s) => sum + s.present + s.late + s.on_duty, 0);
  const actualOverallPct = actualTotalClasses > 0 ? (actualPresentClasses / actualTotalClasses) * 100 : 0;
  const roundedOverallPct = Math.round(actualOverallPct * 10) / 10;
  const isSafe = roundedOverallPct >= 75;

  if (crashSimulated) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-green-500 font-mono p-6 flex flex-col justify-center items-center select-none animate-pulse">
        <div className="max-w-md w-full text-left space-y-4">
          <h1 className="text-2xl font-black text-red-500 uppercase tracking-wider mb-6 animate-bounce">⚠️ SYSTEM OVERHEAT ⚠️</h1>
          <p className="text-xs text-slate-400">VTU-SECURE-SHELL v9.12.3-RELEASE</p>
          <p className="text-xs">CRITICAL EXCEPTION: <span className="text-red-400">SlackerLevelOverloadException</span></p>
          <p className="text-xs text-yellow-400">Bunks requested: 10/10 (100% MAXIMUM LEVEL)</p>
          
          <div className="bg-red-950/30 border border-red-500/50 rounded-xl p-4 text-[10px] text-red-400 leading-relaxed font-mono">
            [ALARM] Student has violated academic continuity guidelines. 
            Auto-generating SMS to Head of Department... Done.
            Auto-scheduling mandatory parent conference... Done.
            Simulating system destruction to prevent further slacking...
          </div>
          
          <div className="h-20 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-4 text-[10px] text-emerald-400 font-mono text-center leading-relaxed animate-pulse">
            ⚡ DEFICIT WARNING: EXTREME SLACKING LEVEL DETECTED. AUTO-REBOOT REQUIRED. PRESS BUTTON BELOW TO PREVENT DETENTION. ⚡
          </div>
          
          <button
            onClick={() => {
              setCrashSimulated(false);
              setBunkSliderVal(0);
              setShowSecretBunk(false);
              setSecretTapCount(0);
            }}
            className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/50 mt-6"
          >
            Reboot VTU App Core
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col justify-center items-center font-sans">
        <Loader className="w-10 h-10 text-[#0080c7] animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600 animate-pulse">Synchronizing academic data streams...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans relative pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#22346c] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle className="w-4 h-4 text-[#27bcd1] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VTU Header */}
      <div className="bg-gradient-to-br from-[#22346c] via-[#0080c7] to-[#27bcd1] rounded-b-[40px] px-6 pt-12 pb-24 text-white shadow-lg relative">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-wide">Attendance Tracker</h1>
            <p className="text-xs text-cyan-100 flex items-center gap-1">
              VTU Academic Compliance Check
            </p>
          </div>
        </div>

        {/* Overall Stats Card */}
        <div 
          onMouseDown={() => handleMouseDown('global')}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={() => startPress('global')}
          onTouchEnd={cancelPress}
          className="absolute left-6 right-6 bottom-0 translate-y-1/2 bg-white rounded-3xl p-5 shadow-xl border border-slate-100 text-slate-800 select-none overflow-hidden"
        >
          {pressedItem && pressedItem.type === 'global' && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center text-white z-20 pointer-events-none animate-fade-in">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="transparent" />
                  <circle cx="24" cy="24" r="20" stroke="#27bcd1" strokeWidth="4" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 20}
                          strokeDashoffset={2 * Math.PI * 20 * (1 - pressProgress / 100)} />
                </svg>
                <span className="absolute text-[10px] font-black">{Math.ceil(5 - (pressProgress / 20))}s</span>
              </div>
              <p className="text-[10px] font-bold mt-2 uppercase tracking-widest text-cyan-200">Analyzing Slacking Threshold...</p>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumulative Attendance</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-black ${isSafe ? 'text-[#22346c]' : 'text-[#a91f23]'}`}>
                  {roundedOverallPct}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">({actualPresentClasses}/{actualTotalClasses} classes)</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                isSafe ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-[#a91f23] border border-red-200'
              }`}>
                {isSafe ? 'COMPLIANT' : 'DEFICIT ALERT'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full mt-4 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                roundedOverallPct >= 85 ? 'bg-emerald-500' : 
                roundedOverallPct >= 75 ? 'bg-[#0080c7]' : 'bg-[#a91f23]'
              }`}
              style={{ width: `${Math.min(roundedOverallPct, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400">
            <span className="text-[#a91f23] tracking-wider">75% MANDATORY THRESHOLD</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-20 mt-2">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex justify-between gap-1">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black capitalize transition-all ${
              activeTab === 'courses' 
                ? 'bg-[#22346c] text-white shadow-md' 
                : 'bg-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Course Attendance
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSecretTapCount(prev => {
                const next = prev + 1;
                if (next === 5) {
                  setShowSecretBunk(true);
                  triggerToast("🔑 Easter Egg unlocked! Secret Bunk-O-Meter initialized.");
                  return 0;
                }
                return next;
              });
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black capitalize transition-all ${
              activeTab === 'history' 
                ? 'bg-[#22346c] text-white shadow-md' 
                : 'bg-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Disputes Log
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 px-6 mt-6 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 text-[#a91f23] text-xs font-semibold mb-4">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#a91f23]" />
            <p>{error}</p>
          </div>
        )}

        {/* Secret Bunk-O-Meter Easter Egg Card */}
        {showSecretBunk && activeTab === 'courses' && (
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-950 border border-purple-500 rounded-3xl p-5 shadow-2xl text-white mb-6 relative overflow-hidden animate-slide-up">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black tracking-widest text-purple-300 uppercase">⚠️ TOP SECRET: BUNK-O-METER v4.2</span>
              <button onClick={() => setShowSecretBunk(false)} className="text-purple-300 hover:text-white text-xs font-bold bg-white/10 px-2 py-0.5 rounded">Close</button>
            </div>
            <p className="text-[10px] text-purple-200 mb-4 leading-relaxed font-semibold">
              Simulate your slacking threshold. Slide bunks up to 10 days to check cumulative impact. Warning: Slack level 10 triggers secure firewall overrides.
            </p>
            <div className="mb-4">
              <div className="flex justify-between text-xs font-black mb-1.5">
                <span>Target Bunk Limit:</span>
                <span className="text-purple-300 font-mono">{bunkSliderVal} / 10 days</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={bunkSliderVal} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setBunkSliderVal(val);
                  if (val === 10) {
                    setTimeout(() => {
                      setCrashSimulated(true);
                    }, 500);
                  }
                }}
                className="w-full accent-purple-500 cursor-pointer h-2 bg-purple-950 rounded-lg appearance-none"
              />
            </div>
            <div className="bg-purple-950/60 rounded-xl p-3 border border-purple-800 text-[10px] flex justify-between font-mono">
              <span>Projected Attendance:</span>
              <span className={bunkSliderVal > 5 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {Math.max(roundedOverallPct - (bunkSliderVal * 8.5), 0).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Tab 1: Courses */}
        {activeTab === 'courses' && (
          <div className="flex flex-col gap-3">
            {/* Filter Toggle */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-800">Today's Schedule Only</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Filter subjects to show only current day's classes</p>
              </div>
              <button 
                onClick={() => setFilterTodayOnly(!filterTodayOnly)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${filterTodayOnly ? 'bg-[#0080c7]' : 'bg-slate-200'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute ${filterTodayOnly ? 'translate-x-6' : 'translate-x-1'}`}></span>
              </button>
            </div>

            {(filterTodayOnly 
              ? subjects.filter(s => todaySubjects.includes(s.subject_code)) 
              : subjects
            ).length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 text-slate-400">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No classes found</p>
                {filterTodayOnly && <p className="text-[10px] text-slate-400 mt-1">You are free from active lectures today according to the schedule.</p>}
              </div>
            ) : (filterTodayOnly 
              ? subjects.filter(s => todaySubjects.includes(s.subject_code)) 
              : subjects
            ).map((sub) => {
              const isExpanded = expandedSubject === sub.subject_code;
              const subPct = Math.round(sub.percentage * 10) / 10;
              const isSubSafe = subPct >= 75;

              return (
                <div 
                  key={sub.subject_code}
                  className={`rounded-3xl transition-all duration-300 border relative ${
                    !isSubSafe 
                      ? 'bg-red-50/50 border-red-200/50' 
                      : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  {pressedItem && pressedItem.type === 'subject' && pressedItem.code === sub.subject_code && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] rounded-3xl flex items-center justify-between px-6 text-white z-20 pointer-events-none animate-fade-in">
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200">Locking Bunkometer Matrix...</span>
                      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                        <svg className="w-10 h-10 transform -rotate-90">
                          <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="transparent" />
                          <circle cx="20" cy="20" r="16" stroke="#27bcd1" strokeWidth="3" fill="transparent" 
                                  strokeDasharray={2 * Math.PI * 16}
                                  strokeDashoffset={2 * Math.PI * 16 * (1 - pressProgress / 100)} />
                        </svg>
                        <span className="absolute text-[9px] font-black">{Math.ceil(5 - (pressProgress / 20))}s</span>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={(e) => handleCardClick(e, sub.subject_code)}
                    onMouseDown={() => handleMouseDown('subject', sub.subject_code)}
                    onMouseUp={cancelPress}
                    onMouseLeave={cancelPress}
                    onTouchStart={() => startPress('subject', sub.subject_code)}
                    onTouchEnd={cancelPress}
                    className="w-full text-left p-5 flex items-center justify-between select-none"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 leading-snug">{sub.subject_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {sub.subject_code} · {sub.present + sub.late + sub.on_duty}/{sub.total_classes} sessions
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-black ${
                        subPct >= 85 ? 'text-emerald-600' :
                        subPct >= 75 ? 'text-[#0080c7]' : 'text-[#a91f23]'
                      }`}>
                        {subPct}%
                      </span>
                      {isSubSafe ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-[#a91f23] shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Body: Log of classes & disputes */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-dashed border-slate-100">
                      <div className="flex items-center gap-1.5 mb-2 px-1 pt-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance Logs & Raising Disputes</span>
                      </div>

                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                        {records.filter(r => r.session?.subject_code === sub.subject_code).length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic px-2">No attendance logs captured for this course.</p>
                        ) : (
                          records
                            .filter(r => r.session?.subject_code === sub.subject_code)
                            .map((rec) => (
                              <div key={rec.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs shadow-sm">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-800">
                                      Period {rec.session?.period_number}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      {rec.session?.session_date ? new Date(rec.session.session_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : ''}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 mt-0.5 capitalize">Method: {rec.method}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                                    rec.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    rec.status === 'absent' ? 'bg-red-50 text-[#a91f23] border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {rec.status}
                                  </span>

                                  {rec.discrepancy_reported ? (
                                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                                      rec.discrepancy?.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                      rec.discrepancy?.status === 'rejected' ? 'bg-red-50 border-red-200 text-[#a91f23]' : 'bg-amber-50 border-amber-200 text-amber-600'
                                    }`}>
                                      Disputed: {rec.discrepancy?.status || 'pending'}
                                    </span>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setSelectedRecord(rec);
                                        setDiscrepancyModalOpen(true);
                                      }}
                                      className="text-[9px] font-bold text-[#0080c7] hover:text-[#22346c] px-2 py-1 bg-cyan-50 rounded-lg border border-cyan-100"
                                    >
                                      Flag Error
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Disputes Log */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discrepancy History</span>
                <span className="text-[10px] bg-cyan-50 text-[#0080c7] font-black px-2.5 py-0.5 rounded-full border border-cyan-100">
                  {discrepancies.length} disputes raised
                </span>
              </div>

              {discrepancies.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No Disputes Logged</p>
                  <p className="text-[10px] text-slate-400 mt-1">If a teacher incorrectly marked you absent, expand a course under Course Attendance and click 'Flag Error'.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {discrepancies.map((d) => (
                    <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                            d.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            d.status === 'rejected' ? 'bg-red-50 border-red-200 text-[#a91f23]' : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {d.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold ml-2">
                            {new Date(d.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 mt-2">
                        <div className="flex items-start gap-1 font-bold text-slate-800">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>Dispute Reason: {d.reason}</span>
                        </div>
                      </div>

                      {/* Display associated session info */}
                      {(d as any).session && (
                        <div className="mt-3 bg-slate-50 rounded-xl p-3 text-[10px] text-slate-500 border border-slate-100">
                          <p className="font-bold text-slate-600">{(d as any).session.subject_name} ({(d as any).session.subject_code})</p>
                          <p className="mt-0.5 font-medium">Session: {new Date((d as any).session.session_date).toLocaleDateString()} · Period {(d as any).session.period_number}</p>
                          <p className="mt-0.5 font-bold text-[#a91f23]">Marked: {(d as any).current_status?.toUpperCase()}</p>
                        </div>
                      )}

                      {/* Resolution details */}
                      {d.resolution_remarks && (
                        <div className="mt-3 pt-3 border-t border-dashed border-slate-100 text-[10px] text-slate-600">
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 bg-[#0080c7] rounded-full" />
                            Faculty Correction Remarks:
                          </p>
                          <p className="mt-1 italic bg-slate-50 rounded-xl p-2.5 font-medium text-slate-600">"{d.resolution_remarks}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Discrepancy Reporting Modal */}
      {discrepancyModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 animate-slide-up text-slate-800 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto pb-12 mb-2 sm:mb-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-900">Report Attendance Discrepancy</h3>
              <button 
                onClick={() => {
                  setDiscrepancyModalOpen(false);
                  setSelectedRecord(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 text-xs">
              <p className="font-bold text-[#22346c]">{selectedRecord.session?.subject_name}</p>
              <p className="text-slate-500 mt-1">Code: {selectedRecord.session?.subject_code} · Period: {selectedRecord.session?.period_number}</p>
              <p className="text-slate-500 mt-0.5">Date: {selectedRecord.session?.session_date ? new Date(selectedRecord.session.session_date).toLocaleDateString() : ''}</p>
              <p className="mt-2 text-[#a91f23] font-bold uppercase">Marked status: {selectedRecord.status}</p>
            </div>

            <form onSubmit={handleReportDiscrepancy}>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Provide Explanation / Evidence
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Detail why this mark is incorrect (e.g. 'I was in class but marked absent by mistake')."
                required
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0080c7] focus:border-[#0080c7] placeholder-slate-400"
              />

              <button
                type="submit"
                disabled={submittingDispute || !disputeReason.trim()}
                className="w-full bg-[#0080c7] hover:bg-[#22346c] disabled:bg-[#0080c7]/40 transition-all text-white font-bold text-xs py-3.5 rounded-2xl mt-5 shadow-lg flex items-center justify-center gap-2"
              >
                {submittingDispute ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Dispute Request</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bunkometer Calculation Modal */}
      {bunkCalcResult && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 animate-slide-up text-slate-800 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600"></div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Bunkometer Calculation</span>
              <button 
                onClick={() => {
                  setBunkCalcResult(null);
                  setLongPressActive(false);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <h3 className="text-base font-black text-[#22346c] mb-1 leading-snug">{bunkCalcResult.title}</h3>
            <p className="text-xs text-slate-400 font-bold mb-6">Academic Compliance Audit</p>

            {/* Progress display */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                  <circle cx="56" cy="56" r="48" stroke={bunkCalcResult.safe ? "#10b981" : "#ef4444"} strokeWidth="8" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - bunkCalcResult.percentage / 100)} 
                          strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800">{bunkCalcResult.percentage}%</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Attendance</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-2">({bunkCalcResult.present} / {bunkCalcResult.total} total sessions)</p>
            </div>

            {/* Result box */}
            <div className={`p-5 rounded-2xl border mb-6 text-left ${
              bunkCalcResult.safe 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {bunkCalcResult.safe ? (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Status: COMPLIANT</p>
                  <p className="text-xs font-black leading-relaxed">
                    You can safely bunk <span className="text-base font-black underline decoration-2">{bunkCalcResult.bunk_limit}</span> more class{bunkCalcResult.bunk_limit === 1 ? '' : 'es'}.
                  </p>
                  <p className="text-[9px] text-emerald-500 font-bold mt-2 leading-relaxed">
                    Your overall attendance will remain at or above the 75% threshold.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Status: NON-COMPLIANT</p>
                  <p className="text-xs font-black leading-relaxed">
                    You cannot bunk! You must attend <span className="text-base font-black underline decoration-2">{bunkCalcResult.consecutive_needed}</span> consecutive class{bunkCalcResult.consecutive_needed === 1 ? '' : 'es'}.
                  </p>
                  <p className="text-[9px] text-red-500 font-bold mt-2 leading-relaxed">
                    Required to bring your percentage back to the safe 75% threshold.
                  </p>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setBunkCalcResult(null);
                setLongPressActive(false);
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 transition-colors text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md font-mono"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default BunkOMeter;
