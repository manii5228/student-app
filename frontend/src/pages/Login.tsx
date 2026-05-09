import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Fingerprint, UserCircle } from 'lucide-react';
import { api } from '../lib/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'email' | 'sso'>('email');

  // ── Email/Password Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── SSO Login (College Email) ──
  const handleSSO = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/sso', {
        email,
        sso_token: 'mock-sso-token-from-idp',
      });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'SSO login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Biometric Login ──
  const handleBiometric = async () => {
    setError('');
    if (!navigator.credentials) {
      setError('WebAuthn is not supported on this device.');
      return;
    }
    try {
      // In production, you'd call navigator.credentials.get() here.
      // For demo purposes, we simulate a credential response.
      setLoading(true);
      const res = await api.post('/auth/biometric/authenticate', {
        credential_id: 'demo-credential-id',
        sign_count: Date.now(),
      });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Biometric auth failed. Register your fingerprint first.');
    } finally {
      setLoading(false);
    }
  };

  // ── Guest Mode ──
  const handleGuest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/guest');
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err: any) {
      setError('Guest login failed');
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
            onClick={() => setTab('email')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'email' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
          >
            Email Login
          </button>
          <button
            onClick={() => setTab('sso')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'sso' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
          >
            College SSO
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-8 pb-6 flex-shrink-0">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl text-center font-medium">
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
                className="w-full bg-slate-100 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
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
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-50 rounded-2xl text-indigo-600 font-bold text-sm hover:bg-indigo-100 active:scale-[0.98] transition-all"
          >
            <Fingerprint className="w-5 h-5" />
            Biometric
          </button>
          <button
            onClick={handleGuest}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-200 active:scale-[0.98] transition-all"
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
    </div>
  );
};

export default Login;
