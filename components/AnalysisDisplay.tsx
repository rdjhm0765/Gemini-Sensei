
import React from 'react';
import { SenseiAnalysis } from '../types';

interface AttachedFile {
  data: string;
  mimeType: string;
  name: string;
}

interface AnalysisDisplayProps {
  analysis: SenseiAnalysis;
  onReset: () => void;
  attachedFile?: AttachedFile | null;
  isDemo?: boolean;
}

const HeatmapOverlay: React.FC<{ box: number[], imageUrl: string, label: string }> = ({ box, imageUrl, label }) => {
  const [top, left, bottom, right] = box;
  return (
    <div className="relative inline-block w-full overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-100">
      <img src={imageUrl} alt="Reasoning Work" className="w-full grayscale-[0.3] hover:grayscale-0 transition-all duration-1000" />
      <div className="absolute inset-0 bg-indigo-900/10 pointer-events-none"></div>
      <div 
        className="absolute border-[6px] border-rose-500 bg-rose-500/20 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse"
        style={{ 
          top: `${top/10}%`, 
          left: `${left/10}%`, 
          height: `${(bottom-top)/10}%`, 
          width: `${(right-left)/10}%`,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="absolute -top-12 left-0 bg-rose-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] shadow-xl whitespace-nowrap flex items-center">
          <span className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></span>
          Cognitive Slip: {label}
        </div>
      </div>
    </div>
  );
};

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, onReset, attachedFile, isDemo = false }) => {
  const isImage = attachedFile?.mimeType.startsWith('image/');
  const imageUrl = isImage ? `data:${attachedFile?.mimeType};base64,${attachedFile?.data}` : (isDemo ? "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000" : null);

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-5xl mx-auto pb-48">
      
      {/* HEADER DIAGNOSTIC */}
      <div className="text-center">
        <span className="px-6 py-2 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4 inline-block border border-rose-100">Diagnosis Generated</span>
        <h2 className="text-5xl font-black text-slate-900 serif-font tracking-tight mt-4">Reasoning Reconstruction</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* LEFT: VISUAL EVIDENCE */}
        <section className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Diagnostic Evidence</h3>
            {attachedFile && (
              <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[150px]">
                {attachedFile.name}
              </div>
            )}
          </div>
          
          {imageUrl && (analysis.errorBoundingBox || isDemo) ? (
            <HeatmapOverlay 
              box={analysis.errorBoundingBox?.box_2d || [300, 300, 700, 700]} 
              imageUrl={imageUrl} 
              label={analysis.errorBoundingBox?.label || "Logical Leap"}
            />
          ) : attachedFile ? (
            <div className="bg-slate-50 rounded-[2.5rem] p-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-100">
              <div className="w-32 h-32 bg-indigo-600 rounded-[3rem] flex items-center justify-center mb-8 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <span className="text-white text-6xl">📄</span>
              </div>
              <h4 className="font-black text-slate-900 text-xl mb-2">{attachedFile.name}</h4>
              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mb-8">Structural Pattern Analysis Applied</p>
              <div className="flex items-center space-x-3 px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Multi-Modal Logic Scan Success</span>
              </div>
            </div>
          ) : (
            <div className="p-20 bg-slate-50 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
              <div className="text-slate-200 text-8xl mb-6">👁</div>
              <p className="text-slate-400 italic text-sm serif-font leading-relaxed">No visual evidence provided.<br/>Analysis based purely on textual logic reconstruction.</p>
            </div>
          )}
        </section>

        {/* RIGHT: LOGIC STEPS */}
        <section className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Thought Reconstruction</h3>
            <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">{analysis.mode} Engine</span>
          </div>
          
          <div className="space-y-6 relative">
            <div className="absolute top-0 bottom-0 left-[21px] w-0.5 bg-slate-100"></div>
            {analysis.stepByStepLogic.steps.map((step, index) => {
              const isError = index === analysis.stepByStepLogic.incorrectStepIndex;
              return (
                <div key={index} className={`relative flex items-start group transition-all duration-500 ${isError ? 'scale-[1.03]' : ''}`}>
                  <div className={`z-10 w-11 h-11 rounded-2xl flex items-center justify-center mr-6 shrink-0 font-mono text-xs font-black shadow-lg transition-all ${isError ? 'bg-rose-500 text-white scale-125 rotate-6' : 'bg-white border-2 border-slate-100 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-400'}`}>
                    {index+1}
                  </div>
                  <div className={`flex-1 p-6 rounded-[2rem] border transition-all duration-500 ${isError ? 'border-rose-200 bg-rose-50 shadow-[0_15px_30px_-5px_rgba(244,63,94,0.15)] ring-2 ring-rose-100' : 'border-slate-50 bg-slate-50/20 group-hover:bg-slate-50 group-hover:border-slate-100'}`}>
                    <p className={`text-base leading-relaxed serif-font ${isError ? 'font-bold text-rose-950 italic' : 'text-slate-700'}`}>{step}</p>
                    {isError && (
                      <div className="mt-4 pt-4 border-t border-rose-200/50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center">
                          <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          Primary Deviation Detected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* COGNITIVE REPLAY (DARK SECTION) */}
      <section className="bg-slate-900 rounded-[4rem] p-16 text-white shadow-[0_50px_100px_-20px_rgba(15,23,42,0.5)] relative overflow-hidden group">
        <div className="absolute -right-40 -top-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="relative z-10">
          <div className="flex items-center mb-12 space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
              <span className="text-white text-2xl">🧠</span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">{analysis.thinkingReplay.header}</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-10">
              {analysis.thinkingReplay.moments.map((m, i) => (
                <div key={i} className="flex space-x-6 border-l-4 border-indigo-500/30 pl-8 hover:border-indigo-500 transition-colors py-2">
                  <p className="text-2xl serif-font italic font-light opacity-90 leading-relaxed">“{m}”</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col justify-between">
              <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414-1.414l.707.707a1 1 0 01-1.414 1.414l-.707-.707zM16 18a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1z" /></svg>
                </div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-4">Tactical Fix</span>
                <p className="text-lg font-bold text-white leading-relaxed">{analysis.shortcutMethod || "Master the core principle identified in Step " + (analysis.stepByStepLogic.incorrectStepIndex + 1)}</p>
              </div>

              {analysis.youtubeUrl && (
                <div className="mt-8">
                  <a 
                    href={analysis.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between w-full p-8 bg-rose-600 rounded-[2.5rem] hover:bg-rose-700 transition-all shadow-[0_20px_40px_-10px_rgba(225,29,72,0.4)]"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-3xl group-hover:scale-110 transition-transform">▶</div>
                      <div className="text-left">
                        <span className="text-[10px] font-black text-rose-200 uppercase tracking-[0.3em]">Masterclass Rec</span>
                        <p className="text-white font-black text-lg">Watch Pattern Expert</p>
                      </div>
                    </div>
                    <svg className="w-8 h-8 text-white opacity-40 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col items-center pt-20">
        <button 
          onClick={onReset} 
          className="group relative px-20 py-8 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] hover:bg-black hover:-translate-y-2 transition-all text-base shadow-[0_30px_70px_-15px_rgba(0,0,0,0.4)] active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800 opacity-0 group-hover:opacity-10 transition-opacity"></div>
          New Intervention
        </button>
        <p className="mt-10 text-slate-400 text-xs font-black uppercase tracking-[0.5em] italic opacity-50 select-none">“Logic is the foundation of reality.”</p>
      </div>
    </div>
  );
};
