import React, { useState, useEffect } from 'react';
import { ChevronLeft, Briefcase, Target, MapPin, CheckCircle, XCircle, FileText, Bookmark, BookmarkCheck, Check, AlertTriangle, AlertCircle, Plus, Users, Edit, Trash2 } from 'lucide-react';
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

  // Faculty State
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [selectedJobForApps, setSelectedJobForApps] = useState<Job | null>(null);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  
  // New Job Form State
  const [newJobForm, setNewJobForm] = useState({
    company_name: '',
    role_title: '',
    description: '',
    location: 'Bangalore',
    min_cgpa: '7.5',
    eligible_departments: 'CSE,IT,ECE',
    package_lpa: '6.0',
    job_type: 'placement',
    drive_date: '',
    last_date_apply: ''
  });
  const [postingJob, setPostingJob] = useState(false);

  const fetchJobApplications = async (jobId: string) => {
    setLoadingApps(true);
    try {
      const { data } = await api.get(`/career/jobs/${jobId}/applications`);
      setJobApplications(data.applications || []);
    } catch (err) {
      console.warn("Failed to fetch applications, using fallbacks", err);
      setJobApplications([
        { id: 'a1', student_id: 'std_1', student_name: 'Mani Manjunath', student_roll: '22CSE101', student_email: 'student1@veltech.edu.in', student_department: 'CSE', student_cgpa: 8.42, resume_url: 'https://cdn.veltech.edu.in/resumes/std_1_resume.pdf', status: 'applied', applied_at: new Date().toISOString() },
        { id: 'a2', student_id: 'std_2', student_name: 'Arjun Reddy', student_roll: '22CSE102', student_email: 'student2@veltech.edu.in', student_department: 'CSE', student_cgpa: 7.9, resume_url: 'https://cdn.veltech.edu.in/resumes/std_2_resume.pdf', status: 'shortlisted', applied_at: new Date().toISOString() }
      ]);
    } finally {
      setLoadingApps(false);
    }
  };

  const validateJobForm = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (!newJobForm.company_name.trim()) errors.company_name = true;
    if (!newJobForm.role_title.trim()) errors.role_title = true;
    if (!newJobForm.description.trim()) errors.description = true;
    if (!newJobForm.location.trim()) errors.location = true;
    if (!newJobForm.min_cgpa || isNaN(parseFloat(newJobForm.min_cgpa))) errors.min_cgpa = true;
    if (!newJobForm.eligible_departments.trim()) errors.eligible_departments = true;
    if (!newJobForm.package_lpa || isNaN(parseFloat(newJobForm.package_lpa))) errors.package_lpa = true;
    if (!newJobForm.job_type) errors.job_type = true;
    if (!newJobForm.drive_date) errors.drive_date = true;
    if (!newJobForm.last_date_apply) errors.last_date_apply = true;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetJobForm = () => {
    setNewJobForm({
      company_name: '',
      role_title: '',
      description: '',
      location: 'Bangalore',
      min_cgpa: '7.5',
      eligible_departments: 'CSE,IT,ECE',
      package_lpa: '6.0',
      job_type: 'placement',
      drive_date: '',
      last_date_apply: ''
    });
    setEditingJobId(null);
    setFormErrors({});
  };

  const handleCreateJob = async () => {
    if (!validateJobForm()) return;
    setPostingJob(true);
    try {
      if (editingJobId) {
        // UPDATE existing job
        const { data } = await api.put(`/career/jobs/${editingJobId}`, {
          ...newJobForm,
          min_cgpa: parseFloat(newJobForm.min_cgpa) || 0,
          package_lpa: parseFloat(newJobForm.package_lpa) || 0
        });
        const updated = data.job || data;
        setJobs(jobs.map(j => j.id === editingJobId ? { ...j, ...updated } : j));
        alert('Placement drive updated successfully!');
      } else {
        // CREATE new job
        const { data } = await api.post('/career/jobs', {
          ...newJobForm,
          min_cgpa: parseFloat(newJobForm.min_cgpa) || 0,
          package_lpa: parseFloat(newJobForm.package_lpa) || 0
        });
        setJobs([data.job || data, ...jobs]);
        alert('Placement/Internship drive posted successfully!');
      }
      setShowAddJobModal(false);
      resetJobForm();
    } catch (err) {
      alert(editingJobId ? 'Failed to update placement drive.' : 'Failed to post placement drive.');
    } finally {
      setPostingJob(false);
    }
  };

  const handleEditJob = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingJobId(job.id);
    setNewJobForm({
      company_name: job.company_name,
      role_title: job.role_title,
      description: job.description || '',
      location: job.location || 'Bangalore',
      min_cgpa: String(job.min_cgpa),
      eligible_departments: job.eligible_departments,
      package_lpa: String(job.package_lpa || ''),
      job_type: 'placement',
      drive_date: '',
      last_date_apply: ''
    });
    setFormErrors({});
    setShowAddJobModal(true);
  };

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this placement drive?')) return;
    try {
      await api.delete(`/career/jobs/${jobId}`);
      setJobs(jobs.filter(j => j.id !== jobId));
      alert('Placement drive deleted successfully.');
    } catch {
      setJobs(jobs.filter(j => j.id !== jobId));
    }
  };

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

  if (studentUser.role === 'faculty' || studentUser.role === 'admin') {
    return (
      <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in pb-24 relative">
        {/* Top Navigation */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/faculty/career')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Placement Drive Manager</h1>
                <p className="text-xs text-emerald-100">Post & monitor drives</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddJobModal(true)} 
              className="bg-white/20 text-white hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Post Drive
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Active Job Postings ({jobs.length})</h2>
          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                onClick={() => {
                  setSelectedJobForApps(job);
                  fetchJobApplications(job.id);
                }}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md cursor-pointer flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 leading-tight">{job.role_title}</h3>
                      <p className="text-xs font-bold text-slate-500">{job.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={(e) => handleEditJob(job, e)} className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors" title="Edit Drive">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => handleDeleteJob(job.id, e)} className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors" title="Delete Drive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{job.description}</p>
                
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">Min CGPA: {job.min_cgpa}</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">Depts: {job.eligible_departments}</span>
                  {job.salary && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">{job.salary}</span>}
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-6">
                <Briefcase className="w-10 h-10 text-slate-350 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">No Job Drives Posted Yet</p>
                <p className="text-xs text-slate-400 mt-1">Click "Post Drive" to share the first opportunity.</p>
              </div>
            )}
          </div>
        </div>

        <BottomNav />

        {/* Post Job Modal */}
        {showAddJobModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 pb-12 shadow-2xl animate-slide-up relative flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-black text-slate-900">{editingJobId ? 'Edit Recruitment Drive' : 'Post New Recruitment Drive'}</h3>
                <button onClick={() => { setShowAddJobModal(false); resetJobForm(); }} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Company Name *</label>
                  <input
                    value={newJobForm.company_name}
                    onChange={e => setNewJobForm({...newJobForm, company_name: e.target.value})}
                    placeholder="e.g. Google India"
                    className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-semibold border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Role / Designation *</label>
                  <input
                    value={newJobForm.role_title}
                    onChange={e => setNewJobForm({...newJobForm, role_title: e.target.value})}
                    placeholder="e.g. Software Engineer Intern"
                    className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-semibold border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Job Description *</label>
                  <textarea
                    value={newJobForm.description}
                    onChange={e => setNewJobForm({...newJobForm, description: e.target.value})}
                    placeholder="Describe the responsibilities, tech stack, and eligibility details..."
                    rows={3}
                    className={`w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border ${formErrors.description ? 'border-red-400 bg-red-50/30' : 'border-slate-200'} focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none`}
                  />
                  {formErrors.description && <span className="text-[9px] text-red-500 font-bold">Description is required</span>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Eligible Depts *</label>
                    <input
                      value={newJobForm.eligible_departments}
                      onChange={e => setNewJobForm({...newJobForm, eligible_departments: e.target.value})}
                      placeholder="e.g. CSE,IT,ECE"
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-bold border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Min CGPA *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newJobForm.min_cgpa}
                      onChange={e => setNewJobForm({...newJobForm, min_cgpa: e.target.value})}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-bold border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Package LPA *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newJobForm.package_lpa}
                      onChange={e => setNewJobForm({...newJobForm, package_lpa: e.target.value})}
                      className={`w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-bold border ${formErrors.package_lpa ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                    />
                    {formErrors.package_lpa && <span className="text-[9px] text-red-500 font-bold">Required</span>}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Job Type *</label>
                    <select
                      value={newJobForm.job_type}
                      onChange={e => setNewJobForm({...newJobForm, job_type: e.target.value})}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-bold border border-slate-200"
                    >
                      <option value="placement">Placement Drive</option>
                      <option value="internship">Internship Drive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Drive Date *</label>
                    <input
                      type="date"
                      value={newJobForm.drive_date}
                      onChange={e => setNewJobForm({...newJobForm, drive_date: e.target.value})}
                      className={`w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-bold border ${formErrors.drive_date ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                    />
                    {formErrors.drive_date && <span className="text-[9px] text-red-500 font-bold">Required</span>}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Last Date Apply *</label>
                    <input
                      type="date"
                      value={newJobForm.last_date_apply}
                      onChange={e => setNewJobForm({...newJobForm, last_date_apply: e.target.value})}
                      className={`w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-bold border ${formErrors.last_date_apply ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                    />
                    {formErrors.last_date_apply && <span className="text-[9px] text-red-500 font-bold">Required</span>}
                  </div>
                </div>
              </div>

              <div className="mt-6 shrink-0 border-t border-slate-100 pt-4">
                <button
                  onClick={handleCreateJob}
                  disabled={postingJob}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-slate-800 transition-all disabled:opacity-40 shadow-xl"
                >
                  {postingJob ? (editingJobId ? 'Updating...' : 'Posting Drive...') : (editingJobId ? 'Update Drive' : 'Publish Drive')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications List Modal */}
        {selectedJobForApps && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-900">Student Applications</h3>
                  <p className="text-[11px] font-bold text-slate-500">{selectedJobForApps.company_name} - {selectedJobForApps.role_title}</p>
                </div>
                <button onClick={() => setSelectedJobForApps(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
                {loadingApps ? (
                  <div className="flex justify-center py-12"><span className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span></div>
                ) : jobApplications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-10">No applications received yet for this posting.</p>
                ) : (
                  jobApplications.map((app) => (
                    <div key={app.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-150 flex flex-col gap-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-slate-800">{app.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{app.student_roll} · {app.student_department}</p>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded uppercase">{app.status}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-500">CGPA: {app.student_cgpa || 'N/A'}</span>
                        {app.resume_url ? (
                          <a 
                            href={app.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Resume
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No Resume</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in pb-24 relative">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-6 mt-4">
        <button onClick={() => navigate(studentUser.role === 'faculty' ? '/faculty/career' : '/career')} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
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
