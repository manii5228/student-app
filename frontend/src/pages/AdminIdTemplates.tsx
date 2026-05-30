import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Sparkles, Shield, User, Award } from 'lucide-react';
import { api } from '../lib/api';
import BottomNav from '../components/BottomNav';

const PRESETS = [
  { id: 'classic-navy', name: 'Classic Navy', gradient: 'linear-gradient(135deg, #22346c, #0080c7)' },
  { id: 'premium-gold', name: 'Premium Gold', gradient: 'linear-gradient(135deg, #111827, #374151)' },
  { id: 'vibrant-crimson', name: 'Vibrant Crimson', gradient: 'linear-gradient(135deg, #a91f23, #c9503d)' },
  { id: 'tech-cyan', name: 'Tech Cyan', gradient: 'linear-gradient(135deg, #0f172a, #1e293b)' },
  { id: 'elegant-dark', name: 'Elegant Dark', gradient: 'linear-gradient(135deg, #000000, #2d3748)' },
];

const AdminIdTemplates = () => {
  const navigate = useNavigate();
  const [roleType, setRoleType] = useState<'student' | 'faculty'>('student');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    college_name: 'VelTech University',
    background_style: 'classic-navy',
    primary_color: '#22346c',
    accent_color: '#0080c7',
    logo_url: '',
    custom_bg_url: ''
  });

  useEffect(() => {
    fetchTemplate();
  }, [roleType]);

  const fetchTemplate = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/auth/id-template/${roleType}`);
      setFormData({
        college_name: data.college_name || 'VelTech University',
        background_style: data.background_style || 'classic-navy',
        primary_color: data.primary_color || '#22346c',
        accent_color: data.accent_color || '#0080c7',
        logo_url: data.logo_url || '',
        custom_bg_url: data.custom_bg_url || ''
      });
    } catch (err) {
      setError('Failed to load template.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await api.post('/admin/id-template', {
        role_type: roleType,
        ...formData
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const currentPreset = PRESETS.find(p => p.id === formData.background_style) || PRESETS[0];

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in pb-24">
      {/* Header */}
      <div className="bg-slate-900 p-6 pt-12 flex items-center gap-4 text-white">
        <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/15 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">ID Card Templates</h1>
          <p className="text-xs text-slate-400">Configure global virtual ID looks</p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-5">
        {/* Role Type Selection Toggle */}
        <div className="flex bg-slate-200 p-1.5 rounded-2xl mb-6">
          <button
            onClick={() => setRoleType('student')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${roleType === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Student Card Template
          </button>
          <button
            onClick={() => setRoleType('faculty')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${roleType === 'faculty' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Faculty Card Template
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Live Interactive Preview */}
            <div className="rounded-[28px] p-5 bg-white border border-slate-100 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Live Card Preview</h3>
              
              <div className="relative rounded-[20px] overflow-hidden aspect-[1.58/1] shadow-lg text-white p-5 flex flex-col justify-between"
                style={{
                  background: currentPreset.gradient,
                  backgroundColor: formData.primary_color
                }}
              >
                {/* Logo & College */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[3px]">{formData.college_name}</h4>
                    <p className="text-[8px] text-white/50">{roleType === 'student' ? 'Student' : 'Faculty'} Virtual ID</p>
                  </div>
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="h-6 w-auto object-contain" />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white/80" />
                    </div>
                  )}
                </div>

                {/* Info and Avatar mockup */}
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-base font-extrabold tracking-tight">
                      {roleType === 'student' ? 'Mani Manjunath' : 'Dr. Ramesh Kumar'}
                    </h3>
                    <p className="text-[10px] text-white/70 font-medium">
                      {roleType === 'student' ? 'VT2024CSE102' : 'EMP2021FAC001'}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-white/14">
                        CSE
                      </span>
                      {roleType === 'student' && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
                          Hosteler
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Photo mockup */}
                  <div className="w-14 h-14 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center">
                    {roleType === 'student' ? (
                      <User className="w-7 h-7 text-white/60" />
                    ) : (
                      <Shield className="w-7 h-7 text-white/60" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Config Form */}
            <div className="rounded-[28px] p-6 bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Template Settings</h3>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  Template updated successfully!
                </div>
              )}

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">University / College Name</label>
                <input
                  type="text"
                  value={formData.college_name}
                  onChange={e => setFormData({ ...formData, college_name: e.target.value })}
                  className="w-full rounded-2xl py-3 px-4 text-sm font-medium outline-none border bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"
                  placeholder="e.g. VelTech University"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Background Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, background_style: p.id })}
                      className={`p-3 rounded-xl border-2 text-left text-xs font-bold transition-all ${formData.background_style === p.id ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-100 bg-slate-50 text-slate-700'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-12 h-11 p-0.5 rounded-xl outline-none cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 rounded-xl px-3 text-xs font-mono border bg-slate-50 border-slate-200 text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={e => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-12 h-11 p-0.5 rounded-xl outline-none cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={formData.accent_color}
                      onChange={e => setFormData({ ...formData, accent_color: e.target.value })}
                      className="flex-1 rounded-xl px-3 text-xs font-mono border bg-slate-50 border-slate-200 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Logo URL (Optional)</label>
                <input
                  type="text"
                  value={formData.logo_url}
                  onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full rounded-2xl py-3 px-4 text-sm font-medium outline-none border bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-2 rounded-2xl py-4 bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default AdminIdTemplates;
