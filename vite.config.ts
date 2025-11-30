
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // SECURITY WARNING: In a production app, never expose API keys on the client.
      // Use a backend proxy. For this demo/prototype, we inject it here.
      'process.env.API_KEY': JSON.stringify("AIzaSyD2Ayjt322s0_BGqqyJu042SStDosNrzSQ"),
      'process.env': process.env
    },
    build: {
      outDir: 'dist',
    },
  };
});
