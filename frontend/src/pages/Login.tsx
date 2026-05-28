import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Fingerprint, UserCircle, Shield, AlertTriangle, Globe, Building } from 'lucide-react';
import { api } from '../lib/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'email' | 'sso'>('email');
  const [showGuestConfirm, setShowGuestConfirm] = useState(false);

  // SSO & Biometrics Fallback state
  const [showSSOPopup, setShowSSOPopup] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<'google' | 'microsoft' | null>(null);
  const [ssoStage, setSsoStage] = useState(0);
  const [ssoProcessingMsg, setSsoProcessingMsg] = useState('');
  const [highlightPassword, setHighlightPassword] = useState(false);

  // Lock guests in guest mode
  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.role === 'guest' || u.is_guest) {
        navigate('/');
      }
    }
  }, [navigate]);

  // ── Email/Password Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      const role = res.data.user.role;
      if (role === 'faculty') {
        navigate('/faculty');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── SSO Login (College Email) ──
  const startSSOSimulation = (provider: 'google' | 'microsoft') => {
    setSsoProvider(provider);
    setLoading(true);
    setSsoStage(1);
    setSsoProcessingMsg('Connecting to identity provider...');

    setTimeout(() => {
      setSsoStage(2);
      setSsoProcessingMsg(`Authenticating via ${provider === 'google' ? 'Google accounts' : 'Microsoft Azure AD'}...`);
      
      setTimeout(() => {
        setSsoStage(3);
        setSsoProcessingMsg('Verifying federated token claims with VelTech Directory...');
        
        setTimeout(async () => {
          setSsoStage(4);
          setSsoProcessingMsg('Redirecting back to VelTech Super-App...');
          
          try {
            const res = await api.post('/auth/sso', {
              email,
              sso_token: `mock-sso-token-from-${provider}`,
            });
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            const role = res.data.user.role;
            if (role === 'faculty') {
              navigate('/faculty');
            } else if (role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/');
            }
          } catch (err: any) {
            setError(err.response?.data?.error || 'SSO authentication failed. Is your account registered?');
          } finally {
            setLoading(false);
            setSsoProvider(null);
            setSsoStage(0);
          }
        }, 1200);
      }, 1200);
    }, 1000);
  };

  const handleSSO = async () => {
    if (!email) { setError('Please enter your college email.'); return; }
    
    const domain = email.split('@')[1]?.toLowerCase();
    const allowed = ['veltech.edu.in', 'vel-tech.org', 'veltech.ac.in'];
    if (!allowed.includes(domain)) {
      setError('SSO is only available for @veltech.edu.in, @vel-tech.org, or @veltech.ac.in accounts.');
      return;
    }

    setError('');
    setShowSSOPopup(true);
  };

  // ── Biometric Login (WebAuthn) ──
  const handleBiometric = async () => {
    setError('');
    
    if (!window.PublicKeyCredential) {
      setError('WebAuthn is not supported on this browser. Use Chrome or Safari with biometric hardware.');
      transitionToEmailFallback();
      return;
    }

    try {
      setLoading(true);

      // Step 1: Try to use the real WebAuthn get() for passwordless login
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 10000,
          userVerification: 'required',
          rpId: window.location.hostname,
        },
      }) as PublicKeyCredential;

      if (!assertion) throw new Error('Biometric assertion not generated.');

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));

      // Step 2: Send the credential to the backend for verification
      const res = await api.post('/auth/biometric/authenticate', {
        credential_id: credentialId,
        sign_count: Date.now(), // In production, extract from authenticatorData
      });

      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err: any) {
      let errMsg = '';
      if (err.name === 'NotAllowedError') {
        errMsg = 'Biometric authentication was denied or timed out.';
      } else {
        errMsg = err.response?.data?.error || err.message || 'Biometric auth failed. Register your fingerprint in Profile first.';
      }
      setError(errMsg);
      transitionToEmailFallback();
    } finally {
      setLoading(false);
    }
  };

  const transitionToEmailFallback = () => {
    setTab('email');
    setHighlightPassword(true);
    setTimeout(() => {
      setHighlightPassword(false);
    }, 2500);
  };

  // ── Guest Mode ──
  const handleGuest = async () => {
    setShowGuestConfirm(false);
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/guest');
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err: any) {
      setError('Guest login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between bg-white">
      
      {/* Top Section — Brand */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl mb-8">
          <span className="text-5xl font-black text-white">V</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-sm text-slate-500 text-center">Sign in to your VelTech Super-App</p>
      </div>

      {/* Tabs: Email | SSO */}
      <div className="px-8">
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setTab('email'); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'email' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
          >
            Email Login
          </button>
          <button
            onClick={() => { setTab('sso'); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'sso' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
          >
            College SSO
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-8 pb-6 flex-shrink-0">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl text-center font-medium flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={tab === 'email' ? handleLogin : (e) => { e.preventDefault(); handleSSO(); }}>
          {/* Email */}
          <div className="relative mb-4">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              placeholder={tab === 'sso' ? 'name@veltech.edu.in' : 'Email address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              required
            />
          </div>
          
          {/* Password (only for email login) */}
          {tab === 'email' && (
            <div className="relative mb-6">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-slate-100 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all border ${
                  highlightPassword
                    ? 'border-red-500 ring-2 ring-indigo-500/40 animate-pulse scale-[1.01]'
                    : 'border-transparent focus:ring-2 focus:ring-indigo-500/30'
                }`}
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-2xl py-4 text-sm font-bold tracking-wide hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Signing in...
              </span>
            ) : (
              tab === 'email' ? 'Sign In' : 'Continue with SSO'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Biometric + Guest Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleBiometric}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-50 rounded-2xl text-indigo-600 font-bold text-sm hover:bg-indigo-100 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Fingerprint className="w-5 h-5" />
            Biometric
          </button>
          <button
            onClick={() => setShowGuestConfirm(true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <UserCircle className="w-5 h-5" />
            Guest Mode
          </button>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-indigo-600 font-bold hover:underline">Sign Up</button>
        </p>
      </div>

      {/* Guest Mode Confirmation Modal */}
      {showGuestConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-fade-in">
          <div className="bg-white rounded-[28px] p-6 shadow-2xl max-w-sm w-full animate-scale-in">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Continue as Guest?</h3>
            <p className="text-sm text-slate-500 text-center mb-2">
              Guest mode provides <span className="font-bold text-slate-700">limited read-only access</span> to:
            </p>
            <div className="bg-slate-50 rounded-xl p-3 mb-6">
              <ul className="text-xs text-slate-600 font-medium space-y-1.5">
                <li className="flex items-center gap-2">✅ Campus Map & Indoor Navigation</li>
                <li className="flex items-center gap-2">✅ Public Notices & Announcements</li>
                <li className="flex items-center gap-2">✅ Events & Fests (view only)</li>
                <li className="flex items-center gap-2 text-slate-400">🔒 Academics, Career, Canteen — Locked</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGuestConfirm(false)} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-[16px] font-bold text-sm hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleGuest} className="flex-1 bg-slate-900 text-white py-3.5 rounded-[16px] font-bold text-sm hover:bg-slate-800 transition-colors">
                Enter as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SSO Provider Selector Modal */}
      {showSSOPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-fade-in">
          <div className="bg-white rounded-[28px] p-6 shadow-2xl max-w-sm w-full animate-scale-in border border-slate-100">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-indigo-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-1">Select SSO Provider</h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              Authenticate securely with your VelTech credentials
            </p>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setShowSSOPopup(false);
                  startSSOSimulation('google');
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/60 text-slate-700 font-semibold text-sm transition-all hover:scale-[1.01]"
              >
                <Globe className="w-5 h-5 text-red-500" />
                <span>Sign in with Google Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSSOPopup(false);
                  startSSOSimulation('microsoft');
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/60 text-slate-700 font-semibold text-sm transition-all hover:scale-[1.01]"
              >
                <Building className="w-5 h-5 text-blue-500" />
                <span>Sign in with Microsoft 365</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSSOPopup(false)}
              className="w-full mt-4 bg-slate-100 text-slate-500 hover:text-slate-700 py-3 rounded-xl font-bold text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SSO Simulation Stage Overlay */}
      {ssoStage > 0 && ssoProvider && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-white/10 border border-white/20 backdrop-filter backdrop-blur-lg rounded-3xl p-8 shadow-2xl text-center text-white">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-2">VelTech Authentication</h3>
            <p className="text-sm text-slate-300 font-medium mb-6">
              {ssoProvider === 'google' ? 'Google IDP Link' : 'Microsoft Azure AD Link'}
            </p>

            <div className="space-y-3 text-left bg-black/20 rounded-2xl p-4 border border-white/5 font-mono text-xs text-indigo-300">
              <div className="flex items-center gap-2">
                <span className={ssoStage >= 1 ? "text-emerald-400" : "text-slate-500"}>
                  {ssoStage >= 1 ? "●" : "○"}
                </span>
                <span className={ssoStage >= 1 ? "text-slate-200" : "text-slate-400"}>
                  Connecting to {ssoProvider === 'google' ? 'Google Accounts' : 'Microsoft Live'}...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={ssoStage >= 2 ? "text-emerald-400" : "text-slate-500"}>
                  {ssoStage >= 2 ? "●" : "○"}
                </span>
                <span className={ssoStage >= 2 ? "text-slate-200" : "text-slate-400"}>
                  Verifying identity claims for {email}...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={ssoStage >= 3 ? "text-emerald-400" : "text-slate-500"}>
                  {ssoStage >= 3 ? "●" : "○"}
                </span>
                <span className={ssoStage >= 3 ? "text-slate-200" : "text-slate-400"}>
                  Exchanging SAML/OIDC federated token...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={ssoStage >= 4 ? "text-emerald-400" : "text-slate-500"}>
                  {ssoStage >= 4 ? "●" : "○"}
                </span>
                <span className={ssoStage >= 4 ? "text-slate-200" : "text-slate-400"}>
                  Redirecting to VelTech Dashboard...
                </span>
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-400 animate-pulse font-medium">
              {ssoProcessingMsg}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
