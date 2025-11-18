import React, { useState, useRef, useEffect } from 'react';
import { ChefPersonality } from '../types';
import { Mic, MicOff, Video, VideoOff, Loader2, UserCog, Radio, MessageSquare, Bot, Flame, Heart, ChefHat } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Helper to convert Float32Array to base64 PCM
function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
}

function base64EncodeAudio(float32Array: Float32Array): string {
    const arrayBuffer = floatTo16BitPCM(float32Array);
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export const KitchenAssistant: React.FC = () => {
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [personality, setPersonality] = useState<ChefPersonality>('Professional');
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [transcript, setTranscript] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const getPersonalityConfig = (p: ChefPersonality) => {
      switch(p) {
          case 'Grandma':
              return {
                  voice: 'Kore',
                  instruction: "You are a sweet, nurturing grandmother. Help the user with general cooking questions. Call the user 'honey'. Be comforting."
              };
          case 'Gordon':
              return {
                  voice: 'Fenrir',
                  instruction: "You are a strict, demanding, world-class chef like Gordon Ramsay. Be intense, loud, and use culinary jargon. Demand high standards."
              };
          case 'Robot':
              return {
                  voice: 'Charon',
                  instruction: "You are a futuristic cooking android. Speak in precise, analytical terms. Focus on efficiency and scientific accuracy."
              };
          default:
              return {
                  voice: 'Puck',
                  instruction: "You are a helpful, professional executive chef. Answer kitchen questions, convert units, and give advice clearly and concisely."
              };
      }
  }

  const getPersonaIcon = (p: ChefPersonality, size: number = 24) => {
      switch(p) {
          case 'Grandma': return <Heart size={size} />;
          case 'Gordon': return <Flame size={size} />;
          case 'Robot': return <Bot size={size} />;
          default: return <ChefHat size={size} />;
      }
  }

  const startLiveSession = async (personaOverride?: ChefPersonality) => {
      setIsLiveLoading(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          audioContextRef.current = audioContext;
          
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          const currentPersona = personaOverride || personality;
          const personaConfig = getPersonalityConfig(currentPersona);

          const sessionPromise = ai.live.connect({
              model: 'gemini-2.5-flash-native-audio-preview-09-2025',
              callbacks: {
                  onopen: () => {
                      setIsLiveConnected(true);
                      setIsLiveLoading(false);
                      setTranscript("Session connected. Say hello!");

                      const source = audioContext.createMediaStreamSource(stream);
                      inputSourceRef.current = source;
                      const processor = audioContext.createScriptProcessor(4096, 1, 1);
                      processorRef.current = processor;

                      processor.onaudioprocess = (e) => {
                          const inputData = e.inputBuffer.getChannelData(0);
                          const base64Data = base64EncodeAudio(inputData);
                          sessionPromise.then(session => {
                              session.sendRealtimeInput({
                                  media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
                              });
                          });
                      };
                      
                      source.connect(processor);
                      processor.connect(audioContext.destination);

                      if (isVideoEnabled) startVideoLoop(sessionPromise);
                  },
                  onmessage: async (msg: LiveServerMessage) => {
                    const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (data) {
                        const binaryString = atob(data);
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                        
                        const float32Data = new Float32Array(bytes.buffer);
                        const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
                        audioBuffer.getChannelData(0).set(float32Data);
                        
                        const source = audioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContext.destination);
                        
                        const currentTime = audioContext.currentTime;
                        if (nextStartTimeRef.current < currentTime) nextStartTimeRef.current = currentTime;
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                    }
                  },
                  onclose: () => {
                      setIsLiveConnected(false);
                      stopVideoLoop();
                  },
                  onerror: (err) => {
                      console.error(err);
                      setIsLiveConnected(false);
                      stopVideoLoop();
                  }
              },
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: personaConfig.voice } } },
                  systemInstruction: personaConfig.instruction,
              }
          });
          sessionRef.current = sessionPromise;
      } catch (e) {
          console.error(e);
          setIsLiveLoading(false);
          alert("Could not start voice session.");
      }
  };

  const startVideoLoop = (sessionPromise: Promise<any>) => {
      if (!videoRef.current || !canvasRef.current) return;
      videoIntervalRef.current = window.setInterval(() => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.videoWidth > 0) {
              canvas.width = video.videoWidth / 4;
              canvas.height = video.videoHeight / 4;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionPromise.then(session => {
                      session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64Data } });
                  });
              }
          }
      }, 1000);
  };

  const stopVideoLoop = () => {
      if (videoIntervalRef.current) {
          clearInterval(videoIntervalRef.current);
          videoIntervalRef.current = null;
      }
  };

  const toggleVideo = async () => {
      if (isVideoEnabled) {
          if (videoStreamRef.current) {
              videoStreamRef.current.getTracks().forEach(track => track.stop());
              videoStreamRef.current = null;
          }
          stopVideoLoop();
          setIsVideoEnabled(false);
          if (videoRef.current) videoRef.current.srcObject = null;
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
              videoStreamRef.current = stream;
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  videoRef.current.play();
              }
              setIsVideoEnabled(true);
              if (isLiveConnected && sessionRef.current) startVideoLoop(sessionRef.current);
          } catch (e) {
              alert("Could not access camera.");
          }
      }
  };

  const stopLiveSession = () => {
      if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
      if (inputSourceRef.current) { inputSourceRef.current.disconnect(); inputSourceRef.current = null; }
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
      stopVideoLoop();
      if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach(track => track.stop());
      setIsLiveConnected(false);
  };

  const toggleLive = () => isLiveConnected ? stopLiveSession() : startLiveSession();

  const handlePersonalityChange = (p: ChefPersonality) => {
      const wasConnected = isLiveConnected;
      setPersonality(p);
      setShowPersonaSelector(false);
      
      if (wasConnected) {
          stopLiveSession();
          // Small delay to allow cleanup before reconnecting with new persona
          setTimeout(() => startLiveSession(p), 200);
      }
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-900 text-white overflow-hidden">
        {/* Video Background Layer */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
            <video ref={videoRef} className={`w-full h-full object-cover opacity-50 ${!isVideoEnabled && 'hidden'}`} muted playsInline />
            {!isVideoEnabled && (
                <div className="flex flex-col items-center text-slate-600">
                    <Radio size={64} className="animate-pulse mb-4 opacity-20" />
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls Overlay */}
        <div className="relative z-10 flex flex-col h-full p-6">
            <div className="flex justify-between items-start">
                 <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                     <div className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                     <span className="text-sm font-bold">{isLiveConnected ? 'AI Listening' : 'Offline'}</span>
                 </div>
                 
                 <div className="relative">
                     <button 
                        onClick={() => setShowPersonaSelector(!showPersonaSelector)}
                        className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
                     >
                         <UserCog size={24} />
                     </button>
                     {showPersonaSelector && (
                         <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700 py-2 shadow-xl">
                             <p className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Choose Persona</p>
                             {(['Professional', 'Grandma', 'Gordon', 'Robot'] as ChefPersonality[]).map(p => (
                                 <button
                                    key={p}
                                    onClick={() => handlePersonalityChange(p)}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-700 flex items-center gap-3 ${personality === p ? 'text-emerald-400 bg-white/5' : 'text-slate-300'}`}
                                 >
                                     {getPersonaIcon(p, 20)}
                                     {p}
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
                {!isLiveConnected && (
                    <div className="bg-black/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 max-w-md">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                            <MessageSquare size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">AI Chef Assistant</h2>
                        <p className="text-slate-300 mb-8">Ask about substitutions, cooking times, techniques, or show ingredients via camera.</p>
                        <button 
                            onClick={() => startLiveSession()}
                            disabled={isLiveLoading}
                            className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                            {isLiveLoading ? <Loader2 className="animate-spin" /> : <Mic />}
                            <span>Start Conversation</span>
                        </button>
                    </div>
                )}
                
                {isLiveConnected && (
                    <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center backdrop-blur-md border border-white/10 mb-6 relative">
                             <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
                             {getPersonaIcon(personality, 64)}
                        </div>
                        <p className="text-2xl font-light text-white/80">"I'm listening..."</p>
                        <p className="text-sm text-emerald-400 mt-2 font-medium uppercase tracking-wide border border-emerald-500/30 px-3 py-1 rounded-full bg-emerald-500/10">
                            {personality} Mode Active
                        </p>
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-6 pb-8">
                <button 
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-all ${
                        isVideoEnabled ? 'bg-white text-slate-900' : 'bg-black/40 text-white border border-white/20 hover:bg-white/10'
                    }`}
                >
                    {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
                
                {isLiveConnected && (
                    <button 
                        onClick={stopLiveSession}
                        className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                    >
                        <MicOff size={24} />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};