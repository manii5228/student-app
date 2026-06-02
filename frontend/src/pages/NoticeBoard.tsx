import React, { useEffect, useState } from 'react';
import { ChevronLeft, Bell, Pin, FileText, Download, CheckCircle, Search, Filter, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
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
  files: NoticeFile[];
  is_read?: boolean;
  read_count?: number;
  branch?: string | null;
  year?: number | null;
  section?: string | null;
  created_at: string;
}

const fileIcon = (type: string) => {
  if (type === 'pdf') return '📕';
  if (type === 'word') return '📘';
  if (type === 'excel') return '📗';
  return '📄';
};

const priorityConfig: Record<string, { bg: string; text: string; label: string; border: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-600', label: 'HIGH', border: 'border-red-200' },
  urgent: { bg: 'bg-red-50', text: 'text-red-600', label: 'URGENT', border: 'border-red-200' },
  normal: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'NORMAL', border: 'border-blue-200' },
};

const timeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const NoticeBoard = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [showDownloadToast, setShowDownloadToast] = useState(false);

  const handleGoBack = () => {
    const role = JSON.parse(localStorage.getItem('user') || '{}').role;
    if (role === 'faculty') navigate('/faculty');
    else if (role === 'admin') navigate('/admin');
    else navigate('/');
  };

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const { data } = await api.get('/campus/notices');
        const list = data.notices || data || [];
        setNotices(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to fetch notices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const markAsRead = async (nid: string) => {
    try {
      await api.post(`/campus/notices/${nid}/read`);
      setNotices(prev => prev.map(n => n.id === nid ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const handleDownload = (file: NoticeFile) => {
    setShowDownloadToast(true);
    setTimeout(() => setShowDownloadToast(false), 2500);
  };

  const filtered = notices.filter(n => {
    const matchSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = filterPriority === 'all' || n.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const pinnedCount = filtered.filter(n => n.is_pinned).length;

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={handleGoBack} 
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              <Bell className="w-5 h-5" /> Notice Board
            </h1>
            <p className="text-xs text-slate-400">Circulars & Announcements</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase">{filtered.length} Notices</span>
            {pinnedCount > 0 && <p className="text-[9px] text-amber-400 font-bold">{pinnedCount} Pinned</p>}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-2.5 border border-white/10">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notices..."
            className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Priority Filter Pills */}
      <div className="px-5 pt-4 pb-1 flex gap-2 overflow-x-auto hide-scrollbar">
        {[
          { key: 'all', label: 'All', icon: '📋' },
          { key: 'high', label: 'High', icon: '🔴' },
          { key: 'urgent', label: 'Urgent', icon: '🚨' },
          { key: 'normal', label: 'Normal', icon: '📩' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterPriority(f.key)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all border ${
              filterPriority === f.key
                ? 'bg-slate-900 text-white border-slate-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Notices List */}
      <div className="flex-1 overflow-y-auto px-5 py-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[20px] p-5 border border-slate-100 animate-pulse">
                <div className="h-4 bg-slate-200 rounded-lg w-3/4 mb-3"></div>
                <div className="h-3 bg-slate-100 rounded-lg w-full mb-2"></div>
                <div className="h-3 bg-slate-100 rounded-lg w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-sm font-black text-slate-600">No Notices Found</h3>
            <p className="text-xs text-slate-400 mt-1">Check back later for new announcements.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(notice => {
              const pConfig = priorityConfig[notice.priority] || priorityConfig.normal;
              const isExpanded = expandedNotice === notice.id;
              const hasFiles = notice.files && notice.files.length > 0;

              return (
                <div
                  key={notice.id}
                  className={`bg-white rounded-[20px] shadow-sm border transition-all duration-200 ${
                    notice.is_pinned ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-100'
                  } ${isExpanded ? 'shadow-md' : ''}`}
                  onClick={() => {
                    setExpandedNotice(isExpanded ? null : notice.id);
                    if (!notice.is_read) markAsRead(notice.id);
                  }}
                >
                  <div className="p-5">
                    {/* Top Meta Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {notice.is_pinned && (
                          <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                            <Pin className="w-2.5 h-2.5" /> PINNED
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}>
                          {pConfig.label}
                        </span>
                        {notice.is_read && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(notice.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-sm font-black leading-tight ${notice.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                      {notice.title}
                    </h3>

                    {/* Content Preview / Full */}
                    <p className={`text-xs text-slate-500 leading-relaxed mt-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {notice.content}
                    </p>

                    {/* Expand Indicator */}
                    {!isExpanded && (
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          {hasFiles && (
                            <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {notice.files.length} attachment{notice.files.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                          Tap to read <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    )}

                    {/* Expanded: File Attachments */}
                    {isExpanded && hasFiles && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Attached Documents</h4>
                        <div className="flex flex-col gap-2">
                          {notice.files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 hover:bg-slate-100 transition-colors"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-lg shrink-0">{fileIcon(file.type)}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400">{file.size} • {(file.type || 'doc').toUpperCase()}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownload(file)}
                                className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 hover:bg-blue-50 hover:border-blue-200 transition-colors active:scale-90"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded: Target info */}
                    {isExpanded && notice.target_audience === 'class' && (
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400">
                          Target: {notice.branch || 'All'}{notice.section ? `-${notice.section}` : ''}{notice.year ? ` Sem ${notice.year}` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Download Toast */}
      {showDownloadToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-slide-up z-50">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">Document download simulated!</span>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default NoticeBoard;
