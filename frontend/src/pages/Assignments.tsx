import React, { useState, useEffect } from 'react';
import { ChevronLeft, Upload, FileText, Check, Clock, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

// Mock assignments
const INITIAL_ASSIGNMENTS = [
  { id: '1', title: 'Stack & Queue Implementation', subject_name: 'Data Structures', subject_code: 'CS301', due_date: '2026-05-15T23:59:00', max_marks: 100, status: 'pending' },
  { id: '2', title: 'K-Map Simplification Lab', subject_name: 'Digital Logic', subject_code: 'CS302', due_date: '2026-05-12T23:59:00', max_marks: 50, status: 'submitted' },
  { id: '3', title: 'Process Scheduling Simulation', subject_name: 'Operating Systems', subject_code: 'CS303', due_date: '2026-05-20T23:59:00', max_marks: 75, status: 'pending' },
  { id: '4', title: 'Fourier Transform Problem Set', subject_name: 'Mathematics III', subject_code: 'MA301', due_date: '2026-05-08T23:59:00', max_marks: 50, status: 'graded', marks_obtained: 42 },
];



const Assignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  
  // Modal & Upload States
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const filtered = filter === 'all' ? assignments : assignments.filter(a => a.status === filter);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUploadSubmit = () => {
    if (selectedFiles.length === 0 || !activeUploadId) return;
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 400);

    setTimeout(() => {
      clearInterval(interval);
      
      setAssignments(prev => prev.map(a => 
        a.id === activeUploadId 
          ? { ...a, status: 'submitted' }
          : a
      ));
      
      setSuccessMessage("Assignment Submitted Successfully!");
      setIsUploading(false);
      setActiveUploadId(null);
      setSelectedFiles([]);
      setUploadProgress(0);
      
      setTimeout(() => setSuccessMessage(null), 5000);
    }, 2500);
  };

  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in pb-24 relative">

      {/* Header aligned to Bento Dashboard Style */}
      <div className="flex justify-between items-center p-6 mt-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
          <FileText className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="px-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Title Section */}
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assignments</h1>
        </div>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 rounded-[24px] p-4 flex flex-col items-center justify-center border border-slate-100">
            <p className="text-3xl font-black text-slate-950">{assignments.filter(a => a.status === 'pending').length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Pending</p>
          </div>
          <div className="bg-slate-50 rounded-[24px] p-4 flex flex-col items-center justify-center border border-slate-100">
            <p className="text-3xl font-black text-slate-950">{assignments.filter(a => a.status === 'submitted').length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Submitted</p>
          </div>
          <div className="bg-slate-50 rounded-[24px] p-4 flex flex-col items-center justify-center border border-slate-100">
            <p className="text-3xl font-black text-slate-950">{assignments.filter(a => a.status === 'graded').length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Graded</p>
          </div>
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-[24px] p-4 flex items-start gap-3 shadow-sm animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
               <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex bg-slate-50 rounded-2xl p-1.5 mb-6 border border-slate-100">
          {(['all', 'pending', 'submitted', 'graded'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-[14px] text-xs font-bold capitalize transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Assignment Cards */}
        <div className="flex flex-col gap-4 pb-8">
          {filtered.map(a => {
            const days = daysUntil(a.due_date);
            const isOverdue = days < 0;
            const isUrgent = days >= 0 && days <= 2;

            return (
              <div key={a.id} className={`rounded-[32px] p-6 shadow-sm border ${
                a.status === 'graded' ? 'bg-emerald-50/50 border-emerald-100' :
                isOverdue ? 'bg-red-50/50 border-red-100' :
                isUrgent ? 'bg-amber-50/50 border-amber-100' :
                'bg-slate-50 border-slate-100'
              }`}>

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-slate-900 leading-tight">{a.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full shadow-sm">{a.subject_name}</span>
                       <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">{a.subject_code}</span>
                    </div>
                  </div>
                  {a.status === 'graded' && (
                    <div className="bg-emerald-100 rounded-2xl px-4 py-2 shadow-sm border border-emerald-200 shrink-0">
                      <p className="text-lg font-black text-emerald-800">{(a as any).marks_obtained}<span className="text-sm font-medium text-emerald-600">/{a.max_marks}</span></p>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm text-xs font-bold ${isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-slate-600'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {isOverdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                  </div>
                </div>

                {/* Upload Button */}
                {a.status === 'pending' && (
                  <button onClick={() => setActiveUploadId(a.id)}
                    className="w-full bg-slate-900 text-white py-4 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all">
                    <Upload className="w-5 h-5" />
                    Upload Work
                  </button>
                )}

                {a.status === 'submitted' && (
                  <div className="w-full bg-white text-slate-700 border border-slate-200 py-4 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                    <Check className="w-5 h-5 text-emerald-600" /> Awaiting Grading
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />

      {/* Upload Modal Overlay */}
      {activeUploadId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 pb-12 shadow-2xl animate-slide-up relative">
             <button onClick={() => { setActiveUploadId(null); setSelectedFiles([]); }} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
               ✕
             </button>
             <h3 className="text-2xl font-bold text-slate-900 mb-2">Submit Assignment</h3>
             <p className="text-sm text-slate-500 mb-6">Select your completed PDF, DOCX or ZIP files.</p>
             
             {!isUploading ? (
               <div className="flex flex-col gap-4">
                  {/* Drag and Drop Container */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                     <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                       <Upload className="w-8 h-8 text-slate-400 mb-3" />
                       <p className="text-sm font-bold text-slate-700">Drag & Drop or Click</p>
                       <p className="text-xs text-slate-400 mt-1">PDF, DOCX, ZIP (Max 10MB)</p>
                       <input type="file" className="hidden" accept=".pdf,.zip,.docx" multiple onChange={handleFileChange} />
                     </label>
                  </div>
                  
                  {/* Files List with Inline Previews */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative">
                           <button 
                             onClick={() => removeFile(idx)} 
                             className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                           <div className="flex items-center gap-3">
                             <FileText className="w-6 h-6 text-slate-400" />
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold text-slate-900 truncate pr-6">{file.name}</p>
                               <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                             </div>
                           </div>
                           

                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    disabled={selectedFiles.length === 0}
                    onClick={handleUploadSubmit}
                    className="w-full mt-4 bg-slate-900 text-white py-4 rounded-[20px] text-base font-bold shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    Confirm Submission
                  </button>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-8 gap-6">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * uploadProgress) / 100} className="text-slate-900 transition-all duration-300" />
                     </svg>
                     <span className="absolute text-xl font-bold text-slate-950">{uploadProgress}%</span>
                  </div>
                  <p className="text-sm font-bold text-slate-600 animate-pulse">Encrypting & Uploading to Server...</p>
               </div>
             )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Assignments;
