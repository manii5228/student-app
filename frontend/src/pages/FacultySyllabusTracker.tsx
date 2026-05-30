import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckSquare, Square, BookOpen } from 'lucide-react';
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
  completed_topics?: string | null;
}

interface SubjectGroup {
  code: string;
  name: string;
  units: SyllabusUnit[];
}

const FacultySyllabusTracker = () => {
  const nav = useNavigate();
  const [subjects, setSubjects] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(0);

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const params: any = {};
      if (user.department) params.department = user.department;
      if (user.semester) params.semester = user.semester;
      
      const { data } = await api.get('/academic/syllabus', { params });
      const list = data.syllabus || [];
      
      const subjectsMap: Record<string, { code: string; name: string; units: SyllabusUnit[] }> = {};
      list.forEach((u: SyllabusUnit) => {
        if (!subjectsMap[u.subject_code]) {
          subjectsMap[u.subject_code] = { code: u.subject_code, name: u.subject_name, units: [] };
        }
        subjectsMap[u.subject_code].units.push(u);
      });
      setSubjects(Object.values(subjectsMap));
    } catch (err) {
      console.error('Failed to fetch syllabus:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseCompletedTopics = (completedTopicsStr: string | null | undefined): string[] => {
    if (!completedTopicsStr) return [];
    try {
      return JSON.parse(completedTopicsStr);
    } catch {
      return completedTopicsStr.split(',').map(t => t.trim()).filter(Boolean);
    }
  };

  const toggleTopic = async (unitId: string, topicName: string, currentCompleted: boolean) => {
    try {
      // Optimistic update
      setSubjects(prev => {
        return prev.map((s, si) => {
          if (si === activeSubject) {
            return {
              ...s,
              units: s.units.map(u => {
                if (u.id === unitId) {
                  const completedList = parseCompletedTopics(u.completed_topics);
                  let newCompletedList = [...completedList];
                  if (!currentCompleted) {
                    if (!newCompletedList.includes(topicName)) {
                      newCompletedList.push(topicName);
                    }
                  } else {
                    newCompletedList = newCompletedList.filter(t => t !== topicName);
                  }
                  
                  const allTopics = u.topics.split(',').map(t => t.trim()).filter(Boolean);
                  const isUnitCompleted = allTopics.length > 0 && allTopics.every(t => newCompletedList.includes(t));
                  
                  return {
                    ...u,
                    completed_topics: JSON.stringify(newCompletedList),
                    is_completed: isUnitCompleted
                  };
                }
                return u;
              })
            };
          }
          return s;
        });
      });

      await api.post('/academic/syllabus/progress', {
        unit_id: unitId,
        topic_name: topicName,
        is_completed: !currentCompleted
      });
    } catch (err) {
      console.error('Failed to update topic progress:', err);
      fetchSyllabus();
    }
  };

  const toggleUnit = async (unitId: string, currentCompleted: boolean) => {
    try {
      // Optimistic update
      setSubjects(prev => {
        return prev.map((s, si) => {
          if (si === activeSubject) {
            return {
              ...s,
              units: s.units.map(u => {
                if (u.id === unitId) {
                  const allTopics = u.topics.split(',').map(t => t.trim()).filter(Boolean);
                  return {
                    ...u,
                    is_completed: !currentCompleted,
                    completed_topics: !currentCompleted ? JSON.stringify(allTopics) : '[]'
                  };
                }
                return u;
              })
            };
          }
          return s;
        });
      });

      await api.post('/academic/syllabus/progress', {
        unit_id: unitId,
        is_completed: !currentCompleted
      });
    } catch (err) {
      console.error('Failed to update syllabus progress:', err);
      // Revert on error
      fetchSyllabus();
    }
  };

  const sub = subjects[activeSubject];
  const totalUnits = sub?.units?.length || 0;
  const completedUnits = sub?.units?.filter(u => u.is_completed).length || 0;
  const progress = totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0;

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
            <ChevronLeft className="w-5 h-5 text-white"/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Syllabus Tracker</h1>
            <p className="text-xs text-emerald-200">Mark curriculum progress</p>
          </div>
        </div>
        
        {sub && (
          <div className="mt-4 relative z-10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-100">{sub.name}</span>
              <span className="text-xs font-black text-white">{progress}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-[10px] text-emerald-200 mt-1">{completedUnits}/{totalUnits} units completed</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <BookOpen className="w-12 h-12 text-slate-300 mb-3"/>
          <h3 className="text-base font-bold text-slate-850">No Subjects Found</h3>
          <p className="text-xs text-slate-500 mt-1">There are no syllabus entries assigned to your department/semester.</p>
        </div>
      ) : (
        <>
          {/* Subject tabs */}
          <div className="flex gap-2 px-4 mt-4 overflow-x-auto scrollbar-hide shrink-0">
            {subjects.map((s, i) => (
              <button 
                key={i} 
                onClick={() => setActiveSubject(i)} 
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${activeSubject === i ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
              >
                {s.code}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3 animate-slide-up">
              {sub.units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
                <div key={unit.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex items-start gap-3">
                  <button 
                    onClick={() => toggleUnit(unit.id, unit.is_completed)} 
                    className="mt-0.5 shrink-0 transition-transform active:scale-90"
                  >
                    {unit.is_completed 
                      ? <CheckSquare className="w-5 h-5 text-emerald-500" /> 
                      : <Square className="w-5 h-5 text-slate-300" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-bold leading-tight ${unit.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        Unit {unit.unit_number}: {unit.unit_title}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">{unit.hours} hrs</span>
                    </div>
                    {unit.topics && (
                      <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topics</span>
                        <div className="flex flex-col gap-2">
                          {unit.topics.split(',').map((topic, idx) => {
                            const topicClean = topic.trim();
                            if (!topicClean) return null;
                            const completedList = parseCompletedTopics(unit.completed_topics);
                            const isTopicCompleted = completedList.includes(topicClean);
                            return (
                              <label key={idx} className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isTopicCompleted}
                                  onChange={() => toggleTopic(unit.id, topicClean, isTopicCompleted)}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                />
                                <span className={isTopicCompleted ? 'line-through text-slate-400 font-medium' : 'text-slate-700 font-semibold'}>
                                  {topicClean}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <BottomNav/>
    </div>
  );
};

export default FacultySyllabusTracker;
