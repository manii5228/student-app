import React, { useState, useEffect } from 'react';
import { ChevronLeft, BarChart3, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface PollT { id:string; title:string; description:string|null; options:string[]; total_votes:number; user_voted:boolean; user_vote_index:number|null; vote_counts:number[]; }

const PollsSurveys = () => {
  const nav = useNavigate();
  const [polls, setPolls] = useState<PollT[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string|null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const {data}=await api.get('/utility/polls'); setPolls(data.polls||[]); } catch{} setLoading(false); };

  const vote = async (pid:string, optIdx:number) => {
    setVoting(pid);
    try { await api.post(`/utility/polls/${pid}/vote`, { option_index:optIdx }); load(); } catch{}
    setVoting(null);
  };

  const pct = (count:number, total:number) => total ? Math.round(count/total*100) : 0;

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Polls & Surveys</h1><p className="text-xs text-indigo-200">Vote and see results</p></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span></div>
        : polls.length===0 ? (
          <div className="text-center py-20"><BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No Active Polls</h2><p className="text-sm text-slate-500 mt-1">Polls will appear here when faculty or admin create them.</p></div>
        ) : (
          <div className="flex flex-col gap-4 animate-slide-up">
            {polls.map(poll=>(
              <div key={poll.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">{poll.title}</h3>
                {poll.description && <p className="text-xs text-slate-500 mt-1">{poll.description}</p>}
                <p className="text-[10px] font-bold text-slate-400 mt-2">{poll.total_votes} vote{poll.total_votes!==1?'s':''}</p>

                <div className="flex flex-col gap-2 mt-3">
                  {poll.options.map((opt, idx) => {
                    const votePct = pct(poll.vote_counts[idx]||0, poll.total_votes);
                    const isMyVote = poll.user_vote_index === idx;
                    return poll.user_voted ? (
                      /* Results view */
                      <div key={idx} className={`relative rounded-2xl overflow-hidden border-2 ${isMyVote?'border-indigo-400':'border-slate-100'}`}>
                        <div className="absolute inset-0 bg-indigo-50 transition-all" style={{width:`${votePct}%`}}></div>
                        <div className="relative flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isMyVote && <CheckCircle className="w-4 h-4 text-indigo-600"/>}
                            <span className={`text-xs font-medium ${isMyVote?'text-indigo-700':'text-slate-700'}`}>{opt}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{votePct}%</span>
                        </div>
                      </div>
                    ) : (
                      /* Voting view */
                      <button key={idx} onClick={()=>vote(poll.id, idx)} disabled={voting===poll.id}
                        className="w-full px-4 py-3 rounded-2xl text-left text-xs font-medium border-2 border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all active:scale-[0.98] disabled:opacity-50">
                        {opt}
                      </button>
                    );
                  })}
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
export default PollsSurveys;
