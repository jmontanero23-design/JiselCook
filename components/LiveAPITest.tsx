import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

export const LiveAPITest: React.FC = () => {
    const [status, setStatus] = useState<string>('Not started');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const testLiveAPI = async () => {
        setStatus('Testing...');
        setLogs([]);

        try {
            // Step 1: Check API Key
            const apiKey = import.meta.env.VITE_API_KEY;
            if (!apiKey) {
                addLog('❌ ERROR: No API key found in environment variables');
                setStatus('Failed: No API key');
                return;
            }
            addLog('✅ API key found');

            // Step 2: Initialize SDK
            addLog('Initializing Google GenAI SDK...');
            const ai = new GoogleGenAI({ apiKey });
            addLog('✅ SDK initialized');

            // Step 3: Test Live API connection
            addLog('Attempting to connect to Live API...');

            const session = await ai.live.connect({
                model: 'gemini-2.0-flash-exp',
                callbacks: {
                    onopen: () => {
                        addLog('✅ Live API Session Opened Successfully!');
                        setStatus('Connected!');
                    },
                    onmessage: (msg) => {
                        addLog(`📨 Received message: ${JSON.stringify(msg).substring(0, 100)}...`);
                    },
                    onerror: (err) => {
                        addLog(`❌ Live API Error: ${err.message || err}`);
                        setStatus('Error');
                    },
                    onclose: () => {
                        addLog('Session closed');
                        setStatus('Closed');
                    }
                }
            });

            addLog('✅ Session created successfully');

            // Test sending a simple text message
            setTimeout(() => {
                addLog('Sending test message...');
                try {
                    const currentSession = session as any;
                    console.log('Session object:', currentSession);
                    console.log('Session keys:', Object.keys(currentSession));
                    console.log('Session prototype:', Object.getPrototypeOf(currentSession));

                    if (typeof currentSession.send === 'function') {
                        currentSession.send({
                            clientContent: {
                                turns: [{
                                    role: 'user',
                                    parts: [{ text: 'Hello, can you hear me?' }]
                                }],
                                turnComplete: true
                            }
                        });
                        addLog('✅ Message sent');
                    } else {
                        addLog('⚠️ No send method found on session');
                    }
                } catch (e: any) {
                    addLog(`❌ Error sending test message: ${e.message}`);
                }
            }, 1000);

        } catch (error: any) {
            addLog(`❌ CRITICAL ERROR: ${error.message || error}`);
            addLog(`Full error: ${JSON.stringify(error)}`);
            setStatus('Failed');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
                <h2 className="text-2xl font-bold mb-4">Live API Test</h2>

                <div className="mb-4">
                    <p className="text-lg">Status: <span className={
                        status === 'Connected!' ? 'text-green-600 font-bold' :
                            status.includes('Failed') ? 'text-red-600 font-bold' :
                                'text-blue-600'
                    }>{status}</span></p>
                </div>

                <button
                    onClick={testLiveAPI}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
                >
                    Test Live API Connection
                </button>

                <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Console Logs:</h3>
                    <div className="space-y-1 text-sm font-mono">
                        {logs.length === 0 ? (
                            <p className="text-gray-500">No logs yet. Click the test button.</p>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className={
                                    log.includes('✅') ? 'text-green-700' :
                                        log.includes('❌') ? 'text-red-700' :
                                            log.includes('⚠️') ? 'text-yellow-700' :
                                                'text-gray-700'
                                }>
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <button
                    onClick={() => {
                        const testComponent = document.getElementById('live-api-test');
                        if (testComponent) {
                            testComponent.style.display = 'none';
                        }
                    }}
                    className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Close
                </button>
            </div>
        </div>
    );
};