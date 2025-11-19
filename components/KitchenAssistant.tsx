import React, { useState, useRef, useEffect } from 'react';
import { ChefPersonality } from '../types';
import { Mic, MicOff, Video, VideoOff, Loader2, UserCog, Radio, MessageSquare, Bot, Flame, Heart, ChefHat, RefreshCcw } from 'lucide-react';
import { GeminiLiveSession } from '../services/liveApiService';

export const KitchenAssistant: React.FC = () => {
    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [isLiveLoading, setIsLiveLoading] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [personality, setPersonality] = useState<ChefPersonality>('Professional');
    const [showPersonaSelector, setShowPersonaSelector] = useState(false);
    const [volume, setVolume] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sessionRef = useRef<GeminiLiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioStreamRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const videoIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            stopLiveSession();
        };
    }, []);

    const getPersonalityConfig = (p: ChefPersonality) => {
        switch (p) {
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
                    voice: 'Aoede',
                    instruction: "You are a helpful, professional executive chef. Answer kitchen questions, convert units, and give advice clearly and concisely."
                };
        }
    }

    const getPersonaIcon = (p: ChefPersonality, size: number = 24) => {
        switch (p) {
            case 'Grandma': return <Heart size={size} />;
            case 'Gordon': return <Flame size={size} />;
            case 'Robot': return <Bot size={size} />;
            default: return <ChefHat size={size} />;
        }
    }

    const startLiveSession = async (personaOverride?: ChefPersonality) => {
        setIsLiveLoading(true);
        setErrorMessage('');

        try {
            // Validate API key (using Vite environment variable)
            const apiKey = import.meta.env.VITE_API_KEY;
            if (!apiKey) {
                setErrorMessage("API key not configured. Please set up your VITE_API_KEY in the .env file.");
                setIsLiveLoading(false);
                return;
            }

            // Create audio context for capturing microphone
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000 // Input should be 16kHz
            });
            await audioContextRef.current.resume();

            // Get microphone stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create the live session
            sessionRef.current = new GeminiLiveSession(apiKey, {
                onOpen: () => {
                    console.log('Session opened successfully');
                    setIsLiveConnected(true);
                    setIsLiveLoading(false);

                    // Setup audio processing
                    if (audioContextRef.current) {
                        const source = audioContextRef.current.createMediaStreamSource(stream);
                        audioStreamRef.current = source;

                        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        processorRef.current = processor;

                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);

                            // Calculate volume for visual feedback
                            let sum = 0;
                            for (let i = 0; i < inputData.length; i++) {
                                sum += inputData[i] * inputData[i];
                            }
                            const rms = Math.sqrt(sum / inputData.length);
                            setVolume(Math.min(100, rms * 500));

                            // Send audio to session
                            if (sessionRef.current) {
                                sessionRef.current.sendAudio(inputData);
                            }
                        };

                        source.connect(processor);
                        processor.connect(audioContextRef.current.destination);
                    }

                    // Start video if enabled
                    if (isVideoEnabled) {
                        startVideoLoop();
                    }
                },
                onMessage: (msg) => {
                    console.log('Received message:', msg);
                },
                onError: (error) => {
                    console.error('Session error:', error);
                    setErrorMessage('Connection error. Please try again.');
                    setIsLiveConnected(false);
                    setIsLiveLoading(false);
                },
                onClose: () => {
                    console.log('Session closed');
                    setIsLiveConnected(false);
                    stopVideoLoop();
                }
            });

            await sessionRef.current.connect();

        } catch (e: any) {
            console.error('Failed to start session:', e);
            setErrorMessage(e.message || "Could not start voice session. Check microphone permissions.");
            setIsLiveLoading(false);
        }
    };

    const startVideoLoop = () => {
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
                    // For now, we'll skip video sending as it needs proper implementation
                    // const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
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
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
                videoStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                setIsVideoEnabled(true);
                if (isLiveConnected) startVideoLoop();
            } catch (e) {
                setErrorMessage("Could not access camera.");
            }
        }
    };

    const switchCamera = async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);

        if (isVideoEnabled) {
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(track => track.stop());
            }
            stopVideoLoop();

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode } });
                videoStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                if (isLiveConnected) startVideoLoop();
            } catch (e) {
                console.error("Failed to switch camera", e);
                setIsVideoEnabled(false);
            }
        }
    };

    const stopLiveSession = async () => {
        // Stop audio processing
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.disconnect();
            audioStreamRef.current = null;
        }
        if (audioContextRef.current) {
            try {
                await audioContextRef.current.close();
            } catch (e) {
                console.error("Error closing audio context:", e);
            }
            audioContextRef.current = null;
        }

        // Stop video
        stopVideoLoop();
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
            videoStreamRef.current = null;
        }

        // Close session
        if (sessionRef.current) {
            sessionRef.current.disconnect();
            sessionRef.current = null;
        }

        setIsLiveConnected(false);
    };

    const handlePersonalityChange = (p: ChefPersonality) => {
        const wasConnected = isLiveConnected;
        setPersonality(p);
        setShowPersonaSelector(false);

        if (wasConnected) {
            stopLiveSession();
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
                    {errorMessage && (
                        <div className="bg-red-900/50 backdrop-blur-md text-red-200 px-4 py-2 rounded-lg mb-4 max-w-md">
                            {errorMessage}
                        </div>
                    )}

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
                                <div
                                    className="absolute inset-0 rounded-full border-2 border-emerald-500/30 transition-all duration-75"
                                    style={{ transform: `scale(${1 + volume / 50})`, opacity: 0.5 + volume / 200 }}
                                />
                                {getPersonaIcon(personality, 64)}
                            </div>
                            <p className="text-2xl font-light text-white/80">"I'm listening..."</p>
                            <div className="w-48 h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-75"
                                    style={{ width: `${volume}%` }}
                                />
                            </div>
                            <p className="text-sm text-emerald-400 mt-2 font-medium uppercase tracking-wide border border-emerald-500/30 px-3 py-1 rounded-full bg-emerald-500/10">
                                {personality} Mode Active
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center gap-6 pb-8">
                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-all ${isVideoEnabled ? 'bg-white text-slate-900' : 'bg-black/40 text-white border border-white/20 hover:bg-white/10'
                            }`}
                    >
                        {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>

                    {isVideoEnabled && (
                        <button
                            onClick={switchCamera}
                            className="p-4 rounded-full bg-black/40 text-white border border-white/20 hover:bg-white/10 transition-all"
                        >
                            <RefreshCcw size={24} />
                        </button>
                    )}

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