import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  FileText, 
  AlertCircle, 
  X, 
  Activity, 
  CornerDownRight, 
  Send,
  Loader,
  HelpCircle,
  Sparkles
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
  can_bunk: number;
}

interface TrendPoint {
  date: string;
  percentage: number;
  subject?: string;
}

interface TrendData {
  overall: TrendPoint[];
  subjects: { [key: string]: TrendPoint[] };
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
  
  // Tabs: 'simulator' | 'trends' | 'history'
  const [activeTab, setActiveTab] = useState<'simulator' | 'trends' | 'history'>('simulator');
  
  // Data State
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [records, setRecords] = useState<AttendanceRecordType[]>([]);
  const [discrepancies, setDiscrepancies] = useState<AttendanceDiscrepancyType[]>([]);
  
  // Load State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simulation State
  const [globalSkipCount, setGlobalSkipCount] = useState(0);
  const [subjectSkipCounts, setSubjectSkipCounts] = useState<{ [key: string]: number }>({});
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  
  // Discrepancy Reporting Modal State
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordType | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SVG Chart Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; date: string } | null>(null);
  const [selectedTrendSubject, setSelectedTrendSubject] = useState<string>('overall');

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [bunkResponse, trendsResponse, recordsResponse, discrepanciesResponse] = await Promise.all([
        api.get('/attendance/bunk-o-meter'),
        api.get('/attendance/trends'),
        api.get('/attendance/my-records'),
        api.get('/attendance/discrepancies')
      ]);
      
      setSubjects(bunkResponse.data.subjects || []);
      setTrends(trendsResponse.data || null);
      setRecords(recordsResponse.data.records || []);
      setDiscrepancies(discrepanciesResponse.data.discrepancies || []);
    } catch (err: any) {
      console.error('Error fetching Bunk-O-Meter data:', err);
      setError(err.response?.data?.error || 'Failed to load attendance tracker data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show auto-dismiss toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Submit Discrepancy Dispute
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
      // Reload page data
      fetchData();
    } catch (err: any) {
      console.error('Failed to submit dispute:', err);
      alert(err.response?.data?.error || 'Failed to submit dispute request.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Overall calculations (actual vs simulated)
  const actualTotalClasses = subjects.reduce((sum, s) => sum + s.total_classes, 0);
  const actualPresentClasses = subjects.reduce((sum, s) => sum + s.present + s.late + s.on_duty, 0);
  const actualOverallPct = actualTotalClasses > 0 ? (actualPresentClasses / actualTotalClasses) * 100 : 0;

  // Calculate simulated overall
  const getSimulatedOverallStats = () => {
    let simulatedTotal = actualTotalClasses;
    let simulatedPresent = actualPresentClasses;

    subjects.forEach((sub) => {
      const skipForSub = subjectSkipCounts[sub.subject_code] || 0;
      const skipToAdd = skipForSub + globalSkipCount;
      simulatedTotal += skipToAdd;
    });

    const simulatedPct = simulatedTotal > 0 ? (simulatedPresent / simulatedTotal) * 100 : 0;
    
    // Overall consecutive classes needed to recover
    const consecTo75 = simulatedPct < 75 ? Math.max(0, Math.ceil((0.75 * simulatedTotal - simulatedPresent) / 0.25)) : 0;
    const consecTo85 = simulatedPct < 85 ? Math.max(0, Math.ceil((0.85 * simulatedTotal - simulatedPresent) / 0.15)) : 0;
    const safeBunks = simulatedPct >= 75 ? Math.max(0, Math.floor((simulatedPresent / 0.75) - simulatedTotal)) : 0;

    return {
      total: simulatedTotal,
      percentage: Math.round(simulatedPct * 10) / 10,
      isSafe: simulatedPct >= 75,
      consecTo75,
      consecTo85,
      safeBunks
    };
  };

  const simulatedOverall = getSimulatedOverallStats();

  // Subject-specific calculations
  const getSubjectSimulatedStats = (sub: SubjectSummary) => {
    const skipCount = (subjectSkipCounts[sub.subject_code] || 0) + globalSkipCount;
    const newTotal = sub.total_classes + skipCount;
    const presentCount = sub.present + sub.late + sub.on_duty;
    const newPct = newTotal > 0 ? (presentCount / newTotal) * 100 : 0;
    
    // Formula for safe bunks left
    const safeBunks = Math.max(0, Math.floor((presentCount / 0.75) - newTotal));
    const safeBunks85 = Math.max(0, Math.floor((presentCount / 0.85) - newTotal));

    // Mandatory consecutive future classes to attend to reach target
    const consecTo75 = newPct < 75 ? Math.max(0, Math.ceil((0.75 * newTotal - presentCount) / 0.25)) : 0;
    const consecTo85 = newPct < 85 ? Math.max(0, Math.ceil((0.85 * newTotal - presentCount) / 0.15)) : 0;
    
    return {
      percentage: Math.round(newPct * 10) / 10,
      safeBunks,
      safeBunks85,
      consecTo75,
      consecTo85,
      willDrop: newPct < 75,
      isDanger: sub.percentage < 75
    };
  };

  // SVG Line Chart Drawer
  const renderSVGChart = () => {
    if (!trends) return null;
    
    const points: TrendPoint[] = selectedTrendSubject === 'overall' 
      ? trends.overall 
      : (trends.subjects[selectedTrendSubject] || []);

    if (points.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-52 bg-white rounded-3xl border border-slate-100 p-6 text-center shadow-inner">
          <Activity className="w-8 h-8 text-slate-400 mb-2 animate-pulse" />
          <p className="text-xs font-bold text-slate-600">Insufficient Data</p>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Attend more class sessions to visualize your attendance trajectory.</p>
        </div>
      );
    }

    const width = 500;
    const height = 240;
    const padding = 35;

    const percentages = points.map(p => p.percentage);
    const minPct = Math.max(0, Math.min(...percentages) - 10); 
    const pctRange = 100 - minPct;

    const getX = (index: number) => {
      return padding + (index / (points.length - 1)) * (width - 2 * padding);
    };

    const getY = (pct: number) => {
      const clamped = Math.max(minPct, Math.min(100, pct));
      return height - padding - ((clamped - minPct) / pctRange) * (height - 2 * padding);
    };

    // Construct smooth cubic bezier spline path
    let dPath = "";
    points.forEach((p, idx) => {
      const x = getX(idx);
      const y = getY(p.percentage);
      if (idx === 0) {
        dPath += `M ${x} ${y}`;
      } else {
        const prevX = getX(idx - 1);
        const prevY = getY(points[idx - 1].percentage);
        const cpX1 = prevX + (x - prevX) / 2;
        const cpY1 = prevY;
        const cpX2 = prevX + (x - prevX) / 2;
        const cpY2 = y;
        dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
      }
    });

    const dFill = `${dPath} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;
    const y75 = getY(75);

    return (
      <div className="relative bg-white rounded-3xl p-5 border border-slate-100 shadow-md">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0080c7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0080c7" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0080c7" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[100, 85, 75, 50].map((val) => (
            <g key={val}>
              <line 
                x1={padding} 
                y1={getY(val)} 
                x2={width - padding} 
                y2={getY(val)} 
                stroke={val === 75 ? "#c9503d" : "#e2e8f0"} 
                strokeWidth={val === 75 ? 1.5 : 1}
                strokeDasharray={val === 75 ? "4 4" : "0"} 
              />
              <text 
                x={width - padding + 5} 
                y={getY(val) + 3} 
                fill={val === 75 ? "#c9503d" : "#64748b"} 
                fontSize="9" 
                fontWeight={val === 75 ? "bold" : "normal"}
              >
                {val}% {val === 75 && "Required"}
              </text>
            </g>
          ))}

          {/* Fill under the curve */}
          <path d={dFill} fill="url(#chartGrad)" />

          {/* Main trend line */}
          <path 
            d={dPath} 
            fill="none" 
            stroke="#0080c7" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            filter="url(#glow)"
          />

          {/* Active Points */}
          {points.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.percentage);
            const isLatest = idx === points.length - 1;
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={isLatest ? 6 : 4}
                fill={isLatest ? '#22346c' : '#ffffff'}
                stroke="#0080c7"
                strokeWidth={isLatest ? 3 : 2}
                className="cursor-pointer transition-all duration-200 hover:scale-125"
                onMouseEnter={() => {
                  setHoveredPoint({ x: cx, y: cy, val: p.percentage, date: p.date });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute bg-[#22346c] text-white rounded-xl px-3 py-1.5 text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full font-sans shadow-lg flex flex-col items-center border border-white/10"
            style={{ left: `${(hoveredPoint.x / width) * 100}%`, top: `${(hoveredPoint.y / height) * 100 - 6}%` }}
          >
            <span className="font-bold text-sm text-[#27bcd1]">{hoveredPoint.val}%</span>
            <span className="text-[9px] text-slate-300 font-semibold">{new Date(hoveredPoint.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
            <div className="w-2 h-2 bg-[#22346c] rotate-45 transform translate-y-1/2 -mt-1" />
          </div>
        )}

        <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 mt-3">
          <span>Start of Term</span>
          <span className="text-[#22346c]">Current Cumulative: {points[points.length - 1].percentage}%</span>
          <span>Latest Session</span>
        </div>
      </div>
    );
  };

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
              <Sparkles className="w-3.5 h-3.5 text-[#27bcd1]" />
              VTU Academic Compliance Check
            </p>
          </div>
        </div>

        {/* Overall Stats Card */}
        <div className="absolute left-6 right-6 bottom-0 translate-y-1/2 bg-white rounded-3xl p-5 shadow-xl border border-slate-100 text-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumulative Attendance</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-black ${simulatedOverall.isSafe ? 'text-[#22346c]' : 'text-[#a91f23]'}`}>
                  {simulatedOverall.percentage}%
                </span>
                {globalSkipCount > 0 || Object.keys(subjectSkipCounts).length > 0 ? (
                  <span className="text-xs text-[#0080c7] font-bold bg-[#0080c7]/10 px-2 py-0.5 rounded-md">Simulated</span>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">({actualPresentClasses}/{actualTotalClasses} classes)</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                simulatedOverall.isSafe ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-[#a91f23] border border-red-200 animate-pulse'
              }`}>
                {simulatedOverall.isSafe ? 'SAFE COMPLIANCE' : 'DEFICIT ALERT'}
              </span>
              {simulatedOverall.percentage !== Math.round(actualOverallPct * 10) / 10 && (
                <span className="text-[10px] text-slate-400 mt-1.5 font-bold">Actual: {Math.round(actualOverallPct * 10) / 10}%</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full mt-4 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                simulatedOverall.percentage >= 85 ? 'bg-emerald-500' : 
                simulatedOverall.percentage >= 75 ? 'bg-[#0080c7]' : 'bg-[#a91f23]'
              }`}
              style={{ width: `${Math.min(simulatedOverall.percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400">
            <span className="text-[#a91f23] tracking-wider">75% MANDATORY THRESHOLD</span>
            <span>100%</span>
          </div>

          {/* Danger Warning / Safe statistics text */}
          {!simulatedOverall.isSafe ? (
            <div className="mt-4 p-3 bg-red-50 rounded-2xl border border-red-100 text-xs text-[#a91f23] font-bold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#a91f23] shrink-0 mt-0.5" />
              <div>
                <p>Action Required: Attendance Deficit</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  You must attend at least <span className="text-[#a91f23] font-black">{simulatedOverall.consecTo75}</span> consecutive classes across subjects to restore a safe 75% average.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 font-bold flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p>Status Compliant</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  You have <span className="text-emerald-700 font-black">{simulatedOverall.safeBunks}</span> remaining safe bunks while remaining above the 75% limit.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-20 mt-2">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex justify-between gap-1">
          {(['simulator', 'trends', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-[#22346c] text-white shadow-md' 
                  : 'bg-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'history' ? 'Disputes Log' : tab === 'simulator' ? 'Bunk Calculator' : 'Attendance Trends'}
            </button>
          ))}
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

        {/* Tab 1: Simulator */}
        {activeTab === 'simulator' && (
          <div className="flex flex-col gap-5">
            {/* Global Simulator Slider */}
            <div className="bg-[#22346c] rounded-3xl p-5 text-white shadow-lg border border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#27bcd1]" />
                  <span className="text-sm font-black tracking-wide">Global Bunk Simulator</span>
                </div>
                <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-cyan-200">Interactive Slider</span>
              </div>
              <p className="text-slate-300 text-[10px] mb-4">Simulate skipping classes for ALL subjects concurrently</p>
              
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={globalSkipCount} 
                  onChange={(e) => setGlobalSkipCount(parseInt(e.target.value))}
                  className="flex-1 accent-[#27bcd1] h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-2xl font-black text-[#27bcd1] min-w-[36px] text-right">{globalSkipCount}</span>
              </div>
              
              <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1.5">
                <span>0 CLS</span>
                <span>10 CLS</span>
              </div>

              {globalSkipCount > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Currently showing simulated values:</span>
                  <button 
                    onClick={() => setGlobalSkipCount(0)}
                    className="text-[#27bcd1] font-black hover:text-white transition-all flex items-center gap-1.5 bg-[#27bcd1]/10 px-3 py-1 rounded-xl"
                  >
                    Clear Simulation <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Subject List */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Course Wise Check</h3>
              <div className="flex flex-col gap-3">
                {subjects.map((sub) => {
                  const stats = getSubjectSimulatedStats(sub);
                  const isExpanded = expandedSubject === sub.subject_code;

                  return (
                    <div 
                      key={sub.subject_code}
                      className={`rounded-3xl transition-all duration-300 border ${
                        stats.percentage < 75 
                          ? 'bg-red-50/50 border-red-200/50' 
                          : 'bg-white border-slate-100 shadow-sm'
                      }`}
                    >
                      {/* Accordion Trigger Header */}
                      <button 
                        onClick={() => setExpandedSubject(isExpanded ? null : sub.subject_code)}
                        className="w-full text-left p-5 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-800 leading-snug">{sub.subject_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">
                            {sub.subject_code} · {sub.present + sub.late + sub.on_duty}/{sub.total_classes} sessions
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-lg font-black ${
                              stats.percentage >= 85 ? 'text-emerald-600' :
                              stats.percentage >= 75 ? 'text-[#0080c7]' : 'text-[#a91f23]'
                            }`}>
                              {stats.percentage}%
                            </p>
                            {stats.percentage !== sub.percentage && (
                              <p className="text-[9px] text-slate-400 line-through font-semibold">Actual: {sub.percentage}%</p>
                            )}
                          </div>
                          {stats.percentage >= 75 ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-[#a91f23] shrink-0" />
                          )}
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 border-t border-dashed border-slate-100">
                          
                          {/* Local Subject Specific Slider */}
                          <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[11px] font-black text-slate-600">Simulate bunking for this class only</span>
                              <span className="text-sm font-black text-[#22346c]">+{subjectSkipCounts[sub.subject_code] || 0} classes</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="10" 
                              value={subjectSkipCounts[sub.subject_code] || 0} 
                              onChange={(e) => {
                                setSubjectSkipCounts({
                                  ...subjectSkipCounts,
                                  [sub.subject_code]: parseInt(e.target.value)
                                });
                              }}
                              className="w-full accent-[#0080c7] h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            
                            {/* Local simulations status */}
                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/50 text-[10px]">
                              <div>
                                <span className="text-slate-400 block font-bold uppercase tracking-wider">Safe Bunks Left (75%)</span>
                                <span className={`text-xs font-black ${stats.safeBunks === 0 ? 'text-[#a91f23]' : 'text-emerald-600'}`}>
                                  {stats.safeBunks} classes
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 block font-bold uppercase tracking-wider">Safe Bunks Left (85%)</span>
                                <span className="text-xs font-black text-[#0080c7]">
                                  {stats.safeBunks85} classes
                                </span>
                              </div>
                            </div>

                            {stats.percentage < 75 && (
                              <div className="mt-3 bg-red-50 text-[#a91f23] rounded-xl p-3 flex items-start gap-2 border border-red-100 text-[10px] font-bold">
                                <AlertTriangle className="w-4 h-4 text-[#a91f23] shrink-0 mt-0.5" />
                                <div>
                                  <p>CRITICAL BOUNDARY INTRUSION</p>
                                  <p className="text-slate-500 font-medium mt-0.5">
                                    You must attend <span className="text-[#a91f23] font-black">{stats.consecTo75}</span> consecutive future classes to recover a safe 75% level.
                                  </p>
                                </div>
                              </div>
                            )}

                            {subjectSkipCounts[sub.subject_code] > 0 && (
                              <div className="mt-3 text-right">
                                <button 
                                  onClick={() => {
                                    const updated = { ...subjectSkipCounts };
                                    delete updated[sub.subject_code];
                                    setSubjectSkipCounts(updated);
                                  }}
                                  className="text-[10px] text-[#0080c7] font-black hover:underline"
                                >
                                  Reset Course Simulation
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Historical records for disputes */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2 px-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance History & Flag Error</span>
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
                                        <p className="text-[9px] text-slate-400 mt-0.5 capitalize">Channel: {rec.method}</p>
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
                                            rec.discrepancy?.status === 'rejected' ? 'bg-red-50 border-red-200 text-[#a91f23]' : 'bg-amber-50 border-amber-200 text-amber-600 animate-pulse'
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

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Trends */}
        {activeTab === 'trends' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Curve</span>
              
              <select 
                value={selectedTrendSubject} 
                onChange={(e) => setSelectedTrendSubject(e.target.value)}
                className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs font-black text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0080c7] focus:border-[#0080c7]"
              >
                <option value="overall">Overall Average</option>
                {subjects.map((sub) => (
                  <option key={sub.subject_code} value={sub.subject_code}>
                    {sub.subject_code} - {sub.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {renderSVGChart()}

            {/* Regulatory Compliance Cards */}
            <div className="bg-slate-100 rounded-3xl p-5 mt-2 flex gap-4 border border-slate-200">
              <HelpCircle className="w-6 h-6 text-[#22346c] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-[#22346c] uppercase tracking-wider">VTU Attendance Guidelines</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                  A minimum of 75% attendance is required per subject. An automated notification check runs every 12 hours. 
                  Low attendance triggers direct emails to both you and your mentor, and is logged in the Academic Audit records.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Disputes Log */}
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
                  <p className="text-[10px] text-slate-400 mt-1">If a teacher incorrectly marked you absent, expand a course under Bunk Calculator and click 'Flag Error'.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {discrepancies.map((d) => (
                    <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                            d.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            d.status === 'rejected' ? 'bg-red-50 border-red-200 text-[#a91f23]' : 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
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

            {/* Alert Logs */}
            <div className="bg-[#22346c] text-cyan-100 rounded-3xl p-5 border border-slate-700">
              <h4 className="text-xs font-black text-white mb-2 uppercase tracking-widest">Compliance Audit Logs</h4>
              <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
                An internal cron script continuously parses database percentages. If overall metrics are below 75%, audit warning notices are compiled and dispatched. Ensure your dispute resolutions are finalized promptly.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Discrepancy Reporting Modal */}
      {discrepancyModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end justify-center sm:items-center">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-100 animate-slide-up text-slate-800">
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
                placeholder="Detail why this mark is incorrect (e.g. 'I was in class but marked absent by mistake, or I had an approved OD form for college technical events')."
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

      <BottomNav />
    </div>
  );
};

export default BunkOMeter;
