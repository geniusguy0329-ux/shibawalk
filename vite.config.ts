import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    define: {
      // Use empty string as fallback if VITE_API_KEY is missing during build
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || "")
    }
  };
});