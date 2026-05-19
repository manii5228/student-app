import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X, Calendar, Flag } from 'lucide-react';

const AdminModeration = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([
    { id: 1, type: 'Event', title: 'Tech Symposium 2024', by: 'CSE Department', status: 'pending' },
    { id: 2, type: 'Club', title: 'AI Robotics Club', by: 'Dr. Alan Turing', status: 'pending' },
  ]);

  const handleAction = (id: number, action: 'approved' | 'rejected') => {
    setRequests(requests.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Moderation Queue</h1>
      </div>

      <div className="p-6">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No pending requests for approval.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${r.type === 'Event' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {r.type === 'Event' ? <Calendar className="w-5 h-5" /> : <Flag className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{r.type} Request</span>
                    <h3 className="font-bold text-slate-900 leading-tight">{r.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Requested by {r.by}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button onClick={() => handleAction(r.id, 'rejected')} className="flex-1 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => handleAction(r.id, 'approved')} className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-500/20">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModeration;
