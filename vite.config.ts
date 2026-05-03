import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 8282,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8383',
          changeOrigin: true,
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: ['**/data/**'],
      },
    },
    preview: {
      port: 8282,
      host: true,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8383',
          changeOrigin: true,
        }
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
  };
});
