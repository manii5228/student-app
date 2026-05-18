import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, Target, TrendingUp, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface Subject { name:string; credits:number; currentGrade:string; }

const gradePoints: Record<string,number> = { 'O':10, 'A+':9, 'A':8, 'B+':7, 'B':6, 'C':5, 'P':4, 'F':0 };
const grades = Object.keys(gradePoints);

const GPAPredictor = () => {
  const nav = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([
    { name:'Subject 1', credits:4, currentGrade:'A' },
    { name:'Subject 2', credits:3, currentGrade:'B+' },
    { name:'Subject 3', credits:4, currentGrade:'A+' },
    { name:'Subject 4', credits:3, currentGrade:'B' },
  ]);
  const [targetCGPA, setTargetCGPA] = useState('8.5');
  const [prevCGPA, setPrevCGPA] = useState('8.0');
  const [prevCredits, setPrevCredits] = useState('60');
  const [mode, setMode] = useState<'calc'|'predict'>('calc');

  const addSubject = () => setSubjects([...subjects, { name:`Subject ${subjects.length+1}`, credits:3, currentGrade:'B+' }]);
  const removeSubject = (i:number) => setSubjects(subjects.filter((_,idx)=>idx!==i));
  const updateSubject = (i:number, field:keyof Subject, val:any) => setSubjects(subjects.map((s,idx)=>idx===i?{...s,[field]:val}:s));

  // Calculate current semester GPA
  const totalCredits = subjects.reduce((sum,s)=>sum+s.credits,0);
  const totalPoints = subjects.reduce((sum,s)=>sum+s.credits*gradePoints[s.currentGrade],0);
  const semGPA = totalCredits ? (totalPoints/totalCredits) : 0;

  // Calculate CGPA
  const prevCr = parseFloat(prevCredits)||0;
  const prevGPA = parseFloat(prevCGPA)||0;
  const cgpa = (prevCr+totalCredits) ? ((prevGPA*prevCr + totalPoints)/(prevCr+totalCredits)) : semGPA;

  // Predict required GPA for target
  const tgt = parseFloat(targetCGPA)||0;
  const requiredGPA = prevCr ? ((tgt*(prevCr+totalCredits) - prevGPA*prevCr)/totalCredits) : tgt;
  const isAchievable = requiredGPA <= 10 && requiredGPA >= 0;

  const gpaColor = (gpa:number) => gpa>=8.5?'text-emerald-600':gpa>=7?'text-blue-600':gpa>=5?'text-amber-600':'text-red-600';
  const gpaBarColor = (gpa:number) => gpa>=8.5?'bg-emerald-500':gpa>=7?'bg-blue-500':gpa>=5?'bg-amber-500':'bg-red-500';

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-cyan-600 to-blue-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">GPA Predictor</h1><p className="text-xs text-cyan-200">Calculate & predict your grades</p></div>
        </div>
        {/* GPA Display */}
        <div className="flex gap-3 mt-4 relative z-10">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white">{semGPA.toFixed(2)}</p>
            <p className="text-[9px] font-bold text-cyan-200 uppercase">Semester GPA</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white">{cgpa.toFixed(2)}</p>
            <p className="text-[9px] font-bold text-cyan-200 uppercase">CGPA</p>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 px-4 mt-4">
        <button onClick={()=>setMode('calc')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode==='calc'?'bg-cyan-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}><Calculator className="w-3.5 h-3.5 inline mr-1"/>Calculator</button>
        <button onClick={()=>setMode('predict')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode==='predict'?'bg-cyan-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}><Target className="w-3.5 h-3.5 inline mr-1"/>Predictor</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {mode==='calc' ? (
          <div className="flex flex-col gap-3 animate-slide-up">
            {/* Previous CGPA */}
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Previous Semesters</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 mb-1 block">CGPA</label><input type="number" step="0.01" value={prevCGPA} onChange={e=>setPrevCGPA(e.target.value)} className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm font-bold border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
                <div><label className="text-[10px] font-bold text-slate-400 mb-1 block">Total Credits</label><input type="number" value={prevCredits} onChange={e=>setPrevCredits(e.target.value)} className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm font-bold border border-slate-200 focus:outline-none focus:border-cyan-400"/></div>
              </div>
            </div>

            {/* Subjects */}
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-slate-400 uppercase">Current Semester</h3><button onClick={addSubject} className="text-[10px] font-bold text-cyan-600 flex items-center gap-0.5"><Plus className="w-3 h-3"/>Add</button></div>

            {subjects.map((s,i)=>(
              <div key={i} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <input value={s.name} onChange={e=>updateSubject(i,'name',e.target.value)} className="flex-1 bg-transparent text-sm font-bold text-slate-900 focus:outline-none"/>
                  <button onClick={()=>removeSubject(i)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 className="w-3 h-3 text-red-500"/></button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-400 mb-0.5 block">Credits</label>
                    <input type="number" min={1} max={6} value={s.credits} onChange={e=>updateSubject(i,'credits',parseInt(e.target.value)||1)} className="w-full bg-slate-50 rounded-lg px-2 py-1.5 text-xs font-bold border border-slate-200 focus:outline-none focus:border-cyan-400"/>
                  </div>
                  <div className="flex-[2]">
                    <label className="text-[9px] font-bold text-slate-400 mb-0.5 block">Grade</label>
                    <div className="flex gap-1 flex-wrap">{grades.map(g=><button key={g} onClick={()=>updateSubject(i,'currentGrade',g)} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${s.currentGrade===g?'bg-cyan-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{g}</button>)}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* GPA Bar */}
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">GPA Meter</span>
                <span className={`text-lg font-black ${gpaColor(semGPA)}`}>{semGPA.toFixed(2)}/10</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${gpaBarColor(semGPA)} rounded-full transition-all`} style={{width:`${semGPA*10}%`}}></div></div>
            </div>
          </div>
        ) : (
          /* Predictor Mode */
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-cyan-600"/>Set Target CGPA</h3>
              <input type="range" min="5" max="10" step="0.1" value={targetCGPA} onChange={e=>setTargetCGPA(e.target.value)} className="w-full accent-cyan-600"/>
              <p className="text-center text-3xl font-black text-cyan-600 mt-2">{parseFloat(targetCGPA).toFixed(1)}</p>
            </div>

            <div className={`rounded-[24px] p-5 shadow-sm border ${isAchievable&&requiredGPA<=10?'bg-emerald-50 border-emerald-200':'bg-red-50 border-red-200'}`}>
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4"/>Required Semester GPA</h3>
              <p className={`text-4xl font-black mt-2 ${isAchievable&&requiredGPA<=10?'text-emerald-600':'text-red-600'}`}>{requiredGPA.toFixed(2)}</p>
              {requiredGPA > 10 ? <p className="text-xs text-red-600 mt-2 font-medium">⚠️ Not achievable this semester. You'd need a GPA above 10.0.</p>
              : requiredGPA < 0 ? <p className="text-xs text-emerald-600 mt-2 font-medium">✅ You've already exceeded this target!</p>
              : <p className="text-xs text-emerald-600 mt-2 font-medium">✅ Achievable! Aim for mostly {requiredGPA>=9?'O grades':requiredGPA>=8?'A+ grades':requiredGPA>=7?'A grades':'B+ grades'}.</p>}
            </div>

            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Quick Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-slate-900">{prevGPA.toFixed(2)}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Current CGPA</p></div>
                <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-slate-900">{totalCredits}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Sem Credits</p></div>
                <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-slate-900">{prevCr}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Prev Credits</p></div>
                <div className="bg-slate-50 rounded-xl p-3 text-center"><p className={`text-lg font-black ${gpaColor(cgpa)}`}>{cgpa.toFixed(2)}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Predicted CGPA</p></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );
};
export default GPAPredictor;
