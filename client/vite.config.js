import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/cad': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
      // NOTE: no /ws proxy needed — pathless WS: the WS gateway (wsHub)
      // attaches to the HTTP server root, so SocketContext connects to
      // ws(s)://host directly (VITE_WS_URL > VITE_API_URL > location.host).
    }
  }
});
