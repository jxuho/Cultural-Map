import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'leaflet-vendor': [
            'leaflet',
            'react-leaflet',
            'leaflet.markercluster',
          ],
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['zustand'],
        },
      },
    },
  },
});
