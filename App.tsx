
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ProfileView } from './components/ProfileView';
import { LiveSensei } from './components/LiveSensei';
import { analyzeReasoning } from './geminiService';
import { SenseiAnalysis, ReasoningMode } from './types';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    /**
     * The aistudio object provided by the environment for API key management.
     * Marked as readonly to ensure compatibility with other declarations of the aistudio property.
     */
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<'ANALYZE' | 'PROFILE' | 'LIVE'>('ANALYZE');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SenseiAnalysis | null>(null);
  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mode, setMode] = useState<ReasoningMode>('EXAM');
  const [quotaError, setQuotaError] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check initial key status on mount
  useEffect(() => {
    const checkKeyStatus = async () => {
      try { 
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected); 
      } catch (e) {
        console.error("Key check failed", e);
      }
    };
    checkKeyStatus();
  }, []);

  const handleRunDiagnosis = async () => {
    if (!textInput.trim() && !imagePreview) return;
    
    // Mandatory key selection check for Gemini 3 Pro models
    const isKeySelected = await window.aistudio.hasSelectedApiKey();
    if (!isKeySelected) {
      await window.aistudio.openSelectKey();
      // Guidelines: assume the key selection was successful after triggering openSelectKey()
      setHasKey(true);
    }

    setLoading(true);
    setQuotaError(false);
    try {
      setAnalysis(await analyzeReasoning(textInput, imagePreview || undefined, mode));
    } catch (error: any) {
      // Guidelines: If the request fails with "Requested entity was not found.", reset key and prompt again.
      if (error.message?.includes('Requested entity was not found')) {
        setHasKey(false);
        await window.aistudio.openSelectKey();
        setHasKey(true);
      } else if (error.message === "QUOTA_EXCEEDED" || error.message === "KEY_NOT_FOUND") {
        setQuotaError(true);
      } else {
        alert("Sensei error. Try again.");
      }
    } finally { setLoading(false); }
  };

  const handleReset = () => { 
    setAnalysis(null); 
    setTextInput(''); 
    setImagePreview(null); 
    setQuotaError(false); 
  };

  return (
    <Layout>
      {/* Mandatory Key Selection Dialog for high-tier models */}
      {!hasKey && (
        <div className="fixed inset-0 bg-slate-900/90 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
              <span className="text-white font-black text-3xl">Ω</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 serif-font">Connect Your Project</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Gemini Sensei requires an API key from a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline">paid Google Cloud project</a> to perform advanced cognitive diagnostics.
            </p>
            <button 
              onClick={async () => {
                await window.aistudio.openSelectKey();
                setHasKey(true);
              }}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
            >
              Select API Key
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-center mb-12">
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex space-x-1">
          {[
            { id: 'ANALYZE', label: 'Diagnosis', icon: '🧠' },
            { id: 'PROFILE', label: 'Fingerprint', icon: '🛡️' },
            { id: 'LIVE', label: 'Sensei Voice', icon: '🎙️' }
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => setView(nav.id as any)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center ${
                view === nav.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="mr-2">{nav.icon}</span> {nav.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'PROFILE' && <ProfileView />}
      
      {view === 'LIVE' && <LiveSensei onClose={() => setView('ANALYZE')} />}

      {view === 'ANALYZE' && (
        !analysis ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-900 mb-4 serif-font">Break the loop of wrong reasoning.</h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">Upload your handwritten work or explain your logic. Sensei finds the exact moment your thinking deviated.</p>
            </div>

            {quotaError && (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-center space-x-4">
                <span className="text-2xl">⚡</span>
                <p className="text-amber-900 text-sm font-bold flex-1">Global quota exhausted. Please select your own API key to continue.</p>
                <button onClick={() => window.aistudio.openSelectKey()} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase">Select Key</button>
              </div>
            )}

            <div className="flex justify-center space-x-2">
              {['EXAM', 'COACH', 'COGNITIVE'].map(m => (
                <button 
                  key={m} 
                  onClick={() => setMode(m as any)}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all ${mode === m ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white'}`}
                >
                  <div className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-1">{m}</div>
                  <div className="font-bold text-slate-900">{m === 'EXAM' ? 'Syllabus' : m === 'COACH' ? 'Tactical' : 'Diagnostic'}</div>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Input Visual Work</label>
                   {!imagePreview ? (
                     <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center hover:bg-slate-50 transition-all group">
                       <svg className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round"/></svg>
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Add Image</span>
                     </button>
                   ) : (
                     <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-200">
                       <img src={imagePreview} className="w-full h-full object-cover" alt="Student work preview" />
                       <button onClick={() => setImagePreview(null)} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg">✕</button>
                     </div>
                   )}
                   <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(f); } }} className="hidden" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Explain Steps</label>
                   <textarea 
                    value={textInput} 
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Describe your reasoning process here..."
                    className="w-full h-full min-h-[250px] p-6 rounded-3xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 resize-none serif-font text-xl leading-relaxed"
                   />
                </div>
              </div>
              <button 
                onClick={handleRunDiagnosis}
                disabled={loading}
                className={`w-full py-6 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl transition-all ${loading ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}
              >
                {loading ? 'Consulting the Sensei...' : 'Run Cognitive Diagnosis'}
              </button>
            </div>
          </div>
        ) : (
          <AnalysisDisplay analysis={analysis} onReset={handleReset} imageUrl={imagePreview} />
        )
      )}
    </Layout>
  );
};

export default App;
