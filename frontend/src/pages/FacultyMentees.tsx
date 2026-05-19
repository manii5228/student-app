import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, UserCheck, Phone, Mail, BarChart3, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Mentee { id:string; name?:string; first_name?:string; last_name?:string; email:string; roll_number?:string; register_number?:string; department?:string; semester?:number; attendance_pct?:number; total_classes?:number; phone?:string; }

const FacultyMentees = () => {
  const nav = useNavigate();
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list'|'performance'>('list');
  const [selectedMentee, setSelectedMentee] = useState<Mentee|null>(null);

  useEffect(() => { loadMentees(); }, []);

  const loadMentees = async () => {
    try {
      const {data} = await api.get('/faculty/mentees');
      setMentees(data.mentees || []);
    } catch {
      // Demo data when API not connected
      setMentees([
        { id:'1', name:'Arun Kumar', email:'arun@vel.ac.in', roll_number:'21CSE101', department:'CSE', semester:4, attendance_pct:87, total_classes:120 },
        { id:'2', name:'Priya Sharma', email:'priya@vel.ac.in', roll_number:'21CSE102', department:'CSE', semester:4, attendance_pct:92, total_classes:120 },
        { id:'3', name:'Rahul Verma', email:'rahul@vel.ac.in', roll_number:'21CSE103', department:'CSE', semester:4, attendance_pct:65, total_classes:120 },
        { id:'4', name:'Sneha Patel', email:'sneha@vel.ac.in', roll_number:'21CSE104', department:'CSE', semester:4, attendance_pct:78, total_classes:120 },
        { id:'5', name:'Vikram Singh', email:'vikram@vel.ac.in', roll_number:'21CSE105', department:'CSE', semester:4, attendance_pct:94, total_classes:120 },
        { id:'6', name:'Divya Nair', email:'divya@vel.ac.in', roll_number:'21CSE106', department:'CSE', semester:4, attendance_pct:55, total_classes:120 },
        { id:'7', name:'Karthik R', email:'karthik@vel.ac.in', roll_number:'21CSE107', department:'CSE', semester:4, attendance_pct:88, total_classes:120 },
        { id:'8', name:'Meena Devi', email:'meena@vel.ac.in', roll_number:'21CSE108', department:'CSE', semester:4, attendance_pct:91, total_classes:120 },
      ]);
    }
    setLoading(false);
  };

  const getMenteeName = (m:Mentee) => m.name || `${m.first_name||''} ${m.last_name||''}`.trim() || m.email;
  const getRoll = (m:Mentee) => m.roll_number || m.register_number || '-';
  const filtered = mentees.filter(m => {
    const name = getMenteeName(m).toLowerCase();
    const roll = getRoll(m).toLowerCase();
    return name.includes(search.toLowerCase()) || roll.includes(search.toLowerCase());
  });

  const attendanceColor = (pct:number) => pct>=85?'text-emerald-600':pct>=75?'text-amber-600':'text-red-600';
  const attendanceBg = (pct:number) => pct>=85?'bg-emerald-500':pct>=75?'bg-amber-500':'bg-red-500';
  const lowAttendance = mentees.filter(m=>(m.attendance_pct||100)<75);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">My Mentees</h1><p className="text-xs text-violet-200">{mentees.length} students assigned</p></div>
        </div>
        <div className="flex gap-3 mt-4 relative z-10">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center"><p className="text-lg font-black text-white">{mentees.length}</p><p className="text-[9px] font-bold text-violet-200 uppercase">Total</p></div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center"><p className="text-lg font-black text-emerald-300">{mentees.filter(m=>(m.attendance_pct||0)>=85).length}</p><p className="text-[9px] font-bold text-violet-200 uppercase">Good</p></div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center"><p className="text-lg font-black text-red-300">{lowAttendance.length}</p><p className="text-[9px] font-bold text-violet-200 uppercase">At Risk</p></div>
        </div>
      </div>

      {/* Search & view toggle */}
      <div className="px-4 mt-4 flex gap-2">
        <div className="flex-1 relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or roll..." className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-violet-400"/></div>
        <button onClick={()=>setView(v=>v==='list'?'performance':'list')} className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${view==='performance'?'bg-violet-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}><BarChart3 className="w-4 h-4"/></button>
      </div>

      {/* At-risk alert */}
      {lowAttendance.length > 0 && <div className="mx-4 mt-3 bg-red-50 rounded-xl p-3 border border-red-200 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600 shrink-0"/><p className="text-xs font-medium text-red-700">{lowAttendance.length} mentee{lowAttendance.length>1?'s':''} below 75% attendance</p></div>}

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></span></div>
        : filtered.length===0 ? <div className="text-center py-20"><UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No mentees found</h2></div>
        : <div className="flex flex-col gap-2.5 animate-slide-up">
          {filtered.map(m => (
            <button key={m.id} onClick={()=>setSelectedMentee(m)}
              className="bg-white rounded-[20px] p-4 flex items-center gap-3 shadow-sm border border-slate-100 hover:shadow-md active:scale-[0.98] transition-all text-left w-full">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{getMenteeName(m).charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{getMenteeName(m)}</h3>
                  {(m.attendance_pct||100)<75 && <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded shrink-0">AT RISK</span>}
                </div>
                <p className="text-[11px] text-slate-500">{getRoll(m)} • {m.department} Sem {m.semester}</p>
              </div>
              {view==='performance' && m.attendance_pct!==undefined && (
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black ${attendanceColor(m.attendance_pct)}`}>{m.attendance_pct}%</p>
                  <p className="text-[9px] text-slate-400">Attendance</p>
                </div>
              )}
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0"/>
            </button>
          ))}
        </div>}
      </div>

      {/* Mentee detail modal */}
      {selectedMentee && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={()=>setSelectedMentee(null)}>
        <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg animate-slide-up" onClick={e=>e.stopPropagation()}>
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">{getMenteeName(selectedMentee).charAt(0)}</div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{getMenteeName(selectedMentee)}</h2>
              <p className="text-xs text-slate-500">{getRoll(selectedMentee)} • {selectedMentee.department}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center"><p className={`text-xl font-black ${attendanceColor(selectedMentee.attendance_pct||0)}`}>{selectedMentee.attendance_pct||0}%</p><p className="text-[9px] font-bold text-slate-400 uppercase">Attendance</p></div>
            <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-xl font-black text-slate-900">Sem {selectedMentee.semester}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Semester</p></div>
          </div>
          {selectedMentee.attendance_pct !== undefined && <div className="mb-4"><div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${attendanceBg(selectedMentee.attendance_pct)} rounded-full transition-all`} style={{width:`${selectedMentee.attendance_pct}%`}}></div></div></div>}
          <div className="flex gap-2">
            <a href={`mailto:${selectedMentee.email}`} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><Mail className="w-3.5 h-3.5"/>Email</a>
            <a href={`tel:${selectedMentee.phone||''}`} className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5"/>Call</a>
          </div>
        </div>
      </div>}
      <BottomNav/>
    </div>
  );
};
export default FacultyMentees;
