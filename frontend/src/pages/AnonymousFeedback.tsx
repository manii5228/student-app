import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronLeft, CheckCircle2, MessageSquare, Send, Shield, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface FeedbackItem {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  status: string;
  admin_response?: string | null;
  upvotes: number;
  sentiment?: string;
}

const FALLBACK_FEEDBACK: FeedbackItem[] = [
  {
    id: 'fb-1',
    content: 'Add more charging points near the central library reading hall.',
    category: 'facility',
    is_anonymous: true,
    status: 'reviewed',
    admin_response: 'Electrical team has approved two new charging rails for installation.',
    upvotes: 34,
  },
  {
    id: 'fb-2',
    content: 'Extend bus timing by 20 minutes during model exam weeks.',
    category: 'transport',
    is_anonymous: true,
    status: 'open',
    upvotes: 21,
  },
];

const AnonymousFeedback = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(FALLBACK_FEEDBACK);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [sentiment, setSentiment] = useState('neutral');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const { data } = await api.get('/campus/feedback');
        if (Array.isArray(data.feedbacks) && data.feedbacks.length > 0) {
          setFeedbacks(data.feedbacks);
        }
      } catch (error) {
        console.warn('Using offline feedback list:', error);
      }
    };

    fetchFeedback();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newFeedback: FeedbackItem = {
      id: `local-${Date.now()}`,
      content,
      category,
      is_anonymous: isAnonymous,
      status: 'open',
      upvotes: 0,
      sentiment,
    };

    setFeedbacks((current) => [newFeedback, ...current]);
    setSubmitted(true);
    setContent('');
    setSentiment('neutral');

    try {
      await api.post('/campus/feedback', { content, category, is_anonymous: isAnonymous, sentiment });
    } catch (error) {
      console.warn('Saved feedback locally:', error);
    }
  };

  const handleUpvote = (id: string) => {
    setFeedbacks((current) => current.map((item) => (item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item)));
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-[#c9503d] p-6 pt-12 rounded-b-[36px] shadow-md text-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Anonymous Feedback</h1>
            <p className="text-xs text-white/75">Suggestion box for improvements</p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-[28px] p-5 text-slate-900 shadow-xl translate-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#c9503d]/10 text-[#c9503d] flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Privacy Mode</p>
              <h2 className="text-lg font-black">Identity hidden by default</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-14 custom-scrollbar">
        <form onSubmit={handleSubmit} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900">New Suggestion</h2>
            {submitted && (
              <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sent
              </span>
            )}
          </div>

          <textarea
            required
            value={content}
            onChange={(event) => {
              setSubmitted(false);
              setContent(event.target.value);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 h-28 resize-none focus:outline-none focus:border-[#c9503d]"
            placeholder="Write a clear suggestion for campus improvement."
          />

          <div className="mt-4 mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">How are you feeling about this?</p>
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-2">
              {[
                { emoji: '😠', value: 'angry' },
                { emoji: '😕', value: 'confused' },
                { emoji: '😐', value: 'neutral' },
                { emoji: '🙂', value: 'happy' },
                { emoji: '😁', value: 'awesome' },
              ].map(mood => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setSentiment(mood.value)}
                  className={`text-2xl w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                    sentiment === mood.value ? 'bg-white shadow-md scale-110' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'
                  }`}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3 mt-3">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#c9503d]"
            >
              <option value="general">General</option>
              <option value="facility">Facility</option>
              <option value="transport">Transport</option>
              <option value="academics">Academics</option>
              <option value="safety">Safety</option>
            </select>

            <label className="bg-slate-50 border border-slate-200 rounded-2xl px-3 flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(event) => setIsAnonymous(event.target.checked)}
                className="w-4 h-4"
              />
              Hide ID
            </label>
          </div>

          <button type="submit" className="mt-4 w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Submit Feedback
          </button>
        </form>

        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-black text-slate-900">Community Suggestions</h2>
        </div>

        <div className="flex flex-col gap-4">
          {feedbacks.map((item) => (
            <div key={item.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">{item.category}</span>
                <div className="flex items-center gap-2">
                    <span className="text-lg" title={item.sentiment}>{
                        item.sentiment === 'angry' ? '😠' : 
                        item.sentiment === 'confused' ? '😕' : 
                        item.sentiment === 'happy' ? '🙂' : 
                        item.sentiment === 'awesome' ? '😁' : '😐'
                    }</span>
                    <div className="flex gap-1 items-center bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                        {['open', 'reviewed', 'resolved'].map((step, i) => {
                            const currentIdx = ['open', 'reviewed', 'resolved'].indexOf(item.status);
                            return (
                                <div key={step} className={`w-1.5 h-1.5 rounded-full ${i <= currentIdx ? 'bg-[#c9503d]' : 'bg-slate-200'}`} title={step} />
                            );
                        })}
                    </div>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">{item.content}</p>
              {item.admin_response && (
                <div className="mt-3 bg-slate-50 rounded-2xl p-3">
                  <p className="text-[11px] font-black text-slate-400 uppercase mb-1">Admin Response</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{item.admin_response}</p>
                </div>
              )}
              <button onClick={() => handleUpvote(item.id)} className="mt-3 text-xs font-black text-slate-500 flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" /> {item.upvotes}
              </button>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AnonymousFeedback;
