import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Bell, Pin, AlertTriangle, FileText, CheckCircle, Download, ExternalLink, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface NoticeFile {
  name: string;
  type: string;
  size: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  target_audience: string;
  is_pinned: boolean;
  files?: NoticeFile[];
  created_at: string;
  date?: string;
  is_read?: boolean;
  read_count?: number;
}

const NoticeBoard = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'normal'>('all');
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  const fetchNotices = async () => {
    try {
      const { data } = await api.get('/campus/notices');
      setNotices(data.notices || []);
    } catch (e) {
      console.error('Failed to fetch notices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleMarkAsRead = async (id: string, isReadAlready: boolean) => {
    if (isReadAlready) return;
    try {
      await api.post(`/campus/notices/${id}/read`);
      // Update local state instantly
      setNotices(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read_count: (n.read_count || 0) + 1 } : n));
    } catch (e) {
      console.error('Failed to mark notice as read:', e);
    }
  };

  const handleExpand = (id: string, isReadAlready: boolean) => {
    if (expandedNoticeId === id) {
      setExpandedNoticeId(null);
    } else {
      setExpandedNoticeId(id);
      handleMarkAsRead(id, isReadAlready);
    }
  };

  const handleDownloadFile = (fileName: string) => {
    alert(`📥 Downloading attachment: ${fileName}...`);
  };

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || n.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const pinnedNotices = filteredNotices.filter(n => n.is_pinned);
  const standardNotices = filteredNotices.filter(n => !n.is_pinned);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header with red gradient accent */}
      <div className="bg-gradient-to-br from-red-600 to-rose-700 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const role = JSON.parse(localStorage.getItem('user') || '{}').role;
              if (role === 'faculty') navigate('/faculty');
              else if (role === 'admin') navigate('/admin');
              else navigate('/');
            }} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shadow-sm">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                <Bell className="w-5 h-5 text-red-200 fill-red-200 animate-bounce" /> Notice Board
              </h1>
              <p className="text-xs text-red-100">Official Announcements & Circulars</p>
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-2 border border-white/15 shadow-inner">
          <Search className="w-4 h-4 text-red-100" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-white text-xs font-bold w-full placeholder:text-red-200/70"
            placeholder="Search circulars, schedules, placements..."
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 pt-5 pb-2 flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
        {[
          { id: 'all', label: 'All Notices' },
          { id: 'high', label: 'Urgent Only' },
          { id: 'normal', label: 'Standard' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPriorityFilter(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
              priorityFilter === tab.id
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-slate-500 border border-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Feed Container */}
      <div className="flex-1 overflow-y-auto px-5 py-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-350" />
            </div>
            <h3 className="text-sm font-black text-slate-800">No Announcements Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">There are no new notices matching your department, semester, or search filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-6">
            {/* Pinned Section */}
            {pinnedNotices.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 rotate-45" /> Pinned Announcements
                </h4>
                {pinnedNotices.map((n) => (
                  <NoticeCard
                    key={n.id}
                    notice={n}
                    isExpanded={expandedNoticeId === n.id}
                    onToggle={() => handleExpand(n.id, !!n.is_read)}
                    onDownload={handleDownloadFile}
                  />
                ))}
              </div>
            )}

            {/* Standard Section */}
            {standardNotices.length > 0 && (
              <div className="flex flex-col gap-3">
                {pinnedNotices.length > 0 && (
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recent Announcements</h4>
                )}
                {standardNotices.map((n) => (
                  <NoticeCard
                    key={n.id}
                    notice={n}
                    isExpanded={expandedNoticeId === n.id}
                    onToggle={() => handleExpand(n.id, !!n.is_read)}
                    onDownload={handleDownloadFile}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

// Notice Card Component with detailed expansion & download
const NoticeCard = ({ 
  notice, 
  isExpanded, 
  onToggle, 
  onDownload 
}: { 
  notice: Notice; 
  isExpanded: boolean; 
  onToggle: () => void; 
  onDownload: (name: string) => void;
}) => {
  return (
    <div 
      className={`bg-white rounded-3xl border transition-all duration-300 shadow-sm overflow-hidden ${
        notice.is_pinned ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100 hover:border-slate-200'
      } ${isExpanded ? 'ring-2 ring-red-500/20' : ''}`}
    >
      <div 
        onClick={onToggle}
        className="p-5 cursor-pointer flex items-start gap-4 select-none"
      >
        {/* Priority Icon */}
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
          notice.priority === 'high' ? 'bg-red-50 text-red-650' : 'bg-slate-50 text-slate-500'
        }`}>
          {notice.priority === 'high' ? <AlertTriangle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </div>

        {/* Content Preview */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {notice.is_pinned && (
              <span className="text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                <Pin className="w-2.5 h-2.5 fill-current" /> PINNED
              </span>
            )}
            {notice.priority === 'high' && (
              <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-lg">URGENT</span>
            )}
            {!notice.is_read ? (
              <span className="text-[8px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-lg">NEW</span>
            ) : (
              <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-500" /> READ
              </span>
            )}
          </div>
          <h3 className="text-sm font-black text-slate-900 leading-snug">{notice.title}</h3>
          
          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(notice.created_at || notice.date || 0).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {notice.read_count || 0} views</span>
          </div>
        </div>
      </div>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-50 pt-4 bg-slate-50/50 animate-fade-in">
          <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">{notice.content}</p>

          {/* Files/Attachments section */}
          {notice.files && notice.files.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Attached Documents</h4>
              <div className="flex flex-col gap-2">
                {notice.files.map((file, idx) => {
                  const isPdf = file.type === 'pdf';
                  return (
                    <div 
                      key={idx}
                      className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Beautiful color-coded document icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isPdf ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-800 truncate leading-tight">{file.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 uppercase font-bold">{file.type} · {file.size}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onDownload(file.name)}
                        className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
