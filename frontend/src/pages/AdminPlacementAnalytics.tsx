import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Users, CheckCircle, Target } from 'lucide-react';

const AdminPlacementAnalytics = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Placement Analytics</h1>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Overall Placement Rate</h2>
          <div className="flex items-end gap-4">
            <span className="text-5xl font-black text-green-500">84%</span>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-bold mb-2">
              <TrendingUp className="w-3 h-3" /> +12% from last year
            </div>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full mt-6 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full w-[84%]"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">1,250</p>
            <p className="text-xs font-medium text-slate-500 uppercase">Eligible Students</p>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">1,050</p>
            <p className="text-xs font-medium text-slate-500 uppercase">Placed Students</p>
          </div>
          <div className="col-span-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-indigo-100 mb-1">Highest Package</p>
              <h3 className="text-3xl font-black">42 LPA</h3>
            </div>
            <Target className="w-12 h-12 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPlacementAnalytics;
