import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          charts: ['recharts'],
          'chart-math': ['lodash', 'recharts-scale'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
