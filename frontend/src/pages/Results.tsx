import React, { useState, useEffect } from 'react';
import { ChevronLeft, Award, TrendingUp, Download, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Result {
  id: string;
  semester: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  internal_marks: number;
  external_marks: number;
  total_marks: number;
  grade: string;
  grade_points: number;
  sgpa: number | null;
  cgpa: number | null;
}

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSem, setSelectedSem] = useState<number>(1);
  const [availableSems, setAvailableSems] = useState<number[]>([]);

  useEffect(() => {
    fetchResults();
  }, [selectedSem]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // First fetch all to get available semesters if we haven't yet
      if (availableSems.length === 0) {
        const allRes = await api.get('/academic/results');
        const sems = Array.from(new Set(allRes.data.results.map((r: Result) => r.semester) as number[])).sort();
        if (sems.length > 0) {
          setAvailableSems(sems);
          if (!sems.includes(selectedSem)) {
            setSelectedSem(sems[sems.length - 1]);
            return; // Will re-trigger useEffect
          }
        } else {
          setAvailableSems([1, 2, 3, 4, 5, 6, 7, 8]); // Mock fallbacks if empty
        }
      }

      const { data } = await api.get(`/academic/results?semester=${selectedSem}`);
      setResults(data.results);
    } catch (err) {
      console.error('Failed to fetch results', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive SGPA/CGPA from the first result of the semester (as it's usually duplicated or stored per subject)
  const sgpa = results.length > 0 && results[0].sgpa ? results[0].sgpa : 0.0;
  const cgpa = results.length > 0 && results[0].cgpa ? results[0].cgpa : 0.0;

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'O': return 'text-emerald-600 bg-emerald-100';
      case 'A+': return 'text-blue-600 bg-blue-100';
      case 'A': return 'text-indigo-600 bg-indigo-100';
      case 'B+': return 'text-purple-600 bg-purple-100';
      case 'B': return 'text-yellow-600 bg-yellow-100';
      case 'U': case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-app-dark p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10 mb-6">
          <button onClick={() => navigate('/academic')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Gradebook</h1>
            <p className="text-xs text-slate-300">University Examination Results</p>
          </div>
        </div>

        {/* Semester Selector */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 relative z-10">
          {availableSems.map(sem => (
            <button
              key={sem}
              onClick={() => setSelectedSem(sem)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                selectedSem === sem 
                  ? 'bg-app-accent text-white shadow-lg' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="w-8 h-8 border-4 border-app-accent border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No Results Found</h2>
            <p className="text-sm text-slate-500 mt-1">Results for Semester {selectedSem} are not published yet.</p>
          </div>
        ) : (
          <div className="animate-slide-up flex flex-col gap-6">
            
            {/* GPA Summary Card */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-app-accent/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-app-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semester {selectedSem} SGPA</p>
                  <p className="text-2xl font-black text-slate-900">{sgpa > 0 ? sgpa.toFixed(2) : 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall CGPA</p>
                <p className="text-xl font-bold text-slate-700">{cgpa > 0 ? cgpa.toFixed(2) : 'N/A'}</p>
              </div>
            </div>

            {/* Subject-wise Grades */}
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-bold text-slate-800">Subject Grades</h3>
                <button className="text-xs font-bold text-app-accent flex items-center gap-1 hover:underline">
                  <Download className="w-3 h-3" /> Marksheet
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {results.map((res) => (
                  <div key={res.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <p className="text-[10px] font-bold text-slate-400 mb-0.5">{res.subject_code} • {res.credits} Credits</p>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">{res.subject_name}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500 font-medium">INT: <span className="font-bold text-slate-700">{res.internal_marks || '-'}</span>/40</span>
                        <span className="text-xs text-slate-500 font-medium">EXT: <span className="font-bold text-slate-700">{res.external_marks || '-'}</span>/60</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1 border-l border-slate-100 pl-4 min-w-[60px]">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${getGradeColor(res.grade || '')}`}>
                        {res.grade || '-'}
                      </div>
                      {res.grade !== 'U' && res.grade !== 'F' && res.grade ? (
                        <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="w-2 h-2" /> PASS</span>
                      ) : res.grade ? (
                        <span className="text-[9px] font-bold text-red-600">FAIL</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Results;
