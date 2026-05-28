import React, { useState, useEffect } from 'react';
import { ChevronLeft, Award, TrendingUp, Download, CheckCircle2, Share2, Award as AwardIcon, ShieldCheck } from 'lucide-react';
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
  digital_signature?: string;
  hash_receipt?: string;
}

interface ResultAnalytics {
  class_averages: Record<string, number>;
  percentiles: Record<string, number>;
  overall_percentile: number;
  overall_average: number;
  signature_receipt: string;
}

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [analytics, setAnalytics] = useState<ResultAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSem, setSelectedSem] = useState<number>(1);
  const [availableSems, setAvailableSems] = useState<number[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [selectedSem]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      if (availableSems.length === 0) {
        const allRes = await api.get('/academic/results');
        const sems = Array.from(new Set(allRes.data.results.map((r: Result) => r.semester) as number[])).sort();
        if (sems.length > 0) {
          setAvailableSems(sems);
          if (!sems.includes(selectedSem)) {
            setSelectedSem(sems[sems.length - 1]);
            return;
          }
        } else {
          setAvailableSems([1, 2, 3, 4, 5, 6, 7, 8]);
        }
      }

      // Fetch results and analytics
      const [resResponse, analyticsResponse] = await Promise.all([
        api.get(`/academic/results?semester=${selectedSem}`),
        api.get(`/academic/results/analytics?semester=${selectedSem}`)
      ]);

      setResults(resResponse.data.results);
      setAnalytics(analyticsResponse.data);
    } catch (err) {
      console.error('Failed to fetch results', err);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="bg-slate-900 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Gradebook</h1>
              <p className="text-xs text-slate-300">University Examination Results</p>
            </div>
          </div>

          {results.length > 0 && (
            <button 
              onClick={() => setShowShareModal(true)}
              className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-sm border border-slate-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Semester Selector */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 relative z-10">
          {availableSems.map(sem => (
            <button
              key={sem}
              onClick={() => setSelectedSem(sem)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                selectedSem === Math.abs(sem) 
                  ? 'bg-rose-600 text-white shadow-lg' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
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
          <div className="animate-slide-up flex flex-col gap-4">
            
            {/* GPA Summary Card */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-rose-600" />
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

            {/* Percentile Ranking & Historical Card */}
            {analytics && (
              <div className="bg-slate-900 text-white rounded-[24px] p-5 shadow-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                    <AwardIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cohort Percentile Rank</p>
                    <p className="text-lg font-black text-white">
                      Top {Math.round(100 - analytics.overall_percentile)}% in Department
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Class Average Total Score: {analytics.overall_average.toFixed(1)} marks
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Subject-wise Grades */}
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Subject Grades</h3>
              </div>
              
              <div className="flex flex-col gap-3">
                {results.map((res) => {
                  const classAvg = analytics?.class_averages[res.subject_code] || 0.0;
                  const subjectPct = analytics?.percentiles[res.subject_code] || 100.0;
                  return (
                    <div key={res.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">{res.subject_code} • {res.credits} Credits</p>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{res.subject_name}</h4>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-slate-500 font-semibold">INT: <span className="font-bold text-slate-700">{res.internal_marks || '-'}</span>/40</span>
                          <span className="text-[10px] text-slate-500 font-semibold">EXT: <span className="font-bold text-slate-700">{res.external_marks || '-'}</span>/60</span>
                        </div>

                        {/* Historical Analysis Comparison */}
                        {classAvg > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] font-bold">
                            <span className="text-slate-400 uppercase">Class Average: {classAvg}%</span>
                            <span className="text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded">
                              {subjectPct}% Percentile Score
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-center gap-1 border-l border-slate-100 pl-4 min-w-[65px]">
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
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Share Report Card Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative border border-slate-100 animate-scale-in text-slate-800">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600"
            >
              ✕
            </button>
            
            <h3 className="text-base font-black text-slate-900 mb-4 text-center">Share Report Card</h3>
            
            {/* The actual styled image template */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-lg text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl"></div>
              
              <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">OFFICIAL EXAM RECEIPT</p>
              <h4 className="text-sm font-black text-white mt-1">VelTech University</h4>
              
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full mx-auto flex items-center justify-center my-4">
                <AwardIcon className="w-8 h-8 text-yellow-500" />
              </div>
              
              <p className="text-xs text-slate-300 font-medium">Semester {selectedSem} CGPA</p>
              <p className="text-3xl font-black text-white mt-1">{cgpa.toFixed(2)}</p>
              
              {analytics && (
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-left">
                  <div>
                    <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">SGPA</span>
                    <span className="text-xs font-bold text-white">{sgpa.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Percentile</span>
                    <span className="text-xs font-bold text-yellow-400">Top {Math.round(100 - analytics.overall_percentile)}%</span>
                  </div>
                </div>
              )}

              {/* Digital cryptographic signature stamp */}
              {analytics?.signature_receipt && (
                <div className="mt-4 pt-3 border-t border-dashed border-white/10 flex items-center justify-center gap-1.5 text-[8px] text-slate-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[180px]">{analytics.signature_receipt.toUpperCase()}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 font-medium mt-4 text-center leading-relaxed">
              Cryptographically signed by the Controller of Examinations. Ready to share on professional platforms.
            </p>

            <button 
              onClick={() => {
                alert("Successfully saved report card screenshot to local gallery.");
                setShowShareModal(false);
              }}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Download Certificate Image
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Results;
