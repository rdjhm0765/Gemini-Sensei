
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ProfileView } from './components/ProfileView';
import { LiveSensei } from './components/LiveSensei';
import { analyzeReasoning, SENSEI_SAMPLES, getHistory } from './geminiService';
import { SenseiAnalysis, ReasoningMode } from './types';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

interface AttachedFile {
  data: string;
  mimeType: string;
  name: string;
}

const App: React.FC = () => {
  const [view, setView] = useState<'ANALYZE' | 'PROFILE' | 'LIVE'>('ANALYZE');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SenseiAnalysis | null>(null);
  const [textInput, setTextInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [mode, setMode] = useState<ReasoningMode>('EXAM');
  const [quotaError, setQuotaError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showSampleLibrary, setShowSampleLibrary] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Mathematics');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRunDiagnosis = async () => {
    if (isDemoMode) {
      setShowSampleLibrary(true);
      return;
    }
    if (!textInput.trim() && !attachedFile) return;
    
    setLoading(true);
    setQuotaError(false);
    try {
      const result = await analyzeReasoning(
        textInput, 
        attachedFile ? { data: attachedFile.data, mimeType: attachedFile.mimeType } : undefined, 
        mode
      );
      setAnalysis(result);
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        setQuotaError(true);
      } else { 
        alert("Sensei encountered a connection error. Please try again or use Demo Mode."); 
      }
    } finally { setLoading(false); }
  };

  const startDemo = () => {
    setIsDemoMode(true);
    setIsReady(true); 
    setShowSampleLibrary(true);
  };

  const exitDemo = () => {
    setIsDemoMode(false);
    handleReset();
  };

  const handleReset = () => { 
    setAnalysis(null); 
    if (isDemoMode) {
      setShowSampleLibrary(true);
    } else {
      setTextInput(''); 
      setAttachedFile(null); 
    }
    setQuotaError(false);
  };

  const handleSelectHistorical = (item: SenseiAnalysis) => {
    setAnalysis(item);
    setView('ANALYZE');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target as FileReader).result as string;
        setTextInput(prev => `${prev}\n\n--- Content from ${file.name} ---\n${content}`);
        setAttachedFile({
          data: btoa(content || ''),
          mimeType: file.type,
          name: file.name
        });
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachedFile({
        data: base64,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const selectSample = (sample: SenseiAnalysis) => {
    setLoading(true);
    setShowSampleLibrary(false);
    setTimeout(() => {
      setAnalysis(sample);
      setLoading(false);
    }, 1000);
  };

  const categoryIcons: any = { Mathematics: 'Σ', Physics: '⚛', Programming: '⌽' };

  return (
    <Layout>
      {/* PERSISTENT DEMO INDICATOR */}
      {isDemoMode && (
        <div className="fixed top-20 right-8 z-[100] flex flex-col items-end space-y-3">
          <div className="bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-pulse flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
            Demo Mode
          </div>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => setShowSampleLibrary(true)}
              className="bg-white/95 backdrop-blur border border-slate-200 text-slate-900 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-white hover:-translate-y-0.5 transition-all"
            >
              Open Sample Vault
            </button>
            <button 
              onClick={exitDemo}
              className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black hover:-translate-y-0.5 transition-all"
            >
              Exit Demo
            </button>
          </div>
        </div>
      )}

      {/* SAMPLE VAULT MODAL */}
      {showSampleLibrary && (
        <div className="fixed inset-0 bg-slate-900/95 z-[150] flex flex-col p-6 animate-in fade-in duration-500 overflow-y-auto backdrop-blur-md">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-white text-5xl font-black serif-font mb-2 tracking-tight">Sensei Sample Vault</h2>
                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Explore pre-calculated cognitive patterns</p>
              </div>
              <button onClick={() => setShowSampleLibrary(false)} className="text-white opacity-50 hover:opacity-100 text-3xl transition-opacity">✕</button>
            </div>
            
            <div className="flex space-x-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
              {Object.keys(SENSEI_SAMPLES).map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-4 rounded-3xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.6)] scale-105' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                  <span className="mr-3 opacity-50">{categoryIcons[cat]}</span> {cat}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
              {SENSEI_SAMPLES[activeCategory].map((sample) => (
                <button 
                  key={sample.id}
                  onClick={() => selectSample(sample)}
                  className="bg-white/5 border border-white/10 p-10 rounded-[3rem] text-left hover:bg-white/10 hover:border-indigo-500/50 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-9xl font-black">{categoryIcons[activeCategory]}</span>
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full">{sample.mode} Analysis</span>
                      <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-full">{sample.stepByStepLogic.criticalDeviationType}</span>
                    </div>
                    <h4 className="text-white font-bold text-xl mb-3 truncate leading-tight">{sample.stepByStepLogic.steps[0]}</h4>
                    <p className="text-slate-400 text-sm line-clamp-2 italic mb-10 leading-relaxed">"{sample.thinkingReplay.moments[0]}"</p>
                    <div className="flex items-center text-indigo-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                      Inject Pattern →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FRIENDLY ONBOARDING MODAL */}
      {!isReady && (
        <div className="fixed inset-0 bg-slate-900/98 z-[200] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-700">
          <div className="max-w-2xl w-full bg-white rounded-[4rem] p-16 text-center shadow-[0_35px_100px_-15px_rgba(0,0,0,0.5)] border border-slate-100">
            <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] transform -rotate-3">
              <span className="text-white font-black text-5xl">Ω</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-6 serif-font tracking-tight">Initialize Sensei</h2>
            <p className="text-slate-500 mb-12 text-lg leading-relaxed max-w-lg mx-auto">
              Ready to begin deep cognitive analysis. Sensei is connected and ready to observe your work.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setIsReady(true)} 
                className="group relative flex flex-col items-center justify-center p-8 bg-indigo-600 rounded-[2.5rem] hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-1"
              >
                <span className="text-white font-black uppercase tracking-widest text-sm mb-1">Enter Engine</span>
                <span className="text-indigo-200 text-[10px] font-black uppercase opacity-70">Use Live Sensei</span>
              </button>
              <button 
                onClick={startDemo} 
                className="group relative flex flex-col items-center justify-center p-8 bg-slate-900 rounded-[2.5rem] hover:bg-black transition-all shadow-xl hover:-translate-y-1"
              >
                <span className="text-white font-black uppercase tracking-widest text-sm mb-1">Explore Samples</span>
                <span className="text-slate-400 text-[10px] font-black uppercase opacity-70">Guided Onboarding</span>
              </button>
            </div>

            <div className="mt-12 pt-10 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Cognitive Intelligence Platform v3.1</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN NAVIGATION */}
      <div className="flex justify-center mb-16">
        <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-3xl shadow-sm border border-slate-100 flex space-x-1">
          {['ANALYZE', 'PROFILE', 'LIVE'].map(nav => (
            <button
              key={nav}
              onClick={() => setView(nav as any)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === nav ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}
            >
              {nav}
            </button>
          ))}
        </div>
      </div>

      {view === 'PROFILE' && <ProfileView onSelectHistory={handleSelectHistorical} />}
      {view === 'LIVE' && <LiveSensei onClose={() => setView('ANALYZE')} isDemo={isDemoMode} />}
      {view === 'ANALYZE' && (
        !analysis ? (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                Cognitive Reasoning Engine v3.1
              </div>
              <h2 className="text-6xl font-black text-slate-900 mb-6 serif-font tracking-tight leading-tight">Identify your logic loops.</h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">Gemini Sensei doesn't just grade your answers—it fixes the way your mind processes information.</p>
            </div>

            {quotaError && (
              <div className="p-8 bg-amber-50 border border-amber-200 rounded-[2.5rem] flex items-center space-x-6 mb-4 shadow-sm animate-in zoom-in">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="text-amber-600 font-black text-2xl">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-amber-900 text-sm font-bold">Daily Quota Reached</p>
                  <p className="text-amber-700 text-xs">Your current key has hit its limit. Switch to Demo Mode to explore the Sample Vault instead.</p>
                </div>
                <button onClick={startDemo} className="px-6 py-3 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-amber-600/20 active:scale-95 transition-all">Enter Demo</button>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              {['EXAM', 'COACH', 'COGNITIVE'].map(m => (
                <button 
                  key={m} 
                  onClick={() => setMode(m as any)} 
                  className={`flex-1 group p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${mode === m ? 'border-indigo-600 bg-indigo-50 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.2)]' : 'border-slate-100 bg-white hover:border-indigo-100 hover:bg-slate-50'}`}
                >
                  <div className={`font-black text-[10px] uppercase tracking-[0.3em] mb-2 transition-colors ${mode === m ? 'text-indigo-400' : 'text-slate-300 group-hover:text-indigo-300'}`}>{m}</div>
                  <div className={`font-black text-lg transition-colors ${mode === m ? 'text-slate-900' : 'text-slate-500 group-hover:text-indigo-900'}`}>{m} Mode</div>
                  {mode === m && <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black">✓</div>}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 p-12">
              <div className="grid md:grid-cols-2 gap-12 mb-12">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block mb-6">Multimodal Work Input</label>
                   {!attachedFile ? (
                     <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full aspect-square border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center hover:bg-slate-50 hover:border-indigo-100 group transition-all"
                     >
                       <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
                        <svg className="w-10 h-10 text-slate-300 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                       </div>
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Image, PDF, or TXT</span>
                     </button>
                   ) : (
                     <div className="relative aspect-square rounded-[3rem] overflow-hidden border-4 border-slate-50 bg-slate-50 flex items-center justify-center group shadow-inner">
                       {attachedFile.mimeType.startsWith('image/') ? (
                         <img src={`data:${attachedFile.mimeType};base64,${attachedFile.data}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Work Preview" />
                       ) : (
                         <div className="text-center p-10 animate-in zoom-in">
                           <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                             <span className="text-white text-5xl">📄</span>
                           </div>
                           <p className="text-sm font-black text-slate-900 truncate max-w-[250px] mb-2">{attachedFile.name}</p>
                           <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] bg-indigo-50 px-4 py-1.5 rounded-full inline-block">Pattern Ready</p>
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }} 
                            className="bg-white text-slate-900 p-5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all hover:bg-rose-500 hover:text-white"
                          >
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                       </div>
                     </div>
                   )}
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf,text/plain" className="hidden" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block mb-6">Logical Context</label>
                   <div className="relative h-full min-h-[300px]">
                    <textarea 
                      value={textInput} onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type your reasoning process here or describe the problem..."
                      className="w-full h-full p-10 rounded-[3rem] bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 resize-none serif-font text-2xl leading-relaxed placeholder:text-slate-300 transition-all"
                    />
                    <div className="absolute bottom-6 right-6 pointer-events-none opacity-20">
                      <span className="text-5xl serif-font font-black">“</span>
                    </div>
                   </div>
                </div>
              </div>
              <button 
                onClick={handleRunDiagnosis}
                disabled={loading}
                className={`w-full py-8 rounded-[2.5rem] font-black text-xl uppercase tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] transition-all relative overflow-hidden group ${loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 active:scale-95'}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Consulting Sensei...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {isDemoMode ? 'Open Sample Vault' : 'Run Cognitive Diagnosis'}
                    <svg className="w-6 h-6 ml-4 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        ) : (
          <AnalysisDisplay 
            analysis={analysis} 
            onReset={handleReset} 
            attachedFile={attachedFile}
            isDemo={isDemoMode} 
          />
        )
      )}
    </Layout>
  );
};

export default App;
