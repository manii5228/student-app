import React, { useState } from 'react';
import { ChevronLeft, Briefcase, Target, MapPin, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const MOCK_STUDENT = { cgpa: 8.75, dept: 'CSE' };

const JOBS = [
  { id: '1', company: 'Google', role: 'Software Engineer', location: 'Bangalore', min_cgpa: 9.0, depts: ['CSE', 'IT'], salary: '24 LPA' },
  { id: '2', company: 'Amazon', role: 'SDE-1', location: 'Hyderabad', min_cgpa: 8.5, depts: ['CSE', 'IT', 'ECE'], salary: '21 LPA' },
  { id: '3', company: 'Deloitte', role: 'Analyst', location: 'Mumbai', min_cgpa: 7.5, depts: ['CSE', 'IT', 'ECE', 'EEE', 'MECH'], salary: '8 LPA' },
  { id: '4', company: 'TCS', role: 'Digital Profile', location: 'Chennai', min_cgpa: 8.0, depts: ['ECE', 'EEE'], salary: '7 LPA' },
];

const JobPortal = () => {
  const navigate = useNavigate();
  const [applied, setApplied] = useState<string[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeJob = JOBS.find(j => j.id === activeJobId);

  const handleApplyClick = (jobId: string) => {
    setActiveJobId(jobId);
  };

  const handleApplicationSubmit = () => {
    if (!resumeFile || !activeJobId) return;
    setIsSubmitting(true);
    
    // Simulate API request
    setTimeout(() => {
      setApplied([...applied, activeJobId]);
      setIsSubmitting(false);
      setSuccessToast(`Application sent to ${activeJob?.company}!`);
      setActiveJobId(null);
      setResumeFile(null);
      setCoverLetter('');
      
      setTimeout(() => setSuccessToast(null), 4000);
    }, 2000);
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in pb-10 relative">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-6 mt-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
          <Target className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="px-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Title Section */}
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Job Portal</h1>
          <div className="flex gap-2 items-center mt-2">
             <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">CGPA: {MOCK_STUDENT.cgpa}</span>
             <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{MOCK_STUDENT.dept}</span>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-[24px] p-4 flex items-start gap-3 shadow-sm animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
               <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-1">
              <p className="text-sm font-bold text-emerald-800">{successToast}</p>
            </div>
          </div>
        )}

        {/* Job List Bento Grid */}
        <div className="flex flex-col gap-4 mb-8">
          {JOBS.map((job, idx) => {
            const meetsCgpa = MOCK_STUDENT.cgpa >= job.min_cgpa;
            const meetsDept = job.depts.includes(MOCK_STUDENT.dept);
            const isEligible = meetsCgpa && meetsDept;
            const isApplied = applied.includes(job.id);
            
            let reason = '';
            if (!meetsCgpa) reason = `Min CGPA ${job.min_cgpa}`;
            else if (!meetsDept) reason = `${MOCK_STUDENT.dept} excluded`;

            const colors = ['bg-app-blue', 'bg-app-purple', 'bg-slate-100', 'bg-amber-50'];
            const bgClass = colors[idx % colors.length];

            return (
              <div key={job.id} className={`${bgClass} rounded-[32px] p-6 shadow-sm flex flex-col`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-[20px] bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
                      <Briefcase className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{job.role}</h3>
                      <p className="text-sm text-slate-600 font-medium">{job.company}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                    <Target className="w-3.5 h-3.5" /> Min {job.min_cgpa}
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                    ₹ {job.salary}
                  </div>
                </div>

                {isEligible ? (
                  <button 
                    disabled={isApplied}
                    onClick={() => handleApplyClick(job.id)}
                    className={`w-full py-4 rounded-[20px] text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      isApplied 
                        ? 'bg-emerald-500 text-white shadow-md' 
                        : 'bg-app-dark text-white shadow-xl hover:bg-slate-800 active:scale-[0.98]'
                    }`}
                  >
                    {isApplied ? <><CheckCircle className="w-5 h-5" /> Application Sent</> : 'Apply Now'}
                  </button>
                ) : (
                  <div className="w-full bg-white/40 text-slate-500 py-4 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                    <XCircle className="w-5 h-5 text-red-400" />
                    {reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />

      {/* Application Modal Overlay */}
      {activeJobId && activeJob && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 pb-12 shadow-2xl animate-slide-up relative flex flex-col max-h-[85vh]">
             <button onClick={() => { setActiveJobId(null); setResumeFile(null); }} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
               ✕
             </button>
             
             <div className="mb-6">
               <h3 className="text-2xl font-bold text-slate-900">Apply to {activeJob.company}</h3>
               <p className="text-sm text-slate-500 mt-1">{activeJob.role}</p>
             </div>
             
             <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-5">
               
               {/* Resume Upload */}
               <div>
                 <label className="text-sm font-bold text-slate-700 mb-2 block">Upload Resume (PDF)</label>
                 <label className={`border-2 border-dashed rounded-[24px] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${resumeFile ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <FileText className={`w-8 h-8 mb-2 ${resumeFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <p className={`text-sm font-bold ${resumeFile ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {resumeFile ? resumeFile.name : 'Tap to select resume'}
                    </p>
                    <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setResumeFile(e.target.files[0]);
                    }} />
                 </label>
               </div>

               {/* Cover Letter */}
               <div>
                 <label className="text-sm font-bold text-slate-700 mb-2 block">Why should we hire you?</label>
                 <textarea 
                   value={coverLetter}
                   onChange={(e) => setCoverLetter(e.target.value)}
                   placeholder="Write a brief cover letter..."
                   className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-app-accent focus:bg-white transition-all h-32 resize-none"
                 />
               </div>

             </div>

             <div className="mt-6 pt-2">
                <button 
                  disabled={!resumeFile || isSubmitting}
                  onClick={handleApplicationSubmit}
                  className="w-full bg-app-accent text-white py-4 rounded-[20px] text-base font-bold shadow-xl hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Submitting...</>
                  ) : (
                    'Submit Application'
                  )}
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobPortal;
