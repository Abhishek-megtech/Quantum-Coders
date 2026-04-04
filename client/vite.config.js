import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      }
    }
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      'three', '@react-three/fiber', '@react-three/drei',
      'zustand', 'framer-motion', 'axios',
      'recharts', 'date-fns', 'react-hot-toast',
    ],
    exclude: ['@deck.gl/react', '@deck.gl/layers'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          deck: ['@deck.gl/react', '@deck.gl/layers'],
        }
      }
    }
  },
  define: {
    'process.env': {}
  }
})
