import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Smartphone, Monitor, Tablet, Wifi, 
  Trash2, LogOut, Fingerprint, Shield, Key,
  Plus, X
} from 'lucide-react';
import { api } from '../lib/api';
import BottomNav from '../components/BottomNav';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [biometrics, setBiometrics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'sessions' | 'biometric' | 'security'>('sessions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchSessions();
    fetchBiometrics();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.sessions || []);
    } catch {
      // Mock data for display
      setSessions([
        { id: '1', device_info: 'Chrome on Windows', device_type: 'desktop', ip_address: '192.168.1.5', is_active: true, created_at: new Date().toISOString() },
        { id: '2', device_info: 'Safari on iPhone', device_type: 'mobile', ip_address: '10.0.0.42', is_active: true, created_at: new Date(Date.now() - 86400000).toISOString() },
      ]);
    }
    setLoading(false);
  };

  const fetchBiometrics = async () => {
    try {
      const res = await api.get('/auth/biometric/credentials');
      setBiometrics(res.data.credentials || []);
    } catch {
      setBiometrics([]);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch {}
  };

  const revokeAllSessions = async () => {
    try {
      await api.post('/auth/sessions/revoke-all');
      setSessions([]);
    } catch {}
  };

  const registerBiometric = async () => {
    try {
      // In production, this would invoke navigator.credentials.create()
      await api.post('/auth/biometric/register', {
        credential_id: `cred_${Date.now()}`,
        public_key: 'demo-public-key-base64',
        device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      });
      fetchBiometrics();
    } catch {}
  };

  const revokeBiometric = async (credId: string) => {
    try {
      await api.delete(`/auth/biometric/credentials/${credId}`);
      setBiometrics(biometrics.filter(b => b.id !== credId));
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const isGuest = user?.is_guest || user?.role === 'guest';

  return (
    <div className="min-h-full bg-white flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Header */}
      <div className="bg-slate-900 rounded-b-[40px] p-8 pt-12">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
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
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full uppercase tracking-wider">
              {user?.role || 'student'}
            </span>
          </div>
        </div>
      </div>

      {/* Guest Warning */}
      {isGuest && (
        <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Guest Mode Active</p>
            <p className="text-xs text-amber-700 mt-1">You can view Campus Map, Events (read-only), and Public Notices. <button onClick={() => navigate('/login')} className="text-indigo-600 font-bold underline">Sign in</button> for full access.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isGuest && (
        <div className="px-6 mt-6">
          <div className="flex bg-slate-100 rounded-2xl p-1">
            {[
              { key: 'sessions', label: 'Sessions', icon: <Wifi className="w-4 h-4" /> },
              { key: 'biometric', label: 'Biometric', icon: <Fingerprint className="w-4 h-4" /> },
              { key: 'security', label: 'Security', icon: <Key className="w-4 h-4" /> },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 mt-6 flex-1 overflow-y-auto">

        {/* Sessions Tab */}
        {activeTab === 'sessions' && !isGuest && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Active Devices</h3>
              <button onClick={revokeAllSessions} className="text-xs font-bold text-red-500 flex items-center gap-1 hover:text-red-600">
                <LogOut className="w-4 h-4" /> Logout All
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {sessions.map(session => (
                <div key={session.id} className="bg-slate-50 rounded-[20px] p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    {getDeviceIcon(session.device_type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{session.device_info?.split(' ').slice(0, 4).join(' ') || 'Unknown Device'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      IP: {session.ip_address} &middot; {session.device_type || 'desktop'}
                    </p>
                  </div>
                  <button onClick={() => revokeSession(session.id)}
                    className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-8">No active sessions.</p>
              )}
            </div>
          </div>
        )}

        {/* Biometric Tab */}
        {activeTab === 'biometric' && !isGuest && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Registered Devices</h3>
              <button onClick={registerBiometric} className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Device
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-indigo-50 rounded-[20px] p-4 mb-4 flex items-start gap-3">
              <Fingerprint className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-indigo-800">Passwordless Login</p>
                <p className="text-xs text-indigo-700 mt-1">Use your device's fingerprint or Face ID for instant access in the Canteen, Exam Portal, and more.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {biometrics.map(cred => (
                <div key={cred.id} className="bg-slate-50 rounded-[20px] p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{cred.device_name || 'Device'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Registered: {new Date(cred.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => revokeBiometric(cred.id)}
                    className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {biometrics.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-8">No biometric credentials registered yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && !isGuest && (
          <div className="animate-fade-in flex flex-col gap-4">
            <button onClick={() => navigate('/change-password')} className="bg-slate-50 rounded-[20px] p-4 flex items-center gap-4 text-left w-full hover:bg-slate-100 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                <Key className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Change Password</p>
                <p className="text-xs text-slate-500 mt-0.5">Update your login password.</p>
              </div>
            </button>

            <button onClick={handleLogout} className="bg-red-50 rounded-[20px] p-4 flex items-center gap-4 text-left w-full hover:bg-red-100 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">Sign Out</p>
                <p className="text-xs text-red-600 mt-0.5">Log out from this device.</p>
              </div>
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
