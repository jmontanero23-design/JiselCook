import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Loader2, Image as ImageIcon, Sparkles, ScanLine, RefreshCcw } from 'lucide-react';

interface CameraCaptureProps {
  onImageCaptured: (file: File) => void;
  onSurpriseMe: () => void;
  isLoading: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageCaptured, onSurpriseMe, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup stream on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch (e) {
      console.error("Error accessing camera:", e);
      alert("Could not access camera. Please try uploading an image instead.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            onImageCaptured(file);
            // Stop camera after capture
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              setIsCameraOpen(false);
            }
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageCaptured(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageCaptured(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-xl w-full text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          What's in your fridge?
        </h1>
        <p className="text-lg text-slate-600">
          Scan your ingredients live or upload a photo to let AI become your sous-chef.
        </p>
      </div>

      <div
        className={`w-full max-w-xl aspect-[4/3] rounded-3xl border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center bg-white relative overflow-hidden shadow-sm ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {isLoading ? (
          <div className="flex flex-col items-center space-y-4 animate-pulse z-20">
            <Loader2 size={64} className="text-emerald-500 animate-spin" />
            <p className="text-slate-500 font-medium">Identifying ingredients...</p>
          </div>
        ) : isCameraOpen ? (
          <div className="absolute inset-0 bg-black flex flex-col">
            <video ref={videoRef} className="flex-1 w-full h-full object-cover" playsInline muted />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
              <button
                onClick={() => {
                  if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
                  setIsCameraOpen(false);
                }}
                className="px-4 py-2 bg-black/50 text-white rounded-full text-sm backdrop-blur-md"
              >
                Cancel
              </button>
              <button
                onClick={switchCamera}
                className="px-4 py-2 bg-black/50 text-white rounded-full text-sm backdrop-blur-md flex items-center gap-2"
              >
                <RefreshCcw size={16} />
                <span>Flip</span>
              </button>
              <button
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full border-4 border-emerald-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-full" />
              </button>
            </div>
            <div className="absolute top-4 left-4 right-4 pointer-events-none">
              <div className="border-2 border-white/30 rounded-xl h-48 w-full flex items-center justify-center">
                <p className="text-white/70 text-sm font-bold bg-black/20 px-2 rounded">Align ingredients here</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center space-y-6 z-10">
              <div className="flex gap-4">
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-colors w-32 h-32 justify-center border-2 border-emerald-100"
                >
                  <ScanLine size={32} />
                  <span className="font-bold text-sm">Live Scan</span>
                </button>
                <button
                  onClick={triggerUpload}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors w-32 h-32 justify-center border-2 border-slate-100"
                >
                  <Upload size={32} />
                  <span className="font-bold text-sm">Upload File</span>
                </button>
              </div>
              <p className="text-sm text-slate-400">
                Drag & drop supported
              </p>
            </div>

            {/* Decorative Background Icons */}
            <ImageIcon className="absolute top-10 left-10 text-slate-100 transform -rotate-12" size={120} />
            <ImageIcon className="absolute bottom-10 right-10 text-slate-100 transform rotate-12" size={120} />
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center space-y-4">
        <button
          onClick={onSurpriseMe}
          className="w-full max-w-xl text-white font-bold flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1"
        >
          <Sparkles size={24} className="text-yellow-300" />
          <span className="text-lg">Chef's Special: Surprise Me!</span>
        </button>
        <p className="text-slate-400 text-xs">
          Generates a unique recipe based on your profile without scanning
        </p>
      </div>
    </div>
  );
};