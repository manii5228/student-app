import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Bell, Search, X, ChevronRight, Clock, BookOpen, FileText,
  CalendarDays, QrCode, Bus, MapPin, Briefcase, GraduationCap,
  Activity, TrendingUp, CheckCircle, AlertTriangle, DollarSign,
  Calendar, Users, Coffee, Heart, Zap, Lock, Command
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import UpsellModal from '../components/UpsellModal';
import { api } from '../lib/api';

// ── Types ────────────────────────────────────────────────────────
interface FeedData {
  greeting: string;
  user: { first_name?: string; last_name?: string; department?: string; semester?: number };
  next_action: { type: string; message: string; path: string } | null;
  today_classes: any[];
  upcoming_assignments: any[];
  recent_notices: any[];
  attendance: { total_classes: number; present: number; percentage: number };
  stats: { classes_today: number; pending_assignments: number; unread_notices: number; attendance_pct: number };
}

interface Notification {
  id: string; category: string; urgency: string; title: string;
  message: string; timestamp: string; read: boolean; path: string;
}

interface SearchResult {
  type: string; title: string; subtitle: string; path: string; icon: string;
}

// ── Quick Actions ────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { name: 'Timetable', icon: CalendarDays, color: 'from-indigo-500 to-violet-600', path: '/academic/timetable' },
  { name: 'Attendance', icon: QrCode, color: 'from-emerald-500 to-teal-600', path: '/academic/attendance' },
  { name: 'Assignments', icon: FileText, color: 'from-amber-500 to-orange-600', path: '/academic/assignments' },
  { name: 'Results', icon: TrendingUp, color: 'from-rose-500 to-pink-600', path: '/academic/results' },
  { name: 'Bus Tracker', icon: Bus, color: 'from-blue-500 to-cyan-600', path: '/campus/bus' },
  { name: 'Canteen', icon: Coffee, color: 'from-orange-500 to-red-500', path: '/campus/canteen' },
  { name: 'Jobs', icon: Briefcase, color: 'from-emerald-600 to-green-700', path: '/career/jobs' },
  { name: 'Library', icon: BookOpen, color: 'from-purple-500 to-fuchsia-600', path: '/campus/library' },
];

// ── Fallback Data ────────────────────────────────────────────────
const FALLBACK_FEED: FeedData = {
  greeting: new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening',
  user: { first_name: 'Student' },
  next_action: { type: 'class', message: 'Data Structures class at Block A in 20 min', path: '/academic/timetable' },
  today_classes: [
    { id: '1', subject_name: 'Data Structures', start_time: '09:00', end_time: '10:00', room: 'A301', faculty_name: 'Dr. Kumar' },
    { id: '2', subject_name: 'Operating Systems', start_time: '10:15', end_time: '11:15', room: 'B202', faculty_name: 'Dr. Priya' },
    { id: '3', subject_name: 'Computer Networks', start_time: '11:30', end_time: '12:30', room: 'A105', faculty_name: 'Dr. Raj' },
    { id: '4', subject_name: 'DBMS Lab', start_time: '14:00', end_time: '16:00', room: 'Lab 4', faculty_name: 'Dr. Meena' },
  ],
  upcoming_assignments: [
    { id: '1', title: 'OS Lab Report #4', due_date: new Date(Date.now() + 86400000).toISOString(), subject: 'Operating Systems' },
    { id: '2', title: 'CN Assignment 3', due_date: new Date(Date.now() + 3 * 86400000).toISOString(), subject: 'Computer Networks' },
  ],
  recent_notices: [
    { id: '1', title: 'CAT-1 Marks Released', content: 'Internal marks now available.', priority: 'high', created_at: new Date().toISOString() },
    { id: '2', title: 'Library Extended Hours', content: 'Open till 10 PM during exams.', priority: 'normal', created_at: new Date().toISOString() },
  ],
  attendance: { total_classes: 120, present: 102, percentage: 85.0 },
  stats: { classes_today: 4, pending_assignments: 2, unread_notices: 3, attendance_pct: 85.0 },
};

// ── Dashboard Component ──────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [feed, setFeed] = useState<FeedData>(FALLBACK_FEED);
  const [loading, setLoading] = useState(true);

  // Notification drawer state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifCategory, setNotifCategory] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Search (Command Palette) state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recent_searches') || '[]'); } catch { return []; }
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<any>(null);

  // ── Role redirect ────────────────────────────────────────────
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (user?.role === 'faculty') return <Navigate to="/faculty" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  const isGuest = user?.is_guest || user?.role === 'guest';

  // ── Fetch feed data ──────────────────────────────────────────
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await api.get('/home/feed');
        setFeed({ ...FALLBACK_FEED, ...data });
      } catch {
        // Keep fallback data
      }
      setLoading(false);
    };
    fetchFeed();
  }, []);

  // ── Fetch notifications ──────────────────────────────────────
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/home/notifications');
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } catch { }
    };
    fetchNotifs();
  }, []);

  // ── Keyboard shortcut (Ctrl+K) ──────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // ── Search handler with debounce ─────────────────────────────
  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await api.get('/home/search', { params: { q } });
      setSearchResults(data.results || []);
    } catch { setSearchResults([]); }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => performSearch(val), 300);
  };

  const handleSearchNavigate = (path: string, title: string) => {
    const updated = [title, ...recentSearches.filter(s => s !== title)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    setSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  // ── Mark all notifications as read ───────────────────────────
  const markAllRead = async () => {
    try { await api.post('/home/notifications/read-all'); } catch { }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const filteredNotifs = notifCategory === 'all'
    ? notifications
    : notifications.filter(n => n.category === notifCategory);

  // ── Time helpers ─────────────────────────────────────────────
  const getRelativeTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };

  const getAttendanceColor = (pct: number) => {
    if (pct >= 85) return 'text-emerald-600';
    if (pct >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  const getNotifIcon = (cat: string) => {
    if (cat === 'academic') return <GraduationCap className="w-4 h-4" />;
    if (cat === 'event') return <Calendar className="w-4 h-4" />;
    if (cat === 'finance') return <DollarSign className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const getSearchIcon = (icon: string) => {
    const map: Record<string, React.ReactNode> = {
      user: <Users className="w-4 h-4" />,
      bell: <Bell className="w-4 h-4" />,
      calendar: <Calendar className="w-4 h-4" />,
      compass: <MapPin className="w-4 h-4" />,
    };
    return map[icon] || <Search className="w-4 h-4" />;
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">

      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute -left-10 bottom-0 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Top bar: greeting + actions */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">
                {feed.greeting} 👋
              </p>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {feed.user.first_name || 'Student'}
              </h1>
            </div>
            <div className="flex gap-2">
              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
              >
                <Search className="w-5 h-5" />
              </button>
              {/* Notification bell */}
              <button
                onClick={() => setNotifOpen(true)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black flex items-center justify-center text-white shadow-lg animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Next action banner */}
          {feed.next_action && (
            <button
              onClick={() => navigate(feed.next_action!.path)}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover:bg-white/15 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-indigo-300" />
              </div>
              <p className="text-sm text-white/90 font-medium flex-1 line-clamp-1">
                {feed.next_action.message}
              </p>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
            </button>
          )}

          {/* Quick stat chips */}
          <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
            <div className="shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-300" />
              <div>
                <p className="text-lg font-black text-white leading-none">{feed.stats.classes_today}</p>
                <p className="text-[9px] font-bold text-white/50 uppercase">Classes</p>
              </div>
            </div>
            <div className="shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-300" />
              <div>
                <p className="text-lg font-black text-white leading-none">{feed.stats.pending_assignments}</p>
                <p className="text-[9px] font-bold text-white/50 uppercase">Due</p>
              </div>
            </div>
            <div className="shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10 flex items-center gap-2">
              <Activity className={`w-4 h-4 ${feed.stats.attendance_pct >= 85 ? 'text-emerald-300' : feed.stats.attendance_pct >= 75 ? 'text-amber-300' : 'text-red-300'}`} />
              <div>
                <p className="text-lg font-black text-white leading-none">{feed.stats.attendance_pct}%</p>
                <p className="text-[9px] font-bold text-white/50 uppercase">Attend</p>
              </div>
            </div>
            <div className="shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-300" />
              <div>
                <p className="text-lg font-black text-white leading-none">{feed.stats.unread_notices}</p>
                <p className="text-[9px] font-bold text-white/50 uppercase">Alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── Quick Actions Grid ────────────────────────────────── */}
        <div className="px-5 pt-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.name}
                onClick={() => {
                  if (isGuest && ['Attendance', 'Assignments', 'Results'].includes(action.name)) {
                    setUpsellOpen(true);
                  } else {
                    navigate(action.path);
                  }
                }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-md group-hover:shadow-lg group-active:scale-90 transition-all`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{action.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Today's Schedule ──────────────────────────────────── */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Schedule</h2>
            <button onClick={() => navigate('/academic/timetable')} className="text-[10px] font-bold text-indigo-500 flex items-center gap-0.5 hover:text-indigo-700">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {feed.today_classes.length === 0 ? (
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 text-center">
              <p className="text-sm text-slate-500">No classes today 🎉</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x">
              {feed.today_classes.map((cls, i) => {
                const colors = ['from-indigo-500 to-violet-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600'];
                return (
                  <div
                    key={cls.id || i}
                    className={`shrink-0 w-[160px] bg-gradient-to-br ${colors[i % 4]} rounded-[20px] p-4 text-white snap-start shadow-md hover:shadow-lg transition-shadow cursor-pointer`}
                    onClick={() => navigate('/academic/timetable')}
                  >
                    <p className="text-[10px] font-bold text-white/60 uppercase">{cls.start_time} - {cls.end_time}</p>
                    <h3 className="text-sm font-black mt-1 leading-tight line-clamp-2">{cls.subject_name}</h3>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-white/70">
                      <MapPin className="w-3 h-3" /> {cls.room || 'TBD'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Attendance Overview ───────────────────────────────── */}
        <div className="px-5 mt-6">
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Attendance Overview</h2>
              <button onClick={() => navigate('/academic/attendance')} className="text-[10px] font-bold text-indigo-500">Details →</button>
            </div>
            <div className="flex items-center gap-5">
              {/* Circular progress */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke={feed.attendance.percentage >= 85 ? '#10b981' : feed.attendance.percentage >= 75 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${feed.attendance.percentage * 0.975} 97.5`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-black ${getAttendanceColor(feed.attendance.percentage)}`}>
                    {feed.attendance.percentage}%
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500">Present</span>
                  <span className="font-bold text-emerald-600">{feed.attendance.present}</span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500">Total Classes</span>
                  <span className="font-bold text-slate-700">{feed.attendance.total_classes}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Absent</span>
                  <span className="font-bold text-red-500">{feed.attendance.total_classes - feed.attendance.present}</span>
                </div>
              </div>
            </div>
            {isGuest && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[24px]">
                <Lock className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-600">Sign in to track attendance</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Upcoming Assignments ─────────────────────────────── */}
        {feed.upcoming_assignments.length > 0 && (
          <div className="px-5 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Deadlines</h2>
              <button onClick={() => navigate('/academic/assignments')} className="text-[10px] font-bold text-indigo-500 flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {feed.upcoming_assignments.map((a, i) => (
                <button
                  key={a.id || i}
                  onClick={() => navigate('/academic/assignments')}
                  className="bg-white rounded-[18px] p-4 shadow-sm border border-slate-100 flex items-center gap-3 text-left hover:shadow-md active:scale-[0.98] transition-all"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    getDaysLeft(a.due_date) === 'Due today' ? 'bg-red-100' : getDaysLeft(a.due_date) === 'Due tomorrow' ? 'bg-amber-100' : 'bg-indigo-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      getDaysLeft(a.due_date) === 'Due today' ? 'text-red-600' : getDaysLeft(a.due_date) === 'Due tomorrow' ? 'text-amber-600' : 'text-indigo-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{a.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.subject || 'Assignment'}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                    getDaysLeft(a.due_date) === 'Due today' ? 'bg-red-100 text-red-700' : getDaysLeft(a.due_date) === 'Due tomorrow' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {getDaysLeft(a.due_date)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Notices ───────────────────────────────────── */}
        {feed.recent_notices.length > 0 && (
          <div className="px-5 mt-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Notices</h2>
              <button onClick={() => navigate('/campus/notices')} className="text-[10px] font-bold text-indigo-500 flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {feed.recent_notices.map((n, i) => (
                <button
                  key={n.id || i}
                  onClick={() => navigate('/campus/notices')}
                  className="bg-white rounded-[18px] p-4 shadow-sm border border-slate-100 flex items-center gap-3 text-left hover:shadow-md active:scale-[0.98] transition-all"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    n.priority === 'high' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {n.priority === 'high'
                      ? <AlertTriangle className="w-5 h-5 text-red-600" />
                      : <Bell className="w-5 h-5 text-blue-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{n.content}</p>
                  </div>
                  {n.priority === 'high' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ COMMAND PALETTE (Ctrl+K) ═══ */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in pt-16" onClick={() => setSearchOpen(false)}>
          <div className="bg-white rounded-[24px] w-[92%] max-w-md shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search pages, people, events..."
                className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
              />
              <div className="flex items-center gap-1">
                <kbd className="hidden sm:inline-block text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">ESC</kbd>
                <button onClick={() => setSearchOpen(false)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {searchQuery.length < 2 ? (
                <>
                  {recentSearches.length > 0 && (
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Searches</p>
                      {recentSearches.map((s, i) => (
                        <button key={i} onClick={() => { setSearchQuery(s); performSearch(s); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trending</p>
                    {['Exam Schedule', 'Bus Tracker', 'Internal Marks', 'Job Portal'].map(t => (
                      <button key={t} onClick={() => { setSearchQuery(t); performSearch(t); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> {t}
                      </button>
                    ))}
                  </div>
                </>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No results for "<span className="font-bold">{searchQuery}</span>"</p>
                </div>
              ) : (
                <div className="px-1">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearchNavigate(r.path, r.title)}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        {getSearchIcon(r.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{r.title}</h4>
                        <p className="text-[10px] text-slate-400">{r.subtitle}</p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase shrink-0">{r.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Command className="w-3 h-3" /> <span className="font-bold">Ctrl+K</span> to search
              </div>
              <span className="text-[10px] text-slate-400">{searchResults.length} results</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NOTIFICATION DRAWER ═══ */}
      {notifOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setNotifOpen(false)}>
          <div className="bg-white rounded-t-[32px] w-full max-w-md shadow-2xl animate-slide-up max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-slate-900">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount} new</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setNotifOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 px-5 py-3 shrink-0 overflow-x-auto hide-scrollbar">
              {['all', 'academic', 'event', 'finance'].map(cat => (
                <button key={cat} onClick={() => setNotifCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all ${
                    notifCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto p-4 pt-1">
              {filteredNotifs.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-bold">All caught up!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredNotifs.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { setNotifOpen(false); navigate(n.path); }}
                      className={`w-full text-left rounded-[18px] p-4 flex items-start gap-3 transition-all hover:shadow-sm active:scale-[0.98] ${
                        n.read ? 'bg-slate-50 border border-slate-100' : 'bg-white border border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        n.category === 'academic' ? 'bg-indigo-100 text-indigo-600'
                        : n.category === 'event' ? 'bg-pink-100 text-pink-600'
                        : 'bg-amber-100 text-amber-600'
                      }`}>
                        {getNotifIcon(n.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={`text-sm font-bold truncate ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</h4>
                          {!n.read && n.urgency === 'critical' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                          )}
                          {!n.read && n.urgency !== 'critical' && (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{n.message}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">{getRelativeTime(n.timestamp)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <UpsellModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default Dashboard;
