import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite automatically exposes env variables that start with VITE_
  // Access them via import.meta.env.VITE_API_KEY
});