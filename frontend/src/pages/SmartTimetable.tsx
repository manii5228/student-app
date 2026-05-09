import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Clock, User, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

// Mock timetable data (would come from /api/v1/timetable/my-timetable in production)
const MOCK_TIMETABLE = [
  { id: '1', subject_name: 'Data Structures', subject_code: 'CS301', faculty_name: 'Dr. Ramesh Kumar', room: 'LH-201', start_time: '09:00', end_time: '09:50', period: 1 },
  { id: '2', subject_name: 'Digital Logic', subject_code: 'CS302', faculty_name: 'Prof. Anitha S.', room: 'LH-205', start_time: '10:00', end_time: '10:50', period: 2 },
  { id: '3', subject_name: 'Mathematics III', subject_code: 'MA301', faculty_name: 'Dr. Venkat P.', room: 'LH-101', start_time: '11:00', end_time: '11:50', period: 3 },
  { id: '4', subject_name: 'LUNCH BREAK', subject_code: '', faculty_name: '', room: 'Canteen', start_time: '12:00', end_time: '12:45', period: 0 },
  { id: '5', subject_name: 'Operating Systems', subject_code: 'CS303', faculty_name: 'Dr. Priya R.', room: 'LH-202', start_time: '13:00', end_time: '13:50', period: 4 },
  { id: '6', subject_name: 'DS Lab', subject_code: 'CS301L', faculty_name: 'Dr. Ramesh Kumar', room: 'Lab-3', start_time: '14:00', end_time: '15:50', period: 5 },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SmartTimetable = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() - 1); // 0=Mon
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Live-Pulse Logic: is the current time within a slot?
  const isLive = (start: string, end: string) => {
    const now = currentTime;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return nowMin >= sh * 60 + sm && nowMin <= eh * 60 + em;
  };

  const isUpcoming = (start: string) => {
    const now = currentTime;
    const [sh, sm] = start.split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return sh * 60 + sm > nowMin;
  };

  // Find next class
  const nextClass = MOCK_TIMETABLE.find(slot => slot.period > 0 && isUpcoming(slot.start_time));

  return (
    <div className="min-h-full bg-white flex flex-col font-sans animate-fade-in relative pb-24">

      {/* Header */}
      <div className="bg-indigo-600 rounded-b-[40px] p-6 pt-12">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/academic')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Smart Timetable</h1>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 mt-4">
          {DAYS.map((day, idx) => (
            <button key={day} onClick={() => setSelectedDay(idx)}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                selectedDay === idx 
                  ? 'bg-white text-indigo-700 shadow-lg' 
                  : 'bg-white/15 text-white/80 hover:bg-white/25'
              }`}>
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Next Class Banner */}
      {nextClass && (
        <div className="mx-6 -mt-4 bg-slate-900 rounded-[20px] p-4 flex items-center gap-3 shadow-xl z-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Next Up</p>
            <p className="text-sm font-bold text-white">{nextClass.subject_name}</p>
            <p className="text-xs text-slate-400">{nextClass.start_time} · {nextClass.room}</p>
          </div>
        </div>
      )}

      {/* Timetable Slots */}
      <div className="px-6 pt-6 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {MOCK_TIMETABLE.map((slot) => {
            const live = isLive(slot.start_time, slot.end_time);
            const isBreak = slot.period === 0;

            if (isBreak) {
              return (
                <div key={slot.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{slot.subject_name}</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>
              );
            }

            return (
              <div key={slot.id}
                className={`rounded-[24px] p-5 transition-all ${
                  live 
                    ? 'bg-emerald-50 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10' 
                    : 'bg-slate-50 border-2 border-transparent'
                }`}>

                {/* Live Indicator */}
                {live && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">LIVE NOW</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`text-base font-bold ${live ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {slot.subject_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{slot.subject_code}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${live ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {slot.start_time}
                    </p>
                    <p className="text-xs text-slate-400">{slot.end_time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">{slot.faculty_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">{slot.room}</span>
                  </div>
                </div>

                {/* Navigate to Room button (only when live) */}
                {live && (
                  <button className="mt-4 w-full bg-emerald-600 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md">
                    <MapPin className="w-4 h-4" />
                    Navigate to {slot.room}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SmartTimetable;
