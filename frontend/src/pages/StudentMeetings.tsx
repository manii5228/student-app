import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Mail, ExternalLink, Copy, Check } from 'lucide-react';
import { api } from '../lib/api';

interface Meeting {
  id: string;
  faculty_id: string;
  faculty_name: string;
  faculty_email: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  meet_link: string;
}

const StudentMeetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/academic/meetings/booked');
        setMeetings(data.meetings || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching student booked meetings:", err);
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/academic')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Booked Meetings</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <Calendar className="w-4 h-4" />
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-sm text-slate-500">Loading meetings...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <Calendar className="w-16 h-16 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Booked Meetings</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              You haven't scheduled any advisory or mentoring meetings. Check with your mentors or course coordinators to schedule slots.
            </p>
            <button 
              onClick={() => navigate('/academic/faculty')}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Browse Faculty Directory
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-4 rounded-2xl text-white shadow-sm mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Upcoming Advisory</h2>
              <p className="text-[11px] text-indigo-200 mt-1">
                You have {meetings.length} meeting{meetings.length > 1 ? 's' : ''} scheduled with academic coordinators or advisors.
              </p>
            </div>

            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{meeting.faculty_name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{meeting.faculty_email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                      Confirmed
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(meeting.date).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Time:</span>
                      <span className="font-semibold text-slate-800">{meeting.start_time} - {meeting.end_time}</span>
                    </div>
                    {meeting.purpose && (
                      <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purpose</span>
                        <p className="text-xs text-slate-700">{meeting.purpose}</p>
                      </div>
                    )}
                  </div>

                  {meeting.meet_link && (
                    <div className="flex gap-2">
                      <a 
                        href={meeting.meet_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Join Meet Call
                      </a>
                      <button 
                        onClick={() => handleCopyLink(meeting.id, meeting.meet_link)}
                        className={`px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center
                          ${copiedId === meeting.id ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500'}`}
                        title="Copy Meet Link"
                      >
                        {copiedId === meeting.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMeetings;
