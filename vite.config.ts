import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages/types/src': path.resolve(__dirname, './src/packages/types/src'),
      '@packages/types': path.resolve(__dirname, './src/packages/types/src'),
      '@packages/config/src/events': path.resolve(__dirname, './src/packages/config/src/events'),
      '@packages/config': path.resolve(__dirname, './src/packages/config/src'),
      '@packages/utils/src/participant-id': path.resolve(__dirname, './src/packages/utils/src/participant-id'),
      '@packages/utils': path.resolve(__dirname, './src/packages/utils/src'),
    },
  },
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
