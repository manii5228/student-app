import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Clock, BarChart3, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Test { id:string; title:string; description:string|null; category:string; duration_minutes:number; total_questions:number; difficulty:string; }
interface Question { id:string; question_text:string; option_a:string; option_b:string; option_c:string; option_d:string; order_num:number; }
interface Result { question_id:string; correct_option:string; student_answer:string; is_correct:boolean; explanation:string|null; }

const MockTestPortal = () => {
  const nav = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('');
  // Test-taking state
  const [activeTest, setActiveTest] = useState<Test|null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  // Results state
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const cats = ['aptitude','technical','verbal','coding'];
  const catColors:Record<string,string> = { aptitude:'from-amber-500 to-orange-600', technical:'from-blue-500 to-indigo-600', verbal:'from-pink-500 to-rose-600', coding:'from-emerald-500 to-teal-600' };
  const diffColors:Record<string,string> = { easy:'text-emerald-600 bg-emerald-50', medium:'text-amber-600 bg-amber-50', hard:'text-red-600 bg-red-50' };

  useEffect(() => { fetchTests(); }, [catFilter]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (catFilter) params.category = catFilter;
      const { data } = await api.get('/career/mock-tests', { params });
      setTests(data.tests || []);
    } catch {}
    setLoading(false);
  };

  const startTest = async (test: Test) => {
    try {
      const { data } = await api.get(`/career/mock-tests/${test.id}/questions`);
      setQuestions(data.questions || []);
      setActiveTest(test);
      setCurrentQ(0);
      setAnswers({});
      setStartTime(Date.now());
      setTimeLeft(test.duration_minutes * 60);
      setShowResults(false);
    } catch {}
  };

  // Timer
  useEffect(() => {
    if (!activeTest || showResults) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { submitTest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, showResults]);

  const selectAnswer = (qId: string, opt: string) => {
    setAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const submitTest = async () => {
    if (!activeTest || submitting) return;
    setSubmitting(true);
    try {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const { data } = await api.post(`/career/mock-tests/${activeTest.id}/submit`, {
        answers, time_taken_seconds: elapsed,
      });
      setScore(data.score); setTotal(data.total);
      setResults(data.results || []);
      setShowResults(true);
    } catch {}
    setSubmitting(false);
  };

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  // ─── TEST LIST VIEW ─────────────────────────────────
  if (!activeTest) return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-rose-600 to-pink-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/career')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Mock Tests</h1><p className="text-xs text-rose-200">Practice for placements</p></div>
        </div>
      </div>
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={()=>setCatFilter('')} className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${!catFilter?'bg-rose-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}>All</button>
          {cats.map(c=><button key={c} onClick={()=>setCatFilter(c)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all ${catFilter===c?'bg-rose-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}>{c}</button>)}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></span></div>
        : tests.length===0 ? (
          <div className="text-center py-20"><BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No Tests Available</h2><p className="text-sm text-slate-500 mt-1">Mock tests haven't been created yet.</p></div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            {tests.map(t=>{
              const grad = catColors[t.category]||'from-slate-500 to-slate-600';
              return (
                <div key={t.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shrink-0 shadow-sm`}><BarChart3 className="w-5 h-5"/></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                      {t.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${diffColors[t.difficulty]||''}`}>{t.difficulty}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3"/>{t.duration_minutes}m</span>
                        <span className="text-[10px] font-bold text-slate-400">{t.total_questions} Qs</span>
                      </div>
                    </div>
                    <button onClick={()=>startTest(t)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 active:scale-95 flex items-center gap-1"><Play className="w-3 h-3"/>Start</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );

  // ─── RESULTS VIEW ──────────────────────────────────
  if (showResults) {
    const pct = total ? Math.round(score/total*100) : 0;
    return (
      <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
        <div className={`p-8 pt-14 text-center ${pct>=70?'bg-gradient-to-br from-emerald-500 to-teal-600':'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
          <Trophy className="w-12 h-12 text-white/80 mx-auto mb-2"/>
          <h1 className="text-4xl font-black text-white">{pct}%</h1>
          <p className="text-white/80 font-bold mt-1">{score}/{total} correct</p>
          <p className="text-white/60 text-sm mt-1">{activeTest?.title}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {results.map((r, idx) => {
              const q = questions.find(x=>x.id===r.question_id);
              return (
                <div key={r.question_id} className={`rounded-[20px] p-4 shadow-sm border ${r.is_correct?'bg-emerald-50/50 border-emerald-200':'bg-red-50/50 border-red-200'}`}>
                  <div className="flex items-start gap-2">
                    {r.is_correct?<CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/>:<XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5"/>}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{idx+1}. {q?.question_text}</p>
                      {!r.is_correct && <p className="text-xs mt-1"><span className="text-red-500">Your: {r.student_answer.toUpperCase()}</span> · <span className="text-emerald-600">Correct: {r.correct_option.toUpperCase()}</span></p>}
                      {r.explanation && <p className="text-xs text-slate-500 mt-1 italic">{r.explanation}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={()=>{setActiveTest(null);setShowResults(false);}} className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm">Back to Tests</button>
        </div>
      </div>
    );
  }

  // ─── QUESTION VIEW (ACTIVE TEST) ───────────────────
  const q = questions[currentQ];
  const opts = q ? [['a',q.option_a],['b',q.option_b],['c',q.option_c],['d',q.option_d]] : [];
  const answered = Object.keys(answers).length;

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button onClick={()=>{if(confirm('Quit test? Progress will be lost.')){setActiveTest(null);}}} className="text-sm font-bold text-slate-500">Quit</button>
        <span className={`text-sm font-black ${timeLeft<=60?'text-red-600 animate-pulse':'text-slate-900'}`}>{formatTime(timeLeft)}</span>
        <span className="text-xs font-bold text-slate-400">{answered}/{questions.length}</span>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-slate-100"><div className="h-full bg-rose-500 transition-all" style={{width:`${((currentQ+1)/questions.length)*100}%`}}></div></div>

      {q && <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Question {currentQ+1} of {questions.length}</p>
        <h2 className="text-base font-bold text-slate-900 leading-relaxed mb-6">{q.question_text}</h2>
        <div className="flex flex-col gap-3 flex-1">
          {opts.map(([key,text])=>(
            <button key={key} onClick={()=>selectAnswer(q.id, key)}
              className={`w-full p-4 rounded-2xl text-left text-sm font-medium border-2 transition-all ${answers[q.id]===key?'border-rose-500 bg-rose-50 text-rose-700':'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
              <span className={`inline-flex w-7 h-7 rounded-lg items-center justify-center text-xs font-black mr-3 ${answers[q.id]===key?'bg-rose-500 text-white':'bg-slate-100 text-slate-500'}`}>{key.toUpperCase()}</span>
              {text}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={()=>setCurrentQ(p=>Math.max(0,p-1))} disabled={currentQ===0} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm disabled:opacity-30">← Prev</button>
          {currentQ<questions.length-1 ? (
            <button onClick={()=>setCurrentQ(p=>p+1)} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm">Next →</button>
          ) : (
            <button onClick={submitTest} disabled={submitting} className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40">{submitting?'Submitting...':'Submit Test'}</button>
          )}
        </div>
      </div>}
    </div>
  );
};
export default MockTestPortal;
