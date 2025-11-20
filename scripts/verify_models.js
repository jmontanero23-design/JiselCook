import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        // 1. Read API Key from .env
        const envPath = path.resolve(__dirname, '../.env');
        if (!fs.existsSync(envPath)) {
            console.error('❌ .env file not found at', envPath);
            process.exit(1);
        }

        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/VITE_API_KEY=(.*)/);

        if (!match || !match[1]) {
            console.error('❌ VITE_API_KEY not found in .env');
            process.exit(1);
        }

        const apiKey = match[1].trim();
        console.log('🔑 Found API Key:', apiKey.substring(0, 8) + '...');

        // 2. Initialize SDK
        const ai = new GoogleGenAI({ apiKey });

        // 3. List Models
        console.log('📡 Fetching available models...');
        const response = await ai.models.list();

        console.log('\n✅ Available Models:');
        console.log('-------------------');

        let models = [];
        // The SDK response for list() is often an AsyncIterable
        try {
            for await (const model of response) {
                models.push(model);
                console.log(`- ${model.name} (${model.displayName || 'No Display Name'})`);
            }
        } catch (iterError) {
            console.log('DEBUG: Iteration failed:', iterError.message);
            console.log('DEBUG: Dumping raw response keys:', Object.keys(response));
        }

        if (models.length === 0) {
            console.log('DEBUG: No models found via iteration.');
        }

        console.log('-------------------');

        // 4. Check for specific targets
        const targets = [
            'gemini-3.0-pro',
            'gemini-2.5-flash',
            'gemini-2.5-flash-image',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash'
        ];

        console.log('\n🎯 Target Check:');
        targets.forEach(target => {
            const found = models.some(m => m.name && m.name.includes(target));
            console.log(`${found ? '✅' : '❌'} ${target}: ${found ? 'AVAILABLE' : 'NOT FOUND'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        if (error.response) {
            console.error('❌ Error Response:', JSON.stringify(error.response, null, 2));
        }
    }
}

main();
