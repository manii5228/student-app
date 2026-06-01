import React, { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen, TrendingUp, AlertTriangle, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Mark {
  id: string;
  subject_code: string;
  subject_name: string;
  semester: number;
  test_type: string;
  max_marks: number;
  marks_obtained: number | null;
}

// Group marks by subject
const groupBySubject = (marks: Mark[]) => {
  const map: Record<string, Mark[]> = {};
  marks.forEach(m => {
    const key = `${m.subject_code} — ${m.subject_name}`;
    if (!map[key]) map[key] = [];
    map[key].push(m);
  });
  return map;
};

const testTypeLabels: Record<string, string> = {
  cat1: 'CAT-1',
  cat2: 'CAT-2',
  model: 'Model',
  lab: 'Lab',
  assignment: 'Assignment',
};

const InternalMarks = () => {
  const navigate = useNavigate();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSem, setSelectedSem] = useState<number>(0);

  const [targetCGPA, setTargetCGPA] = useState('8.5');
  const [currentCGPA, setCurrentCGPA] = useState('7.8');
  const [creditsCompleted, setCreditsCompleted] = useState('60');
  const [nextSemCredits, setNextSemCredits] = useState('20');

  useEffect(() => {
    fetchMarks();
  }, [selectedSem]);

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedSem > 0) params.semester = selectedSem;
      const { data } = await api.get('/academic/internal-marks', { params });
      setMarks(data.marks || []);

      // Auto-detect semester if not set
      if (selectedSem === 0 && data.marks?.length > 0) {
        const sems = [...new Set(data.marks.map((m: Mark) => m.semester))] as number[];
        setSelectedSem(Math.max(...sems));
      }
    } catch (err) {
      console.error('Failed to fetch internal marks:', err);
    } finally {
      setLoading(false);
    }
  };

  const grouped = groupBySubject(marks);

  // 1. Calculations for Radar Chart
  const subjectsWithMarks = Object.keys(grouped);
  const chartData = subjectsWithMarks.map(subject => {
    const marksList = Math.abs(selectedSem) > 0 ? grouped[subject] : [];
    const obtained = marksList.reduce((sum, m) => sum + (m.marks_obtained || 0), 0);
    const max = marksList.reduce((sum, m) => sum + m.max_marks, 0);
    const pct = max > 0 ? (obtained / max) * 100 : 0;
    return {
      subjectCode: subject.split(' — ')[0],
      percentage: pct,
    };
  });

  // 2. Analytical Metrics
  const allObtained = marks.filter(m => m.marks_obtained !== null).map(m => m.marks_obtained as number);
  const avgObtained = allObtained.length ? (allObtained.reduce((s, m) => s + m, 0) / allObtained.length) : 0;
  const peakObtained = allObtained.length ? Math.max(...allObtained) : 0;
  const attentionSubjects = subjectsWithMarks.filter(subject => {
    const marksList = grouped[subject];
    const obtained = marksList.reduce((sum, m) => sum + (m.marks_obtained || 0), 0);
    const max = marksList.reduce((sum, m) => sum + m.max_marks, 0);
    return max > 0 && (obtained / max) < 0.5; // less than 50%
  });

  // GPA Target Calculator logic
  const targetVal = parseFloat(targetCGPA) || 8.5;
  const currentVal = parseFloat(currentCGPA) || 7.8;
  const completedCr = parseFloat(creditsCompleted) || 60;
  const nextCr = parseFloat(nextSemCredits) || 20;
  const requiredGPA = nextCr > 0
    ? ((targetVal * (completedCr + nextCr) - currentVal * completedCr) / nextCr)
    : 0;

  const drawRadarChart = () => {
    if (chartData.length < 3) {
      return (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center py-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          🔒 Add at least 3 subjects to render radar chart.
        </div>
      );
    }

    const centerX = 100;
    const centerY = 100;
    const radius = 60;
    const numAxes = chartData.length;

    const getPolygonPoints = (rVal: number) => {
      return chartData.map((_, i) => {
        const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
        const x = centerX + rVal * Math.cos(angle);
        const y = centerY + rVal * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
    };

    const dataPoints = chartData.map((data, i) => {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const r = (data.percentage / 100) * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col items-center shrink-0">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Radar Performance Map</h3>
        <svg width="200" height="200" className="overflow-visible">
          <polygon points={getPolygonPoints(radius)} fill="none" stroke="#f1f5f9" strokeWidth="1.5" />
          <polygon points={getPolygonPoints(radius * 0.75)} fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
          <polygon points={getPolygonPoints(radius * 0.5)} fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
          <polygon points={getPolygonPoints(radius * 0.25)} fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />

          {chartData.map((data, i) => {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const xOuter = centerX + radius * Math.cos(angle);
            const yOuter = centerY + radius * Math.sin(angle);
            const labelX = centerX + (radius + 20) * Math.cos(angle);
            const labelY = centerY + (radius + 12) * Math.sin(angle);

            return (
              <g key={i}>
                <line x1={centerX} y1={centerY} x2={xOuter} y2={yOuter} stroke="#cbd5e1" strokeWidth="0.8" />
                <text x={labelX} y={labelY} fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                  {data.subjectCode}
                </text>
              </g>
            );
          })}

          <polygon points={dataPoints} fill="#db2777" fillOpacity="0.15" stroke="#db2777" strokeWidth="2" />
          
          {chartData.map((data, i) => {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const r = (data.percentage / 100) * radius;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);

            return (
              <circle key={i} cx={x} cy={y} r="3" fill="#db2777" stroke="#ffffff" strokeWidth="1" />
            );
          })}
        </svg>
      </div>
    );
  };

  const getMarkColor = (obtained: number | null, max: number) => {
    if (obtained === null) return 'text-slate-400 bg-slate-100';
    const pct = (obtained / max) * 100;
    if (pct >= 80) return 'text-emerald-700 bg-emerald-50 border border-emerald-100';
    if (pct >= 60) return 'text-blue-700 bg-blue-50 border border-blue-100';
    if (pct >= 40) return 'text-amber-700 bg-amber-50 border border-amber-100';
    return 'text-red-700 bg-red-50 border border-red-100';
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#db2777] via-pink-600 to-[#22346c] p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Internal Marks</h1>
            <p className="text-xs text-pink-200">CAT, Model & Lab assessments</p>
          </div>
        </div>

        {/* Semester Selector */}
        <div className="flex gap-2 overflow-x-auto relative z-10 pb-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
            <button
              key={sem}
              onClick={() => setSelectedSem(sem)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                selectedSem === sem
                  ? 'bg-white text-pink-600 shadow-lg'
                  : 'bg-white/10 text-pink-100 hover:bg-white/20'
              }`}
            >
              Sem {sem}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No Marks Available</h2>
            <p className="text-sm text-slate-500 mt-1">Internal marks for Semester {selectedSem} haven't been published yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-slide-up">
            
            {/* Analytical Cards Header Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center">
                <p className="text-sm font-black text-slate-800">{avgObtained.toFixed(1)}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Average Mark</p>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center">
                <p className="text-sm font-black text-pink-600">{peakObtained.toFixed(1)}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Peak Score</p>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center">
                <p className={`text-sm font-black ${attentionSubjects.length > 0 ? 'text-[#a91f23]' : 'text-emerald-600'}`}>
                  {attentionSubjects.length}
                </p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Alerts</p>
              </div>
            </div>

            {/* Radar Spider Chart Element */}
            {drawRadarChart()}

            {/* Target Calculator card */}
            <div className="bg-gradient-to-br from-[#22346c] to-indigo-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-pink-400" />
                <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase">Target GPA Calculator</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Target CGPA</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={targetCGPA} 
                    onChange={e => setTargetCGPA(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-pink-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Current CGPA</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={currentCGPA} 
                    onChange={e => setCurrentCGPA(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-pink-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Credits Done</label>
                  <input 
                    type="number" 
                    value={creditsCompleted} 
                    onChange={e => setCreditsCompleted(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-pink-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Next Sem Credits</label>
                  <input 
                    type="number" 
                    value={nextSemCredits} 
                    onChange={e => setNextSemCredits(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-pink-500 font-bold"
                  />
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 text-xs flex justify-between items-center font-bold">
                <span className="text-slate-400">Required Next Sem GPA:</span>
                <span className={requiredGPA > 10.0 ? 'text-red-400 font-black' : requiredGPA > 9.0 ? 'text-amber-400 font-black' : 'text-emerald-400 font-black'}>
                  {requiredGPA > 10.0 ? 'Not Feasible (>10.0)' : requiredGPA < 4.0 ? '4.0 (Safe)' : requiredGPA.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Subject-wise Grades */}
            {Object.entries(grouped).map(([subjectKey, subjectMarks]) => {
              const totalObtained = subjectMarks.reduce((sum, m) => sum + (m.marks_obtained || 0), 0);
              const totalMax = subjectMarks.reduce((sum, m) => sum + m.max_marks, 0);
              const overallPct = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0.0;

              return (
                <div key={subjectKey} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                  {/* Subject Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{subjectKey}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${overallPct >= 60 ? 'bg-emerald-500' : overallPct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${overallPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">{overallPct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-slate-900">{totalObtained}</p>
                      <p className="text-[10px] font-bold text-slate-400">/{totalMax}</p>
                    </div>
                  </div>

                  {/* Individual Tests */}
                  <div className="grid grid-cols-2 gap-2">
                    {subjectMarks.sort((a, b) => {
                      const order = ['cat1', 'cat2', 'model', 'lab', 'assignment'];
                      return order.indexOf(a.test_type) - order.indexOf(b.test_type);
                    }).map(mark => (
                      <div key={mark.id} className={`rounded-[16px] p-3 flex items-center justify-between ${getMarkColor(mark.marks_obtained, mark.max_marks)}`}>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                            {testTypeLabels[mark.test_type] || mark.test_type}
                          </p>
                          <p className="text-lg font-black mt-0.5">
                            {mark.marks_obtained !== null ? mark.marks_obtained : '—'}
                            <span className="text-xs font-bold opacity-50">/{mark.max_marks}</span>
                          </p>
                        </div>
                        {mark.marks_obtained !== null && mark.marks_obtained < mark.max_marks * 0.4 && (
                          <AlertTriangle className="w-4 h-4 opacity-60" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default InternalMarks;
