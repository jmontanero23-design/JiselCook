import React, { useState, useEffect, useRef } from 'react';
import { Recipe, ChefPersonality } from '../types';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, CheckCircle, Star, Send, Mic, MicOff, Loader2, Camera, UserCog, Heart, Flame, Bot, ChefHat, RefreshCcw } from 'lucide-react';
import { GeminiLiveSession, AudioRecorder } from '../services/liveApiService';

interface CookingModeProps {
    recipe: Recipe;
    onClose: () => void;
}


export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userReview, setUserReview] = useState('');
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Live API State
    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [isLiveLoading, setIsLiveLoading] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [personality, setPersonality] = useState<ChefPersonality>('Professional');
    const [showPersonaSelector, setShowPersonaSelector] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sessionRef = useRef<GeminiLiveSession | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const videoIntervalRef = useRef<number | null>(null);
    const [volume, setVolume] = useState(0);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            stopLiveSession();
        };
    }, []);

    useEffect(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, [currentStep]);

    const toggleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const text = recipe.steps[currentStep].instruction;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.onend = () => setIsSpeaking(false);
            speechRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    // --- Gemini Live Implementation ---

    const getPersonalityConfig = (p: ChefPersonality) => {
        switch (p) {
            case 'Grandma':
                return {
                    voice: 'Kore',
                    instruction: "You are a sweet, nurturing grandmother teaching your grandchild to cook. Call the user 'honey' or 'dear'. Use vague, comforting measurements like 'a pinch' or 'until it feels right'. Be extremely encouraging."
                };
            case 'Gordon':
                return {
                    voice: 'Fenrir',
                    instruction: "You are a strict, demanding, world-class chef like Gordon Ramsay. You demand perfection. Critically analyze what the user says. Be intense, loud, and use culinary jargon. If they mess up, scold them (without being offensive)."
                };
            case 'Robot':
                return {
                    voice: 'Charon',
                    instruction: "You are a futuristic cooking android. Speak in precise, analytical terms. Focus on exact temperatures, chemical reactions, and efficiency. Be emotionless but helpful."
                };
            default:
                return {
                    voice: 'Puck',
                    instruction: "You are a helpful, professional sous-chef assisting the user. Be concise, encouraging, and focus on clear cooking advice."
                };
        }
    }

    const getPersonaIcon = (p: ChefPersonality) => {
        switch (p) {
            case 'Grandma': return <Heart size={16} />;
            case 'Gordon': return <Flame size={16} />;
            case 'Robot': return <Bot size={16} />;
            default: return <ChefHat size={16} />;
        }
    }

    const startLiveSession = async (personaOverride?: ChefPersonality) => {
        setIsLiveLoading(true);
        try {
            // Validate API key - using Vite environment variable
            const apiKey = import.meta.env.VITE_API_KEY;
            if (!apiKey) {
                alert("API key not configured. Please set up your Gemini API key in the .env file as VITE_API_KEY.");
                setIsLiveLoading(false);
                return;
            }

            const currentPersona = personaOverride || personality;
            const personaConfig = getPersonalityConfig(currentPersona);

            // Create the live session using the new service
            sessionRef.current = new GeminiLiveSession(apiKey, {
                onOpen: () => {
                    console.log("Live Session Opened");
                    setIsLiveConnected(true);
                    setIsLiveLoading(false);

                    // Start Audio Recorder (16kHz)
                    recorderRef.current = new AudioRecorder((data) => {
                        // Calculate volume for visual feedback
                        let sum = 0;
                        for (let i = 0; i < data.length; i++) {
                            sum += data[i] * data[i];
                        }
                        const rms = Math.sqrt(sum / data.length);
                        setVolume(Math.min(100, rms * 500));

                        // Send to session
                        if (sessionRef.current) {
                            sessionRef.current.sendAudio(data);
                        }
                    });
                    recorderRef.current.start();

                    // Start Video Loop if enabled
                    if (isVideoEnabled) {
                        startVideoLoop();
                    }
                },
                onMessage: (msg) => {
                    // console.log('Received message:', msg);
                },
                onError: (error) => {
                    console.error("Live Session Error", error);
                    setIsLiveConnected(false);
                    setIsLiveLoading(false);
                    alert("Connection error. Please try again.");
                },
                onClose: () => {
                    console.log("Live Session Closed");
                    setIsLiveConnected(false);
                    stopVideoLoop();
                },
                voiceName: personaConfig.voice,
                systemInstruction: `${personaConfig.instruction}
                  Recipe: "${recipe.title}".
                  Current Step: "${recipe.steps[currentStep].instruction}".`
            });

            await sessionRef.current.connect();

        } catch (e: any) {
            console.error(e);
            setIsLiveLoading(false);
            alert(e.message || "Could not start voice session. Check microphone permissions.");
        }
    };

    const startVideoLoop = () => {
        if (!videoRef.current || !canvasRef.current || !sessionRef.current) return;

        videoIntervalRef.current = window.setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            if (video.videoWidth > 0 && video.videoHeight > 0 && sessionRef.current) {
                canvas.width = video.videoWidth / 4; // Scale down for performance
                canvas.height = video.videoHeight / 4;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

                    // Send image to session
                    sessionRef.current.sendImage(base64Data);
                }
            }
        }, 1000); // Send 1 frame per second
    };

    const stopVideoLoop = () => {
        if (videoIntervalRef.current) {
            clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = null;
        }
    };

    const toggleVideo = async () => {
        if (isVideoEnabled) {
            // Stop video
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(track => track.stop());
                videoStreamRef.current = null;
            }
            stopVideoLoop();
            setIsVideoEnabled(false);
            if (videoRef.current) videoRef.current.srcObject = null;
        } else {
            // Start video
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
                videoStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                setIsVideoEnabled(true);

                // If live session is already active, start sending frames
                if (isLiveConnected && sessionRef.current) {
                    startVideoLoop();
                }
            } catch (e) {
                console.error("Camera error", e);
                alert("Could not access camera.");
            }
        }
    };

    const switchCamera = async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);

        if (isVideoEnabled) {
            // Restart video with new mode
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
                if (isLiveConnected && sessionRef.current) startVideoLoop();
            } catch (e) {
                console.error("Failed to switch camera", e);
                setIsVideoEnabled(false);
            }
        }
    };

    const stopLiveSession = async () => {
        // Stop recorder
        if (recorderRef.current) {
            recorderRef.current.stop();
            recorderRef.current = null;
        }

        // Stop video processing
        stopVideoLoop();
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
            videoStreamRef.current = null;
        }

        // Disconnect session
        if (sessionRef.current) {
            await sessionRef.current.disconnect();
            sessionRef.current = null;
        }

        setIsLiveConnected(false);
        setVolume(0);
    };

    const toggleLive = () => {
        if (isLiveConnected) {
            stopLiveSession();
        } else {
            startLiveSession();
        }
    };

    const handlePersonalityChange = (p: ChefPersonality) => {
        const wasConnected = isLiveConnected;
        setPersonality(p);
        setShowPersonaSelector(false);

        if (wasConnected) {
            stopLiveSession().then(() => {
                // Small delay to allow cleanup before reconnecting with new persona
                setTimeout(() => startLiveSession(p), 200);
            });
        }
    };

    // --- End Live Implementation ---

    const nextStep = () => {
        if (currentStep < recipe.steps.length - 1) {
            setCurrentStep(c => c + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1);
        }
    };

    const handleFinish = () => {
        setShowReview(true);
    };

    const submitReview = () => {
        // In a real app, this would save to backend
        alert(`Thanks for your review!\nRating: ${userRating} Stars\nComment: ${userReview}`);
        onClose();
    };

    const progress = ((currentStep + 1) / recipe.steps.length) * 100;

    if (showReview) {
        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Bon Appétit!</h2>
                        <p className="text-slate-500">You've completed {recipe.title}</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">Rate this recipe</label>
                        <div className="flex justify-center space-x-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setUserRating(star)}
                                    className={`p-1 transition-transform hover:scale-110 ${star <= userRating ? 'text-amber-400' : 'text-slate-200'
                                        }`}
                                >
                                    <Star size={32} fill={star <= userRating ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                        <textarea
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                            placeholder="What did you think? (Optional)"
                            rows={3}
                            value={userReview}
                            onChange={(e) => setUserReview(e.target.value)}
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl"
                        >
                            Skip
                        </button>
                        <button
                            onClick={submitReview}
                            disabled={userRating === 0}
                            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <span>Submit</span>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-white">
                <div className="flex items-center space-x-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 hidden md:block">{recipe.title}</h2>
                        <p className="text-sm text-slate-500">Step {currentStep + 1} of {recipe.steps.length}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Personality Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPersonaSelector(!showPersonaSelector)}
                            className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-2"
                            title="Choose Chef Personality"
                        >
                            <UserCog size={20} />
                            <span className="hidden md:inline text-xs font-bold">{personality}</span>
                        </button>
                        {showPersonaSelector && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20 animate-in fade-in zoom-in duration-200">
                                <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Chef Persona</p>
                                {(['Professional', 'Grandma', 'Gordon', 'Robot'] as ChefPersonality[]).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => handlePersonalityChange(p)}
                                        className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 flex items-center gap-3 ${personality === p ? 'text-emerald-600 bg-emerald-50' : 'text-slate-700'}`}
                                    >
                                        {getPersonaIcon(p)}
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Camera Toggle */}
                    <button
                        onClick={toggleVideo}
                        className={`p-2 rounded-full transition-all ${isVideoEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                        title="Toggle Camera for AI Vision"
                    >
                        <Camera size={20} />
                    </button>

                    {/* Switch Camera */}
                    {isVideoEnabled && (
                        <button
                            onClick={switchCamera}
                            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                            title="Switch Camera"
                        >
                            <RefreshCcw size={20} />
                        </button>
                    )}

                    {/* Live Toggle */}
                    <button
                        onClick={toggleLive}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all ${isLiveConnected
                            ? 'bg-red-100 text-red-700 animate-pulse ring-2 ring-red-400'
                            : isLiveLoading ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {isLiveLoading ? <Loader2 className="animate-spin" size={20} /> : isLiveConnected ? <Mic size={20} /> : <MicOff size={20} />}
                        <span className="hidden sm:inline">
                            {isLiveLoading ? 'Connecting...' : isLiveConnected ? 'Live Chef' : 'Start Chef'}
                        </span>
                    </button>

                    {/* TTS Toggle */}
                    <button
                        onClick={toggleSpeech}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors ${isSpeaking ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {isSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        <span className="hidden sm:inline">{isSpeaking ? 'Reading' : 'Read'}</span>
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2">
                <div
                    className="bg-emerald-500 h-2 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Video Preview Layer */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden bg-black relative ${isVideoEnabled ? 'flex-1 max-h-[40vh]' : 'max-h-0'}`}>
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        AI Vision Active
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto w-full overflow-y-auto">
                    <div className="mb-8">
                        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold mb-6">
                            {currentStep + 1}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-slate-800 leading-tight">
                            {recipe.steps[currentStep].instruction}
                        </h1>
                    </div>

                    {isLiveConnected && (
                        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 max-w-lg animate-in slide-in-from-bottom-4 mx-auto">
                            <p className="font-semibold mb-1 flex items-center justify-center gap-2">
                                <Mic size={16} />
                                Listening ({personality} Mode)...
                            </p>
                            <p className="text-sm opacity-80">
                                {isVideoEnabled
                                    ? "I'm watching your cooking! Ask me: 'Does this look right?'"
                                    : "Ask me for tips, unit conversions, or timers."}
                            </p>
                            {/* Volume indicator */}
                            <div className="w-full h-1 bg-blue-200 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-75"
                                    style={{ width: `${volume}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Controls */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-2 px-6 py-4 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-lg"
                >
                    <ChevronLeft size={24} />
                    <span>Previous</span>
                </button>

                {currentStep === recipe.steps.length - 1 ? (
                    <button
                        onClick={handleFinish}
                        className="flex items-center space-x-2 px-8 py-4 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 font-bold hover:bg-emerald-700 transition-colors text-lg"
                    >
                        <CheckCircle size={24} />
                        <span>Finish Cooking</span>
                    </button>
                ) : (
                    <button
                        onClick={nextStep}
                        className="flex items-center space-x-2 px-8 py-4 rounded-xl bg-slate-900 text-white shadow-lg font-bold hover:bg-slate-800 transition-colors text-lg"
                    >
                        <span>Next Step</span>
                        <ChevronRight size={24} />
                    </button>
                )}
            </div>
        </div>
    );
};