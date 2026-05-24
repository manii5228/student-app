import React, { useState, useEffect } from 'react';
import { ChevronLeft, Bell, Pin, Clock, AlertTriangle, Plus, Filter, CheckCheck, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
  target_audience: string;
  is_pinned: boolean;
  created_at: string;
  is_read?: boolean;
  read_count?: number;
}

const NoticeBoard = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'pinned'>('all');
  
  // To simulate checking if user is admin/faculty, we will just use a mock state for now.
  // In a real app, this would come from the auth context.
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isFacultyOrAdmin = user?.role === 'admin' || user?.role === 'faculty';

  const [showModal, setShowModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', priority: 'normal', is_pinned: false });

  const fetchNotices = async () => {
    try {
      const { data } = await api.get('/campus/notices');
      setNotices(data.notices);
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/campus/notices', newNotice);
      setShowModal(false);
      setNewNotice({ title: '', content: '', priority: 'normal', is_pinned: false });
      fetchNotices(); // Refresh the board
    } catch (err) {
      console.error('Failed to create notice', err);
      alert('Failed to post notice. Are you admin/faculty?');
    }
  };

  const filteredNotices = notices.filter(n => {
    if (filter === 'high') return n.priority === 'high';
    if (filter === 'pinned') return n.is_pinned;
    return true;
  });

  const handleMarkAsRead = async (noticeId: string) => {
    const notice = notices.find(n => n.id === noticeId);
    if (!notice || notice.is_read) return;

    // Optimistic update
    setNotices(prev => prev.map(n => n.id === noticeId ? { ...n, is_read: true, read_count: (n.read_count || 0) + 1 } : n));
    try {
        await api.post(`/campus/notices/${noticeId}/read`);
    } catch (err) {
        console.error('Failed to mark as read', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-600 border-red-200';
    if (priority === 'low') return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    return 'bg-blue-100 text-blue-600 border-blue-200';
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-red-500 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shadow-sm">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Notice Board</h1>
              <p className="text-xs text-red-100">Official Announcements</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const next = filter === 'all' ? 'pinned' : filter === 'pinned' ? 'high' : 'all';
                setFilter(next);
              }}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shadow-sm hover:bg-white/30 transition-all"
            >
              <Filter className="w-4 h-4" />
            </button>
            
            {isFacultyOrAdmin && (
              <button 
                onClick={() => setShowModal(true)}
                className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No Announcements</h2>
            <p className="text-sm text-slate-500 mt-1">You are all caught up!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredNotices.map((notice) => (
              <div key={notice.id} onClick={() => handleMarkAsRead(notice.id)} className={`bg-white rounded-[24px] p-5 shadow-sm border ${notice.is_pinned ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'} flex flex-col relative animate-slide-up cursor-pointer transition-all active:scale-[0.98]`}>
                
                {/* Pinned Badge */}
                {notice.is_pinned && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-md rotate-12">
                    <Pin className="w-4 h-4" />
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${getPriorityColor(notice.priority)}`}>
                    {notice.priority}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notice.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 pr-4">{notice.title}</h3>
                
                <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                  {notice.content}
                </p>

                <div className="flex justify-end mt-2">
                    {isFacultyOrAdmin ? (
                        <div className="text-[10px] flex items-center gap-1 text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-md">
                            <Eye className="w-3 h-3" /> {notice.read_count || 0}
                        </div>
                    ) : (
                        <CheckCheck className={`w-4 h-4 ${notice.is_read ? 'text-[#0080c7]' : 'text-slate-300'}`} />
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Admin Notice Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 pb-10 shadow-2xl animate-slide-up relative flex flex-col">
             <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
               ✕
             </button>
             
             <div className="mb-6 pr-12">
               <h3 className="text-2xl font-bold text-slate-900">Post Announcement</h3>
               <p className="text-sm text-slate-500 mt-1">Broadcast to all students instantly.</p>
             </div>
             
             <form onSubmit={handleCreateNotice} className="flex flex-col gap-4">
               <div>
                 <input 
                   required
                   value={newNotice.title}
                   onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                   className="w-full bg-slate-50 border border-slate-200 rounded-[16px] p-4 text-base font-bold text-slate-800 focus:outline-none focus:border-red-400 focus:bg-white transition-all"
                   placeholder="Notice Title"
                 />
               </div>

               <div>
                 <textarea 
                   required
                   value={newNotice.content}
                   onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                   className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 text-sm text-slate-800 focus:outline-none focus:border-red-400 focus:bg-white transition-all resize-none h-32 font-medium"
                   placeholder="Write the full announcement details here..."
                 />
               </div>
               
               <div className="flex gap-4 items-center">
                 <div className="flex-1">
                   <select 
                     value={newNotice.priority}
                     onChange={e => setNewNotice({...newNotice, priority: e.target.value as any})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-[16px] p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-red-400 appearance-none"
                   >
                     <option value="normal">Normal Priority</option>
                     <option value="high">High Priority</option>
                     <option value="low">Low Priority</option>
                   </select>
                 </div>
                 
                 <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                   <input 
                     type="checkbox" 
                     checked={newNotice.is_pinned}
                     onChange={e => setNewNotice({...newNotice, is_pinned: e.target.checked})}
                     className="w-5 h-5 rounded border-slate-300 text-red-500 focus:ring-red-500"
                   />
                   Pin to Top
                 </label>
               </div>

               <button 
                  type="submit"
                  className="mt-4 w-full bg-red-500 text-white py-4 rounded-[20px] text-base font-bold shadow-xl shadow-red-500/20 hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                >
                  Broadcast Notice
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
