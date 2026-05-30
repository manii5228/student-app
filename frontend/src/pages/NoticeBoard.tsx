import React, { useState, useEffect } from 'react';
import { ChevronLeft, Bell, Pin, Clock, Plus, Filter, CheckCheck, Eye, Edit3, FileText, Video, Image } from 'lucide-react';
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
  author_id: string;
  branch: string | null;
  year: number | null;
  section: string | null;
  media: string[];
  files: { name: string; url: string }[];
  created_at: string;
  is_read?: boolean;
  read_count?: number;
}

const NoticeBoard = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'pinned'>('all');
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isFacultyOrAdmin = user?.role === 'admin' || user?.role === 'faculty';

  const [showModal, setShowModal] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'high' | 'normal' | 'low',
    is_pinned: false,
    branch: '',
    year: '',
    section: '',
    mediaInput: '', // Comma separated image/video URLs
    filesInput: ''  // Comma separated file descriptions, format: Name|URL
  });

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

  const handleOpenCreate = () => {
    setEditingNoticeId(null);
    setForm({
      title: '',
      content: '',
      priority: 'normal',
      is_pinned: false,
      branch: '',
      year: '',
      section: '',
      mediaInput: '',
      filesInput: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (n: Notice, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoticeId(n.id);
    
    // Format media list back to input string
    const mediaStr = (n.media || []).join(', ');
    
    // Format files list back to input string
    const filesStr = (n.files || []).map(f => `${f.name}|${f.url}`).join(', ');

    setForm({
      title: n.title,
      content: n.content,
      priority: n.priority,
      is_pinned: n.is_pinned,
      branch: n.branch || '',
      year: n.year ? String(n.year) : '',
      section: n.section || '',
      mediaInput: mediaStr,
      filesInput: filesStr
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse media & files inputs
    const mediaList = form.mediaInput
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    const filesList = form.filesInput
      .split(',')
      .map(part => {
        const subparts = part.split('|');
        if (subparts.length >= 2) {
          return { name: subparts[0].trim(), url: subparts[1].trim() };
        }
        if (subparts[0].trim().length > 0) {
          return { name: subparts[0].trim(), url: 'https://veltech.edu.in' };
        }
        return null;
      })
      .filter((file): file is { name: string; url: string } => file !== null);

    const payload = {
      title: form.title,
      content: form.content,
      priority: form.priority,
      is_pinned: form.is_pinned,
      branch: form.branch || null,
      year: form.year ? parseInt(form.year) : null,
      section: form.section || null,
      media: mediaList,
      files: filesList
    };

    try {
      if (editingNoticeId) {
        await api.put(`/campus/notices/${editingNoticeId}`, payload);
        alert('Notice updated successfully!');
      } else {
        await api.post('/campus/notices', payload);
        alert('Notice posted successfully!');
      }
      setShowModal(false);
      fetchNotices(); // Refresh the board
    } catch (err) {
      console.error('Failed to submit notice', err);
      alert('Failed to submit notice. Make sure you are the original publisher.');
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
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const role = JSON.parse(localStorage.getItem('user') || '{}').role;
              if (role === 'faculty') navigate('/faculty');
              else if (role === 'admin') navigate('/admin');
              else if (window.history.length > 2) { navigate(-1); }
              else { navigate('/campus'); }
            }} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shadow-sm">
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
                onClick={handleOpenCreate}
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
            {filteredNotices.map((notice) => {
              const showEditButton = isFacultyOrAdmin && notice.author_id === user?.id;
              
              return (
                <div 
                  key={notice.id} 
                  onClick={() => handleMarkAsRead(notice.id)} 
                  className={`bg-white rounded-[24px] p-5 shadow-sm border ${notice.is_pinned ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'} flex flex-col relative animate-slide-up cursor-pointer transition-all active:scale-[0.99]`}
                >
                  {/* Pinned Badge */}
                  {notice.is_pinned && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-md rotate-12 z-10">
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
                    {(notice.branch || notice.year || notice.section) && (
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase max-w-[150px] truncate">
                        Target: {notice.branch || '*'}-{notice.year || '*'}-{notice.section || '*'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-base font-bold text-slate-900 leading-tight pr-4">{notice.title}</h3>
                    {showEditButton && (
                      <button 
                        onClick={(e) => handleOpenEdit(notice, e)}
                        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed mb-4">
                    {notice.content}
                  </p>

                  {/* Rich Media Slider / Carousel */}
                  {notice.media && notice.media.length > 0 && (
                    <div className="mb-4">
                      <div className="flex gap-2.5 overflow-x-auto py-1 hide-scrollbar snap-x snap-mandatory">
                        {notice.media.map((url, index) => {
                          const isVideo = url.toLowerCase().endsWith('.mp4') || url.includes('video');
                          return (
                            <div key={index} className="w-64 h-36 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/50 snap-start relative">
                              {isVideo ? (
                                <video src={url} controls className="w-full h-full object-cover" />
                              ) : (
                                <img src={url} alt={`Media ${index}`} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }} />
                              )}
                              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                                {isVideo ? <Video className="w-2.5 h-2.5 inline mr-1" /> : <Image className="w-2.5 h-2.5 inline mr-1" />}
                                {index + 1}/{notice.media.length}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* File Attachments (Scrollable list) */}
                  {notice.files && notice.files.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Attachments</p>
                      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        {notice.files.map((file, idx) => (
                          <a 
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 max-w-[200px]"
                          >
                            <FileText className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end items-center mt-auto border-t border-slate-50 pt-2">
                    {isFacultyOrAdmin ? (
                      <div className="text-[10px] flex items-center gap-1 text-slate-400 font-bold">
                        <Eye className="w-3 h-3" /> Seen by {notice.read_count || 0}
                      </div>
                    ) : (
                      <CheckCheck className={`w-4 h-4 ${notice.is_read ? 'text-[#0080c7]' : 'text-slate-300'}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Notice Creation/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 pb-10 shadow-2xl animate-slide-up relative flex flex-col max-h-[85vh] overflow-y-auto">
             <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
               ✕
             </button>
             
             <div className="mb-6 pr-12">
               <h3 className="text-2xl font-bold text-slate-900">{editingNoticeId ? 'Edit Announcement' : 'Post Announcement'}</h3>
               <p className="text-sm text-slate-500 mt-1">Broadcast official updates to targeted groups.</p>
             </div>
             
             <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Title</label>
                 <input 
                   required
                   value={form.title}
                   onChange={e => setForm({...form, title: e.target.value})}
                   className="w-full bg-slate-50 border border-slate-200 rounded-[16px] p-4 text-base font-bold text-slate-800 focus:outline-none focus:border-red-400 focus:bg-white transition-all"
                   placeholder="Notice Title"
                 />
               </div>

               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Content</label>
                 <textarea 
                   required
                   value={form.content}
                   onChange={e => setForm({...form, content: e.target.value})}
                   className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 text-sm text-slate-800 focus:outline-none focus:border-red-400 focus:bg-white transition-all resize-none h-28 font-medium"
                   placeholder="Write notice details..."
                 />
               </div>

               {/* Targeted Announcements */}
               <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col gap-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audience Filtering (Optional)</p>
                 <div className="grid grid-cols-3 gap-2">
                   <div>
                     <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Branch</label>
                     <select 
                       value={form.branch}
                       onChange={e => setForm({...form, branch: e.target.value})}
                       className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                     >
                       <option value="">All Branches</option>
                       <option value="CSE">CSE</option>
                       <option value="ECE">ECE</option>
                       <option value="MECH">MECH</option>
                       <option value="CIVIL">CIVIL</option>
                     </select>
                   </div>

                   <div>
                     <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Semester/Year</label>
                     <select 
                       value={form.year}
                       onChange={e => setForm({...form, year: e.target.value})}
                       className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                     >
                       <option value="">All Semesters</option>
                       <option value="1">1st Sem</option>
                       <option value="2">2nd Sem</option>
                       <option value="3">3rd Sem</option>
                       <option value="4">4th Sem</option>
                       <option value="5">5th Sem</option>
                       <option value="6">6th Sem</option>
                     </select>
                   </div>

                   <div>
                     <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Section</label>
                     <select 
                       value={form.section}
                       onChange={e => setForm({...form, section: e.target.value})}
                       className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                     >
                       <option value="">All Sections</option>
                       <option value="A">Sec A</option>
                       <option value="B">Sec B</option>
                       <option value="C">Sec C</option>
                     </select>
                   </div>
                 </div>
               </div>

               {/* Media Input */}
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Image/Video URLs (Comma-separated)</label>
                 <input 
                   value={form.mediaInput}
                   onChange={e => setForm({...form, mediaInput: e.target.value})}
                   className="w-full bg-slate-50 border border-slate-200 rounded-[14px] p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-red-400 focus:bg-white"
                   placeholder="e.g. https://domain.com/img1.jpg, https://domain.com/vid.mp4"
                 />
               </div>

               {/* Files Input */}
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Files Attachment (Format: Name|URL, Name2|URL2)</label>
                 <input 
                   value={form.filesInput}
                   onChange={e => setForm({...form, filesInput: e.target.value})}
                   className="w-full bg-slate-50 border border-slate-200 rounded-[14px] p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-red-400 focus:bg-white"
                   placeholder="e.g. CSE_Syllabus.pdf|http://url.com/a.pdf, Schedule.xlsx|http://url.com/b.xlsx"
                 />
               </div>
               
               <div className="flex gap-4 items-center">
                 <div className="flex-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Priority</label>
                   <select 
                     value={form.priority}
                     onChange={e => setForm({...form, priority: e.target.value as any})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-[16px] p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-red-400"
                   >
                     <option value="normal">Normal Priority</option>
                     <option value="high">High Priority</option>
                     <option value="low">Low Priority</option>
                   </select>
                 </div>
                 
                 <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer mt-4">
                   <input 
                     type="checkbox" 
                     checked={form.is_pinned}
                     onChange={e => setForm({...form, is_pinned: e.target.checked})}
                     className="w-5 h-5 rounded border-slate-300 text-red-500 focus:ring-red-500"
                   />
                   Pin to Top
                 </label>
               </div>

               <button 
                  type="submit"
                  className="mt-4 w-full bg-red-500 text-white py-4 rounded-[20px] text-base font-bold shadow-xl shadow-red-500/20 hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                >
                  {editingNoticeId ? 'Update Notice' : 'Broadcast Notice'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
