// Gemini Live API WebSocket Implementation
// Based on November 2025 Live API documentation

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private nextStartTime = 0;

  constructor(
    private apiKey: string,
    private callbacks: {
      onOpen?: () => void;
      onMessage?: (message: any) => void;
      onError?: (error: any) => void;
      onClose?: () => void;
    }
  ) {}

  async connect() {
    try {
      // Create WebSocket connection to Gemini Live API
      // Using the correct endpoint for Live API
      const wsUrl = `wss://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${this.apiKey}`;

      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      // Setup audio context for playback
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000 // Output is 24kHz
      });
      await this.audioContext.resume();

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to Gemini Live API');

        // Send initial configuration
        this.send({
          setup: {
            model: 'gemini-2.0-flash-exp',
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Aoede' // Default voice
                  }
                }
              }
            }
          }
        });

        this.callbacks.onOpen?.();
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle audio response
          if (data.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
            const audioData = data.serverContent.modelTurn.parts[0].inlineData.data;
            await this.playAudio(audioData);
          }

          this.callbacks.onMessage?.(data);
        } catch (e) {
          console.error('Error processing message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.callbacks.onError?.(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.cleanup();
        this.callbacks.onClose?.();
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  sendAudio(audioData: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not ready');
      return;
    }

    // Convert Float32 to Int16 PCM for sending (16kHz input expected)
    const int16Data = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Convert to base64
    const uint8 = new Uint8Array(int16Data.buffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = window.btoa(binary);

    this.send({
      realtimeInput: {
        mediaChunks: [{
          mimeType: 'audio/pcm;rate=16000',
          data: base64
        }]
      }
    });
  }

  sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.send({
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }]
      }
    });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private async playAudio(base64Data: string) {
    if (!this.audioContext) return;

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

    const currentTime = this.audioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
  }
}