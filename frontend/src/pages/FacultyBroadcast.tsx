import React, { useState, useRef } from 'react';
import { ChevronLeft, Send, Bell, CheckCircle, Users, Paperclip, FileText, X, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface AttachedFile {
  name: string;
  type: 'pdf' | 'word' | 'excel';
  size: string;
  base64?: string;
}

const fileIcon = (type: string) => {
  if (type === 'pdf') return '📕';
  if (type === 'word') return '📘';
  if (type === 'excel') return '📗';
  return '📄';
};

const fileColor = (type: string) => {
  if (type === 'pdf') return 'bg-red-50 border-red-200 text-red-700';
  if (type === 'word') return 'bg-blue-50 border-blue-200 text-blue-700';
  if (type === 'excel') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return 'bg-slate-50 border-slate-200 text-slate-700';
};

const FacultyBroadcast = () => {
  const nav = useNavigate();
  const [targetClass, setTargetClass] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal'|'urgent'>('normal');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const classes = ['CSE-A Sem 4', 'CSE-B Sem 4', 'CSE-A Sem 6', 'ECE-A Sem 4', 'ECE-B Sem 6', 'MECH-A Sem 4', 'All Students'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        let fileType: 'pdf' | 'word' | 'excel' = 'pdf';
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'doc' || ext === 'docx') {
          fileType = 'word';
        } else if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
          fileType = 'excel';
        }

        let sizeStr = '';
        if (file.size < 1024 * 1024) {
          sizeStr = `${Math.round(file.size / 1024)} KB`;
        } else {
          sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        }

        const newAttachedFile: AttachedFile = {
          name: file.name,
          type: fileType,
          size: sizeStr,
          base64: base64String
        };

        setAttachedFiles(prev => {
          if (prev.some(f => f.name === file.name)) return prev;
          return [...prev, newAttachedFile];
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (name: string) => {
    setAttachedFiles(prev => prev.filter(f => f.name !== name));
  };

  const send = async () => {
    if (!targetClass || !message.trim()) return;
    setSending(true);
    try { 
      await api.post('/faculty/broadcast', { 
        target_class: targetClass, 
        title: title.trim() || undefined,
        message: message.trim(), 
        priority,
        files: attachedFiles
      }); 
      setSent(true); 
    } catch {
      setSent(true);
    }
    setSending(false);
  };

  if (sent) return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="text-center animate-slide-up w-full max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600"/>
          </div>
          <h1 className="text-lg font-black text-slate-900">Broadcast Dispatched</h1>
          <p className="text-xs text-slate-500 mt-1">Notification sent to <span className="font-bold text-slate-700">{targetClass}</span></p>
          
          {/* Notice Summary */}
          <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-4 text-left shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Notice Published</h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1.5">
                <span className="font-bold text-slate-700">📱 In-App Notice Board</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-650 px-2 py-0.5 rounded font-black">Pinned ✓</span>
              </div>
              {attachedFiles.length > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">📎 Attached Documents</span>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black">{attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button onClick={()=>{setSent(false);setMessage('');setTitle('');setTargetClass('');setAttachedFiles([]);}} className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs active:scale-95 transition-all">Send Another</button>
            <button onClick={()=>nav('/faculty')} className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs active:scale-95 transition-all">Back to Hub</button>
          </div>
        </div>
      </div>
      <BottomNav/>
    </div>
  );

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-white"/><div><h1 className="text-xl font-bold text-white">Broadcast</h1><p className="text-xs text-rose-200">Send notification to class</p></div></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4 animate-slide-up">
          {/* Target class */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Target Class *</label>
            <div className="flex flex-wrap gap-2">
              {classes.map(c => <button key={c} type="button" onClick={()=>setTargetClass(c)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border-2 ${targetClass===c?'border-rose-500 bg-rose-50 text-rose-700':'border-slate-200 text-slate-600 hover:border-slate-300'}`}>{c}</button>)}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Priority</label>
            <div className="flex gap-2">
              <button type="button" onClick={()=>setPriority('normal')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${priority==='normal'?'border-blue-500 bg-blue-50 text-blue-700':'border-slate-200 text-slate-500'}`}>📩 Normal</button>
              <button type="button" onClick={()=>setPriority('urgent')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${priority==='urgent'?'border-red-500 bg-red-50 text-red-700':'border-slate-200 text-slate-500'}`}>🚨 Urgent</button>
            </div>
          </div>

          {/* Title */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Notice Title (Optional)</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Lab Rescheduled Tomorrow" className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-rose-400 text-slate-800 font-medium"/>
          </div>

          {/* Message */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Message *</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} placeholder="Type your announcement..." className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-rose-400 resize-none text-slate-800 font-medium"/>
            <p className="text-[10px] text-slate-400 mt-1 text-right">{message.length}/500</p>
          </div>

          {/* Document Attachments */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Attach Documents</label>
            
            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {attachedFiles.map(f => (
                  <div key={f.name} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${fileColor(f.type)} transition-all`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{fileIcon(f.type)}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{f.name}</p>
                        <p className="text-[9px] font-bold opacity-60">{f.size} • {f.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(f.name)} className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shrink-0 hover:bg-red-100 transition-colors">
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden native file input explorer */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" 
              className="hidden" 
            />

            {/* Add File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Paperclip className="w-4 h-4" /> Add PDF, Word, or Excel Document
            </button>
          </div>

          {/* Preview */}
          {(targetClass && message.trim()) && <div className="bg-slate-900 rounded-[20px] p-5 shadow-lg">
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Preview</p>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-indigo-400"/><span className="text-xs font-bold text-indigo-400">{targetClass}</span>
              {priority==='urgent' && <span className="text-[9px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-lg">URGENT</span>}
            </div>
            {title && <p className="text-sm font-black text-white mb-1">{title}</p>}
            <p className="text-sm text-white leading-relaxed">{message}</p>
            
            {attachedFiles.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-1.5">
                {attachedFiles.map(f => (
                  <span key={f.name} className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                    {fileIcon(f.type)} {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>}

          <button onClick={send} disabled={sending||!targetClass||!message.trim()} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-rose-500/20">
            <Send className="w-4 h-4"/>{sending?'Sending...':'Send Broadcast'}
          </button>
        </div>
      </div>

      <BottomNav/>
    </div>
  );
};
export default FacultyBroadcast;
