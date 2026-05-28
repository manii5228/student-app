import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Hash, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = basic info, 2 = academic info
  const [showPw, setShowPw] = useState(false);

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'student',
    department: '',
    roll_number: '',
    semester: 1,
    section: 'A',
    batch_year: 2025,
  });

  const set = (key: string, value: any) => setForm({ ...form, [key]: value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      // Auto-login after register
      const loginRes = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem('token', loginRes.data.access_token);
      localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-white">
      
      {/* Header */}
      <div className="flex items-center p-6 pt-10">
        <button onClick={() => step === 1 ? navigate('/login') : setStep(1)} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="ml-4">
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-sm text-slate-500">Step {step} of 2</p>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="px-8 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-indigo-500"></div>
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step === 2 ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
        </div>
      </div>

      {error && (
        <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleRegister} className="flex-1 px-8 pb-10 flex flex-col">
        
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="First Name" value={form.first_name} onChange={(e) => set('first_name', e.target.value)}
                  className="w-full bg-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30" required />
              </div>
              <div>
                <input type="text" placeholder="Last Name" value={form.last_name} onChange={(e) => set('last_name', e.target.value)}
                  className="w-full bg-slate-100 rounded-2xl py-4 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30" required />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="email" placeholder="name@veltech.edu.in" value={form.email} onChange={(e) => set('email', e.target.value)}
                className="w-full bg-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30" required />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="w-full bg-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type={showPw ? 'text' : 'password'} placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => set('password', e.target.value)}
                className="w-full bg-slate-100 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30" required minLength={8} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Role Selector */}
            <div className="flex gap-2">
              {['student', 'faculty'].map(role => (
                <button key={role} type="button" onClick={() => set('role', role)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold capitalize transition-all ${form.role === role ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
                  {role}
                </button>
              ))}
            </div>

            {/* Department */}
            <select value={form.department} onChange={(e) => set('department', e.target.value)}
              className="w-full bg-slate-100 rounded-2xl py-4 px-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none" required>
              <option value="">Select Department</option>
              {['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'AI/ML', 'Data Science'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Student-specific */}
            {form.role === 'student' && (
              <>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Roll Number (e.g. 22CSE001)" value={form.roll_number} onChange={(e) => set('roll_number', e.target.value)}
                    className="w-full bg-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30" required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <select value={form.semester} onChange={(e) => set('semester', parseInt(e.target.value))}
                    className="bg-slate-100 rounded-2xl py-4 px-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                  <select value={form.section} onChange={(e) => set('section', e.target.value)}
                    className="bg-slate-100 rounded-2xl py-4 px-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none">
                    {['A','B','C','D'].map(s => <option key={s} value={s}>Sec {s}</option>)}
                  </select>
                  <select value={form.batch_year} onChange={(e) => set('batch_year', parseInt(e.target.value))}
                    className="bg-slate-100 rounded-2xl py-4 px-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none">
                    {[2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-6">
          <button type="submit" disabled={loading}
            className="w-full bg-slate-900 text-white rounded-2xl py-4 text-sm font-bold tracking-wide hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating account...
              </span>
            ) : step === 1 ? 'Next' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
