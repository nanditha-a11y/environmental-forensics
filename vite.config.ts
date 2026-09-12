import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: ['call-convert-sensor-honest.trycloudflare.com'],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'maps';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});