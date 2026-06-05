import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Smartphone, Monitor, Tablet, Wifi,
  Trash2, LogOut, Fingerprint, Shield, Key,
  Plus, X, CheckCircle, AlertTriangle, CreditCard,
  Palette, User, Link2, Globe, Edit3, Save, Camera,
  RefreshCw, Laptop, Mail, ExternalLink, Trash,
  Award, Star, Code, BookOpen
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';
import veltechBannerLogo from '../assets/veltech_banner_logo.png';

const PRESETS = [
  { id: 'classic-navy', name: 'Classic Navy', gradient: 'linear-gradient(135deg, #22346c, #0080c7)' },
  { id: 'premium-gold', name: 'Premium Gold', gradient: 'linear-gradient(135deg, #111827, #374151)' },
  { id: 'vibrant-crimson', name: 'Vibrant Crimson', gradient: 'linear-gradient(135deg, #a91f23, #c9503d)' },
  { id: 'tech-cyan', name: 'Tech Cyan', gradient: 'linear-gradient(135deg, #0f172a, #1e293b)' },
  { id: 'elegant-dark', name: 'Elegant Dark', gradient: 'linear-gradient(135deg, #000000, #2d3748)' },
];

// Helper to generate a rotating 6-digit mockup TOTP code
const generateTOTPCode = (userId: string) => {
  const timeBlock = Math.floor(Date.now() / 15000);
  const hash = timeBlock + userId;
  let code = 0;
  for (let i = 0; i < hash.length; i++) {
    code = (code << 5) - code + hash.charCodeAt(i);
    code |= 0;
  }
  return String(Math.abs(code % 1000000)).padStart(6, '0');
};

const getDeptFullName = (dept: string) => {
  const d = (dept || '').toUpperCase();
  if (d === 'CSE') return 'COMPUTER SCIENCE AND ENGINEERING';
  if (d === 'ECE') return 'ELECTRONICS AND COMMUNICATION ENGINEERING';
  if (d === 'BIOMED') return 'BIOMEDICAL ENGINEERING';
  if (d === 'MECH') return 'MECHANICAL ENGINEERING';
  if (d === 'CIVIL') return 'CIVIL ENGINEERING';
  return d;
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [biometrics, setBiometrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [processedLogo, setProcessedLogo] = useState<string>(veltechBannerLogo);

  // Convert solid black background in the logo image to transparent
  useEffect(() => {
    const img = new Image();
    img.src = veltechBannerLogo;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          // If pixel is black or near-black background, key it out (make transparent)
          if (r < 30 && g < 30 && b < 30) {
            data[i+3] = 0; // alpha = 0
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setProcessedLogo(canvas.toDataURL());
      }
    };
  }, []);

  // Tab state (restructured)
  const [activeTab, setActiveTab] = useState<'id-card' | 'profile-details' | 'security'>('id-card');

  // ID Card State
  const [idTemplate, setIdTemplate] = useState({
    college_name: 'VelTech University',
    background_style: 'classic-navy',
    primary_color: '#22346c',
    accent_color: '#0080c7',
    logo_url: '',
    custom_bg_url: ''
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrCountdown, setQrCountdown] = useState(15);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Preferences State (Accent Color only, Theme removed)
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accent_color') || '#0080c7');
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Combined Security & Bio States
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [biometricRegistering, setBiometricRegistering] = useState(false);
  const [biometricMsg, setBiometricMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [showBiometricNameModal, setShowBiometricNameModal] = useState(false);
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [sessionLoading, setSessionLoading] = useState<string | null>(null);
  
  // Simulated Biometric Enrollment States
  const [showBioEnrollSim, setShowBioEnrollSim] = useState(false);
  const [bioEnrollProgress, setBioEnrollProgress] = useState(0);
  const [bioEnrollStatus, setBioEnrollStatus] = useState<'scanning' | 'success' | 'error'>('scanning');

  // Account Links CRUD States
  const [socialLinks, setSocialLinks] = useState({ linkedin: '', github: '', google_scholar: '' });
  const [educationLinks, setEducationLinks] = useState<{name: string, url: string}[]>([]);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editingSocial, setEditingSocial] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);

  // Photo upload and WebRTC Camera states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanTimeoutRef = useRef<any>(null);

  // Skills, Badges & Projects Dynamic Sync State
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const fetchDetailsData = async () => {
    setLoadingDetails(true);
    try {
      const [projectsRes, badgesRes, skillProfileRes] = await Promise.all([
        api.get('/career/projects'),
        api.get('/career/badges/my-badges'),
        api.get('/career/team-finder/profile').catch(() => ({ data: { profile: null } }))
      ]);
      setMyProjects(projectsRes.data.projects || []);
      setMyBadges(badgesRes.data.earned_badges || []);
      if (skillProfileRes.data?.profile) {
        setMySkills(skillProfileRes.data.profile.skills || []);
      } else {
        setMySkills([]);
      }
    } catch (err) {
      console.warn('Failed to load profile details data:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSessions();
    fetchBiometrics();
    fetchDetailsData();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data.user;
      setUser(u);

      // Fetch active ID Card template for user's role
      fetchTemplate(u.role || 'student');

      // Parse preferences
      const prefs = u.preferences || {};
      setBio(prefs.bio || '');
      setSocialLinks({
        linkedin: prefs.linkedin || '',
        github: prefs.github || '',
        google_scholar: prefs.google_scholar || '',
      });
      setEducationLinks(prefs.education_links || []);
      if (prefs.accent_color) setAccentColor(prefs.accent_color);
    } catch {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        fetchTemplate(u.role || 'student');
      }
    }
  };

  const fetchTemplate = async (role: string) => {
    try {
      const { data } = await api.get(`/auth/id-template/${role}`);
      setIdTemplate(data);
    } catch {}
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
    const sessionToRevoke = sessions.find(s => s.id === sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      if (sessionToRevoke?.is_current) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
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
    
    if (!window.PublicKeyCredential) {
      setBioEnrollProgress(0);
      setBioEnrollStatus('scanning');
      setShowBioEnrollSim(true);
      return;
    }
    
    try {
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

  const runBioEnrollSimulation = async () => {
    setBioEnrollStatus('scanning');
    setBioEnrollProgress(0);
    
    const duration = 2000;
    const intervalTime = 50;
    const steps = duration / intervalTime;
    const stepIncrement = 100 / steps;
    
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, intervalTime));
      setBioEnrollProgress(prev => Math.min(prev + stepIncrement, 100));
    }
    
    try {
      const mockCredId = `mob_bio_${user?.email}`;
      await api.post('/auth/biometric/register', {
        credential_id: mockCredId,
        public_key: 'mock_mobile_biometric_public_key',
        device_name: customDeviceName || 'Mobile Biometric'
      });
      
      setBioEnrollStatus('success');
      setBiometricMsg({ type: 'success', text: `Biometric for "${customDeviceName || 'Mobile Biometric'}" registered!` });
      fetchBiometrics();
      
      setTimeout(() => {
        setShowBioEnrollSim(false);
        setBiometricRegistering(false);
      }, 1500);
    } catch (err: any) {
      setBioEnrollStatus('error');
      setBiometricMsg({ type: 'error', text: err?.response?.data?.error || err?.message || 'Failed to register biometric simulation.' });
      setTimeout(() => {
        setShowBioEnrollSim(false);
        setBiometricRegistering(false);
      }, 2000);
    }
  };

  const revokeBiometric = async (credId: string) => {
    try { await api.delete(`/auth/biometric/credentials/${credId}`); setBiometrics(prev => prev.filter(b => b.id !== credId)); } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getAvatarUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = api.defaults.baseURL || localStorage.getItem('custom_api_url') || 'https://tricky-months-camp.loca.lt/api/v1';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setUploadMsg(null);

    const isMock = localStorage.getItem('connection_mode') === 'mock';

    if (isMock) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await api.post('/auth/me/avatar', { avatar_base64: base64Data });
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          setUploadMsg({ type: 'success', text: 'Mock profile photo uploaded successfully!' });
        } catch (err: any) {
          setUploadMsg({ type: 'error', text: err?.message || 'Failed to upload photo.' });
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.onerror = () => {
        setUploadMsg({ type: 'error', text: 'Error reading file.' });
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } else {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post('/auth/me/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUploadMsg({ type: 'success', text: 'Student photo updated successfully!' });
      } catch (err: any) {
        setUploadMsg({
          type: 'error',
          text: err.response?.data?.error || err.message || 'Failed to upload photo.',
        });
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const triggerAutoCheckIn = useCallback(async (token?: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("VelTech Attendance", {
        body: "Attendance marked successfully via QR Code scanner!",
      });
    }

    setAttendanceMsg(null);
    try {
      const qr_token = token || 'valid_mock_token_CS301_period1';
      await api.post('/attendance/scan-qr', {
        qr_token: qr_token,
        latitude: 13.1818,
        longitude: 80.0401
      });
      setAttendanceMsg({ type: 'success', text: `Class attendance marked successfully via QR scan!` });
      fetchProfile();
      setTimeout(() => {
        setShowQRScanner(false);
        setAttendanceMsg(null);
      }, 2000);
    } catch (err: any) {
      setAttendanceMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to mark class attendance.' });
    }
  }, [fetchProfile]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setAttendanceMsg(null);

    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.log("Video play error:", err));
      }
      
      // Fallback auto check-in if no QR code is scanned in 5 seconds
      scanTimeoutRef.current = setTimeout(() => {
        triggerAutoCheckIn();
      }, 5000);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraError("Camera access denied or unavailable. Please check permissions.");
    }
  }, [triggerAutoCheckIn]);

  useEffect(() => {
    if (showQRScanner) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [showQRScanner, startCamera, stopCamera]);

  // Frame processing loop for dynamic QR code scanning
  useEffect(() => {
    let active = true;
    let frameId: number;

    const scanFrame = () => {
      if (!active) return;
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        
        let canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.id = 'qr-canvas';
          canvas.style.display = 'none';
          document.body.appendChild(canvas);
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const jsQR = (window as any).jsQR;
          if (jsQR) {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              console.log("Decoded QR Code data:", code.data);
              triggerAutoCheckIn(code.data);
              active = false;
              return;
            }
          }
        }
      }

      if (active) {
        setTimeout(() => {
          frameId = requestAnimationFrame(scanFrame);
        }, 300);
      }
    };

    if (showQRScanner && cameraStream) {
      frameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [showQRScanner, cameraStream, triggerAutoCheckIn]);

  // Handle unmount cleanup for camera stream specifically
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleClassAttendance = async () => {
    await triggerAutoCheckIn();
  };

  const handleClubAttendance = async () => {
    setAttendanceMsg(null);
    try {
      const clubsRes = await api.get('/campus/clubs');
      const clubId = clubsRes.data.clubs?.[0]?.id || 'mock_club_id';
      await api.post(`/campus/clubs/${clubId}/attendance`, {
        event_title: 'Weekly Club Meeting',
        hours: 1.0
      });
      setAttendanceMsg({ type: 'success', text: 'Club attendance logged successfully!' });
      
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("VelTech Attendance", {
          body: "Club attendance logged successfully!",
        });
      }

      setTimeout(() => {
        setShowQRScanner(false);
        setAttendanceMsg(null);
      }, 2000);
    } catch (err: any) {
      setAttendanceMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to log club attendance.' });
    }
  };

  // ── Save Accent Color preference (applied instantly on change) ──
  const handleAccentColorChange = async (color: string) => {
    setAccentColor(color);
    localStorage.setItem('accent_color', color);

    // Apply accent color as CSS variable
    document.documentElement.style.setProperty('--accent-color', color);
    window.dispatchEvent(new Event('theme-changed'));

    try {
      await api.put('/auth/me/preferences', { accent_color: color });
    } catch {}

    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  // ── Save Account Preferences (Bio & Social & custom links) ──
  const saveAccount = async (updatedLinks?: any[]) => {
    const finalLinks = updatedLinks !== undefined ? updatedLinks : educationLinks;
    try {
      await api.put('/auth/me/preferences', {
        bio,
        linkedin: socialLinks.linkedin,
        github: socialLinks.github,
        google_scholar: socialLinks.google_scholar,
        education_links: finalLinks
      });
    } catch {}
    setEditingBio(false);
    setEditingSocial(false);
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 2000);
  };

  // ── Custom link CRUD operations ──
  const handleAddLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    const updated = [...educationLinks, { name: newLinkName.trim(), url: newLinkUrl.trim() }];
    setEducationLinks(updated);
    setNewLinkName('');
    setNewLinkUrl('');
    saveAccount(updated);
  };

  const handleDeleteLink = (index: number) => {
    const updated = educationLinks.filter((_, idx) => idx !== index);
    setEducationLinks(updated);
    saveAccount(updated);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const isGuest = user?.is_guest || user?.role === 'guest';

  // Restructured Tab definitions
  const tabs = [
    { key: 'id-card', label: 'ID Card', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: 'profile-details', label: 'Profile Details', icon: <User className="w-3.5 h-3.5" /> },
    { key: 'security', label: 'Security', icon: <Fingerprint className="w-3.5 h-3.5" /> },
  ];

  // Dynamic colors based on active theme (Theme removed, always false/light)
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

  const currentPreset = PRESETS.find(p => p.id === idTemplate.background_style) || PRESETS[0];

  return (
    <div className="min-h-full flex flex-col font-sans relative pb-24 transition-colors duration-300" style={{ background: C.bg }}>

      {/* ═══ HEADER ═══ */}
      <div className="rounded-b-[32px] p-8 pt-12 transition-colors duration-300" style={{ background: C.navy }}>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Profile</h1>
        </div>

        {/* User Info */}
        <div className="rounded-[20px] p-5 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="w-14 h-14 rounded-full border-2 border-white/40 overflow-hidden bg-white/10 flex items-center justify-center relative shadow-md">
            {user?.avatar_url ? (
              <img
                src={getAvatarUrl(user.avatar_url)}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold" style={{ background: C.blue }}>
                {isGuest ? 'G' : (user?.first_name?.[0] || 'U')}
              </div>
            )}
          </div>
          <div className="flex-1 text-white min-w-0">
            <h2 className="text-lg font-bold truncate">{isGuest ? 'Guest Visitor' : user?.full_name || 'User'}</h2>
            <p className="text-sm opacity-60 truncate">{isGuest ? 'Limited access mode' : user?.email || ''}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.15)' }}>
                {user?.role || 'student'}
              </span>
              {user?.department && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: `${C.blue}40` }}>
                  {user.department}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      {!isGuest && (
        <div className="px-4 mt-5">
          <div className="flex rounded-2xl p-1 overflow-x-auto gap-0.5" style={{ background: isDark ? '#1e293b' : '#e9ecef' }}>
            {tabs.map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="flex-1 min-w-[75px] py-2.5 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                style={{
                  background: activeTab === tab.key ? C.card : 'transparent',
                  color: activeTab === tab.key ? C.textPrimary : C.textSecondary,
                  boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="px-6 mt-5 flex-1 overflow-y-auto">
        {/* ═══════════ Digital ID Card Tab ═══════════ */}
        {activeTab === 'id-card' && !isGuest && (
          <div className="animate-fade-in flex flex-col items-center w-full">
            {/* Instagram-Style Flipping card container */}
            <div onClick={() => setIsFlipped(!isFlipped)} className={`flip-card ${isFlipped ? 'flipped' : ''} mb-6 w-full max-w-[380px] mx-auto`}>
              <div className="flip-card-inner relative aspect-[1.58/1] w-full">
                
                {/* ── CARD FRONT (Horizontal Landscape) ── */}
                <div className="flip-card-front h-full w-full relative p-3 flex border-x-[5px] border-y-[2px] border-[#1e2d5a]"
                  style={{
                    background: 'linear-gradient(to bottom, #eef6fa 0%, #ffffff 100%)',
                  }}
                >
                  {/* Left red stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#80080b]" />

                  {/* Left Column: Photo & Signature (1/3 width) */}
                  <div className="w-[100px] flex flex-col justify-between items-center z-10 h-full pl-1">
                    {/* Student Photo */}
                    <div className="w-20 h-24 border border-slate-300 overflow-hidden bg-slate-50 relative shrink-0 shadow-sm rounded-md">
                      {user?.avatar_url ? (
                        <img
                          src={getAvatarUrl(user.avatar_url)}
                          alt="Photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.id || 'default'}`}
                          alt="Photo"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Registrar Signature */}
                    <div className="flex flex-col items-center select-none pb-0.5">
                      <span className="font-serif italic text-teal-700 text-xs font-bold opacity-80 leading-none h-4">
                        Rangarajan
                      </span>
                      <div className="w-12 h-px bg-slate-300 my-0.5" />
                      <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wider leading-none">Registrar</span>
                    </div>
                  </div>

                  {/* Right Column: Status, Logo Banner, Student Details (2/3 width) */}
                  <div className="flex-1 flex flex-col justify-between z-10 pl-3 h-full">
                    {/* Top Right: Status Badge */}
                    <div className="flex justify-end">
                      <div className="bg-[#80080b] text-white text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        {user?.hostel_status === 'hosteler' ? 'HOSTELLER' : 'DAYSCHOLAR'}
                      </div>
                    </div>

                    {/* Center Right: College Logo Banner */}
                    <div className="flex justify-center my-auto py-1">
                      <img
                        src={processedLogo}
                        alt="Vel Tech Logo"
                        className="h-8 max-w-[210px] object-contain"
                      />
                    </div>

                    {/* Bottom Right: Student Details */}
                    <div className="text-left border-t border-slate-200/60 pt-1.5">
                      <h3 className="text-[11px] font-black text-[#80080b] uppercase tracking-wide truncate leading-none">
                        {user?.last_name ? `${user.last_name.toUpperCase()} ${user.first_name.toUpperCase()}` : user?.full_name?.toUpperCase()}
                      </h3>
                      <p className="text-[7.5px] font-black text-[#004080] uppercase tracking-tighter mt-1 leading-none truncate">
                        {getDeptFullName(user?.department || 'CSE')}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-x-2 mt-1.5 text-[7.5px] font-bold text-slate-700 leading-none">
                        <div>
                          ID No. : <span className="font-semibold text-slate-600">{user?.roll_number || 'VTU24573'}</span>
                        </div>
                        <div>
                          BATCH : <span className="font-semibold text-slate-600">{user?.batch_year ? `${user.batch_year}-${user.batch_year + 4}` : '2023-2027'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── CARD BACK (Horizontal Landscape) ── */}
                <div className="flip-card-back h-full w-full relative p-3 flex border-x-[5px] border-y-[2px] border-[#1e2d5a]"
                  style={{
                    background: 'linear-gradient(to bottom, #eef6fa 0%, #ffffff 100%)',
                  }}
                >
                  {/* Left red stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#80080b]" />

                  {/* Left Column: Verification Text and Info */}
                  <div className="w-[170px] flex flex-col justify-between text-left pl-2 z-10 h-full py-1">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[2px] text-[#80080b]" style={{ fontFamily: 'Georgia, serif' }}>
                        Vel Tech
                      </p>
                      <p className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        Digital Student ID
                      </p>
                    </div>

                    <div className="space-y-1 my-auto">
                      <p className="text-[6.5px] text-slate-400 leading-normal">
                        This card is digitally verified. Scan the QR code to mark attendance or verify student credentials.
                      </p>
                      <p className="text-[7px] text-slate-600 font-bold">
                        Valid: AY 2025-26 • {user?.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[6px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">Tap to Flip</span>
                      <span className="text-[7px] font-black text-emerald-600 tracking-wider">VERIFIED</span>
                    </div>
                  </div>

                  {/* Right Column: Secure QR Code & TOTP Countdown Timer */}
                  <div className="flex-1 flex flex-col items-center justify-center z-10 h-full py-1">
                    <div className="w-24 h-24 bg-white rounded-xl p-1.5 shadow-md border border-slate-100 flex items-center justify-center relative">
                      <div className="w-full h-full rounded-lg flex items-center justify-center relative overflow-hidden" style={{ background: '#1e2d5a' }}>
                        <div className="grid grid-cols-8 gap-px absolute inset-1">
                          {qrCode.split('').flatMap((c, i) => {
                            const val = parseInt(c, 36);
                            return Array.from({ length: 8 }, (_, j) => (
                              <div key={`${i}-${j}`} className={`rounded-sm ${((val + j + i) % 3 === 0) ? 'bg-white' : 'bg-transparent'}`} />
                            ));
                          })}
                        </div>
                        <Camera className="w-7 h-7 text-white/50 relative z-10" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <RefreshCw className={`w-2.5 h-2.5 ${qrCountdown <= 3 ? 'animate-spin' : ''}`} style={{ color: '#0080c7' }} />
                      <span className="text-[8.5px] font-black uppercase tracking-wider" style={{ color: qrCountdown <= 3 ? '#a91f23' : '#0080c7' }}>
                        TOTP: {qrCountdown}s
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            {/* QR Scanner button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowQRScanner(true); }}
              className="w-full text-white rounded-2xl p-4 flex items-center justify-center gap-3 font-semibold text-sm mb-3 active:scale-[0.98] transition-all shadow-sm animate-fade-in"
              style={{ background: C.navy }}
            >
              <Camera className="w-5 h-5" />
              Scan QR for Attendance
            </button>
            {/* Relocated Sign Out button */}
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl p-4 flex items-center justify-center gap-3 font-semibold text-sm active:scale-[0.98] transition-all border shadow-sm animate-fade-in"
              style={{ background: '#a91f230d', borderColor: '#a91f2320', color: '#a91f23' }}
            >
              <LogOut className="w-5 h-5" />
              Sign Out from Device
            </button>
          </div>
        )}

        {/* ═══════════ Profile Details Tab ═══════════ */}
        {activeTab === 'profile-details' && !isGuest && (
          <div className="animate-fade-in flex flex-col gap-4">
            
            {/* Student Photo Upload Section */}
            <div className="rounded-2xl p-5 border flex flex-col items-center gap-4" style={{ background: C.card, borderColor: C.border }}>
              <h4 className="text-sm font-bold w-full text-left flex items-center gap-2" style={{ color: C.textPrimary }}>
                <Camera className="w-4 h-4" style={{ color: C.blue }} /> Student Photo
              </h4>
              <div className="w-24 h-24 rounded-full border-4 border-white/80 overflow-hidden relative shadow-lg bg-slate-100 dark:bg-slate-800">
                {user?.avatar_url ? (
                  <img
                    src={getAvatarUrl(user.avatar_url)}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-3xl" style={{ background: C.blue, color: '#fff' }}>
                    {user?.first_name?.[0] || 'U'}
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white tracking-wide shadow-sm hover:opacity-90 active:scale-95 transition-all"
                style={{ background: C.blue }}
              >
                Upload Student Photo
              </button>
              {uploadMsg && (
                <p className={`text-xs text-center font-semibold ${uploadMsg.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {uploadMsg.text}
                </p>
              )}
            </div>

            {/* Bio Section */}
            <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: C.textPrimary }}>
                  <User className="w-4 h-4" style={{ color: C.blue }} /> About Me (Bio)
                </h4>
                <button onClick={() => setEditingBio(!editingBio)} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: C.blue }}>
                  <Edit3 className="w-3 h-3" /> {editingBio ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editingBio ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Write a short bio about yourself..."
                    className="w-full rounded-xl py-2.5 px-3 text-sm outline-none border resize-none focus:border-blue-400 transition-colors"
                    style={{ background: C.bg, borderColor: C.border, color: C.textPrimary, minHeight: 80 }}
                  />
                  <button onClick={() => saveAccount()} className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all" style={{ background: C.blue }}>
                    Save Bio
                  </button>
                </div>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: bio ? C.textPrimary : C.textSecondary }}>
                  {bio || 'No bio added yet. Tap Edit to add one.'}
                </p>
              )}
            </div>

            {/* Social Profiles */}
            <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: C.textPrimary }}>
                  <Link2 className="w-4 h-4" style={{ color: C.cyan }} /> Social Profiles
                </h4>
                <button onClick={() => setEditingSocial(!editingSocial)} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: C.blue }}>
                  <Edit3 className="w-3 h-3" /> {editingSocial ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editingSocial ? (
                <div className="flex flex-col gap-4">
                  {[
                    { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username' },
                    { key: 'github', label: 'GitHub URL', placeholder: 'https://github.com/username' },
                    { key: 'google_scholar', label: 'Google Scholar URL', placeholder: 'https://scholar.google.com/citations?user=...' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: C.textSecondary }}>{f.label}</label>
                      <input
                        type="url"
                        value={(socialLinks as any)[f.key]}
                        onChange={e => setSocialLinks(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full rounded-xl py-2.5 px-3 text-sm outline-none border focus:border-blue-400 transition-colors"
                        style={{ background: C.bg, borderColor: C.border, color: C.textPrimary }}
                        placeholder={f.placeholder}
                      />
                    </div>
                  ))}
                  <button onClick={() => saveAccount()} className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all" style={{ background: C.blue }}>
                    Save Profiles
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'linkedin', label: 'LinkedIn', icon: <Globe className="w-4 h-4" /> },
                    { key: 'github', label: 'GitHub', icon: <Globe className="w-4 h-4" /> },
                    { key: 'google_scholar', label: 'Google Scholar', icon: <Globe className="w-4 h-4" /> },
                  ].map(f => {
                    const val = (socialLinks as any)[f.key];
                    return (
                      <div key={f.key} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ borderColor: C.border, background: C.bg }}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: val ? C.blue : C.textSecondary }}>{f.icon}</span>
                          <span className="text-xs font-bold" style={{ color: C.textPrimary }}>{f.label}</span>
                        </div>
                        {val ? (
                          <a href={val} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold flex items-center gap-1" style={{ color: C.blue }}>
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: C.textSecondary }}>Not added</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Education Links CRUD */}
            <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: C.textPrimary }}>
                <Globe className="w-4 h-4" style={{ color: C.blue }} /> Custom Educational Links
              </h4>
              <p className="text-xs mb-4" style={{ color: C.textSecondary }}>Add links to your portfolios, research papers, or school websites.</p>
              
              {/* Add form */}
              <div className="flex flex-col gap-2.5 mb-4 p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800" style={{ borderColor: C.border }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Add New URL</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Link Name"
                    value={newLinkName}
                    onChange={e => setNewLinkName(e.target.value)}
                    className="flex-1 rounded-xl py-2 px-3 text-xs outline-none border focus:border-blue-400"
                    style={{ background: C.bg, borderColor: C.border, color: C.textPrimary }}
                  />
                  <input
                    type="url"
                    placeholder="URL (https://...)"
                    value={newLinkUrl}
                    onChange={e => setNewLinkUrl(e.target.value)}
                    className="flex-[2] rounded-xl py-2 px-3 text-xs outline-none border focus:border-blue-400"
                    style={{ background: C.bg, borderColor: C.border, color: C.textPrimary }}
                  />
                </div>
                <button onClick={handleAddLink} className="py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1" style={{ background: C.blue }}>
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </button>
              </div>

              {/* List */}
              <div className="flex flex-col gap-2">
                {educationLinks.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ borderColor: C.border, background: C.bg }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: C.textPrimary }}>{item.name}</p>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] truncate block max-w-[200px]" style={{ color: C.blue }}>{item.url}</a>
                    </div>
                    <button onClick={() => handleDeleteLink(idx)} className="p-2 text-red-500">
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {educationLinks.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: C.textSecondary }}>No custom links added yet.</p>
                )}
              </div>
            </div>

            {/* Skills & Badges Section */}
            <div className="rounded-2xl p-5 border flex flex-col gap-4" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: C.border }}>
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: C.textPrimary }}>
                  <Award className="w-4 h-4" style={{ color: C.blue }} /> Skills & Badges
                </h4>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/career/team-finder')} className="text-[10px] font-bold text-white px-2.5 py-1 rounded-lg" style={{ background: C.blue }}>
                    Update Skills
                  </button>
                  <button onClick={() => navigate('/career/badges')} className="text-[10px] font-bold text-white px-2.5 py-1 rounded-lg" style={{ background: C.navy }}>
                    View Badges
                  </button>
                </div>
              </div>

              {loadingDetails ? (
                <div className="flex justify-center py-6">
                  <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Skills List */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Active Skills (Team Finder)</p>
                    {mySkills.length === 0 ? (
                      <p className="text-xs italic" style={{ color: C.textSecondary }}>No skills added. Tap Update Skills to configure your match profile.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {mySkills.map((skill, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: '#f1f5f9', color: C.textPrimary, border: `1px solid ${C.border}` }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Badges List */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Earned Badges ({myBadges.length})</p>
                    {myBadges.length === 0 ? (
                      <p className="text-xs italic" style={{ color: C.textSecondary }}>No badges earned yet. Complete projects and attend workshops to earn credentials.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {myBadges.map((eb, idx) => {
                          const b = eb?.badge; if (!b) return null;
                          return (
                            <div key={eb.id || idx} className="flex items-center gap-2.5 p-2 rounded-xl border animate-fade-in" style={{ borderColor: C.border, background: C.bg }}>
                              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                                <Award className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold truncate" style={{ color: C.textPrimary }}>{b.name}</p>
                                <p className="text-[9px] font-semibold" style={{ color: C.textSecondary }}>{b.points} Points</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Capstone Projects Section */}
            <div className="rounded-2xl p-5 border flex flex-col gap-4" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: C.border }}>
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: C.textPrimary }}>
                  <BookOpen className="w-4 h-4" style={{ color: C.blue }} /> Capstone Project Tracker
                </h4>
                <button onClick={() => navigate('/career/projects')} className="text-[10px] font-bold text-white px-2.5 py-1 rounded-lg" style={{ background: C.blue }}>
                  Track Projects
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex justify-center py-6">
                  <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                </div>
              ) : myProjects.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs italic" style={{ color: C.textSecondary }}>No projects registered yet.</p>
                  <p className="text-[10px] mt-1" style={{ color: C.textSecondary }}>Track milestones, select faculty advisors, and manage your tasks.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {myProjects.map((p, idx) => {
                    const statusColors: Record<string, string> = {
                      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      pending: 'bg-amber-100 text-amber-800 border-amber-200',
                      declined: 'bg-rose-100 text-rose-800 border-rose-200',
                      completed: 'bg-blue-100 text-blue-800 border-blue-200'
                    };
                    const facultyStatus = p.faculty_status || 'approved';
                    const statusLabel = facultyStatus.toUpperCase();

                    return (
                      <div key={p.id || idx} className="p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all hover:shadow-sm" style={{ background: C.bg, borderColor: C.border }}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h5 className="text-xs font-bold truncate max-w-[200px]" style={{ color: C.textPrimary }}>{p.title}</h5>
                            {p.subject_code && (
                              <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 bg-slate-200/60 rounded mt-0.5 inline-block text-slate-500">
                                {p.subject_code}
                              </span>
                            )}
                          </div>
                          <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border ${statusColors[facultyStatus] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {p.description && (
                          <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: C.textSecondary }}>{p.description}</p>
                        )}

                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Milestone Progress</span>
                            <span className="text-[10px] font-extrabold" style={{ color: C.blue }}>{p.progress_pct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${p.progress_pct}%`, background: C.blue }} />
                          </div>
                        </div>

                        {p.team_members && (
                          <div className="text-[9px] font-medium" style={{ color: C.textSecondary }}>
                            <span className="font-bold">Team:</span> {p.team_members}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {accountSaved && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: C.cyan + '14', color: C.cyan }}>
                <CheckCircle className="w-4 h-4" /> Account details saved
              </div>
            )}
          </div>
        )}

        {/* ═══════════ Security Tab ═══════════ */}
        {activeTab === 'security' && !isGuest && (
          <div className="animate-fade-in flex flex-col gap-4">
            
            {/* Change Password */}
            <button onClick={() => navigate('/change-password')} className="rounded-2xl p-4 flex items-center gap-4 text-left w-full transition-all border group" style={{ background: C.card, borderColor: C.border }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: C.bg, color: C.terra }}>
                <Key className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>Change Password</p>
                <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>Update credentials with strength validation.</p>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: C.textSecondary }} />
            </button>

            {/* Biometric Credentials */}
            <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: C.textPrimary }}>
                  <Fingerprint className="w-4 h-4" style={{ color: C.blue }} /> Biometric Authentication
                </h4>
                <button onClick={startBiometricRegistration} disabled={biometricRegistering}
                  className="text-xs font-semibold flex items-center gap-1 disabled:opacity-50" style={{ color: C.blue }}>
                  {biometricRegistering ? 'Registering...' : 'Add Device'}
                </button>
              </div>
              {biometricMsg && (
                <div className="mb-3 p-3 rounded-xl text-xs font-medium border"
                  style={{ background: biometricMsg.type === 'success' ? C.cyan + '0a' : C.red + '0a', borderColor: biometricMsg.type === 'success' ? C.cyan + '30' : C.red + '30', color: biometricMsg.type === 'success' ? C.cyan : C.red }}>
                  {biometricMsg.text}
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                {biometrics.map(cred => (
                  <div key={cred.id} className="flex items-center justify-between p-2 rounded-xl border" style={{ borderColor: C.border, background: C.bg }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: C.textPrimary }}>{cred.device_name || 'Biometric Key'}</p>
                      <span className="text-[10px]" style={{ color: C.textSecondary }}>Registered: {cred.created_at ? new Date(cred.created_at).toLocaleDateString() : '—'}</span>
                    </div>
                    <button onClick={() => revokeBiometric(cred.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {biometrics.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: C.textSecondary }}>No biometrics configured. Register FaceID/Fingerprint for passwordless logins.</p>
                )}
              </div>
            </div>

            {/* Active Sessions */}
            <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: C.textPrimary }}>
                  <Wifi className="w-4 h-4" style={{ color: C.blue }} /> Active Sessions
                </h4>
                {sessions.length > 0 && (
                  <button onClick={() => setConfirmLogoutAll(true)} className="text-xs font-semibold" style={{ color: C.red }}>
                    Revoke All
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {sessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-2 rounded-xl border" style={{ borderColor: C.border, background: session.is_current ? C.blue + '0a' : C.bg }}>
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold truncate" style={{ color: C.textPrimary }}>{session.device_info?.split(' ').slice(0, 3).join(' ') || 'Unknown Device'}</p>
                        {session.is_current && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white">This</span>}
                      </div>
                      <p className="text-[9px]" style={{ color: C.textSecondary }}>IP: {session.ip_address || '—'} · {timeAgo(session.created_at)}</p>
                    </div>
                    <button onClick={() => revokeSession(session.id)} disabled={sessionLoading === session.id} className="p-2 rounded-lg text-red-500">
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Accent Color Selection (moved from Prefs, replaces Sign Out in Security) */}
            <div className="rounded-2xl p-5 border mt-2" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: C.textPrimary }}>
                  <Palette className="w-4 h-4" style={{ color: C.blue }} /> App Accent Color
                </h4>
                {prefsSaved && (
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Applied
                  </span>
                )}
              </div>
              <p className="text-xs mb-4" style={{ color: C.textSecondary }}>Customize the app highlight color. Tap any shade to apply instantly.</p>
              
              <div className="flex gap-3 flex-wrap">
                {[
                  { key: '#0080c7', label: 'Blue' },
                  { key: '#22346c', label: 'Navy' },
                  { key: '#27bcd1', label: 'Cyan' },
                  { key: '#a91f23', label: 'Red' },
                  { key: '#c9503d', label: 'Terra' },
                ].map(c => (
                  <button
                    key={c.key}
                    onClick={() => handleAccentColorChange(c.key)}
                    className="w-10 h-10 rounded-xl transition-all hover:scale-[1.08] active:scale-95"
                    style={{
                      background: c.key,
                      boxShadow: accentColor === c.key ? `0 0 0 3px ${C.card}, 0 0 0 5px ${c.key}` : 'none',
                      transform: accentColor === c.key ? 'scale(1.1)' : 'scale(1)',
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Guest Mode Screen */}
        {isGuest && (
          <div className="animate-fade-in flex flex-col gap-6 items-center justify-center text-center py-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-md text-amber-500">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: C.textPrimary }}>You are in Guest Mode</h3>
              <p className="text-xs max-w-xs mt-2 leading-relaxed" style={{ color: C.textSecondary }}>
                You have read-only access to timetable, notice board, events, and campus utilities. To access your student profile, grades, and biometrics, please register or log in.
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full max-w-xs text-white py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
              style={{ background: C.red }}
            >
              <LogOut className="w-4 h-4" />
              Exit Guest Mode
            </button>
          </div>
        )}
      </div>

      <BottomNav />

      {/* ═══ MODALS ═══ */}

      {/* Confirm Logout All */}
      {confirmLogoutAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in p-6" style={{ background: C.navy + '60' }}>
          <div className="rounded-[24px] p-6 shadow-2xl max-w-sm w-full" style={{ background: C.card }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: C.red + '14', color: C.red }}><AlertTriangle className="w-7 h-7" /></div>
            <h3 className="text-xl font-bold text-center mb-2" style={{ color: C.textPrimary }}>Logout All Devices?</h3>
            <p className="text-sm text-center mb-6" style={{ color: C.textSecondary }}>This will sign you out from every device, including this one.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogoutAll(false)} className="flex-1 py-3.5 rounded-[14px] font-semibold text-sm" style={{ background: C.bg, color: C.textPrimary }}>Cancel</button>
              <button onClick={revokeAllSessions} className="flex-1 py-3.5 rounded-[14px] font-semibold text-sm text-white" style={{ background: C.red }}>Logout All</button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Device Naming */}
      {showBiometricNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in p-6" style={{ background: C.navy + '60' }}>
          <div className="rounded-[24px] p-6 shadow-2xl max-w-sm w-full" style={{ background: C.card }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: C.blue + '14', color: C.blue }}><Fingerprint className="w-7 h-7" /></div>
            <h3 className="text-xl font-bold text-center mb-2" style={{ color: C.textPrimary }}>Register Biometric</h3>
            <p className="text-sm text-center mb-4" style={{ color: C.textSecondary }}>Name this biometric device.</p>
            <div className="mb-6">
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: C.textSecondary }}>Device Name</label>
              <input type="text" value={customDeviceName} onChange={e => setCustomDeviceName(e.target.value)}
                className="w-full rounded-2xl py-3.5 px-4 text-sm font-medium outline-none border focus:border-blue-400"
                style={{ background: C.bg, borderColor: C.border, color: C.textPrimary }} placeholder="e.g. Personal Phone" autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBiometricNameModal(false)} className="flex-1 py-3.5 rounded-[14px] font-semibold text-sm" style={{ background: C.bg, color: C.textPrimary }}>Cancel</button>
              <button onClick={() => registerBiometric(customDeviceName)} disabled={!customDeviceName.trim()} className="flex-1 py-3.5 rounded-[14px] font-semibold text-sm text-white disabled:opacity-50" style={{ background: C.blue }}>Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Mobile Biometrics Enrollment Overlay */}
      {showBioEnrollSim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in p-6" style={{ background: C.navy + '60' }}>
          <div className="bg-slate-900 border border-slate-800 text-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-xl font-bold mb-1 tracking-tight">Biometric Simulator</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Enrolling device: {customDeviceName}</p>
            
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
              {bioEnrollStatus === 'scanning' && (
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              )}
              <button
                type="button"
                onClick={runBioEnrollSimulation}
                disabled={bioEnrollStatus === 'scanning' || bioEnrollStatus === 'success'}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                  bioEnrollStatus === 'scanning'
                    ? 'bg-slate-800 text-indigo-400 animate-pulse'
                    : bioEnrollStatus === 'success'
                    ? 'bg-emerald-600 text-white'
                    : bioEnrollStatus === 'error'
                    ? 'bg-red-950 text-red-500 border border-red-500/30'
                    : 'bg-indigo-600 text-white hover:scale-[1.05] active:scale-[0.95]'
                }`}
              >
                <Fingerprint className="w-10 h-10" />
              </button>
            </div>
            
            {/* Progress bar */}
            {bioEnrollStatus === 'scanning' && (
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6 overflow-hidden">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-75" style={{ width: `${bioEnrollProgress}%` }} />
              </div>
            )}
            
            <p className="text-sm font-bold tracking-wide uppercase transition-colors duration-300">
              {bioEnrollStatus === 'scanning' ? (
                <span className="text-indigo-400 animate-pulse">
                  {bioEnrollProgress < 40 ? 'Place finger on scanner...' : bioEnrollProgress < 80 ? 'Scanning fingerprint...' : 'Registering credential...'}
                </span>
              ) : bioEnrollStatus === 'success' ? (
                <span className="text-emerald-400">Enrollment successful</span>
              ) : bioEnrollStatus === 'error' ? (
                <span className="text-red-400">Enrollment failed</span>
              ) : (
                <span className="text-slate-300">Tap icon to begin scan</span>
              )}
            </p>
            
            {bioEnrollStatus === 'scanning' && (
              <p className="text-[10px] text-slate-500 mt-1 font-mono">{Math.floor(bioEnrollProgress)}% Complete</p>
            )}
            
            {bioEnrollStatus === 'scanning' && (
              <button
                type="button"
                onClick={() => {
                  setShowBioEnrollSim(false);
                  setBiometricRegistering(false);
                }}
                className="mt-6 text-xs font-bold text-slate-500 hover:text-slate-400 tracking-wider uppercase"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm animate-fade-in" style={{ background: C.navy + '70' }}>
          <div className="rounded-t-[28px] w-full max-w-md p-6 animate-slide-up" style={{ background: C.card }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: C.textPrimary }}>Scan Attendance QR</h2>
              <button onClick={() => setShowQRScanner(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.bg }}><X className="w-4 h-4" style={{ color: C.textSecondary }} /></button>
            </div>
            
            <div className="w-full aspect-square rounded-[20px] flex flex-col items-center justify-center mb-4 relative overflow-hidden" style={{ background: C.navy }}>
              {cameraError ? (
                <div className="p-6 text-center text-red-400">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm font-semibold">{cameraError}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-8 border-2 rounded-2xl pointer-events-none" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                  <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg pointer-events-none" style={{ borderColor: C.cyan }} />
                  <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg pointer-events-none" style={{ borderColor: C.cyan }} />
                  <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg pointer-events-none" style={{ borderColor: C.cyan }} />
                  <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 rounded-br-lg pointer-events-none" style={{ borderColor: C.cyan }} />
                  <div className="absolute left-8 right-8 h-0.5 animate-scan pointer-events-none" style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}80` }} />
                  <div className="absolute inset-x-0 bottom-4 text-center z-10 pointer-events-none">
                    <span className="text-[10px] bg-slate-900/80 text-white/80 px-2.5 py-1 rounded-full font-bold">Scanning Active Feed...</span>
                  </div>
                </>
              )}
            </div>

            {attendanceMsg && (
              <div className="mb-4 p-4 rounded-[14px] flex items-center gap-2 text-sm font-medium border animate-fade-in"
                style={{ background: attendanceMsg.type === 'success' ? C.cyan + '0a' : C.red + '0a', borderColor: attendanceMsg.type === 'success' ? C.cyan + '30' : C.red + '30', color: attendanceMsg.type === 'success' ? C.cyan : C.red }}>
                {attendanceMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {attendanceMsg.text}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowQRScanner(false)} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm" style={{ background: C.bg, color: C.textPrimary }}>Cancel</button>
              <button onClick={handleClassAttendance} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white" style={{ background: C.blue }}>Class Scan</button>
              <button onClick={handleClubAttendance} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white" style={{ background: C.navy }}>Club Scan</button>
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }

        /* 3D Flipping Card CSS */
        .flip-card {
          perspective: 1000px;
          background-color: transparent;
          cursor: pointer;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: relative;
          width: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .flip-card-back {
          position: absolute;
          inset: 0;
          transform: rotateY(180deg);
          z-index: 2;
        }
      `}</style>
    </div>
  );
};

export default Profile;
