import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * CONFIGURAÇÃO VITE PARA SQUARE CLOUD
 * 
 * Configuração otimizada para desenvolvimento e build de produção.
 * Inclui proxy para desenvolvimento local e otimizações para Square Cloud.
 * 
 * HOSPEDAGEM SQUARE CLOUD:
 * - Build otimizado para produção
 * - Proxy configurado para desenvolvimento
 * - Exclusão de dependências server-side
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // SQUARE CLOUD: Permite acesso de qualquer IP
    port: 5173,
    proxy: {
      // SQUARE CLOUD: Proxy para desenvolvimento local
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[SQUARE CLOUD] proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[SQUARE CLOUD] Sending Request to Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[SQUARE CLOUD] Received Response from Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      // SQUARE CLOUD: Proxy para health check
      '/health': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  build: {
    outDir: 'dist', // SQUARE CLOUD: Diretório de build
    rollupOptions: {
      external: ['sqlite3'] // SQUARE CLOUD: Excluir SQLite do bundle frontend
    },
    // SQUARE CLOUD: Otimizações para produção
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    exclude: ['lucide-react'], // SQUARE CLOUD: Excluir da otimização
  },
  // SQUARE CLOUD: Configurações de preview
  preview: {
    port: 4173,
    host: true
  }
});
