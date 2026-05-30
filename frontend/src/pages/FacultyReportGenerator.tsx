import React, { useState } from 'react';
import { ChevronLeft, FileText, Download, Printer, BarChart3, Users, Clock, Mail, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const FacultyReportGenerator = () => {
  const nav = useNavigate();
  const [reportType, setReportType] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Scheduler states
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly',
    email: 'dr.ramesh@veltech.edu.in',
    format: 'PDF'
  });

  const reports = [
    { key:'attendance', label:'Attendance Report', desc:'Class-wise attendance summary', icon:<Users className="w-6 h-6"/>, color:'from-blue-500 to-indigo-650' },
    { key:'marks', label:'Internal Marks', desc:'Subject-wise marks sheet', icon:<FileText className="w-6 h-6"/>, color:'from-emerald-500 to-teal-600' },
    { key:'mentee', label:'Mentee Report', desc:'Mentee performance overview', icon:<BarChart3 className="w-6 h-6"/>, color:'from-violet-500 to-purple-600' },
    { key:'consolidated', label:'Consolidated Report', desc:'All data combined PDF', icon:<Download className="w-6 h-6"/>, color:'from-orange-500 to-red-600' },
  ];

  const generate = async () => {
    if (!reportType) return;
    setGenerating(true);
    await new Promise(r=>setTimeout(r, 1500));
    setGenerating(false); 
    setGenerated(true);
    setShowPreview(true);
  };

  const handleSaveSchedule = () => {
    setIsScheduled(true);
    alert(`Report scheduler configured! Automated dispatches will send ${scheduleConfig.frequency} in ${scheduleConfig.format} format to ${scheduleConfig.email}.`);
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Report Generator</h1><p className="text-xs text-slate-400">Export to PDF / Excel</p></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Report Type</h3>
          <div className="grid grid-cols-2 gap-3 mb-2 animate-slide-up">
            {reports.map(r=>(
              <button key={r.key} onClick={()=>{setReportType(r.key);setGenerated(false);}}
                className={`bg-gradient-to-br ${r.color} rounded-[20px] p-4 flex flex-col items-center gap-2 text-white shadow-md active:scale-95 transition-all ${reportType===r.key?'ring-4 ring-slate-800/25':''}`}>
                {r.icon}
                <h4 className="text-xs font-bold text-center">{r.label}</h4>
                <p className="text-[9px] text-white/70 text-center">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {reportType && (
          <div className="animate-slide-up flex flex-col gap-4">
            {/* Options */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider mb-3">Report Options</h3>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Class</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
                      <option>CSE-A Sem 4</option>
                      <option>CSE-B Sem 4</option>
                      <option>CSE-A Sem 6</option>
                      <option>All Mentees</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Format</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
                      <option>PDF Document</option>
                      <option>Excel sheet (.xlsx)</option>
                      <option>CSV sheet</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduled background delivery settings */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Automated Background Scheduler
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal">Configure automated dispatches of this report to your email inbox.</p>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Frequency</label>
                  <select 
                    value={scheduleConfig.frequency}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  >
                    <option value="weekly">Every Monday (8 AM)</option>
                    <option value="monthly">1st of Month</option>
                    <option value="exam-prep">End of Semester</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Recipient Email</label>
                  <input
                    type="email"
                    value={scheduleConfig.email}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 items-center mt-1">
                <button
                  onClick={handleSaveSchedule}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                    isScheduled 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-indigo-50 text-indigo-650 hover:bg-indigo-100'
                  }`}
                >
                  {isScheduled ? '✓ Active Schedule Configured' : 'Setup Background Schedule'}
                </button>
                {isScheduled && (
                  <button 
                    onClick={() => setIsScheduled(false)} 
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {!generated ? (
              <button onClick={generate} disabled={generating} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md">
                {generating ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>Generating...</> : <><FileText className="w-4 h-4"/>Generate Report</>}
              </button>
            ) : (
              <div className="bg-emerald-50 rounded-[24px] p-5 border border-emerald-250 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600"/>
                    <h3 className="text-sm font-black text-emerald-700">Report Ready!</h3>
                  </div>
                  <button 
                    onClick={() => setShowPreview(true)}
                    className="text-[10px] font-black bg-emerald-600/10 hover:bg-emerald-650/20 text-emerald-700 px-3 py-1 rounded-xl"
                  >
                    Open Preview
                  </button>
                </div>
                <div className="flex gap-2 border-t border-emerald-200/50 pt-3">
                  <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/10"><Download className="w-3.5 h-3.5"/>Download</button>
                  <button className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black border border-slate-200 flex items-center justify-center gap-1.5"><Printer className="w-3.5 h-3.5"/>Print</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* In-Browser Document Preview Sheet Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl relative p-6 border border-slate-100 flex flex-col max-h-[85vh] animate-scale-up">
            <button 
              onClick={() => setShowPreview(false)} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-700 z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-3">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-1">
                <FileText className="w-4 h-4 text-[#0080c7]" /> In-Browser Print Preview
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Consolidated review before saving</p>
            </div>

            {/* University Letterhead Document Body */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-800 text-[10px] relative select-none">
              
              {/* Header Letterhead */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <h2 className="text-sm font-black text-slate-950 tracking-wider">VELTECH UNIVERSITY</h2>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Faculty Academic & Mentorship Development Board</p>
                <p className="text-[7px] text-slate-400 font-medium">Avadi, Chennai, Tamil Nadu - 600062</p>
              </div>

              {/* Document details metadata */}
              <div className="flex justify-between mb-4 font-bold text-slate-600 text-[8px]">
                <div>
                  <p>REPORT TYPE: <span className="text-slate-950">{reportType.toUpperCase()} SUMMARY</span></p>
                  <p>CLASS SLOT: <span className="text-slate-950">CSE-A SEMESTER 4</span></p>
                </div>
                <div className="text-right">
                  <p>DATE: <span className="text-slate-950">{new Date().toLocaleDateString()}</span></p>
                  <p>ISSUED BY: <span className="text-slate-950">DR. RAMESH KUMAR</span></p>
                </div>
              </div>

              {/* Table of performance logs */}
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-4 bg-white">
                <div className="grid grid-cols-3 bg-slate-900 text-white font-bold p-2 text-[7px] uppercase tracking-wider text-center">
                  <span>Student</span>
                  <span>Avg Attendance</span>
                  <span>Performance Status</span>
                </div>
                <div className="divide-y divide-slate-250 divide-slate-200">
                  <div className="grid grid-cols-3 p-2 text-center font-medium">
                    <span className="text-left font-bold">Arun Kumar (VTU011)</span>
                    <span>88%</span>
                    <span className="text-emerald-600 font-black">Satisfactory</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 text-center font-medium">
                    <span className="text-left font-bold">Priya Sharma (VTU015)</span>
                    <span className="text-red-655 font-black">62%</span>
                    <span className="text-amber-600 font-black">Warning Letter Issued</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 text-center font-medium">
                    <span className="text-left font-bold">Rohan Lal (VTU042)</span>
                    <span>94%</span>
                    <span className="text-emerald-600 font-black">Excellent</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-extrabold text-[8px] text-slate-900 uppercase mb-1">Assigned Mentees Summary Notes</h4>
                <p className="leading-relaxed text-slate-500">
                  During this assessment cycle, student records have been verified against active rosters. Warnings regarding low attendance (&lt;75%) have been automatically dispatched to students and parents.
                </p>
              </div>

              {/* Signature stamp graphics */}
              <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-200">
                <div className="text-center font-bold text-[7px] text-slate-400">
                  <p className="italic text-slate-600">Generated Electronically</p>
                  <p className="mt-1">Dean Academic Affairs</p>
                </div>
                {/* Official seal mock */}
                <div className="w-12 h-12 rounded-full border border-indigo-400 flex flex-col items-center justify-center text-indigo-500 font-black text-[6px] rotate-12 scale-90 select-none">
                  <span>VELTECH</span>
                  <span>SEAL</span>
                  <span>2026</span>
                </div>
              </div>

            </div>

            <div className="flex gap-2.5 mt-4">
              <button 
                onClick={() => { alert("Consolidated PDF file downloaded successfully!"); setShowPreview(false); }}
                className="flex-1 py-3 bg-[#0080c7] hover:bg-[#006ca8] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-lg"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button 
                onClick={() => { window.print(); }}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black border border-slate-200 flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};
export default FacultyReportGenerator;
