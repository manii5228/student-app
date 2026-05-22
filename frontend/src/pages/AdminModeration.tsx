import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X, Calendar, Flag, Loader2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface ModerationItem {
  id: string;
  type: 'Event' | 'Club';
  title: string;
  by: string;
  description?: string;
  event_type?: string;
}

const AdminModeration = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      // Fetch pending (unapproved) events from backend
      const { data } = await api.get('/campus/events', { params: { pending: 'true' } });
      const items: ModerationItem[] = (data.events || []).map((e: any) => ({
        id: e.id,
        type: 'Event' as const,
        title: e.title,
        by: e.organizer_id || 'Unknown',
        description: e.description,
        event_type: e.event_type,
      }));
      setRequests(items);
    } catch (error) {
      console.warn('Failed to fetch pending items:', error);
    }
    setLoading(false);
  };

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActing(id);
    try {
      if (action === 'approved') {
        await api.post(`/campus/events/${id}/approve`);
      } else {
        await api.post(`/campus/events/${id}/reject`);
      }
      // Remove from local list after successful action
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.warn(`Failed to ${action} item:`, error);
    }
    setActing(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Moderation Queue</h1>
          <p className="text-xs text-slate-500">{requests.length} pending request{requests.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">All Clear</h2>
            <p className="text-sm text-slate-500 mt-1">No pending requests for approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${r.type === 'Event' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {r.type === 'Event' ? <Calendar className="w-5 h-5" /> : <Flag className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{r.type} Request</span>
                    <h3 className="font-bold text-slate-900 leading-tight">{r.title}</h3>
                    {r.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>}
                    {r.event_type && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{r.event_type}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(r.id, 'rejected')}
                    disabled={acting === r.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleAction(r.id, 'approved')}
                    disabled={acting === r.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-500/20 disabled:opacity-50"
                  >
                    {acting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default AdminModeration;
