import React, { useState, useRef } from 'react';
import { ShoppingCart, Plus, Trash2, Sparkles, Loader2, Layers, Mic, Square } from 'lucide-react';
import { organizeShoppingList, processShoppingVoiceCommand } from '../services/geminiService';
import { ShoppingCategory } from '../types';

interface ShoppingListProps {
    items: string[];
    onAddItem: (item: string) => void;
    onRemoveItem: (index: number) => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ items, onAddItem, onRemoveItem }) => {
    const [newItemName, setNewItemName] = useState("");
    const [isOrganizing, setIsOrganizing] = useState(false);
    const [organizedList, setOrganizedList] = useState<ShoppingCategory[] | null>(null);

    // Voice Command State
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const handleManualAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemName.trim()) {
            onAddItem(newItemName.trim());
            setNewItemName("");
            setOrganizedList(null);
        }
    };

    const handleOrganize = async () => {
        if (items.length === 0) return;
        setIsOrganizing(true);
        try {
            const organized = await organizeShoppingList(items);
            if (organized) {
                setOrganizedList(organized.categories);
            }
        } catch (e) {
            console.error(e);
            alert("Could not organize list.");
        } finally {
            setIsOrganizing(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                await handleVoiceProcessing(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
        } catch (e) {
            console.error("Error accessing microphone:", e);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessingVoice(true);
        }
    };

    const handleVoiceProcessing = async (audioBlob: Blob) => {
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                // Determine mimetype based on browser output, usually webm for MediaRecorder
                const mimeType = audioBlob.type || 'audio/webm';

                const commands = await processShoppingVoiceCommand(base64Audio, mimeType);

                commands.forEach(cmd => {
                    if (cmd.action === 'add') {
                        onAddItem(cmd.item);
                    } else if (cmd.action === 'remove') {
                        // Find index case-insensitively
                        const idx = items.findIndex(i => i.toLowerCase() === cmd.item.toLowerCase());
                        if (idx !== -1) {
                            onRemoveItem(idx);
                        }
                    }
                });

                // Reset organized list if changes occurred
                if (commands.length > 0) {
                    setOrganizedList(null);
                }
            };
            reader.readAsDataURL(audioBlob);
        } catch (error) {
            console.error("Voice processing error:", error);
            alert("Failed to process voice command.");
        } finally {
            setIsProcessingVoice(false);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <ShoppingCart className="text-emerald-600" size={32} />
                    Shopping List
                </h2>
                <div className="flex gap-3">
                    {items.length > 0 && (
                        <button
                            onClick={handleOrganize}
                            disabled={isOrganizing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${organizedList
                                    ? 'bg-indigo-100 text-indigo-700 cursor-default'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
                                }`}
                        >
                            {isOrganizing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            <span>{organizedList ? 'Organized by AI' : 'Smart Organize'}</span>
                        </button>
                    )}
                    <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-2 rounded-xl">
                        {items.length} items
                    </span>
                </div>
            </div>

            <div className="flex gap-2 mb-6">
                <form onSubmit={handleManualAddItem} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Add item manually..."
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl transition-colors">
                        <Plus size={24} />
                    </button>
                </form>

                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessingVoice}
                    className={`px-4 rounded-xl transition-all flex items-center justify-center ${isRecording
                            ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg'
                            : isProcessingVoice
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 shadow-sm'
                        }`}
                    title="Voice Commands: 'Add milk', 'Remove eggs'"
                >
                    {isProcessingVoice ? (
                        <Loader2 className="animate-spin" size={24} />
                    ) : isRecording ? (
                        <Square size={24} fill="currentColor" />
                    ) : (
                        <Mic size={24} />
                    )}
                </button>
            </div>

            {/* Voice Interaction Hint */}
            <div className="mb-6 px-2">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Mic size={12} />
                    <span>Tip: Press mic and say "Add tomatoes and basil" or "Remove bread"</span>
                </p>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400">Your list is empty. Add missing ingredients from recipes!</p>
                </div>
            ) : (
                <>
                    {organizedList ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {organizedList.map((cat, catIdx) => (
                                <div key={catIdx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                        <Layers size={16} className="text-slate-400" />
                                        <h3 className="font-bold text-slate-700">{cat.category}</h3>
                                    </div>
                                    <ul className="divide-y divide-slate-50">
                                        {cat.items.map((item, itemIdx) => {
                                            // Find original index for removal
                                            const originalIndex = items.indexOf(item);
                                            return (
                                                <li key={itemIdx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                                    <span className="font-medium text-slate-700">{item}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (originalIndex !== -1) onRemoveItem(originalIndex);
                                                            setOrganizedList(null);
                                                        }}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                            <button
                                onClick={() => setOrganizedList(null)}
                                className="w-full py-3 text-slate-400 hover:text-slate-600 text-sm font-medium"
                            >
                                Revert to simple list
                            </button>
                        </div>
                    ) : (
                        <ul className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <li key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <span className="font-medium text-slate-700">{item}</span>
                                    <button
                                        onClick={() => onRemoveItem(idx)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
};