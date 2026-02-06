
import React, { useState } from 'react';
import { SenseiAnalysis } from '../types';
import { generateConceptualVideo } from '../geminiService';

interface AnalysisDisplayProps {
  analysis: SenseiAnalysis;
  onReset: () => void;
  imageUrl?: string | null;
}

const HeatmapOverlay: React.FC<{ box: number[], imageUrl: string }> = ({ box, imageUrl }) => {
  const [top, left, bottom, right] = box;
  return (
    <div className="relative inline-block w-full">
      <img src={imageUrl} alt="Work" className="w-full rounded-2xl grayscale-[0.2]" />
      <div 
        className="absolute border-4 border-rose-500 bg-rose-500/20 rounded-lg animate-pulse"
        style={{ top: `${top/10}%`, left: `${left/10}%`, height: `${(bottom-top)/10}%`, width: `${(right-left)/10}%` }}
      >
        <div className="absolute -top-8 left-0 bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest whitespace-nowrap">Error Detection</div>
      </div>
    </div>
  );
};

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, onReset, imageUrl }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);

  const handleGenerateVideo = async () => {
    setGeneratingVideo(true);
    try {
      const url = await generateConceptualVideo(analysis.shortcutMethod || analysis.correctSolution);
      setVideoUrl(url);
    } catch (e) {
      alert("Video generation failed. Quota reached?");
    } finally {
      setGeneratingVideo(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-32">
      
      {imageUrl && analysis.errorBoundingBox && (
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-6">Cognitive Diagnostic</h3>
          <HeatmapOverlay box={analysis.errorBoundingBox.box_2d} imageUrl={imageUrl} />
        </section>
      )}

      <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Logic Reconstruction</h3>
        <div className="space-y-3">
          {analysis.stepByStepLogic.steps.map((step, index) => {
            const isError = index === analysis.stepByStepLogic.incorrectStepIndex;
            return (
              <div key={index} className={`p-4 rounded-2xl border ${isError ? 'border-rose-200 bg-rose-50 shadow-sm' : 'border-slate-50 bg-slate-50/30'}`}>
                <div className="flex items-start">
                  <span className={`w-6 h-6 rounded flex items-center justify-center mr-4 shrink-0 font-mono text-[10px] font-black ${isError ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{index+1}</span>
                  <p className={`text-sm leading-relaxed ${isError ? 'font-bold text-rose-900' : 'text-slate-800'}`}>{step}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8">{analysis.thinkingReplay.header}</h3>
        <div className="space-y-8">
          {analysis.thinkingReplay.moments.map((m, i) => (
            <div key={i} className="flex space-x-4 border-l-2 border-white/10 pl-6">
              <p className="text-lg serif-font italic opacity-90 leading-relaxed">"{m}"</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Conceptual Shortcut</span>
            <p className="text-sm text-slate-300 font-medium">{analysis.shortcutMethod || "No shortcut available for this problem."}</p>
          </div>
          <button 
            onClick={handleGenerateVideo}
            disabled={generatingVideo || !!videoUrl}
            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center ${generatingVideo ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-900 hover:bg-indigo-50 shadow-lg'}`}
          >
            {generatingVideo ? (
              <>
                <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating Custom Video...
              </>
            ) : videoUrl ? 'Video Ready Below' : 'Generate AI Video Tutorial'}
          </button>
        </div>

        {videoUrl && (
          <div className="mt-8 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black animate-in zoom-in duration-500">
            <video src={videoUrl} controls className="w-full aspect-video" autoPlay muted loop />
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Verified References</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {analysis.groundingSources?.map((s, i) => (
            <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white transition-all flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 truncate mr-4">{s.title || "External Lesson"}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth="2" strokeLinecap="round"/></svg>
            </a>
          ))}
        </div>
      </section>

      <div className="flex flex-col items-center pt-10">
        <button onClick={onReset} className="px-16 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-black hover:scale-105 transition-all text-sm shadow-xl">New Session</button>
        <p className="mt-6 text-slate-400 text-[10px] italic">“We fix the mind, and the answers follow.”</p>
      </div>
    </div>
  );
};
