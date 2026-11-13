import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// start.sh sets API_PROXY_TARGET (local backend or hosted backend). Defaults to local.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});