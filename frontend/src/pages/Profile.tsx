import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Smartphone, Monitor, Tablet, Wifi, 
  Trash2, LogOut, Fingerprint, Shield, Key,
  Plus, X, CheckCircle, Clock, AlertTriangle, ChevronRight
} from 'lucide-react';
import { api } from '../lib/api';
import BottomNav from '../components/BottomNav';

// Utility: time ago
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

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [biometrics, setBiometrics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'sessions' | 'biometric' | 'security'>('sessions');
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState<string | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [biometricRegistering, setBiometricRegistering] = useState(false);
  const [biometricMsg, setBiometricMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  
  // Custom device naming
  const [showBiometricNameModal, setShowBiometricNameModal] = useState(false);
  const [customDeviceName, setCustomDeviceName] = useState('');

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
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setSessions([]);
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
    setSessionLoading(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
    setSessionLoading(null);
  };

  const revokeAllSessions = async () => {
    setConfirmLogoutAll(false);
    try {
      await api.post('/auth/sessions/revoke-all');
      setSessions([]);
      // Log out the current device too
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      console.error('Failed to revoke all sessions:', err);
    }
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
      // Step 1: Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported on this browser. Try Chrome or Safari on a device with biometrics.');
      }

      // Step 2: Create a credential using the browser's WebAuthn API
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userId = new TextEncoder().encode(user?.id || 'user');

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'VelTech Super-App', id: window.location.hostname },
          user: {
            id: userId,
            name: user?.email || 'user@veltech.edu.in',
            displayName: user?.full_name || 'User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' },  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Use built-in biometric
            userVerification: 'required',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (!credential) throw new Error('Credential creation was cancelled.');

      // Step 3: Encode the credential for server storage
      const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKey = btoa(String.fromCharCode(...new Uint8Array(response.attestationObject)));

      // Step 4: Send to backend
      await api.post('/auth/biometric/register', {
        credential_id: rawId,
        public_key: publicKey,
        device_name: deviceName || 'Security Key',
      });

      setBiometricMsg({ type: 'success', text: `Biometric credential for "${deviceName}" registered successfully!` });
      fetchBiometrics();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to register biometric.';
      setBiometricMsg({ type: 'error', text: msg });
    } finally {
      setBiometricRegistering(false);
    }
  };

  const revokeBiometric = async (credId: string) => {
    try {
      await api.delete(`/auth/biometric/credentials/${credId}`);
      setBiometrics(prev => prev.filter(b => b.id !== credId));
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
              Access is limited to Campus Map, Events (read-only), and Public Notices. 
              <button onClick={() => navigate('/login')} className="text-indigo-600 font-bold underline ml-1">Sign in</button> for full access.
            </p>
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

        {/* ═══════════ Sessions Tab ═══════════ */}
        {activeTab === 'sessions' && !isGuest && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Active Devices</h3>
              {sessions.length > 0 && (
                <button onClick={() => setConfirmLogoutAll(true)} className="text-xs font-bold text-red-500 flex items-center gap-1 hover:text-red-600 transition-colors">
                  <LogOut className="w-4 h-4" /> Logout All
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map((session) => (
                  <div key={session.id} className={`rounded-[20px] p-4 flex items-center gap-4 transition-all ${session.is_current ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${session.is_current ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-500'}`}>
                      {getDeviceIcon(session.device_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {session.device_info?.split(' ').slice(0, 3).join(' ') || 'Unknown Device'}
                        </p>
                        {session.is_current && (
                          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-md uppercase">This Device</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-slate-500">{session.ip_address || '—'}</span>
                        {session.location && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-slate-500 truncate max-w-[150px]" title={session.location}>
                              {session.location}
                            </span>
                          </>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {session.created_at ? timeAgo(session.created_at) : '—'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => revokeSession(session.id)}
                      disabled={sessionLoading === session.id}
                      className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {sessionLoading === session.id ? (
                        <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></span>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-12">
                    <Wifi className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-bold">No active sessions found.</p>
                    <p className="text-slate-400 text-xs mt-1">Sessions appear after you log in.</p>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Notice */}
            <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Privacy & Session Tracking Notice</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  We log active IP addresses, device user-agents, and approximate network locations to prevent unauthorized access. If you recognize any suspicious activity, immediately revoke that session or change your password.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ Biometric Tab ═══════════ */}
        {activeTab === 'biometric' && !isGuest && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Biometric Auth</h3>
              <button 
                onClick={startBiometricRegistration} 
                disabled={biometricRegistering}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 disabled:opacity-50"
              >
                {biometricRegistering ? (
                  <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></span>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {biometricRegistering ? 'Registering...' : 'Add Device'}
              </button>
            </div>

            {/* Explainer Card */}
            <div className="bg-indigo-50 rounded-[20px] p-4 mb-4 flex items-start gap-3">
              <Fingerprint className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-indigo-800">Passwordless Login</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Register your device's fingerprint sensor or Face ID. Once registered, you can tap "Biometric" on the login screen to sign in instantly without typing a password.
                </p>
              </div>
            </div>

            {/* Feedback Message */}
            {biometricMsg && (
              <div className={`mb-4 p-4 rounded-[16px] flex items-center gap-2 text-sm font-medium animate-fade-in ${
                biometricMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {biometricMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {biometricMsg.text}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {biometrics.map(cred => (
                <div key={cred.id} className="bg-slate-50 rounded-[20px] p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{cred.device_name || 'Device'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        Registered: {cred.created_at ? new Date(cred.created_at).toLocaleDateString() : '—'}
                      </span>
                      {cred.last_used && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400">Last used: {timeAgo(cred.last_used)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => revokeBiometric(cred.id)}
                    className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {biometrics.length === 0 && (
                <div className="text-center py-12">
                  <Fingerprint className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-bold">No biometric credentials yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Tap "Add Device" to register your fingerprint or Face ID.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ Security Tab ═══════════ */}
        {activeTab === 'security' && !isGuest && (
          <div className="animate-fade-in flex flex-col gap-4">
            {/* Change Password */}
            <button onClick={() => navigate('/change-password')} className="bg-slate-50 rounded-[20px] p-4 flex items-center gap-4 text-left w-full hover:bg-slate-100 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                <Key className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Change Password</p>
                <p className="text-xs text-slate-500 mt-0.5">Update your login credentials with strength validation.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>

            {/* Account Info */}
            <div className="bg-slate-50 rounded-[20px] p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Account Details</h4>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Email</span>
                  <span className="text-xs text-slate-800 font-bold">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Role</span>
                  <span className="text-xs text-slate-800 font-bold capitalize">{user?.role}</span>
                </div>
                {user?.roll_number && (
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Roll Number</span>
                    <span className="text-xs text-slate-800 font-bold">{user.roll_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Verified</span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${user?.is_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {user?.is_verified ? <><CheckCircle className="w-3 h-3" /> Yes</> : <><AlertTriangle className="w-3 h-3" /> Pending</>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Joined</span>
                  <span className="text-xs text-slate-800 font-bold">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Danger Zone</p>
              <button onClick={handleLogout} className="bg-red-50 rounded-[20px] p-4 flex items-center gap-4 text-left w-full hover:bg-red-100 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700">Sign Out</p>
                  <p className="text-xs text-red-600 mt-0.5">Log out from this device only.</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Confirm Logout All Modal */}
      {confirmLogoutAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-6">
          <div className="bg-white rounded-[28px] p-6 shadow-2xl max-w-sm w-full animate-scale-in">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Logout All Devices?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will sign you out from every device, including this one. You'll need to log in again.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogoutAll(false)} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-[16px] font-bold text-sm hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={revokeAllSessions} className="flex-1 bg-red-600 text-white py-3.5 rounded-[16px] font-bold text-sm hover:bg-red-700 transition-colors">
                Logout All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Device Naming Modal */}
      {showBiometricNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-6">
          <div className="bg-white rounded-[28px] p-6 shadow-2xl max-w-sm w-full animate-scale-in">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Fingerprint className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Register Biometric</h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              Enter a custom nickname for this biometric device (e.g. "Mani's Phone", "Work Laptop") to recognize it.
            </p>
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Device Name</label>
              <input
                type="text"
                value={customDeviceName}
                onChange={(e) => setCustomDeviceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                placeholder="e.g. Personal Phone"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowBiometricNameModal(false)} 
                className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-[16px] font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => registerBiometric(customDeviceName)} 
                disabled={!customDeviceName.trim()}
                className="flex-1 bg-indigo-600 text-white py-3.5 rounded-[16px] font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
