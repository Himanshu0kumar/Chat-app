import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: {
      ignored: ['**/server/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Ignore normal client disconnect, reset & initial connection refused errors while backend is starting
            if (
              err.code === 'ECONNABORTED' ||
              err.code === 'ECONNRESET' ||
              err.code === 'EPIPE' ||
              err.code === 'ECONNREFUSED'
            ) {
              return;
            }
            console.error('Socket.IO proxy error:', err);
          });
        },
      },
    },
  },
});
