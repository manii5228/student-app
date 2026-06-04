import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Camera, Upload, FileText, Download, RotateCw, Trash2, Image, Plus, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface ScannedDoc {
  id: string;
  name: string;
  download_url: string;
  created_at: string;
  images?: string[];
}

const DocumentScanner = () => {
  const nav = useNavigate();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<ScannedDoc[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [scanning, setScanning] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [filter, setFilter] = useState<'none'|'grayscale'|'contrast'|'bw'>('bw');
  const [secondsLeftMap, setSecondsLeftMap] = useState<Record<string, number>>({});

  const filters: {key:typeof filter; label:string; css:string}[] = [
    { key:'none', label:'Original', css:'' },
    { key:'grayscale', label:'Grayscale', css:'grayscale(1)' },
    { key:'contrast', label:'High Contrast', css:'contrast(1.5) brightness(1.1)' },
    { key:'bw', label:'B&W (Scan)', css:'grayscale(1) contrast(2) brightness(1.3)' },
  ];

  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const { data } = await api.get('/campus/documents/scan');
      setDocs(data.documents || []);
    } catch (e) {
      console.error("Failed to load documents:", e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 10000); // refresh list every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateCountdowns = () => {
      const newMap: Record<string, number> = {};
      docs.forEach(doc => {
        const elapsedMs = Date.now() - new Date(doc.created_at).getTime();
        const secondsLeft = 300 - Math.floor(elapsedMs / 1000); // 5 minutes is 300 seconds
        newMap[doc.id] = Math.max(0, secondsLeft);
      });
      setSecondsLeftMap(newMap);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [docs]);

  const handleCaptureCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPreviews(prev => [...prev, base64]);
      setCurrentIdx(previews.length);
      setFilter('bw');
    };
    reader.readAsDataURL(file);
    if (cameraRef.current) cameraRef.current.value = '';
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews: string[] = [];
    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      newPreviews.push(base64);
    }

    setPreviews(prev => [...prev, ...newPreviews]);
    setCurrentIdx(previews.length);
    setFilter('bw');
    if (galleryRef.current) galleryRef.current.value = '';
  };

  const removePreviewPage = (idxToRemove: number) => {
    const updated = previews.filter((_, idx) => idx !== idxToRemove);
    setPreviews(updated);
    if (currentIdx >= updated.length) {
      setCurrentIdx(Math.max(0, updated.length - 1));
    }
  };

  const saveDoc = async () => {
    if (previews.length === 0) return;
    setScanning(true);
    try {
      const docName = `Scan_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}_${docs.length+1}`;
      await api.post('/campus/documents/scan', {
        name: docName,
        images: previews,
      });
      setPreviews([]);
      setCurrentIdx(0);
      setFilter('none');
      fetchDocs();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to compile and save PDF.");
    } finally {
      setScanning(false);
    }
  };

  const downloadDoc = (doc: ScannedDoc) => {
    if (doc.download_url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.download_url;
      link.download = `${doc.name}.png`;
      link.click();
    } else {
      const connectionMode = localStorage.getItem('connection_mode') || 'mock';
      if (connectionMode === 'mock') {
        const link = document.createElement('a');
        link.href = doc.images && doc.images.length > 0 ? doc.images[0] : '';
        link.download = `${doc.name}.png`;
        link.click();
      } else {
        const baseUrl = api.defaults.baseURL || '';
        const endpoint = doc.download_url.replace(/^\/api/, '');
        const downloadUrl = `${baseUrl}${endpoint}`;
        window.open(downloadUrl, '_blank');
      }
    }
  };

  const deleteDoc = async (id: string) => {
    try {
      await api.delete(`/campus/documents/scan/${id}`);
      fetchDocs();
    } catch (err) {
      setDocs(prev => prev.filter(d => d.id !== id));
    }
  };

  const formatTimeLeft = (seconds: number) => {
    if (seconds === undefined) return "Calculating...";
    if (seconds <= 0) return "Expired";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Preview mode
  if (previews.length > 0) return (
    <div className="h-full bg-slate-950 flex flex-col font-sans animate-fade-in relative text-white">
      <div className="p-4 pt-12 flex items-center justify-between z-10">
        <button onClick={()=>{setPreviews([]);setFilter('none');}} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white"/></button>
        <h1 className="text-sm font-black uppercase tracking-wider text-slate-400">Scanned Document ({previews.length} Pages)</h1>
        <button onClick={()=>setFilter(f=>f==='none'?'bw':f==='bw'?'grayscale':f==='grayscale'?'contrast':'none')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><RotateCw className="w-4 h-4 text-white"/></button>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        <img 
          src={previews[currentIdx]} 
          alt={`Page ${currentIdx+1}`} 
          className="max-w-full max-h-[60vh] rounded-2xl shadow-2xl object-contain transition-all" 
          style={{filter: filters.find(f=>f.key===filter)?.css || ''}}
        />
        <div className="absolute top-6 left-6 bg-slate-900/80 px-3 py-1 rounded-full text-xs font-bold border border-white/10">
          Page {currentIdx + 1} / {previews.length}
        </div>
      </div>

      {/* Filters Strip */}
      <div className="px-5 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {filters.map(f => (
            <button 
              key={f.key} 
              onClick={()=>setFilter(f.key)} 
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${filter===f.key?'bg-white text-slate-950 shadow-md':'bg-white/10 text-white/70'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Pages Strip & Add Page options */}
      <div className="px-5 py-3 border-t border-white/10 bg-slate-900/40">
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Pages List</p>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar items-center">
          {previews.map((img, idx) => (
            <div key={idx} className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all ${idx === currentIdx ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20' : 'border-white/15'}`}>
              <img 
                src={img} 
                alt={`Thumbnail ${idx+1}`} 
                onClick={() => setCurrentIdx(idx)} 
                className="w-16 h-16 object-cover cursor-pointer"
              />
              <button 
                onClick={(e) => { e.stopPropagation(); removePreviewPage(idx); }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add Page Buttons */}
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => cameraRef.current?.click()} 
              className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4"/>
              <span className="text-[8px] font-bold mt-1">Photo</span>
            </button>
            <button 
              onClick={() => galleryRef.current?.click()} 
              className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4"/>
              <span className="text-[8px] font-bold mt-1">Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 pb-8 bg-slate-950">
        <button onClick={saveDoc} disabled={scanning} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform">
          {scanning ? <><Loader2 className="w-4 h-4 animate-spin"/>Compiling PDF...</> : <><FileText className="w-4 h-4"/>Compile & Save Document</>}
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
          <div>
            <h1 className="text-xl font-bold text-white">Document Scanner</h1>
            <p className="text-xs text-slate-400">Scan notes & handouts to PDF</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Capture modes */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={()=>cameraRef.current?.click()} className="bg-gradient-to-br from-blue-500 to-indigo-650 rounded-[28px] p-6 flex flex-col items-center justify-center gap-3 text-white shadow-md active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Camera className="w-6 h-6"/>
            </div>
            <span className="text-xs font-black uppercase tracking-wider">Take Photo</span>
          </button>
          
          <button onClick={()=>galleryRef.current?.click()} className="bg-gradient-to-br from-emerald-500 to-teal-650 rounded-[28px] p-6 flex flex-col items-center justify-center gap-3 text-white shadow-md active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Upload className="w-6 h-6"/>
            </div>
            <span className="text-xs font-black uppercase tracking-wider">Upload Image</span>
          </button>
        </div>

        {/* Hidden inputs */}
        {/* Camera input forces capture="environment" to launch camera application */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCaptureCamera}/>
        {/* Gallery input does NOT include capture attribute so it opens the photo library, and supports multiple selection */}
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadGallery}/>

        {/* Saved docs */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanned Handouts ({docs.length})</h3>
          {loadingDocs && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
            <Image className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
            <h4 className="text-sm font-bold text-slate-700">No PDFs Compiled</h4>
            <p className="text-xs text-slate-400 mt-1">Take photos or upload images from gallery to generate dynamic multi-page PDFs.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 animate-slide-up">
            {docs.map(doc => {
              const secondsLeft = secondsLeftMap[doc.id];
              const isExpired = secondsLeft <= 0;

              return (
                <div key={doc.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-[#0080c7]">
                    <FileText className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate leading-tight">{doc.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}
                    </p>
                    {/* Expiration warning tag */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500' : 'bg-amber-500 animate-ping'}`} />
                      <span className={`text-[9px] font-bold ${isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                        {isExpired ? 'Deleted from server' : `Expires in: ${formatTimeLeft(secondsLeft)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0 z-10">
                    <button 
                      onClick={() => downloadDoc(doc)} 
                      disabled={isExpired}
                      className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Download className="w-4 h-4"/>
                    </button>
                    <button 
                      onClick={() => deleteDoc(doc.id)} 
                      className="w-9 h-9 bg-red-50 text-red-650 rounded-xl flex items-center justify-center hover:bg-red-100 active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );
};

export default DocumentScanner;
