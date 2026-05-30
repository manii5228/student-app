import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Bell, Search, X, ChevronRight, Clock, BookOpen, FileText,
  CalendarDays, QrCode, Bus, MapPin, Briefcase, GraduationCap,
  Activity, TrendingUp, CheckCircle, AlertTriangle, DollarSign,
  Calendar, Users, Coffee, Zap, Command, Award, Trophy, Star,
  ThumbsUp, Plus
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import UpsellModal from '../components/UpsellModal';
import { api } from '../lib/api';

/* ═══════════════════════════════════════════════════════════════
   COLOR PALETTE (VTU)
   ─────────────────────────────────────────────────────────────
   #a91f23  → vtuRed   (alerts, urgency)
   #22346c  → vtuNavy  (text, dark card)
   #0080c7  → vtuBlue  (primary accent)
   #c9503d  → vtuTerra (warm accent)
   #27bcd1  → vtuCyan  (fresh accent)
   ═══════════════════════════════════════════════════════════════ */

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
  { name: 'Timetable', icon: CalendarDays, path: '/academic/timetable',  accent: '#0080c7' },
  { name: 'Attendance', icon: QrCode,      path: '/academic/attendance', accent: '#27bcd1' },
  { name: 'Assignments', icon: FileText,   path: '/academic/assignments', accent: '#c9503d' },
  { name: 'Results', icon: TrendingUp,     path: '/academic/results',    accent: '#a91f23' },
  { name: 'Bus Timings', icon: Bus,        path: '/campus/bus',          accent: '#22346c' },
  { name: 'Canteen', icon: Coffee,         path: '/campus/canteen',      accent: '#c9503d' },
  { name: 'Jobs', icon: Briefcase,         path: '/career/jobs',         accent: '#0080c7' },
  { name: 'Library', icon: BookOpen,       path: '/campus/library',      accent: '#27bcd1' },
  { name: 'Portfolio', icon: Award,        path: '/career/portfolio',     accent: '#a91f23' },
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

  // ── User / Guest Info (declared early for use in hooks) ──────────
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isGuest = user?.is_guest || user?.role === 'guest';

  const [upsellOpen, setUpsellOpen] = useState(false);
  const [feed, setFeed] = useState<FeedData>(FALLBACK_FEED);
  const [loading, setLoading] = useState(true);

  // ── Theme / Accent variables ───────────────────────────────────
  const theme = localStorage.getItem('theme_preference') || 'light';
  const accentColor = localStorage.getItem('accent_color') || '#0080c7';
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const C = {
    navy: isDark ? '#0f172a' : '#22346c',
    blue: accentColor,
    red: '#a91f23',
    terra: '#c9503d',
    cyan: '#27bcd1',
    bg: isDark ? '#0b0f19' : '#f4f5f7',
    card: isDark ? '#1e293b' : '#ffffff',
    textPrimary: isDark ? '#f8fafc' : '#22346c',
    textSecondary: isDark ? '#94a3b8' : '#868e96',
    border: isDark ? '#334155' : '#e9ecef',
  };

  const [achievements, setAchievements] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);

  // Add certification states
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [certId, setCertId] = useState('');
  const [certTitle, setCertTitle] = useState('');
  const [certPlatform, setCertPlatform] = useState('coursera');
  const [certVerifying, setCertVerifying] = useState(false);
  const [certError, setCertError] = useState('');

  // Endorse Skill handler
  const endorseSkill = async (name: string) => {
    try {
      const res = await api.post('/auth/profile/endorse', {
        user_id: user?.id,
        skill_name: name
      });
      const updated = res.data.skill;
      setSkills(prev => prev.map(s => s.name === name ? {
        ...s,
        endorsements: updated.endorsements,
        endorsed: updated.endorsed
      } : s));
    } catch {
      setSkills(prev => prev.map(s => s.name === name ? { ...s, endorsements: s.endorsements + (s.endorsed ? -1 : 1), endorsed: !s.endorsed } : s));
    }
  };

  // Add Certification handler
  const handleAddCertification = async () => {
    if (!certId || !certTitle) {
      setCertError('Please fill in all fields');
      return;
    }
    setCertVerifying(true);
    setCertError('');
    try {
      const res = await api.post('/auth/profile/certifications/verify', {
        certificate_id: certId,
        platform: certPlatform,
        title: certTitle
      });
      const newAch = res.data.achievement;
      setAchievements(prev => [...prev, newAch]);
      setShowAddCertModal(false);
      setCertId('');
      setCertTitle('');
    } catch (err: any) {
      setCertError(err?.response?.data?.error || 'Verification failed. Make sure the ID is at least 8 characters.');
    } finally {
      setCertVerifying(false);
    }
  };

  useEffect(() => {
    if (isGuest) return;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data.user.achievements) setAchievements(data.user.achievements);
        if (data.user.skills) {
          const mapped = data.user.skills.map((s: any) => ({
            name: s.name,
            endorsements: s.endorsements ? s.endorsements.length : 0,
            endorsed: s.endorsements ? s.endorsements.includes(data.user.id) : false
          }));
          setSkills(mapped);
        }
      } catch {}
    })();
  }, [isGuest]);

  // Notification drawer
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifCategory, setNotifCategory] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Command palette
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recent_searches') || '[]'); } catch { return []; }
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<any>(null);

  // ── Role redirect ──────────────────────────────────────────
  if (user?.role === 'faculty') return <Navigate to="/faculty" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  // ── Data fetching ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/home/feed');
        setFeed({ ...FALLBACK_FEED, ...data });
      } catch { /* keep fallback */ }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/home/notifications');
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } catch { }
    })();
  }, []);

  // ── Keyboard shortcut ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

  // ── Search ─────────────────────────────────────────────────
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
    setSearchOpen(false); setSearchQuery('');
    navigate(path);
  };

  // ── Notifications ──────────────────────────────────────────
  const markAllRead = async () => {
    try { await api.post('/home/notifications/read-all'); } catch { }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const filteredNotifs = notifCategory === 'all'
    ? notifications
    : notifications.filter(n => n.category === notifCategory);

  // ── Helpers ────────────────────────────────────────────────
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
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const getNotifIcon = (cat: string) => {
    if (cat === 'academic') return <GraduationCap className="w-4 h-4" />;
    if (cat === 'event') return <Calendar className="w-4 h-4" />;
    if (cat === 'finance') return <DollarSign className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const getSearchIcon = (icon: string) => {
    const map: Record<string, React.ReactNode> = {
      user: <Users className="w-4 h-4" />, bell: <Bell className="w-4 h-4" />,
      calendar: <Calendar className="w-4 h-4" />, compass: <MapPin className="w-4 h-4" />,
    };
    return map[icon] || <Search className="w-4 h-4" />;
  };

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // ── SVG donut helper ───────────────────────────────────────
  const DonutChart = ({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) => {
    const r = 22; const c = 2 * Math.PI * r;
    return (
      <svg width={size} height={size} viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e9ecef" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform="rotate(-90 28 28)" className="transition-all duration-700" />
      </svg>
    );
  };

  // ── Activity bar chart (like reference) ────────────────────
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const classData = feed.today_classes.length > 0
    ? [3, 4, 2, feed.stats.classes_today, 3, 1]
    : [2, 3, 1, 0, 2, 1];
  const maxBar = Math.max(...classData, 1);

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="dash-root">

      {/* ═══ TOP AREA ═══ */}
      <div className="dash-top">
        <div className="dash-top-row">
          <div>
            <p className="dash-date">{todayDate}</p>
            <h1 className="dash-greeting">{feed.greeting},<br/>{feed.user.first_name || 'Student'}</h1>
          </div>
          <div className="dash-top-actions">
            <button className="dash-icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={18} />
            </button>
            <button className="dash-icon-btn" onClick={() => setNotifOpen(true)} aria-label="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && <span className="dash-badge">{unreadCount}</span>}
            </button>
          </div>
        </div>

        {/* Next action pill */}
        {feed.next_action && (
          <button className="dash-next-action" onClick={() => navigate(feed.next_action!.path)}>
            <Zap size={14} color="#0080c7" />
            <span>{feed.next_action.message}</span>
            <ChevronRight size={14} color="#adb5bd" />
          </button>
        )}
      </div>

      {/* ═══ STAT CARDS (like reference image) ═══ */}
      <div className="dash-stats-row">
        <button className="dash-stat-card dash-stat-blue" onClick={() => navigate('/academic/attendance')}>
          <div className="dash-stat-label">Attendance <Activity size={14} /></div>
          <div className="dash-stat-value">{feed.stats.attendance_pct}<span className="dash-stat-unit">%</span></div>
        </button>
        <button className="dash-stat-card dash-stat-cyan" onClick={() => navigate('/academic/timetable')}>
          <div className="dash-stat-label">Classes <CalendarDays size={14} /></div>
          <div className="dash-stat-value">{feed.stats.classes_today}<span className="dash-stat-unit"> today</span></div>
        </button>
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="dash-scroll">

        {/* ── Quick Actions (circular icons like badges) ──────── */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Quick Actions</h2>
          </div>
          <div className="dash-actions-grid">
            {QUICK_ACTIONS.map(a => (
              <button
                key={a.name}
                className="dash-action-item"
                onClick={() => {
                  if (isGuest && ['Assignments', 'Jobs', 'Library'].includes(a.name)) setUpsellOpen(true);
                  else navigate(a.path);
                }}
              >
                <div className="dash-action-circle" style={{ background: a.accent + '14', color: a.accent }}>
                  <a.icon size={20} />
                </div>
                <span className="dash-action-label">{a.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Today's Schedule ────────────────────────────────── */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Today's Schedule</h2>
            <button className="dash-see-all" onClick={() => navigate('/academic/timetable')}>
              View all <ChevronRight size={13} />
            </button>
          </div>

          {feed.today_classes.length === 0 ? (
            <div className="dash-empty">No classes today 🎉</div>
          ) : (
            <div className="dash-schedule-list">
              {feed.today_classes.map((cls, i) => (
                <button key={cls.id || i} className="dash-schedule-item" onClick={() => navigate('/academic/timetable')}>
                  <div className="dash-schedule-time">
                    <span className="dash-time-text">{cls.start_time}</span>
                    <span className="dash-time-dot" />
                    <span className="dash-time-sub">{cls.end_time}</span>
                  </div>
                  <div className="dash-schedule-info">
                    <h3 className="dash-schedule-name">{cls.subject_name}</h3>
                    <p className="dash-schedule-meta">{cls.faculty_name} · {cls.room || 'TBD'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Upcoming Deadlines ──────────────────────────────── */}
        {feed.upcoming_assignments.length > 0 && (
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Deadlines</h2>
              <button className="dash-see-all" onClick={() => { isGuest ? setUpsellOpen(true) : navigate('/academic/assignments'); }}>
                View all <ChevronRight size={13} />
              </button>
            </div>
            <div className="dash-deadline-list">
              {feed.upcoming_assignments.map((a, i) => {
                const dl = getDaysLeft(a.due_date);
                const urgent = dl === 'Due today';
                return (
                  <button key={a.id || i} className="dash-deadline-item" onClick={() => isGuest ? setUpsellOpen(true) : navigate('/academic/assignments')}>
                    <div className="dash-deadline-icon" style={{ background: urgent ? '#a91f2314' : '#0080c714' }}>
                      <FileText size={16} color={urgent ? '#a91f23' : '#0080c7'} />
                    </div>
                    <div className="dash-deadline-info">
                      <h3>{a.title}</h3>
                      <p>{a.subject || 'Assignment'}</p>
                    </div>
                    <span className="dash-deadline-badge" style={{ background: urgent ? '#a91f2314' : '#e9ecef', color: urgent ? '#a91f23' : '#495057' }}>
                      {dl}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Activity Card (dark, like reference) ────────────── */}
        <div className="dash-section">
          <div className="dash-activity-card">
            <div className="dash-activity-header">
              <div>
                <p className="dash-activity-label">Your activity</p>
                <p className="dash-activity-value">
                  {feed.attendance.present}<span className="dash-activity-unit"> classes attended</span>
                </p>
              </div>
              <div className="dash-activity-ring">
                <DonutChart pct={feed.attendance.percentage} color="#27bcd1" size={44} />
                <span className="dash-ring-text">{feed.attendance.percentage}%</span>
              </div>
            </div>
            <div className="dash-bar-chart">
              {days.map((d, i) => (
                <div key={d} className="dash-bar-col">
                  <div className="dash-bar-track">
                    <div
                      className="dash-bar-fill"
                      style={{
                        height: `${(classData[i] / maxBar) * 100}%`,
                        background: i === 3 ? '#27bcd1' : '#495057',
                      }}
                    >
                      {i === 3 && <span className="dash-bar-tip">{classData[i]}</span>}
                    </div>
                  </div>
                  <span className="dash-bar-day">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Notices ──────────────────────────────────── */}
        {feed.recent_notices.length > 0 && (
          <div className="dash-section" style={{ marginBottom: 24 }}>
            <div className="dash-section-header">
              <h2 className="dash-section-title">Notices</h2>
              <button className="dash-see-all" onClick={() => navigate('/campus/notices')}>
                View all <ChevronRight size={13} />
              </button>
            </div>
            <div className="dash-deadline-list">
              {feed.recent_notices.map((n, i) => (
                <button key={n.id || i} className="dash-deadline-item" onClick={() => navigate('/campus/notices')}>
                  <div className="dash-deadline-icon" style={{ background: n.priority === 'high' ? '#a91f2314' : '#0080c714' }}>
                    {n.priority === 'high' ? <AlertTriangle size={16} color="#a91f23" /> : <Bell size={16} color="#0080c7" />}
                  </div>
                  <div className="dash-deadline-info">
                    <h3>{n.title}</h3>
                    <p>{n.content}</p>
                  </div>
                  {n.priority === 'high' && <span className="dash-urgency-dot" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── My Portfolio & Achievements (Moved from Profile) ── */}
        {!isGuest && (
          <div className="dash-section" style={{ marginBottom: 24 }}>
            <div className="dash-section-header">
              <h2 className="dash-section-title">My Portfolio & Achievements</h2>
              <button className="dash-see-all" onClick={() => navigate('/career/portfolio')}>
                Build Portfolio <ChevronRight size={13} />
              </button>
            </div>

            {/* Achievements Sub-section */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.textPrimary }}>
                  <Trophy className="w-4 h-4" style={{ color: C.terra }} /> Verified Achievements
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.border, color: C.textSecondary }}>
                  {achievements.length}
                </span>
              </div>
              
              {achievements.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-2xl" style={{ borderColor: C.border }}>
                  <p className="text-xs" style={{ color: C.textSecondary }}>No verified achievements yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {achievements.map((a, i) => (
                    <div key={a.id || i} className="rounded-xl p-3 flex items-center gap-3 border" style={{ background: C.card, borderColor: C.border }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm shrink-0 bg-slate-50 dark:bg-slate-800">
                        {a.icon || '🏆'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate" style={{ color: C.textPrimary }}>{a.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize" style={{ background: C.blue + '14', color: C.blue }}>
                            {a.type}
                          </span>
                          <span className="text-[9px]" style={{ color: C.textSecondary }}>
                            {a.date ? new Date(a.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Verified'}
                          </span>
                        </div>
                      </div>
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skill Endorsements Sub-section */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.textPrimary }}>
                  <Star className="w-4 h-4" style={{ color: C.blue }} /> Skill Endorsements
                </h3>
              </div>
              
              {skills.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-2xl" style={{ borderColor: C.border }}>
                  <p className="text-xs" style={{ color: C.textSecondary }}>No skills added. Add them under Profile.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {skills.map(skill => (
                    <div key={skill.name} className="rounded-xl p-3 flex items-center gap-3 border" style={{ background: C.card, borderColor: C.border }}>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold" style={{ color: C.textPrimary }}>{skill.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span className="text-[9px]" style={{ color: C.textSecondary }}>{skill.endorsements} endorsements</span>
                        </div>
                      </div>
                      <button
                        onClick={() => endorseSkill(skill.name)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border"
                        style={{
                          background: skill.endorsed ? C.blue + '14' : 'transparent',
                          color: skill.endorsed ? C.blue : C.textSecondary,
                          borderColor: skill.endorsed ? C.blue + '30' : C.border,
                        }}
                      >
                        <ThumbsUp className={`w-3 h-3 ${skill.endorsed ? 'fill-current' : ''}`} />
                        {skill.endorsed ? 'Endorsed' : 'Endorse'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certification verification trigger */}
            <button
              onClick={() => setShowAddCertModal(true)}
              className="w-full border-2 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 text-xs font-bold transition-all"
              style={{ borderColor: C.border, color: C.textSecondary, background: 'transparent' }}
            >
              <Plus className="w-4 h-4" />
              Verify Certification (Coursera/NPTEL)
            </button>
          </div>
        )}
      </div>

      {/* ═══ COMMAND PALETTE ═══ */}
      {searchOpen && (
        <div className="dash-overlay" onClick={() => setSearchOpen(false)}>
          <div className="dash-palette" onClick={e => e.stopPropagation()}>
            <div className="dash-palette-input-row">
              <Search size={16} color="#adb5bd" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search pages, people, events…"
                className="dash-palette-input"
              />
              <button className="dash-palette-close" onClick={() => setSearchOpen(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="dash-palette-body">
              {searchQuery.length < 2 ? (
                <>
                  {recentSearches.length > 0 && (
                    <div className="dash-palette-section">
                      <p className="dash-palette-label">Recent</p>
                      {recentSearches.map((s, i) => (
                        <button key={i} className="dash-palette-row" onClick={() => { setSearchQuery(s); performSearch(s); }}>
                          <Clock size={14} color="#adb5bd" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="dash-palette-section">
                    <p className="dash-palette-label">Trending</p>
                    {['Exam Schedule', 'Bus Timings', 'Internal Marks', 'Job Portal'].map(t => (
                      <button key={t} className="dash-palette-row" onClick={() => { setSearchQuery(t); performSearch(t); }}>
                        <TrendingUp size={14} color="#0080c7" /> {t}
                      </button>
                    ))}
                  </div>
                </>
              ) : searchResults.length === 0 ? (
                <div className="dash-palette-empty">
                  <Search size={24} color="#dee2e6" />
                  <p>No results for "<strong>{searchQuery}</strong>"</p>
                </div>
              ) : (
                searchResults.map((r, i) => (
                  <button key={i} className="dash-palette-result" onClick={() => handleSearchNavigate(r.path, r.title)}>
                    <div className="dash-palette-result-icon">{getSearchIcon(r.icon)}</div>
                    <div className="dash-palette-result-info">
                      <h4>{r.title}</h4>
                      <p>{r.subtitle}</p>
                    </div>
                    <span className="dash-palette-result-type">{r.type}</span>
                  </button>
                ))
              )}
            </div>
            <div className="dash-palette-footer">
              <span><Command size={11} /> Ctrl+K</span>
              <span>{searchResults.length} results</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NOTIFICATION DRAWER ═══ */}
      {notifOpen && (
        <div className="dash-overlay dash-overlay-bottom" onClick={() => setNotifOpen(false)}>
          <div className="dash-drawer" onClick={e => e.stopPropagation()}>
            <div className="dash-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2>Notifications</h2>
                {unreadCount > 0 && <span className="dash-drawer-badge">{unreadCount}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unreadCount > 0 && (
                  <button className="dash-drawer-mark" onClick={markAllRead}>Mark all read</button>
                )}
                <button className="dash-palette-close" onClick={() => setNotifOpen(false)}><X size={14} /></button>
              </div>
            </div>

            <div className="dash-drawer-tabs">
              {['all', 'academic', 'event', 'finance'].map(cat => (
                <button key={cat} onClick={() => setNotifCategory(cat)}
                  className={`dash-drawer-tab ${notifCategory === cat ? 'active' : ''}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="dash-drawer-list">
              {filteredNotifs.length === 0 ? (
                <div className="dash-palette-empty" style={{ padding: '48px 0' }}>
                  <CheckCircle size={28} color="#dee2e6" />
                  <p>All caught up!</p>
                </div>
              ) : (
                filteredNotifs.map(n => (
                  <button key={n.id} className={`dash-notif-item ${n.read ? 'read' : ''}`}
                    onClick={() => { setNotifOpen(false); navigate(n.path); }}>
                    <div className="dash-notif-icon" data-cat={n.category}>
                      {getNotifIcon(n.category)}
                    </div>
                    <div className="dash-notif-body">
                      <div className="dash-notif-title-row">
                        <h4>{n.title}</h4>
                        {!n.read && <span className={`dash-notif-dot ${n.urgency === 'critical' ? 'critical' : ''}`} />}
                      </div>
                      <p className="dash-notif-msg">{n.message}</p>
                      <p className="dash-notif-time">{getRelativeTime(n.timestamp)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <UpsellModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} />

      {/* Add Certification Modal */}
      {showAddCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in p-6" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <div className="rounded-[24px] p-6 shadow-2xl max-w-sm w-full animate-fade-in" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: C.blue + '14', color: C.blue }}>
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2" style={{ color: C.textPrimary }}>Verify Certification</h3>
            <p className="text-sm text-center mb-4" style={{ color: C.textSecondary }}>Verify NPTEL or Coursera credentials instantly.</p>
            {certError && (
              <div className="mb-4 p-3 rounded-xl text-xs font-semibold border" style={{ background: '#fdf3f3', borderColor: '#f8d7da', color: '#a91f23' }}>
                {certError}
              </div>
            )}
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: C.textSecondary }}>Platform</label>
                <select value={certPlatform} onChange={e => setCertPlatform(e.target.value)}
                  className="w-full rounded-2xl py-3 px-4 text-sm font-medium outline-none border focus:border-blue-400"
                  style={{ background: C.bg, borderColor: C.border, color: C.textPrimary }}>
                  <option value="coursera">Coursera</option>
                  <option value="nptel">NPTEL</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: C.textSecondary }}>Course/Certificate Title</label>
                <input type="text" value={certTitle} onChange={e => setCertTitle(e.target.value)}
                  className="w-full rounded-2xl py-3 px-4 text-sm font-medium outline-none border focus:border-blue-400"
                  style={{ background: C.bg, borderColor: C.border, color: C.textPrimary }} placeholder="e.g. Deep Learning Specialization" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: C.textSecondary }}>Certificate ID</label>
                <input type="text" value={certId} onChange={e => setCertId(e.target.value)}
                  className="w-full rounded-2xl py-3 px-4 text-sm font-medium outline-none border focus:border-blue-400"
                  style={{ background: C.bg, borderColor: C.border, color: C.textPrimary }} placeholder="e.g. COURSERA-123456" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowAddCertModal(false); setCertError(''); }} className="flex-1 py-3.5 rounded-[14px] font-semibold text-sm" style={{ background: C.bg, color: C.textPrimary }}>Cancel</button>
              <button onClick={handleAddCertification} disabled={certVerifying} className="flex-1 py-3.5 rounded-[14px] font-semibold text-sm text-white disabled:opacity-50" style={{ background: C.blue }}>
                {certVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SCOPED STYLES ═══ */}
      <style>{`
        /* ── Theme variables ─────────────────────── */
        .dash-root {
          --dash-bg: ${isDark ? '#0b0f19' : '#f4f5f7'};
          --dash-card: ${isDark ? '#1e293b' : '#ffffff'};
          --dash-text-primary: ${isDark ? '#f8fafc' : '#22346c'};
          --dash-text-secondary: ${isDark ? '#94a3b8' : '#868e96'};
          --dash-border: ${isDark ? '#334155' : '#e9ecef'};
          --dash-accent: ${accentColor};
          --dash-accent-hover: ${accentColor}dd;
          --dash-top-bg: ${isDark ? '#0f172a' : '#ffffff'};
          --dash-input-bg: ${isDark ? '#1e293b' : '#f4f5f7'};
          --dash-divider: ${isDark ? '#334155' : '#f1f3f5'};
        }

        /* ── Root ─────────────────────────────────── */
        .dash-root {
          height: 100%; display: flex; flex-direction: column;
          background: var(--dash-bg); font-family: 'Inter', -apple-system, system-ui, sans-serif;
          position: relative; padding-bottom: 80px;
        }

        /* ── Top (header) ────────────────────────── */
        .dash-top {
          background: var(--dash-top-bg); padding: 48px 24px 20px; position: relative;
        }
        .dash-top-row {
          display: flex; align-items: flex-start; justify-content: space-between;
        }
        .dash-date {
          font-size: 11px; font-weight: 500; color: #adb5bd;
          letter-spacing: 0.3px; margin-bottom: 4px;
        }
        .dash-greeting {
          font-size: 22px; font-weight: 700; color: #22346c;
          line-height: 1.25; letter-spacing: -0.3px;
        }
        .dash-top-actions { display: flex; gap: 8px; margin-top: 4px; }
        .dash-icon-btn {
          width: 40px; height: 40px; border-radius: 12px;
          background: var(--dash-input-bg); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--dash-text-primary); position: relative; transition: background 0.15s;
        }
        .dash-icon-btn:hover { background: #e9ecef; }
        .dash-badge {
          position: absolute; top: -2px; right: -2px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #a91f23; color: #fff; font-size: 9px;
          font-weight: 700; display: flex; align-items: center;
          justify-content: center;
        }

        /* Next action */
        .dash-next-action {
          display: flex; align-items: center; gap: 8px;
          width: 100%; margin-top: 16px; padding: 10px 14px;
          background: ${isDark ? '#1e293b' : '#f0f8fd'}; border-radius: 12px; border: none;
          cursor: pointer; text-align: left; transition: background 0.15s;
        }
        .dash-next-action:hover { background: ${isDark ? '#334155' : '#dfeffa'}; }
        .dash-next-action span {
          flex: 1; font-size: 13px; font-weight: 500; color: #22346c;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── Stat cards (like reference) ─────────── */
        .dash-stats-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; padding: 16px 20px 0;
        }
        .dash-stat-card {
          border-radius: 20px; padding: 20px 18px;
          border: none; cursor: pointer; text-align: left;
          transition: transform 0.15s;
        }
        .dash-stat-card:active { transform: scale(0.97); }
        .dash-stat-blue { background: ${isDark ? '#1e293b' : '#dff0fb'}; }
        .dash-stat-cyan { background: ${isDark ? '#1e293b' : '#e4f6f9'}; }
        .dash-stat-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: #495057;
          margin-bottom: 8px;
        }
        .dash-stat-value {
          font-size: 32px; font-weight: 800; color: #22346c;
          letter-spacing: -1px; line-height: 1;
        }
        .dash-stat-unit {
          font-size: 14px; font-weight: 600; color: #868e96;
          letter-spacing: 0;
        }

        /* ── Sections ────────────────────────────── */
        .dash-scroll {
          flex: 1; overflow-y: auto; scrollbar-width: none;
        }
        .dash-scroll::-webkit-scrollbar { display: none; }
        .dash-section { padding: 0 20px; margin-top: 24px; }
        .dash-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .dash-section-title {
          font-size: 15px; font-weight: 700; color: #22346c;
        }
        .dash-see-all {
          font-size: 12px; font-weight: 600; color: #0080c7;
          display: flex; align-items: center; gap: 2px;
          background: none; border: none; cursor: pointer;
        }
        .dash-see-all:hover { color: var(--dash-accent-hover); }
        .dash-empty {
          text-align: center; padding: 32px; color: #adb5bd;
          font-size: 14px; background: #fff; border-radius: 16px;
        }

        /* ── Quick Actions (circular) ────────────── */
        .dash-actions-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px 8px;
        }
        .dash-action-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; background: none; border: none; cursor: pointer;
        }
        .dash-action-item:active .dash-action-circle { transform: scale(0.9); }
        .dash-action-circle {
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s;
        }
        .dash-action-label {
          font-size: 10px; font-weight: 600; color: #495057;
          text-align: center; line-height: 1.3;
        }

        /* ── Schedule ────────────────────────────── */
        .dash-schedule-list { display: flex; flex-direction: column; gap: 8px; }
        .dash-schedule-item {
          display: flex; align-items: center; gap: 14px;
          background: var(--dash-card); border-radius: 14px; padding: 14px 16px;
          border: none; cursor: pointer; text-align: left;
          transition: box-shadow 0.15s;
        }
        .dash-schedule-item:hover { box-shadow: 0 2px 8px rgba(34,52,108,0.06); }
        .dash-schedule-time {
          display: flex; flex-direction: column; align-items: center;
          min-width: 42px;
        }
        .dash-time-text { font-size: 13px; font-weight: 700; color: var(--dash-text-primary); }
        .dash-time-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--dash-border); margin: 3px 0;
        }
        .dash-time-sub { font-size: 11px; color: var(--dash-text-secondary); font-weight: 500; }
        .dash-schedule-info { flex: 1; min-width: 0; }
        .dash-schedule-name {
          font-size: 14px; font-weight: 600; color: #22346c;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          margin: 0;
        }
        .dash-schedule-meta {
          font-size: 11px; color: var(--dash-text-secondary); margin: 3px 0 0;
          font-weight: 500;
        }

        /* ── Deadlines / Notices ──────────────────── */
        .dash-deadline-list { display: flex; flex-direction: column; gap: 8px; }
        .dash-deadline-item {
          display: flex; align-items: center; gap: 12px;
          background: var(--dash-card); border-radius: 14px; padding: 14px 16px;
          border: none; cursor: pointer; text-align: left;
          transition: box-shadow 0.15s;
        }
        .dash-deadline-item:hover { box-shadow: 0 2px 8px rgba(34,52,108,0.06); }
        .dash-deadline-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dash-deadline-info { flex: 1; min-width: 0; }
        .dash-deadline-info h3 {
          font-size: 13px; font-weight: 600; color: #22346c;
          margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dash-deadline-info p {
          font-size: 11px; color: var(--dash-text-secondary); margin: 2px 0 0; font-weight: 500;
        }
        .dash-deadline-badge {
          font-size: 10px; font-weight: 700; padding: 4px 10px;
          border-radius: 8px; flex-shrink: 0;
        }
        .dash-urgency-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #a91f23; flex-shrink: 0;
          animation: pulse-dot 2s infinite;
        }

        /* ── Activity Card (dark) ────────────────── */
        .dash-activity-card {
          background: ${isDark ? 'var(--dash-card)' : '#22346c'}; border-radius: 24px; border: ${isDark ? '1px solid var(--dash-border)' : 'none'}; padding: 22px 20px;
          color: #fff;
        }
        .dash-activity-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .dash-activity-label { font-size: 12px; color: var(--dash-text-secondary); font-weight: 500; margin: 0 0 4px; }
        .dash-activity-value { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
        .dash-activity-unit { font-size: 12px; font-weight: 500; color: var(--dash-text-secondary); }
        .dash-activity-ring { position: relative; }
        .dash-ring-text {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #27bcd1;
        }
        .dash-bar-chart {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 8px; height: 80px;
        }
        .dash-bar-col {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 6px; height: 100%;
        }
        .dash-bar-track {
          flex: 1; width: 100%; display: flex; align-items: flex-end;
          justify-content: center;
        }
        .dash-bar-fill {
          width: 100%; max-width: 28px; border-radius: 6px;
          position: relative; min-height: 8px;
          transition: height 0.5s ease;
        }
        .dash-bar-tip {
          position: absolute; top: -22px; left: 50%;
          transform: translateX(-50%);
          background: #27bcd1; color: #fff; font-size: 10px;
          font-weight: 700; padding: 2px 7px; border-radius: 6px;
        }
        .dash-bar-tip::after {
          content: ''; position: absolute; bottom: -4px; left: 50%;
          transform: translateX(-50%);
          border-left: 4px solid transparent; border-right: 4px solid transparent;
          border-top: 4px solid #27bcd1;
        }
        .dash-bar-day { font-size: 10px; font-weight: 600; color: var(--dash-text-secondary); }

        /* ── Overlay ─────────────────────────────── */
        .dash-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(34,52,108,0.35); backdrop-filter: blur(4px);
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 72px;
          animation: fadeIn 0.15s ease;
        }
        .dash-overlay-bottom { align-items: flex-end; padding-top: 0; }

        /* ── Command Palette ──────────────────────── */
        .dash-palette {
          background: var(--dash-card); border-radius: 20px; border: 1px solid var(--dash-border); width: 92%; max-width: 420px;
          box-shadow: 0 12px 40px rgba(34,52,108,0.12);
          overflow: hidden; animation: slideUp 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        .dash-palette-input-row {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px; border-bottom: 1px solid var(--dash-divider);
        }
        .dash-palette-input {
          flex: 1; border: none; outline: none; font-size: 14px;
          font-weight: 500; color: var(--dash-text-primary); background: transparent;
        }
        .dash-palette-input::placeholder { color: var(--dash-text-secondary); }
        .dash-palette-close {
          width: 26px; height: 26px; border-radius: 8px;
          background: var(--dash-input-bg); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--dash-text-secondary); transition: background 0.15s;
        }
        .dash-palette-close:hover { background: #e9ecef; }
        .dash-palette-body { max-height: 55vh; overflow-y: auto; padding: 8px; }
        .dash-palette-section { padding: 8px; }
        .dash-palette-label {
          font-size: 10px; font-weight: 700; color: #adb5bd;
          text-transform: uppercase; letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .dash-palette-row {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer; font-size: 13px;
          font-weight: 500; color: var(--dash-text-primary); text-align: left;
          transition: background 0.12s;
        }
        .dash-palette-row:hover { background: #f4f5f7; }
        .dash-palette-empty {
          text-align: center; padding: 32px 0;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .dash-palette-empty p { font-size: 13px; color: var(--dash-text-secondary); margin: 0; }
        .dash-palette-result {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer; text-align: left;
          transition: background 0.12s;
        }
        .dash-palette-result:hover { background: #f4f5f7; }
        .dash-palette-result-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: #f1f3f5; display: flex; align-items: center;
          justify-content: center; color: #868e96; flex-shrink: 0;
        }
        .dash-palette-result-info { flex: 1; min-width: 0; }
        .dash-palette-result-info h4 {
          font-size: 13px; font-weight: 600; color: #22346c;
          margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dash-palette-result-info p { font-size: 10px; color: var(--dash-text-secondary); margin: 2px 0 0; }
        .dash-palette-result-type {
          font-size: 9px; font-weight: 700; color: #adb5bd;
          background: #f1f3f5; padding: 2px 8px; border-radius: 6px;
          text-transform: uppercase; flex-shrink: 0;
        }
        .dash-palette-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px; border-top: 1px solid var(--dash-divider);
          font-size: 10px; font-weight: 600; color: #adb5bd;
        }
        .dash-palette-footer span { display: flex; align-items: center; gap: 4px; }

        /* ── Notification Drawer ──────────────────── */
        .dash-drawer {
          background: var(--dash-card); border-radius: 24px 24px 0 0; border-top: 1px solid var(--dash-border);
          width: 100%; max-width: 480px; max-height: 82vh;
          display: flex; flex-direction: column;
          box-shadow: 0 -8px 40px rgba(34,52,108,0.1);
          animation: slideUp 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        .dash-drawer-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 20px 12px; border-bottom: 1px solid var(--dash-divider);
        }
        .dash-drawer-header h2 {
          font-size: 17px; font-weight: 700; color: var(--dash-text-primary); margin: 0;
        }
        .dash-drawer-badge {
          background: #a91f23; color: #fff; font-size: 10px;
          font-weight: 700; padding: 2px 8px; border-radius: 10px;
        }
        .dash-drawer-mark {
          font-size: 11px; font-weight: 600; color: #0080c7;
          background: none; border: none; cursor: pointer;
        }
        .dash-drawer-tabs {
          display: flex; gap: 6px; padding: 12px 20px; flex-shrink: 0;
        }
        .dash-drawer-tab {
          padding: 6px 14px; border-radius: 10px; border: none;
          font-size: 11px; font-weight: 600; text-transform: capitalize;
          background: var(--dash-input-bg); color: var(--dash-text-secondary); cursor: pointer;
          transition: all 0.15s;
        }
        .dash-drawer-tab.active {
          background: var(--dash-accent); color: #fff;
        }
        .dash-drawer-list {
          flex: 1; overflow-y: auto; padding: 8px 16px 16px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .dash-notif-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px; border-radius: 14px; border: none;
          cursor: pointer; text-align: left; width: 100%;
          background: var(--dash-card); border: 1px solid var(--dash-border);
          transition: box-shadow 0.15s;
        }
        .dash-notif-item.read { background: ${isDark ? '#1e293b80' : '#f8f9fa'}; border-color: var(--dash-border); }
        .dash-notif-item:hover { box-shadow: 0 2px 8px rgba(34,52,108,0.06); }
        .dash-notif-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dash-notif-icon[data-cat="academic"] { background: ${isDark ? '#1e293b' : '#dff0fb'}; color: #0080c7; }
        .dash-notif-icon[data-cat="event"] { background: #fdf3f3; color: #a91f23; }
        .dash-notif-icon[data-cat="finance"] { background: #fcf5f4; color: #c9503d; }
        .dash-notif-body { flex: 1; min-width: 0; }
        .dash-notif-title-row {
          display: flex; align-items: center; gap: 6px; margin-bottom: 2px;
        }
        .dash-notif-title-row h4 {
          font-size: 13px; font-weight: 600; color: var(--dash-text-primary); margin: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dash-notif-item.read .dash-notif-title-row h4 { color: var(--dash-text-secondary); }
        .dash-notif-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #0080c7; flex-shrink: 0;
        }
        .dash-notif-dot.critical {
          background: #a91f23; animation: pulse-dot 2s infinite;
        }
        .dash-notif-msg {
          font-size: 11px; color: var(--dash-text-secondary); margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .dash-notif-time {
          font-size: 10px; color: var(--dash-text-secondary); font-weight: 600; margin: 4px 0 0;
        }

        /* ── Animations ──────────────────────────── */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
