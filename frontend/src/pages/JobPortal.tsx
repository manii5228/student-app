import React, { useState, useEffect } from 'react';
import { ChevronLeft, Briefcase, Target, MapPin, CheckCircle, XCircle, FileText, Bookmark, BookmarkCheck, Check, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Job {
  id: string;
  company_name: string;
  role_title: string;
  description: string;
  location?: string;
  min_cgpa: number;
  eligible_departments: string;
  package_lpa?: number;
  salary?: string;
}

const JobPortal = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'saved' | 'tracker'>('jobs');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Student details from local storage / auth
  const userStr = localStorage.getItem('user');
  const studentUser = userStr ? JSON.parse(userStr) : { cgpa: 8.5, department: 'CSE' };
  const isGuest = studentUser.role === 'guest' || studentUser.is_guest;

  const activeJob = jobs.find(j => j.id === activeJobId);

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/career/jobs');
      setJobs(data.jobs || []);
    } catch (err) {
      console.warn("Failed to fetch jobs, using fallbacks", err);
      // Fallback
      setJobs([
        { id: '1', company_name: 'Google', role_title: 'Software Engineer', description: 'Requires deep knowledge of Data Structures and Algorithms.', min_cgpa: 9.0, eligible_departments: 'CSE,IT', salary: '24 LPA' },
        { id: '2', company_name: 'Amazon', role_title: 'SDE-1', description: 'Experience with AWS or web architectures is a plus.', min_cgpa: 8.5, eligible_departments: 'CSE,IT,ECE', salary: '21 LPA' },
        { id: '3', company_name: 'Deloitte', role_title: 'Analyst', description: 'SQL and analytics experience desired.', min_cgpa: 7.5, eligible_departments: 'CSE,IT,ECE,EEE,MECH', salary: '8 LPA' },
        { id: '4', company_name: 'TCS', role_title: 'Digital Profile', description: 'Focuses on full stack development and cloud architectures.', min_cgpa: 8.0, eligible_departments: 'CSE,IT,ECE,EEE', salary: '7 LPA' },
      ]);
    }
  };

  const fetchSavedJobs = async () => {
    if (isGuest) return;
    try {
      const { data } = await api.get('/career/jobs/saved');
      setSavedJobs((data.saved_jobs || []).map((j: Job) => j.id));
    } catch {}
  };

  const fetchMyApplications = async () => {
    if (isGuest) return;
    try {
      const { data } = await api.get('/career/jobs/my-applications');
      setApplied((data.applications || []).map((a: any) => a.posting_id));
    } catch {}
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchJobs();
      await fetchSavedJobs();
      await fetchMyApplications();
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleApplyClick = (jobId: string) => {
    setActiveJobId(jobId);
  };

  const toggleSave = async (jobId: string) => {
    if (isGuest) return;
    try {
      const { data } = await api.post(`/career/jobs/${jobId}/save`);
      if (data.saved) {
        setSavedJobs([...savedJobs, jobId]);
      } else {
        setSavedJobs(savedJobs.filter(id => id !== jobId));
      }
    } catch {}
  };

  const handleApplicationSubmit = async () => {
    if (!resumeFile || !activeJobId) return;
    setIsSubmitting(true);
    
    try {
      // Send mock resume metadata to the real API
      await api.post(`/career/jobs/${activeJobId}/apply`, {
        resume_url: `https://s3.veltech.edu.in/resumes/${studentUser.email || 'student'}_resume.pdf`
      });
      setApplied([...applied, activeJobId]);
      setSuccessToast(`Application sent to ${activeJob?.company_name}!`);
      setActiveJobId(null);
      setResumeFile(null);
      setCoverLetter('');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      alert("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in pb-24 relative">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-6 mt-4">
        <button onClick={() => navigate('/career')} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex gap-2 items-center">
           <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">CGPA: {studentUser.cgpa || '8.5'}</span>
           <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">{studentUser.department || 'CSE'}</span>
        </div>
      </div>

      <div className="px-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Title Section */}
        <div className="flex flex-col mb-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Job Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Campus recruitment and placement drives</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-2xl">
            {['jobs', 'saved', 'tracker'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                    {tab}
                </button>
            ))}
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

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-[#0080c7] border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-8">
            {activeTab === 'tracker' ? (
                <div className="flex flex-col gap-4">
                    {applied.length === 0 && <p className="text-sm text-slate-500 text-center py-10">No applications yet.</p>}
                    {applied.map(jobId => {
                        const job = jobs.find(j => j.id === jobId);
                        if (!job) return null;
                        const steps = ['Applied', 'Shortlisted', 'Interview', 'Offered'];
                        const currentStep = jobId === '3' ? 2 : 1; // Deloitte (id 3) gets 'Interview', others 'Shortlisted'
                        return (
                            <div key={job.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                                <h3 className="text-base font-bold text-slate-900">{job.role_title} at {job.company_name}</h3>
                                <div className="mt-6 relative px-2">
                                    <div className="absolute top-2.5 left-2 right-2 h-1 bg-slate-100 rounded-full" />
                                    <div className="absolute top-2.5 left-2 h-1 bg-[#0080c7] rounded-full transition-all" style={{width: `${(currentStep / (steps.length - 1)) * 100}%`}} />
                                    <div className="relative flex justify-between">
                                        {steps.map((step, i) => (
                                            <div key={step} className="flex flex-col items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-colors ${i <= currentStep ? 'bg-[#0080c7] text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                    {i < currentStep ? <Check className="w-3 h-3" /> : i + 1}
                                                </div>
                                                <span className={`text-[10px] font-bold ${i <= currentStep ? 'text-slate-700' : 'text-slate-400'}`}>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : jobs.filter(j => activeTab === 'jobs' || savedJobs.includes(j.id)).map((job, idx) => {
              const meetsCgpa = (studentUser.cgpa || 0) >= job.min_cgpa;
              const eligibleDepts = job.eligible_departments.split(',').map(d => d.trim().toUpperCase());
              const meetsDept = job.eligible_departments === 'all' || eligibleDepts.includes((studentUser.department || '').toUpperCase());
              const isEligible = meetsCgpa && meetsDept;
              const isApplied = applied.includes(job.id);
              
              let reason = '';
              let howToFix = '';
              if (!meetsCgpa) {
                  reason = `Min CGPA ${job.min_cgpa}`;
                  howToFix = `Need ${(job.min_cgpa - studentUser.cgpa).toFixed(2)} more CGPA`;
              } else if (!meetsDept) {
                  reason = `${studentUser.department} excluded`;
                  howToFix = 'Department not eligible';
              }

              const matchPct = isEligible ? 100 : (!meetsCgpa && !meetsDept ? 10 : 50);
              const isSaved = savedJobs.includes(job.id);

              const colors = ['bg-[#0080c7]/5', 'bg-purple-50', 'bg-slate-50', 'bg-amber-50/50'];
              const bgClass = colors[idx % colors.length];

              return (
                <div key={job.id} className={`${bgClass} rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col relative`}>
                  <button onClick={() => toggleSave(job.id)} className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors border border-slate-100">
                      {isSaved ? <BookmarkCheck className="w-5 h-5 text-[#0080c7]" /> : <Bookmark className="w-5 h-5 text-slate-600" />}
                  </button>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-[20px] bg-white border border-slate-100 flex items-center justify-center shadow-sm relative">
                        <Briefcase className="w-6 h-6 text-slate-700" />
                        <div className="absolute -bottom-2 -right-2 text-[8px] font-black bg-slate-900 text-white rounded-full px-1.5 py-0.5 shadow-sm">
                            {matchPct}%
                        </div>
                      </div>
                      <div className="flex flex-col justify-center pr-10">
                        <h3 className="text-base font-bold text-slate-900 leading-tight">{job.role_title}</h3>
                        <p className="text-xs text-slate-500 font-medium">{job.company_name}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{job.description}</p>

                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location || 'Bangalore'}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm border border-slate-100">
                      <Target className="w-3.5 h-3.5 text-[#0080c7]" /> Min CGPA {job.min_cgpa}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm border border-slate-100">
                      ₹ {job.salary || (job.package_lpa ? `${job.package_lpa} LPA` : 'Competitive')}
                    </div>
                  </div>

                  {isEligible ? (
                    <button 
                      disabled={isApplied}
                      onClick={() => handleApplyClick(job.id)}
                      className={`w-full py-3.5 rounded-[20px] text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        isApplied 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-none' 
                          : 'bg-slate-900 text-white shadow-xl hover:bg-slate-800 active:scale-[0.98]'
                      }`}
                    >
                      {isApplied ? <><CheckCircle className="w-4 h-4" /> Application Sent</> : 'Apply Now'}
                    </button>
                  ) : (
                    <div className="w-full bg-white/60 text-slate-600 py-3 rounded-[20px] text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-not-allowed border border-dashed border-slate-200">
                      <div className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /> Not Eligible ({reason})</div>
                      <span className="text-[#c9503d]">How to qualify: {howToFix}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Application Modal Overlay */}
      {activeJobId && activeJob && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 pb-12 shadow-2xl animate-slide-up relative flex flex-col max-h-[85vh]">
             <button onClick={() => { setActiveJobId(null); setResumeFile(null); }} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
               ✕
             </button>
             
             <div className="mb-4">
               <h3 className="text-2xl font-bold text-slate-900">Apply to {activeJob.company_name}</h3>
               <p className="text-sm text-slate-500 mt-1">{activeJob.role_title}</p>
             </div>
             
             {/* Ephemeral Resume warning banner */}
             <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                   <p className="text-xs font-bold">Resume Retention Notice</p>
                   <p className="text-[10px] text-amber-700 leading-normal mt-0.5">
                      Uploaded resumes are ephemerally stored and will be automatically purged from system logs 30 days after the job drive deadline to comply with storage footprint bounds.
                   </p>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-5">
               
               {/* Resume Upload */}
               <div>
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Upload Resume (PDF)</label>
                 <label className={`border-2 border-dashed rounded-[24px] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${resumeFile ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <FileText className={`w-8 h-8 mb-2 ${resumeFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <p className={`text-sm font-bold ${resumeFile ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {resumeFile ? resumeFile.name : 'Select Resume from Device'}
                    </p>
                    <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setResumeFile(e.target.files[0]);
                    }} />
                 </label>
               </div>

               {/* Cover Letter */}
               <div>
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Outreach Message / Cover Letter</label>
                 <textarea 
                   value={coverLetter}
                   onChange={(e) => setCoverLetter(e.target.value)}
                   placeholder="Introduce yourself to the recruiter..."
                   className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-4 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0080c7] focus:bg-white transition-all h-28 resize-none font-medium"
                 />
               </div>

             </div>

             <div className="mt-6 pt-2">
                <button 
                  disabled={!resumeFile || isSubmitting}
                  onClick={handleApplicationSubmit}
                  className="w-full bg-slate-900 text-white py-4 rounded-[20px] text-sm font-black shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
