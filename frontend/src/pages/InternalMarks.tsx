import React, { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';
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
        const sems = [...new Set(data.marks.map((m: Mark) => m.semester))];
        setSelectedSem(Math.max(...sems));
      }
    } catch (err) {
      console.error('Failed to fetch internal marks:', err);
    } finally {
      setLoading(false);
    }
  };

  const grouped = groupBySubject(marks);

  const getMarkColor = (obtained: number | null, max: number) => {
    if (obtained === null) return 'text-slate-400 bg-slate-100';
    const pct = (obtained / max) * 100;
    if (pct >= 80) return 'text-emerald-700 bg-emerald-50';
    if (pct >= 60) return 'text-blue-700 bg-blue-50';
    if (pct >= 40) return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-pink-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={() => navigate('/academic')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
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
            {Object.entries(grouped).map(([subjectKey, subjectMarks]) => {
              const totalObtained = subjectMarks.reduce((sum, m) => sum + (m.marks_obtained || 0), 0);
              const totalMax = subjectMarks.reduce((sum, m) => sum + m.max_marks, 0);
              const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

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
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">{overallPct}%</span>
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
