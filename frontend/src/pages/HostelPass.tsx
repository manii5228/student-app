import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Clock, CheckCircle, XCircle, MapPin, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Pass {
  id: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: 'pending' | 'approved' | 'rejected';
  parent_status: 'pending' | 'approved' | 'rejected';
  qr_code_url: string | null;
  created_at: string;
}

const HostelPass = () => {
  const navigate = useNavigate();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [reason, setReason] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // QR Dynamic State
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const [qrTimeLeft, setQrTimeLeft] = useState(30);
  const [qrToken, setQrToken] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchPasses = async () => {
    try {
      const { data } = await api.get('/campus/hostel-pass');
      setPasses(data.passes);
    } catch (err) {
      console.error('Failed to fetch passes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  // QR Code Dynamic Regeneration Timer
  useEffect(() => {
    if (!selectedPassId) {
      setQrTimeLeft(30);
      setQrToken('');
      return;
    }

    const generateToken = () => {
      const stamp = Math.floor(Date.now() / 1000);
      // Dynamic token string to verify at security gate
      const token = `PASS-${selectedPassId}-${stamp}`;
      setQrToken(token);
      setQrTimeLeft(30);
    };

    generateToken();

    const timer = setInterval(() => {
      setQrTimeLeft(prev => {
        if (prev <= 1) {
          generateToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedPassId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !fromDate || !toDate) return;
    
    setIsSubmitting(true);
    try {
      await api.post('/campus/hostel-pass', {
        reason,
        from_date: new Date(fromDate).toISOString(),
        to_date: new Date(toDate).toISOString()
      });
      setShowModal(false);
      setReason('');
      setFromDate('');
      setToDate('');
      fetchPasses(); // Refresh list
    } catch (err) {
      console.error('Failed to request pass:', err);
      alert('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (status === 'rejected') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-app-dark p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const role = JSON.parse(localStorage.getItem('user') || '{}').role;
              if (role === 'faculty') navigate('/faculty');
              else if (role === 'admin') navigate('/admin');
              else navigate(-1);
            }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Hostel Out-Pass</h1>
              <p className="text-xs text-slate-300">Gate Security System</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="w-10 h-10 rounded-full bg-app-accent flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="w-8 h-8 border-4 border-app-accent border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : passes.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No Pass History</h2>
            <p className="text-sm text-slate-500 mt-1">Tap the + button to request a new out-pass.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {passes.map(p => (
              <div key={p.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden animate-slide-up">
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-[16px] border-b border-l flex items-center gap-1.5 text-xs font-bold capitalize ${getStatusColor(p.status)}`}>
                  {getStatusIcon(p.status)} Warden: {p.status}
                </div>
                
                <h3 className="text-base font-bold text-slate-900 pr-32 leading-tight mb-3">{p.reason}</h3>
                
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">From</p>
                    <p className="text-slate-700">{new Date(p.from_date).toLocaleDateString()} {new Date(p.from_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">To</p>
                    <p className="text-slate-700">{new Date(p.to_date).toLocaleDateString()} {new Date(p.to_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>

                {/* Parental Approval Flow */}
                <div className="flex flex-wrap gap-2 items-center mb-4 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Parent Status:</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase flex items-center gap-1 ${getStatusColor(p.parent_status || 'pending')}`}>
                      {getStatusIcon(p.parent_status || 'pending')} {p.parent_status || 'pending'}
                    </span>
                  </div>
                  {(!p.parent_status || p.parent_status === 'pending') && (
                    <button
                      onClick={async () => {
                        setResendingId(p.id);
                        try {
                          await api.post(`/campus/hostel-pass/${p.id}/resend-parent`);
                          alert('Out-pass approval request SMS link resent to parent successfully!');
                        } catch (e) {
                          console.error(e);
                          alert('Failed to resend parent notification');
                        } finally {
                          setResendingId(null);
                        }
                      }}
                      disabled={resendingId === p.id}
                      className="ml-auto text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      {resendingId === p.id ? 'Resending...' : 'Resend SMS'}
                    </button>
                  )}
                </div>

                {p.status === 'approved' && (
                  <button 
                    onClick={() => setSelectedPassId(p.id)}
                    className="w-full bg-slate-900 text-white py-3 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                  >
                    <QrCode className="w-4 h-4" /> Show Gate QR Code
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 pb-10 shadow-2xl animate-slide-up relative flex flex-col">
             <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
               ✕
             </button>
             
             <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Request Pass</h3>
                <p className="text-sm text-slate-500 mt-1">Submit your out-pass request to the warden.</p>
             </div>
             
             <form onSubmit={handleSubmit} className="flex flex-col gap-4">
               <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Reason for Leave</label>
                 <textarea 
                   required
                   value={reason}
                   onChange={e => setReason(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 text-sm text-slate-800 focus:outline-none focus:border-app-accent focus:bg-white transition-all resize-none h-24 font-medium"
                   placeholder="e.g. Going home for family function..."
                 />
               </div>
               
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">From Date/Time</label>
                   <input 
                     type="datetime-local" 
                     required
                     value={fromDate}
                     onChange={e => setFromDate(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-[16px] p-3 text-sm text-slate-800 focus:outline-none focus:border-app-accent focus:bg-white transition-all font-medium"
                   />
                 </div>
                 <div className="flex-1">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">To Date/Time</label>
                   <input 
                     type="datetime-local" 
                     required
                     value={toDate}
                     onChange={e => setToDate(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-[16px] p-3 text-sm text-slate-800 focus:outline-none focus:border-app-accent focus:bg-white transition-all font-medium"
                   />
                 </div>
               </div>

               <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 w-full bg-app-accent text-white py-4 rounded-[20px] text-base font-bold shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Submit Request'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* QR Code Modal (with Dynamic Refreshing) */}
      {selectedPassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in p-6" onClick={() => setSelectedPassId(null)}>
          <div className="bg-white rounded-[32px] p-8 shadow-2xl animate-scale-in flex flex-col items-center max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Gate Pass QR</h2>
            <p className="text-xs font-bold text-slate-500 text-center">Scan this at the main security gate to exit.</p>
            
            <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-100 my-6 relative flex flex-col items-center">
              {qrToken ? (
                <>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}`} alt="Gate Pass QR" className="w-48 h-48" />
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-[10px] font-bold shadow-md">
                    {qrTimeLeft}
                  </div>
                </>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">Generating code...</div>
              )}
            </div>

            <div className="w-full bg-slate-100 rounded-2xl p-3 mb-6 text-center border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Token (Expires every 30s)</p>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1 truncate">{qrToken}</p>
            </div>
            
            <button onClick={() => setSelectedPassId(null)} className="w-full bg-slate-900 text-white py-4 rounded-[20px] text-sm font-bold hover:bg-slate-800 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelPass;
