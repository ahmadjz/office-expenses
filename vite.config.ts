import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8090', ws: true },
      '/_': 'http://127.0.0.1:8090',
    },
  },
  test: {
    environment: 'node',
  },
})
