import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
    },
  },

  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Larger chunk warning threshold (default is 500kb, fine for a game)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Content-hashed filenames for immutable caching
        entryFileNames:  'assets/[name]-[hash].js',
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
        // Manual chunk splitting for vendor libs (react, react-dom, react-router)
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
        },
      },
    },
  },
});
