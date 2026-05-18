import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, X, ShoppingBag, Tag, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Listing { id:string; seller_id:string; title:string; description:string|null; price:number; category:string; condition:string; is_sold:boolean; }

const BuySell = () => {
  const nav = useNavigate();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', price:'', category:'books', condition:'good' });
  const [submitting, setSubmitting] = useState(false);

  const cats = ['books','electronics','notes','lab_equipment','clothing','other'];

  useEffect(() => { load(); }, [catFilter]);
  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (catFilter) params.category = catFilter;
      const {data} = await api.get('/utility/marketplace', { params });
      setItems(data.listings||[]);
    } catch{}
    setLoading(false);
  };

  const post = async () => {
    if(!form.title.trim()||!form.price) return;
    setSubmitting(true);
    try { await api.post('/utility/marketplace', { ...form, price:parseFloat(form.price) }); setShowAdd(false); setForm({title:'',description:'',price:'',category:'books',condition:'good'}); load(); } catch{}
    setSubmitting(false);
  };

  const markSold = async (id:string) => { try { await api.post(`/utility/marketplace/${id}/sold`); load(); } catch{} };

  const condColors:Record<string,string> = { excellent:'bg-emerald-100 text-emerald-700', good:'bg-blue-100 text-blue-700', fair:'bg-amber-100 text-amber-700', poor:'bg-red-100 text-red-600' };
  const catIcons:Record<string,string> = { books:'📚', electronics:'💻', notes:'📝', lab_equipment:'🔬', clothing:'👕', other:'📦' };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
            <div><h1 className="text-xl font-bold text-white">Buy & Sell</h1><p className="text-xs text-amber-100">Campus marketplace</p></div>
          </div>
          <button onClick={()=>setShowAdd(true)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"><Plus className="w-5 h-5"/></button>
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={()=>setCatFilter('')} className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${!catFilter?'bg-amber-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}>All</button>
          {cats.map(c=><button key={c} onClick={()=>setCatFilter(c)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all ${catFilter===c?'bg-amber-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}>{catIcons[c]||'📦'} {c.replace('_',' ')}</button>)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span></div>
        : items.length===0 ? (
          <div className="text-center py-20"><ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="text-lg font-bold text-slate-900">No Listings</h2><p className="text-sm text-slate-500 mt-1 mb-4">Be the first to sell something!</p><button onClick={()=>setShowAdd(true)} className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold text-sm">+ Post Listing</button></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            {items.map(item=>(
              <div key={item.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 h-28 flex items-center justify-center text-4xl">{catIcons[item.category]||'📦'}</div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">{item.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded capitalize ${condColors[item.condition]||'bg-slate-100 text-slate-500'}`}>{item.condition}</span>
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">₹{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg animate-slide-up">
          <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-slate-900">Sell Item</h2><button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button></div>
          <div className="flex flex-col gap-3">
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="What are you selling? *" className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-amber-400"/>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description (optional)" rows={2} className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-amber-400 resize-none"/>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Price (₹) *</label><input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="250" className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-amber-400"/></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:border-amber-400">{cats.map(c=><option key={c} value={c}>{c.replace('_',' ')}</option>)}</select></div>
            </div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Condition</label><div className="flex gap-2">{['excellent','good','fair','poor'].map(c=><button key={c} onClick={()=>setForm({...form,condition:c})} className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border-2 transition-all ${form.condition===c?'border-amber-500 bg-amber-50 text-amber-700':'border-slate-200 text-slate-500'}`}>{c}</button>)}</div></div>
            <button onClick={post} disabled={submitting||!form.title.trim()||!form.price} className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-amber-700 active:scale-[0.98] transition-all disabled:opacity-40">{submitting?'Posting...':'Post Listing'}</button>
          </div>
        </div>
      </div>}
      <BottomNav/>
    </div>
  );
};
export default BuySell;
