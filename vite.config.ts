import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  esbuild: {
    // Otimizações para build mais rápido
    target: 'es2020',
    minify: true,
  },
  server: {
    host: true, // Permite acesso de qualquer IP
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  build: {
    outDir: 'dist',
    // Otimizações para 4GB RAM
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false, // Desabilitar sourcemaps em produção para economizar espaço
    rollupOptions: {
      external: ['sqlite3'],
      output: {
        // Otimizar chunks para melhor performance
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lucide-react'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Configurações para usar mais RAM disponível
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs em produção
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom'],
    // Usar mais cache com mais RAM
    force: false,
  },
  // Cache mais agressivo com mais RAM
  cacheDir: 'node_modules/.vite',
});
