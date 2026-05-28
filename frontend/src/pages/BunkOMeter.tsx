import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  CheckCircle, 
  Clock, 
  FileText, 
  AlertCircle, 
  X, 
  CornerDownRight, 
  Send,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface SubjectSummary {
  student_id: string;
  subject_code: string;
  subject_name: string;
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  on_duty: number;
  leave: number;
  percentage: number;
}

interface AttendanceDiscrepancyType {
  id: string;
  record_id: string;
  student_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  resolution_remarks: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface AttendanceRecordType {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'on_duty' | 'leave';
  method: string;
  marked_at: string;
  remarks: string | null;
  discrepancy_reported: boolean;
  discrepancy: AttendanceDiscrepancyType | null;
  session?: {
    subject_code: string;
    subject_name: string;
    session_date: string;
    period_number: number;
  };
}

const BunkOMeter = () => {
  const navigate = useNavigate();
  
  // Tabs: 'courses' | 'history'
  const [activeTab, setActiveTab] = useState<'courses' | 'history'>('courses');
  
  // Data State
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecordType[]>([]);
  const [discrepancies, setDiscrepancies] = useState<AttendanceDiscrepancyType[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  
  // Load State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Discrepancy Reporting Modal State
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordType | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [bunkResponse, recordsResponse, discrepanciesResponse] = await Promise.all([
        api.get('/attendance/bunk-o-meter'),
        api.get('/attendance/my-records'),
        api.get('/attendance/discrepancies')
      ]);
      
      setSubjects(bunkResponse.data.subjects || []);
      setRecords(recordsResponse.data.records || []);
      setDiscrepancies(discrepanciesResponse.data.discrepancies || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to load attendance tracker data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleReportDiscrepancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !disputeReason.trim()) return;
    
    try {
      setSubmittingDispute(true);
      await api.post('/attendance/discrepancy', {
        record_id: selectedRecord.id,
        reason: disputeReason
      });
      
      triggerToast('Discrepancy request submitted successfully.');
      setDiscrepancyModalOpen(false);
      setDisputeReason('');
      setSelectedRecord(null);
      fetchData();
    } catch (err: any) {
      console.error('Failed to submit dispute:', err);
      alert(err.response?.data?.error || 'Failed to submit dispute request.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Overall calculations
  const actualTotalClasses = subjects.reduce((sum, s) => sum + s.total_classes, 0);
  const actualPresentClasses = subjects.reduce((sum, s) => sum + s.present + s.late + s.on_duty, 0);
  const actualOverallPct = actualTotalClasses > 0 ? (actualPresentClasses / actualTotalClasses) * 100 : 0;
  const roundedOverallPct = Math.round(actualOverallPct * 10) / 10;
  const isSafe = roundedOverallPct >= 75;

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col justify-center items-center font-sans">
        <Loader className="w-10 h-10 text-[#0080c7] animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600 animate-pulse">Synchronizing academic data streams...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans relative pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#22346c] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle className="w-4 h-4 text-[#27bcd1] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VTU Header */}
      <div className="bg-gradient-to-br from-[#22346c] via-[#0080c7] to-[#27bcd1] rounded-b-[40px] px-6 pt-12 pb-24 text-white shadow-lg relative">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-wide">Attendance Tracker</h1>
            <p className="text-xs text-cyan-100 flex items-center gap-1">
              VTU Academic Compliance Check
            </p>
          </div>
        </div>

        {/* Overall Stats Card */}
        <div className="absolute left-6 right-6 bottom-0 translate-y-1/2 bg-white rounded-3xl p-5 shadow-xl border border-slate-100 text-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumulative Attendance</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-black ${isSafe ? 'text-[#22346c]' : 'text-[#a91f23]'}`}>
                  {roundedOverallPct}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">({actualPresentClasses}/{actualTotalClasses} classes)</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                isSafe ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-[#a91f23] border border-red-200'
              }`}>
                {isSafe ? 'COMPLIANT' : 'DEFICIT ALERT'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full mt-4 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                roundedOverallPct >= 85 ? 'bg-emerald-500' : 
                roundedOverallPct >= 75 ? 'bg-[#0080c7]' : 'bg-[#a91f23]'
              }`}
              style={{ width: `${Math.min(roundedOverallPct, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400">
            <span className="text-[#a91f23] tracking-wider">75% MANDATORY THRESHOLD</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-20 mt-2">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex justify-between gap-1">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black capitalize transition-all ${
              activeTab === 'courses' 
                ? 'bg-[#22346c] text-white shadow-md' 
                : 'bg-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Course Attendance
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black capitalize transition-all ${
              activeTab === 'history' 
                ? 'bg-[#22346c] text-white shadow-md' 
                : 'bg-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Disputes Log
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 px-6 mt-6 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 text-[#a91f23] text-xs font-semibold mb-4">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#a91f23]" />
            <p>{error}</p>
          </div>
        )}

        {/* Tab 1: Courses */}
        {activeTab === 'courses' && (
          <div className="flex flex-col gap-3">
            {subjects.map((sub) => {
              const isExpanded = expandedSubject === sub.subject_code;
              const subPct = Math.round(sub.percentage * 10) / 10;
              const isSubSafe = subPct >= 75;

              return (
                <div 
                  key={sub.subject_code}
                  className={`rounded-3xl transition-all duration-300 border ${
                    !isSubSafe 
                      ? 'bg-red-50/50 border-red-200/50' 
                      : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <button 
                    onClick={() => setExpandedSubject(isExpanded ? null : sub.subject_code)}
                    className="w-full text-left p-5 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 leading-snug">{sub.subject_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {sub.subject_code} · {sub.present + sub.late + sub.on_duty}/{sub.total_classes} sessions
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-black ${
                        subPct >= 85 ? 'text-emerald-600' :
                        subPct >= 75 ? 'text-[#0080c7]' : 'text-[#a91f23]'
                      }`}>
                        {subPct}%
                      </span>
                      {isSubSafe ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-[#a91f23] shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Body: Log of classes & disputes */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-dashed border-slate-100">
                      <div className="flex items-center gap-1.5 mb-2 px-1 pt-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance Logs & Raising Disputes</span>
                      </div>

                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                        {records.filter(r => r.session?.subject_code === sub.subject_code).length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic px-2">No attendance logs captured for this course.</p>
                        ) : (
                          records
                            .filter(r => r.session?.subject_code === sub.subject_code)
                            .map((rec) => (
                              <div key={rec.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs shadow-sm">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-800">
                                      Period {rec.session?.period_number}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      {rec.session?.session_date ? new Date(rec.session.session_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : ''}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 mt-0.5 capitalize">Method: {rec.method}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                                    rec.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    rec.status === 'absent' ? 'bg-red-50 text-[#a91f23] border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {rec.status}
                                  </span>

                                  {rec.discrepancy_reported ? (
                                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                                      rec.discrepancy?.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                      rec.discrepancy?.status === 'rejected' ? 'bg-red-50 border-red-200 text-[#a91f23]' : 'bg-amber-50 border-amber-200 text-amber-600'
                                    }`}>
                                      Disputed: {rec.discrepancy?.status || 'pending'}
                                    </span>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setSelectedRecord(rec);
                                        setDiscrepancyModalOpen(true);
                                      }}
                                      className="text-[9px] font-bold text-[#0080c7] hover:text-[#22346c] px-2 py-1 bg-cyan-50 rounded-lg border border-cyan-100"
                                    >
                                      Flag Error
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Disputes Log */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discrepancy History</span>
                <span className="text-[10px] bg-cyan-50 text-[#0080c7] font-black px-2.5 py-0.5 rounded-full border border-cyan-100">
                  {discrepancies.length} disputes raised
                </span>
              </div>

              {discrepancies.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No Disputes Logged</p>
                  <p className="text-[10px] text-slate-400 mt-1">If a teacher incorrectly marked you absent, expand a course under Course Attendance and click 'Flag Error'.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {discrepancies.map((d) => (
                    <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                            d.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            d.status === 'rejected' ? 'bg-red-50 border-red-200 text-[#a91f23]' : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {d.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold ml-2">
                            {new Date(d.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 mt-2">
                        <div className="flex items-start gap-1 font-bold text-slate-800">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>Dispute Reason: {d.reason}</span>
                        </div>
                      </div>

                      {/* Display associated session info */}
                      {(d as any).session && (
                        <div className="mt-3 bg-slate-50 rounded-xl p-3 text-[10px] text-slate-500 border border-slate-100">
                          <p className="font-bold text-slate-600">{(d as any).session.subject_name} ({(d as any).session.subject_code})</p>
                          <p className="mt-0.5 font-medium">Session: {new Date((d as any).session.session_date).toLocaleDateString()} · Period {(d as any).session.period_number}</p>
                          <p className="mt-0.5 font-bold text-[#a91f23]">Marked: {(d as any).current_status?.toUpperCase()}</p>
                        </div>
                      )}

                      {/* Resolution details */}
                      {d.resolution_remarks && (
                        <div className="mt-3 pt-3 border-t border-dashed border-slate-100 text-[10px] text-slate-600">
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 bg-[#0080c7] rounded-full" />
                            Faculty Correction Remarks:
                          </p>
                          <p className="mt-1 italic bg-slate-50 rounded-xl p-2.5 font-medium text-slate-600">"{d.resolution_remarks}"</p>
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

      {/* Discrepancy Reporting Modal */}
      {discrepancyModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end justify-center sm:items-center">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-100 animate-slide-up text-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-900">Report Attendance Discrepancy</h3>
              <button 
                onClick={() => {
                  setDiscrepancyModalOpen(false);
                  setSelectedRecord(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 text-xs">
              <p className="font-bold text-[#22346c]">{selectedRecord.session?.subject_name}</p>
              <p className="text-slate-500 mt-1">Code: {selectedRecord.session?.subject_code} · Period: {selectedRecord.session?.period_number}</p>
              <p className="text-slate-500 mt-0.5">Date: {selectedRecord.session?.session_date ? new Date(selectedRecord.session.session_date).toLocaleDateString() : ''}</p>
              <p className="mt-2 text-[#a91f23] font-bold uppercase">Marked status: {selectedRecord.status}</p>
            </div>

            <form onSubmit={handleReportDiscrepancy}>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Provide Explanation / Evidence
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Detail why this mark is incorrect (e.g. 'I was in class but marked absent by mistake')."
                required
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0080c7] focus:border-[#0080c7] placeholder-slate-400"
              />

              <button
                type="submit"
                disabled={submittingDispute || !disputeReason.trim()}
                className="w-full bg-[#0080c7] hover:bg-[#22346c] disabled:bg-[#0080c7]/40 transition-all text-white font-bold text-xs py-3.5 rounded-2xl mt-5 shadow-lg flex items-center justify-center gap-2"
              >
                {submittingDispute ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Dispute Request</span>
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

export default BunkOMeter;
