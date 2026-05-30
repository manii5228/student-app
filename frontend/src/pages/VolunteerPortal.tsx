import { useState } from 'react';
import type { FormEvent } from 'react';
import { BadgeCheck, ChevronLeft, ClipboardCheck, Headphones, Megaphone, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const COMMITTEES = [
  { id: 'stage', name: 'Stage Crew', icon: Headphones, slots: 12, color: 'bg-[#0080c7]/10 text-[#0080c7]' },
  { id: 'media', name: 'Media Desk', icon: Megaphone, slots: 8, color: 'bg-[#c9503d]/10 text-[#c9503d]' },
  { id: 'hospitality', name: 'Hospitality', icon: Users, slots: 15, color: 'bg-[#27bcd1]/15 text-[#0080c7]' },
  { id: 'security', name: 'Crowd Control', icon: ShieldCheck, slots: 18, color: 'bg-emerald-100 text-emerald-700' },
];

const VolunteerPortal = () => {
  const navigate = useNavigate();
  const [committee, setCommittee] = useState(COMMITTEES[0].id);
  const [shift, setShift] = useState('morning');
  const [submitted, setSubmitted] = useState(() => {
    return localStorage.getItem('volunteer_submitted') === 'true';
  });

  const selectedCommittee = COMMITTEES.find((item) => item.id === committee) ?? COMMITTEES[0];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    localStorage.setItem('volunteer_submitted', 'true');
    localStorage.setItem('volunteer_committee', committee);
    localStorage.setItem('volunteer_shift', shift);
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-[#22346c] p-6 pt-12 rounded-b-[36px] shadow-md text-white">
        <div className="flex items-center gap-3">
          <button onClick={() => {
            const role = JSON.parse(localStorage.getItem('user') || '{}').role;
            if (role === 'faculty') navigate('/faculty');
            else if (role === 'admin') navigate('/admin');
            else navigate('/campus/events');
          }} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Volunteer Portal</h1>
            <p className="text-xs text-white/70">Apply for organizing committees</p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-[28px] p-5 text-slate-900 shadow-xl translate-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Open Roles</p>
              <h2 className="text-3xl font-black">{COMMITTEES.reduce((total, item) => total + item.slots, 0)}</h2>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#27bcd1]/15 text-[#0080c7] flex items-center justify-center">
              <ClipboardCheck className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-14 custom-scrollbar">
        {submitted ? (
          <div className="bg-white rounded-[30px] p-7 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
              <BadgeCheck className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Application Sent</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Your {selectedCommittee.name} request is queued for the student coordinator. The decision card will appear here after review.
            </p>
            <button onClick={() => setSubmitted(false)} className="mt-6 w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-black">
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-black text-slate-900 mb-3">Choose Committee</h2>
              <div className="grid grid-cols-2 gap-3">
                {COMMITTEES.map((item) => {
                  const Icon = item.icon;
                  const isActive = committee === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setCommittee(item.id)}
                      className={`bg-white rounded-[24px] p-4 text-left border shadow-sm transition-all ${
                        isActive ? 'border-[#0080c7] ring-2 ring-[#0080c7]/15' : 'border-slate-100'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900">{item.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-1">{item.slots} slots left</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-900 mb-4">Application Details</h2>
              <div className="flex flex-col gap-4">
                <select
                  value={shift}
                  onChange={(event) => setShift(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#0080c7]"
                >
                  <option value="morning">Morning Shift</option>
                  <option value="afternoon">Afternoon Shift</option>
                  <option value="evening">Evening Shift</option>
                  <option value="full-day">Full Day</option>
                </select>
                <textarea
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 h-28 resize-none focus:outline-none focus:border-[#0080c7]"
                  placeholder="Mention prior event experience or the role you want to handle."
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-[#0080c7] text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-blue-500/20">
              Apply for {shift.replace('-', ' ')}
            </button>
          </form>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default VolunteerPortal;
