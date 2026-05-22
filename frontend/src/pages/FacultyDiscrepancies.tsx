import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  CheckSquare, 
  XOctagon, 
  AlertCircle, 
  Loader, 
  CheckCircle, 
  MessageSquare,
  Clock,
  User,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface AttendanceDiscrepancyType {
  id: string;
  record_id: string;
  student_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  resolution_remarks: string | null;
  created_at: string;
  resolved_at: string | null;
  current_status?: string;
  student?: {
    full_name: string;
    roll_number: string;
    email: string;
  };
  session?: {
    subject_code: string;
    subject_name: string;
    session_date: string;
    period_number: number;
  };
}

const FacultyDiscrepancies = () => {
  const navigate = useNavigate();
  const [discrepancies, setDiscrepancies] = useState<AttendanceDiscrepancyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Resolve dispute state
  const [selectedDispute, setSelectedDispute] = useState<AttendanceDiscrepancyType | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState<'resolved' | 'rejected' | null>(null);
  const [updatedStatus, setUpdatedStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load discrepancies
  const fetchDiscrepancies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/attendance/discrepancies');
      setDiscrepancies(res.data.discrepancies || []);
    } catch (err: any) {
      console.error('Error fetching discrepancies:', err);
      setError(err.response?.data?.error || 'Failed to load reported disputes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscrepancies();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !actionType || !remarks.trim()) return;

    try {
      setSubmitting(true);
      await api.post(`/attendance/discrepancy/${selectedDispute.id}/resolve`, {
        status: actionType,
        resolution_remarks: remarks,
        updated_status: actionType === 'resolved' ? updatedStatus : undefined
      });

      triggerToast(`Discrepancy successfully ${actionType === 'resolved' ? 'approved' : 'rejected'}.`);
      setSelectedDispute(null);
      setRemarks('');
      setActionType(null);
      fetchDiscrepancies();
    } catch (err: any) {
      console.error('Error resolving dispute:', err);
      alert(err.response?.data?.error || 'Failed to update dispute status.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingDisputes = discrepancies.filter(d => d.status === 'pending');
  const historyDisputes = discrepancies.filter(d => d.status !== 'pending');

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans relative pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-800 animate-slide-up">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 pt-12 shadow-md text-white rounded-b-[40px]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/faculty')} 
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Attendance Disputes</h1>
            <p className="text-xs text-slate-400">Review student attendance discrepancies</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 mt-6 overflow-y-auto">
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-rose-800 text-xs font-semibold mb-4">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-slate-500 animate-spin mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading discrepancies...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Section: Pending */}
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Pending Review ({pendingDisputes.length})
              </h2>

              {pendingDisputes.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center text-slate-400 shadow-sm">
                  <CheckSquare className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">All caught up!</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">No pending attendance disputes to review.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingDisputes.map((d) => (
                    <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {d.student?.full_name} ({d.student?.roll_number})
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Reported: {new Date(d.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Session context */}
                      {d.session && (
                        <div className="bg-slate-50 rounded-xl p-2.5 text-[10px] text-slate-500 border border-slate-100 my-2">
                          <p className="font-bold text-slate-600">{d.session.subject_name} ({d.session.subject_code})</p>
                          <p className="mt-0.5">Date: {new Date(d.session.session_date).toLocaleDateString()} · Period {d.session.period_number}</p>
                          <p className="mt-0.5 font-bold text-rose-500">Current Status: {d.current_status?.toUpperCase()}</p>
                        </div>
                      )}

                      {/* Reason */}
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xs text-slate-700 mb-4">
                        <p className="text-[10px] font-bold text-amber-800 uppercase mb-0.5">Student's Reason</p>
                        <p className="font-medium italic">"{d.reason}"</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDispute(d);
                            setActionType('resolved');
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl shadow-sm shadow-emerald-600/10"
                        >
                          Approve Change
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDispute(d);
                            setActionType('rejected');
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Resolution History */}
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                History ({historyDisputes.length})
              </h2>

              {historyDisputes.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic px-2">No historical disputes found.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {historyDisputes.map((d) => (
                    <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm opacity-80">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{d.student?.full_name} ({d.student?.roll_number})</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                            d.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {d.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{new Date(d.created_at).toLocaleDateString()}</span>
                      </div>

                      {d.session && (
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {d.session.subject_name} ({d.session.subject_code})
                        </p>
                      )}

                      <p className="text-xs text-slate-600 italic mt-2">"{d.reason}"</p>

                      {d.resolution_remarks && (
                        <div className="mt-3 pt-2.5 border-t border-dashed border-slate-100 text-[10px] text-slate-500">
                          <p className="font-bold text-slate-600">Resolution remarks:</p>
                          <p className="mt-0.5 bg-slate-50 rounded-lg p-2 font-medium">{d.resolution_remarks}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Resolution Dialog Modal */}
      {selectedDispute && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end justify-center sm:items-center">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-100 animate-slide-up text-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900 capitalize">
                {actionType === 'resolved' ? 'Approve Dispute' : 'Reject Dispute'}
              </h3>
              <button 
                onClick={() => {
                  setSelectedDispute(null);
                  setActionType(null);
                  setRemarks('');
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <XOctagon className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 text-xs">
              <p className="font-bold text-slate-800">{selectedDispute.student?.full_name}</p>
              <p className="text-slate-500 mt-1">{selectedDispute.session?.subject_name} ({selectedDispute.session?.subject_code})</p>
              <p className="mt-2 font-semibold text-amber-700">Student Claim: "{selectedDispute.reason}"</p>
            </div>

            <form onSubmit={handleResolve}>
              {actionType === 'resolved' && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Update Attendance Status to:
                  </label>
                  <div className="flex gap-2">
                    {(['present', 'late', 'absent'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setUpdatedStatus(status)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                          updatedStatus === status 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Resolution Remarks / Explanation
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionType === 'resolved' 
                    ? "Explain why the status was corrected (e.g. 'Verified student presence in lab roster, corrected to present.')"
                    : "Explain why this request is being rejected."
                }
                required
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />

              <button
                type="submit"
                disabled={submitting || !remarks.trim()}
                className={`w-full text-white font-bold text-xs py-3.5 rounded-2xl mt-5 shadow-lg flex items-center justify-center gap-2 transition-all ${
                  actionType === 'resolved' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                }`}
              >
                {submitting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Submit Resolution</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default FacultyDiscrepancies;
