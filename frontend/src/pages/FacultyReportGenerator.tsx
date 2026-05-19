import React, { useState } from 'react';
import { ChevronLeft, FileText, Download, Printer, BarChart3, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const FacultyReportGenerator = () => {
  const nav = useNavigate();
  const [reportType, setReportType] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const reports = [
    { key:'attendance', label:'Attendance Report', desc:'Class-wise attendance summary', icon:<Users className="w-6 h-6"/>, color:'from-blue-500 to-indigo-600' },
    { key:'marks', label:'Internal Marks', desc:'Subject-wise marks sheet', icon:<FileText className="w-6 h-6"/>, color:'from-emerald-500 to-teal-600' },
    { key:'mentee', label:'Mentee Report', desc:'Mentee performance overview', icon:<BarChart3 className="w-6 h-6"/>, color:'from-violet-500 to-purple-600' },
    { key:'consolidated', label:'Consolidated Report', desc:'All data combined PDF', icon:<Download className="w-6 h-6"/>, color:'from-orange-500 to-red-600' },
  ];

  const generate = async () => {
    if (!reportType) return;
    setGenerating(true);
    await new Promise(r=>setTimeout(r, 2000));
    setGenerating(false); setGenerated(true);
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Report Generator</h1><p className="text-xs text-slate-400">Export to PDF / Excel</p></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Report Type</h3>
        <div className="grid grid-cols-2 gap-3 mb-5 animate-slide-up">
          {reports.map(r=>(
            <button key={r.key} onClick={()=>{setReportType(r.key);setGenerated(false);}}
              className={`bg-gradient-to-br ${r.color} rounded-[20px] p-4 flex flex-col items-center gap-2 text-white shadow-md active:scale-95 transition-all ${reportType===r.key?'ring-4 ring-white/50':''}`}>
              {r.icon}
              <h4 className="text-xs font-bold text-center">{r.label}</h4>
              <p className="text-[9px] text-white/70 text-center">{r.desc}</p>
            </button>
          ))}
        </div>

        {reportType && (
          <div className="animate-slide-up">
            {/* Config */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Report Options</h3>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Class</label><select className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200"><option>CSE-A Sem 4</option><option>CSE-B Sem 4</option><option>CSE-A Sem 6</option><option>All</option></select></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Format</label><select className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200"><option>PDF</option><option>Excel (.xlsx)</option><option>CSV</option></select></div>
                </div>
              </div>
            </div>

            {!generated ? (
              <button onClick={generate} disabled={generating} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
                {generating ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>Generating...</> : <><FileText className="w-4 h-4"/>Generate Report</>}
              </button>
            ) : (
              <div className="bg-emerald-50 rounded-[24px] p-5 border border-emerald-200">
                <div className="flex items-center gap-2 mb-3"><FileText className="w-5 h-5 text-emerald-600"/><h3 className="text-sm font-bold text-emerald-700">Report Ready!</h3></div>
                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5"/>Download</button>
                  <button className="flex-1 py-3 bg-white text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5"><Printer className="w-3.5 h-3.5"/>Print</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );
};
export default FacultyReportGenerator;
