
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

interface LiveSenseiProps {
  onClose: () => void;
}

export const LiveSensei: React.FC<LiveSenseiProps> = ({ onClose }) => {
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

  // Manual implementation of encode as per guidelines
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  // Manual implementation of decode as per guidelines
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  // Improved audio decoding following standard guidelines
  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    // Create new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = outputCtx;

    // Get both Audio and Video
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 1280, height: 720, facingMode: 'user' } 
      });
    } catch (e) {
      alert("Camera and microphone access required for Live Sensei.");
      return;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          setStatus('Sensei sees you...');
          setActive(true);
          
          // Audio Streaming using ScriptProcessor as shown in examples
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            
            // Solely rely on sessionPromise resolves to send data
            sessionPromise.then(s => {
              s.sendRealtimeInput({ 
                media: { 
                  data: encode(new Uint8Array(int16.buffer)), 
                  mimeType: 'audio/pcm;rate=16000' 
                } 
              });
            });
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);

          // Video Frame Streaming
          frameIntervalRef.current = window.setInterval(() => {
            if (canvasRef.current && videoRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) {
                canvasRef.current.width = videoRef.current.videoWidth / 2;
                canvasRef.current.height = videoRef.current.videoHeight / 2;
                ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                canvasRef.current.toBlob((blob) => {
                  if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = (reader.result as string).split(',')[1];
                      sessionPromise.then(s => {
                        s.sendRealtimeInput({ 
                          media: { data: base64, mimeType: 'image/jpeg' } 
                        });
                      });
                    };
                    reader.readAsDataURL(blob);
                  }
                }, 'image/jpeg', 0.5);
              }
            }
          }, 1000);
        },
        onmessage: async (msg: any) => {
          if (msg.serverContent?.inputTranscription) {
            setTranscription(prev => [...prev.slice(-3), `You: ${msg.serverContent.inputTranscription.text}`]);
          }
          if (msg.serverContent?.outputTranscription) {
            setTranscription(prev => [...prev.slice(-3), `Sensei: ${msg.serverContent.outputTranscription.text}`]);
          }

          // Process audio output bytes
          const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            
            // Precise scheduling for gapless playback
            const startTime = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            source.start(startTime);
            nextStartTimeRef.current = startTime + buffer.duration;
            sourcesRef.current.add(source);
            source.onended = () => sourcesRef.current.delete(source);
          }
          
          // Handle interruptions
          if (msg.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => {
              try { s.stop(); } catch(e) {}
            });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onclose: () => cleanup(),
        onerror: async (e: any) => {
          console.error("Live Error", e);
          // Handle "Requested entity was not found" error by resetting key state
          if (e?.message?.includes('Requested entity was not found')) {
            cleanup();
            await window.aistudio.openSelectKey();
            alert("Connection issue. Please restart mentorship after verifying your API key.");
          }
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        systemInstruction: "You are Gemini Sensei. You can SEE the user and their paper through the camera. If you see them writing something logically incorrect, or if their verbal explanation fails, interrupt gently. Point out where on the paper they should look. Focus on cognitive trajectory."
      }
    });

    sessionRef.current = await sessionPromise;
  };

  const cleanup = () => {
    setActive(false);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/5">
        
        {/* Left: Video Feed */}
        <div className="flex-1 bg-black relative min-h-[300px]">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-60" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
            <h3 className="text-white font-black text-xl serif-font flex items-center">
              {active && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-3"></span>}
              Sensei Vision Enabled
            </h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Real-time logic observation</p>
          </div>
        </div>

        {/* Right: Interaction */}
        <div className="w-full md:w-[380px] p-10 flex flex-col justify-between bg-slate-800">
          <div>
            <div className="flex justify-between items-start mb-12">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
                  <span className="text-white font-black text-2xl">Ω</span>
               </div>
               <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
            </div>

            <div className="mb-8">
              <h2 className="text-white text-2xl font-black mb-1 serif-font">The Mentor</h2>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{status}</p>
            </div>

            <div className="space-y-4 mb-8 max-h-[200px] overflow-hidden flex flex-col justify-end">
              {transcription.map((t, i) => (
                <p key={i} className={`text-xs leading-relaxed animate-in slide-in-from-bottom-2 ${t.startsWith('You') ? 'text-slate-400' : 'text-slate-100 font-bold'}`}>
                  {t}
                </p>
              ))}
              {transcription.length === 0 && <p className="text-slate-600 text-xs italic">"Show me your work and explain your steps out loud..."</p>}
            </div>
          </div>

          {!active ? (
            <button 
              onClick={startSession}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40 text-xs"
            >
              Start Mentorship
            </button>
          ) : (
            <div className="flex items-center space-x-2 h-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex-1 bg-indigo-500 rounded-full animate-bounce" style={{ height: `${20 + Math.random() * 40}%`, animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
