import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite()
  ],
  server: {
    host: true,
    port: 3000,
    watch: {
      usePolling: true
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})