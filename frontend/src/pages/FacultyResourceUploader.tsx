import React, { useState, useEffect } from 'react';
import { ChevronLeft, Upload, FileText, Trash2, Download, Search, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface ResourceItem { id:string; title:string; description?:string; file_url:string; file_type:string; subject_code?:string; subject_name?:string; department?:string; semester?:number; created_at?:string; }

const FacultyResourceUploader = () => {
  const nav = useNavigate();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', file_url:'', file_type:'pdf', subject_code:'', subject_name:'', department:'CSE', semester:'4' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const {data}=await api.get('/faculty/resources'); setResources(data.resources||[]); } catch{} setLoading(false); };

  const upload = async () => {
    if (!form.title.trim() || !form.file_url.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/faculty/resources', { ...form, semester: parseInt(form.semester) || null });
      setShowUpload(false); setForm({title:'',description:'',file_url:'',file_type:'pdf',subject_code:'',subject_name:'',department:'CSE',semester:'4'}); load();
    } catch{}
    setSubmitting(false);
  };

  const fileIcons:Record<string,string> = { pdf:'📄', ppt:'📊', doc:'📝', video:'🎬', image:'🖼️', code:'💻', other:'📎' };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
            <div><h1 className="text-xl font-bold text-white">Resources</h1><p className="text-xs text-orange-100">Upload notes, PPTs & manuals</p></div>
          </div>
          <button onClick={()=>setShowUpload(true)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"><Plus className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span></div>
        : resources.length===0 ? (
          <div className="text-center py-20"><Upload className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No Resources</h2><p className="text-sm text-slate-500 mt-1 mb-4">Upload your first resource for students.</p><button onClick={()=>setShowUpload(true)} className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold text-sm">+ Upload Resource</button></div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            {resources.map(r => (
              <div key={r.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl shrink-0">{fileIcons[r.file_type]||'📎'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{r.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{r.subject_name||r.subject_code||'General'} • {r.file_type.toUpperCase()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg animate-slide-up max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-slate-900">Upload Resource</h2><button onClick={()=>setShowUpload(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button></div>
          <div className="flex flex-col gap-3">
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Resource title *" className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-orange-400"/>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description (optional)" rows={2} className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-orange-400 resize-none"/>
            <input value={form.file_url} onChange={e=>setForm({...form,file_url:e.target.value})} placeholder="File URL (Google Drive / Cloud link) *" className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-orange-400"/>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Type</label><select value={form.file_type} onChange={e=>setForm({...form,file_type:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200">{['pdf','ppt','doc','video','image','code','other'].map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Subject Code</label><input value={form.subject_code} onChange={e=>setForm({...form,subject_code:e.target.value})} placeholder="CS304" className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.subject_name} onChange={e=>setForm({...form,subject_name:e.target.value})} placeholder="Subject name" className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200"/>
              <select value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})} className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200">{[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Sem {s}</option>)}</select>
            </div>
            <button onClick={upload} disabled={submitting||!form.title.trim()||!form.file_url.trim()} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-40">{submitting?'Uploading...':'Upload Resource'}</button>
          </div>
        </div>
      </div>}
      <BottomNav/>
    </div>
  );
};
export default FacultyResourceUploader;
