import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  // Dev: proxy /api to the local backend so the web always calls a
  // same-origin /api/... path. Keeps the httpOnly session cookie first-party
  // in dev exactly as it is in production (where Express serves both).
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
  preview: {
    host: true,
    port: 8080,
    strictPort: true,
    allowedHosts: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  },
});
