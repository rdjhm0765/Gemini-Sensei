
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface LiveSenseiProps {
  onClose: () => void;
  isDemo?: boolean;
}

export const LiveSensei: React.FC<LiveSenseiProps> = ({ onClose, isDemo = false }) => {
  const [active, setActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [status, setStatus] = useState('Standby');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Manual implementation of encode/decode for Live API
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const startDemoSequence = () => {
    setActive(true);
    setStatus('Sensei Vision Active (Demo)');
    
    const messages = [
      "Sensei: I see the derivative problem on your screen.",
      "You: Yeah, I'm stuck on the chain rule part.",
      "Sensei: Look at that outer function again. You've forgotten to multiply by the internal derivative.",
      "You: Oh! The (2x) part?",
      "Sensei: Exactly. Fix that, and your trajectory is clear."
    ];

    messages.forEach((msg, i) => {
      setTimeout(() => {
        setTranscription(prev => [...prev, msg].slice(-6));
      }, (i + 1) * 2000);
    });

    // Mirror camera even in demo for a "real" feel
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => {});
  };

  const startSession = async () => {
    if (isDemo) {
      startDemoSequence();
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = outputCtx;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 1280, height: 720 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      alert("Media access required.");
      return;
    }

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          setStatus('Sensei Observing...');
          setActive(true);
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);

          frameIntervalRef.current = window.setInterval(() => {
            if (canvasRef.current && videoRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) {
                canvasRef.current.width = 640;
                canvasRef.current.height = 360;
                ctx.drawImage(videoRef.current, 0, 0, 640, 360);
                canvasRef.current.toBlob(blob => {
                  if (blob) {
                    const r = new FileReader();
                    r.onloadend = () => {
                      const base64 = (r.result as string).split(',')[1];
                      sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } }));
                    };
                    r.readAsDataURL(blob);
                  }
                }, 'image/jpeg', 0.5);
              }
            }
          }, 1000);
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (msg.serverContent?.inputTranscription) setTranscription(p => [...p.slice(-5), `You: ${msg.serverContent.inputTranscription.text}`]);
          if (msg.serverContent?.outputTranscription) setTranscription(p => [...p.slice(-5), `Sensei: ${msg.serverContent.outputTranscription.text}`]);
          
          const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            const buffer = await decodeAudioData(decode(audio), outputCtx);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            const start = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            source.start(start);
            nextStartTimeRef.current = start + buffer.duration;
            sourcesRef.current.add(source);
            source.onended = () => sourcesRef.current.delete(source);
          }
        },
        onclose: () => cleanup()
      },
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        systemInstruction: "You are Gemini Sensei. You use your eyes (camera) and ears (mic) to guide students through the MENTAL path of a problem. If they make a logical leap that is incorrect, interrupt gently and ask them to re-examine that specific step."
      }
    });
    sessionRef.current = await sessionPromise;
  };

  const cleanup = () => {
    setActive(false);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    if (sessionRef.current) try { sessionRef.current.close(); } catch(e) {}
  };

  useEffect(() => cleanup, []);

  return (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/5">
        <div className="flex-1 bg-black relative min-h-[400px]">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-50" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent flex flex-col justify-end p-10">
            <h3 className="text-white font-black text-2xl serif-font flex items-center">
              {active && <span className="w-3 h-3 bg-rose-500 rounded-full animate-pulse mr-4"></span>}
              Vision Active
            </h3>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Observing cognitive patterns in real-time</p>
          </div>
        </div>

        <div className="w-full md:w-[400px] p-12 flex flex-col justify-between bg-slate-800/50 backdrop-blur-xl">
          <div>
            <div className="flex justify-between items-start mb-16">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-2xl">Ω</span>
               </div>
               <button onClick={onClose} className="text-slate-500 hover:text-white transition-all text-xl">✕</button>
            </div>

            <div className="mb-10">
              <h2 className="text-white text-3xl font-black mb-1 serif-font">Sensei Voice</h2>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{status}</p>
            </div>

            <div className="space-y-6 mb-8 max-h-[300px] overflow-hidden flex flex-col justify-end">
              {transcription.map((t, i) => (
                <div key={i} className={`p-4 rounded-2xl text-xs leading-relaxed animate-in slide-in-from-bottom-4 duration-500 ${t.startsWith('You') ? 'bg-white/5 text-slate-400' : 'bg-indigo-600/20 text-indigo-50 font-bold border border-indigo-500/20'}`}>
                  {t}
                </div>
              ))}
              {transcription.length === 0 && <p className="text-slate-500 text-xs italic opacity-50">"Explain your thinking out loud..."</p>}
            </div>
          </div>

          {!active ? (
            <button 
              onClick={startSession}
              className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl text-xs"
            >
              Enter Mentorship
            </button>
          ) : (
            <div className="flex items-end justify-center space-x-2 h-12 pb-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.05}s` }}></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
