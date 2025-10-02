import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    assetsDir: 'assets',
    cssCodeSplit: true,
    rollupOptions: {
      external: ['sqlite3'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: './'
});