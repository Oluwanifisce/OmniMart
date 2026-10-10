import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files so we can read vars inside vite.config.js itself
  const env = loadEnv(mode, process.cwd(), '')

  // Backend target for the local dev proxy
  // Override with VITE_API_TARGET=https://your-api.com in .env for staging
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: 5173,
      proxy: {
        // All /api requests → Express backend
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})

