// Gemini Live API Service - Proper SDK Implementation
// Using @google/genai v1.30.0 with native Live API support
// November 2025 - Using gemini-2.0-flash-exp model for best audio quality and natural conversations

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
    private audioContext: AudioContext | null = null;
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
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000
            });
            await this.audioContext.resume();

            // Connect to Live API using SDK's built-in method
            this.session = await this.ai.live.connect({
                model: 'gemini-2.0-flash-exp',
                callbacks: {
                    onopen: () => {
                        console.log('✅ Live API Session Opened');
                        this.config.onOpen?.();
                        // Send a hello message to start the conversation
                        this.sendText("Hello! I'm ready to cook.");
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // console.log('📨 Received message from Live API:', msg);
                        // Handle audio response
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            // console.log('🔊 Playing audio response');
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
            console.warn('Session not ready');
            return;
        }

        const base64Data = this.base64EncodeAudio(audioData);

        try {
            // Use the correct method name for the SDK
            if (typeof this.session.send === 'function') {
                this.session.send({
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: 'audio/pcm;rate=24000',
                            data: base64Data
                        }]
                    }
                });
            } else {
                console.error('❌ No valid send method found on session');
            }
        } catch (error) {
            console.error('❌ Error sending audio:', error);
        }
    }

    sendText(text: string) {
        if (!this.session) return;
        try {
            if (typeof this.session.send === 'function') {
                this.session.send({
                    clientContent: {
                        turns: [{
                            role: 'user',
                            parts: [{ text }]
                        }],
                        turnComplete: true
                    }
                });
            }
        } catch (error) {
            console.error('Error sending text:', error);
        }
    }

    sendImage(base64Image: string) {
        if (!this.session) {
            console.warn('Session not ready');
            return;
        }

        try {
            if (typeof this.session.send === 'function') {
                this.session.send({
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }]
                    }
                });
            }
        } catch (error) {
            console.error('Error sending image:', error);
        }
    }

    private async playAudio(base64Data: string) {
        if (!this.audioContext) return;

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
            const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
            audioBuffer.getChannelData(0).set(float32Array);

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            // Schedule playback to avoid overlapping
            const currentTime = this.audioContext.currentTime;
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
            try {
                // The SDK's session doesn't have a disconnect method,
                // but we can stop sending/receiving
                this.session = null;
            } catch (e) {
                console.error('Error disconnecting:', e);
            }
        }
        await this.cleanup();
    }

    private async cleanup() {
        if (this.audioContext) {
            try {
                await this.audioContext.close();
            } catch (e) {
                console.error('Error closing audio context:', e);
            }
            this.audioContext = null;
        }
        this.nextStartTime = 0;
        this.session = null;
    }
}

// Helper function to create a simplified Live API session
export async function createLiveSession(
    apiKey: string,
    config: LiveSessionConfig
): Promise<GeminiLiveSession> {
    const session = new GeminiLiveSession(apiKey, config);
    await session.connect();
    return session;
}