import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * CONFIGURAÇÃO VITE PARA SQUARE CLOUD
 * 
 * Build otimizado para produção na Square Cloud
 * Proxy configurado para desenvolvimento local
 */
export default defineConfig({
  plugins: [react()],
  
  // Configurações de desenvolvimento
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  
  // Configurações de build para Square Cloud
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['sqlite3'], // Excluir SQLite do bundle frontend
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react']
        }
      }
    }
  },
  
  // Otimizações
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  },
  
  // Preview (para testes locais)
  preview: {
    port: 4173,
    host: true
  }
});