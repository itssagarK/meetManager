import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Exposes the dev server to your local network for your phone!
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
