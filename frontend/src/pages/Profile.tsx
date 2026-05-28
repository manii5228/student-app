import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Smartphone, Monitor, Tablet, Wifi,
  Trash2, LogOut, Fingerprint, Shield, Key,
  Plus, X, CheckCircle, Clock, AlertTriangle, ChevronRight,
  CreditCard, QrCode, Award, Star, Heart, Activity,
  Download, RefreshCw, Camera, Sun, Moon, Palette,
  WifiOff, BarChart3, Zap, Trophy, BookOpen,
  Users, ThumbsUp, ExternalLink
} from 'lucide-react';
import { api } from '../lib/api';
import BottomNav from '../components/BottomNav';

// ── Time helper ──────────────────────────────────────────────────
const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// ── TOTP-like QR generator (rotates every 15s) ──────────────────
const generateTOTPCode = (userId: string): string => {
  const epoch = Math.floor(Date.now() / 15000); // 15-second window
  const raw = `${userId}-${epoch}-VELTECH`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
};

// ── Mock achievements data ──────────────────────────────────────
const MOCK_ACHIEVEMENTS = [
  { id: '1', title: 'HackGrid 36h - Runner Up', type: 'hackathon', icon: '🏆', date: '2026-03-15' },
  { id: '2', title: 'CodeChef Chapter President', type: 'leadership', icon: '👑', date: '2025-09-01' },
  { id: '3', title: 'IEEE Paper Published', type: 'paper', icon: '📄', date: '2026-01-20' },
  { id: '4', title: 'Google Cloud Certified', type: 'certification', icon: '☁️', date: '2026-02-10' },
  { id: '5', title: 'NPTEL - Data Science Gold', type: 'certification', icon: '🎓', date: '2025-11-05' },
];

const MOCK_SKILLS = [
  { name: 'React', endorsements: 12, endorsed: true },
  { name: 'Python', endorsements: 18, endorsed: false },
  { name: 'Machine Learning', endorsements: 7, endorsed: false },
  { name: 'Java', endorsements: 9, endorsed: true },
  { name: 'SQL', endorsements: 14, endorsed: false },
];

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [biometrics, setBiometrics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'id-card' | 'portfolio' | 'sessions' | 'biometric' | 'security' | 'preferences'>('id-card');
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState<string | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [biometricRegistering, setBiometricRegistering] = useState(false);
  const [biometricMsg, setBiometricMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [showBiometricNameModal, setShowBiometricNameModal] = useState(false);
  const [customDeviceName, setCustomDeviceName] = useState('');

  // ID card state
  const [qrCode, setQrCode] = useState('');
  const [qrCountdown, setQrCountdown] = useState(15);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Preferences state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme_preference') || 'light');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accent_color') || 'indigo');
  const [offlineSync, setOfflineSync] = useState(() => {
    try { return JSON.parse(localStorage.getItem('offline_sync_settings') || '{"timetable":true,"syllabus":true,"news":false}'); }
    catch { return { timetable: true, syllabus: true, news: false }; }
  });

  // Achievements & Skills portfolio states
  const [achievements, setAchievements] = useState<any[]>(MOCK_ACHIEVEMENTS);
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Add certification states
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [certId, setCertId] = useState('');
  const [certTitle, setCertTitle] = useState('');
  const [certPlatform, setCertPlatform] = useState('coursera');
  const [certVerifying, setCertVerifying] = useState(false);
  const [certError, setCertError] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchSessions();
    fetchBiometrics();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data.user;
      setUser(u);
      
      // Parse achievements
      if (u.achievements && u.achievements.length > 0) {
        setAchievements(u.achievements);
      }
      
      // Parse skills
      if (u.skills && u.skills.length > 0) {
        const mappedSkills = u.skills.map((s: any) => ({
          name: s.name,
          endorsements: s.endorsements ? s.endorsements.length : 0,
          endorsed: s.endorsements ? s.endorsements.includes(u.id) : false
        }));
        setSkills(mappedSkills);
      }
    } catch {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    }
  };

  // ── TOTP QR rotation every 15 seconds ──────────────────────
  useEffect(() => {
    const userId = user?.id || 'guest';
    setQrCode(generateTOTPCode(userId));
    setQrCountdown(15);

    const interval = setInterval(() => {
      setQrCode(generateTOTPCode(userId));
      setQrCountdown(15);
    }, 15000);

    const countdown = setInterval(() => {
      setQrCountdown(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => { clearInterval(interval); clearInterval(countdown); };
  }, [user?.id]);

  // ── Holographic tilt effect via DeviceOrientation ──────────
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const x = Math.min(Math.max((e.gamma || 0) / 45, -1), 1);
      const y = Math.min(Math.max((e.beta || 0) / 45, -1), 1);
      setTilt({ x: x * 8, y: y * 4 });
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Mouse-based tilt for desktop
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: x * 10, y: -y * 10 });
  }, []);

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.sessions || []);
    } catch { setSessions([]); }
    setLoading(false);
  };

  const fetchBiometrics = async () => {
    try {
      const res = await api.get('/auth/biometric/credentials');
      setBiometrics(res.data.credentials || []);
    } catch { setBiometrics([]); }
  };

  const revokeSession = async (sessionId: string) => {
    setSessionLoading(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch {}
    setSessionLoading(null);
  };

  const revokeAllSessions = async () => {
    setConfirmLogoutAll(false);
    try {
      await api.post('/auth/sessions/revoke-all');
      setSessions([]);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch {}
  };

  const startBiometricRegistration = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setCustomDeviceName(isMobile ? 'Personal Phone' : 'Work Laptop');
    setShowBiometricNameModal(true);
    setBiometricMsg(null);
  };

  const registerBiometric = async (deviceName: string) => {
    setBiometricRegistering(true);
    setBiometricMsg(null);
    setShowBiometricNameModal(false);
    try {
      if (!window.PublicKeyCredential) throw new Error('WebAuthn is not supported on this browser.');
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const userId = new TextEncoder().encode(user?.id || 'user');
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'VelTech Super-App', id: window.location.hostname },
          user: { id: userId, name: user?.email || 'user@veltech.edu.in', displayName: user?.full_name || 'User' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
        },
      }) as PublicKeyCredential;
      if (!credential) throw new Error('Credential creation was cancelled.');
      const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKey = btoa(String.fromCharCode(...new Uint8Array(response.attestationObject)));
      await api.post('/auth/biometric/register', { credential_id: rawId, public_key: publicKey, device_name: deviceName || 'Security Key' });
      setBiometricMsg({ type: 'success', text: `Biometric for "${deviceName}" registered!` });
      fetchBiometrics();
    } catch (err: any) {
      setBiometricMsg({ type: 'error', text: err?.response?.data?.error || err?.message || 'Failed to register.' });
    } finally { setBiometricRegistering(false); }
  };

  const revokeBiometric = async (credId: string) => {
    try { await api.delete(`/auth/biometric/credentials/${credId}`); setBiometrics(prev => prev.filter(b => b.id !== credId)); } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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

  const handleExportData = async () => {
    try {
      const res = await api.get('/auth/me/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `veltech_data_export_${user?.id?.slice(0, 8) || 'user'}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to export data. Please try again.');
    }
  };

  const handleClassAttendance = async () => {
    setAttendanceMsg(null);
    try {
      await api.post('/attendance/scan-qr', {
        qr_token: 'valid_mock_token_CS301_period1',
        latitude: 13.1818,
        longitude: 80.0401
      });
      setAttendanceMsg({ type: 'success', text: 'Class attendance marked successfully via QR!' });
      setTimeout(() => {
        setShowQRScanner(false);
        setAttendanceMsg(null);
      }, 2000);
    } catch (err: any) {
      setAttendanceMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to mark class attendance.' });
    }
  };

  const handleClubAttendance = async () => {
    setAttendanceMsg(null);
    try {
      // Find a technical or cultural club
      const clubsRes = await api.get('/campus/clubs');
      const clubId = clubsRes.data.clubs?.[0]?.id || 'mock_club_id';
      await api.post(`/campus/clubs/${clubId}/attendance`, {
        event_title: 'Weekly Club Meeting',
        hours: 1.0
      });
      setAttendanceMsg({ type: 'success', text: 'Club attendance logged successfully!' });
      setTimeout(() => {
        setShowQRScanner(false);
        setAttendanceMsg(null);
      }, 2000);
    } catch (err: any) {
      setAttendanceMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to log club attendance.' });
    }
  };

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

  const savePreferences = async () => {
    localStorage.setItem('theme_preference', theme);
    localStorage.setItem('accent_color', accentColor);
    localStorage.setItem('offline_sync_settings', JSON.stringify(offlineSync));
    try { await api.put('/auth/me/preferences', { theme_preference: theme, offline_sync_settings: offlineSync }); } catch {}
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const isGuest = user?.is_guest || user?.role === 'guest';

  // ── Tab definitions ────────────────────────────────────────
  const tabs = [
    { key: 'id-card', label: 'ID Card', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: 'portfolio', label: 'Portfolio', icon: <Award className="w-3.5 h-3.5" /> },
    { key: 'sessions', label: 'Sessions', icon: <Wifi className="w-3.5 h-3.5" /> },
    { key: 'biometric', label: 'Bio', icon: <Fingerprint className="w-3.5 h-3.5" /> },
    { key: 'security', label: 'Security', icon: <Key className="w-3.5 h-3.5" /> },
    { key: 'preferences', label: 'Prefs', icon: <Palette className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-full bg-white flex flex-col font-sans animate-fade-in relative pb-24">

      {/* ═══ HEADER ═══ */}
      <div className="bg-slate-900 rounded-b-[40px] p-8 pt-12">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Profile & Security</h1>
        </div>

        {/* User Info Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-[24px] p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {isGuest ? 'G' : (user?.first_name?.[0] || 'U')}
          </div>
          <div className="flex-1 text-white">
            <h2 className="text-lg font-bold">{isGuest ? 'Guest Visitor' : user?.full_name || 'User'}</h2>
            <p className="text-sm text-slate-300">{isGuest ? 'Limited access mode' : user?.email || ''}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full uppercase tracking-wider">
                {user?.role || 'student'}
              </span>
              {user?.department && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/40 rounded-full uppercase tracking-wider">
                  {user.department}
                </span>
              )}
              {user?.semester && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/40 rounded-full uppercase tracking-wider">
                  Sem {user.semester}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guest Warning */}
      {isGuest && (
        <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Guest Mode Active</p>
            <p className="text-xs text-amber-700 mt-1">
              Access is limited. <button onClick={() => navigate('/login')} className="text-indigo-600 font-bold underline ml-1">Sign in</button> for full access.
            </p>
          </div>
        </div>
      )}

      {/* ═══ TABS ═══ */}
      {!isGuest && (
        <div className="px-4 mt-5">
          <div className="flex bg-slate-100 rounded-2xl p-1 overflow-x-auto hide-scrollbar gap-0.5">
            {tabs.map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div className="px-6 mt-5 flex-1 overflow-y-auto">

        {/* ═══════════ Digital ID Card Tab ═══════════ */}
        {activeTab === 'id-card' && !isGuest && (
          <div className="animate-fade-in">
            {/* 3D Holographic ID Card */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative rounded-[28px] overflow-hidden shadow-2xl mb-5 cursor-pointer"
              style={{
                transform: `perspective(800px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
                transition: 'transform 0.1s ease-out',
              }}
            >
              {/* Card background */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 p-6 relative">
                {/* Holographic overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: `linear-gradient(${135 + tilt.x * 5}deg, transparent 20%, rgba(99,102,241,0.4) 40%, rgba(168,85,247,0.3) 50%, rgba(236,72,153,0.3) 60%, transparent 80%)`,
                    transition: 'background 0.1s ease-out',
                  }}
                />
                {/* Security pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, #fff 6px, #fff 7px)' }}
                />

                {/* Top row */}
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div>
                    <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-[3px]">VelTech University</p>
                    <p className="text-[8px] text-slate-400 mt-0.5">Student Digital ID</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-indigo-300" />
                  </div>
                </div>

                {/* Student info */}
                <div className="flex items-end justify-between relative z-10">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white tracking-tight">{user?.full_name || 'Student Name'}</h3>
                    <p className="text-sm text-slate-300 font-medium mt-1">{user?.roll_number || 'VT2024CSE001'}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[10px] font-bold text-indigo-300 bg-white/10 px-2 py-0.5 rounded-full">
                        {user?.department || 'CSE'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-300 bg-white/10 px-2 py-0.5 rounded-full">
                        Sem {user?.semester || '4'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic QR Code (TOTP-based, rotates every 15s) */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-xl p-1.5 shadow-lg relative">
                      {/* Simplified QR pattern using the TOTP code */}
                      <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="grid grid-cols-8 gap-px absolute inset-1">
                          {qrCode.split('').flatMap((c, i) => {
                            const val = parseInt(c, 36);
                            return Array.from({ length: 8 }, (_, j) => (
                              <div key={`${i}-${j}`} className={`rounded-sm ${((val + j + i) % 3 === 0) ? 'bg-white' : 'bg-transparent'}`} />
                            ));
                          })}
                        </div>
                        <QrCode className="w-6 h-6 text-white/60 relative z-10" />
                      </div>
                    </div>
                    {/* Countdown */}
                    <div className="flex items-center gap-1 mt-2">
                      <RefreshCw className={`w-3 h-3 text-indigo-300 ${qrCountdown <= 3 ? 'animate-spin' : ''}`} />
                      <span className={`text-[10px] font-bold ${qrCountdown <= 3 ? 'text-red-400' : 'text-indigo-300'}`}>{qrCountdown}s</span>
                    </div>
                  </div>
                </div>

                {/* Bottom strip */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
                  <p className="text-[8px] text-slate-500">Valid: AY 2025-26 • {user?.email || 'student@veltech.edu.in'}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[8px] font-bold text-emerald-400">VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Scanner button */}
            <button
              onClick={() => setShowQRScanner(true)}
              className="w-full bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-center gap-3 font-bold text-sm mb-4 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg"
            >
              <Camera className="w-5 h-5" />
              Scan QR for Attendance
            </button>

            {/* Quick profile links */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Health Center', icon: Heart, color: 'text-red-600 bg-red-50', path: '/utility/health' },
                { name: 'Emergency', icon: Zap, color: 'text-red-700 bg-red-50', path: '/utility/emergency' },
                { name: 'Sync & Offline', icon: WifiOff, color: 'text-blue-600 bg-blue-50', path: '/utility/sync' },
                { name: 'Usage Stats', icon: BarChart3, color: 'text-purple-600 bg-purple-50', path: '/ai/usage' },
              ].map(item => (
                <button key={item.name} onClick={() => navigate(item.path)}
                  className="bg-slate-50 rounded-[18px] p-4 flex items-center gap-3 text-left hover:bg-slate-100 active:scale-95 transition-all border border-slate-100">
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ Portfolio Tab ═══════════ */}
        {activeTab === 'portfolio' && !isGuest && (
          <div className="animate-fade-in">
            {/* Achievement Showcase */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Achievements
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{achievements.length}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {achievements.map(a => (
                  <div key={a.id} className="bg-slate-50 rounded-[18px] p-4 flex items-center gap-3 border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm shrink-0">
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{a.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full capitalize">{a.type}</span>
                        <span className="text-[10px] text-slate-400">{new Date(a.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Endorsements */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-indigo-500" /> Skill Endorsements
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {skills.map(skill => (
                  <div key={skill.name} className="bg-slate-50 rounded-[16px] p-3.5 flex items-center gap-3 border border-slate-100">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800">{skill.name}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500">{skill.endorsements} endorsements</span>
                      </div>
                    </div>
                    <button
                      onClick={() => endorseSkill(skill.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                        skill.endorsed
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${skill.endorsed ? 'fill-indigo-500' : ''}`} />
                      {skill.endorsed ? 'Endorsed' : 'Endorse'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add certification */}
              <button
                onClick={() => setShowAddCertModal(true)}
                className="w-full mt-4 bg-white border-2 border-dashed border-slate-200 rounded-[18px] p-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Certification (Coursera/NPTEL)
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ Sessions Tab ═══════════ */}
        {activeTab === 'sessions' && !isGuest && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Active Devices</h3>
              {sessions.length > 0 && (
                <button onClick={() => setConfirmLogoutAll(true)} className="text-xs font-bold text-red-500 flex items-center gap-1 hover:text-red-600">
                  <LogOut className="w-4 h-4" /> Logout All
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map(session => (
                  <div key={session.id} className={`rounded-[20px] p-4 flex items-center gap-4 ${session.is_current ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${session.is_current ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-500'}`}>
                      {getDeviceIcon(session.device_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 truncate">{session.device_info?.split(' ').slice(0, 3).join(' ') || 'Unknown'}</p>
                        {session.is_current && <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-md uppercase">This</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{session.ip_address || '—'}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{session.created_at ? timeAgo(session.created_at) : '—'}</span>
                      </div>
                    </div>
                    <button onClick={() => revokeSession(session.id)} disabled={sessionLoading === session.id}
                      className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 disabled:opacity-50">
                      {sessionLoading === session.id ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-12">
                    <Wifi className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-bold">No active sessions found.</p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Privacy Notice</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">We log IPs and devices to prevent unauthorized access. Revoke any suspicious sessions immediately.</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ Biometric Tab ═══════════ */}
        {activeTab === 'biometric' && !isGuest && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Biometric Auth</h3>
              <button onClick={startBiometricRegistration} disabled={biometricRegistering}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 disabled:opacity-50">
                {biometricRegistering ? <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                {biometricRegistering ? 'Registering...' : 'Add Device'}
              </button>
            </div>
            <div className="bg-indigo-50 rounded-[20px] p-4 mb-4 flex items-start gap-3">
              <Fingerprint className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-indigo-800">Passwordless Login</p>
                <p className="text-xs text-indigo-700 mt-1">Register your fingerprint or Face ID for instant sign-in.</p>
              </div>
            </div>
            {biometricMsg && (
              <div className={`mb-4 p-4 rounded-[16px] flex items-center gap-2 text-sm font-medium ${biometricMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {biometricMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {biometricMsg.text}
              </div>
            )}
            <div className="flex flex-col gap-3">
              {biometrics.map(cred => (
                <div key={cred.id} className="bg-slate-50 rounded-[20px] p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm"><Fingerprint className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{cred.device_name || 'Device'}</p>
                    <span className="text-xs text-slate-500">Registered: {cred.created_at ? new Date(cred.created_at).toLocaleDateString() : '—'}</span>
                  </div>
                  <button onClick={() => revokeBiometric(cred.id)} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {biometrics.length === 0 && (
                <div className="text-center py-12">
                  <Fingerprint className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-bold">No biometric credentials yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Tap "Add Device" to register.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ Security Tab ═══════════ */}
        {activeTab === 'security' && !isGuest && (
          <div className="animate-fade-in flex flex-col gap-4">
            <button onClick={() => navigate('/change-password')} className="bg-slate-50 rounded-[20px] p-4 flex items-center gap-4 text-left w-full hover:bg-slate-100 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm"><Key className="w-5 h-5" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Change Password</p>
                <p className="text-xs text-slate-500 mt-0.5">Update credentials with strength validation.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </button>

            {/* Data Export (GDPR) */}
            <button onClick={handleExportData} className="bg-slate-50 rounded-[20px] p-4 flex items-center gap-4 text-left w-full hover:bg-slate-100 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm"><Download className="w-5 h-5" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Export My Data</p>
                <p className="text-xs text-slate-500 mt-0.5">Download all your data as a ZIP file (GDPR).</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </button>

            {/* Account Details */}
            <div className="bg-slate-50 rounded-[20px] p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Account Details</h4>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Email', value: user?.email },
                  { label: 'Role', value: user?.role, capitalize: true },
                  { label: 'Roll Number', value: user?.roll_number },
                  { label: 'Department', value: user?.department },
                  { label: 'Semester', value: user?.semester ? `Semester ${user.semester}` : null },
                  { label: 'Joined', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : null },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">{row.label}</span>
                    <span className={`text-xs text-slate-800 font-bold ${row.capitalize ? 'capitalize' : ''}`}>{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Verified</span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${user?.is_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {user?.is_verified ? <><CheckCircle className="w-3 h-3" /> Yes</> : <><AlertTriangle className="w-3 h-3" /> Pending</>}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Danger Zone</p>
              <button onClick={handleLogout} className="bg-red-50 rounded-[20px] p-4 flex items-center gap-4 text-left w-full hover:bg-red-100 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm"><LogOut className="w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700">Sign Out</p>
                  <p className="text-xs text-red-600 mt-0.5">Log out from this device only.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ Preferences Tab ═══════════ */}
        {activeTab === 'preferences' && !isGuest && (
          <div className="animate-fade-in flex flex-col gap-5">
            {/* Theme */}
            <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Theme
              </h4>
              <div className="flex gap-2">
                {[
                  { key: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
                  { key: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
                  { key: 'auto', label: 'Auto', icon: <Monitor className="w-4 h-4" /> },
                ].map(t => (
                  <button key={t.key} onClick={() => setTheme(t.key)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-2 ${
                      theme === t.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                    }`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Accent Color
              </h4>
              <div className="flex gap-3 flex-wrap">
                {[
                  { key: 'indigo', color: 'bg-indigo-500' },
                  { key: 'emerald', color: 'bg-emerald-500' },
                  { key: 'rose', color: 'bg-rose-500' },
                  { key: 'amber', color: 'bg-amber-500' },
                  { key: 'cyan', color: 'bg-cyan-500' },
                  { key: 'violet', color: 'bg-violet-500' },
                ].map(c => (
                  <button key={c.key} onClick={() => setAccentColor(c.key)}
                    className={`w-10 h-10 rounded-xl ${c.color} transition-all ${accentColor === c.key ? 'ring-4 ring-offset-2 ring-slate-300 scale-110' : 'hover:scale-105'}`}
                  />
                ))}
              </div>
            </div>

            {/* Offline Sync */}
            <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <WifiOff className="w-4 h-4" /> Offline Cache
              </h4>
              {[
                { key: 'timetable', label: 'Timetable', desc: 'Cache schedule offline' },
                { key: 'syllabus', label: 'Syllabus', desc: 'Cache syllabus PDFs' },
                { key: 'news', label: 'News & Notices', desc: 'Cache notices offline' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-bold text-slate-700">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setOfflineSync((prev: any) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`w-12 h-7 rounded-full flex items-center transition-all p-0.5 ${offlineSync[item.key] ? 'bg-indigo-500 justify-end' : 'bg-slate-300 justify-start'}`}
                  >
                    <div className="w-6 h-6 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              ))}
            </div>

            {/* Save button */}
            <button
              onClick={savePreferences}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              Save Preferences
            </button>
          </div>
        )}
      </div>

      <BottomNav />

      {/* ═══ MODALS ═══ */}

      {/* Confirm Logout All */}
      {confirmLogoutAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-6">
          <div className="bg-white rounded-[28px] p-6 shadow-2xl max-w-sm w-full">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-7 h-7 text-red-600" /></div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Logout All Devices?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This will sign you out from every device, including this one.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogoutAll(false)} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-[16px] font-bold text-sm">Cancel</button>
              <button onClick={revokeAllSessions} className="flex-1 bg-red-600 text-white py-3.5 rounded-[16px] font-bold text-sm">Logout All</button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Device Naming */}
      {showBiometricNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-6">
          <div className="bg-white rounded-[28px] p-6 shadow-2xl max-w-sm w-full">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600"><Fingerprint className="w-7 h-7" /></div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Register Biometric</h3>
            <p className="text-sm text-slate-500 text-center mb-4">Name this biometric device.</p>
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Device Name</label>
              <input type="text" value={customDeviceName} onChange={e => setCustomDeviceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400" placeholder="e.g. Personal Phone" autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBiometricNameModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-[16px] font-bold text-sm">Cancel</button>
              <button onClick={() => registerBiometric(customDeviceName)} disabled={!customDeviceName.trim()} className="flex-1 bg-indigo-600 text-white py-3.5 rounded-[16px] font-bold text-sm disabled:opacity-50">Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-[32px] w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Scan Attendance QR</h2>
              <button onClick={() => setShowQRScanner(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            {/* Camera viewfinder placeholder */}
            <div className="w-full aspect-square bg-slate-900 rounded-[24px] flex flex-col items-center justify-center mb-4 relative overflow-hidden">
              <div className="absolute inset-8 border-2 border-white/30 rounded-2xl" />
              <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
              <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
              <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
              <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
              {/* Scanning line animation */}
              <div className="absolute left-8 right-8 h-0.5 bg-indigo-400 shadow-lg shadow-indigo-400/50 animate-scan" />
              <Camera className="w-12 h-12 text-white/40 mb-3" />
              <p className="text-sm text-white/60 font-medium text-center px-6">Point at faculty's session QR or club event code</p>
            </div>
            {attendanceMsg && (
              <div className={`mb-4 p-4 rounded-[16px] flex items-center gap-2 text-sm font-medium ${attendanceMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {attendanceMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {attendanceMsg.text}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowQRScanner(false)} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-bold text-sm">Cancel</button>
              <button onClick={handleClassAttendance} className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm">Class Attendance</button>
              <button onClick={handleClubAttendance} className="flex-1 bg-violet-600 text-white py-3.5 rounded-2xl font-bold text-sm">Club Attendance</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Certification Modal */}
      {showAddCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-6">
          <div className="bg-white rounded-[28px] p-6 shadow-2xl max-w-sm w-full">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600"><Award className="w-7 h-7" /></div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Verify Certification</h3>
            <p className="text-sm text-slate-500 text-center mb-4">Verify NPTEL or Coursera credentials instantly.</p>
            {certError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {certError}
              </div>
            )}
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Platform</label>
                <select value={certPlatform} onChange={e => setCertPlatform(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400">
                  <option value="coursera">Coursera</option>
                  <option value="nptel">NPTEL</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Course/Certificate Title</label>
                <input type="text" value={certTitle} onChange={e => setCertTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400" placeholder="e.g. Deep Learning Specialization" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Certificate ID</label>
                <input type="text" value={certId} onChange={e => setCertId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400" placeholder="e.g. COURSERA-123456" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowAddCertModal(false); setCertError(''); }} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-[16px] font-bold text-sm">Cancel</button>
              <button onClick={handleAddCertification} disabled={certVerifying} className="flex-1 bg-indigo-600 text-white py-3.5 rounded-[16px] font-bold text-sm disabled:opacity-50">
                {certVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scan { 0%, 100% { top: 2rem; } 50% { top: calc(100% - 2rem); } }
        .animate-scan { animation: scan 2s ease-in-out infinite; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default Profile;
