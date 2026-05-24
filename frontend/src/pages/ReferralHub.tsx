import React, { useState } from 'react';
import { ChevronLeft, Share2, MessageSquare, Link, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const ALUMNI = [
  { id: '1', name: 'Rahul Sharma', company: 'Microsoft', role: 'SDE-2', batch: '2022', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Priya Patel', company: 'Amazon', role: 'Data Scientist', batch: '2023', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Arjun Reddy', company: 'Atlassian', role: 'Frontend Eng.', batch: '2021', avatar: 'https://i.pravatar.cc/150?u=3' },
];

const ReferralHub = () => {
  const navigate = useNavigate();
  const [requestsLeft, setRequestsLeft] = useState(3);
  const [requested, setRequested] = useState<string[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);

  const handleRequest = (id: string) => {
    if (requestsLeft <= 0) return;
    
    setRequesting(id);
    setTimeout(() => {
      setRequested([...requested, id]);
      setRequestsLeft(requestsLeft - 1);
      setRequesting(null);
    }, 1500);
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-pink-600 p-6 pt-12 shadow-md relative z-20 rounded-b-[40px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Referral Hub</h1>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 shadow-xl transform translate-y-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Limit</p>
            <h2 className="text-2xl font-black text-slate-800">{requestsLeft} <span className="text-sm font-bold text-slate-500">requests left</span></h2>
          </div>
          <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
            <Share2 className="w-6 h-6 text-pink-500" />
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="px-6 pt-12 mt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">
            Requests are limited to 3 per month to prevent spamming alumni. Please ensure your resume is up-to-date before requesting.
          </p>
        </div>
      </div>

      {/* Alumni List */}
      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Available for Referrals</h3>
        
        <div className="flex flex-col gap-4">
          {ALUMNI.map(alumnus => {
            const isRequested = requested.includes(alumnus.id);
            const isRequesting = requesting === alumnus.id;
            
            return (
              <div key={alumnus.id} className="bg-white rounded-[28px] p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                <img src={alumnus.avatar} alt={alumnus.name} className="w-16 h-16 rounded-full object-cover border-4 border-slate-50" />
                
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{alumnus.name}</h4>
                  <p className="text-xs text-pink-600 font-bold">{alumnus.role} @ {alumnus.company}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Batch of {alumnus.batch}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
                    <Link className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleRequest(alumnus.id)}
                    disabled={isRequested || isRequesting || requestsLeft <= 0}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isRequested ? 'bg-emerald-50 text-emerald-500' :
                      isRequesting ? 'bg-pink-100 text-pink-400' :
                      requestsLeft <= 0 ? 'bg-slate-100 text-slate-400' :
                      'bg-pink-500 text-white shadow-lg hover:bg-pink-600 active:scale-95'
                    }`}
                  >
                    {isRequesting ? <span className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin"></span> :
                     isRequested ? <Clock className="w-4 h-4" /> :
                     <MessageSquare className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ReferralHub;
