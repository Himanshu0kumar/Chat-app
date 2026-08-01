import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    watch: {
      ignored: ['**/server/**'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3001',
        ws: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Ignore normal client disconnect & reset errors on tab close
            if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.code === 'EPIPE') {
              return;
            }
            console.error('Socket.IO proxy error:', err);
          });
        },
      },
    },
  },
});
