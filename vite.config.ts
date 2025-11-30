import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify("AIzaSyD2Ayjt322s0_BGqqyJu042SStDosNrzSQ"),
      'process.env': process.env
    },
    build: {
      outDir: 'dist',
    },
  };
});