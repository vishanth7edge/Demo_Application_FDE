import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The API (server/) runs as a separate process; both the dev server and `vite preview`
// proxy /api to it so the browser only ever talks to one origin.
const apiTarget = `http://127.0.0.1:${process.env.API_PORT ?? '4000'}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': apiTarget },
  },
  preview: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': apiTarget },
  },
})
