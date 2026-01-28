// Gemini Live API Service - Proper SDK Implementation
// Using @google/genai with native Live API support
// January 2026 - Using latest native audio model for real-time conversations

import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

export interface LiveSessionConfig {
    onOpen?: () => void;
    onMessage?: (message: LiveServerMessage) => void;
    onError?: (error: any) => void;
    onClose?: () => void;
    voiceName?: string;
    systemInstruction?: string;
}

export class GeminiLiveSession {
    private session: any = null;
    private outputAudioContext: AudioContext | null = null;
    private nextStartTime = 0;
    private ai: GoogleGenAI;

    constructor(
        apiKey: string,
        private config: LiveSessionConfig
    ) {
        this.ai = new GoogleGenAI({ apiKey });
    }

    async connect() {
        try {
            // Create audio context for playback (24kHz output)
            this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000
            });
            await this.outputAudioContext.resume();

            // Connect to Live API using SDK's built-in method
            this.session = await this.ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        console.log('✅ Live API Session Opened');
                        this.config.onOpen?.();
                        // Send a hello message to start the conversation
                        this.sendText("Hello! I'm ready to cook.");
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle audio response
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            await this.playAudio(audioData);
                        }
                        this.config.onMessage?.(msg);
                    },
                    onclose: () => {
                        console.log('Live API Session Closed');
                        this.cleanup();
                        this.config.onClose?.();
                    },
                    onerror: (err: any) => {
                        console.error('❌ Live API Error:', err);
                        this.config.onError?.(err);
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: this.config.voiceName || 'Aoede'
                            }
                        }
                    },
                    systemInstruction: this.config.systemInstruction ||
                        "You are a helpful AI assistant. Be concise and natural in conversation."
                }
            });

            return this.session;

        } catch (error) {
            console.error('Failed to connect to Live API:', error);
            throw error;
        }
    }

    // Convert Float32Array audio to base64 PCM for sending
    private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);
        let offset = 0;
        for (let i = 0; i < float32Array.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return buffer;
    }

    private base64EncodeAudio(float32Array: Float32Array): string {
        const arrayBuffer = this.floatTo16BitPCM(float32Array);
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    sendAudio(audioData: Float32Array) {
        if (!this.session) {
            // console.warn('Session not ready');
            return;
        }

        const base64Data = this.base64EncodeAudio(audioData);

        try {
            if (typeof this.session.sendRealtimeInput === 'function') {
                this.session.sendRealtimeInput({
                    mediaChunks: [{
                        mimeType: 'audio/pcm;rate=16000', // Input is 16kHz
                        data: base64Data
                    }]
                });
            }
        } catch (error) {
            console.error('❌ Error sending audio:', error);
        }
    }

    sendText(text: string) {
        if (!this.session) return;
        try {
            if (typeof this.session.sendClientContent === 'function') {
                this.session.sendClientContent({
                    turns: [{
                        role: 'user',
                        parts: [{ text }]
                    }],
                    turnComplete: true
                });
            }
        } catch (error) {
            console.error('Error sending text:', error);
        }
    }

    sendImage(base64Image: string) {
        if (!this.session) return;

        try {
            if (typeof this.session.sendRealtimeInput === 'function') {
                this.session.sendRealtimeInput({
                    mediaChunks: [{
                        mimeType: 'image/jpeg',
                        data: base64Image
                    }]
                });
            }
        } catch (error) {
            console.error('Error sending image:', error);
        }
    }

    private async playAudio(base64Data: string) {
        if (!this.outputAudioContext) return;

        try {
            // Decode base64 to audio
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Convert 16-bit PCM to Float32
            const int16Array = new Int16Array(bytes.buffer);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768;
            }

            // Create and play audio buffer
            const audioBuffer = this.outputAudioContext.createBuffer(1, float32Array.length, 24000);
            audioBuffer.getChannelData(0).set(float32Array);

            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputAudioContext.destination);

            // Schedule playback to avoid overlapping
            const currentTime = this.outputAudioContext.currentTime;
            if (this.nextStartTime < currentTime) {
                this.nextStartTime = currentTime;
            }
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    async disconnect() {
        if (this.session) {
            this.session = null;
        }
        await this.cleanup();
    }

    private async cleanup() {
        if (this.outputAudioContext) {
            try {
                await this.outputAudioContext.close();
            } catch (e) {
                console.error('Error closing audio context:', e);
            }
            this.outputAudioContext = null;
        }
        this.nextStartTime = 0;
        this.session = null;
    }
}

// Helper class for recording audio at 16kHz
export class AudioRecorder {
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    private input: MediaStreamAudioSourceNode | null = null;

    constructor(private onAudioData: (data: Float32Array) => void) { }

    async start() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000
            });

            this.input = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Use ScriptProcessor for broad compatibility (AudioWorklet is better but requires separate file)
            // Buffer size 4096 gives ~250ms latency, 2048 ~128ms. 
            // We want low latency but stable.
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Clone the data to avoid race conditions
                this.onAudioData(new Float32Array(inputData));
            };

            this.input.connect(this.processor);
            this.processor.connect(this.audioContext.destination); // Needed for Chrome to activate

        } catch (error) {
            console.error("Error starting audio recorder:", error);
            throw error;
        }
    }

    stop() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.input) {
            this.input.disconnect();
            this.input = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

export async function createLiveSession(
    apiKey: string,
    config: LiveSessionConfig
): Promise<GeminiLiveSession> {
    const session = new GeminiLiveSession(apiKey, config);
    await session.connect();
    return session;
}