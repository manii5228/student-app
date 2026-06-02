import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, Link, AlertCircle, Clock, CheckCircle2, Award, Search, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Alumni {
  id: string;
  name: string;
  batch_year: number;
  department: string;
  company: string | null;
  designation: string | null;
  is_open_to_referral: boolean;
}

interface ReferralRequest {
  id: string;
  alumnusId: string;
  alumnusName: string;
  company: string;
  role: string;
  message: string;
  requestedAt: string;
  replied: boolean;
  referred: boolean;
}

const ReferralHub = () => {
  const navigate = useNavigate();
  
  // State
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [searchCompany, setSearchCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'directory' | 'my-requests' | 'leaderboard'>('directory');
  
  // Local storage state for tracking student requests
  const [requestsLeft, setRequestsLeft] = useState<number>(() => {
    const saved = localStorage.getItem('referral_requests_left');
    return saved ? parseInt(saved, 10) : 3;
  });
  
  const [requests, setRequests] = useState<ReferralRequest[]>(() => {
    const saved = localStorage.getItem('referral_requests');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal State
  const [selectedAlumnus, setSelectedAlumnus] = useState<Alumni | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [creditWarning, setCreditWarning] = useState<string | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    fetchAlumni();
  }, []);

  useEffect(() => {
    localStorage.setItem('referral_requests_left', String(requestsLeft));
  }, [requestsLeft]);

  useEffect(() => {
    localStorage.setItem('referral_requests', JSON.stringify(requests));
  }, [requests]);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      // Fetch alumni open to referrals
      const { data } = await api.get('/career/alumni/referral-hub');
      setAlumniList(data.referral_alumni || []);
    } catch {
      // Fallback/offline
      setAlumniList([
        { id: '1', name: 'Rahul Sharma', batch_year: 2022, department: 'CSE', company: 'Microsoft', designation: 'SDE-2', is_open_to_referral: true },
        { id: '2', name: 'Priya Patel', batch_year: 2023, department: 'CSE', company: 'Amazon', designation: 'Data Scientist', is_open_to_referral: true },
        { id: '3', name: 'Arjun Reddy', batch_year: 2021, department: 'ECE', company: 'Atlassian', designation: 'Frontend Engineer', is_open_to_referral: true },
        { id: '4', name: 'Sneha Kumari', batch_year: 2022, department: 'CSE', company: 'Zoho', designation: 'Product Developer', is_open_to_referral: true },
        { id: '5', name: 'Vivek Mishra', batch_year: 2020, department: 'CSE', company: 'TCS', designation: 'Systems Engineer', is_open_to_referral: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/career/alumni?company=${encodeURIComponent(searchCompany)}`);
      setAlumniList(data.alumni || []);
    } catch {
      // Filter offline fallback
      if (!searchCompany.trim()) {
        fetchAlumni();
      } else {
        setAlumniList(prev => prev.filter(a => a.company?.toLowerCase().includes(searchCompany.toLowerCase())));
      }
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = (alumnus: Alumni) => {
    if (requestsLeft <= 0) {
      setCreditWarning(`You have reached your limit of 3 alumni referral requests for this month. Outreach limit resets on the 1st of next month.`);
      return;
    }
    setSelectedAlumnus(alumnus);
    
    // Auto-generate template outreach message
    const deptStr = user?.department || 'Engineering';
    const nameStr = user?.full_name || 'Student';
    const cgpaStr = user?.cgpa || '8.5';
    
    const template = `Dear ${alumnus.name},

Hope you are doing well. My name is ${nameStr}, and I am currently a student in the ${deptStr} department at Vel Tech. I am very interested in applying for a ${targetRole} role at ${alumnus.company || 'your company'}.

Having reviewed your career trajectory, I would be honored to get a referral from you or receive any advice you might have for preparation. My current CGPA is ${cgpaStr}.

Thank you for your time and guidance!

Best regards,
${nameStr}`;

    setCustomMessage(template);
  };

  const handleSendRequest = () => {
    if (!selectedAlumnus || requestsLeft <= 0) return;

    const newRequest: ReferralRequest = {
      id: 'req_' + Date.now(),
      alumnusId: selectedAlumnus.id,
      alumnusName: selectedAlumnus.name,
      company: selectedAlumnus.company || 'Target Company',
      role: targetRole,
      message: customMessage,
      requestedAt: new Date().toISOString().split('T')[0],
      replied: false,
      referred: false
    };

    setRequests([newRequest, ...requests]);
    setRequestsLeft(prev => prev - 1);
    setSelectedAlumnus(null);
    setTargetRole('Software Engineer');
    setSuccessMsg(`Outreach request sent to ${selectedAlumnus.name}!`);
  };

  // Toggle status for reply / referred
  const toggleStatus = (id: string, field: 'replied' | 'referred') => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        return { ...req, [field]: !req[field] };
      }
      return req;
    }));
  };

  // Static leaderboard of alumni contributions
  const leaderboard = [
    { name: 'Arjun Reddy', company: 'Atlassian', referralsCount: 15, batch: '2021', rank: 1 },
    { name: 'Priya Patel', company: 'Amazon', referralsCount: 12, batch: '2023', rank: 2 },
    { name: 'Rahul Sharma', company: 'Microsoft', referralsCount: 10, batch: '2022', rank: 3 },
    { name: 'Sneha Kumari', company: 'Zoho', referralsCount: 8, batch: '2022', rank: 4 },
    { name: 'Vivek Mishra', company: 'TCS', referralsCount: 7, batch: '2020', rank: 5 }
  ];

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-600 to-rose-700 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              if (user?.role === 'faculty') navigate('/faculty/career');
              else navigate('/career');
            }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Referral Hub</h1>
              <p className="text-xs text-pink-200">Connect with Vel Tech Alumni</p>
            </div>
          </div>

        </div>

        {/* Stats card inside header */}
        <div className="bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between mt-4 relative z-10 border border-pink-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Remaining Request Credits</p>
            <h2 className="text-2xl font-black text-slate-800">{requestsLeft} <span className="text-xs font-semibold text-slate-500">of 3 limit</span></h2>
          </div>
          <span className="text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-100">
            Resets Monthly
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 pb-2 shrink-0">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'directory' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500'
            }`}
          >
            Alumni Directory
          </button>
          <button
            onClick={() => setActiveTab('my-requests')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my-requests' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500'
            }`}
          >
            My Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'leaderboard' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500'
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* DIRECTORY TAB */}
        {activeTab === 'directory' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Rate limit warning if zero credits left */}
            {requestsLeft <= 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Rate Limit Reached</p>
                  <p className="font-medium mt-0.5 leading-relaxed">You have sent 3 requests this month. Please wait until next month to send more outreach messages to prevent spamming alumni.</p>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                value={searchCompany}
                onChange={e => setSearchCompany(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search alumni by company name..."
                className="bg-transparent text-slate-800 text-sm font-semibold placeholder:text-slate-400 flex-1 outline-none"
              />
              <button onClick={handleSearch} className="bg-pink-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">Search</button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <span className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : alumniList.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-6">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900">No Alumni Found</h3>
                <p className="text-xs text-slate-500 mt-1">We couldn't find any alumni matching your search.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {alumniList.map(alumnus => {
                  const alreadyRequested = requests.some(r => r.alumnusId === alumnus.id);
                  return (
                    <div key={alumnus.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {alumnus.name.split(' ').map(n => n[0]).join('')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{alumnus.name}</h4>
                        <p className="text-xs text-pink-600 font-bold truncate">
                          {alumnus.designation || 'Alumnus'} @ {alumnus.company || 'Open'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {alumnus.department} · Batch of {alumnus.batch_year}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => openRequestModal(alumnus)}
                          disabled={alreadyRequested}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            alreadyRequested 
                              ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                              : requestsLeft <= 0 
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' 
                                : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-100'
                          }`}
                        >
                          {alreadyRequested ? (
                            <>
                              <Clock className="w-3.5 h-3.5" /> Sent
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5" /> Ask Referral
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MY REQUESTS TAB */}
        {activeTab === 'my-requests' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {requests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-6">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900">No Outreach History</h3>
                <p className="text-xs text-slate-500 mt-1">You haven't requested any referrals yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map(req => (
                  <div key={req.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{req.alumnusName}</h4>
                        <p className="text-xs text-pink-600 font-bold mt-0.5">{req.role} · {req.company}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Sent on {req.requestedAt}</p>
                      </div>
                      
                      {/* Checkmarks / status indicators */}
                      <div className="flex gap-2">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${
                          req.replied 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          {req.replied ? 'Replied ✓' : 'Awaiting Reply'}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${
                          req.referred 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          {req.referred ? 'Referred ✓' : 'Pending Referral'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Outreach Message Sent</p>
                      <p className="text-[11px] text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">{req.message}</p>
                    </div>

                    {/* Status Triggers */}
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Update Status:</p>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                          <input 
                            type="checkbox" 
                            checked={req.replied} 
                            onChange={() => toggleStatus(req.id, 'replied')}
                            className="rounded text-pink-600 focus:ring-pink-500 w-3.5 h-3.5" 
                          />
                          Replied
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                          <input 
                            type="checkbox" 
                            checked={req.referred} 
                            onChange={() => toggleStatus(req.id, 'referred')}
                            className="rounded text-pink-600 focus:ring-pink-500 w-3.5 h-3.5" 
                          />
                          Referred
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-500" /> Alumni Referral Leaderboard
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Celebrating our top alumni contributors who help current students land interviews and referrals. A big thank you to our active mentors!
              </p>
            </div>

            <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 flex flex-col gap-2">
              {leaderboard.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {item.rank}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{item.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400">
                        {item.company} · Class of {item.batch}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100">
                      {item.referralsCount} Referrals
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Outreach Request Template Generator Modal */}
      {selectedAlumnus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-base font-black text-slate-900">Customize Outreach message</h3>
              <button onClick={() => setSelectedAlumnus(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Target Role</label>
                <input 
                  type="text" 
                  value={targetRole} 
                  onChange={e => setTargetRole(e.target.value)} 
                  placeholder="e.g. Software Engineer Intern, Data Analyst"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Verify Outreach Letter</label>
                <textarea
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 outline-none focus:border-pink-500 focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5 shrink-0">
              <button 
                onClick={() => setSelectedAlumnus(null)} 
                className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-100 rounded-2xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendRequest}
                className="flex-1 py-3.5 text-xs font-black text-white bg-pink-600 rounded-2xl hover:bg-pink-700 shadow-lg shadow-pink-500/10 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Request Sent</h3>
            <p className="text-xs font-semibold text-slate-600 mb-6 leading-relaxed">{successMsg}</p>
            <button 
              onClick={() => setSuccessMsg(null)} 
              className="w-full bg-pink-600 text-white py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-pink-500/20"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Credit Warning Modal */}
      {creditWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Request Limit Reached</h3>
            <p className="text-xs font-semibold text-slate-600 mb-6 leading-relaxed">{creditWarning}</p>
            <button 
              onClick={() => setCreditWarning(null)} 
              className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-slate-900/20"
            >
              Okay, Understood
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ReferralHub;
