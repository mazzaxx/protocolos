import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acesso de qualquer IP
    port: 5173,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 60000, // 60 segundos de timeout para uploads grandes
        proxyTimeout: 60000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (!req.url.includes('/health')) {
              console.log('📡 Proxy request:', req.method, req.url);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            if (!req.url.includes('/health')) {
              console.log('📡 Proxy response:', proxyRes.statusCode, req.url);
            }
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Para debug em produção
    chunkSizeWarningLimit: 1000, // Aumentar limite para chunks grandes
    rollupOptions: {
      external: ['sqlite3'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
