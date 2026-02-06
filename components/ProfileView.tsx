
import React from 'react';
import { getCognitiveProfile } from '../geminiService';

export const ProfileView: React.FC = () => {
  const profile = getCognitiveProfile();
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
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
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Error Frequency Heatmap</h3>
          <div className="space-y-4">
            {Object.entries(profile.topErrorTypes).map(([type, count]) => (
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
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-center text-center">
          <div className="text-5xl font-black mb-4 serif-font text-indigo-400">{profile.totalSessions}</div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Cognitive Interventions</p>
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-slate-300 text-sm italic">"The goal isn't to get the answer right, it's to make getting it right inevitable."</p>
          </div>
        </div>
      </div>
    </div>
  );
};
