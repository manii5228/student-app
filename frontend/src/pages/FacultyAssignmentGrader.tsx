import React, { useState } from 'react';
import { ChevronLeft, CheckCircle, Eye, MessageSquare, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface Submission { id:string; student:string; roll:string; title:string; submitted_at:string; status:'pending'|'graded'; marks?:number; comment?:string; }

const FacultyAssignmentGrader = () => {
  const nav = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([
    { id:'1', student:'Arun Kumar', roll:'21CSE101', title:'Assignment 3 - Linked Lists', submitted_at:'2026-05-15', status:'pending' },
    { id:'2', student:'Priya Sharma', roll:'21CSE102', title:'Assignment 3 - Linked Lists', submitted_at:'2026-05-15', status:'pending' },
    { id:'3', student:'Rahul Verma', roll:'21CSE103', title:'Assignment 3 - Linked Lists', submitted_at:'2026-05-14', status:'graded', marks:8, comment:'Good work!' },
    { id:'4', student:'Sneha Patel', roll:'21CSE104', title:'Assignment 3 - Linked Lists', submitted_at:'2026-05-16', status:'pending' },
    { id:'5', student:'Vikram Singh', roll:'21CSE105', title:'Assignment 3 - Linked Lists', submitted_at:'2026-05-15', status:'graded', marks:9, comment:'Excellent implementation.' },
  ]);
  const [grading, setGrading] = useState<string|null>(null);
  const [gradeForm, setGradeForm] = useState({ marks:'', comment:'' });
  const [filter, setFilter] = useState<'all'|'pending'|'graded'>('pending');

  const submitGrade = (id:string) => {
    if (!gradeForm.marks) return;
    setSubmissions(prev => prev.map(s => s.id===id ? {...s, status:'graded' as const, marks:parseInt(gradeForm.marks), comment:gradeForm.comment} : s));
    setGrading(null); setGradeForm({marks:'',comment:''});
  };

  const filtered = filter==='all' ? submissions : submissions.filter(s=>s.status===filter);
  const pending = submissions.filter(s=>s.status==='pending').length;

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Assignment Grader</h1><p className="text-xs text-purple-200">{pending} pending submissions</p></div>
        </div>
      </div>

      <div className="flex gap-2 px-4 mt-4">
        {(['pending','graded','all'] as const).map(f=><button key={f} onClick={()=>setFilter(f)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold capitalize transition-all ${filter===f?'bg-purple-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}>{f}</button>)}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3 animate-slide-up">
          {filtered.map(s=>(
            <div key={s.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{s.student}</h3>
                  <p className="text-[10px] text-slate-400">{s.roll} • {s.submitted_at}</p>
                </div>
                {s.status==='graded' ? (
                  <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg"><Star className="w-3 h-3"/><span className="text-xs font-bold">{s.marks}/10</span></div>
                ) : (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg uppercase">Pending</span>
                )}
              </div>
              {s.comment && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-xl px-3 py-2">💬 {s.comment}</p>}
              {s.status==='pending' && grading!==s.id && (
                <button onClick={()=>setGrading(s.id)} className="mt-3 w-full py-2.5 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/>Grade</button>
              )}
              {grading===s.id && (
                <div className="mt-3 flex flex-col gap-2 animate-slide-up">
                  <div className="flex gap-2">
                    <input type="number" min={0} max={10} value={gradeForm.marks} onChange={e=>setGradeForm({...gradeForm,marks:e.target.value})} placeholder="Marks /10" className="w-24 bg-slate-50 rounded-xl px-3 py-2 text-sm font-bold border border-slate-200 focus:outline-none focus:border-purple-400"/>
                    <input value={gradeForm.comment} onChange={e=>setGradeForm({...gradeForm,comment:e.target.value})} placeholder="Comment..." className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:border-purple-400"/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>submitGrade(s.id)} disabled={!gradeForm.marks} className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold disabled:opacity-40">Submit</button>
                    <button onClick={()=>setGrading(null)} className="py-2 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomNav/>
    </div>
  );
};
export default FacultyAssignmentGrader;
