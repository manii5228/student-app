import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, FileText, CheckCircle2, FileSpreadsheet, Archive } from 'lucide-react';

const AdminDataExport = () => {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = (type: string) => {
    setDownloading(type);
    setTimeout(() => setDownloading(null), 2000);
  };

  const reports = [
    { id: 'naac-1', title: 'NAAC Criteria I', desc: 'Curricular Aspects & Syllabus tracking data', icon: <FileText className="w-5 h-5 text-indigo-600"/>, color: 'bg-indigo-50 border-indigo-100' },
    { id: 'naac-2', title: 'NAAC Criteria II', desc: 'Teaching-Learning & Evaluation (Attendance/Marks)', icon: <Archive className="w-5 h-5 text-emerald-600"/>, color: 'bg-emerald-50 border-emerald-100' },
    { id: 'nba-placements', title: 'NBA Placements', desc: 'Placement statistics & company visits', icon: <FileSpreadsheet className="w-5 h-5 text-amber-600"/>, color: 'bg-amber-50 border-amber-100' },
    { id: 'audit-logs', title: 'System Audit Logs', desc: 'Admin actions, logins, & security events', icon: <FileText className="w-5 h-5 text-slate-600"/>, color: 'bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Data Export Engine</h1>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Accreditation Reports</h2>
          <p className="text-xs text-slate-500">One-click generation for NAAC and NBA formats.</p>
        </div>

        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className={`rounded-2xl p-4 border flex items-center justify-between ${r.color}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  {r.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">{r.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{r.desc}</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleExport(r.id)}
                disabled={downloading !== null}
                className={`p-3 rounded-full flex items-center justify-center transition-all ${downloading === r.id ? 'bg-green-100 text-green-600' : 'bg-white shadow-sm border border-slate-200 text-blue-600 hover:bg-blue-50 active:scale-95'}`}
              >
                {downloading === r.id ? <CheckCircle2 className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDataExport;
