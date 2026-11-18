import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Send API calls to the Express server during development
    proxy: {
      '/api': 'http://localhost:4000',
      // Live messages use a websocket on the same server
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
