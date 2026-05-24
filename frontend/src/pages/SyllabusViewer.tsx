import React, { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen, CheckCircle, Circle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface SyllabusUnit {
  id: string;
  subject_code: string;
  subject_name: string;
  department: string;
  semester: number;
  unit_number: number;
  unit_title: string;
  topics: string;
  hours: number;
  is_completed: boolean;
}

// Group units by subject
const groupBySubject = (units: SyllabusUnit[]) => {
  const map: Record<string, SyllabusUnit[]> = {};
  units.forEach(u => {
    const key = `${u.subject_code} — ${u.subject_name}`;
    if (!map[key]) map[key] = [];
    map[key].push(u);
  });
  return map;
};

const SyllabusViewer = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState<SyllabusUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const params: any = {};
      if (user.department) params.department = user.department;
      if (user.semester) params.semester = user.semester;
      const { data } = await api.get('/academic/syllabus', { params });
      setUnits(data.syllabus || []);
    } catch (err) {
      console.error('Failed to fetch syllabus:', err);
    } finally {
      setLoading(false);
    }
  };

  const grouped = groupBySubject(
    units.filter(u =>
      u.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      u.subject_code.toLowerCase().includes(search.toLowerCase()) ||
      u.unit_title.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-purple-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Syllabus Viewer</h1>
            <p className="text-xs text-purple-200">Unit-wise curriculum tracker</p>
          </div>
        </div>
        {/* Search */}
        <div className="relative z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subjects or topics..."
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-purple-200 focus:outline-none focus:bg-white/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No Syllabus Data</h2>
            <p className="text-sm text-slate-500 mt-1">Syllabus for your semester hasn't been uploaded yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            {Object.entries(grouped).map(([subjectKey, subjectUnits]) => {
              const isExpanded = expandedSubject === subjectKey;
              const completedCount = subjectUnits.filter(u => u.is_completed).length;
              const totalCount = subjectUnits.length;
              const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div key={subjectKey} className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                  {/* Subject Header */}
                  <button
                    onClick={() => setExpandedSubject(isExpanded ? null : subjectKey)}
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{subjectKey}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">{completedCount}/{totalCount}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {/* Expanded Units */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 pb-4 animate-fade-in">
                      {subjectUnits.sort((a, b) => a.unit_number - b.unit_number).map(unit => (
                        <div key={unit.id} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
                          <div className="mt-0.5 shrink-0">
                            {unit.is_completed ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">
                              Unit {unit.unit_number}: {unit.unit_title}
                            </p>
                            {unit.topics && (
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{unit.topics}</p>
                            )}
                            <span className="text-[10px] font-bold text-slate-400 mt-1 inline-block">{unit.hours} hours</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

export default SyllabusViewer;
