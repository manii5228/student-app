import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, DollarSign, Search, Send, AlertCircle, Filter } from 'lucide-react';

const AdminFeeDefaulters = () => {
  const navigate = useNavigate();
  const [defaulters] = useState([
    { id: 1, name: 'Alex Johnson', roll: 'VTU21CSE001', amount: 45000, type: 'Tuition', due: '2023-08-15' },
    { id: 2, name: 'Sarah Williams', roll: 'VTU21ECE045', amount: 15000, type: 'Hostel', due: '2023-09-01' },
    { id: 3, name: 'Michael Brown', roll: 'VTU20ME112', amount: 5000, type: 'Transport', due: '2023-09-10' },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Fee Defaulters</h1>
      </div>

      <div className="p-6">
        {/* Analytics Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 mb-6 shadow-lg shadow-amber-500/20 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-amber-100 mb-1">Total Outstanding</p>
              <h2 className="text-3xl font-black">₹3.42 Cr</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <button className="flex-1 bg-white text-amber-600 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Warn All
            </button>
            <button className="flex-1 bg-amber-700/50 text-white py-2 rounded-xl text-xs font-bold hover:bg-amber-700/70 transition-colors">
              Export List
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search roll no..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
          </div>
          <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {defaulters.map(d => (
            <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">{d.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{d.roll}</p>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">₹{d.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase">
                  <AlertCircle className="w-3.5 h-3.5" /> Due: {d.due} ({d.type})
                </div>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Remind <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminFeeDefaulters;
