
import React from 'react';
import { getCognitiveProfile, getHistory } from '../geminiService';
import { SenseiAnalysis } from '../types';

interface ProfileViewProps {
  onSelectHistory: (item: SenseiAnalysis) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onSelectHistory }) => {
  const profile = getCognitiveProfile();
  const history = getHistory();
  
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in zoom-in duration-500 pb-20">
      {/* HEADER CARD */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <h2 className="text-4xl font-black mb-2 serif-font">Cognitive Fingerprint</h2>
        <p className="text-indigo-100 opacity-80 mb-8">Analyzing patterns across {profile.totalSessions} sessions.</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-2">Primary Strength</span>
            <p className="font-bold text-lg">{profile.strengths[0]}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-2">Critical Focus</span>
            <p className="font-bold text-lg">Logic Precision</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-2">Advice</span>
            <p className="font-bold text-sm leading-tight">{profile.growthAdvice}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* STATS SECTION */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-fit">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Error Frequency Heatmap</h3>
          <div className="space-y-4">
            {Object.entries(profile.topErrorTypes).length > 0 ? (
              Object.entries(profile.topErrorTypes).map(([type, count]) => (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{type}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(count / profile.totalSessions) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs italic">No error patterns recorded yet.</p>
            )}
          </div>
        </div>

        {/* HISTORY LIST */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Recent Diagnostic History</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
            {history.length > 0 ? (
              history.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => onSelectHistory(item)}
                  className="w-full group bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 p-5 rounded-2xl text-left transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</span>
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full uppercase">{item.mode}</span>
                  </div>
                  <h4 className="text-slate-900 font-bold text-sm mb-1 truncate leading-tight group-hover:text-indigo-900">{item.stepByStepLogic.steps[0]}</h4>
                  <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider">{item.stepByStepLogic.criticalDeviationType || 'Logic'} deviation detected</p>
                </button>
              ))
            ) : (
              <div className="py-20 text-center">
                <div className="text-slate-200 text-5xl mb-4">📜</div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Your history is empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
