import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Bell, Search, X, ChevronRight, Clock, BookOpen, FileText,
  CalendarDays, QrCode, Bus, MapPin, Briefcase, GraduationCap,
  Activity, TrendingUp, CheckCircle, AlertTriangle, DollarSign,
  Calendar, Users, Coffee, Zap, Command, Award, Trophy, Star,
  ThumbsUp, Plus, GripVertical, Sliders, Settings, Eye, EyeOff
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

interface WidgetConfig {
  id: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'schedule', title: "Today's Schedule", size: 'medium', visible: true },
  { id: 'activity', title: 'Activity & Screen Time', size: 'medium', visible: true },
  { id: 'attendance', title: 'Attendance Tracker', size: 'small', visible: true },
  { id: 'deadlines', title: 'Academic Deadlines', size: 'small', visible: true },
  { id: 'notices', title: 'Notice Board', size: 'small', visible: true },
  { id: 'portfolio', title: 'Portfolio & Skills', size: 'medium', visible: true },
  { id: 'placements', title: 'Placements & Jobs', size: 'medium', visible: true },
  { id: 'projects', title: 'Projects & Team Finder', size: 'medium', visible: true },
  { id: 'transit', title: 'Bus Timings & Transit', size: 'small', visible: true },
  { id: 'canteen', title: 'Canteen Menu', size: 'small', visible: true },
  { id: 'library', title: 'Library Hub', size: 'small', visible: true },
  { id: 'results', title: 'Semester Results & GPA', size: 'small', visible: true },
  { id: 'study_assistant', title: 'AI Study Assistant', size: 'medium', visible: true },
];

const GUEST_SLIDES = [
  { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80', title: "Opening Concert: DJ Axwell", desc: "LAVAZA '26: Rocking the Veltech Amphitheatre" },
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80', title: "Battle of the Beats", desc: "Inter-collegiate Choreography Finals" },
  { url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80', title: "Rock Showdown", desc: "Top bands battle for the ₹1,00,000 grand prize" },
  { url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80', title: "Panel & Tech Talks", desc: "Leading industry speakers share insights" },
];

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

  const activeUserId = user?.id || 'guest';
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const stored = localStorage.getItem(`widgets_${activeUserId}`);
      if (stored) {
        const parsed = JSON.parse(stored).filter((w: any) => w.id !== 'quick_actions');
        const parsedIds = parsed.map((w: any) => w.id);
        const missing = DEFAULT_WIDGETS.filter(w => !parsedIds.includes(w.id));
        return [...parsed, ...missing];
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WIDGETS;
  });

  const saveWidgetsConfig = (newWidgets: WidgetConfig[]) => {
    localStorage.setItem(`widgets_${activeUserId}`, JSON.stringify(newWidgets));
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [manageWidgetsOpen, setManageWidgetsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── New Interactive States ────────────────────────────────────
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const today = new Date().getDay(); // 0=Sunday, 1=Monday
    return today === 0 ? 0 : today - 1;
  });
  const [weeklyTimetable, setWeeklyTimetable] = useState<Record<string, any[]>>({});

  // AI Study Assistant states
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Guest inquiry states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryDept, setInquiryDept] = useState('Computer Science');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  // Fetch student weekly timetable
  useEffect(() => {
    if (isGuest) return;
    (async () => {
      try {
        const res = await api.get('/timetable/my-timetable');
        if (res.data && res.data.grid) {
          setWeeklyTimetable(res.data.grid);
        }
      } catch (err) {
        console.warn("Failed to fetch weekly timetable", err);
      }
    })();
  }, [isGuest]);

  const handleAskAI = () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setTimeout(() => {
      const q = aiQuery.toLowerCase();
      let res = "To excel in this topic, practice active recall, solve previous years' questions, and explain the concept to a peer!";
      if (q.includes('recursion')) {
        res = "Recursion is a process where a function calls itself. Always define a base case to prevent stack overflow!";
      } else if (q.includes('react') || q.includes('hook')) {
        res = "React uses hooks like useState and useEffect to manage component state and side-effects reactively.";
      } else if (q.includes('database') || q.includes('sql') || q.includes('dbms')) {
        res = "DBMS organizes data efficiently. Focus on normalization (1NF, 2NF, 3NF) and database indexing for speeds.";
      } else if (q.includes('attendance') || q.includes('bunk')) {
        res = "Maintain at least 75% attendance to avoid bunk alerts and eligibility issues for exams!";
      }
      setAiResponse(res);
      setAiQuery('');
      setAiLoading(false);
    }, 800);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryEmail.trim() || !inquiryPhone.trim()) return;
    setInquirySubmitting(true);
    setTimeout(() => {
      setInquirySubmitting(false);
      setInquirySubmitted(true);
    }, 1200);
  };

  useEffect(() => {
    if (!isGuest) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % GUEST_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isGuest]);

  const handleResizeWidget = (id: string, size: 'small' | 'medium' | 'large') => {
    const updated = widgets.map(w => w.id === id ? { ...w, size } : w);
    setWidgets(updated);
    saveWidgetsConfig(updated);
  };

  const handleToggleWidgetVisibility = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setWidgets(updated);
    saveWidgetsConfig(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex) return;

    const newWidgets = [...widgets];
    const [draggedItem] = newWidgets.splice(sourceIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedItem);
    setWidgets(newWidgets);
    saveWidgetsConfig(newWidgets);
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await api.post(`/home/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
    setNotifOpen(false);
    navigate(n.path);
  };

  const renderWidgetHeader = (w: WidgetConfig) => {
    return (
      <div className="widget-header">
        <span className="widget-title">{w.title}</span>
        <div className="widget-header-controls">
          {isEditMode ? (
            <>
              <select
                value={w.size}
                onChange={(e) => handleResizeWidget(w.id, e.target.value as any)}
                className="widget-size-select"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="small">S</option>
                <option value="medium">M</option>
                <option value="large">L</option>
              </select>
              <button className="widget-action-btn" onClick={(e) => { e.stopPropagation(); handleToggleWidgetVisibility(w.id); }} title="Hide">
                <EyeOff size={14} />
              </button>
              <div className="widget-drag-handle" title="Drag to reorder">
                <GripVertical size={14} />
              </div>
            </>
          ) : (
            w.id === 'schedule' ? (
              <button className="dash-see-all" onClick={() => navigate('/academic/timetable')}>
                View all <ChevronRight size={13} />
              </button>
            ) : w.id === 'deadlines' ? (
              <button className="dash-see-all" onClick={() => { isGuest ? setUpsellOpen(true) : navigate('/academic/assignments'); }}>
                View all <ChevronRight size={13} />
              </button>
            ) : w.id === 'notices' ? (
              <button className="dash-see-all" onClick={() => navigate('/campus/notices')}>
                View all <ChevronRight size={13} />
              </button>
            ) : w.id === 'portfolio' ? (
              <button className="dash-see-all" onClick={() => navigate('/career/portfolio')}>
                Build Portfolio <ChevronRight size={13} />
              </button>
            ) : w.id === 'placements' ? (
              <button className="dash-see-all" onClick={() => navigate('/career/jobs')}>
                View Jobs <ChevronRight size={13} />
              </button>
            ) : w.id === 'projects' ? (
              <button className="dash-see-all" onClick={() => navigate('/career/portfolio')}>
                My Projects <ChevronRight size={13} />
              </button>
            ) : w.id === 'transit' ? (
              <button className="dash-see-all" onClick={() => navigate('/campus/bus')}>
                Bus Timings <ChevronRight size={13} />
              </button>
            ) : w.id === 'canteen' ? (
              <button className="dash-see-all" onClick={() => navigate('/campus/canteen')}>
                Canteen Menu <ChevronRight size={13} />
              </button>
            ) : w.id === 'library' ? (
              <button className="dash-see-all" onClick={() => navigate('/campus/library')}>
                Library Hub <ChevronRight size={13} />
              </button>
            ) : w.id === 'results' ? (
              <button className="dash-see-all" onClick={() => navigate('/academic/results')}>
                Grade Sheets <ChevronRight size={13} />
              </button>
            ) : null
          )}
        </div>
      </div>
    );
  };

  // ── Theme / Accent variables ───────────────────────────────────
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accent_color') || '#0080c7');

  useEffect(() => {
    const handleThemeChange = () => {
      setAccentColor(localStorage.getItem('accent_color') || '#0080c7');
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  const isDark = false;

  const C = {
    navy: '#22346c',
    blue: accentColor,
    red: '#a91f23',
    terra: '#c9503d',
    cyan: '#27bcd1',
    bg: '#f4f5f7',
    card: '#ffffff',
    textPrimary: '#22346c',
    textSecondary: '#868e96',
    border: '#e9ecef',
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
  // ── Weekly Activity Chart Calculations ─────────────────────
  const FALLBACK_WEEKLY_TIMETABLE: Record<string, any[]> = {
    monday: [
      { start_time: '09:00', end_time: '10:00', subject_name: 'Data Structures', room: 'A301', faculty_name: 'Dr. Kumar' },
      { start_time: '10:15', end_time: '11:15', subject_name: 'Operating Systems', room: 'B202', faculty_name: 'Dr. Priya' },
      { start_time: '11:30', end_time: '12:30', subject_name: 'Computer Networks', room: 'A105', faculty_name: 'Dr. Raj' },
    ],
    tuesday: [
      { start_time: '09:00', end_time: '10:00', subject_name: 'Database Systems', room: 'B303', faculty_name: 'Dr. Anita' },
      { start_time: '10:15', end_time: '12:15', subject_name: 'DBMS Lab', room: 'Lab 4', faculty_name: 'Dr. Meena' },
      { start_time: '14:00', end_time: '15:00', subject_name: 'Theory of Computation', room: 'A201', faculty_name: 'Dr. Verma' },
    ],
    wednesday: [
      { start_time: '09:00', end_time: '10:00', subject_name: 'Software Engineering', room: 'A204', faculty_name: 'Dr. Shalini' },
      { start_time: '10:15', end_time: '11:15', subject_name: 'Operating Systems', room: 'B202', faculty_name: 'Dr. Priya' },
      { start_time: '14:00', end_time: '16:00', subject_name: 'OS Lab', room: 'Lab 2', faculty_name: 'Dr. Priya' },
    ],
    thursday: [
      { start_time: '09:00', end_time: '10:00', subject_name: 'Computer Networks', room: 'A105', faculty_name: 'Dr. Raj' },
      { start_time: '10:15', end_time: '11:15', subject_name: 'Data Structures', room: 'A301', faculty_name: 'Dr. Kumar' },
      { start_time: '11:30', end_time: '12:30', subject_name: 'Mathematics IV', room: 'A102', faculty_name: 'Dr. Shobha' },
      { start_time: '14:00', end_time: '15:00', subject_name: 'Biology for Engineers', room: 'B101', faculty_name: 'Dr. Suresh' },
    ],
    friday: [
      { start_time: '09:00', end_time: '10:00', subject_name: 'Theory of Computation', room: 'A201', faculty_name: 'Dr. Verma' },
      { start_time: '10:15', end_time: '11:15', subject_name: 'Database Systems', room: 'B303', faculty_name: 'Dr. Anita' },
      { start_time: '11:30', end_time: '12:30', subject_name: 'Software Engineering', room: 'A204', faculty_name: 'Dr. Shalini' },
    ],
    saturday: [
      { start_time: '09:00', end_time: '10:00', subject_name: 'Technical Seminar', room: 'Seminar Hall', faculty_name: 'Dr. Kumar' },
    ]
  };

  const currentWeeklyTimetable = Object.keys(weeklyTimetable).length > 0 ? weeklyTimetable : FALLBACK_WEEKLY_TIMETABLE;
  const daysKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const classData = daysKeys.map(k => (currentWeeklyTimetable[k] || []).length);
  const maxBar = Math.max(...classData, 1);

  const selectedDayKey = daysKeys[selectedDayIndex];
  const selectedDayClasses = currentWeeklyTimetable[selectedDayKey] || [];

  // ── RENDER ─────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div className="dash-root guest-dashboard">
        {/* Guest Header */}
        <div className="dash-top">
          <div className="dash-top-row">
            <div>
              <p className="dash-date">{todayDate}</p>
              <h1 className="dash-greeting">Welcome to<br/>Veltech Multitech</h1>
            </div>
            <div className="dash-top-actions">
              <button className="guest-login-badge-btn" onClick={() => navigate('/login')} style={{ fontSize: '11px', fontWeight: 'bold', background: C.blue, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer' }}>
                Sign In
              </button>
            </div>
          </div>
        </div>

        <div className="dash-scroll" style={{ paddingBottom: '32px' }}>
          {/* Hero Branding card */}
          <div className="guest-hero-card">
            <h2 className="guest-hero-title">Empowering Next-Gen Innovators</h2>
            <p className="guest-hero-desc">
              Veltech Multitech is a premier Tier-1 accredited institution offering world-class infrastructure, industry-integrated learning, and stellar placements. Take a glance at our campus life.
            </p>
          </div>

          {/* LAVAZA Highlights Carousel */}
          <div style={{ padding: '0 20px', marginTop: '20px' }}>
            <p className="guest-section-tag">VIBRANT CAMPUS LIFE</p>
            <h3 className="guest-section-title">LAVAZA '26 Fest Highlights</h3>
          </div>
          <div className="guest-slider-container" style={{ margin: '10px 20px 24px' }}>
            <div className="guest-slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {GUEST_SLIDES.map((slide, idx) => (
                <div key={idx} className="guest-slide">
                  <img src={slide.url} alt={slide.title} className="guest-slide-image" />
                  <div className="guest-slide-overlay" />
                  <div className="guest-slide-content">
                    <span className="guest-slide-tag">LAVAZA '26 Event Highlight</span>
                    <h3 className="guest-slide-title">{slide.title}</h3>
                    <p className="guest-slide-desc">{slide.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="guest-slider-dots">
              {GUEST_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  className={`guest-slider-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>
          </div>

          {/* Explore Public Actions */}
          <div style={{ padding: '0 20px' }}>
            <p className="guest-section-tag">EXPLORE PORTAL</p>
            <h3 className="guest-section-title">Campus Hub & Quick Links</h3>
            <div className="guest-explore-grid" style={{ marginTop: '12px', marginBottom: '24px' }}>
              <button className="guest-explore-item" onClick={() => navigate('/campus/map')}>
                <div className="guest-explore-circle" style={{ background: '#0080c714', color: '#0080c7' }}>
                  <MapPin size={22} />
                </div>
                <span className="guest-explore-label">Campus Map</span>
              </button>
              <button className="guest-explore-item" onClick={() => navigate('/campus/bus')}>
                <div className="guest-explore-circle" style={{ background: '#22346c14', color: '#22346c' }}>
                  <Bus size={22} />
                </div>
                <span className="guest-explore-label">Bus Timings</span>
              </button>
              <button className="guest-explore-item" onClick={() => navigate('/campus/canteen')}>
                <div className="guest-explore-circle" style={{ background: '#c9503d14', color: '#c9503d' }}>
                  <Coffee size={22} />
                </div>
                <span className="guest-explore-label">Canteen Menu</span>
              </button>
              <button className="guest-explore-item" onClick={() => navigate('/campus/notices')}>
                <div className="guest-explore-circle" style={{ background: '#27bcd114', color: '#27bcd1' }}>
                  <Bell size={22} />
                </div>
                <span className="guest-explore-label">Public Notices</span>
              </button>
              <button className="guest-explore-item" onClick={() => navigate('/campus/events')}>
                <div className="guest-explore-circle" style={{ background: '#a91f2314', color: '#a91f23' }}>
                  <Calendar size={22} />
                </div>
                <span className="guest-explore-label">Events & Fests</span>
              </button>
            </div>
          </div>

          {/* Marketing Statistics Grid */}
          <div style={{ padding: '0 20px' }}>
            <p className="guest-section-tag">OUR ACHIEVEMENTS</p>
            <h3 className="guest-section-title">VTU Multitech At A Glance</h3>
            <div className="guest-stats-grid" style={{ marginTop: '12px', marginBottom: '24px' }}>
              <div className="guest-stat-card">
                <div className="guest-stat-header">
                  <Briefcase size={16} color="#0080c7" />
                  <span className="guest-stat-num">98%</span>
                </div>
                <h4 className="guest-stat-title">Placements</h4>
                <p className="guest-stat-desc">Top MNC recruiters like Google, Amazon, Deloitte visit annually.</p>
              </div>
              <div className="guest-stat-card">
                <div className="guest-stat-header">
                  <Award size={16} color="#27bcd1" />
                  <span className="guest-stat-num">A++</span>
                </div>
                <h4 className="guest-stat-title">NAAC Grade</h4>
                <p className="guest-stat-desc">Accredited with highest tier rating for education quality.</p>
              </div>
              <div className="guest-stat-card">
                <div className="guest-stat-header">
                  <Users size={16} color="#c9503d" />
                  <span className="guest-stat-num">150+</span>
                </div>
                <h4 className="guest-stat-title">Recruiters</h4>
                <p className="guest-stat-desc">Strong global partnership networks for technical hiring.</p>
              </div>
              <div className="guest-stat-card">
                <div className="guest-stat-header">
                  <Zap size={16} color="#a91f23" />
                  <span className="guest-stat-num">20+</span>
                </div>
                <h4 className="guest-stat-title">Research Centers</h4>
                <p className="guest-stat-desc">State of the art labs for AI, Robotics & Cloud Computing.</p>
              </div>
            </div>
          </div>

          {/* Apply Online / Admission CTA Form */}
          <div style={{ padding: '0 20px' }}>
            <div className="guest-cta-box">
              {inquirySubmitted ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#d1e7dd', color: '#0f5132', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <CheckCircle size={24} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: C.textPrimary, margin: '0 0 4px 0' }}>Inquiry Submitted!</h3>
                  <p style={{ fontSize: '11px', color: C.textSecondary, margin: 0 }}>Thank you for your interest. Our admissions counselor will contact you shortly.</p>
                  <button onClick={() => setInquirySubmitted(false)} style={{ marginTop: '16px', border: 'none', background: C.blue, color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit}>
                  <p className="guest-section-tag" style={{ color: C.blue }}>APPLY ONLINE</p>
                  <h3 className="guest-cta-title" style={{ color: C.textPrimary }}>Admission Inquiry</h3>
                  <p style={{ fontSize: '11px', color: C.textSecondary, margin: '4px 0 16px 0' }}>Get free counseling & admission details instantly.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={inquiryName}
                      onChange={e => setInquiryName(e.target.value)}
                      className="guest-form-input"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={inquiryEmail}
                      onChange={e => setInquiryEmail(e.target.value)}
                      className="guest-form-input"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      required
                      value={inquiryPhone}
                      onChange={e => setInquiryPhone(e.target.value)}
                      className="guest-form-input"
                    />
                    <select
                      value={inquiryDept}
                      onChange={e => setInquiryDept(e.target.value)}
                      className="guest-form-input"
                    >
                      <option value="Computer Science">Computer Science (CSE)</option>
                      <option value="Information Technology">Information Technology (IT)</option>
                      <option value="Electronics & Communication">Electronics (ECE)</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Biotechnology">Biotechnology</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="guest-cta-btn"
                    style={{ background: C.blue, width: '100%', border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                  >
                    {inquirySubmitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <BottomNav />
        <style>{`
          .guest-hero-card {
            background: linear-gradient(135deg, #22346c 0%, #0080c7 100%);
            border-radius: 24px;
            padding: 24px;
            margin: 16px 20px;
            color: #fff;
            box-shadow: 0 8px 24px rgba(34,52,108,0.15);
            text-align: left;
          }
          .guest-hero-title {
            font-size: 20px;
            font-weight: 800;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
          }
          .guest-hero-desc {
            font-size: 11px;
            line-height: 1.5;
            margin: 0;
            opacity: 0.9;
          }
          .guest-section-tag {
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1.2px;
            color: #adb5bd;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .guest-section-title {
            font-size: 16px;
            font-weight: 800;
            color: #22346c;
            margin: 0;
            letter-spacing: -0.3px;
          }
          .guest-explore-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            padding: 0;
          }
          .guest-explore-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
          }
          .guest-explore-circle {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.15s;
          }
          .guest-explore-item:active .guest-explore-circle {
            transform: scale(0.9);
          }
          .guest-explore-label {
            font-size: 9px;
            font-weight: 700;
            color: #495057;
            text-align: center;
            line-height: 1.2;
          }
          .guest-stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .guest-stat-card {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 16px;
            padding: 14px;
            text-align: left;
            transition: transform 0.15s, box-shadow 0.15s;
          }
          .guest-stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(34,52,108,0.04);
          }
          .guest-stat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .guest-stat-num {
            font-size: 18px;
            font-weight: 800;
            color: #22346c;
          }
          .guest-stat-title {
            font-size: 11px;
            font-weight: 700;
            color: #495057;
            margin: 0 0 2px 0;
          }
          .guest-stat-desc {
            font-size: 9px;
            color: #868e96;
            margin: 0;
            line-height: 1.3;
          }
          .guest-cta-box {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 24px;
            padding: 20px;
            box-shadow: 0 4px 16px rgba(34,52,108,0.03);
            text-align: left;
          }
          .guest-cta-title {
            font-size: 16px;
            font-weight: 800;
            margin: 0;
          }
          .guest-form-input {
            width: 100%;
            padding: 10px 14px;
            border-radius: 10px;
            border: 1px solid #dee2e6;
            font-size: 11px;
            font-weight: 500;
            outline: none;
            background: #f8f9fa;
            color: #22346c;
            transition: border-color 0.15s;
          }
          .guest-form-input:focus {
            border-color: #0080c7;
          }
        `}</style>
      </div>
    );
  }

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

        {/* Guest Events Slider */}
        {isGuest && (
          <div className="guest-slider-container">
            <div className="guest-slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {GUEST_SLIDES.map((slide, idx) => (
                <div key={idx} className="guest-slide">
                  <img src={slide.url} alt={slide.title} className="guest-slide-image" />
                  <div className="guest-slide-overlay" />
                  <div className="guest-slide-content">
                    <span className="guest-slide-tag">LAVAZA '26 Event Highlight</span>
                    <h3 className="guest-slide-title">{slide.title}</h3>
                    <p className="guest-slide-desc">{slide.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="guest-slider-dots">
              {GUEST_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  className={`guest-slider-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Widget Customization Controls */}
        <div className="dash-controls-row">
          <button
            className={`dash-control-btn ${isEditMode ? 'active' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Sliders size={14} />
            <span>{isEditMode ? 'Exit Edit' : 'Edit Layout'}</span>
          </button>
          <button
            className="dash-control-btn"
            onClick={() => setManageWidgetsOpen(true)}
          >
            <Settings size={14} />
            <span>Manage Widgets</span>
          </button>
        </div>

        {/* Widgets Grid */}
        <div className="widgets-grid">
          {widgets
            .filter(w => w.visible)
            .map((w, index) => (
              <div
                key={w.id}
                draggable={isEditMode}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`widget-wrapper widget-span-${w.size} ${isEditMode ? 'edit-mode' : ''}`}
              >
                {renderWidgetHeader(w)}
                
                {w.id === 'quick_actions' && (
                  <div className="dash-actions-grid" style={{ width: '100%' }}>
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
                )}

                {w.id === 'attendance' && (
                  <div className="widget-attendance-content" onClick={() => navigate('/academic/attendance')} style={{ cursor: 'pointer', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div>
                        <div className="dash-stat-value" style={{ fontSize: '28px' }}>
                          {feed.stats.attendance_pct}<span className="dash-stat-unit">%</span>
                        </div>
                        <p className="text-[11px]" style={{ color: C.textSecondary, margin: '4px 0 0 0' }}>
                          {feed.attendance.present} / {feed.attendance.total_classes} classes
                        </p>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <DonutChart pct={feed.stats.attendance_pct} color={C.cyan} size={50} />
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: C.cyan }}>
                          {feed.stats.attendance_pct}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {w.id === 'schedule' && (
                  <div className="widget-schedule-content" style={{ width: '100%' }}>
                    {feed.today_classes.length === 0 ? (
                      <div className="dash-empty">No classes today 🎉</div>
                    ) : (
                      <div className="dash-schedule-list">
                        {feed.today_classes.map((cls, i) => (
                          <button key={cls.id || i} className="dash-schedule-item" onClick={() => navigate('/academic/timetable')} style={{ width: '100%' }}>
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
                )}

                {w.id === 'deadlines' && (
                  <div className="widget-deadlines-content" style={{ width: '100%' }}>
                    {feed.upcoming_assignments.length === 0 ? (
                      <div className="dash-empty">No upcoming deadlines 🎉</div>
                    ) : (
                      <div className="dash-deadline-list">
                        {feed.upcoming_assignments.map((a, i) => {
                          const dl = getDaysLeft(a.due_date);
                          const urgent = dl === 'Due today';
                          return (
                            <button key={a.id || i} className="dash-deadline-item" onClick={() => isGuest ? setUpsellOpen(true) : navigate('/academic/assignments')} style={{ width: '100%' }}>
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
                    )}
                  </div>
                )}

                {w.id === 'activity' && (
                  <div className="widget-activity-content" style={{ width: '100%' }}>
                    <div className="dash-activity-header" style={{ marginBottom: '12px' }}>
                      <div>
                        <p className="dash-activity-value" style={{ fontSize: '18px' }}>
                          {feed.attendance.present}<span className="dash-activity-unit"> classes attended</span>
                        </p>
                      </div>
                      <div className="dash-activity-ring">
                        <DonutChart pct={feed.attendance.percentage} color="#27bcd1" size={40} />
                        <span className="dash-ring-text" style={{ fontSize: '10px' }}>{feed.attendance.percentage}%</span>
                      </div>
                    </div>
                    <div className="dash-bar-chart" style={{ height: '70px', marginBottom: '12px' }}>
                      {daysKeys.map((k, i) => {
                        const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
                        const isSel = selectedDayIndex === i;
                        return (
                          <div key={k} className={`dash-bar-col ${isSel ? 'selected' : ''}`} onClick={() => setSelectedDayIndex(i)} style={{ cursor: 'pointer' }}>
                            <div className="dash-bar-track">
                              <div
                                className="dash-bar-fill"
                                style={{
                                  height: `${(classData[i] / maxBar) * 100}%`,
                                  background: isSel ? 'var(--dash-accent)' : '#495057',
                                  boxShadow: isSel ? '0 0 10px rgba(39, 188, 209, 0.6)' : 'none',
                                  transition: 'all 0.25s ease',
                                }}
                              >
                                {isSel && <span className="dash-bar-tip" style={{ fontSize: '9px', padding: '1px 5px', top: '-18px' }}>{classData[i]}</span>}
                              </div>
                            </div>
                            <span className="dash-bar-day" style={{ fontWeight: isSel ? 'bold' : 'normal', color: isSel ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)' }}>{dayLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="activity-day-breakdown" style={{ marginTop: '12px', borderTop: '1px solid var(--dash-divider)', paddingTop: '10px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: C.textPrimary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} color="var(--dash-accent)" />
                        Schedule for {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDayIndex]} ({selectedDayClasses.length} {selectedDayClasses.length === 1 ? 'Class' : 'Classes'})
                      </h4>
                      {selectedDayClasses.length === 0 ? (
                        <p style={{ fontSize: '10px', color: C.textSecondary, fontStyle: 'italic', padding: '4px 0', margin: 0 }}>No classes scheduled. Rest day! 😴</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {selectedDayClasses.map((cls, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '10px', background: C.bg, border: `1px solid ${C.border}` }}>
                              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: C.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.subject_name}</p>
                                <p style={{ fontSize: '9px', color: C.textSecondary, margin: '2px 0 0 0' }}>{cls.faculty_name} · {cls.room || 'TBD'}</p>
                              </div>
                              <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--dash-accent)', whiteSpace: 'nowrap' }}>{cls.start_time} - {cls.end_time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {w.id === 'placements' && (
                  <div className="widget-placements-content" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '12px', background: C.bg, border: `1px solid ${C.border}` }}>
                        <Briefcase size={16} color="var(--dash-accent)" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '11px', fontWeight: 'bold', color: C.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Software Dev Engineer</p>
                          <p style={{ fontSize: '9px', color: C.textSecondary, margin: '2px 0 0 0' }}>Amazon · ₹32 LPA · Apply by Jun 15</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '12px', background: C.bg, border: `1px solid ${C.border}` }}>
                        <Briefcase size={16} color="#c9503d" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '11px', fontWeight: 'bold', color: C.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Product Management Intern</p>
                          <p style={{ fontSize: '9px', color: C.textSecondary, margin: '2px 0 0 0' }}>Razorpay · ₹45k/mo · Apply by Jun 10</p>
                        </div>
                      </div>
                      <button onClick={() => navigate('/career/jobs')} className="w-full py-2 border rounded-xl text-[10px] font-bold text-center transition-all hover:bg-slate-50" style={{ borderColor: C.border, color: C.textPrimary, background: 'transparent' }}>
                        View Job Portal
                      </button>
                    </div>
                  </div>
                )}

                {w.id === 'projects' && (
                  <div className="widget-projects-content" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ padding: '10px', borderRadius: '12px', background: C.bg, border: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: C.textPrimary }}>Smart Campus App</span>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#27bcd1' }}>85% Done</span>
                        </div>
                        <div style={{ height: '4px', width: '100%', background: '#e9ecef', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '85%', background: '#27bcd1' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '12px', background: '#e4f6f9', border: '1px solid #cceef3' }}>
                        <Users size={12} color="#27bcd1" />
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#22346c' }}>Looking for members: Web Dev Hackathon</span>
                      </div>
                      <button onClick={() => navigate('/career/portfolio')} className="w-full py-2 border rounded-xl text-[10px] font-bold text-center transition-all hover:bg-slate-50" style={{ borderColor: C.border, color: C.textPrimary, background: 'transparent' }}>
                        Collaborate & Build
                      </button>
                    </div>
                  </div>
                )}

                {w.id === 'transit' && (
                  <div className="widget-transit-content" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Bus size={14} color="var(--dash-accent)" />
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: C.textPrimary }}>Route 4 (Central)</span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 'black', color: '#a91f23', background: '#a91f2314', padding: '2px 6px', borderRadius: '6px' }}>10 mins left</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Bus size={14} color={C.textSecondary} />
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: C.textPrimary }}>Route 12 (North)</span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: C.textSecondary }}>25 mins left</span>
                      </div>
                      <button onClick={() => navigate('/campus/bus')} className="w-full py-2 border rounded-xl text-[10px] font-bold text-center transition-all hover:bg-slate-50" style={{ borderColor: C.border, color: C.textPrimary, background: 'transparent' }}>
                        Live Tracking
                      </button>
                    </div>
                  </div>
                )}

                {w.id === 'canteen' && (
                  <div className="widget-canteen-content" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: C.textPrimary }}>Cafeteria Rush Level</span>
                        <span style={{ fontSize: '9px', fontWeight: 'black', color: '#27bcd1', background: '#27bcd114', padding: '2px 6px', borderRadius: '6px' }}>Moderate</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '8px', background: C.bg }}>
                        <Coffee size={12} color="#c9503d" />
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: C.textSecondary }}>Today's: Paneer Roll & Tea</span>
                      </div>
                      <button onClick={() => navigate('/campus/canteen')} className="w-full py-2 border rounded-xl text-[10px] font-bold text-center transition-all hover:bg-slate-50" style={{ borderColor: C.border, color: C.textPrimary, background: 'transparent' }}>
                        Order Online
                      </button>
                    </div>
                  </div>
                )}

                {w.id === 'library' && (
                  <div className="widget-library-content" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} color="var(--dash-accent)" />
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: C.textPrimary }}>2 Books Borrowed</span>
                      </div>
                      <p style={{ fontSize: '9px', color: '#c9503d', margin: 0, fontWeight: 'bold' }}>Introduction to Algorithms (Due in 3d)</p>
                      <button onClick={() => navigate('/campus/library')} className="w-full py-2 border rounded-xl text-[10px] font-bold text-center transition-all hover:bg-slate-50" style={{ borderColor: C.border, color: C.textPrimary, background: 'transparent' }}>
                        Search Books
                      </button>
                    </div>
                  </div>
                )}

                {w.id === 'results' && (
                  <div className="widget-results-content" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '18px', fontWeight: '800', color: C.textPrimary, margin: 0 }}>8.92</p>
                          <p style={{ fontSize: '9px', color: C.textSecondary, margin: 0 }}>Current CGPA</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '18px', fontWeight: '800', color: '#27bcd1', margin: 0 }}>9.10</p>
                          <p style={{ fontSize: '9px', color: C.textSecondary, margin: 0 }}>Last SGPA</p>
                        </div>
                      </div>
                      <button onClick={() => navigate('/academic/results')} className="w-full py-2 border rounded-xl text-[10px] font-bold text-center transition-all hover:bg-slate-50" style={{ borderColor: C.border, color: C.textPrimary, background: 'transparent' }}>
                        View Grade Sheets
                      </button>
                    </div>
                  </div>
                )}

                {w.id === 'study_assistant' && (
                  <div className="widget-study-assistant-content" style={{ width: '100%' }}>
                    <p style={{ fontSize: '10px', color: C.textSecondary, margin: '0 0 8px 0', fontStyle: 'italic' }}>
                      Ask AI any study concept or query:
                    </p>
                    {aiResponse ? (
                      <div style={{ padding: '8px 10px', borderRadius: '12px', background: '#e4f6f9', border: '1px solid #cceef3', marginBottom: '8px' }}>
                        <p style={{ fontSize: '9px', fontWeight: 'bold', color: C.textPrimary, margin: '0 0 4px 0' }}>💡 AI Response:</p>
                        <p style={{ fontSize: '10px', color: C.textPrimary, margin: 0, lineHeight: 1.4 }}>{aiResponse}</p>
                        <button onClick={() => setAiResponse('')} style={{ background: 'none', border: 'none', color: 'var(--dash-accent)', fontSize: '8px', fontWeight: 'bold', padding: 0, marginTop: '6px', cursor: 'pointer' }}>
                          Ask another question
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="e.g. explain recursion..."
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                          style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: '10px', border: `1px solid ${C.border}`, fontSize: '10px', outline: 'none', background: C.bg, color: C.textPrimary }}
                        />
                        <button
                          onClick={handleAskAI}
                          disabled={aiLoading}
                          style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--dash-accent)', color: '#fff', border: 'none', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', opacity: aiLoading ? 0.7 : 1 }}
                        >
                          {aiLoading ? '...' : 'Ask'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {w.id === 'notices' && (
                  <div className="widget-notices-content" style={{ width: '100%' }}>
                    {feed.recent_notices.length === 0 ? (
                      <div className="dash-empty">No recent notices 🎉</div>
                    ) : (
                      <div className="dash-deadline-list">
                        {feed.recent_notices.map((n, i) => (
                          <button key={n.id || i} className="dash-deadline-item" onClick={() => navigate('/campus/notices')} style={{ width: '100%' }}>
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
                    )}
                  </div>
                )}

                {w.id === 'portfolio' && (
                  <div className="widget-portfolio-content" style={{ width: '100%' }}>
                    {isGuest ? (
                      <div className="dash-empty">Portfolio building is available for registered students.</div>
                    ) : (
                      <>
                        {/* Achievements */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: C.textPrimary }}>
                              <Trophy className="w-3.5 h-3.5" style={{ color: C.terra }} /> Verified Achievements
                            </h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: C.border, color: C.textSecondary }}>
                              {achievements.length}
                            </span>
                          </div>
                          {achievements.length === 0 ? (
                            <p className="text-[10px] text-center py-2" style={{ color: C.textSecondary }}>No verified achievements.</p>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              {achievements.slice(0, 2).map((a, i) => (
                                <div key={a.id || i} className="rounded-lg p-2.5 flex items-center gap-2.5 border" style={{ background: C.card, borderColor: C.border }}>
                                  <span className="text-sm shrink-0">{a.icon || '🏆'}</span>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-[10px] font-bold truncate" style={{ color: C.textPrimary }}>{a.title}</h5>
                                  </div>
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Skills */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: C.textPrimary }}>
                              <Star className="w-3.5 h-3.5" style={{ color: C.blue }} /> Skills
                            </h4>
                          </div>
                          {skills.length === 0 ? (
                            <p className="text-[10px] text-center py-2" style={{ color: C.textSecondary }}>No skills added.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {skills.slice(0, 3).map(skill => (
                                <span key={skill.name} className="text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                                  style={{ background: skill.endorsed ? C.blue + '14' : 'transparent', color: skill.endorsed ? C.blue : C.textSecondary, borderColor: skill.endorsed ? C.blue + '30' : C.border }}>
                                  {skill.name} ({skill.endorsements})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowAddCertModal(true)}
                          className="w-full border-2 border-dashed rounded-2xl p-2.5 flex items-center justify-center gap-2 text-[10px] font-bold transition-all"
                          style={{ borderColor: C.border, color: C.textSecondary, background: 'transparent' }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Verify Certification
                        </button>
                      </>
                    )}
                  </div>
                )}

              </div>
            ))}
        </div>
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
                    onClick={() => handleNotifClick(n)}>
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

      {/* Manage Widgets Modal */}
      {manageWidgetsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in p-6" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <div className="rounded-[24px] p-6 shadow-2xl max-w-sm w-full animate-fade-in" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: C.textPrimary }}>Manage Widgets</h3>
              <button className="dash-palette-close" onClick={() => setManageWidgetsOpen(false)}>
                <X size={14} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: C.textSecondary }}>Choose which widgets appear on your dashboard and select their display size.</p>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto mb-6 pr-1">
              {widgets.map(w => (
                <div key={w.id} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ borderColor: C.border, background: C.bg }}>
                  <div className="flex items-center gap-2.5 flex-1">
                    <input
                      type="checkbox"
                      checked={w.visible}
                      onChange={() => handleToggleWidgetVisibility(w.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-xs font-semibold" style={{ color: C.textPrimary }}>{w.title}</span>
                  </div>
                  <select
                    value={w.size}
                    onChange={(e) => handleResizeWidget(w.id, e.target.value as any)}
                    className="widget-size-select"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={() => setManageWidgetsOpen(false)}
              className="w-full py-3 rounded-[14px] font-semibold text-sm text-white"
              style={{ background: C.blue }}
            >
              Done
            </button>
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

        /* ── Dynamic Widgets Grid & Components ────── */
        .widgets-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding: 0 20px 24px;
        }
        .widget-wrapper {
          background: var(--dash-card);
          border-radius: 24px;
          border: 1px solid var(--dash-border);
          padding: 18px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
        }
        .widget-wrapper:hover {
          box-shadow: 0 8px 24px rgba(34,52,108,0.06);
          transform: translateY(-2px);
        }
        .widget-wrapper.edit-mode {
          border: 2px dashed var(--dash-accent);
          cursor: grab;
        }
        .widget-wrapper.edit-mode:active {
          cursor: grabbing;
        }
        .widget-span-small {
          grid-column: span 1;
        }
        .widget-span-medium {
          grid-column: span 2;
        }
        .widget-span-large {
          grid-column: span 2;
          min-height: 280px;
        }

        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          border-bottom: 1px solid var(--dash-divider);
          padding-bottom: 8px;
          width: 100%;
        }
        .widget-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--dash-text-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .widget-header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .widget-size-select {
          font-size: 10px;
          font-weight: 700;
          background: var(--dash-input-bg);
          border: 1px solid var(--dash-border);
          border-radius: 6px;
          padding: 2px 4px;
          color: var(--dash-text-primary);
          outline: none;
          cursor: pointer;
        }
        .widget-action-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--dash-text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .widget-action-btn:hover {
          background: var(--dash-input-bg);
          color: var(--dash-text-primary);
        }
        .widget-drag-handle {
          color: var(--dash-text-secondary);
          cursor: grab;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .dash-controls-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px 12px;
        }
        .dash-control-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--dash-text-secondary);
          background: var(--dash-card);
          border: 1px solid var(--dash-border);
          padding: 8px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 2px 6px rgba(34,52,108,0.03);
        }
        .dash-control-btn:hover {
          background: var(--dash-input-bg);
          color: var(--dash-text-primary);
        }
        .dash-control-btn.active {
          background: var(--dash-accent);
          color: #fff;
          border-color: var(--dash-accent);
        }

        /* Guest slider styles */
        .guest-slider-container {
          position: relative;
          margin: 16px 20px 8px;
          border-radius: 24px;
          overflow: hidden;
          height: 180px;
          box-shadow: 0 8px 24px rgba(34,52,108,0.12);
        }
        .guest-slider-track {
          display: flex;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .guest-slide {
          min-width: 100%;
          height: 100%;
          position: relative;
        }
        .guest-slide-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .guest-slide-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 60%, transparent 100%);
        }
        .guest-slide-content {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          color: #fff;
          z-index: 2;
          text-align: left;
        }
        .guest-slide-tag {
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #fff;
          background: var(--dash-accent);
          padding: 4px 8px;
          border-radius: 6px;
          display: inline-block;
        }
        .guest-slide-title {
          font-size: 16px;
          font-weight: 800;
          margin: 6px 0 2px 0;
          letter-spacing: -0.3px;
        }
        .guest-slide-desc {
          font-size: 11px;
          opacity: 0.85;
          margin: 0;
          font-weight: 500;
        }
        .guest-slider-dots {
          position: absolute;
          right: 16px;
          top: 16px;
          display: flex;
          gap: 6px;
          z-index: 10;
        }
        .guest-slider-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .guest-slider-dot.active {
          background: #fff;
          transform: scale(1.3);
        }

        /* ── Activity Chart Selected State ───────── */
        .dash-bar-col {
          transition: opacity 0.2s ease;
        }
        .dash-bar-col:not(.selected) {
          opacity: 0.65;
        }
        .dash-bar-col.selected {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
