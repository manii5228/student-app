import React, { useState } from 'react';
import { ChevronLeft, Lock, Eye, EyeOff, CheckCircle, ShieldCheck, AlertTriangle, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import BottomNav from '../components/BottomNav';
import zxcvbn from 'zxcvbn';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password requirements check
  const checkRequirements = (pw: string) => {
    return {
      length: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      number: /[0-9]/.test(pw),
      symbol: /[^A-Za-z0-9]/.test(pw),
    };
  };

  // Password strength calculator using zxcvbn
  const getStrength = (pw: string): { score: number; label: string; color: string; feedback?: string } => {
    if (!pw) return { score: 0, label: 'Very Weak', color: 'bg-slate-200' };
    const result = zxcvbn(pw);
    const score = result.score; // 0 to 4
    
    switch (score) {
      case 0:
        return { score: 1, label: 'Very Weak', color: 'bg-red-600', feedback: result.feedback.warning || 'Highly vulnerable password.' };
      case 1:
        return { score: 2, label: 'Weak', color: 'bg-red-400', feedback: result.feedback.warning || 'Predictable password.' };
      case 2:
        return { score: 3, label: 'Fair', color: 'bg-amber-500', feedback: result.feedback.suggestions?.[0] || 'Decent, but easily guessable.' };
      case 3:
        return { score: 4, label: 'Good', color: 'bg-blue-500', feedback: 'Good security. Hard to guess.' };
      case 4:
        return { score: 5, label: 'Strong', color: 'bg-emerald-500', feedback: 'Excellent strength. Very secure.' };
      default:
        return { score: 0, label: 'Very Weak', color: 'bg-slate-200' };
    }
  };

  const reqs = checkRequirements(newPassword);
  const requirementsMet = reqs.length && reqs.uppercase && reqs.number && reqs.symbol;
  const strength = getStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requirementsMet) {
      setError('New password must satisfy all security requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('New passwords do not match.');
      return;
    }
    if (oldPassword === newPassword) {
      setError('New password must be different from old password.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-full bg-white flex flex-col font-sans animate-fade-in relative pb-24">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-scale-in">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Password Changed</h2>
          <p className="text-sm text-slate-500 text-center mb-8">
            Your password has been updated successfully. All other active sessions remain valid.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-slate-900 text-white py-4 rounded-[20px] font-bold text-sm shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            Back to Profile
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-slate-900 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Change Password</h1>
            <p className="text-xs text-slate-400">Update your login credentials</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Security Info */}
        <div className="bg-blue-50 rounded-[20px] p-4 mb-6 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-800">Security Requirement</p>
            <p className="text-xs text-blue-700 mt-1">
              Minimum 8 characters. Use uppercase, numbers, and special characters for maximum security.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-[16px] font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Current Password */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showOld ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-[16px] py-4 pl-12 pr-12 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-[16px] py-4 pl-12 pr-12 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                placeholder="Enter new password"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Strength Meter */}
            {newPassword.length > 0 && (
              <div className="mt-3 animate-fade-in">
                <div className="flex gap-1.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    strength.score <= 2 ? 'text-red-500' : strength.score === 3 ? 'text-amber-500' : strength.score === 4 ? 'text-blue-500' : 'text-emerald-500'
                  }`}>
                    Strength: {strength.label}
                  </p>
                </div>
                {strength.feedback && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-start gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{strength.feedback}</span>
                  </p>
                )}
              </div>
            )}

            {/* Password Requirements Checklist */}
            <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2.5">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Security Checklist</p>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${reqs.length ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  {reqs.length ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                </div>
                <span className={reqs.length ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${reqs.uppercase ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  {reqs.uppercase ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                </div>
                <span className={reqs.uppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  At least one uppercase letter (A-Z)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${reqs.number ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  {reqs.number ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                </div>
                <span className={reqs.number ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  At least one number (0-9)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${reqs.symbol ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  {reqs.symbol ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                </div>
                <span className={reqs.symbol ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  At least one special character (!@#$, etc.)
                </span>
              </div>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`w-full bg-slate-50 border rounded-[16px] py-4 pl-12 pr-12 text-sm font-medium text-slate-900 focus:outline-none transition-all ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-emerald-400 focus:border-emerald-400 bg-emerald-50/30'
                      : 'border-red-300 focus:border-red-400'
                    : 'border-slate-200 focus:border-indigo-400 focus:bg-white'
                }`}
                placeholder="Re-enter new password"
              />
              {confirmPassword.length > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {passwordsMatch ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !passwordsMatch || !requirementsMet}
            className="mt-4 w-full bg-slate-900 text-white py-4 rounded-[20px] font-bold text-sm shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default ChangePassword;
