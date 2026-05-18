import React, { useState, useRef } from 'react';
import { ChevronLeft, Camera, Upload, FileText, Download, RotateCw, Trash2, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface ScannedDoc { id:string; name:string; imageUrl:string; timestamp:Date; }

const DocumentScanner = () => {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<ScannedDoc[]>([]);
  const [preview, setPreview] = useState<string|null>(null);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState<'none'|'grayscale'|'contrast'|'bw'>('none');

  const filters: {key:typeof filter; label:string; css:string}[] = [
    { key:'none', label:'Original', css:'' },
    { key:'grayscale', label:'Grayscale', css:'grayscale(1)' },
    { key:'contrast', label:'High Contrast', css:'contrast(1.5) brightness(1.1)' },
    { key:'bw', label:'B&W (Scan)', css:'grayscale(1) contrast(2) brightness(1.3)' },
  ];

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setFilter('bw'); // default to scan mode
    };
    reader.readAsDataURL(file);
  };

  const saveDoc = () => {
    if (!preview) return;
    setScanning(true);
    setTimeout(() => {
      const doc: ScannedDoc = {
        id: Date.now().toString(),
        name: `Scan_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}_${docs.length+1}`,
        imageUrl: preview,
        timestamp: new Date(),
      };
      setDocs(prev => [doc, ...prev]);
      setPreview(null);
      setScanning(false);
      setFilter('none');
    }, 1000);
  };

  const downloadDoc = (doc: ScannedDoc) => {
    const link = document.createElement('a');
    link.href = doc.imageUrl;
    link.download = `${doc.name}.png`;
    link.click();
  };

  const deleteDoc = (id: string) => setDocs(prev => prev.filter(d => d.id !== id));

  // Preview mode
  if (preview) return (
    <div className="h-full bg-slate-900 flex flex-col font-sans animate-fade-in relative">
      <div className="p-4 pt-12 flex items-center justify-between">
        <button onClick={()=>{setPreview(null);setFilter('none');}} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white"/></button>
        <h1 className="text-base font-bold text-white">Preview</h1>
        <button onClick={()=>setFilter(f=>f==='none'?'bw':f==='bw'?'grayscale':f==='grayscale'?'contrast':'none')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><RotateCw className="w-4 h-4 text-white"/></button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <img src={preview} alt="Scanned" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain transition-all" style={{filter: filters.find(f=>f.key===filter)?.css || ''}}/>
      </div>
      {/* Filter chips */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{filters.map(f=><button key={f.key} onClick={()=>setFilter(f.key)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${filter===f.key?'bg-white text-slate-900':'bg-white/10 text-white/70'}`}>{f.label}</button>)}</div>
      </div>
      <div className="p-4 pb-6">
        <button onClick={saveDoc} disabled={scanning} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {scanning ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>Processing...</> : <><FileText className="w-4 h-4"/>Save as Document</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Document Scanner</h1><p className="text-xs text-slate-400">Scan notes to digital format</p></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Capture buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button onClick={()=>fileRef.current?.click()} className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[24px] p-6 flex flex-col items-center gap-2 text-white shadow-lg active:scale-95 transition-all">
            <Camera className="w-8 h-8"/>
            <span className="text-xs font-bold">Take Photo</span>
          </button>
          <button onClick={()=>fileRef.current?.click()} className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[24px] p-6 flex flex-col items-center gap-2 text-white shadow-lg active:scale-95 transition-all">
            <Upload className="w-8 h-8"/>
            <span className="text-xs font-bold">Upload Image</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture}/>

        {/* Saved docs */}
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Saved Documents ({docs.length})</h3>
        {docs.length === 0 ? (
          <div className="text-center py-16"><Image className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-sm text-slate-500">No scanned documents yet.</p><p className="text-xs text-slate-400 mt-1">Take a photo or upload an image to scan.</p></div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            {docs.map(doc=>(
              <div key={doc.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden flex">
                <img src={doc.imageUrl} alt={doc.name} className="w-20 h-20 object-cover" style={{filter:'grayscale(1) contrast(2) brightness(1.3)'}}/>
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{doc.timestamp.toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>downloadDoc(doc)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold flex items-center gap-1"><Download className="w-3 h-3"/>Save</button>
                    <button onClick={()=>deleteDoc(doc.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold"><Trash2 className="w-3 h-3"/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );
};
export default DocumentScanner;
