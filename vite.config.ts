import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'http://localhost:3000' 
          : 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['sqlite3']
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
